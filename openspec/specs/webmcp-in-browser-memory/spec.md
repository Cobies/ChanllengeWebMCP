# Specification: WebMCP In-Browser Memory System

## Capability: `webmcp-in-browser-memory`

## Purpose
Define the formal technical specification for a zero-dependency, client-side episodic and semantic memory system for the WebMCP Angular Toolkit (`@cobies/webmcp-angular`). This capability provides browser AI agents with persistent IndexedDB storage, in-memory fallback for SSR/private browsing, pure TypeScript BM25 lexical search, standard WebMCP memory tools (`mem_save`, `mem_search`, `mem_context`, `mem_pin`, `mem_unpin`, `mem_session_summary`), reactive Angular 22 Signals state, passive execution interceptors, navigation tracking, and a live Memory Inspector UI.

---

## 1. Domain Types & Data Contracts

All models SHALL be defined in `src/lib/memory/memory.types.ts`.

### 1.1 Category & Item Model Contracts

```typescript
export type MemoryCategory =
  | 'observation'
  | 'fact'
  | 'rule'
  | 'context'
  | 'preference'
  | 'session';

export interface MemoryItem {
  id: string;
  topic: string;
  content: string;
  category: MemoryCategory;
  tags: string[];
  pinned: boolean;
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
  lastAccessedAt: number; // Unix timestamp ms
  accessCount: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  query: string;
  category?: MemoryCategory | MemoryCategory[];
  tags?: string[];
  pinnedOnly?: boolean;
  topK?: number; // Default: 10
  minScore?: number; // Default: 0.1
  dateRange?: {
    start?: number;
    end?: number;
  };
}

export interface MemorySearchResult {
  item: MemoryItem;
  score: number; // BM25 relevance score
  matchedTerms: string[];
}

export interface MemoryStats {
  totalCount: number;
  pinnedCount: number;
  categoryCounts: Record<MemoryCategory, number>;
  estimatedStorageBytes: number;
  engineType: 'indexeddb' | 'in-memory';
}

export interface MemorySessionSummary {
  sessionId: string;
  sessionName?: string;
  timestamp: number;
  summary: string;
  topicsCovered: string[];
  keyLearnings: string[];
  toolsUsedCount: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface WebMcpMemoryConfig {
  dbName?: string; // Default: 'webmcp_memory_db'
  dbVersion?: number; // Default: 1
  bm25_k1?: number; // Term frequency saturation (Default: 1.2)
  bm25_b?: number; // Document length normalization (Default: 0.75)
  enablePassiveToolCapture?: boolean; // Default: true
  enableNavigationCapture?: boolean; // Default: true
  maxMemories?: number; // Max records before LRU pruning of unpinned items (Default: 10000)
  autoRegisterTools?: boolean; // Default: true
}
```

---

## 2. Storage Engine Contract (`IWebMcpMemoryStore`)

The storage abstraction SHALL decouple browser storage backends and guarantee zero runtime failures when running in non-browser (SSR/Node.js) or restricted (IndexedDB-blocked private mode) contexts.

### 2.1 Interface Definition

```typescript
export interface IWebMcpMemoryStore {
  readonly engineType: 'indexeddb' | 'in-memory';
  readonly isAvailable: boolean;

  init(): Promise<void>;
  save(item: MemoryItem): Promise<MemoryItem>;
  get(id: string): Promise<MemoryItem | null>;
  getByTopic(topic: string): Promise<MemoryItem | null>;
  getAll(filter?: { category?: MemoryCategory; pinned?: boolean }): Promise<MemoryItem[]>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  setPinned(id: string, pinned: boolean): Promise<MemoryItem | null>;
  getStats(): Promise<MemoryStats>;
  saveSessionSummary(summary: MemorySessionSummary): Promise<void>;
  getSessionSummaries(limit?: number): Promise<MemorySessionSummary[]>;
}
```

### 2.2 Storage Engine Implementations

1. **`WebMcpIndexedDbStore`** (`src/lib/memory/indexeddb-store.ts`):
   - Database Name: Configurable via `WebMcpMemoryConfig.dbName` (default: `'webmcp_memory_db'`), version `1`.
   - Object Store `memories`: KeyPath `id`.
     - Indexes: `by_topic` (`topic`, non-unique), `by_category` (`category`, non-unique), `by_pinned` (`pinned`, non-unique), `by_createdAt` (`createdAt`, non-unique), `by_tags` (`tags`, multiEntry: true).
   - Object Store `sessions`: KeyPath `sessionId`.
     - Index: `by_timestamp` (`timestamp`, non-unique).
   - Transactions: All write operations MUST use atomic `'readwrite'` transactions with automatic promise resolution on `complete` and rejection on `error` or `abort`.

2. **`WebMcpInMemoryStore`** (`src/lib/memory/in-memory-store.ts`):
   - Internal state: `Map<string, MemoryItem>` and `Map<string, MemorySessionSummary>`.
   - Fallback trigger: Used automatically when `typeof indexedDB === 'undefined'`, `indexedDB.open` throws a `SecurityError` (e.g. private window with blocked storage), or when running in Angular SSR.

---

## 3. Pure TypeScript Lexical Search Engine Contract (`IWebMcpMemorySearchEngine`)

The lexical search engine MUST provide fast, zero-dependency BM25 ranking over all stored memories.

### 3.1 Interface Definition

```typescript
export interface MemorySearchOptions {
  topK?: number;
  minScore?: number;
  category?: MemoryCategory | MemoryCategory[];
  pinnedOnly?: boolean;
  tags?: string[];
}

export interface IWebMcpMemorySearchEngine {
  index(items: MemoryItem[]): void;
  addDocument(item: MemoryItem): void;
  updateDocument(item: MemoryItem): void;
  removeDocument(id: string): void;
  search(query: string, options?: MemorySearchOptions): MemorySearchResult[];
  clear(): void;
}
```

### 3.2 BM25 Algorithm & Tokenization Specification

1. **Tokenization Rules**:
   - Convert text to lowercase.
   - Split using Unicode-aware word boundary pattern: `/[^\p{L}\p{N}]+/u`.
   - Strip leading/trailing punctuation; discard empty tokens and tokens with length < 2 (unless digit).
   - Index document fields: `topic` (weight 2.0x), `content` (weight 1.0x), `tags` (weight 1.5x).

2. **BM25 Scoring Formula**:
   $$\text{Score}(D, Q) = \sum_{t \in Q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$
   - Default parameters: $k_1 = 1.2$, $b = 0.75$.
   - Smoothed Robertson-Spärck Jones IDF:
     $$\text{IDF}(t) = \ln\left(1 + \frac{N - n(t) + 0.5}{n(t) + 0.5}\right)$$
     where $N$ is total documents, $n(t)$ is document frequency containing term $t$, $|D|$ is document length, and $\text{avgdl}$ is average document length across the corpus.

3. **Incremental Maintenance**:
   - Adding/updating/removing documents dynamically updates term frequencies ($f(t, D)$), document lengths ($|D|$), corpus document count ($N$), and inverted index map without full corpus re-indexing.

---

## 4. Standard WebMCP Memory Tools Specification

The memory system SHALL provide 5 standardized WebMCP tool definitions conforming to `WebMcpToolDefinition` and register them into `WebMcpService`.

### 4.1 Tool Definitions & JSON Schemas

```typescript
// 1. mem_save
export const MEM_SAVE_TOOL: WebMcpToolDefinition = {
  name: 'mem_save',
  description: 'Persist an episodic observation, fact, rule, user preference, or context item into memory.',
  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Brief semantic topic or unique key (e.g., "auth/jwt-strategy")' },
      content: { type: 'string', description: 'Detailed markdown or text content of the memory' },
      category: {
        type: 'string',
        enum: ['observation', 'fact', 'rule', 'context', 'preference', 'session'],
        description: 'Classification category (default: "observation")'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Searchable keyword tags'
      },
      pinned: { type: 'boolean', description: 'If true, pins memory to prevent eviction and surface in active context' },
      metadata: { type: 'object', description: 'Optional structured metadata' }
    },
    required: ['topic', 'content']
  },
  handler: async (params) => { /* ... */ }
};

// 2. mem_search
export const MEM_SEARCH_TOOL: WebMcpToolDefinition = {
  name: 'mem_search',
  description: 'Search persistent memory items using BM25 relevance scoring and category filters.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural language or keyword search query' },
      category: {
        type: 'string',
        enum: ['observation', 'fact', 'rule', 'context', 'preference', 'session'],
        description: 'Optional category filter'
      },
      top_k: { type: 'number', description: 'Maximum number of results to return (default: 10)' },
      min_score: { type: 'number', description: 'Minimum BM25 score threshold (default: 0.1)' },
      pinned_only: { type: 'boolean', description: 'Filter only pinned memories' }
    },
    required: ['query']
  },
  handler: async (params) => { /* ... */ }
};

// 3. mem_context
export const MEM_CONTEXT_TOOL: WebMcpToolDefinition = {
  name: 'mem_context',
  description: 'Retrieve consolidated working context including all pinned rules and relevant recent context.',
  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Optional specific topic filter for context items' },
      limit: { type: 'number', description: 'Max number of context items to retrieve (default: 10)' },
      include_pinned_rules: { type: 'boolean', description: 'Whether to include pinned rules (default: true)' }
    }
  },
  handler: async (params) => { /* ... */ }
};

// 4. mem_pin / mem_unpin
export const MEM_PIN_TOOL: WebMcpToolDefinition = {
  name: 'mem_pin',
  description: 'Pin or unpin a critical rule, fact, or operational memory to guarantee persistence.',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Target memory ID' },
      topic: { type: 'string', description: 'Target memory topic (if ID is not known)' },
      pinned: { type: 'boolean', description: 'True to pin, false to unpin (default: true)' }
    }
  },
  handler: async (params) => { /* ... */ }
};

export const MEM_UNPIN_TOOL: WebMcpToolDefinition = {
  name: 'mem_unpin',
  description: 'Unpin a memory item by ID or topic.',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Target memory ID' },
      topic: { type: 'string', description: 'Target memory topic' }
    }
  },
  handler: async (params) => { /* ... */ }
};

// 5. mem_session_summary
export const MEM_SESSION_SUMMARY_TOOL: WebMcpToolDefinition = {
  name: 'mem_session_summary',
  description: 'Record or retrieve session summary logs containing key learnings, topics, and tool usage.',
  parameters: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'Summary narrative of the session' },
      topics: { type: 'array', items: { type: 'string' }, description: 'List of topics addressed' },
      key_learnings: { type: 'array', items: { type: 'string' }, description: 'List of key learnings/findings' },
      retrieve_recent: { type: 'number', description: 'Number of past session summaries to retrieve instead of saving' }
    }
  },
  handler: async (params) => { /* ... */ }
};
```

---

## 5. Reactive Angular 22 Signals Service (`WebMcpMemoryService`)

`WebMcpMemoryService` (`src/lib/memory/memory.service.ts`) SHALL be a singleton root service maintaining reactive Signals compatible with Zoneless Change Detection.

### 5.1 Service Contract

```typescript
@Injectable({ providedIn: 'root' })
export class WebMcpMemoryService {
  // Reactive Signals
  readonly memories: Signal<MemoryItem[]>;
  readonly pinnedMemories: Signal<MemoryItem[]>;
  readonly stats: Signal<MemoryStats>;
  readonly recentQueries: Signal<{ query: string; timestamp: number; resultCount: number }[]>;
  readonly isReady: Signal<boolean>;

  // Lifecycle & Operations
  init(): Promise<void>;
  save(item: { topic: string; content: string; category?: MemoryCategory; tags?: string[]; pinned?: boolean; metadata?: Record<string, unknown> }): Promise<MemoryItem>;
  search(query: string, options?: MemorySearchOptions): Promise<MemorySearchResult[]>;
  getContext(topic?: string, limit?: number): Promise<{ pinnedRules: MemoryItem[]; activeContext: MemoryItem[]; formattedContext: string }>;
  pin(idOrTopic: string, pinned?: boolean): Promise<MemoryItem | null>;
  unpin(idOrTopic: string): Promise<MemoryItem | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  recordSessionSummary(summary: { summary: string; topicsCovered?: string[]; keyLearnings?: string[]; toolsUsedCount?: Record<string, number> }): Promise<MemorySessionSummary>;
  getSessionSummaries(limit?: number): Promise<MemorySessionSummary[]>;
}
```

---

## 6. Passive Capture & Interceptor Pipeline

### 6.1 `WebMcpMemoryInterceptor` (`src/lib/memory/memory-interceptor.ts`)
- Implements `WebMcpInterceptor` interface.
- Registered via `WEBMCP_INTERCEPTORS` multi-token.
- Execution logic:
  - Bypasses tool executions matching `mem_*` to avoid infinite recursion.
  - On successful or failed tool execution, if `enablePassiveToolCapture` is `true`:
    - Creates an automatic `'observation'` record with topic `tool_exec/<toolName>`, content summary including parameters and truncated result/error, and tag `['passive', 'tool-execution', toolName]`.

### 6.2 Navigation Context Capture (`src/lib/memory/navigation-listener.ts`)
- Listens to Angular `Router` events (`NavigationEnd`) or browser `popstate`/`hashchange` when Router is absent.
- If `enableNavigationCapture` is `true`, records a `'context'` memory item with topic `navigation/route_change`, content `Navigated to route: ${url}`, and metadata containing route parameters and timestamp.

---

## 7. Inspector UI Contract (`InspectorComponent`)

The WebMCP Inspector (`src/app/components/inspector/inspector.component.ts`) SHALL be enhanced with a tabbed interface:

1. **Tab 1: Execution Logs** (Existing real-time audit stream).
2. **Tab 2: Memory Store**:
   - **Header Metric Bar**: Total memory count, pinned items count, active storage engine badge (`IndexedDB` or `In-Memory`), and estimated storage size.
   - **Filter Controls**: Real-time search query input with debounce, category filter dropdown (`all` + 6 categories), and "Pinned Only" toggle.
   - **Memory Card Layout**:
     - Header: Category color chip, topic title, timestamp, pin button toggle (`📌`), and delete action (`🗑️`).
     - Content: Syntax-highlighted markdown/text content.
     - Footer: Tag badges, access count indicator, BM25 match score badge (visible during search).
   - **Manual Memory Composer**: Modal or collapsible form to manually inject memory records for agent debugging.

---

## 8. Provider Factory (`provideWebMcpMemory`)

`provideWebMcpMemory` SHALL provide all memory components in `src/lib/memory/memory.provider.ts`:

```typescript
export const WEBMCP_MEMORY_CONFIG = new InjectionToken<WebMcpMemoryConfig>('WEBMCP_MEMORY_CONFIG');

export function provideWebMcpMemory(config?: Partial<WebMcpMemoryConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: WEBMCP_MEMORY_CONFIG, useValue: config || {} },
    {
      provide: WebMcpMemoryService,
      useClass: WebMcpMemoryService
    },
    {
      provide: WEBMCP_INTERCEPTORS,
      useClass: WebMcpMemoryInterceptor,
      multi: true
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const memoryService = inject(WebMcpMemoryService);
        const webmcpService = inject(WebMcpService, { optional: true });
        memoryService.init().then(() => {
          if (webmcpService && (config?.autoRegisterTools ?? true)) {
            webmcpService.registerTool(MEM_SAVE_TOOL);
            webmcpService.registerTool(MEM_SEARCH_TOOL);
            webmcpService.registerTool(MEM_CONTEXT_TOOL);
            webmcpService.registerTool(MEM_PIN_TOOL);
            webmcpService.registerTool(MEM_UNPIN_TOOL);
            webmcpService.registerTool(MEM_SESSION_SUMMARY_TOOL);
          }
        });
      }
    }
  ]);
}
```

---

## 9. Requirements & Testable Scenarios

### REQ-1: Data Model Contracts & Validation
The system SHALL validate memory items and queries against strict schema types and support all 6 defined categories (`observation`, `fact`, `rule`, `context`, `preference`, `session`).

#### Scenario: Valid memory item creation and category assignment
- **GIVEN** a payload with topic `"ui/theme"`, content `"Dark mode active"`, and category `"preference"`
- **WHEN** `memoryService.save(payload)` is invoked
- **THEN** a `MemoryItem` is created with a unique UUID `id`, `createdAt`, `updatedAt`, `accessCount: 0`, and `pinned: false`.

#### Scenario: Default category fallback
- **GIVEN** a save payload without explicit category
- **WHEN** saved to the store
- **THEN** category defaults to `"observation"`.

---

### REQ-2: IndexedDB Storage & In-Memory Fallback
The system SHALL persist memory records in IndexedDB when available and transparently fallback to `WebMcpInMemoryStore` in SSR or restricted privacy modes without throwing exceptions.

#### Scenario: IndexedDB persistence across sessions
- **GIVEN** standard browser environment with IndexedDB support
- **WHEN** a memory item is saved and the page is refreshed or store reinitialized
- **THEN** `store.getAll()` retrieves the persisted item.

#### Scenario: Graceful fallback when IndexedDB is unavailable
- **GIVEN** an environment where `window.indexedDB` is undefined or throws `SecurityError`
- **WHEN** `WebMcpMemoryService.init()` is executed
- **THEN** `isReady()` becomes `true`
- **AND** `stats().engineType` reports `'in-memory'`
- **AND** memory CRUD operations succeed ephemerally.

---

### REQ-3: Pure TypeScript BM25 Lexical Search
The system SHALL rank memories using the BM25 algorithm with configurable $k_1$ and $b$ parameters, tokenization, IDF caching, and top-K filtering.

#### Scenario: BM25 ranked retrieval
- **GIVEN** stored memories:
  - Doc A: `"Angular zoneless change detection rules"` (topic: `"angular/signals"`)
  - Doc B: `"Three.js 3D viewport canvas rendering"` (topic: `"three/canvas"`)
- **WHEN** searching with query `"zoneless signals change detection"`
- **THEN** Doc A is ranked first with a significantly higher BM25 score than Doc B
- **AND** `matchedTerms` includes `["zoneless", "signals", "change", "detection"]`.

#### Scenario: Minimum score and category filtering
- **GIVEN** query `"zoneless"` with `category: 'rule'` and `minScore: 0.5`
- **WHEN** search is executed
- **THEN** only items matching category `'rule'` with BM25 score $\ge 0.5$ are returned.

---

### REQ-4: Standard WebMCP Memory Tools Execution
The system SHALL expose `mem_save`, `mem_search`, `mem_context`, `mem_pin`, `mem_unpin`, and `mem_session_summary` tools conforming to WebMCP tool schemas.

#### Scenario: Tool registration and execution via WebMCP
- **GIVEN** `WebMcpService` with memory tools registered
- **WHEN** `webmcp.executeTool('mem_save', { topic: 'db/schema', content: 'Table users', category: 'fact' })` is executed
- **THEN** the memory is persisted in `WebMcpMemoryService`
- **AND** `mem_search` with query `"Table users"` returns the saved record.

#### Scenario: Context tool pinned rules retrieval
- **GIVEN** pinned rule `"Never mutate state directly"` and unpinned observation `"User clicked button"`
- **WHEN** executing `mem_context` with `{ include_pinned_rules: true }`
- **THEN** `pinnedRules` array includes the rule
- **AND** `formattedContext` contains structured markdown text summarizing the rules and context.

---

### REQ-5: Reactive Angular 22 Signals State
The `WebMcpMemoryService` MUST expose signals (`memories`, `pinnedMemories`, `stats`, `recentQueries`, `isReady`) that update reactively under Zoneless change detection.

#### Scenario: Reactive signal updates upon mutation
- **GIVEN** a view tracking `memoryService.memories()` and `memoryService.pinnedMemories()`
- **WHEN** a memory item is saved or its pinned state is toggled
- **THEN** the signals emit updated arrays without requiring `NgZone.run()` or manual change detector triggering.

---

### REQ-6: Passive Interceptor & Navigation Capture
The system SHALL record tool execution outcomes and route transitions passively when enabled in configuration, ignoring internal `mem_*` tools to avoid recursion.

#### Scenario: Passive tool execution capture
- **GIVEN** `enablePassiveToolCapture: true`
- **WHEN** `webmcp.executeTool('rotate_camera', { deltaX: 45 })` is executed
- **THEN** an `'observation'` memory is automatically recorded with topic `"tool_exec/rotate_camera"`
- **AND** no recursive memory loops occur.

#### Scenario: Navigation route change capture
- **GIVEN** `enableNavigationCapture: true`
- **WHEN** route changes to `'/bi-dashboard'`
- **THEN** a `'context'` memory is recorded with topic `"navigation/route_change"` and route details.

---

### REQ-7: Memory Inspector UI Integration
The WebMCP Inspector MUST provide a dedicated Memory Store tab displaying storage metrics, live search, card-based memory inspection, pin toggles, and deletion.

#### Scenario: Live search in Memory Inspector
- **GIVEN** the Memory Store tab active in `InspectorComponent`
- **WHEN** typing in the search input
- **THEN** the memory list dynamically filters in real-time according to BM25 relevance scores.

#### Scenario: Pin toggle from Inspector Card
- **GIVEN** a memory card rendered in the inspector
- **WHEN** the user clicks the pin icon button
- **THEN** the item's `pinned` property toggles and updates both `pinnedMemories()` and the UI card state.

---

### REQ-8: Provider Factory & Public API Surface
The system SHALL export `provideWebMcpMemory`, `WebMcpMemoryService`, `WebMcpMemoryInterceptor`, and all memory types from `@cobies/webmcp-angular` via `src/lib/public-api.ts`.

#### Scenario: Application bootstrapping with provideWebMcpMemory
- **GIVEN** `ApplicationConfig` in `src/app/app.config.ts`
- **WHEN** adding `provideWebMcpMemory({ enablePassiveToolCapture: true })` to providers
- **THEN** the memory store, search engine, tools, and interceptor initialize seamlessly during Angular bootstrap.
