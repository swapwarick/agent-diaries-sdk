<div align="center">
  <h1>🧠 Agent Diaries</h1>
  <p><strong>Give your autonomous AI agents a persistent memory.</strong></p>

  [![NPM Version](https://img.shields.io/npm/v/@swapwarick_n/agent-diaries?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/@swapwarick_n/agent-diaries)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Codecov](https://img.shields.io/codecov/c/github/swapwarick/agent-diaries-sdk?style=for-the-badge&logo=codecov)](https://codecov.io/gh/swapwarick/agent-diaries-sdk)
  [![CI Pipeline](https://img.shields.io/github/actions/workflow/status/swapwarick/agent-diaries-sdk/codecov.yml?style=for-the-badge&logo=github-actions&label=CI)](https://github.com/swapwarick/agent-diaries-sdk/actions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
</div>

<br />

**Agent Diaries** is a lightweight, zero-dependency local SDK that prevents your AI agents from getting stuck in loops. By providing a persistent "diary" memory, your agents can remember their past actions, avoid repetitive tasks, and reflect on their results over time.

---

## ✨ Features

- **🚫 Duplicate Prevention:** Automatically filter out tasks your agent has already processed across different sessions.
- **💾 Local-First Storage:** Operates entirely locally. Diary entries are stored as lightweight JSON files—no expensive cloud KV or Vector databases required.
- **⚡ Zero Dependencies:** Fast, secure, and built entirely with native Node.js APIs.
- **🔌 Highly Extensible:** Comes with an easy-to-use `StorageAdapter` interface so you can swap local files for SQLite, Redis, or anything else.
- **🛡️ 100% TypeScript:** Built-in type safety and excellent developer experience.

## 📦 Installation

Install the package via npm:

```bash
npm install @swapwarick_n/agent-diaries
```

## 🚀 Quick Start

Initialize an `AgentDiary` and start tracking your agent's tasks immediately.

```typescript
import { AgentDiary } from '@swapwarick_n/agent-diaries';

async function runAgent() {
  // 1. Initialize a diary for a specific agent persona
  const diary = new AgentDiary({ agentId: 'data-collector' });
  const currentTask = 'Download Q3 Financial Report';

  // 2. Check memory before executing
  const pastResult = await diary.getTaskResult(currentTask);
  
  if (pastResult) {
    console.log(`[Agent] ⏩ Skipping task: "${currentTask}". I remember doing this already!`);
    console.log(`[Agent] 💡 Previous Result: ${pastResult}`);
    return pastResult; // Reuse the old output instantly!
  }

  // 3. Execute your agent's logic
  console.log(`[Agent] ⚙️ Executing: "${currentTask}"...`);
  const result = "Found 2 warnings, no critical errors."; // Simulate work

  // 4. Update the diary
  await diary.writeTaskResult(currentTask, result);
  console.log(`[Agent] ✅ Task complete. Diary updated!`);
  return result;
}

runAgent();
```

## 🧠 How it Works

When you initialize an `AgentDiary`, it creates a `.agent-diaries` directory in your current working path. 
For every `agentId`, it maintains a rolling JSON state tracking:
1. **`seenSignatures`**: A normalized list of past task titles.
2. **`history`**: A rich log of tasks, results, and timestamps.
3. **`runCount`**: Total number of tasks processed.

### Advanced: Batch Filtering
If your agent scrapes lists of items, you can filter out the ones it has already seen in one go:

```typescript
const incomingTasks = [
  { title: 'Scrape Pricing Page' },
  { title: 'Download Q3 Financial Report' } // Assuming this was done previously
];

// Returns only the tasks the agent hasn't seen yet
const newTasks = await diary.filterNewTasks(incomingTasks); 
// Output: [{ title: 'Scrape Pricing Page' }]
```

## 💸 Saving Tokens & Optimizing Workflows

Without a persistent memory, autonomous agents suffer from two major flaws: they **waste tokens** and they **get stuck in loops**. `Agent Diaries` solves both:

1. **Massive Token Savings:** Every time an agent processes a task, it usually involves expensive calls to LLMs (OpenAI, Anthropic, etc.). By wrapping your agent logic with `diary.hasProcessedTask()`, you immediately short-circuit execution for redundant tasks. The agent never prompts the LLM for work it has already done, drastically reducing your API bills.
2. **Breaking Infinite Loops:** Agents often get trapped in recursive feedback loops (e.g., repeatedly clicking the same link, scraping the same website, or fixing the same block of code). A persistent diary gives the agent self-awareness. It can recognize "I have already attempted this exact task" and forces the workflow to move on to new, productive actions.
3. **Faster Execution:** Bypassing redundant tasks means your workflow skips unnecessary network requests, database queries, and heavy computations, resulting in highly optimized, blazing-fast agent runs.

## 🤖 Autonomously Tested by AI

This SDK isn't just unit-tested—it's **AI-tested**. 

We unleashed an autonomous swarm of **OpenClaw** agents to rigorously stress-test the SDK in real-time, complex scenarios. The results were flawless:
* **Infinite Loop Prevention:** The agents intentionally threw themselves into recursive failure loops. The SDK detected the signatures and successfully halted the execution, saving tokens.
* **Collaborative Memory:** Agents successfully used the SDK to hand off massive context strings to *other* agents asynchronously by reading from the diary state.
* **High-Volume Streams:** The SDK successfully deduplicated 500 tasks with high redundancy in <1ms.

You can read the raw autonomous testing logs in our [Advanced Scenario Report](./agent-diaries-advanced-report.md).

## 📚 API Reference

- **`diary.hasProcessedTask(title: string): Promise<boolean>`**
  Checks if the exact task signature has been processed before.
- **`diary.getTaskResult(title: string): Promise<string | undefined>`**
  Retrieves the exact string output/result from a previously completed task so your agent can instantly reuse it.
- **`diary.filterNewTasks(tasks: T[]): Promise<T[]>`**
  Pass in an array of task objects. Returns only the tasks that the agent has *not* seen yet.
- **`diary.writeTaskResult(title: string, result: string): Promise<void>`**
  Saves the task and its result into the agent's persistent memory bank.

## 🛠 Extensibility 

Need to scale up? You can easily plug in your own database (like **MemPalace**, SQLite, Redis, or Upstash) by implementing the `StorageAdapter`:

```typescript
import { AgentDiary, StorageAdapter, AgentState } from '@swapwarick_n/agent-diaries';

class RedisStorage implements StorageAdapter<AgentState> {
  async get(key: string) { /* Fetch from Redis */ }
  async set(key: string, value: AgentState) { /* Save to Redis */ }
}

const diary = new AgentDiary({ 
  agentId: 'cloud-bot',
  storage: new RedisStorage() 
});
```

## 📄 License

This project is licensed under the MIT License.
