import { StorageAdapter, LocalFileStorage } from './storage';

export interface TaskRecord {
  title: string;
  signature: string; // A unique hash or normalized string to identify the task
  result?: string;
  timestamp: number;
}

export interface AgentState {
  lastRun: number;
  seenSignatures: string[];
  runCount: number;
  history: TaskRecord[];
}

export interface AgentDiaryOptions {
  agentId: string;
  storage?: StorageAdapter<AgentState>;
  maxHistory?: number;
}

export class AgentDiary {
  private agentId: string;
  private storage: StorageAdapter<AgentState>;
  private maxHistory: number;

  constructor(options: AgentDiaryOptions) {
    this.agentId = options.agentId;
    // Use local file storage by default if none provided
    this.storage = options.storage || new LocalFileStorage<AgentState>();
    this.maxHistory = options.maxHistory || 500;
  }

  private emptyState(): AgentState {
    return {
      lastRun: 0,
      seenSignatures: [],
      runCount: 0,
      history: [],
    };
  }

  /**
   * Generates a normalized signature for a task title.
   */
  public static normalizeSignature(title: string): string {
    return (title || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Reads the current diary state for the agent.
   */
  public async readDiary(): Promise<AgentState> {
    const state = await this.storage.get(`diary_${this.agentId}`);
    return state ?? this.emptyState();
  }

  /**
   * Checks if a task has already been processed by the agent.
   */
  public async hasProcessedTask(title: string): Promise<boolean> {
    const signature = AgentDiary.normalizeSignature(title);
    const state = await this.readDiary();
    return state.seenSignatures.includes(signature);
  }

  /**
   * Filters out items that the agent has already processed.
   */
  public async filterNewTasks<T extends { title: string }>(tasks: T[]): Promise<T[]> {
    const state = await this.readDiary();
    return tasks.filter(task => {
      const signature = AgentDiary.normalizeSignature(task.title);
      return !state.seenSignatures.includes(signature);
    });
  }

  /**
   * Appends a new completed task to the agent's diary.
   */
  public async writeTaskResult(title: string, result?: string): Promise<void> {
    const state = await this.readDiary();
    const signature = AgentDiary.normalizeSignature(title);

    const record: TaskRecord = {
      title,
      signature,
      result,
      timestamp: Date.now()
    };

    const newSignatures = [...new Set([signature, ...state.seenSignatures])].slice(0, this.maxHistory);
    const newHistory = [record, ...state.history].slice(0, this.maxHistory);

    const updatedState: AgentState = {
      lastRun: Date.now(),
      seenSignatures: newSignatures,
      runCount: state.runCount + 1,
      history: newHistory
    };

    await this.storage.set(`diary_${this.agentId}`, updatedState);
  }
}
