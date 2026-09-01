import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { WebMcpIndexedDbStore, isIndexedDbSupported } from './indexeddb-store';
import { MemoryItem, MemorySessionSummary } from './memory.types';

// In-Memory Mock of IndexedDB for deterministic testing in Node/Bun environment
class MockIDBIndex {
  constructor(
    public name: string,
    public keyPath: string,
    public options: IDBIndexParameters,
    private store: MockIDBObjectStore
  ) {}

  get(key: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const all = Array.from(this.store._data.values());
      const found = all.find((item: any) => item[this.keyPath] === key);
      req.result = found || undefined;
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  getAll(query?: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const all = Array.from(this.store._data.values());
      let filtered = all;
      if (query !== undefined) {
        filtered = all.filter((item: any) => {
          const val = item[this.keyPath];
          if (Array.isArray(val)) {
            return val.includes(query);
          }
          return val === query;
        });
      }
      req.result = filtered;
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  openCursor(range?: any, direction?: IDBCursorDirection): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const all = Array.from(this.store._data.values());
      let sorted = [...all];
      if (this.keyPath) {
        sorted.sort((a: any, b: any) => {
          const valA = a[this.keyPath] ?? 0;
          const valB = b[this.keyPath] ?? 0;
          return direction === 'prev' ? (valB > valA ? 1 : valB < valA ? -1 : 0) : (valA > valB ? 1 : valA < valB ? -1 : 0);
        });
      }

      let index = 0;
      if (index < sorted.length) {
        const createCursor = (idx: number): any => {
          if (idx >= sorted.length) return null;
          return {
            value: sorted[idx],
            primaryKey: sorted[idx][this.store.keyPath as string],
            key: sorted[idx][this.keyPath],
            continue: () => {
              index++;
              const nextCursor = createCursor(index);
              req.result = nextCursor;
              req._fireSuccess();
            },
          };
        };
        req.result = createCursor(index);
      } else {
        req.result = null;
      }
      req._fireSuccess();
    }, 0);
    return req as any;
  }
}

class MockIDBObjectStore {
  public _data = new Map<string, any>();
  public _indexes = new Map<string, MockIDBIndex>();

  constructor(
    public name: string,
    public keyPath: string | string[],
    public autoIncrement = false,
    private transaction?: MockIDBTransaction
  ) {}

  createIndex(name: string, keyPath: string, options?: IDBIndexParameters): IDBIndex {
    const index = new MockIDBIndex(name, keyPath, options || {}, this);
    this._indexes.set(name, index);
    return index as any;
  }

  index(name: string): IDBIndex {
    const idx = this._indexes.get(name);
    if (!idx) throw new Error(`Index ${name} not found`);
    return idx as any;
  }

  put(value: any, key?: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const primaryKey = key ?? value[this.keyPath as string];
      this._data.set(primaryKey, JSON.parse(JSON.stringify(value)));
      req.result = primaryKey;
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  get(key: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const val = this._data.get(key);
      req.result = val ? JSON.parse(JSON.stringify(val)) : undefined;
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  getAll(): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.result = Array.from(this._data.values()).map((v) => JSON.parse(JSON.stringify(v)));
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  delete(key: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      this._data.delete(key);
      req.result = undefined;
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  clear(): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      this._data.clear();
      req.result = undefined;
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  openCursor(query?: any, direction?: IDBCursorDirection): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const all = Array.from(this._data.values());
      let sorted = [...all];
      let index = 0;
      const createCursor = (idx: number): any => {
        if (idx >= sorted.length) return null;
        return {
          value: sorted[idx],
          primaryKey: sorted[idx][this.keyPath as string],
          continue: () => {
            index++;
            req.result = createCursor(index);
            req._fireSuccess();
          },
        };
      };
      req.result = createCursor(index);
      req._fireSuccess();
    }, 0);
    return req as any;
  }
}

class MockIDBTransaction {
  public oncomplete: ((ev: any) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;
  public onabort: ((ev: any) => void) | null = null;

  constructor(
    public db: MockIDBDatabase,
    public storeNames: string[],
    public mode: IDBTransactionMode
  ) {
    setTimeout(() => {
      if (this.oncomplete) {
        this.oncomplete({ target: this });
      }
    }, 10);
  }

  objectStore(name: string): IDBObjectStore {
    const store = this.db._stores.get(name);
    if (!store) throw new Error(`ObjectStore ${name} not found`);
    return store as any;
  }
}

class MockIDBDatabase {
  public _stores = new Map<string, MockIDBObjectStore>();
  public objectStoreNames = {
    contains: (name: string) => this._stores.has(name),
  };

  constructor(public name: string, public version: number) {}

  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore {
    const store = new MockIDBObjectStore(name, options?.keyPath || 'id');
    this._stores.set(name, store);
    return store as any;
  }

  transaction(storeNames: string | string[], mode: IDBTransactionMode = 'readonly'): IDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockIDBTransaction(this, names, mode) as any;
  }

  close() {}
}

class MockIDBRequest {
  public result: any = null;
  public error: any = null;
  public onsuccess: ((ev: any) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;

  _fireSuccess() {
    if (this.onsuccess) {
      this.onsuccess({ target: this });
    }
  }

  _fireError(err: any) {
    this.error = err;
    if (this.onerror) {
      this.onerror({ target: this });
    }
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  public onupgradeneeded: ((ev: any) => void) | null = null;
  public onblocked: ((ev: any) => void) | null = null;
}

class MockIDBFactory {
  private dbs = new Map<string, MockIDBDatabase>();

  open(name: string, version = 1): IDBOpenDBRequest {
    const req = new MockIDBOpenDBRequest();
    setTimeout(() => {
      let db = this.dbs.get(name);
      const isNew = !db;
      if (!db) {
        db = new MockIDBDatabase(name, version);
        this.dbs.set(name, db);
      }
      req.result = db;
      if (isNew && req.onupgradeneeded) {
        req.onupgradeneeded({
          target: req,
          oldVersion: 0,
          newVersion: version,
        });
      }
      req._fireSuccess();
    }, 0);
    return req as any;
  }

  deleteDatabase(name: string): IDBOpenDBRequest {
    const req = new MockIDBOpenDBRequest();
    setTimeout(() => {
      this.dbs.delete(name);
      req.result = undefined;
      req._fireSuccess();
    }, 0);
    return req as any;
  }
}

describe('WebMcpIndexedDbStore', () => {
  const originalIndexedDB = (globalThis as any).indexedDB;
  const originalWindow = (globalThis as any).window;

  const createSampleItem = (overrides?: Partial<MemoryItem>): MemoryItem => ({
    id: overrides?.id ?? 'mem-idb-1',
    topic: overrides?.topic ?? 'bi/kpi-rules',
    content: overrides?.content ?? 'Health score is clamped between 0 and 100.',
    category: overrides?.category ?? 'rule',
    tags: overrides?.tags ?? ['bi', 'kpi', 'metrics'],
    pinned: overrides?.pinned ?? false,
    createdAt: overrides?.createdAt ?? 1000,
    updatedAt: overrides?.updatedAt ?? 1000,
    lastAccessedAt: overrides?.lastAccessedAt ?? 1000,
    accessCount: overrides?.accessCount ?? 0,
    metadata: overrides?.metadata,
  });

  afterEach(() => {
    (globalThis as any).indexedDB = originalIndexedDB;
    (globalThis as any).window = originalWindow;
  });

  describe('Standard IndexedDB Operations (Browser Environment)', () => {
    let store: WebMcpIndexedDbStore;

    beforeEach(async () => {
      (globalThis as any).indexedDB = new MockIDBFactory();
      (globalThis as any).window = globalThis;
      store = new WebMcpIndexedDbStore({ dbName: 'test_webmcp_db', dbVersion: 1 });
      await store.init();
    });

    it('should initialize IndexedDB with correct engineType and isAvailable', () => {
      expect(store.engineType).toBe('indexeddb');
      expect(store.isAvailable).toBe(true);
    });

    it('should save and get memory item by ID', async () => {
      const item = createSampleItem({ id: 'mem-1', topic: 'three/camera' });
      await store.save(item);

      const retrieved = await store.get('mem-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('mem-1');
      expect(retrieved?.topic).toBe('three/camera');
      expect(retrieved?.accessCount).toBe(1);
    });

    it('should retrieve item by topic using by_topic index', async () => {
      await store.save(createSampleItem({ id: 'mem-top-1', topic: 'auth/jwt' }));
      await store.save(createSampleItem({ id: 'mem-top-2', topic: 'ui/theme' }));

      const found = await store.getByTopic('auth/jwt');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('mem-top-1');
      expect(found?.accessCount).toBe(1);

      const notFound = await store.getByTopic('unknown/topic');
      expect(notFound).toBeNull();
    });

    it('should retrieve all items and filter by category and pinned status', async () => {
      await store.save(createSampleItem({ id: '1', category: 'fact', pinned: true }));
      await store.save(createSampleItem({ id: '2', category: 'fact', pinned: false }));
      await store.save(createSampleItem({ id: '3', category: 'rule', pinned: true }));
      await store.save(createSampleItem({ id: '4', category: 'observation', pinned: false }));

      const all = await store.getAll();
      expect(all.length).toBe(4);

      const facts = await store.getAll({ category: 'fact' });
      expect(facts.length).toBe(2);
      expect(facts.every((f) => f.category === 'fact')).toBe(true);

      const pinned = await store.getAll({ pinned: true });
      expect(pinned.length).toBe(2);

      const pinnedFacts = await store.getAll({ category: 'fact', pinned: true });
      expect(pinnedFacts.length).toBe(1);
      expect(pinnedFacts[0].id).toBe('1');
    });

    it('should delete a memory item by ID', async () => {
      await store.save(createSampleItem({ id: 'mem-del' }));
      const deleted = await store.delete('mem-del');
      expect(deleted).toBe(true);

      const check = await store.get('mem-del');
      expect(check).toBeNull();
    });

    it('should toggle pinned status via setPinned', async () => {
      await store.save(createSampleItem({ id: 'mem-pin', pinned: false }));

      const pinned = await store.setPinned('mem-pin', true);
      expect(pinned?.pinned).toBe(true);

      const unpinned = await store.setPinned('mem-pin', false);
      expect(unpinned?.pinned).toBe(false);

      const nonExistent = await store.setPinned('unknown-id', true);
      expect(nonExistent).toBeNull();
    });

    it('should clear all memories and session summaries', async () => {
      await store.save(createSampleItem({ id: '1' }));
      await store.saveSessionSummary({
        sessionId: 'sess-1',
        timestamp: 1000,
        summary: 'summary',
        topicsCovered: ['t'],
        keyLearnings: ['k'],
        toolsUsedCount: {},
      });

      await store.clear();
      expect((await store.getAll()).length).toBe(0);
      expect((await store.getSessionSummaries()).length).toBe(0);
    });

    it('should calculate accurate storage stats', async () => {
      await store.save(createSampleItem({ id: '1', category: 'rule', pinned: true }));
      await store.save(createSampleItem({ id: '2', category: 'fact', pinned: false }));

      const stats = await store.getStats();
      expect(stats.totalCount).toBe(2);
      expect(stats.pinnedCount).toBe(1);
      expect(stats.categoryCounts.rule).toBe(1);
      expect(stats.categoryCounts.fact).toBe(1);
      expect(stats.engineType).toBe('indexeddb');
      expect(stats.estimatedStorageBytes).toBeGreaterThan(0);
    });

    it('should save and retrieve session summaries sorted descending', async () => {
      const s1: MemorySessionSummary = {
        sessionId: 's-1',
        timestamp: 100,
        summary: 'First session',
        topicsCovered: ['a'],
        keyLearnings: ['k1'],
        toolsUsedCount: { toolA: 1 },
      };
      const s2: MemorySessionSummary = {
        sessionId: 's-2',
        timestamp: 200,
        summary: 'Second session',
        topicsCovered: ['b'],
        keyLearnings: ['k2'],
        toolsUsedCount: { toolB: 2 },
      };

      await store.saveSessionSummary(s1);
      await store.saveSessionSummary(s2);

      const summaries = await store.getSessionSummaries();
      expect(summaries.length).toBe(2);
      expect(summaries[0].sessionId).toBe('s-2');
      expect(summaries[1].sessionId).toBe('s-1');

      const limited = await store.getSessionSummaries(1);
      expect(limited.length).toBe(1);
      expect(limited[0].sessionId).toBe('s-2');
    });

    it('should enforce LRU eviction when maxMemories capacity is exceeded', async () => {
      const lruStore = new WebMcpIndexedDbStore({ dbName: 'test_lru_db', maxMemories: 3 });
      await lruStore.init();

      await lruStore.save(createSampleItem({ id: 'item-1', lastAccessedAt: 100, pinned: false }));
      await lruStore.save(createSampleItem({ id: 'item-2', lastAccessedAt: 200, pinned: false }));
      await lruStore.save(createSampleItem({ id: 'item-3', lastAccessedAt: 300, pinned: false }));

      // 4th item evicts item-1
      await lruStore.save(createSampleItem({ id: 'item-4', lastAccessedAt: 400, pinned: false }));

      const all = await lruStore.getAll();
      expect(all.length).toBe(3);
      expect(await lruStore.get('item-1')).toBeNull();
      expect(await lruStore.get('item-4')).not.toBeNull();
    });

    it('should never evict pinned items during LRU eviction', async () => {
      const lruStore = new WebMcpIndexedDbStore({ dbName: 'test_lru_pinned_db', maxMemories: 3 });
      await lruStore.init();

      await lruStore.save(createSampleItem({ id: 'pinned-1', lastAccessedAt: 50, pinned: true }));
      await lruStore.save(createSampleItem({ id: 'unpinned-1', lastAccessedAt: 100, pinned: false }));
      await lruStore.save(createSampleItem({ id: 'unpinned-2', lastAccessedAt: 200, pinned: false }));

      // Add item-3 -> should evict unpinned-1
      await lruStore.save(createSampleItem({ id: 'unpinned-3', lastAccessedAt: 300, pinned: false }));

      expect(await lruStore.get('pinned-1')).not.toBeNull();
      expect(await lruStore.get('unpinned-1')).toBeNull();
      expect(await lruStore.get('unpinned-2')).not.toBeNull();
      expect(await lruStore.get('unpinned-3')).not.toBeNull();
    });
  });

  describe('SSR / Node.js & Restricted Private Browsing Fallback', () => {
    it('should detect when IndexedDB is not supported', () => {
      delete (globalThis as any).indexedDB;
      delete (globalThis as any).window;

      expect(isIndexedDbSupported()).toBe(false);
    });

    it('should fallback gracefully to WebMcpInMemoryStore in SSR environment without crashing', async () => {
      delete (globalThis as any).indexedDB;
      delete (globalThis as any).window;

      const store = new WebMcpIndexedDbStore({ dbName: 'ssr_db' });
      await store.init();

      expect(store.engineType).toBe('in-memory');
      expect(store.isAvailable).toBe(true);

      const saved = await store.save(createSampleItem({ id: 'ssr-1', topic: 'ssr/test' }));
      expect(saved.id).toBe('ssr-1');

      const retrieved = await store.get('ssr-1');
      expect(retrieved?.topic).toBe('ssr/test');

      const stats = await store.getStats();
      expect(stats.engineType).toBe('in-memory');
      expect(stats.totalCount).toBe(1);
    });

    it('should fallback to in-memory store when indexedDB.open throws SecurityError (Private mode)', async () => {
      (globalThis as any).window = globalThis;
      (globalThis as any).indexedDB = {
        open: () => {
          throw new Error('SecurityError: The operation is insecure.');
        },
      };

      const store = new WebMcpIndexedDbStore({ dbName: 'private_db' });
      await store.init();

      expect(store.engineType).toBe('in-memory');
      expect(store.isAvailable).toBe(true);

      await store.save(createSampleItem({ id: 'priv-1' }));
      expect(await store.get('priv-1')).not.toBeNull();
    });

    it('should fallback to in-memory store when open request triggers onerror event', async () => {
      (globalThis as any).window = globalThis;
      (globalThis as any).indexedDB = {
        open: () => {
          const req = new MockIDBOpenDBRequest();
          setTimeout(() => {
            req._fireError(new Error('QuotaExceededError or DatabaseBlocked'));
          }, 0);
          return req;
        },
      };

      const store = new WebMcpIndexedDbStore({ dbName: 'error_fallback_db' });
      await store.init();

      expect(store.engineType).toBe('in-memory');
      expect(store.isAvailable).toBe(true);

      await store.save(createSampleItem({ id: 'err-1' }));
      expect(await store.get('err-1')).not.toBeNull();
    });
  });
});
