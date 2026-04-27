<div align="center">
  <h1>🧠 Agent Diaries</h1>
  <p><strong>Give your autonomous AI agents a persistent memory.</strong></p>

  [![npm version](https://img.shields.io/npm/v/@swapwarick_n/agent-diaries.svg?style=flat-square)](https://www.npmjs.com/package/@swapwarick_n/agent-diaries)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![codecov](https://codecov.io/gh/swapwarick/agent-diaries-sdk/graph/badge.svg)](https://codecov.io/gh/swapwarick/agent-diaries-sdk)
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
  const alreadyDone = await diary.hasProcessedTask(currentTask);
  
  if (alreadyDone) {
    console.log(`[Agent] ⏩ Skipping task: "${currentTask}". I remember doing this already!`);
    return;
  }

  // 3. Execute your agent's logic
  console.log(`[Agent] ⚙️ Executing: "${currentTask}"...`);
  const result = "Found 2 warnings, no critical errors."; // Simulate work

  // 4. Update the diary
  await diary.writeTaskResult(currentTask, result);
  console.log(`[Agent] ✅ Task complete. Diary updated!`);
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

## 🛠 Extensibility 

Need to scale up? You can easily plug in your own database (like SQLite, Redis, or Upstash) by implementing the `StorageAdapter`:

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
