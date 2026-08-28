# Delta for WebMCP Declarative Directives

## MODIFIED Requirements

### Requirement: Declarative Directive and Signal Tool Registration with DestroyRef Lifecycle Integration

The system SHALL provide `[webmcpTool]` directive and `toWebMcpTool` signal bridge linking component lifecycle directly to WebMCP tool registration with automatic `DestroyRef` teardown and returning an imperative unregister callback.
(Previously: `toWebMcpTool` registered tools without DestroyRef cleanup or return values)

#### Scenario: Automatic registration and cleanup
- GIVEN a component with `[webmcpTool]` directive
- WHEN mounted (`ngOnInit`)
- THEN tool is registered with `WebMcpService`
- AND WHEN destroyed (`ngOnDestroy`), tool is unregistered.

#### Scenario: Signal tool automatic DestroyRef teardown
- GIVEN a component or directive calling `toWebMcpTool(signal, { name: 'color', ... })` during constructor or field initialization
- WHEN the host component or environment is destroyed
- THEN `DestroyRef.onDestroy` executes
- AND `WebMcpService.unregisterTool('color')` is invoked automatically.

#### Scenario: Signal tool imperative unregister callback
- GIVEN a caller invokes `const unregister = toWebMcpTool(signal, { name: 'theme', ... })`
- WHEN `await unregister()` is called manually
- THEN `WebMcpService.unregisterTool('theme')` is invoked and resolves to `true`
- AND subsequent invocations are safe and idempotent.

---

# Delta for WebMCP Core Service & Interceptor Pipeline

## ADDED Requirements

### Requirement: Pluggable Interceptor Middleware Pipeline

The `WebMcpService` MUST support interceptor middleware via multi-provider dependency injection (`WEBMCP_INTERCEPTORS`) and programmatic registration (`addInterceptor`), executing an onion-style pipeline in `executeTool`.

#### Scenario: Sequential interceptor execution and context propagation
- GIVEN Interceptors A and B registered in sequence
- WHEN `WebMcpService.executeTool('process', { count: 1 })` is called
- THEN Interceptor A intercepts first and calls `next(context)`
- AND Interceptor B receives modified context and forwards to tool execution
- AND results flow back through Interceptors B and A.

#### Scenario: Interceptor short-circuiting
- GIVEN an interceptor returning a cached or guarded value without calling `next`
- WHEN `WebMcpService.executeTool('query', {})` is invoked
- THEN downstream interceptors and target tool handler are bypassed
- AND `executeTool` resolves with the intercepted value.

#### Scenario: Programmatic interceptor addition and removal
- GIVEN an active `WebMcpService`
- WHEN `const remove = webmcpService.addInterceptor(customInterceptor)` is executed
- THEN `customInterceptor` is added to the active pipeline
- AND WHEN `remove()` is invoked, the interceptor is detached from future executions.
