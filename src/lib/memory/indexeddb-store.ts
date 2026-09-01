import { IWebMcpMemoryStore } from './memory-store.interface';
import { WebMcpInMemoryStore } from './in-memory-store';
import {
  MemoryCategory,
  MemoryItem,
  MemorySessionSummary,
  MemoryStats,
  WebMcpMemoryConfig,
} from './memory.types';

const DEFAULT_DB_NAME = 'webmcp_memory_db';
const DEFAULT_DB_VERSION = 1;
const MEMORIES_STORE = 'memories';
const SESSIONS_STORE = 'sessions';

/**
 * Utility to test whether IndexedDB is available and functional in current runtime.
 */
export function isIndexedDbSupported(): boolean {
  try {
    if (
      typeof window === 'undefined' &&
      typeof (globalThis as any).indexedDB === 'undefined'
    ) {
      return false;
    }
    const idb: IDBFactory | undefined =
      typeof indexedDB !== 'undefined'
        ? indexedDB
        : (globalThis as any).indexedDB;

    return !!idb && typeof idb.open === 'function';
  } catch {
    return false;
  }
}

/**
 * Production IndexedDB storage engine for WebMCP In-Browser Memory.
 * Features compound multi-entry indexing, transactional consistency, LRU eviction,
 * and automatic, seamless fallback to WebMcpInMemoryStore for SSR and private browsing.
 */
export class WebMcpIndexedDbStore implements IWebMcpMemoryStore {
  private db: IDBDatabase | null = null;
  private fallbackStore: WebMcpInMemoryStore | null = null;
  private _isAvailable = false;

  private readonly dbName: string;
  private readonly dbVersion: number;

  constructor(private readonly config?: Partial<WebMcpMemoryConfig>) {
    this.dbName = config?.dbName || DEFAULT_DB_NAME;
    this.dbVersion = config?.dbVersion || DEFAULT_DB_VERSION;
  }

  get engineType(): 'indexeddb' | 'in-memory' {
    if (this.fallbackStore) {
      return 'in-memory';
    }
    return 'indexeddb';
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async init(): Promise<void> {
    if (!isIndexedDbSupported()) {
      await this.activateFallback();
      return;
    }

    try {
      const idb: IDBFactory =
        typeof indexedDB !== 'undefined'
          ? indexedDB
          : (globalThis as any).indexedDB;

      await new Promise<void>((resolve) => {
        let request: IDBOpenDBRequest;
        try {
          request = idb.open(this.dbName, this.dbVersion);
        } catch {
          this.activateFallback().then(resolve);
          return;
        }

        request.onupgradeneeded = (event: any) => {
          const db: IDBDatabase = request.result;

          if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
            const memoryStore = db.createObjectStore(MEMORIES_STORE, {
              keyPath: 'id',
            });
            memoryStore.createIndex('by_topic', 'topic', { unique: false });
            memoryStore.createIndex('by_category', 'category', { unique: false });
            memoryStore.createIndex('by_pinned', 'pinned', { unique: false });
            memoryStore.createIndex('by_createdAt', 'createdAt', { unique: false });
            memoryStore.createIndex('by_updated', 'updatedAt', { unique: false });
            memoryStore.createIndex('by_tags', 'tags', {
              unique: false,
              multiEntry: true,
            });
          }

          if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
            const sessionStore = db.createObjectStore(SESSIONS_STORE, {
              keyPath: 'sessionId',
            });
            sessionStore.createIndex('by_timestamp', 'timestamp', {
              unique: false,
            });
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          this._isAvailable = true;
          resolve();
        };

        request.onerror = () => {
          this.activateFallback().then(resolve);
        };

        request.onblocked = () => {
          this.activateFallback().then(resolve);
        };
      });
    } catch {
      await this.activateFallback();
    }
  }

  async save(item: MemoryItem): Promise<MemoryItem> {
    if (this.fallbackStore) {
      return this.fallbackStore.save(item);
    }

    const maxMemories = this.config?.maxMemories ?? 10000;
    await this.enforceQuota(maxMemories);

    const cloned: MemoryItem = {
      ...item,
      tags: [...(item.tags || [])],
      metadata: item.metadata ? { ...item.metadata } : undefined,
    };

    return new Promise<MemoryItem>((resolve, reject) => {
      const tx = this.db!.transaction([MEMORIES_STORE], 'readwrite');
      const store = tx.objectStore(MEMORIES_STORE);
      const req = store.put(cloned);

      req.onsuccess = () => resolve(this.cloneItem(cloned));
      req.onerror = () => reject(req.error);
    });
  }

  async get(id: string): Promise<MemoryItem | null> {
    if (this.fallbackStore) {
      return this.fallbackStore.get(id);
    }

    return new Promise<MemoryItem | null>((resolve, reject) => {
      const tx = this.db!.transaction([MEMORIES_STORE], 'readwrite');
      const store = tx.objectStore(MEMORIES_STORE);
      const req = store.get(id);

      req.onsuccess = () => {
        const item = req.result as MemoryItem | undefined;
        if (!item) {
          resolve(null);
          return;
        }

        item.accessCount = (item.accessCount || 0) + 1;
        item.lastAccessedAt = Date.now();
        store.put(item);
        resolve(this.cloneItem(item));
      };

      req.onerror = () => reject(req.error);
    });
  }

  async getByTopic(topic: string): Promise<MemoryItem | null> {
    if (this.fallbackStore) {
      return this.fallbackStore.getByTopic(topic);
    }

    return new Promise<MemoryItem | null>((resolve, reject) => {
      const tx = this.db!.transaction([MEMORIES_STORE], 'readwrite');
      const store = tx.objectStore(MEMORIES_STORE);
      const index = store.index('by_topic');
      const req = index.get(topic);

      req.onsuccess = () => {
        const item = req.result as MemoryItem | undefined;
        if (!item) {
          resolve(null);
          return;
        }

        item.accessCount = (item.accessCount || 0) + 1;
        item.lastAccessedAt = Date.now();
        store.put(item);
        resolve(this.cloneItem(item));
      };

      req.onerror = () => reject(req.error);
    });
  }

  async getAll(filter?: {
    category?: MemoryCategory;
    pinned?: boolean;
  }): Promise<MemoryItem[]> {
    if (this.fallbackStore) {
      return this.fallbackStore.getAll(filter);
    }

    return new Promise<MemoryItem[]>((resolve, reject) => {
      const tx = this.db!.transaction([MEMORIES_STORE], 'readonly');
      const store = tx.objectStore(MEMORIES_STORE);

      let req: IDBRequest;
      if (filter?.category !== undefined) {
        const index = store.index('by_category');
        req = index.getAll(filter.category);
      } else {
        req = store.getAll();
      }

      req.onsuccess = () => {
        let results = (req.result || []) as MemoryItem[];
        if (filter?.pinned !== undefined) {
          results = results.filter((item) => item.pinned === filter.pinned);
        }
        resolve(results.map((item) => this.cloneItem(item)));
      };

      req.onerror = () => reject(req.error);
    });
  }

  async delete(id: string): Promise<boolean> {
    if (this.fallbackStore) {
      return this.fallbackStore.delete(id);
    }

    return new Promise<boolean>((resolve, reject) => {
      const tx = this.db!.transaction([MEMORIES_STORE], 'readwrite');
      const store = tx.objectStore(MEMORIES_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(): Promise<void> {
    if (this.fallbackStore) {
      return this.fallbackStore.clear();
    }

    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(
        [MEMORIES_STORE, SESSIONS_STORE],
        'readwrite'
      );
      const memStore = tx.objectStore(MEMORIES_STORE);
      const sessStore = tx.objectStore(SESSIONS_STORE);

      memStore.clear();
      sessStore.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async setPinned(id: string, pinned: boolean): Promise<MemoryItem | null> {
    if (this.fallbackStore) {
      return this.fallbackStore.setPinned(id, pinned);
    }

    return new Promise<MemoryItem | null>((resolve, reject) => {
      const tx = this.db!.transaction([MEMORIES_STORE], 'readwrite');
      const store = tx.objectStore(MEMORIES_STORE);
      const req = store.get(id);

      req.onsuccess = () => {
        const item = req.result as MemoryItem | undefined;
        if (!item) {
          resolve(null);
          return;
        }

        item.pinned = pinned;
        item.updatedAt = Date.now();
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve(this.cloneItem(item));
        putReq.onerror = () => reject(putReq.error);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async getStats(): Promise<MemoryStats> {
    if (this.fallbackStore) {
      return this.fallbackStore.getStats();
    }

    const all = await this.getAll();
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

    for (const item of all) {
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
      totalCount: all.length,
      pinnedCount,
      categoryCounts,
      estimatedStorageBytes,
      engineType: 'indexeddb',
    };
  }

  async saveSessionSummary(summary: MemorySessionSummary): Promise<void> {
    if (this.fallbackStore) {
      return this.fallbackStore.saveSessionSummary(summary);
    }

    const cloned: MemorySessionSummary = {
      ...summary,
      topicsCovered: [...(summary.topicsCovered || [])],
      keyLearnings: [...(summary.keyLearnings || [])],
      toolsUsedCount: { ...(summary.toolsUsedCount || {}) },
      metadata: summary.metadata ? { ...summary.metadata } : undefined,
    };

    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);
      const req = store.put(cloned);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getSessionSummaries(limit?: number): Promise<MemorySessionSummary[]> {
    if (this.fallbackStore) {
      return this.fallbackStore.getSessionSummaries(limit);
    }

    return new Promise<MemorySessionSummary[]>((resolve, reject) => {
      const tx = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = tx.objectStore(SESSIONS_STORE);

      // Read all summaries and sort chronologically descending
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result || []) as MemorySessionSummary[];
        const sorted = results.sort((a, b) => b.timestamp - a.timestamp);
        const sliced =
          limit !== undefined && limit > 0 ? sorted.slice(0, limit) : sorted;
        resolve(
          sliced.map((s) => ({
            ...s,
            topicsCovered: [...s.topicsCovered],
            keyLearnings: [...s.keyLearnings],
            toolsUsedCount: { ...s.toolsUsedCount },
            metadata: s.metadata ? { ...s.metadata } : undefined,
          }))
        );
      };

      req.onerror = () => reject(req.error);
    });
  }

  private async activateFallback(): Promise<void> {
    this.fallbackStore = new WebMcpInMemoryStore(this.config);
    await this.fallbackStore.init();
    this._isAvailable = true;
  }

  private async enforceQuota(maxMemories: number): Promise<void> {
    const all = await this.getAll();
    if (all.length < maxMemories) {
      return;
    }

    // Find oldest unpinned memory
    let oldestId: string | null = null;
    let oldestTimestamp = Infinity;

    for (const item of all) {
      if (!item.pinned) {
        const timestamp =
          item.lastAccessedAt || item.updatedAt || item.createdAt;
        if (timestamp < oldestTimestamp) {
          oldestTimestamp = timestamp;
          oldestId = item.id;
        }
      }
    }

    if (oldestId) {
      await this.delete(oldestId);
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
