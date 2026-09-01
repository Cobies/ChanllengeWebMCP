/**
 * WebMCP In-Browser Memory System - Declarative Memory Tools
 * Standardized client-side tools for browser AI agent episodic & semantic memory.
 * @cobies/webmcp-angular
 */

import { WebMcpToolDefinition } from '../core/webmcp.types';
import { IWebMcpMemoryStore } from './memory-store.interface';
import { IWebMcpMemorySearchEngine } from './bm25-search-engine';
import {
  MemoryCategory,
  MemoryItem,
  MemorySearchResult,
  MemorySessionSummary,
} from './memory.types';

/* ==========================================================================
   Tool Parameter & Result Type Interfaces
   ========================================================================== */

export interface MemSaveParams {
  topic: string;
  content: string;
  category?: MemoryCategory;
  tags?: string[];
  pinned?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MemSaveResult {
  success: boolean;
  action: 'created' | 'updated';
  item: MemoryItem;
  id: string;
  topic: string;
}

export interface MemSearchParams {
  query: string;
  category?: MemoryCategory;
  tags?: string[];
  pinnedOnly?: boolean;
  pinned_only?: boolean;
  topK?: number;
  top_k?: number;
  minScore?: number;
  min_score?: number;
}

export interface MemSearchResultPayload {
  query: string;
  count: number;
  results: MemorySearchResult[];
  total: number;
}

export interface MemContextParams {
  topic?: string;
  category?: MemoryCategory;
  limit?: number;
  maxTokens?: number;
  includePinned?: boolean;
  include_pinned_rules?: boolean;
}

export interface MemContextResult {
  context: string;
  pinnedRules: MemoryItem[];
  relevantObservations: MemoryItem[];
  totalRetrieved: number;
}

export interface MemPinParams {
  id?: string;
  topic?: string;
  pinned?: boolean;
}

export interface MemPinResult {
  success: boolean;
  action: 'pinned';
  item: MemoryItem;
}

export interface MemUnpinParams {
  id?: string;
  topic?: string;
}

export interface MemUnpinResult {
  success: boolean;
  action: 'unpinned';
  item: MemoryItem;
}

export interface MemSessionSummaryParams {
  action?: 'save' | 'get' | 'list';
  sessionId?: string;
  session_id?: string;
  sessionName?: string;
  summary?: string;
  topicsCovered?: string[];
  topics?: string[];
  keyLearnings?: string[];
  key_learnings?: string[];
  toolsUsedCount?: Record<string, number>;
  limit?: number;
  retrieve_recent?: number;
  metadata?: Record<string, unknown>;
}

export interface MemSessionSummaryResult {
  success: boolean;
  action?: 'saved';
  sessionId?: string;
  session?: MemorySessionSummary | null;
  count?: number;
  summaries?: MemorySessionSummary[];
}

const VALID_CATEGORIES: MemoryCategory[] = [
  'observation',
  'fact',
  'rule',
  'context',
  'preference',
  'session',
];

function generateUniqueId(prefix = 'mem'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ==========================================================================
   Tool Factory Functions
   ========================================================================== */

/**
 * 1. mem_save: Save or update an episodic observation, learned fact, business rule, context, preference, or session note.
 */
export function createMemSaveTool(
  store: IWebMcpMemoryStore,
  searchEngine: IWebMcpMemorySearchEngine
): WebMcpToolDefinition<MemSaveParams, MemSaveResult> {
  return {
    name: 'mem_save',
    description:
      'Save or update an episodic observation, learned fact, business rule, context, preference, or session note in the browser agent memory.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Brief semantic topic or unique key (e.g., "auth/jwt-strategy")',
        },
        content: {
          type: 'string',
          description: 'Detailed markdown or text content of the memory',
        },
        category: {
          type: 'string',
          enum: VALID_CATEGORIES,
          description: 'Classification category (default: "observation")',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Searchable keyword tags',
        },
        pinned: {
          type: 'boolean',
          description: 'If true, pins memory to prevent eviction and surface in active context',
        },
        metadata: {
          type: 'object',
          description: 'Optional structured metadata',
        },
      },
      required: ['topic', 'content'],
    },
    handler: async (params: MemSaveParams = {} as MemSaveParams): Promise<MemSaveResult> => {
      if (!params || typeof params !== 'object') {
        throw new Error('mem_save: Invalid parameters. An object with topic and content is required.');
      }

      const rawTopic = typeof params.topic === 'string' ? params.topic.trim() : '';
      const rawContent = typeof params.content === 'string' ? params.content.trim() : '';

      if (!rawTopic || !rawContent) {
        throw new Error('mem_save: "topic" and "content" are required parameters and must be non-empty strings.');
      }

      const category: MemoryCategory =
        params.category && VALID_CATEGORIES.includes(params.category)
          ? params.category
          : 'observation';

      const tags = Array.isArray(params.tags)
        ? params.tags.map((t) => String(t).trim()).filter(Boolean)
        : [];

      const pinned = typeof params.pinned === 'boolean' ? params.pinned : false;
      const metadata =
        params.metadata && typeof params.metadata === 'object' && !Array.isArray(params.metadata)
          ? params.metadata
          : {};

      const existing = await store.getByTopic(rawTopic);

      if (existing) {
        existing.content = rawContent;
        if (params.category) {
          existing.category = category;
        }
        if (params.tags) {
          existing.tags = tags;
        }
        if (typeof params.pinned === 'boolean') {
          existing.pinned = pinned;
        }
        if (params.metadata) {
          existing.metadata = { ...existing.metadata, ...metadata };
        }
        existing.updatedAt = Date.now();

        const saved = await store.save(existing);
        searchEngine.updateDocument(saved);

        return {
          success: true,
          action: 'updated',
          item: saved,
          id: saved.id,
          topic: saved.topic,
        };
      }

      const now = Date.now();
      const newItem: MemoryItem = {
        id: generateUniqueId('mem'),
        topic: rawTopic,
        content: rawContent,
        category,
        tags,
        pinned,
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
        accessCount: 0,
        metadata,
      };

      const saved = await store.save(newItem);
      searchEngine.addDocument(saved);

      return {
        success: true,
        action: 'created',
        item: saved,
        id: saved.id,
        topic: saved.topic,
      };
    },
  };
}

/**
 * 2. mem_search: Search stored agent memories by keywords, topics, or semantic relevance with BM25 ranking.
 */
export function createMemSearchTool(
  store: IWebMcpMemoryStore,
  searchEngine: IWebMcpMemorySearchEngine
): WebMcpToolDefinition<MemSearchParams, MemSearchResultPayload> {
  return {
    name: 'mem_search',
    description:
      'Search stored agent memories by keywords, topics, or semantic relevance with BM25 ranking and optional category/tag filters.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language or keyword search query',
        },
        category: {
          type: 'string',
          enum: VALID_CATEGORIES,
          description: 'Optional category filter or classification',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tag filtering array',
        },
        pinnedOnly: {
          type: 'boolean',
          description: 'Filter only pinned memories',
        },
        pinned_only: {
          type: 'boolean',
          description: 'Alias for pinnedOnly',
        },
        topK: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
        top_k: {
          type: 'number',
          description: 'Alias for topK',
        },
        minScore: {
          type: 'number',
          description: 'Minimum BM25 score threshold (default: 0.1)',
        },
        min_score: {
          type: 'number',
          description: 'Alias for minScore',
        },
      },
      required: ['query'],
    },
    handler: async (params: MemSearchParams = {} as MemSearchParams): Promise<MemSearchResultPayload> => {
      if (!params || typeof params !== 'object' || typeof params.query !== 'string') {
        throw new Error('mem_search: "query" parameter is required and must be a string.');
      }

      const query = params.query.trim();
      if (!query) {
        throw new Error('mem_search: "query" parameter cannot be empty.');
      }

      const topK =
        typeof params.topK === 'number'
          ? params.topK
          : typeof params.top_k === 'number'
          ? params.top_k
          : 10;

      const minScore =
        typeof params.minScore === 'number'
          ? params.minScore
          : typeof params.min_score === 'number'
          ? params.min_score
          : 0.1;

      const category =
        typeof params.category === 'string' && VALID_CATEGORIES.includes(params.category)
          ? params.category
          : undefined;

      const tags = Array.isArray(params.tags) ? params.tags : undefined;

      const pinnedOnly =
        typeof params.pinnedOnly === 'boolean'
          ? params.pinnedOnly
          : typeof params.pinned_only === 'boolean'
          ? params.pinned_only
          : undefined;

      const results = searchEngine.search(query, {
        topK,
        minScore,
        category,
        tags,
        pinnedOnly,
      });

      // Track access on retrieved items in store
      for (const res of results) {
        const item = res.item;
        item.lastAccessedAt = Date.now();
        item.accessCount = (item.accessCount || 0) + 1;
        await store.save(item);
      }

      return {
        query,
        count: results.length,
        results,
        total: results.length,
      };
    },
  };
}

/**
 * 3. mem_context: Retrieve the consolidated active project context, pinned rules, and relevant recent observations for prompt injection.
 */
export function createMemContextTool(
  store: IWebMcpMemoryStore,
  searchEngine: IWebMcpMemorySearchEngine
): WebMcpToolDefinition<MemContextParams, MemContextResult> {
  return {
    name: 'mem_context',
    description:
      'Retrieve the consolidated active project context, pinned rules, and relevant recent observations for prompt injection.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Optional specific topic filter or semantic query',
        },
        category: {
          type: 'string',
          enum: VALID_CATEGORIES,
          description: 'Optional specific category filter',
        },
        limit: {
          type: 'number',
          description: 'Max number of context items to retrieve (default: 10)',
        },
        maxTokens: {
          type: 'number',
          description: 'Approximate maximum token budget for generated context block',
        },
        includePinned: {
          type: 'boolean',
          description: 'Whether to include pinned rules (default: true)',
        },
        include_pinned_rules: {
          type: 'boolean',
          description: 'Alias for includePinned',
        },
      },
    },
    handler: async (params: MemContextParams = {}): Promise<MemContextResult> => {
      const includePinned =
        params.includePinned !== false && params.include_pinned_rules !== false;
      const category =
        params.category && VALID_CATEGORIES.includes(params.category)
          ? params.category
          : undefined;
      const topic = typeof params.topic === 'string' ? params.topic.trim().toLowerCase() : undefined;
      const limit = typeof params.limit === 'number' && params.limit > 0 ? params.limit : 20;

      let allItems: MemoryItem[] = [];

      if (category) {
        allItems = await store.getAll({ category });
      } else {
        allItems = await store.getAll();
      }

      if (topic) {
        allItems = allItems.filter((i) => i.topic.toLowerCase().includes(topic));
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

      const retrievedItems = [...pinnedRules, ...activeContext, ...relevantObservations].slice(0, limit);

      // Build consolidated markdown string block
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

      // MaxTokens truncation if budget specified (approx 4 chars/token)
      if (params.maxTokens && params.maxTokens > 0 && markdownContext.length > params.maxTokens * 4) {
        markdownContext = markdownContext.slice(0, params.maxTokens * 4) + '\n... [truncated]';
      }

      return {
        context: markdownContext,
        pinnedRules,
        relevantObservations,
        totalRetrieved: retrievedItems.length,
      };
    },
  };
}

/**
 * 4. mem_pin: Pin a critical memory, rule, or preference so it is never evicted and is always loaded into the agent context.
 */
export function createMemPinTool(
  store: IWebMcpMemoryStore,
  searchEngine: IWebMcpMemorySearchEngine
): WebMcpToolDefinition<MemPinParams, MemPinResult> {
  return {
    name: 'mem_pin',
    description:
      'Pin a critical memory, rule, or preference so it is never evicted and is always loaded into the agent context.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Target memory ID to pin',
        },
        topic: {
          type: 'string',
          description: 'Target memory topic (if ID is not known)',
        },
        pinned: {
          type: 'boolean',
          description: 'Whether to pin (default: true)',
        },
      },
    },
    handler: async (params: MemPinParams = {}): Promise<MemPinResult> => {
      const id = typeof params.id === 'string' ? params.id.trim() : undefined;
      const topic = typeof params.topic === 'string' ? params.topic.trim() : undefined;

      if (!id && !topic) {
        throw new Error('mem_pin: Either "id" or "topic" parameter must be provided.');
      }

      let item: MemoryItem | null = null;
      if (id) {
        item = await store.get(id);
      }
      if (!item && topic) {
        item = await store.getByTopic(topic);
      }

      if (!item) {
        throw new Error(`mem_pin: Memory item not found for id="${id || ''}" topic="${topic || ''}".`);
      }

      item.pinned = typeof params.pinned === 'boolean' ? params.pinned : true;
      item.updatedAt = Date.now();

      const updated = await store.save(item);
      searchEngine.updateDocument(updated);

      return {
        success: true,
        action: 'pinned',
        item: updated,
      };
    },
  };
}

/**
 * 5. mem_unpin: Unpin a previously pinned memory item.
 */
export function createMemUnpinTool(
  store: IWebMcpMemoryStore,
  searchEngine: IWebMcpMemorySearchEngine
): WebMcpToolDefinition<MemUnpinParams, MemUnpinResult> {
  return {
    name: 'mem_unpin',
    description: 'Unpin a previously pinned memory item.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Target memory ID to unpin',
        },
        topic: {
          type: 'string',
          description: 'Target memory topic',
        },
      },
    },
    handler: async (params: MemUnpinParams = {}): Promise<MemUnpinResult> => {
      const id = typeof params.id === 'string' ? params.id.trim() : undefined;
      const topic = typeof params.topic === 'string' ? params.topic.trim() : undefined;

      if (!id && !topic) {
        throw new Error('mem_unpin: Either "id" or "topic" parameter must be provided.');
      }

      let item: MemoryItem | null = null;
      if (id) {
        item = await store.get(id);
      }
      if (!item && topic) {
        item = await store.getByTopic(topic);
      }

      if (!item) {
        throw new Error(`mem_unpin: Memory item not found for id="${id || ''}" topic="${topic || ''}".`);
      }

      item.pinned = false;
      item.updatedAt = Date.now();

      const updated = await store.save(item);
      searchEngine.updateDocument(updated);

      return {
        success: true,
        action: 'unpinned',
        item: updated,
      };
    },
  };
}

/**
 * 6. mem_session_summary: Record, retrieve, or list agent session summaries across multi-turn interactions or workspace visits.
 */
export function createMemSessionSummaryTool(
  store: IWebMcpMemoryStore,
  _searchEngine: IWebMcpMemorySearchEngine
): WebMcpToolDefinition<MemSessionSummaryParams, MemSessionSummaryResult> {
  return {
    name: 'mem_session_summary',
    description:
      'Record, retrieve, or list agent session summaries across multi-turn interactions or workspace visits.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['save', 'get', 'list'],
          description:
            'Action to perform: "save" summary, "get" specific session, or "list" recent summaries (default: "save")',
        },
        sessionId: {
          type: 'string',
          description: 'Session identifier (optional for save/list; auto-generated if missing on save)',
        },
        session_id: {
          type: 'string',
          description: 'Alias for sessionId',
        },
        sessionName: {
          type: 'string',
          description: 'Human-readable session title or name',
        },
        summary: {
          type: 'string',
          description: 'Summary narrative of the session',
        },
        topicsCovered: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of topics addressed during the session',
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alias for topicsCovered',
        },
        keyLearnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of key findings, insights, or learned rules',
        },
        key_learnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alias for keyLearnings',
        },
        toolsUsedCount: {
          type: 'object',
          description: 'Map of tool names to invocation counts',
        },
        limit: {
          type: 'number',
          description: 'Max number of past session summaries to retrieve (default: 5)',
        },
        retrieve_recent: {
          type: 'number',
          description: 'Alias for limit / past sessions to retrieve',
        },
        metadata: {
          type: 'object',
          description: 'Optional structured session metadata',
        },
      },
    },
    handler: async (
      params: MemSessionSummaryParams = {}
    ): Promise<MemSessionSummaryResult> => {
      const action =
        typeof params.action === 'string'
          ? params.action.toLowerCase()
          : params.retrieve_recent !== undefined
          ? 'list'
          : 'save';

      if (action === 'list') {
        const limit =
          typeof params.retrieve_recent === 'number'
            ? params.retrieve_recent
            : typeof params.limit === 'number'
            ? params.limit
            : 10;
        const summaries = await store.getSessionSummaries(limit);
        return {
          success: true,
          count: summaries.length,
          summaries,
        };
      }

      if (action === 'get') {
        const sid = params.sessionId || params.session_id;
        if (!sid || typeof sid !== 'string' || !sid.trim()) {
          throw new Error('mem_session_summary: "sessionId" is required when action is "get".');
        }
        const all = await store.getSessionSummaries(200);
        const found = all.find((s) => s.sessionId === sid.trim()) || null;
        return {
          success: true,
          session: found,
        };
      }

      // Default: action === 'save'
      const summary = typeof params.summary === 'string' ? params.summary.trim() : '';
      if (!summary) {
        throw new Error('mem_session_summary: "summary" is required when saving a session summary.');
      }

      const sid =
        (typeof params.sessionId === 'string' && params.sessionId.trim()) ||
        (typeof params.session_id === 'string' && params.session_id.trim()) ||
        generateUniqueId('sess');

      const sessionName =
        typeof params.sessionName === 'string' ? params.sessionName.trim() : undefined;

      const rawTopics = Array.isArray(params.topicsCovered)
        ? params.topicsCovered
        : Array.isArray(params.topics)
        ? params.topics
        : [];
      const topicsCovered = rawTopics.map((t) => String(t).trim()).filter(Boolean);

      const rawLearnings = Array.isArray(params.keyLearnings)
        ? params.keyLearnings
        : Array.isArray(params.key_learnings)
        ? params.key_learnings
        : [];
      const keyLearnings = rawLearnings.map((l) => String(l).trim()).filter(Boolean);

      const toolsUsedCount =
        params.toolsUsedCount &&
        typeof params.toolsUsedCount === 'object' &&
        !Array.isArray(params.toolsUsedCount)
          ? params.toolsUsedCount
          : {};

      const metadata =
        params.metadata && typeof params.metadata === 'object' && !Array.isArray(params.metadata)
          ? params.metadata
          : {};

      const sessionSummary: MemorySessionSummary = {
        sessionId: sid,
        sessionName,
        timestamp: Date.now(),
        summary,
        topicsCovered,
        keyLearnings,
        toolsUsedCount,
        metadata,
      };

      await store.saveSessionSummary(sessionSummary);

      return {
        success: true,
        action: 'saved',
        sessionId: sid,
        session: sessionSummary,
      };
    },
  };
}

/**
 * Factory function creating all 6 declarative WebMCP Memory Tools.
 *
 * @param store Storage backend (WebMcpIndexedDbStore or WebMcpInMemoryStore)
 * @param searchEngine Lexical BM25 search engine
 * @returns Array of WebMcpToolDefinition objects ready for registration
 */
export function createWebMcpMemoryTools(
  store: IWebMcpMemoryStore,
  searchEngine: IWebMcpMemorySearchEngine
): WebMcpToolDefinition[] {
  return [
    createMemSaveTool(store, searchEngine) as unknown as WebMcpToolDefinition,
    createMemSearchTool(store, searchEngine) as unknown as WebMcpToolDefinition,
    createMemContextTool(store, searchEngine) as unknown as WebMcpToolDefinition,
    createMemPinTool(store, searchEngine) as unknown as WebMcpToolDefinition,
    createMemUnpinTool(store, searchEngine) as unknown as WebMcpToolDefinition,
    createMemSessionSummaryTool(store, searchEngine) as unknown as WebMcpToolDefinition,
  ];
}
