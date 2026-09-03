import { IWebMcpMemoryStore } from './memory-store.interface';
import { WebMcpInMemoryStore } from './in-memory-store';
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


  async exportKnowledgeBase(filter?: {
    category?: MemoryCategory;
    tags?: string[];
  }): Promise<MemoryExportBundle> {
    if (this.fallbackStore) {
      return this.fallbackStore.exportKnowledgeBase(filter);
    }

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
    if (this.fallbackStore) {
      return this.fallbackStore.importKnowledgeBase(bundle, options);
    }

    const allBefore = await this.getAll();
    const totalBefore = allBefore.length;
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
    const now = Date.now();

    if (mode === 'replace') {
      await this.clear();

      const storeNames =
        Array.isArray(bundle.sessions) && bundle.sessions.length > 0
          ? [MEMORIES_STORE, SESSIONS_STORE]
          : [MEMORIES_STORE];

      const tx = this.db!.transaction(storeNames, 'readwrite');
      const memStore = tx.objectStore(MEMORIES_STORE);

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

        const item: MemoryItem = {
          id: raw.id || `mem-${now}-${Math.random().toString(36).slice(2, 9)}`,
          topic: raw.topic.trim(),
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

        memStore.put(this.cloneItem(item));
        importedCount++;
      }

      if (Array.isArray(bundle.sessions) && bundle.sessions.length > 0) {
        const sessStore = tx.objectStore(SESSIONS_STORE);
        for (const sess of bundle.sessions) {
          if (sess && sess.sessionId) {
            sessStore.put(sess);
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } else {
      const existingItems = await this.getAll();
      const byIdMap = new Map<string, MemoryItem>();
      const byTopicMap = new Map<string, MemoryItem>();

      for (const item of existingItems) {
        byIdMap.set(item.id, item);
        byTopicMap.set(item.topic, item);
      }

      const storeNames =
        Array.isArray(bundle.sessions) && bundle.sessions.length > 0
          ? [MEMORIES_STORE, SESSIONS_STORE]
          : [MEMORIES_STORE];

      const tx = this.db!.transaction(storeNames, 'readwrite');
      const memStore = tx.objectStore(MEMORIES_STORE);

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
        let existing: MemoryItem | undefined;

        if (raw.id && byIdMap.has(raw.id)) {
          existing = byIdMap.get(raw.id);
        } else if (byTopicMap.has(topic)) {
          existing = byTopicMap.get(topic);
        }

        if (existing) {
          existing.content = raw.content;
          if (raw.category) existing.category = raw.category;
          if (Array.isArray(raw.tags)) existing.tags = [...raw.tags];
          if (raw.pinned !== undefined) existing.pinned = Boolean(raw.pinned);
          if (raw.metadata) existing.metadata = { ...existing.metadata, ...raw.metadata };
          existing.updatedAt = preserveTimestamps && raw.updatedAt ? raw.updatedAt : now;
          if (raw.accessCount !== undefined) {
            existing.accessCount = Math.max(existing.accessCount || 0, raw.accessCount);
          }
          memStore.put(this.cloneItem(existing));
          importedCount++;
        } else {
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
          byIdMap.set(newItem.id, newItem);
          byTopicMap.set(newItem.topic, newItem);
          memStore.put(this.cloneItem(newItem));
          importedCount++;
        }
      }

      if (Array.isArray(bundle.sessions) && bundle.sessions.length > 0) {
        const sessStore = tx.objectStore(SESSIONS_STORE);
        for (const sess of bundle.sessions) {
          if (sess && sess.sessionId) {
            sessStore.put(sess);
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });

      const maxMemories = this.config?.maxMemories ?? 10000;
      await this.enforceQuota(maxMemories);
    }

    const allAfter = await this.getAll();
    return {
      success: errors.length === 0,
      importedCount,
      skippedCount,
      errors,
      totalBefore,
      totalAfter: allAfter.length,
    };
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
