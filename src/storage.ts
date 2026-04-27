import * as fs from 'fs';
import * as path from 'path';

export interface StorageAdapter<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
}

export class LocalFileStorage<T> implements StorageAdapter<T> {
  private baseDir: string;

  constructor(options: { baseDir?: string } = {}) {
    // Default to a .agent-diaries folder in the user's home directory or current dir
    this.baseDir = options.baseDir || path.join(process.cwd(), '.agent-diaries');
    
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    // Safely encode the key to use as a filename
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.baseDir, `${safeKey}.json`);
  }

  async get(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`[LocalFileStorage] Error reading key ${key}:`, e);
      return null;
    }
  }

  async set(key: string, value: T): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      const data = JSON.stringify(value, null, 2);
      await fs.promises.writeFile(filePath, data, 'utf-8');
    } catch (e) {
      console.error(`[LocalFileStorage] Error writing key ${key}:`, e);
      throw e;
    }
  }
}
