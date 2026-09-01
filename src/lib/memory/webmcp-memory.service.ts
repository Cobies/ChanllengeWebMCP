import {
  Injectable,
  Inject,
  Optional,
  Signal,
  signal,
  computed,
} from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import { IWebMcpMemoryStore } from './memory-store.interface';
import { WebMcpIndexedDbStore } from './indexeddb-store';
import { WebMcpInMemoryStore } from './in-memory-store';
import {
  IWebMcpMemorySearchEngine,
  WebMcpBm25SearchEngine,
  MemorySearchOptions,
} from './bm25-search-engine';
import { createWebMcpMemoryTools } from './memory-tools';
import {
  MemoryCategory,
  MemoryItem,
  MemoryQuery,
  MemorySearchResult,
  MemorySessionSummary,
  MemoryStats,
  WebMcpMemoryConfig,
} from './memory.types';
import {
  WEBMCP_MEMORY_CONFIG,
  WEBMCP_MEMORY_STORE,
  WEBMCP_MEMORY_SEARCH_ENGINE,
} from './memory.tokens';

function generateMemoryId(prefix = 'mem'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
}

const DEFAULT_STATS: MemoryStats = {
  totalCount: 0,
  pinnedCount: 0,
  categoryCounts: {
    observation: 0,
    fact: 0,
    rule: 0,
    context: 0,
    preference: 0,
    session: 0,
  },
  estimatedStorageBytes: 0,
  engineType: 'in-memory',
};

/**
 * WebMcpMemoryService - Reactive Zoneless Angular 22 Signals Memory Manager.
 * Handles episodic & semantic memory, BM25 lexical search, auto-tool registration, and session logging.
 */
@Injectable({ providedIn: 'root' })
export class WebMcpMemoryService {
  private readonly config: WebMcpMemoryConfig;
  readonly store: IWebMcpMemoryStore;
  readonly searchEngine: IWebMcpMemorySearchEngine;
  private readonly webmcpService: WebMcpService | null;

  // Reactive Angular Signals
  private readonly _memories = signal<MemoryItem[]>([]);
  readonly memories: Signal<MemoryItem[]> = this._memories.asReadonly();

  readonly pinnedMemories: Signal<MemoryItem[]> = computed(() =>
    this._memories().filter((m) => m.pinned)
  );

  private readonly _stats = signal<MemoryStats>(DEFAULT_STATS);
  readonly stats: Signal<MemoryStats> = this._stats.asReadonly();

  private readonly _isReady = signal<boolean>(false);
  readonly isReady: Signal<boolean> = this._isReady.asReadonly();

  private readonly _recentQueries = signal<string[]>([]);
  readonly recentQueries: Signal<string[]> = this._recentQueries.asReadonly();

  private readonly _activeSession = signal<MemorySessionSummary | null>(null);
  readonly activeSession: Signal<MemorySessionSummary | null> = this._activeSession.asReadonly();

  constructor(
    @Optional() @Inject(WEBMCP_MEMORY_CONFIG) config?: Partial<WebMcpMemoryConfig>,
    @Optional() @Inject(WEBMCP_MEMORY_STORE) store?: IWebMcpMemoryStore,
    @Optional() @Inject(WEBMCP_MEMORY_SEARCH_ENGINE) searchEngine?: IWebMcpMemorySearchEngine,
    @Optional() @Inject(WebMcpService) webmcpService?: WebMcpService
  ) {
    this.config = {
      dbName: 'webmcp_memory_db',
      dbVersion: 1,
      bm25_k1: 1.2,
      bm25_b: 0.75,
      enablePassiveToolCapture: true,
      enableNavigationCapture: true,
      maxMemories: 10000,
      autoRegisterTools: true,
      ...(config || {}),
    };

    if (store) {
      this.store = store;
    } else if (typeof indexedDB !== 'undefined') {
      this.store = new WebMcpIndexedDbStore(this.config);
    } else {
      this.store = new WebMcpInMemoryStore(this.config);
    }

    this.searchEngine =
      searchEngine ??
      new WebMcpBm25SearchEngine({
        k1: this.config.bm25_k1,
        b: this.config.bm25_b,
      });

    this.webmcpService = webmcpService ?? null;
  }

  /**
   * Initialize memory store, hydrate search index, and register standard WebMCP tools.
   */
  async init(): Promise<void> {
    if (this._isReady()) {
      return;
    }

    await this.store.init();
    const allItems = await this.store.getAll();
    this.searchEngine.index(allItems);

    await this.refreshState();
    this._isReady.set(true);

    if (this.config.autoRegisterTools !== false && this.webmcpService) {
      const memoryTools = createWebMcpMemoryTools(this.store, this.searchEngine);
      for (const tool of memoryTools) {
        this.webmcpService.registerTool(tool);
      }
    }
  }

  /**
   * Persist a memory item (observation, fact, rule, context, preference, session).
   * Updates or creates record and mutates BM25 index & reactive signals.
   */
  async save(
    item: Partial<MemoryItem> & { topic: string; content: string }
  ): Promise<MemoryItem> {
    const trimmedTopic = item.topic.trim();
    let existing: MemoryItem | null = null;

    if (item.id) {
      existing = await this.store.get(item.id);
    } else if (
      item.category === 'rule' ||
      item.category === 'fact' ||
      item.category === 'preference' ||
      (!item.category &&
        !trimmedTopic.startsWith('navigation/') &&
        !trimmedTopic.startsWith('tool_exec') &&
        !trimmedTopic.startsWith('tool_error'))
    ) {
      existing = await this.store.getByTopic(trimmedTopic);
    }

    const now = Date.now();
    let recordToSave: MemoryItem;

    if (existing) {
      existing.content = item.content;
      if (item.category) existing.category = item.category;
      if (item.tags) existing.tags = item.tags;
      if (item.pinned !== undefined) existing.pinned = item.pinned;
      if (item.metadata) existing.metadata = { ...existing.metadata, ...item.metadata };
      existing.updatedAt = now;
      existing.lastAccessedAt = now;
      recordToSave = existing;
    } else {
      recordToSave = {
        id: item.id || generateMemoryId('mem'),
        topic: trimmedTopic,
        content: item.content,
        category: item.category ?? 'observation',
        tags: Array.isArray(item.tags) ? item.tags : [],
        pinned: Boolean(item.pinned),
        createdAt: item.createdAt ?? now,
        updatedAt: now,
        lastAccessedAt: now,
        accessCount: item.accessCount ?? 0,
        metadata: item.metadata || {},
      };
    }

    const saved = await this.store.save(recordToSave);
    this.searchEngine.updateDocument(saved);

    await this.refreshState();
    return saved;
  }

  /**
   * Execute BM25 lexical search and record query in recentQueries signal.
   */
  async search(
    query: string,
    options?: Omit<MemoryQuery, 'query'> | MemorySearchOptions
  ): Promise<MemorySearchResult[]> {
    const trimmedQuery = (query || '').trim();
    if (trimmedQuery) {
      this._recentQueries.update((queries) => [
        trimmedQuery,
        ...queries.filter((q) => q !== trimmedQuery),
      ].slice(0, 20));
    }

    return this.searchEngine.search(trimmedQuery, options);
  }

  /**
   * Retrieve consolidated working context including pinned rules and active context/observations.
   */
  async getContext(
    options?:
      | {
          category?: MemoryCategory | MemoryCategory[];
          maxTokens?: number;
          includePinned?: boolean;
          topic?: string;
          limit?: number;
        }
      | string,
    limit?: number
  ): Promise<{
    context: string;
    pinnedRules: MemoryItem[];
    relevantObservations: MemoryItem[];
    totalRetrieved: number;
    activeContext?: MemoryItem[];
    formattedContext?: string;
  }> {
    let topicFilter: string | undefined;
    let categoryFilter: MemoryCategory | undefined;
    let limitCount = 20;
    let maxTokens: number | undefined;
    let includePinned = true;

    if (typeof options === 'string') {
      topicFilter = options.trim().toLowerCase();
      if (typeof limit === 'number' && limit > 0) limitCount = limit;
    } else if (options && typeof options === 'object') {
      if (options.topic) topicFilter = options.topic.trim().toLowerCase();
      if (typeof options.category === 'string') categoryFilter = options.category;
      if (typeof options.limit === 'number' && options.limit > 0) limitCount = options.limit;
      if (typeof options.maxTokens === 'number' && options.maxTokens > 0) maxTokens = options.maxTokens;
      if (options.includePinned !== undefined) includePinned = options.includePinned;
    }

    let allItems: MemoryItem[] = [];
    if (categoryFilter) {
      allItems = await this.store.getAll({ category: categoryFilter });
    } else {
      allItems = await this.store.getAll();
    }

    if (topicFilter) {
      allItems = allItems.filter((i) => i.topic.toLowerCase().includes(topicFilter!));
    }

    const pinnedRules: MemoryItem[] = includePinned
      ? allItems.filter((i) => i.pinned || (i.category === 'rule' && i.pinned))
      : [];

    const activeContext: MemoryItem[] = allItems.filter(
      (i) => i.category === 'context' && (!includePinned || !i.pinned)
    );

    const relevantObservations: MemoryItem[] = allItems.filter(
      (i) =>
        (i.category === 'observation' || i.category === 'fact' || i.category === 'preference') &&
        (!includePinned || !i.pinned)
    );

    const retrievedItems = [...pinnedRules, ...activeContext, ...relevantObservations].slice(0, limitCount);

    const sections: string[] = [];
    if (pinnedRules.length > 0) {
      sections.push(
        '## Pinned Rules & Invariants\n' +
          pinnedRules.map((r) => `- [${r.category}/${r.topic}] ${r.content}`).join('\n')
      );
    }
    if (activeContext.length > 0) {
      sections.push(
        '## Active Context & Facts\n' +
          activeContext.map((c) => `- [${c.category}/${c.topic}] ${c.content}`).join('\n')
      );
    }
    if (relevantObservations.length > 0) {
      sections.push(
        '## Recent Observations & Preferences\n' +
          relevantObservations.map((o) => `- [${o.category}/${o.topic}] ${o.content}`).join('\n')
      );
    }

    let markdownContext = '';
    if (sections.length > 0) {
      markdownContext = '# WebMCP Agent Working Context\n\n' + sections.join('\n\n');
    }

    if (maxTokens && maxTokens > 0 && markdownContext.length > maxTokens * 4) {
      markdownContext = markdownContext.slice(0, maxTokens * 4) + '\n... [truncated]';
    }

    return {
      context: markdownContext,
      formattedContext: markdownContext,
      pinnedRules,
      activeContext,
      relevantObservations,
      totalRetrieved: retrievedItems.length,
    };
  }

  /**
   * Pin a memory item by ID or topic.
   */
  async pin(idOrTopic: string, pinned = true): Promise<MemoryItem | null> {
    const target = idOrTopic.trim();
    let item = await this.store.get(target);
    if (!item) {
      item = await this.store.getByTopic(target);
    }

    if (!item) {
      return null;
    }

    item.pinned = pinned;
    item.updatedAt = Date.now();
    const updated = await this.store.save(item);
    this.searchEngine.updateDocument(updated);

    await this.refreshState();
    return updated;
  }

  /**
   * Unpin a memory item by ID or topic.
   */
  async unpin(idOrTopic: string): Promise<MemoryItem | null> {
    return this.pin(idOrTopic, false);
  }

  /**
   * Delete a memory item by ID.
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await this.store.delete(id);
    if (deleted) {
      this.searchEngine.removeDocument(id);
      await this.refreshState();
    }
    return deleted;
  }

  /**
   * Clear all memories and reset search engine & signals.
   */
  async clear(): Promise<void> {
    await this.store.clear();
    this.searchEngine.clear();
    await this.refreshState();
  }

  /**
   * Save an episodic session summary log.
   */
  async saveSession(
    summary: string,
    keyLearnings?: string[],
    topicsCovered?: string[],
    metadata?: Record<string, unknown>
  ): Promise<MemorySessionSummary> {
    const sessionSummary: MemorySessionSummary = {
      sessionId: generateMemoryId('sess'),
      timestamp: Date.now(),
      summary,
      topicsCovered: topicsCovered || [],
      keyLearnings: keyLearnings || [],
      toolsUsedCount: {},
      metadata: metadata || {},
    };

    await this.store.saveSessionSummary(sessionSummary);
    this._activeSession.set(sessionSummary);
    return sessionSummary;
  }

  /**
   * Alias for saveSession with structured parameter object.
   */
  async recordSessionSummary(summaryData: {
    summary: string;
    topicsCovered?: string[];
    keyLearnings?: string[];
    toolsUsedCount?: Record<string, number>;
    metadata?: Record<string, unknown>;
  }): Promise<MemorySessionSummary> {
    const sessionSummary: MemorySessionSummary = {
      sessionId: generateMemoryId('sess'),
      timestamp: Date.now(),
      summary: summaryData.summary,
      topicsCovered: summaryData.topicsCovered || [],
      keyLearnings: summaryData.keyLearnings || [],
      toolsUsedCount: summaryData.toolsUsedCount || {},
      metadata: summaryData.metadata || {},
    };

    await this.store.saveSessionSummary(sessionSummary);
    this._activeSession.set(sessionSummary);
    return sessionSummary;
  }

  /**
   * Retrieve previous session summaries sorted descending by timestamp.
   */
  async getSessions(limit = 10): Promise<MemorySessionSummary[]> {
    return this.store.getSessionSummaries(limit);
  }

  /**
   * Alias for getSessions.
   */
  async getSessionSummaries(limit = 10): Promise<MemorySessionSummary[]> {
    return this.getSessions(limit);
  }

  /**
   * Refresh reactive state signals (_memories, _stats).
   */
  async refreshState(): Promise<void> {
    const all = await this.store.getAll();
    this._memories.set(all);
    const stats = await this.store.getStats();
    this._stats.set(stats);
  }
}
