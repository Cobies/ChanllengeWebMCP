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

  describe('Knowledge Base Export & Import', () => {
    it('should export stored memories and sessions into a valid bundle', async () => {
      await store.save(createSampleItem({ id: 'mem-1', topic: 'rules/auth', category: 'rule', tags: ['sec'] }));
      await store.save(createSampleItem({ id: 'mem-2', topic: 'facts/db', category: 'fact', tags: ['pg'] }));
      await store.saveSessionSummary({
        sessionId: 'sess-1',
        timestamp: 1000,
        summary: 'Database migration complete',
        topicsCovered: ['db'],
        keyLearnings: ['PG 16 upgraded'],
        toolsUsedCount: {},
      });

      const bundle = await store.exportKnowledgeBase();
      expect(bundle.version).toBe('1.0');
      expect(bundle.metadata.schemaVersion).toBe('1.0');
      expect(bundle.metadata.totalCount).toBe(2);
      expect(bundle.memories.length).toBe(2);
      expect(bundle.sessions?.length).toBe(1);
      expect(bundle.sessions?.[0].sessionId).toBe('sess-1');
    });

    it('should filter export by category and tags', async () => {
      await store.save(createSampleItem({ id: '1', category: 'rule', tags: ['auth', 'core'] }));
      await store.save(createSampleItem({ id: '2', category: 'fact', tags: ['db'] }));
      await store.save(createSampleItem({ id: '3', category: 'rule', tags: ['billing'] }));

      const categoryFiltered = await store.exportKnowledgeBase({ category: 'rule' });
      expect(categoryFiltered.memories.length).toBe(2);
      expect(categoryFiltered.memories.every((m) => m.category === 'rule')).toBe(true);

      const tagFiltered = await store.exportKnowledgeBase({ tags: ['core'] });
      expect(tagFiltered.memories.length).toBe(1);
      expect(tagFiltered.memories[0].id).toBe('1');
    });

    it('should validate bundle format and reject invalid versions', async () => {
      const invalidVersionBundle: any = {
        version: '2.0',
        metadata: { exportedAt: 1000, schemaVersion: '1.0', totalCount: 0 },
        memories: [],
      };
      const res = await store.importKnowledgeBase(invalidVersionBundle);
      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toContain('Unsupported bundle version');

      const nonArrayMemories: any = {
        version: '1.0',
        metadata: {},
        memories: 'invalid',
      };
      const res2 = await store.importKnowledgeBase(nonArrayMemories);
      expect(res2.success).toBe(false);
      expect(res2.errors[0]).toContain('"memories" must be an array');
    });

    it('should import bundle in replace mode, wiping prior state', async () => {
      await store.save(createSampleItem({ id: 'old-1', topic: 'old/topic' }));
      await store.saveSessionSummary({
        sessionId: 'old-sess',
        timestamp: 500,
        summary: 'Old summary',
        topicsCovered: [],
        keyLearnings: [],
        toolsUsedCount: {},
      });

      const bundle = {
        version: '1.0' as const,
        metadata: {
          exportedAt: 2000,
          schemaVersion: '1.0' as const,
          totalCount: 1,
        },
        memories: [
          createSampleItem({ id: 'new-1', topic: 'new/topic', content: 'New content' }),
        ],
        sessions: [
          {
            sessionId: 'new-sess',
            timestamp: 2000,
            summary: 'New summary',
            topicsCovered: ['new'],
            keyLearnings: ['Imported'],
            toolsUsedCount: {},
          },
        ],
      };

      const result = await store.importKnowledgeBase(bundle, { mode: 'replace' });
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.totalBefore).toBe(1);
      expect(result.totalAfter).toBe(1);

      // Verify old item is gone and new item exists
      expect(await store.get('old-1')).toBeNull();
      const newItem = await store.get('new-1');
      expect(newItem).not.toBeNull();
      expect(newItem?.topic).toBe('new/topic');

      // Verify sessions replaced
      const sessions = await store.getSessionSummaries();
      expect(sessions.length).toBe(1);
      expect(sessions[0].sessionId).toBe('new-sess');
    });

    it('should import bundle in merge mode with deduplication by ID and topic', async () => {
      // Existing item 1: id matches bundle item
      await store.save(createSampleItem({ id: 'mem-1', topic: 'topic-1', content: 'Original content 1' }));
      // Existing item 2: topic matches bundle item with different ID
      await store.save(createSampleItem({ id: 'mem-2', topic: 'topic-2', content: 'Original content 2' }));
      // Existing item 3: untouched
      await store.save(createSampleItem({ id: 'mem-3', topic: 'topic-3', content: 'Untouched content' }));

      const bundle = {
        version: '1.0' as const,
        metadata: {
          exportedAt: 3000,
          schemaVersion: '1.0' as const,
          totalCount: 3,
        },
        memories: [
          // 1. Matches by ID
          createSampleItem({ id: 'mem-1', topic: 'topic-1', content: 'Updated content 1' }),
          // 2. Matches by topic, different ID in bundle
          createSampleItem({ id: 'different-id', topic: 'topic-2', content: 'Updated content 2 by topic' }),
          // 3. Brand new item
          createSampleItem({ id: 'mem-brand-new', topic: 'topic-brand-new', content: 'Brand new' }),
        ],
      };

      const result = await store.importKnowledgeBase(bundle, { mode: 'merge' });
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(3);
      expect(result.totalBefore).toBe(3);
      expect(result.totalAfter).toBe(4); // mem-1, mem-2, mem-3, mem-brand-new

      // Verify mem-1 was updated
      const item1 = await store.get('mem-1');
      expect(item1?.content).toBe('Updated content 1');

      // Verify mem-2 was updated in place (without duplicate topic)
      const item2 = await store.getByTopic('topic-2');
      expect(item2?.id).toBe('mem-2');
      expect(item2?.content).toBe('Updated content 2 by topic');

      // Verify brand new was inserted
      const itemNew = await store.get('mem-brand-new');
      expect(itemNew?.content).toBe('Brand new');
    });

    it('should skip invalid items in bundle and collect errors without crashing', async () => {
      const bundle = {
        version: '1.0' as const,
        metadata: {
          exportedAt: 3000,
          schemaVersion: '1.0' as const,
          totalCount: 2,
        },
        memories: [
          null as any,
          { topic: '', content: 'no topic' } as any,
          createSampleItem({ id: 'valid-1', topic: 'valid/topic', content: 'valid' }),
        ],
      };

      const result = await store.importKnowledgeBase(bundle, { mode: 'merge' });
      expect(result.success).toBe(false);
      expect(result.importedCount).toBe(1);
      expect(result.skippedCount).toBe(2);
      expect(result.errors.length).toBe(2);
      expect(await store.get('valid-1')).not.toBeNull();
    });
  });

});
