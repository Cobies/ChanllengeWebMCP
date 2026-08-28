# Proposal: WebMCP SDK Improvements (Lifecycle & Interceptor Pipeline)

## Intent

Enhance the Angular WebMCP SDK (`@webmcp/angular` / `src/lib`) by solving two core architectural gaps:
1. **Tool Leaks & Teardown Ergonomics**: `toWebMcpTool` currently requires manual cleanup or risks leaking registered tools when host components/directives destroy.
2. **Pluggable Cross-Cutting Pipeline**: `WebMcpService.executeTool` lacks middleware hooks for telemetry, auditing, parameter validation, rate limiting, and result transformations.

This change introduces automatic injection-context-aware lifecycle teardown with `DestroyRef` (and returns an unregister teardown callback) in `toWebMcpTool`, alongside a pluggable `WebMcpInterceptor` middleware pipeline supporting both declarative DI multi-providers (`WEBMCP_INTERCEPTORS`) and programmatic registration (`addInterceptor`).

## Scope

### In Scope
- **`toWebMcpTool` Lifecycle Cleanup**:
  - Automatically inject `DestroyRef` (via `inject(DestroyRef, { optional: true })` or explicitly supplied parameter/options) to auto-unregister on destruction.
  - Return an explicit imperative unregister callback `() => Promise<boolean>` for manual lifecycle management.
- **Pluggable Interceptor Middleware Pipeline**:
  - Define `WebMcpInterceptor` contract (`intercept(context, next): Promise<unknown>`) and `WebMcpInvocationContext`.
  - Multi-provider injection token `WEBMCP_INTERCEPTORS` injected into `WebMcpService`.
  - Imperative `addInterceptor(interceptor: WebMcpInterceptor): () => void` method on `WebMcpService` with deregistration return handler.
  - Onion/chain execution in `WebMcpService.executeTool` ensuring backward compatibility with native/emulator executions and logging.
- **Unit & Integration Test Suite**: Comprehensive tests covering interceptor chaining, short-circuiting, error propagation, and `DestroyRef` teardown.

### Out of Scope
- Modifying underlying W3C `window.modelContext` / `WebMcpEmulator` low-level wire specifications.
- Breaking API signatures of existing `toWebMcpTool` or `WebMcpService` callers.

## Capabilities

### New Capabilities
- `webmcp-interceptor-pipeline`: Pluggable middleware architecture for intercepting, augmenting, timing, and securing tool executions in `WebMcpService`.

### Modified Capabilities
- `webmcp-declarative-directives`: Enhanced `toWebMcpTool` with automatic `DestroyRef` lifecycle cleanup and imperative unregister return callback.

## Approach

1. **`toWebMcpTool` Modern Teardown**:
   - Update `toWebMcpTool<T>(targetSignal, options, webmcpService?, destroyRef?)` to return `() => Promise<boolean>`.
   - In injection context, resolve `DestroyRef` optionally. If active, register `destroyRef.onDestroy(() => unregister())`.
   - Preserve non-injection context compatibility when manually passing service or explicit `destroyRef`.
2. **Interceptor Pipeline Architecture**:
   - Create `WebMcpInterceptor` interface with `next(context: WebMcpInvocationContext): Promise<unknown>`.
   - `WebMcpService` resolves multi-provider `WEBMCP_INTERCEPTORS` on construct and maintains a mutable signal/list for programmatic `addInterceptor`.
   - Implement pipeline runner in `executeTool` executing interceptors sequentially around `this.context.executeTool`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/core/webmcp.types.ts` | Modified | Added `WebMcpInterceptor`, `WebMcpInvocationContext`, `WebMcpNextFn` |
| `src/lib/core/webmcp.service.ts` | Modified | Injected `WEBMCP_INTERCEPTORS`, `addInterceptor()`, chained execution pipeline in `executeTool` |
| `src/lib/directives/webmcp-signal.ts` | Modified | Automatic `DestroyRef` integration, unregister callback return |
| `src/lib/core/webmcp.service.spec.ts` | Modified/New | Interceptor pipeline tests (ordering, transformation, error handling) |
| `src/lib/directives/webmcp-signal.spec.ts` | Modified/New | `toWebMcpTool` lifecycle auto-cleanup & unregister callback tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Calling `toWebMcpTool` outside injection context | Low | Use `inject(DestroyRef, { optional: true })` and graceful fallback if absent |
| Interceptor hanging or failing uncaught | Low | Wrap next chain in standard `Promise` resolution with error boundary logging |
| Backward compatibility breakage | Low | Signatures are strictly additive; default behavior remains unchanged |

## Rollback Plan

Revert changes to `src/lib/directives/webmcp-signal.ts`, `src/lib/core/webmcp.service.ts`, and `src/lib/core/webmcp.types.ts`. All existing APIs maintain strict binary and runtime backwards compatibility.

## Dependencies

- `@angular/core` (`DestroyRef`, `InjectionToken`, `inject`)
- Existing `WebMcpService` and `WebMcpEmulator`

## Success Criteria

- [ ] `toWebMcpTool` automatically unregisters tool from `WebMcpService` when host component/environment is destroyed.
- [ ] `toWebMcpTool` returns an imperative unregister callback that successfully removes the tool on demand.
- [ ] Multi-provider `WEBMCP_INTERCEPTORS` and programmatic `addInterceptor()` intercept and observe/modify tool executions in `WebMcpService.executeTool`.
- [ ] 100% test coverage for new interceptor pipeline and lifecycle features without breaking existing tests.
