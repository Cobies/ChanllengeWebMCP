# WebMCP Core Service Specification

## Purpose
Provides an Angular root injectable service (`WebMcpService`) and registry managing browser AI tool lifecycles, native `window.modelContext` / `navigator.modelContext` bridge, and fallback emulation.

## Requirements

### Requirement: Native Context Sensing & Polyfill Negotiation
The system SHALL detect browser native WebMCP APIs (`window.modelContext` or `navigator.modelContext`) upon Angular bootstrap and provide a fallback emulator when unflagged.

#### Scenario: Native WebMCP environment detected
- **GIVEN** an active browser session with `window.modelContext` or `navigator.modelContext` present
- **WHEN** `WebMcpService` initializes
- **THEN** `WebMcpService.isNativeContext()` returns `true`
- **AND** tool registrations delegate to `window.modelContext.registerTool()`.

#### Scenario: Fallback emulator activation
- **GIVEN** a standard browser where `window.modelContext` is `undefined`
- **WHEN** `WebMcpService` initializes
- **THEN** `WebMcpService.isNativeContext()` returns `false`
- **AND** `WebMcpEmulator` is mounted on `window.modelContext`.

### Requirement: Reactive Tool Registration
The `WebMcpService` MUST maintain a reactive registry of tools exposed to AI agents, validating schemas and emitting signal updates.

#### Scenario: Tool registration and signal reactivity
- **GIVEN** an active `WebMcpService` instance
- **WHEN** `registerTool(definition)` is called with valid definition
- **THEN** the tool is registered in the active context
- **AND** `registeredTools` signal emits the updated list.

### Requirement: Pluggable Interceptor Middleware Pipeline
The `WebMcpService` MUST support interceptor middleware via multi-provider dependency injection (`WEBMCP_INTERCEPTORS`) and programmatic registration (`addInterceptor`), executing an onion-style pipeline in `executeTool`.

#### Scenario: Sequential interceptor execution and context propagation
- **GIVEN** Interceptors A and B registered in sequence
- **WHEN** `WebMcpService.executeTool('process', { count: 1 })` is called
- **THEN** Interceptor A intercepts first and calls `next(context)`
- **AND** Interceptor B receives modified context and forwards to tool execution
- **AND** results flow back through Interceptors B and A.

#### Scenario: Interceptor short-circuiting
- **GIVEN** an interceptor returning a cached or guarded value without calling `next`
- **WHEN** `WebMcpService.executeTool('query', {})` is invoked
- **THEN** downstream interceptors and target tool handler are bypassed
- **AND** `executeTool` resolves with the intercepted value.

#### Scenario: Programmatic interceptor addition and removal
- **GIVEN** an active `WebMcpService`
- **WHEN** `const remove = webmcpService.addInterceptor(customInterceptor)` is executed
- **THEN** `customInterceptor` is added to the active pipeline
- **AND** WHEN `remove()` is invoked, the interceptor is detached from future executions.
