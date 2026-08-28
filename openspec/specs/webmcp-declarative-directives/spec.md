# WebMCP Declarative Directives Specification

## Purpose
Expose component methods and state as WebMCP tools declaratively via Angular directives and signal bridges.

## Requirements

### Requirement: Declarative Directive and Signal Tool Registration with DestroyRef Lifecycle Integration
The system SHALL provide `[webmcpTool]` directive and `toWebMcpTool` signal bridge linking component lifecycle directly to WebMCP tool registration with automatic `DestroyRef` teardown and returning an imperative unregister callback.

#### Scenario: Automatic registration and cleanup
- **GIVEN** a component with `[webmcpTool]` directive
- **WHEN** mounted (`ngOnInit`)
- **THEN** tool is registered with `WebMcpService`
- **AND** WHEN destroyed (`ngOnDestroy`), tool is unregistered.

#### Scenario: Signal tool automatic DestroyRef teardown
- **GIVEN** a component or directive calling `toWebMcpTool(signal, { name: 'color', ... })` during constructor or field initialization
- **WHEN** the host component or environment is destroyed
- **THEN** `DestroyRef.onDestroy` executes
- **AND** `WebMcpService.unregisterTool('color')` is invoked automatically.

#### Scenario: Signal tool imperative unregister callback
- **GIVEN** a caller invokes `const unregister = toWebMcpTool(signal, { name: 'theme', ... })`
- **WHEN** `await unregister()` is called manually
- **THEN** `WebMcpService.unregisterTool('theme')` is invoked and resolves to `true`
- **AND** subsequent invocations are safe and idempotent.
