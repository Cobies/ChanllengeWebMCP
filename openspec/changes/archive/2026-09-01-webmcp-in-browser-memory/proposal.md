# Proposal: WebMCP In-Browser Memory System

## Intent

Provide a client-side episodic and semantic memory system directly inside the WebMCP Angular Toolkit, enabling browser AI agents to persist, recall, search, and pin operational context across sessions via IndexedDB and zero-dependency BM25 search without external backend services.

## Scope

### In Scope
- IndexedDB storage engine (`WebMcpMemoryStore`) supporting memory records, schemas, indexing, and SSR-safe fallback.
- In-memory pure TypeScript BM25/TF-IDF lexical search engine (`WebMcpMemorySearchEngine`) with tokenization and relevance ranking.
- Declarative memory tool provider (`provideWebMcpMemory()`, `mem_save`, `mem_search`, `mem_context`, `mem_pin`, `mem_unpin`, `mem_session_summary`) auto-registered in `WebMcpService`.
- Reactive Angular 22 Signals service (`WebMcpMemoryService`) exposing memories, pinned items, query states, and statistics.
- UI integration with the WebMCP Inspector (Memory tab) and showcase demo for live memory inspection and manual testing.

### Out of Scope
- Remote cloud/server sync or backend vector database integrations (client-local only).
- Heavy client-side ONNX/WASM embedding model runtimes (zero-dependency lexical BM25/TF-IDF is used).
- Cross-origin / cross-domain shared storage outside the browser origin storage boundary.

## Capabilities

### New Capabilities
- `webmcp-in-browser-memory`: Client-side IndexedDB persistence, lexical BM25 retrieval, standardized agent memory tools (`mem_*`), and reactive Angular 22 Signals service for browser AI agent memory.

### Modified Capabilities
- `webmcp-core-service`: Expose provider bindings and registration utilities to host built-in memory tool definitions into the tool registry.
- `webmcp-showcase-app`: Extend Inspector UI with a dedicated Memory tab and interactive memory controls.

## Approach
- Implement `WebMcpMemoryStore` wrapping IndexedDB with typed stores (`memories`, `pins`, `sessions`) and in-memory fallback for SSR/private browsing.
- Build lightweight BM25 scoring with English/multilingual tokenizer, term frequency weighting, and top-K ranked retrieval.
- Create `provideWebMcpMemory()` provider and `WebMcpMemoryService` registering standard MCP memory tools into `WebMcpService`.
- Expose Signal-based state (`memories()`, `pinnedMemories()`, `stats()`, `recentQueries()`) for real-time reactivity in Zoneless Angular 22.
- Embed Memory panel into `InspectorComponent` allowing inspection, manual creation, search queries, and pin/unpin toggles.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/memory/` | New | IndexedDB store, BM25 search engine, memory service, types, and tool definitions |
| `src/lib/public-api.ts` | Modified | Export memory services, types, and providers |
| `src/app/components/inspector/` | Modified | Add Memory tab, live query inspector, and memory item cards |
| `src/app/app.config.ts` | Modified | Register `provideWebMcpMemory()` in app providers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| IndexedDB unavailable in SSR / strict privacy modes | Med | Automatic graceful degradation to in-memory ephemeral store |
| Search performance degradation on large memory sets (>10k items) | Low | Inverted index caching, token hashing, and bounded query results (top-K default 10) |
| Storage quota exhaustion in browser | Low | Size tracking, optional LRU eviction policy for unpinned ephemeral memories |

## Rollback Plan
Remove `src/lib/memory/` module, revert `src/lib/public-api.ts` exports and `app.config.ts` provider registration; existing WebMCP core tools and inspector will operate unchanged.

## Dependencies
- None (pure TypeScript, Angular 22 `@angular/core`, standard browser `indexedDB` API).

## Success Criteria
- [ ] Agent can persist and retrieve observations across page reloads via `mem_save` and `mem_search`.
- [ ] BM25 search accurately ranks relevant entries based on search keywords.
- [ ] Angular 22 Signals reactively update Inspector UI upon memory modifications.
- [ ] Unit and integration test suite passes with >= 80% code coverage.
