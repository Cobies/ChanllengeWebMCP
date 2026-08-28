# Tasks: WebMCP SDK Improvements (Lifecycle Teardown & Interceptor Pipeline)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~220 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full SDK lifecycle & interceptor enhancement | PR 1 | `bun test` | `N/A: library unit tests cover all behavior` | `src/lib/` changes revertible independently |

---

## Phase 1: Types & Core Interfaces

- [x] 1.1 Add `WebMcpExecutionContext`, `WebMcpHandler`, `WebMcpInterceptor`, `WebMcpInterceptorFn`, and `WEBMCP_INTERCEPTORS` injection token in `src/lib/core/webmcp.types.ts`.
- [x] 1.2 Update `SignalToolOptions<T>` in `src/lib/core/webmcp.types.ts` and `src/lib/directives/webmcp-signal.ts` to include optional `destroyRef?: DestroyRef`.

## Phase 2: toWebMcpTool DestroyRef Lifecycle & Imperative Unregister

- [x] 2.1 [RED] Create `src/lib/directives/webmcp-signal.spec.ts` testing DestroyRef auto-teardown, imperative unregister callback, and fallback outside injection context.
- [x] 2.2 [GREEN] Implement 4-tier DestroyRef resolution cascade, `onDestroy` automatic unregistration, and idempotent `() => Promise<boolean>` return in `src/lib/directives/webmcp-signal.ts`.
- [x] 2.3 [REFACTOR] Clean up types and ensure backward compatibility with non-capturing callers.

## Phase 3: WebMcpService Interceptor Pipeline & Chaining

- [x] 3.1 [RED] Add unit tests in `src/lib/core/webmcp.service.spec.ts` for DI interceptors, `addInterceptor()`, context mutation, short-circuiting, and error logging.
- [x] 3.2 [GREEN] Update `WebMcpService` in `src/lib/core/webmcp.service.ts` to inject `WEBMCP_INTERCEPTORS`, implement `addInterceptor()`, and chain middleware pipeline in `executeTool`.
- [x] 3.3 [REFACTOR] Ensure onion pipeline execution metrics, duration logging, and duplicate log deduplication are preserved.

## Phase 4: Provider Support & Public API Exports

- [x] 4.1 Update `provideWebMcp` in `src/lib/core/webmcp.provider.ts` to accept optional `withInterceptors(...interceptors)` or interceptor configuration helper.
- [x] 4.2 Re-export new types, interfaces, tokens, and helper functions in `src/lib/public-api.ts`.

## Phase 5: Full Test Suite Verification & Validation

- [x] 5.1 Run full unit test suite `bun test` across library and example apps.
- [x] 5.2 Validate backward compatibility with existing directive tests and sample demos.
