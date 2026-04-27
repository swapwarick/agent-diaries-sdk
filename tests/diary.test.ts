import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentDiary } from '../src/diary';
import { LocalFileStorage } from '../src/storage';
import * as fs from 'fs';
import * as path from 'path';

describe('Agent Diaries Core Logic', () => {
  const TEST_DIR = path.join(__dirname, '.test-diaries');
  let storage: LocalFileStorage<any>;

  beforeEach(() => {
    // Fresh isolated storage for each test run
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    storage = new LocalFileStorage({ baseDir: TEST_DIR });
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should normalize signatures correctly to catch variations', () => {
    const s1 = AgentDiary.normalizeSignature('  Download Q3 Report  ');
    const s2 = AgentDiary.normalizeSignature('download q3 report');
    const s3 = AgentDiary.normalizeSignature('DOWNLOAD   Q3 REPORT');

    expect(s1).toBe('download q3 report');
    expect(s1).toBe(s2);
    expect(s2).toBe(s3);
  });

  it('should remember processed tasks and prevent duplicates', async () => {
    const agent = new AgentDiary({ agentId: 'test-agent', storage });
    
    expect(await agent.hasProcessedTask('Task A')).toBe(false);
    expect(await agent.getTaskResult('Task A')).toBeUndefined();
    
    await agent.writeTaskResult('Task A', 'Success Output');
    
    expect(await agent.hasProcessedTask('Task A')).toBe(true);
    // Should catch case-insensitive variants
    expect(await agent.hasProcessedTask('TASK a')).toBe(true);
    
    // Should return the exact result string
    expect(await agent.getTaskResult('Task A')).toBe('Success Output');
    expect(await agent.getTaskResult('task A')).toBe('Success Output');
  });

  it('should accurately filter new tasks from a batch', async () => {
    const agent = new AgentDiary({ agentId: 'batch-agent', storage });
    await agent.writeTaskResult('Known Task 1', 'Success');
    await agent.writeTaskResult('Known Task 2', 'Success');

    const incomingTasks = [
      { title: 'Known Task 1' },
      { title: 'Brand New Task' },
      { title: 'known task 2' }, // Case variant
      { title: 'Another New Task' }
    ];

    const newTasks = await agent.filterNewTasks(incomingTasks);
    
    expect(newTasks).toHaveLength(2);
    expect(newTasks[0].title).toBe('Brand New Task');
    expect(newTasks[1].title).toBe('Another New Task');
  });

  it('multi-agent: should maintain isolated state across different agents', async () => {
    const agentAlpha = new AgentDiary({ agentId: 'alpha', storage });
    const agentBeta = new AgentDiary({ agentId: 'beta', storage });

    await agentAlpha.writeTaskResult('Shared Task', 'Result Alpha');

    // Alpha remembers it
    expect(await agentAlpha.hasProcessedTask('Shared Task')).toBe(true);
    
    // Beta is a different agent and shouldn't know about it
    expect(await agentBeta.hasProcessedTask('Shared Task')).toBe(false);

    // Alpha state counts
    const stateAlpha = await agentAlpha.readDiary();
    expect(stateAlpha.runCount).toBe(1);

    const stateBeta = await agentBeta.readDiary();
    expect(stateBeta.runCount).toBe(0);
  });

  it('load test: should adhere to maxHistory limits on high volume', async () => {
    const maxLimit = 10;
    const agent = new AgentDiary({ agentId: 'heavy-agent', storage, maxHistory: maxLimit });

    // Write 25 tasks
    for (let i = 0; i < 25; i++) {
      await agent.writeTaskResult(`Task ${i}`, `Result ${i}`);
    }

    const state = await agent.readDiary();
    
    // Total run count should track all executions accurately
    expect(state.runCount).toBe(25);
    
    // But the history and signatures should be capped to prevent unbounded memory growth
    expect(state.history).toHaveLength(maxLimit);
    expect(state.seenSignatures).toHaveLength(maxLimit);

    // Should only remember the LAST 10 tasks (Task 15 to Task 24)
    expect(await agent.hasProcessedTask('Task 24')).toBe(true); // latest
    expect(await agent.hasProcessedTask('Task 15')).toBe(true); // oldest in memory
    expect(await agent.hasProcessedTask('Task 14')).toBe(false); // evicted from memory
  });

  it('edge case: should handle empty or null task titles gracefully', async () => {
    // Tests line 48 in diary.ts
    const s1 = AgentDiary.normalizeSignature('');
    const s2 = AgentDiary.normalizeSignature(null as any);
    const s3 = AgentDiary.normalizeSignature(undefined as any);
    expect(s1).toBe('');
    expect(s2).toBe('');
    expect(s3).toBe('');
  });

  it('edge case: default storage initialization', () => {
    // Tests line 31 in diary.ts
    const agent = new AgentDiary({ agentId: 'default-storage-agent' });
    expect(agent).toBeDefined();
    // Clean up default storage dir created by this test
    const defaultDir = path.join(process.cwd(), '.agent-diaries');
    if (fs.existsSync(defaultDir)) {
      fs.rmSync(defaultDir, { recursive: true, force: true });
    }
  });

  it('storage edge case: creating base directory if it does not exist', () => {
    // Tests line 17 in storage.ts
    const newDir = path.join(__dirname, '.new-test-dir');
    if (fs.existsSync(newDir)) {
      fs.rmSync(newDir, { recursive: true, force: true });
    }
    const newStorage = new LocalFileStorage({ baseDir: newDir });
    expect(fs.existsSync(newDir)).toBe(true);
    fs.rmSync(newDir, { recursive: true, force: true });
  });

  it('storage edge case: handling corrupted JSON read', async () => {
    // Tests lines 36-37 in storage.ts
    const agent = new AgentDiary({ agentId: 'corrupt-agent', storage });
    await agent.writeTaskResult('Task 1', 'Success');
    
    const filePath = path.join(TEST_DIR, 'diary_corrupt-agent.json');
    fs.writeFileSync(filePath, '{ bad json ]');
    
    // Attempting to read should catch error and return empty state
    const state = await agent.readDiary();
    expect(state.runCount).toBe(0);
  });

  it('storage edge case: handling file write errors', async () => {
    // Tests lines 47-48 in storage.ts
    // To force a write error on all OSes, we create a file, then pass it as the baseDir.
    // writeFile will throw ENOTDIR when it tries to write inside a file.
    const fileAsDir = path.join(__dirname, '.file-as-dir');
    fs.writeFileSync(fileAsDir, 'not a dir');
    const invalidStorage = new LocalFileStorage({ baseDir: fileAsDir });
    
    let caughtError = false;
    try {
      await invalidStorage.set('test-key', { test: 1 } as any);
    } catch (e) {
      caughtError = true;
    }
    
    expect(caughtError).toBe(true);
    
    // Cleanup
    fs.rmSync(fileAsDir, { force: true });
  });
});
