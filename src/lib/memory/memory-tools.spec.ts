import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpInMemoryStore } from './in-memory-store';
import { WebMcpBm25SearchEngine } from './bm25-search-engine';
import {
  createWebMcpMemoryTools,
  createMemSaveTool,
  createMemSearchTool,
  createMemContextTool,
  createMemPinTool,
  createMemUnpinTool,
  createMemSessionSummaryTool,
} from './memory-tools';
import { MemoryItem, MemorySessionSummary } from './memory.types';
import { WebMcpToolDefinition } from '../core/webmcp.types';

describe('WebMCP Declarative Memory Tools', () => {
  let store: WebMcpInMemoryStore;
  let searchEngine: WebMcpBm25SearchEngine;
  let tools: WebMcpToolDefinition[];
  let toolMap: Map<string, WebMcpToolDefinition>;

  beforeEach(async () => {
    store = new WebMcpInMemoryStore();
    await store.init();
    searchEngine = new WebMcpBm25SearchEngine();
    tools = createWebMcpMemoryTools(store, searchEngine);
    toolMap = new Map(tools.map((t) => [t.name, t]));
  });

  describe('Tool Registration & Schema Invariants', () => {
    it('should create all 8 declarative memory tools', () => {
      expect(tools.length).toBe(8);
      const names = tools.map((t) => t.name);
      expect(names).toContain('mem_save');
      expect(names).toContain('mem_search');
      expect(names).toContain('mem_context');
      expect(names).toContain('mem_pin');
      expect(names).toContain('mem_unpin');
      expect(names).toContain('mem_session_summary');
      expect(names).toContain('mem_export');
      expect(names).toContain('mem_import');
    });

    it('should define valid WebMcpToolDefinition properties and JSON schemas for each tool', () => {
      for (const tool of tools) {
        expect(typeof tool.name).toBe('string');
        expect(tool.name.startsWith('mem_')).toBe(true);
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('object');
        expect(typeof tool.parameters.properties).toBe('object');
        expect(typeof tool.handler).toBe('function');
      }
    });

    it('should export standalone tool creator functions', () => {
      expect(typeof createMemSaveTool).toBe('function');
      expect(typeof createMemSearchTool).toBe('function');
      expect(typeof createMemContextTool).toBe('function');
      expect(typeof createMemPinTool).toBe('function');
      expect(typeof createMemUnpinTool).toBe('function');
      expect(typeof createMemSessionSummaryTool).toBe('function');

      const saveTool = createMemSaveTool(store, searchEngine);
      expect(saveTool.name).toBe('mem_save');
    });
  });

  describe('mem_save Tool', () => {
    let saveTool: WebMcpToolDefinition;

    beforeEach(() => {
      saveTool = toolMap.get('mem_save')!;
      expect(saveTool).toBeDefined();
    });

    it('should have required schema properties for topic and content', () => {
      expect(saveTool.parameters.required).toContain('topic');
      expect(saveTool.parameters.required).toContain('content');
      expect(saveTool.parameters.properties['topic'].type).toBe('string');
      expect(saveTool.parameters.properties['content'].type).toBe('string');
      expect(saveTool.parameters.properties['category'].enum).toEqual([
        'observation',
        'fact',
        'rule',
        'context',
        'preference',
        'session',
      ]);
    });

    it('should create a new memory item and index it when topic does not exist', async () => {
      const result: any = await saveTool.handler({
        topic: 'auth/jwt-strategy',
        content: 'Access tokens expire in 15m. Refresh tokens are stored in httpOnly cookies.',
        category: 'rule',
        tags: ['auth', 'jwt', 'security'],
        pinned: true,
        metadata: { source: 'user-prompt' },
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.item).toBeDefined();
      expect(result.item.topic).toBe('auth/jwt-strategy');
      expect(result.item.category).toBe('rule');
      expect(result.item.pinned).toBe(true);
      expect(result.item.tags).toEqual(['auth', 'jwt', 'security']);
      expect(result.item.metadata).toEqual({ source: 'user-prompt' });
      expect(result.item.id).toBeDefined();

      // Verify store persistence
      const stored = await store.getByTopic('auth/jwt-strategy');
      expect(stored).not.toBeNull();
      expect(stored?.content).toBe(result.item.content);

      // Verify search engine index
      expect(searchEngine.size).toBe(1);
      const searchResults = searchEngine.search('httpOnly cookies');
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].item.topic).toBe('auth/jwt-strategy');
    });

    it('should update an existing memory item and search index when topic already exists', async () => {
      // 1. Initial save
      const initial: any = await saveTool.handler({
        topic: 'database/postgres-pool',
        content: 'Unoptimized pool size is set to ten connections.',
        category: 'fact',
        tags: ['db', 'postgres'],
      });

      expect(initial.action).toBe('created');
      const originalId = initial.item.id;
      const originalCreatedAt = initial.item.createdAt;

      // 2. Update same topic
      const updated: any = await saveTool.handler({
        topic: 'database/postgres-pool',
        content: 'Optimized pool size increased to twenty-five connections with timeout.',
        category: 'fact',
        tags: ['db', 'postgres', 'scaling'],
        pinned: true,
      });

      expect(updated.success).toBe(true);
      expect(updated.action).toBe('updated');
      expect(updated.item.id).toBe(originalId);
      expect(updated.item.createdAt).toBe(originalCreatedAt);
      expect(updated.item.content).toBe('Optimized pool size increased to twenty-five connections with timeout.');
      expect(updated.item.pinned).toBe(true);
      expect(updated.item.tags).toEqual(['db', 'postgres', 'scaling']);

      // Verify store has only 1 item
      const all = await store.getAll();
      expect(all.length).toBe(1);
      expect(all[0].content).toBe('Optimized pool size increased to twenty-five connections with timeout.');

      // Verify search engine reflects new content
      const searchOld = searchEngine.search('unoptimized');
      expect(searchOld.length).toBe(0);
      const searchNew = searchEngine.search('optimized');
      expect(searchNew.length).toBe(1);
    });

    it('should default category to "observation" and pinned to false if omitted', async () => {
      const result: any = await saveTool.handler({
        topic: 'ui/button-click',
        content: 'User clicked the export CSV button on BI dashboard.',
      });

      expect(result.success).toBe(true);
      expect(result.item.category).toBe('observation');
      expect(result.item.pinned).toBe(false);
      expect(result.item.tags).toEqual([]);
    });

    it('should throw or reject when required topic or content is missing or empty', async () => {
      await expect(saveTool.handler({} as any)).rejects.toThrow();
      await expect(saveTool.handler({ topic: 'some/topic' } as any)).rejects.toThrow();
      await expect(saveTool.handler({ content: 'some content' } as any)).rejects.toThrow();
      await expect(saveTool.handler({ topic: '  ', content: 'valid' } as any)).rejects.toThrow();
      await expect(saveTool.handler({ topic: 'valid', content: '' } as any)).rejects.toThrow();
    });
  });

  describe('mem_search Tool', () => {
    let searchTool: WebMcpToolDefinition;
    let saveTool: WebMcpToolDefinition;

    beforeEach(async () => {
      searchTool = toolMap.get('mem_search')!;
      saveTool = toolMap.get('mem_save')!;

      // Seed memories
      await saveTool.handler({
        topic: 'rules/auth',
        content: 'Always validate JSON Web Tokens on API gateway with asymmetric RSA keys.',
        category: 'rule',
        tags: ['auth', 'jwt', 'security'],
        pinned: true,
      });

      await saveTool.handler({
        topic: 'rules/bi-export',
        content: 'Exporting large BI tables requires CSV streaming to prevent browser heap overflow.',
        category: 'rule',
        tags: ['bi', 'export', 'csv'],
        pinned: false,
      });

      await saveTool.handler({
        topic: 'facts/user-profile',
        content: 'Admin user belongs to the enterprise FinOps organization.',
        category: 'fact',
        tags: ['user', 'finops'],
        pinned: false,
      });
    });

    it('should validate query parameter requirement in schema', () => {
      expect(searchTool.parameters.required).toContain('query');
      expect(searchTool.parameters.properties['query'].type).toBe('string');
    });

    it('should search memories using BM25 ranking and return matching items', async () => {
      const res: any = await searchTool.handler({
        query: 'JSON Web Tokens RSA gateway',
      });

      expect(res.query).toBe('JSON Web Tokens RSA gateway');
      expect(res.count).toBeGreaterThanOrEqual(1);
      expect(res.results.length).toBeGreaterThanOrEqual(1);
      expect(res.results[0].item.topic).toBe('rules/auth');
      expect(res.results[0].score).toBeGreaterThan(0);
    });

    it('should filter search results by category', async () => {
      const res: any = await searchTool.handler({
        query: 'enterprise organization',
        category: 'fact',
      });

      expect(res.results.length).toBe(1);
      expect(res.results[0].item.category).toBe('fact');
      expect(res.results[0].item.topic).toBe('facts/user-profile');
    });

    it('should filter search results by pinned status (supporting pinnedOnly and pinned_only)', async () => {
      const resCamel: any = await searchTool.handler({
        query: 'rules',
        pinnedOnly: true,
      });
      expect(resCamel.results.every((r: any) => r.item.pinned === true)).toBe(true);

      const resSnake: any = await searchTool.handler({
        query: 'rules',
        pinned_only: true,
      });
      expect(resSnake.results.every((r: any) => r.item.pinned === true)).toBe(true);
    });

    it('should respect topK / top_k limits and minScore / min_score thresholds', async () => {
      const resTopK: any = await searchTool.handler({
        query: 'rules',
        topK: 1,
      });
      expect(resTopK.results.length).toBeLessThanOrEqual(1);

      const resMinScore: any = await searchTool.handler({
        query: 'xyzunrelatednonexistentterm',
        minScore: 10.0,
      });
      expect(resMinScore.results.length).toBe(0);
    });

    it('should update accessCount and lastAccessedAt on retrieved items in store', async () => {
      const before = await store.getByTopic('rules/auth');
      const initialAccessCount = before?.accessCount ?? 0;

      await searchTool.handler({
        query: 'validate JSON Web Tokens',
      });

      const after = await store.getByTopic('rules/auth');
      expect(after?.accessCount).toBe(initialAccessCount + 1);
      expect(after?.lastAccessedAt).toBeGreaterThanOrEqual(before?.lastAccessedAt ?? 0);
    });

    it('should throw when query is missing or invalid', async () => {
      await expect(searchTool.handler({} as any)).rejects.toThrow();
      await expect(searchTool.handler({ query: 123 } as any)).rejects.toThrow();
    });
  });

  describe('mem_context Tool', () => {
    let contextTool: WebMcpToolDefinition;
    let saveTool: WebMcpToolDefinition;

    beforeEach(async () => {
      contextTool = toolMap.get('mem_context')!;
      saveTool = toolMap.get('mem_save')!;

      await saveTool.handler({
        topic: 'rules/anti-recursion',
        content: 'Do not trigger interceptors on mem_* tool calls.',
        category: 'rule',
        pinned: true,
      });

      await saveTool.handler({
        topic: 'context/active-workspace',
        content: 'User is viewing the Enterprise BI Financial Risk dashboard.',
        category: 'context',
        pinned: false,
      });

      await saveTool.handler({
        topic: 'observation/last-action',
        content: 'Exported Q3 risk anomalies to CSV format.',
        category: 'observation',
        pinned: false,
      });
    });

    it('should retrieve consolidated context string formatted for system prompt injection', async () => {
      const res: any = await contextTool.handler({});

      expect(res).toBeDefined();
      expect(typeof res.context).toBe('string');
      expect(res.context).toContain('rules/anti-recursion');
      expect(res.context).toContain('Do not trigger interceptors');
      expect(res.context).toContain('context/active-workspace');
      expect(res.context).toContain('observation/last-action');

      expect(Array.isArray(res.pinnedRules)).toBe(true);
      expect(res.pinnedRules.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.relevantObservations)).toBe(true);
      expect(res.totalRetrieved).toBeGreaterThanOrEqual(3);
    });

    it('should exclude pinned items when includePinned / include_pinned_rules is false', async () => {
      const res: any = await contextTool.handler({
        includePinned: false,
      });

      expect(res.pinnedRules.length).toBe(0);
      expect(res.context).not.toContain('rules/anti-recursion');
    });

    it('should support filtering by category or topic', async () => {
      const res: any = await contextTool.handler({
        category: 'rule',
      });

      expect(res.totalRetrieved).toBeGreaterThanOrEqual(1);
      expect(res.context).toContain('rules/anti-recursion');
    });

    it('should handle empty store gracefully without errors', async () => {
      await store.clear();
      searchEngine.clear();

      const res: any = await contextTool.handler({});
      expect(res.totalRetrieved).toBe(0);
      expect(res.pinnedRules).toEqual([]);
      expect(res.relevantObservations).toEqual([]);
      expect(typeof res.context).toBe('string');
    });
  });

  describe('mem_pin and mem_unpin Tools', () => {
    let pinTool: WebMcpToolDefinition;
    let unpinTool: WebMcpToolDefinition;
    let saveTool: WebMcpToolDefinition;
    let createdItem: MemoryItem;

    beforeEach(async () => {
      pinTool = toolMap.get('mem_pin')!;
      unpinTool = toolMap.get('mem_unpin')!;
      saveTool = toolMap.get('mem_save')!;

      const res: any = await saveTool.handler({
        topic: 'config/theme',
        content: 'Dark mode enabled by user preference.',
        category: 'preference',
        pinned: false,
      });
      createdItem = res.item;
    });

    it('should pin an item by ID', async () => {
      expect(createdItem.pinned).toBe(false);

      const res: any = await pinTool.handler({
        id: createdItem.id,
      });

      expect(res.success).toBe(true);
      expect(res.action).toBe('pinned');
      expect(res.item.pinned).toBe(true);

      const stored = await store.get(createdItem.id);
      expect(stored?.pinned).toBe(true);
    });

    it('should pin an item by topic if ID is not provided', async () => {
      const res: any = await pinTool.handler({
        topic: 'config/theme',
      });

      expect(res.success).toBe(true);
      expect(res.item.pinned).toBe(true);
      expect(res.item.topic).toBe('config/theme');
    });

    it('should unpin an item by ID', async () => {
      await pinTool.handler({ id: createdItem.id });

      const res: any = await unpinTool.handler({
        id: createdItem.id,
      });

      expect(res.success).toBe(true);
      expect(res.action).toBe('unpinned');
      expect(res.item.pinned).toBe(false);

      const stored = await store.get(createdItem.id);
      expect(stored?.pinned).toBe(false);
    });

    it('should unpin an item by topic', async () => {
      await pinTool.handler({ topic: 'config/theme' });

      const res: any = await unpinTool.handler({
        topic: 'config/theme',
      });

      expect(res.success).toBe(true);
      expect(res.item.pinned).toBe(false);
    });

    it('should throw error when target item is not found or parameters are missing', async () => {
      await expect(pinTool.handler({})).rejects.toThrow();
      await expect(pinTool.handler({ id: 'non-existent-id' })).rejects.toThrow();
      await expect(unpinTool.handler({})).rejects.toThrow();
      await expect(unpinTool.handler({ topic: 'non-existent-topic' })).rejects.toThrow();
    });
  });

  describe('mem_session_summary Tool', () => {
    let sessionTool: WebMcpToolDefinition;

    beforeEach(() => {
      sessionTool = toolMap.get('mem_session_summary')!;
      expect(sessionTool).toBeDefined();
    });

    it('should save a session summary with auto-generated sessionId', async () => {
      const res: any = await sessionTool.handler({
        summary: 'Analyzed enterprise supply chain stockouts and reordered inventory.',
        topicsCovered: ['supply-chain', 'inventory', 'purchase-orders'],
        keyLearnings: ['Supplier lead time increased by 3 days in EU region'],
        toolsUsedCount: { query_enterprise_metrics: 4, trigger_analytics_export: 1 },
      });

      expect(res.success).toBe(true);
      expect(res.action).toBe('saved');
      expect(res.session).toBeDefined();
      expect(res.session.sessionId).toBeDefined();
      expect(res.session.summary).toContain('supply chain');
      expect(res.session.topicsCovered).toEqual(['supply-chain', 'inventory', 'purchase-orders']);
      expect(res.session.keyLearnings).toEqual(['Supplier lead time increased by 3 days in EU region']);
      expect(res.session.toolsUsedCount).toEqual({ query_enterprise_metrics: 4, trigger_analytics_export: 1 });

      const stored = await store.getSessionSummaries();
      expect(stored.length).toBe(1);
      expect(stored[0].sessionId).toBe(res.session.sessionId);
    });

    it('should support snake_case aliases (topics, key_learnings, retrieve_recent)', async () => {
      await sessionTool.handler({
        sessionId: 'sess-custom-1',
        summary: 'First session summary',
        topics: ['finops', 'aws'],
        key_learnings: ['EC2 instances idle on weekends'],
      });

      await sessionTool.handler({
        sessionId: 'sess-custom-2',
        summary: 'Second session summary',
        topics: ['retention', 'churn'],
        key_learnings: ['Tier 3 accounts have highest churn risk'],
      });

      const listRes: any = await sessionTool.handler({
        action: 'list',
        retrieve_recent: 10,
      });

      expect(listRes.success).toBe(true);
      expect(listRes.count).toBe(2);
      expect(listRes.summaries.length).toBe(2);
    });

    it('should retrieve a specific session by sessionId when action is "get"', async () => {
      await sessionTool.handler({
        sessionId: 'sess-target-123',
        summary: 'Target session details',
      });

      const getRes: any = await sessionTool.handler({
        action: 'get',
        sessionId: 'sess-target-123',
      });

      expect(getRes.success).toBe(true);
      expect(getRes.session).not.toBeNull();
      expect(getRes.session.sessionId).toBe('sess-target-123');
      expect(getRes.session.summary).toBe('Target session details');
    });

    it('should throw when required parameters are missing', async () => {
      // action 'save' without summary
      await expect(sessionTool.handler({ action: 'save' })).rejects.toThrow();
      // action 'get' without sessionId
      await expect(sessionTool.handler({ action: 'get' })).rejects.toThrow();
    });
  });

  
  describe('mem_export Tool', () => {
    let exportTool: WebMcpToolDefinition;

    beforeEach(() => {
      exportTool = toolMap.get('mem_export')!;
    });

    it('should export all memories and sessions without filters', async () => {
      await store.save({
        id: '1',
        topic: 'rule/auth',
        content: 'Auth rule',
        category: 'rule',
        tags: ['security'],
        pinned: true,
        createdAt: 1000,
        updatedAt: 1000,
        lastAccessedAt: 1000,
        accessCount: 0,
      });
      await store.save({
        id: '2',
        topic: 'fact/db',
        content: 'PostgreSQL DB',
        category: 'fact',
        tags: ['db'],
        pinned: false,
        createdAt: 1000,
        updatedAt: 1000,
        lastAccessedAt: 1000,
        accessCount: 0,
      });

      const res: any = await exportTool.handler({});
      expect(res.success).toBe(true);
      expect(res.totalExported).toBe(2);
      expect(res.bundle.version).toBe('1.0');
      expect(res.bundle.memories.length).toBe(2);
    });

    it('should filter export by category and tags', async () => {
      await store.save({
        id: '1',
        topic: 'rule/auth',
        content: 'Auth rule',
        category: 'rule',
        tags: ['security', 'core'],
        pinned: true,
        createdAt: 1000,
        updatedAt: 1000,
        lastAccessedAt: 1000,
        accessCount: 0,
      });
      await store.save({
        id: '2',
        topic: 'fact/db',
        content: 'PostgreSQL DB',
        category: 'fact',
        tags: ['db'],
        pinned: false,
        createdAt: 1000,
        updatedAt: 1000,
        lastAccessedAt: 1000,
        accessCount: 0,
      });

      const catRes: any = await exportTool.handler({ category: 'rule' });
      expect(catRes.totalExported).toBe(1);
      expect(catRes.bundle.memories[0].topic).toBe('rule/auth');

      const tagRes: any = await exportTool.handler({ tags: ['core'] });
      expect(tagRes.totalExported).toBe(1);
      expect(tagRes.bundle.memories[0].topic).toBe('rule/auth');
    });
  });

  describe('mem_import Tool', () => {
    let importTool: WebMcpToolDefinition;

    beforeEach(() => {
      importTool = toolMap.get('mem_import')!;
    });

    it('should import bundle object and re-synchronize BM25 search index', async () => {
      const bundle = {
        version: '1.0' as const,
        metadata: {
          exportedAt: Date.now(),
          schemaVersion: '1.0' as const,
          totalCount: 1,
        },
        memories: [
          {
            id: 'imported-rule',
            topic: 'security/cors-policy',
            content: 'Always restrict allowed origins to trusted domains.',
            category: 'rule' as const,
            tags: ['security', 'cors'],
            pinned: true,
            createdAt: 1000,
            updatedAt: 1000,
            lastAccessedAt: 1000,
            accessCount: 0,
          },
        ],
      };

      const res: any = await importTool.handler({ bundle, mode: 'merge' });
      expect(res.success).toBe(true);
      expect(res.importedCount).toBe(1);
      expect(res.totalAfter).toBe(1);

      // Verify search engine can find it via BM25
      const searchRes = searchEngine.search('restrict allowed origins trusted domains');
      expect(searchRes.length).toBeGreaterThanOrEqual(1);
      expect(searchRes[0].item.topic).toBe('security/cors-policy');
    });

    it('should import bundle from raw bundleJson string with replace mode', async () => {
      await store.save({
        id: 'old-item',
        topic: 'old-topic',
        content: 'Old',
        category: 'observation',
        tags: [],
        pinned: false,
        createdAt: 100,
        updatedAt: 100,
        lastAccessedAt: 100,
        accessCount: 0,
      });

      const bundleJson = JSON.stringify({
        version: '1.0',
        metadata: {
          exportedAt: Date.now(),
          schemaVersion: '1.0',
          totalCount: 1,
        },
        memories: [
          {
            id: 'replaced-item',
            topic: 'clean/slate',
            content: 'Store was replaced.',
            category: 'fact',
            tags: [],
            pinned: false,
            createdAt: 200,
            updatedAt: 200,
            lastAccessedAt: 200,
            accessCount: 0,
          },
        ],
      });

      const res: any = await importTool.handler({ bundleJson, mode: 'replace' });
      expect(res.success).toBe(true);
      expect(res.importedCount).toBe(1);
      expect(res.totalBefore).toBe(1);
      expect(res.totalAfter).toBe(1);

      expect(await store.get('old-item')).toBeNull();
      expect(await store.get('replaced-item')).not.toBeNull();
    });

    it('should handle invalid JSON string gracefully', async () => {
      const res: any = await importTool.handler({ bundleJson: 'not-valid-json' });
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Failed to parse bundle JSON string');
    });

    it('should throw error when neither bundle nor bundleJson is provided', async () => {
      let threw = false;
      try {
        await importTool.handler({});
      } catch (err: any) {
        threw = true;
        expect(err.message).toContain('"bundle" (object) or "bundleJson"');
      }
      expect(threw).toBe(true);
    });
  });

  describe('End-to-End Multi-Turn Agent Memory Flow', () => {
    it('should support full agent lifecycle: save rules, search facts, inject context, pin/unpin, and summarize session', async () => {
      const save = toolMap.get('mem_save')!;
      const search = toolMap.get('mem_search')!;
      const context = toolMap.get('mem_context')!;
      const pin = toolMap.get('mem_pin')!;
      const unpin = toolMap.get('mem_unpin')!;
      const session = toolMap.get('mem_session_summary')!;

      // 1. Agent saves business invariant rule
      await save.handler({
        topic: 'business-rules/refund-limit',
        content: 'Maximum instant customer refund limit is $500 without manager approval.',
        category: 'rule',
        tags: ['finance', 'refund', 'policy'],
        pinned: true,
      });

      // 2. Agent saves observational fact during multi-turn workflow
      await save.handler({
        topic: 'active-case/customer-4421',
        content: 'Customer #4421 requested $350 refund for damaged shipping package.',
        category: 'observation',
        tags: ['customer', 'support', 'case'],
        pinned: false,
      });

      // 3. Agent searches for refund policies
      const searchRes: any = await search.handler({
        query: 'refund limit manager approval',
      });
      expect(searchRes.count).toBeGreaterThanOrEqual(1);
      expect(searchRes.results[0].item.topic).toBe('business-rules/refund-limit');

      // 4. Agent retrieves active prompt context
      const contextRes: any = await context.handler({ includePinned: true });
      expect(contextRes.context).toContain('Maximum instant customer refund limit');
      expect(contextRes.context).toContain('Customer #4421 requested $350 refund');

      // 5. Agent unpins the rule
      const unpinRes: any = await unpin.handler({ topic: 'business-rules/refund-limit' });
      expect(unpinRes.item.pinned).toBe(false);

      // 6. Agent re-pins by topic
      const pinRes: any = await pin.handler({ topic: 'business-rules/refund-limit' });
      expect(pinRes.item.pinned).toBe(true);

      // 7. Agent records session summary
      const sessionRes: any = await session.handler({
        summary: 'Processed customer 4421 refund inquiry under policy guidelines.',
        topicsCovered: ['refund', 'customer-support'],
        keyLearnings: ['Approved $350 refund within $500 threshold'],
      });
      expect(sessionRes.success).toBe(true);

      // 8. Verify all items exist in store
      const allItems = await store.getAll();
      expect(allItems.length).toBe(2);

      const summaries = await store.getSessionSummaries();
      expect(summaries.length).toBe(1);
    });
  });
});
