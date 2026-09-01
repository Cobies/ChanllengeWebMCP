import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpInMemoryStore } from './in-memory-store';
import { MemoryItem, MemorySessionSummary } from './memory.types';

describe('WebMcpInMemoryStore', () => {
  let store: WebMcpInMemoryStore;

  const createSampleItem = (overrides?: Partial<MemoryItem>): MemoryItem => ({
    id: overrides?.id ?? 'mem-1',
    topic: overrides?.topic ?? 'auth/token-rules',
    content: overrides?.content ?? 'JWT tokens must be refreshed every 15 minutes.',
    category: overrides?.category ?? 'rule',
    tags: overrides?.tags ?? ['auth', 'security', 'jwt'],
    pinned: overrides?.pinned ?? false,
    createdAt: overrides?.createdAt ?? 1000,
    updatedAt: overrides?.updatedAt ?? 1000,
    lastAccessedAt: overrides?.lastAccessedAt ?? 1000,
    accessCount: overrides?.accessCount ?? 0,
    metadata: overrides?.metadata,
  });

  beforeEach(async () => {
    store = new WebMcpInMemoryStore();
    await store.init();
  });

  describe('Lifecycle & Properties', () => {
    it('should report correct engineType and availability', async () => {
      expect(store.engineType).toBe('in-memory');
      expect(store.isAvailable).toBe(true);
    });
  });

  describe('CRUD Operations', () => {
    it('should save and retrieve a memory item by ID', async () => {
      const item = createSampleItem({ id: 'mem-1', accessCount: 0 });
      const saved = await store.save(item);
      expect(saved.id).toBe('mem-1');

      const retrieved = await store.get('mem-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('mem-1');
      expect(retrieved?.topic).toBe('auth/token-rules');
      expect(retrieved?.accessCount).toBe(1);
      expect(retrieved?.lastAccessedAt).toBeGreaterThanOrEqual(1000);
    });

    it('should return null when getting non-existent item', async () => {
      const retrieved = await store.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should retrieve a memory item by topic', async () => {
      await store.save(createSampleItem({ id: 'mem-1', topic: 'database/schema' }));
      await store.save(createSampleItem({ id: 'mem-2', topic: 'ui/theme' }));

      const found = await store.getByTopic('database/schema');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('mem-1');
      expect(found?.accessCount).toBe(1);

      const notFound = await store.getByTopic('unknown/topic');
      expect(notFound).toBeNull();
    });

    it('should retrieve all items with optional filtering', async () => {
      await store.save(createSampleItem({ id: '1', category: 'rule', pinned: true }));
      await store.save(createSampleItem({ id: '2', category: 'fact', pinned: false }));
      await store.save(createSampleItem({ id: '3', category: 'rule', pinned: false }));
      await store.save(createSampleItem({ id: '4', category: 'observation', pinned: true }));

      const all = await store.getAll();
      expect(all.length).toBe(4);

      const rules = await store.getAll({ category: 'rule' });
      expect(rules.length).toBe(2);
      expect(rules.every((r) => r.category === 'rule')).toBe(true);

      const pinned = await store.getAll({ pinned: true });
      expect(pinned.length).toBe(2);
      expect(pinned.every((r) => r.pinned)).toBe(true);

      const pinnedRules = await store.getAll({ category: 'rule', pinned: true });
      expect(pinnedRules.length).toBe(1);
      expect(pinnedRules[0].id).toBe('1');
    });

    it('should delete a memory item by ID', async () => {
      await store.save(createSampleItem({ id: 'mem-del' }));
      const deleted = await store.delete('mem-del');
      expect(deleted).toBe(true);

      const check = await store.get('mem-del');
      expect(check).toBeNull();

      const deleteAgain = await store.delete('mem-del');
      expect(deleteAgain).toBe(false);
    });

    it('should clear all items and sessions', async () => {
      await store.save(createSampleItem({ id: 'mem-1' }));
      await store.save(createSampleItem({ id: 'mem-2' }));
      await store.saveSessionSummary({
        sessionId: 'sess-1',
        timestamp: 1000,
        summary: 'Test session',
        topicsCovered: ['test'],
        keyLearnings: ['learning 1'],
        toolsUsedCount: { bi_query: 1 },
      });

      await store.clear();

      const items = await store.getAll();
      expect(items.length).toBe(0);

      const sessions = await store.getSessionSummaries();
      expect(sessions.length).toBe(0);
    });

    it('should toggle pinned status with setPinned', async () => {
      await store.save(createSampleItem({ id: 'mem-pin', pinned: false }));

      const pinnedItem = await store.setPinned('mem-pin', true);
      expect(pinnedItem).not.toBeNull();
      expect(pinnedItem?.pinned).toBe(true);

      const unpinnedItem = await store.setPinned('mem-pin', false);
      expect(unpinnedItem).not.toBeNull();
      expect(unpinnedItem?.pinned).toBe(false);

      const nonExistent = await store.setPinned('unknown', true);
      expect(nonExistent).toBeNull();
    });
  });

  describe('Isolation & Immutability', () => {
    it('should return copies of items to prevent external state corruption', async () => {
      const original = createSampleItem({ id: 'mem-iso', tags: ['initial'] });
      await store.save(original);

      const retrieved1 = await store.get('mem-iso');
      retrieved1!.tags.push('mutated');

      const retrieved2 = await store.get('mem-iso');
      expect(retrieved2?.tags).toEqual(['initial']);
    });
  });

  describe('LRU Eviction with maxMemories', () => {
    it('should evict oldest unpinned memory when maxMemories capacity is exceeded', async () => {
      const lruStore = new WebMcpInMemoryStore({ maxMemories: 3 });
      await lruStore.init();

      // Save 3 unpinned items with different timestamps
      await lruStore.save(createSampleItem({ id: 'item-1', lastAccessedAt: 100, pinned: false }));
      await lruStore.save(createSampleItem({ id: 'item-2', lastAccessedAt: 200, pinned: false }));
      await lruStore.save(createSampleItem({ id: 'item-3', lastAccessedAt: 300, pinned: false }));

      // Save 4th item -> should evict item-1 (oldest lastAccessedAt)
      await lruStore.save(createSampleItem({ id: 'item-4', lastAccessedAt: 400, pinned: false }));

      const all = await lruStore.getAll();
      expect(all.length).toBe(3);
      expect(await lruStore.get('item-1')).toBeNull();
      expect(await lruStore.get('item-2')).not.toBeNull();
      expect(await lruStore.get('item-3')).not.toBeNull();
      expect(await lruStore.get('item-4')).not.toBeNull();
    });

    it('should NEVER evict pinned items during LRU pruning', async () => {
      const lruStore = new WebMcpInMemoryStore({ maxMemories: 3 });
      await lruStore.init();

      // Pinned item with oldest timestamp
      await lruStore.save(createSampleItem({ id: 'pinned-old', lastAccessedAt: 50, pinned: true }));
      await lruStore.save(createSampleItem({ id: 'unpinned-1', lastAccessedAt: 100, pinned: false }));
      await lruStore.save(createSampleItem({ id: 'unpinned-2', lastAccessedAt: 200, pinned: false }));

      // Add item-3 -> should evict unpinned-1 instead of pinned-old
      await lruStore.save(createSampleItem({ id: 'unpinned-3', lastAccessedAt: 300, pinned: false }));

      expect(await lruStore.get('pinned-old')).not.toBeNull();
      expect(await lruStore.get('unpinned-1')).toBeNull();
      expect(await lruStore.get('unpinned-2')).not.toBeNull();
      expect(await lruStore.get('unpinned-3')).not.toBeNull();
    });
  });

  describe('Storage Stats Calculation', () => {
    it('should compute comprehensive MemoryStats accurately', async () => {
      await store.save(createSampleItem({ id: '1', category: 'rule', pinned: true, topic: 'a', content: 'b' }));
      await store.save(createSampleItem({ id: '2', category: 'fact', pinned: false, topic: 'c', content: 'd' }));
      await store.save(createSampleItem({ id: '3', category: 'observation', pinned: false, topic: 'e', content: 'f' }));

      const stats = await store.getStats();
      expect(stats.totalCount).toBe(3);
      expect(stats.pinnedCount).toBe(1);
      expect(stats.categoryCounts.rule).toBe(1);
      expect(stats.categoryCounts.fact).toBe(1);
      expect(stats.categoryCounts.observation).toBe(1);
      expect(stats.categoryCounts.context).toBe(0);
      expect(stats.categoryCounts.preference).toBe(0);
      expect(stats.categoryCounts.session).toBe(0);
      expect(stats.engineType).toBe('in-memory');
      expect(stats.estimatedStorageBytes).toBeGreaterThan(0);
    });
  });

  describe('Session Summaries', () => {
    it('should save and retrieve session summaries sorted chronologically descending', async () => {
      const summary1: MemorySessionSummary = {
        sessionId: 'sess-1',
        timestamp: 1000,
        summary: 'Session 1 analysis',
        topicsCovered: ['bi'],
        keyLearnings: ['KPI calculated'],
        toolsUsedCount: { bi_query: 2 },
      };

      const summary2: MemorySessionSummary = {
        sessionId: 'sess-2',
        timestamp: 2000,
        summary: 'Session 2 analysis',
        topicsCovered: ['3d'],
        keyLearnings: ['Mesh rotated'],
        toolsUsedCount: { scene_3d_rotate: 5 },
      };

      await store.saveSessionSummary(summary1);
      await store.saveSessionSummary(summary2);

      const retrieved = await store.getSessionSummaries();
      expect(retrieved.length).toBe(2);
      expect(retrieved[0].sessionId).toBe('sess-2'); // Newest first
      expect(retrieved[1].sessionId).toBe('sess-1');

      const limited = await store.getSessionSummaries(1);
      expect(limited.length).toBe(1);
      expect(limited[0].sessionId).toBe('sess-2');
    });
  });
});
