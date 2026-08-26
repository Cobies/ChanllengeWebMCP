# WebMCP Declarative Directives Specification

## Purpose
Expose component methods and state as WebMCP tools declaratively via Angular directives and signal bridges.

## Requirements

### Requirement: Declarative Directive `[webmcpTool]`
The system SHALL provide `[webmcpTool]` directive linking component lifecycle directly to WebMCP tool registration.

#### Scenario: Automatic registration and cleanup
- **GIVEN** a component with `[webmcpTool]` directive
- **WHEN** mounted (`ngOnInit`)
- **THEN** tool is registered with `WebMcpService`
- **AND** WHEN destroyed (`ngOnDestroy`), tool is unregistered.
