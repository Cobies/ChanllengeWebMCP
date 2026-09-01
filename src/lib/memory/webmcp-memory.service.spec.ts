import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { Injector } from '@angular/core';
import { WebMcpMemoryService } from './webmcp-memory.service';
import { WebMcpService } from '../core/webmcp.service';
import { WebMcpInMemoryStore } from './in-memory-store';
import { WebMcpBm25SearchEngine } from './bm25-search-engine';
import {
  provideWebMcpMemory,
  WEBMCP_MEMORY_CONFIG,
  WEBMCP_MEMORY_STORE,
  WEBMCP_MEMORY_SEARCH_ENGINE,
} from './memory.provider';
import { MemoryCategory, MemoryItem } from './memory.types';

describe('WebMcpMemoryService (Zoneless Signals & Memory Management)', () => {
  let store: WebMcpInMemoryStore;
  let searchEngine: WebMcpBm25SearchEngine;
  let webmcpService: WebMcpService;
  let memoryService: WebMcpMemoryService;

  beforeEach(() => {
    store = new WebMcpInMemoryStore();
    searchEngine = new WebMcpBm25SearchEngine();
    webmcpService = new WebMcpService({ enableEmulatorFallback: true, logExecutionToConsole: false });
    memoryService = new WebMcpMemoryService(
      { enablePassiveToolCapture: true, autoRegisterTools: true },
      store,
      searchEngine,
      webmcpService
    );
  });

  it('should initialize store and search engine, and set isReady signal to true', async () => {
    expect(memoryService.isReady()).toBe(false);
    await memoryService.init();

    expect(memoryService.isReady()).toBe(true);
    expect(memoryService.memories()).toEqual([]);
    expect(memoryService.pinnedMemories()).toEqual([]);
    expect(memoryService.stats().totalCount).toBe(0);
    expect(memoryService.stats().engineType).toBe('in-memory');
  });

  it('should auto-register standard 6 memory tools in WebMcpService upon initialization', async () => {
    await memoryService.init();

    const registeredTools = webmcpService.getTools();
    const toolNames = registeredTools.map((t) => t.name);

    expect(toolNames).toContain('mem_save');
    expect(toolNames).toContain('mem_search');
    expect(toolNames).toContain('mem_context');
    expect(toolNames).toContain('mem_pin');
    expect(toolNames).toContain('mem_unpin');
    expect(toolNames).toContain('mem_session_summary');
  });

  it('should not register memory tools when autoRegisterTools is false', async () => {
    const customService = new WebMcpMemoryService(
      { autoRegisterTools: false },
      store,
      searchEngine,
      webmcpService
    );
    await customService.init();

    const toolNames = webmcpService.getTools().map((t) => t.name);
    expect(toolNames).not.toContain('mem_save');
  });

  it('should save memories, update signals reactively, and index for search', async () => {
    await memoryService.init();

    const item1 = await memoryService.save({
      topic: 'auth/jwt-strategy',
      content: 'Use HttpOnly cookies with short-lived JWTs and rotation.',
      category: 'rule',
      tags: ['security', 'auth', 'jwt'],
      pinned: true,
    });

    expect(item1.id).toBeDefined();
    expect(item1.topic).toBe('auth/jwt-strategy');
    expect(item1.category).toBe('rule');
    expect(item1.pinned).toBe(true);

    // Check signals reactivity
    expect(memoryService.memories().length).toBe(1);
    expect(memoryService.pinnedMemories().length).toBe(1);
    expect(memoryService.pinnedMemories()[0].topic).toBe('auth/jwt-strategy');
    expect(memoryService.stats().totalCount).toBe(1);
    expect(memoryService.stats().pinnedCount).toBe(1);
    expect(memoryService.stats().categoryCounts.rule).toBe(1);

    // Save second unpinned item
    const item2 = await memoryService.save({
      topic: 'ui/theme',
      content: 'User selected dark theme preference.',
      category: 'preference',
      tags: ['ui', 'theme'],
    });

    expect(item2.pinned).toBe(false);
    expect(memoryService.memories().length).toBe(2);
    expect(memoryService.pinnedMemories().length).toBe(1);
    expect(memoryService.stats().totalCount).toBe(2);
    expect(memoryService.stats().categoryCounts.preference).toBe(1);
  });

  it('should default category to observation if omitted during save', async () => {
    await memoryService.init();

    const item = await memoryService.save({
      topic: 'workspace/opened',
      content: 'Workspace opened at 10:00 AM',
    });

    expect(item.category).toBe('observation');
    expect(item.pinned).toBe(false);
    expect(memoryService.stats().categoryCounts.observation).toBe(1);
  });

  it('should update an existing memory when same topic is saved again', async () => {
    await memoryService.init();

    const first = await memoryService.save({
      topic: 'performance/bundle-budget',
      content: 'Budget is 200KB initial bundle.',
      category: 'rule',
    });

    const second = await memoryService.save({
      topic: 'performance/bundle-budget',
      content: 'Budget updated to 150KB initial bundle with tree-shaking.',
      category: 'rule',
      tags: ['performance', 'bundle'],
    });

    expect(second.id).toBe(first.id);
    expect(second.content).toBe('Budget updated to 150KB initial bundle with tree-shaking.');
    expect(memoryService.memories().length).toBe(1);
    expect(memoryService.stats().totalCount).toBe(1);
  });

  it('should search memories using BM25 lexical relevance and track recent queries signal', async () => {
    await memoryService.init();

    await memoryService.save({
      topic: 'angular/signals',
      content: 'Signals provide fine-grained reactivity and Zoneless change detection in Angular.',
      category: 'rule',
      tags: ['angular', 'signals', 'zoneless'],
    });

    await memoryService.save({
      topic: 'three/viewport',
      content: 'Three.js WebGL renderer canvas with orbit controls and lighting.',
      category: 'fact',
      tags: ['three', 'webgl', '3d'],
    });

    expect(memoryService.recentQueries()).toEqual([]);

    const results = await memoryService.search('zoneless signals reactivity', { topK: 5 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.topic).toBe('angular/signals');
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].matchedTerms).toContain('zoneless');

    // Recent queries signal should track query
    expect(memoryService.recentQueries()).toContain('zoneless signals reactivity');
  });

  it('should filter search results by category, minScore, and pinnedOnly', async () => {
    await memoryService.init();

    await memoryService.save({
      topic: 'db/schema',
      content: 'PostgreSQL schema migrations with transactions.',
      category: 'fact',
      pinned: false,
    });

    await memoryService.save({
      topic: 'db/rule',
      content: 'PostgreSQL indexing guidelines for compound foreign keys.',
      category: 'rule',
      pinned: true,
    });

    const pinnedResults = await memoryService.search('postgresql', { pinnedOnly: true });
    expect(pinnedResults.length).toBe(1);
    expect(pinnedResults[0].item.topic).toBe('db/rule');

    const ruleResults = await memoryService.search('postgresql', { category: 'rule' });
    expect(ruleResults.length).toBe(1);
    expect(ruleResults[0].item.topic).toBe('db/rule');
  });

  it('should retrieve consolidated context via getContext with pinned rules and observations', async () => {
    await memoryService.init();

    await memoryService.save({
      topic: 'rule/immutable-state',
      content: 'Never mutate signal state directly.',
      category: 'rule',
      pinned: true,
    });

    await memoryService.save({
      topic: 'session/active-route',
      content: 'Current route is /bi-dashboard.',
      category: 'context',
    });

    await memoryService.save({
      topic: 'user/click-action',
      content: 'User toggled dark mode switch.',
      category: 'observation',
    });

    const ctx = await memoryService.getContext();

    expect(ctx.pinnedRules.length).toBe(1);
    expect(ctx.pinnedRules[0].topic).toBe('rule/immutable-state');
    expect(ctx.relevantObservations.length).toBe(1);
    expect(ctx.totalRetrieved).toBe(3);
    expect(ctx.context).toContain('# WebMCP Agent Working Context');
    expect(ctx.context).toContain('Never mutate signal state directly.');
    expect(ctx.context).toContain('Current route is /bi-dashboard.');
  });

  it('should pin and unpin memory items by id or topic and update signals', async () => {
    await memoryService.init();

    const item = await memoryService.save({
      topic: 'cache/redis-ttl',
      content: 'Default TTL is 3600 seconds.',
      category: 'fact',
      pinned: false,
    });

    expect(memoryService.pinnedMemories().length).toBe(0);

    // Pin by topic
    const pinned = await memoryService.pin('cache/redis-ttl');
    expect(pinned).not.toBeNull();
    expect(pinned?.pinned).toBe(true);
    expect(memoryService.pinnedMemories().length).toBe(1);

    // Unpin by id
    const unpinned = await memoryService.unpin(item.id);
    expect(unpinned).not.toBeNull();
    expect(unpinned?.pinned).toBe(false);
    expect(memoryService.pinnedMemories().length).toBe(0);
  });

  it('should delete memory item by id and update signals and search index', async () => {
    await memoryService.init();

    const item = await memoryService.save({
      topic: 'temp/cache',
      content: 'Temporary buffer content.',
    });

    expect(memoryService.memories().length).toBe(1);

    const deleted = await memoryService.delete(item.id);
    expect(deleted).toBe(true);
    expect(memoryService.memories().length).toBe(0);
    expect(memoryService.stats().totalCount).toBe(0);

    const searchAfterDelete = await memoryService.search('buffer');
    expect(searchAfterDelete.length).toBe(0);
  });

  it('should clear all memories, reset search index and signals', async () => {
    await memoryService.init();

    await memoryService.save({ topic: 't1', content: 'c1', pinned: true });
    await memoryService.save({ topic: 't2', content: 'c2' });

    expect(memoryService.memories().length).toBe(2);

    await memoryService.clear();

    expect(memoryService.memories().length).toBe(0);
    expect(memoryService.pinnedMemories().length).toBe(0);
    expect(memoryService.stats().totalCount).toBe(0);
  });

  it('should save and retrieve session summaries and update activeSession signal', async () => {
    await memoryService.init();

    expect(memoryService.activeSession()).toBeNull();

    const session = await memoryService.saveSession(
      'Completed data pipeline analysis and identified 3 schema optimization areas.',
      ['Add compound index on user_id and created_at', 'Use batch updates for telemetry']
    );

    expect(session.sessionId).toBeDefined();
    expect(session.summary).toContain('Completed data pipeline analysis');
    expect(session.keyLearnings.length).toBe(2);
    expect(memoryService.activeSession()?.sessionId).toBe(session.sessionId);

    const sessions = await memoryService.getSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].sessionId).toBe(session.sessionId);
  });
});

describe('provideWebMcpMemory Provider Factory & DI Resolution', () => {
  it('should provide WebMcpMemoryService, config, store, and search engine in DI', async () => {
    const providers = provideWebMcpMemory({
      bm25_k1: 1.5,
      bm25_b: 0.8,
      enablePassiveToolCapture: false,
    });

    const injector = Injector.create({
      providers: [providers],
    });

    const memoryService = injector.get(WebMcpMemoryService);
    const config = injector.get(WEBMCP_MEMORY_CONFIG);
    const store = injector.get(WEBMCP_MEMORY_STORE);
    const searchEngine = injector.get(WEBMCP_MEMORY_SEARCH_ENGINE);

    expect(memoryService).toBeDefined();
    expect(config.bm25_k1).toBe(1.5);
    expect(config.bm25_b).toBe(0.8);
    expect(config.enablePassiveToolCapture).toBe(false);
    expect(store).toBeDefined();
    expect(searchEngine).toBeDefined();

    await memoryService.init();
    expect(memoryService.isReady()).toBe(true);
  });
});
