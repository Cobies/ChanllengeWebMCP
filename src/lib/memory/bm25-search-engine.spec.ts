import { describe, expect, it, beforeEach } from 'bun:test';
import {
  WebMcpBm25SearchEngine,
  WebMcpMemorySearchEngine,
  tokenize,
  STOP_WORDS,
  type MemorySearchOptions,
  type IWebMcpMemorySearchEngine,
} from './bm25-search-engine';
import type { MemoryItem, MemoryQuery } from './memory.types';

describe('WebMcpBm25SearchEngine (Lexical Search Engine)', () => {
  let engine: WebMcpBm25SearchEngine;

  const createSampleItem = (overrides: Partial<MemoryItem> = {}): MemoryItem => ({
    id: overrides.id ?? 'mem-1',
    topic: overrides.topic ?? 'Sample Topic',
    content: overrides.content ?? 'This is sample memory content for indexing and search tests.',
    category: overrides.category ?? 'observation',
    tags: overrides.tags ?? ['sample', 'testing'],
    pinned: overrides.pinned ?? false,
    createdAt: overrides.createdAt ?? 1700000000000,
    updatedAt: overrides.updatedAt ?? 1700000000000,
    lastAccessedAt: overrides.lastAccessedAt ?? 1700000000000,
    accessCount: overrides.accessCount ?? 0,
    metadata: overrides.metadata,
  });

  beforeEach(() => {
    engine = new WebMcpBm25SearchEngine();
  });

  describe('Tokenization Pipeline', () => {
    it('should normalize Unicode NFKC and convert to lowercase', () => {
      const tokens = tokenize('HÉLLÖ WÖRld');
      expect(tokens).toEqual(['héllö', 'wörld']);
    });

    it('should split on punctuation and special characters while preserving multilingual words', () => {
      const tokens = tokenize('Arquitectura de software: diseño, microservicios & APIs (v2)!');
      expect(tokens).toContain('arquitectura');
      expect(tokens).toContain('software');
      expect(tokens).toContain('diseño');
      expect(tokens).toContain('microservicios');
      expect(tokens).toContain('apis');
      expect(tokens).toContain('v2');
      // 'de' is a stopword and should be excluded
      expect(tokens).not.toContain('de');
    });

    it('should filter out common English and Spanish stopwords', () => {
      const tokens = tokenize('the quick brown fox and el gato en la casa');
      expect(tokens).toContain('quick');
      expect(tokens).toContain('brown');
      expect(tokens).toContain('fox');
      expect(tokens).toContain('gato');
      expect(tokens).toContain('casa');
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('and');
      expect(tokens).not.toContain('el');
      expect(tokens).not.toContain('en');
      expect(tokens).not.toContain('la');
    });

    it('should discard single character non-numeric tokens but keep numeric digits', () => {
      const tokens = tokenize('a b 7 42 xyz');
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('b');
      expect(tokens).toContain('7');
      expect(tokens).toContain('42');
      expect(tokens).toContain('xyz');
    });

    it('should handle empty, whitespace-only, and null/undefined strings safely', () => {
      expect(tokenize('')).toEqual([]);
      expect(tokenize('   \n\t  ')).toEqual([]);
      expect(tokenize(null as unknown as string)).toEqual([]);
      expect(tokenize(undefined as unknown as string)).toEqual([]);
    });
  });

  describe('Robertson-Spärck Jones IDF & BM25 Scoring', () => {
    it('should rank documents with higher term frequency higher', () => {
      const item1 = createSampleItem({
        id: 'doc-1',
        topic: 'Performance Optimization',
        content: 'Caching accelerates performance. Good performance requires caching strategies.',
      });
      const item2 = createSampleItem({
        id: 'doc-2',
        topic: 'Performance Logging',
        content: 'Logging helps diagnose occasional performance issues.',
      });

      engine.rebuild([item1, item2]);
      const results = engine.search('caching performance');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe('doc-1');
      expect(results[0].score).toBeGreaterThan(results[1]?.score ?? 0);
      expect(results[0].matchedTerms).toContain('performance');
    });

    it('should assign higher IDF weight to rarer terms across corpus', () => {
      // 'angular' appears in 1 doc, 'framework' appears in 3 docs
      const item1 = createSampleItem({
        id: 'doc-1',
        topic: 'Angular Framework Architecture',
        content: 'Angular is a modern reactive framework.',
      });
      const item2 = createSampleItem({
        id: 'doc-2',
        topic: 'React Framework Overview',
        content: 'React is a component-based UI framework.',
      });
      const item3 = createSampleItem({
        id: 'doc-3',
        topic: 'Vue Framework Basics',
        content: 'Vue is an approachable web framework.',
      });

      engine.rebuild([item1, item2, item3]);

      const resultsAngular = engine.search('angular framework');
      const resultsVue = engine.search('vue framework');

      expect(resultsAngular[0].item.id).toBe('doc-1');
      expect(resultsVue[0].item.id).toBe('doc-3');
      // Document containing rare term 'angular' should score significantly higher than framework alone
      expect(resultsAngular[0].score).toBeGreaterThan(0.5);
    });

    it('should apply configurable k1 and b hyperparameters', () => {
      const customEngine = new WebMcpBm25SearchEngine({
        k1: 2.0,
        b: 0.5,
      });

      const doc1 = createSampleItem({ id: '1', topic: 'Indexing', content: 'Database indexing strategies' });
      customEngine.index(doc1);

      const results = customEngine.search('indexing');
      expect(results.length).toBe(1);
      expect(results[0].score).toBeGreaterThan(0);
    });
  });

  describe('Field Boost Weighting (Topic 2.0x, Tags 1.5x, Content 1.0x)', () => {
    it('should rank topic match higher than content match for equal document length', () => {
      const topicMatch = createSampleItem({
        id: 'topic-boosted',
        topic: 'Kubernetes Cluster Deployment',
        content: 'Standard operating manual for cloud infrastructure systems.',
        tags: ['cloud', 'devops'],
      });

      const contentMatch = createSampleItem({
        id: 'content-only',
        topic: 'General Operating Manual',
        content: 'Kubernetes cluster deployment instructions for cloud infrastructure.',
        tags: ['cloud', 'devops'],
      });

      engine.rebuild([topicMatch, contentMatch]);
      const results = engine.search('kubernetes');

      expect(results.length).toBe(2);
      expect(results[0].item.id).toBe('topic-boosted');
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });

    it('should rank tags match higher than content-only match', () => {
      const tagMatch = createSampleItem({
        id: 'tag-boosted',
        topic: 'Server Configuration',
        content: 'System parameters and hardware settings guide.',
        tags: ['security', 'firewall'],
      });

      const contentMatch = createSampleItem({
        id: 'content-only',
        topic: 'Server Configuration',
        content: 'Hardware settings and firewall rules overview.',
        tags: ['hardware', 'network'],
      });

      engine.rebuild([tagMatch, contentMatch]);
      const results = engine.search('firewall');

      expect(results.length).toBe(2);
      expect(results[0].item.id).toBe('tag-boosted');
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });
  });

  describe('Multilingual & Accent Matching', () => {
    it('should match Spanish accented words case-insensitively', () => {
      const item = createSampleItem({
        id: 'es-1',
        topic: 'Configuración de Parámetros de Autenticación',
        content: 'El método de autenticación requiere credenciales válidas y verificación biométrica.',
        tags: ['seguridad', 'autenticación'],
      });

      engine.rebuild([item]);

      const res1 = engine.search('configuración');
      expect(res1.length).toBe(1);
      expect(res1[0].item.id).toBe('es-1');
      expect(res1[0].matchedTerms).toContain('configuración');

      const res2 = engine.search('AUTENTICACIÓN');
      expect(res2.length).toBe(1);
      expect(res2[0].item.id).toBe('es-1');

      const res3 = engine.search('biométrica');
      expect(res3.length).toBe(1);
    });

    it('should match numeric codes and versions', () => {
      const item = createSampleItem({
        id: 'num-1',
        topic: 'HTTP 404 Not Found Handler',
        content: 'Error 404 occurs when API endpoint route is missing in v3 release.',
        tags: ['http', '404', 'v3'],
      });

      engine.rebuild([item]);

      const res = engine.search('404 v3');
      expect(res.length).toBe(1);
      expect(res[0].matchedTerms).toContain('404');
      expect(res[0].matchedTerms).toContain('v3');
    });
  });

  describe('Filtering Capabilities', () => {
    const dataset: MemoryItem[] = [
      createSampleItem({
        id: 'rule-1',
        topic: 'Agent Safety Policy',
        content: 'Always validate JSON schema before tool execution.',
        category: 'rule',
        tags: ['security', 'agent'],
        pinned: true,
        createdAt: 1000,
      }),
      createSampleItem({
        id: 'fact-1',
        topic: 'Agent Architecture Fact',
        content: 'Tool execution is handled asynchronously in browser context.',
        category: 'fact',
        tags: ['architecture', 'agent'],
        pinned: false,
        createdAt: 2000,
      }),
      createSampleItem({
        id: 'obs-1',
        topic: 'Agent Performance Observation',
        content: 'Tool execution took 45 milliseconds during benchmark.',
        category: 'observation',
        tags: ['telemetry', 'benchmark'],
        pinned: false,
        createdAt: 3000,
      }),
    ];

    beforeEach(() => {
      engine.rebuild(dataset);
    });

    it('should filter results by single category', () => {
      const results = engine.search('agent tool execution', { category: 'rule' });
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('rule-1');
      expect(results[0].item.category).toBe('rule');
    });

    it('should filter results by category array', () => {
      const results = engine.search('agent tool execution', { category: ['fact', 'observation'] });
      expect(results.length).toBe(2);
      const ids = results.map((r) => r.item.id);
      expect(ids).toContain('fact-1');
      expect(ids).toContain('obs-1');
      expect(ids).not.toContain('rule-1');
    });

    it('should filter by pinnedOnly flag', () => {
      const results = engine.search('tool execution', { pinnedOnly: true });
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('rule-1');
      expect(results[0].item.pinned).toBe(true);
    });

    it('should filter by tags list', () => {
      const results = engine.search('agent tool', { tags: ['telemetry'] });
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('obs-1');
    });

    it('should filter by dateRange start and end', () => {
      const results = engine.search('agent', {
        dateRange: { start: 1500, end: 2500 },
      });
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('fact-1');
    });

    it('should support MemoryQuery object parameter syntax', () => {
      const queryObj: MemoryQuery = {
        query: 'agent execution',
        category: 'rule',
        pinnedOnly: true,
        topK: 5,
        minScore: 0.05,
      };

      const results = engine.search(queryObj);
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('rule-1');
    });

    it('should clamp results to topK', () => {
      const results = engine.search('agent tool execution', { topK: 1 });
      expect(results.length).toBe(1);
    });

    it('should exclude items below minScore threshold', () => {
      const highThresholdResults = engine.search('agent', { minScore: 100.0 });
      expect(highThresholdResults.length).toBe(0);
    });
  });

  describe('Incremental In-Memory Index Maintenance', () => {
    it('should dynamically add documents with index() and addDocument()', () => {
      expect(engine.size).toBe(0);

      const item1 = createSampleItem({ id: 'doc-1', topic: 'First Doc', content: 'Unique searchable term alpha' });
      engine.index(item1);
      expect(engine.size).toBe(1);

      let results = engine.search('alpha');
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('doc-1');

      const item2 = createSampleItem({ id: 'doc-2', topic: 'Second Doc', content: 'Unique searchable term beta' });
      engine.addDocument(item2);
      expect(engine.size).toBe(2);

      results = engine.search('beta');
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('doc-2');
    });

    it('should accept an array of items in index()', () => {
      const items = [
        createSampleItem({ id: 'doc-1', topic: 'Alpha Topic', content: 'Alpha content' }),
        createSampleItem({ id: 'doc-2', topic: 'Beta Topic', content: 'Beta content' }),
      ];
      engine.index(items);
      expect(engine.size).toBe(2);
    });

    it('should update existing documents seamlessly with updateDocument()', () => {
      const item = createSampleItem({ id: 'doc-1', topic: 'Initial Topic', content: 'Initial keyword gamma' });
      engine.addDocument(item);

      let res = engine.search('gamma');
      expect(res.length).toBe(1);

      const updated = { ...item, content: 'Replaced keyword delta and deleted old terms' };
      engine.updateDocument(updated);

      expect(engine.size).toBe(1);
      expect(engine.search('gamma').length).toBe(0);
      expect(engine.search('delta').length).toBe(1);
    });

    it('should remove documents with removeDocument() and remove()', () => {
      const item1 = createSampleItem({ id: 'doc-1', topic: 'T1', content: 'apple banana' });
      const item2 = createSampleItem({ id: 'doc-2', topic: 'T2', content: 'banana cherry' });

      engine.rebuild([item1, item2]);
      expect(engine.size).toBe(2);

      engine.removeDocument('doc-1');
      expect(engine.size).toBe(1);
      expect(engine.search('apple').length).toBe(0);
      expect(engine.search('banana').length).toBe(1);

      engine.remove('doc-2');
      expect(engine.size).toBe(0);
      expect(engine.search('cherry').length).toBe(0);
    });

    it('should clear all indexed state with clear()', () => {
      engine.rebuild([
        createSampleItem({ id: '1', topic: 'T1', content: 'C1' }),
        createSampleItem({ id: '2', topic: 'T2', content: 'C2' }),
      ]);
      expect(engine.size).toBe(2);

      engine.clear();
      expect(engine.size).toBe(0);
      expect(engine.getAvgDocLength()).toBe(0);
      expect(engine.getDocCount()).toBe(0);
    });

    it('should search external items passed directly to search(query, items, options)', () => {
      const externalItems = [
        createSampleItem({ id: 'ext-1', topic: 'External Item', content: 'Dynamic payload queryable on the fly' }),
      ];

      const results = engine.search('payload', externalItems, { topK: 5 });
      expect(results.length).toBe(1);
      expect(results[0].item.id).toBe('ext-1');
    });
  });

  describe('Edge Cases & Resiliency', () => {
    it('should return empty array for empty search queries or whitespace', () => {
      engine.index(createSampleItem());
      expect(engine.search('')).toEqual([]);
      expect(engine.search('   ')).toEqual([]);
      expect(engine.search(null as unknown as string)).toEqual([]);
    });

    it('should return empty array when query consists only of stopwords', () => {
      engine.index(createSampleItem());
      expect(engine.search('the and of in')).toEqual([]);
    });

    it('should return empty array for empty corpus', () => {
      expect(engine.search('anything')).toEqual([]);
    });

    it('should return empty array when no query terms match corpus', () => {
      engine.index(createSampleItem({ content: 'Frontend Angular application' }));
      expect(engine.search('quantum entanglement')).toEqual([]);
    });

    it('should handle documents with empty fields gracefully', () => {
      const emptyDoc = createSampleItem({
        id: 'empty-1',
        topic: '',
        content: '',
        tags: [],
      });
      expect(() => engine.addDocument(emptyDoc)).not.toThrow();
      expect(engine.size).toBe(1);
    });

    it('should alias WebMcpMemorySearchEngine as WebMcpBm25SearchEngine', () => {
      const instance = new WebMcpMemorySearchEngine();
      expect(instance).toBeInstanceOf(WebMcpBm25SearchEngine);
    });
  });
});
