import { IWebMcpMemoryStore } from './memory-store.interface';
import {
  MemoryCategory,
  MemoryItem,
  MemorySessionSummary,
  MemoryStats,
  WebMcpMemoryConfig,
  MemoryExportBundle,
  MemoryExportMetadata,
  MemoryImportMode,
  MemoryImportOptions,
  MemoryImportResult,
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


  async exportKnowledgeBase(filter?: {
    category?: MemoryCategory;
    tags?: string[];
  }): Promise<MemoryExportBundle> {
    const all = await this.getAll();
    const filtered = all.filter((item) => {
      if (filter?.category !== undefined && item.category !== filter.category) {
        return false;
      }
      if (filter?.tags && filter.tags.length > 0) {
        const itemTags = (item.tags || []).map((t) => t.toLowerCase());
        const matches = filter.tags.some((t) => itemTags.includes(t.toLowerCase()));
        if (!matches) {
          return false;
        }
      }
      return true;
    });

    const sessions = await this.getSessionSummaries();

    const metadata: MemoryExportMetadata = {
      exportedAt: Date.now(),
      schemaVersion: '1.0',
      totalCount: filtered.length,
      source: '@cobies/webmcp-angular',
      tags: filter?.tags,
    };

    return {
      version: '1.0',
      metadata,
      memories: filtered.map((m) => this.cloneItem(m)),
      sessions: sessions.length > 0 ? sessions : undefined,
    };
  }

  async importKnowledgeBase(
    bundle: MemoryExportBundle,
    options?: MemoryImportOptions
  ): Promise<MemoryImportResult> {
    const totalBefore = this.memories.size;
    const errors: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    if (!bundle || typeof bundle !== 'object') {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: ['Import bundle must be a non-null object.'],
        totalBefore,
        totalAfter: totalBefore,
      };
    }

    if (bundle.version !== '1.0') {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: [`Unsupported bundle version "${bundle.version}". Expected "1.0".`],
        totalBefore,
        totalAfter: totalBefore,
      };
    }

    if (!Array.isArray(bundle.memories)) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: ['Invalid bundle format: "memories" must be an array.'],
        totalBefore,
        totalAfter: totalBefore,
      };
    }

    const mode: MemoryImportMode = options?.mode ?? 'merge';
    const preserveTimestamps = options?.preserveTimestamps ?? true;

    if (mode === 'replace') {
      await this.clear();
    }

    const now = Date.now();
    const maxMemories = this.config?.maxMemories ?? 10000;

    for (let i = 0; i < bundle.memories.length; i++) {
      const raw = bundle.memories[i];
      if (
        !raw ||
        typeof raw !== 'object' ||
        typeof raw.topic !== 'string' ||
        !raw.topic.trim() ||
        typeof raw.content !== 'string'
      ) {
        skippedCount++;
        errors.push(`Item at index ${i} is invalid (missing non-empty topic or content).`);
        continue;
      }

      const topic = raw.topic.trim();

      if (mode === 'merge') {
        let existingId: string | null = null;
        if (raw.id && this.memories.has(raw.id)) {
          existingId = raw.id;
        } else {
          for (const [id, mem] of this.memories.entries()) {
            if (mem.topic === topic) {
              existingId = id;
              break;
            }
          }
        }

        if (existingId) {
          const existing = this.memories.get(existingId)!;
          existing.content = raw.content;
          if (raw.category) existing.category = raw.category;
          if (Array.isArray(raw.tags)) existing.tags = [...raw.tags];
          if (raw.pinned !== undefined) existing.pinned = Boolean(raw.pinned);
          if (raw.metadata) existing.metadata = { ...existing.metadata, ...raw.metadata };
          existing.updatedAt = preserveTimestamps && raw.updatedAt ? raw.updatedAt : now;
          if (raw.accessCount !== undefined) {
            existing.accessCount = Math.max(existing.accessCount || 0, raw.accessCount);
          }
          this.memories.set(existingId, this.cloneItem(existing));
          importedCount++;
          continue;
        }
      }

      const newItem: MemoryItem = {
        id: raw.id || `mem-${now}-${Math.random().toString(36).slice(2, 9)}`,
        topic,
        content: raw.content,
        category: raw.category ?? 'observation',
        tags: Array.isArray(raw.tags) ? [...raw.tags] : [],
        pinned: Boolean(raw.pinned),
        createdAt: preserveTimestamps && raw.createdAt ? raw.createdAt : now,
        updatedAt: preserveTimestamps && raw.updatedAt ? raw.updatedAt : now,
        lastAccessedAt: preserveTimestamps && raw.lastAccessedAt ? raw.lastAccessedAt : now,
        accessCount: raw.accessCount ?? 0,
        metadata: raw.metadata ? { ...raw.metadata } : undefined,
      };

      if (!this.memories.has(newItem.id) && this.memories.size >= maxMemories) {
        this.evictLruUnpinned();
      }

      this.memories.set(newItem.id, this.cloneItem(newItem));
      importedCount++;
    }

    if (Array.isArray(bundle.sessions)) {
      for (const session of bundle.sessions) {
        if (session && session.sessionId) {
          await this.saveSessionSummary(session);
        }
      }
    }

    const totalAfter = this.memories.size;

    return {
      success: errors.length === 0,
      importedCount,
      skippedCount,
      errors,
      totalBefore,
      totalAfter,
    };
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
