# WebMCP SDK Improvements Specification

## Purpose

Define the formal interface contracts, lifecycle behaviors, and middleware execution pipeline for the Angular WebMCP SDK (`@webmcp/angular`), introducing automatic `DestroyRef` cleanup with imperative unregistration in `toWebMcpTool`, and a pluggable `WebMcpInterceptor` middleware pipeline in `WebMcpService`.

---

## 1. `toWebMcpTool` Lifecycle Integration & Teardown Contract

### Interface Contract

```typescript
export interface SignalToolOptions<T> {
  name: string;
  description: string;
  parameters?: WebMcpToolParameterSchema;
  /**
   * Value transformer for converting agent parameters to signal value.
   */
  transform?: (params: Record<string, unknown>) => T;
  /**
   * Explicit DestroyRef to bind lifecycle teardown.
   * If omitted, DestroyRef is resolved via inject(DestroyRef, { optional: true }).
   */
  destroyRef?: DestroyRef;
}

/**
 * Connects a WritableSignal to a registered WebMCP tool.
 * Automatically handles lifecycle unregistration when DestroyRef fires.
 *
 * @returns An imperative unregister teardown callback: () => Promise<boolean>
 */
export function toWebMcpTool<T>(
  targetSignal: WritableSignal<T>,
  options: SignalToolOptions<T>,
  webmcpService?: WebMcpService,
  destroyRef?: DestroyRef
): () => Promise<boolean>;
```

### Requirement: Automatic `DestroyRef` Lifecycle Cleanup

The `toWebMcpTool` function MUST detect an active injection context or accept an explicit `DestroyRef` (via options or parameter) and register an `onDestroy` teardown hook that unregisters the tool from `WebMcpService`.

#### Scenario: Automatic cleanup in injection context
- **GIVEN** a component or directive calling `toWebMcpTool(signal, { name: 'color', ... })` during constructor or field initialization
- **WHEN** the host component or environment is destroyed
- **THEN** `DestroyRef.onDestroy` executes
- **AND** `WebMcpService.unregisterTool('color')` is invoked automatically.

#### Scenario: Explicit `DestroyRef` provided outside injection context
- **GIVEN** `toWebMcpTool` is called with an explicit `destroyRef` parameter or in `options.destroyRef`
- **WHEN** that explicit `destroyRef` triggers destruction
- **THEN** the tool is unregistered from `WebMcpService`.

#### Scenario: Graceful fallback when `DestroyRef` is unavailable
- **GIVEN** `toWebMcpTool` is invoked outside an injection context without passing `destroyRef`
- **WHEN** `inject(DestroyRef, { optional: true })` evaluates to `null` or throws
- **THEN** `toWebMcpTool` MUST NOT throw an error
- **AND** the tool remains registered until imperatively unregistered.

---

### Requirement: Imperative Unregister Teardown Callback

`toWebMcpTool` MUST return an unregister callback function with signature `() => Promise<boolean>` allowing manual deregistration at any time.

#### Scenario: Imperative deregistration
- **GIVEN** `const unregister = toWebMcpTool(targetSignal, { name: 'custom_mode', ... })`
- **WHEN** `await unregister()` is called
- **THEN** `WebMcpService.unregisterTool('custom_mode')` is executed
- **AND** the returned promise resolves to `true` (or the boolean result of unregistration)
- **AND** subsequent calls to `unregister()` are idempotent and safe.

---

## 2. WebMCP Interceptor Pipeline Architecture

### Interface Contracts

```typescript
export interface WebMcpExecutionContext {
  toolName: string;
  parameters: Record<string, unknown>;
  source: 'native' | 'emulator' | 'ui';
  metadata?: Record<string, unknown>;
}

export type WebMcpHandler = (context: WebMcpExecutionContext) => Promise<unknown>;

export interface WebMcpInterceptor {
  intercept(context: WebMcpExecutionContext, next: WebMcpHandler): Promise<unknown>;
}

export const WEBMCP_INTERCEPTORS = new InjectionToken<WebMcpInterceptor[]>('WEBMCP_INTERCEPTORS');
```

---

### Requirement: Multi-Provider Interceptor Dependency Injection

`WebMcpService` MUST inject all interceptors provided under the `WEBMCP_INTERCEPTORS` multi-injection token at initialization time.

#### Scenario: DI interceptor registration
- **GIVEN** one or more interceptor classes or objects provided in DI via `{ provide: WEBMCP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true }`
- **WHEN** `WebMcpService` instantiates
- **THEN** the service resolves and registers all provided interceptors in the execution pipeline.

---

### Requirement: Programmatic Interceptor Registration (`addInterceptor`)

`WebMcpService` MUST expose an `addInterceptor(interceptor: WebMcpInterceptor): () => void` method allowing dynamic runtime registration and deregistration.

#### Scenario: Adding and removing an interceptor programmatically
- **GIVEN** an active `WebMcpService` instance
- **WHEN** `const remove = webmcpService.addInterceptor(customInterceptor)` is executed
- **THEN** `customInterceptor` is added to the active interceptor chain
- **AND** WHEN `remove()` is invoked
- **THEN** `customInterceptor` is removed from the interceptor chain and will not execute on subsequent tool runs.

---

### Requirement: Onion/Chained Pipeline Execution in `executeTool`

`WebMcpService.executeTool` MUST execute all registered interceptors (DI-provided followed by programmatically added) in sequential pipeline order around the target tool execution handler.

#### Scenario: Sequential interceptor execution and parameter mutation
- **GIVEN** Interceptor A and Interceptor B registered in order
- **WHEN** `webmcpService.executeTool('update_data', { key: 'val' })` is invoked
- **THEN** Interceptor A executes first and calls `next(context)`
- **AND** Interceptor B receives the context modified or passed by Interceptor A
- **AND** the target tool handler executes with the finalized context
- **AND** results flow back through Interceptor B then Interceptor A before returning to the caller.

#### Scenario: Interceptor short-circuiting / caching
- **GIVEN** an interceptor configured to short-circuit (e.g., rate-limiting, auth guard, or response caching)
- **WHEN** the interceptor returns a value directly without invoking `next(context)`
- **THEN** subsequent interceptors and the underlying tool handler MUST NOT execute
- **AND** `executeTool` resolves with the short-circuited value.

#### Scenario: Error handling and exception propagation in interceptor chain
- **GIVEN** an interceptor or the target tool handler throws an error during execution
- **WHEN** the error bubbles through the pipeline
- **THEN** outer interceptors MAY catch, transform, or rethrow the error
- **AND** `WebMcpService` logs the error in `executionLogs` with `durationMs` and status
- **AND** the error is rejected to the original caller.
