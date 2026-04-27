import { AgentDiary } from '../src/index';

async function simulateMultiAgentScrape() {
  console.log("🌐 Deploying 3 Agents for Web Research...\n");

  // 1. Initialize 3 independent agent diaries
  const agent1 = new AgentDiary({ agentId: 'researcher-alpha' });
  const agent2 = new AgentDiary({ agentId: 'researcher-beta' });
  const agent3 = new AgentDiary({ agentId: 'researcher-gamma' });

  const agents = [agent1, agent2, agent3];

  // The latest AI coding websites as of 2026
  const websitesToResearch = [
    { title: 'Research Cursor IDE', url: 'https://cursor.sh' },
    { title: 'Research Windsurf', url: 'https://codeium.com/windsurf' },
    { title: 'Research Claude Code', url: 'https://anthropic.com' },
    { title: 'Research Aider', url: 'https://aider.chat' },
    { title: 'Research GitHub Copilot', url: 'https://github.com/features/copilot' },
    
    // Simulating a system glitch where the same tasks are dispatched again
    { title: 'Research Cursor IDE', url: 'https://cursor.sh' },
    { title: 'Research Aider', url: 'https://aider.chat' }
  ];

  for (let i = 0; i < websitesToResearch.length; i++) {
    const task = websitesToResearch[i];
    // Round-robin assignment
    const agent = agents[i % agents.length];
    const agentName = `Agent ${i % agents.length + 1}`;

    console.log(`[System] Assigning "${task.title}" to ${agentName}`);

    // Check Memory
    const alreadyProcessed = await agent.hasProcessedTask(task.title);

    if (alreadyProcessed) {
      console.log(`[${agentName}] ⏩ Skipping "${task.title}". I already researched this!\n`);
      continue;
    }

    console.log(`[${agentName}] 🔍 Scanning ${task.url}...`);
    // Simulating web scraping time
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const result = `Scraped and vectorized content from ${task.url}`;
    
    // Update Memory
    await agent.writeTaskResult(task.title, result);
    console.log(`[${agentName}] ✅ Finished and saved to diary.\n`);
  }

  // Print final results
  console.log("📚 Final Results Saved in Diaries:");
  const state1 = await agent1.readDiary();
  const state2 = await agent2.readDiary();
  const state3 = await agent3.readDiary();

  console.log(`Agent 1 Tasks Completed: ${state1.runCount}`);
  console.log(`Agent 2 Tasks Completed: ${state2.runCount}`);
  console.log(`Agent 3 Tasks Completed: ${state3.runCount}`);
  
  console.log("\n(Check the .agent-diaries folder to see the raw JSON memories for each agent!)");
}

simulateMultiAgentScrape().catch(console.error);
