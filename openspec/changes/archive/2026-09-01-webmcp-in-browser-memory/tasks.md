# Tasks: WebMCP In-Browser Memory System

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1100–1400 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Storage) → PR 2 (BM25 & Tools) → PR 3 (Service & Interceptor) → PR 4 (UI & Bootstrap) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Domain Types & Dual Storage Engine | PR 1 (base: feature/webmcp-memory) | `bun test src/lib/memory/indexeddb-store.spec.ts` | Unit tests / In-memory fallback | Delete `src/lib/memory/indexeddb-store.ts`, `src/lib/memory/in-memory-store.ts` |
| 2 | BM25 Engine & Declarative Tools | PR 2 (base: PR 1 branch) | `bun test src/lib/memory/search-engine.spec.ts src/lib/memory/memory-tools.spec.ts` | Synthetic BM25 scoring harness | Delete `src/lib/memory/search-engine.ts`, `src/lib/memory/memory-tools.ts` |
| 3 | Signals Service, Provider & Interceptor | PR 3 (base: PR 2 branch) | `bun test src/lib/memory/memory.service.spec.ts src/lib/memory/memory-interceptor.spec.ts` | Angular TestBed signals verification | Delete `src/lib/memory/memory.service.ts`, `src/lib/memory/memory-interceptor.ts` |
| 4 | SDK Public API, Inspector UI & E2E | PR 4 (base: PR 3 branch) | `bun test src/app/components/inspector/inspector.component.spec.ts src/app/app.spec.ts` | WebMCP Inspector live memory tab | Revert `src/lib/public-api.ts`, `src/app/app.config.ts`, `src/app/components/inspector/` |

## Phase 1: Storage Layer & Foundation (Tasks 1 & 2)

- [x] 1.1 Create domain models and query interfaces in `src/lib/memory/memory.types.ts` and `src/lib/memory/memory-store.interface.ts`
- [x] 1.2 [RED] Add unit test for storage quota boundaries and LRU eviction in `src/lib/memory/indexeddb-store.spec.ts`
- [x] 1.3 [GREEN] Implement `WebMcpIndexedDbStore` with compound indexes and transaction safety in `src/lib/memory/indexeddb-store.ts`
- [x] 1.4 [GREEN] Implement `WebMcpInMemoryStore` with SSR/private browsing fallback in `src/lib/memory/in-memory-store.ts`

## Phase 2: BM25 Lexical Search Engine (Task 3)

- [x] 2.1 [RED] Add unit tests for multilingual tokenization, field weighting (topic 2x, tags 1.5x), and Robertson-Spärck Jones IDF in `src/lib/memory/search-engine.spec.ts` / `src/lib/memory/bm25-search-engine.spec.ts`
- [x] 2.2 [GREEN] Implement `WebMcpMemorySearchEngine` / `WebMcpBm25SearchEngine` with incremental index mutations and top-K scoring in `src/lib/memory/bm25-search-engine.ts` / `src/lib/memory/search-engine.ts`

## Phase 3: Declarative Memory Tools (Task 4)

- [x] 3.1 [RED] Add unit tests for `mem_save`, `mem_search`, `mem_context`, `mem_pin`, `mem_unpin`, and `mem_session_summary` schemas in `src/lib/memory/memory-tools.spec.ts`
- [x] 3.2 [GREEN] Implement tool definitions, parameter JSON schemas, and execution handlers in `src/lib/memory/memory-tools.ts`


## Phase 4: Reactive Service & Interceptors (Tasks 5 & 6)

- [x] 4.1 [RED] Add tests for Zoneless Signals reactivity (`memories`, `pinnedMemories`, `stats`), anti-recursion loop bypass, and URL route sanitization in `src/lib/memory/memory.service.spec.ts` and `src/lib/memory/memory-interceptor.spec.ts`
- [x] 4.2 [GREEN] Implement `WebMcpMemoryService` with Angular 22 Signals and `provideWebMcpMemory()` in `src/lib/memory/memory.service.ts` and `src/lib/memory/memory.provider.ts`
- [x] 4.3 [GREEN] Implement `WebMcpMemoryInterceptor` and `WebMcpNavigationListener` with route sanitization in `src/lib/memory/memory-interceptor.ts` and `src/lib/memory/navigation-listener.ts`

## Phase 5: UI Integration & Verification (Tasks 7, 8 & 9)

- [x] 5.1 [RED] Add tests for memory card XSS sanitization and BM25 playground filtering in `src/app/components/inspector/inspector.component.spec.ts`
- [x] 5.2 [GREEN] Export memory symbols in `src/lib/memory/index.ts` and `src/lib/public-api.ts`, and register `provideWebMcpMemory()` in `src/app/app.config.ts`
- [x] 5.3 [GREEN] Add Memory Store tab, query playground, telemetry metrics, and memory cards to `src/app/components/inspector/inspector.component.ts`
- [x] 5.4 [VERIFY] Run full test suite and verify end-to-end tool execution and persistence in `src/app/app.spec.ts`

