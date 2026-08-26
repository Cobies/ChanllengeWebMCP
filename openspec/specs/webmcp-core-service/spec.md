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
