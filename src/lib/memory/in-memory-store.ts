import { IWebMcpMemoryStore } from './memory-store.interface';
import {
  MemoryCategory,
  MemoryItem,
  MemorySessionSummary,
  MemoryStats,
  WebMcpMemoryConfig,
} from './memory.types';

/**
 * In-Memory fallback implementation of IWebMcpMemoryStore.
 * Provides ephemeral storage with full LRU pruning, category indexing, and zero browser dependencies.
 */
export class WebMcpInMemoryStore implements IWebMcpMemoryStore {
  readonly engineType = 'in-memory' as const;
  private _isAvailable = false;

  private readonly memories = new Map<string, MemoryItem>();
  private readonly sessions = new Map<string, MemorySessionSummary>();
  private readonly config?: Partial<WebMcpMemoryConfig>;

  constructor(config?: Partial<WebMcpMemoryConfig> | number) {
    if (typeof config === 'number') {
      this.config = { maxMemories: config };
    } else {
      this.config = config;
    }
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async init(): Promise<void> {
    this._isAvailable = true;
  }

  async save(item: MemoryItem): Promise<MemoryItem> {
    const maxMemories = this.config?.maxMemories ?? 10000;

    // If new item and reached max capacity, evict oldest unpinned item
    if (!this.memories.has(item.id) && this.memories.size >= maxMemories) {
      this.evictLruUnpinned();
    }

    const cloned: MemoryItem = {
      ...item,
      tags: [...(item.tags || [])],
      metadata: item.metadata ? { ...item.metadata } : undefined,
    };

    this.memories.set(item.id, cloned);
    return this.cloneItem(cloned);
  }

  async get(id: string): Promise<MemoryItem | null> {
    const item = this.memories.get(id);
    if (!item) {
      return null;
    }

    item.accessCount = (item.accessCount || 0) + 1;
    item.lastAccessedAt = Date.now();

    return this.cloneItem(item);
  }

  async getByTopic(topic: string): Promise<MemoryItem | null> {
    for (const item of this.memories.values()) {
      if (item.topic === topic) {
        item.accessCount = (item.accessCount || 0) + 1;
        item.lastAccessedAt = Date.now();
        return this.cloneItem(item);
      }
    }
    return null;
  }

  async getAll(filter?: {
    category?: MemoryCategory;
    pinned?: boolean;
  }): Promise<MemoryItem[]> {
    const results: MemoryItem[] = [];

    for (const item of this.memories.values()) {
      if (filter?.category !== undefined && item.category !== filter.category) {
        continue;
      }
      if (filter?.pinned !== undefined && item.pinned !== filter.pinned) {
        continue;
      }
      results.push(this.cloneItem(item));
    }

    return results;
  }

  async delete(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async clear(): Promise<void> {
    this.memories.clear();
    this.sessions.clear();
  }

  async setPinned(id: string, pinned: boolean): Promise<MemoryItem | null> {
    const item = this.memories.get(id);
    if (!item) {
      return null;
    }

    item.pinned = pinned;
    item.updatedAt = Date.now();

    return this.cloneItem(item);
  }

  async getStats(): Promise<MemoryStats> {
    const categoryCounts: Record<MemoryCategory, number> = {
      observation: 0,
      fact: 0,
      rule: 0,
      context: 0,
      preference: 0,
      session: 0,
    };

    let pinnedCount = 0;
    let estimatedStorageBytes = 0;

    for (const item of this.memories.values()) {
      if (categoryCounts[item.category] !== undefined) {
        categoryCounts[item.category]++;
      }
      if (item.pinned) {
        pinnedCount++;
      }
      estimatedStorageBytes +=
        (item.topic?.length || 0) * 2 +
        (item.content?.length || 0) * 2 +
        128;
    }

    return {
      totalCount: this.memories.size,
      pinnedCount,
      categoryCounts,
      estimatedStorageBytes,
      engineType: this.engineType,
    };
  }

  async saveSessionSummary(summary: MemorySessionSummary): Promise<void> {
    const cloned: MemorySessionSummary = {
      ...summary,
      topicsCovered: [...(summary.topicsCovered || [])],
      keyLearnings: [...(summary.keyLearnings || [])],
      toolsUsedCount: { ...(summary.toolsUsedCount || {}) },
      metadata: summary.metadata ? { ...summary.metadata } : undefined,
    };
    this.sessions.set(summary.sessionId, cloned);
  }

  async getSessionSummaries(limit?: number): Promise<MemorySessionSummary[]> {
    const sorted = Array.from(this.sessions.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const sliced = limit !== undefined && limit > 0 ? sorted.slice(0, limit) : sorted;
    return sliced.map((s) => ({
      ...s,
      topicsCovered: [...s.topicsCovered],
      keyLearnings: [...s.keyLearnings],
      toolsUsedCount: { ...s.toolsUsedCount },
      metadata: s.metadata ? { ...s.metadata } : undefined,
    }));
  }

  private evictLruUnpinned(): void {
    let oldestId: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [id, item] of this.memories.entries()) {
      if (!item.pinned) {
        const timestamp = item.lastAccessedAt || item.updatedAt || item.createdAt;
        if (timestamp < oldestTimestamp) {
          oldestTimestamp = timestamp;
          oldestId = id;
        }
      }
    }

    if (oldestId) {
      this.memories.delete(oldestId);
    }
  }

  private cloneItem(item: MemoryItem): MemoryItem {
    return {
      ...item,
      tags: [...(item.tags || [])],
      metadata: item.metadata ? { ...item.metadata } : undefined,
    };
  }
}
