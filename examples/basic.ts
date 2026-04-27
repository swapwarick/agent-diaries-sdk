import { AgentDiary } from '../src/index';

async function simulateAgent() {
  console.log("🤖 Starting Agent simulation...\n");

  // Initialize a diary for the agent named "data-collector"
  const diary = new AgentDiary({ agentId: 'data-collector' });

  // A list of hypothetical tasks the agent receives over time
  const tasks = [
    { title: 'Download Q3 Financial Report', url: 'http://example.com/q3' },
    { title: 'Download Q3 Financial Report', url: 'http://example.com/q3' }, // Duplicate!
    { title: 'Scrape Pricing Page', url: 'http://example.com/pricing' },
  ];

  for (const task of tasks) {
    console.log(`[Agent] Received task: "${task.title}"`);
    
    // 1. Check if the task has already been processed by querying the diary
    const alreadyProcessed = await diary.hasProcessedTask(task.title);

    if (alreadyProcessed) {
      console.log(`[Agent] ⏩ Skipping "${task.title}" - I remember doing this already!\n`);
      continue;
    }

    // 2. Perform the task...
    console.log(`[Agent] ⚙️ Processing "${task.title}"...`);
    
    // Simulate some work...
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = `Successfully downloaded data from ${task.url}`;

    // 3. Write the result to the diary
    await diary.writeTaskResult(task.title, result);
    console.log(`[Agent] ✅ Finished task. Diary updated!\n`);
  }

  // 4. Inspect the agent's memory state
  const state = await diary.readDiary();
  console.log("📚 Final Agent Diary State:");
  console.log(JSON.stringify(state, null, 2));
}

simulateAgent().catch(console.error);
