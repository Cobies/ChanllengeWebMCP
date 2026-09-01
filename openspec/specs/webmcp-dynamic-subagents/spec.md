# Specification: Dynamic SubAgents SDK for WebMCP Angular

## Capability: `webmcp-dynamic-subagents`

### Requirement 1: SubAgent Types & Configuration Contracts

The system SHALL define strict TypeScript contracts for SubAgent configuration, lifecycle state, runtime tasks, and execution results (`SubAgentConfig`, `SubAgentInstance`, `SubAgentStatus`, `SubAgentResult`, `SubAgentTask`).

#### Scenario: Type contract validation
- **GIVEN** a subagent definition
- **WHEN** configured with `SubAgentConfig` parameters (id, name, description, systemPrompt, toolFilters, localTools)
- **THEN** typed interfaces enforce valid configurations and execution return shapes.

#### Scenario: Execution result structure
- **GIVEN** a completed or failed subagent execution
- **WHEN** inspecting the returned `SubAgentResult`
- **THEN** it contains `subagentId`, `objective`, `status`, `summary`, `toolsUsed`, `totalTurns`, `durationMs`, and optional `data` or `error`.

---

### Requirement 2: Reactive SubAgent Registry Lifecycle & Execution Dispatching

The system SHALL provide a singleton `SubAgentRegistryService` managing registered subagents with reactive Angular Signals (`subagents`, `activeSubagents`, `executionHistory`), dynamic dispatching, and duplicate ID prevention.

#### Scenario: Subagent registration and reactive state
- **GIVEN** an active `SubAgentRegistryService`
- **WHEN** subagents register or unregister
- **THEN** the `subagents` and `activeSubagents` signals update reactively.

#### Scenario: Duplicate subagent registration rejection
- **GIVEN** an already registered subagent ID
- **WHEN** attempting to register another subagent with the same ID
- **THEN** the registry throws an informative error and rejects the duplicate.

#### Scenario: Task dispatching and execution history
- **GIVEN** a registered subagent
- **WHEN** invoking `registry.execute(id, task)`
- **THEN** execution is dispatched to the target subagent and the result is appended to `executionHistory`.

---

### Requirement 3: Factory Helper & Automatic DestroyRef Teardown

The system SHALL provide a `createSubAgent` factory function that returns reactive `SubAgentInstance` objects and automatically cleans up registrations and transitions status to `'destroyed'` when the Angular `DestroyRef` lifecycle triggers.

#### Scenario: Factory initialization with reactive signals
- **GIVEN** valid subagent configuration options
- **WHEN** calling `createSubAgent(config)`
- **THEN** a `SubAgentInstance` is created with `status`, `activeTask`, and `history` signals in default idle state.

#### Scenario: Automatic DestroyRef lifecycle teardown
- **GIVEN** a subagent bound to a `DestroyRef`
- **WHEN** the host component or directive is destroyed
- **THEN** the subagent is automatically unregistered from `SubAgentRegistryService` and transitions its status signal to `'destroyed'`.

#### Scenario: Execution state lifecycle transitions
- **GIVEN** a subagent instance
- **WHEN** `execute(task)` is called
- **THEN** the `status` signal transitions from `'idle'` -> `'running'` -> `'completed'` (or `'error'`) and updates `activeTask` and `history`.

---

### Requirement 4: Dynamic Multi-Strategy Tool Scoping & Local Tools

The system SHALL support flexible tool filtering strategies (exact name strings, regular expressions, predicate functions, allow/deny rules with denylist precedence) and merge subagent-local tools that override global tools.

#### Scenario: Tool filtering with allowlist, regex, and predicate
- **GIVEN** global WebMCP tools
- **WHEN** `filterToolsForSubAgent` evaluates filters with strings, RegExp patterns, or predicate functions
- **THEN** only matching tool definitions are returned.

#### Scenario: Denylist precedence over allowlist
- **GIVEN** a filter definition with both `allow` and `deny` rules
- **WHEN** tools matching both allow and deny criteria are evaluated
- **THEN** denylist rules take precedence and exclude the matching tools.

#### Scenario: Subagent-local tool merging and override
- **GIVEN** global tools and subagent-local tool definitions
- **WHEN** scoping tools with `filterToolsForSubAgent`
- **THEN** local tools are included and override global tools sharing the same tool name.

#### Scenario: Execution context tool execution
- **GIVEN** a subagent running within `SubAgentExecutionContext`
- **WHEN** accessing `context.availableTools` and calling `context.executeTool(name, params)`
- **THEN** tools execute within the scoped subagent environment.

---

### Requirement 5: Dynamic Orchestrator Delegation Tool Generation

The system SHALL provide `getDelegationToolDefinition` / `createDelegationTool` to dynamically generate an OpenAI-compatible function tool schema (`delegate_to_subagent`) that continuously reflects currently registered subagents in its parameters.

#### Scenario: Dynamic delegation tool schema synthesis
- **GIVEN** `SubAgentRegistryService` with registered subagents
- **WHEN** `createDelegationTool(registry)` generates the tool definition
- **THEN** the schema contains `delegate_to_subagent` with `target_subagent` and `objective` properties.

#### Scenario: Dynamic schema enum reflection
- **GIVEN** changes in registered subagents (mounting/unmounting)
- **WHEN** inspecting the `target_subagent` enum in the delegation tool parameters
- **THEN** the enum values update dynamically to match the currently registered subagent IDs.

#### Scenario: Orchestrator delegation execution dispatch
- **GIVEN** an orchestrator agent invoking `delegate_to_subagent`
- **WHEN** the tool handler executes with target subagent and objective
- **THEN** it dispatches to the subagent and returns the structured `SubAgentResult`.

#### Scenario: Showcase CopilotBridge dynamic delegation integration
- **GIVEN** CopilotBridgeService in the showcase app
- **WHEN** subagents are registered in `SubAgentRegistryService`
- **THEN** `CopilotBridgeService` exposes `delegate_to_subagent` in its available tool definitions.

---

### Requirement 6: Public SDK Export Surface & Path Aliasing

The system SHALL expose the dynamic subagents API surface through `@cobies/webmcp-angular` in `src/lib/public-api.ts` and configure path mapping in `tsconfig.json`.

#### Scenario: TypeScript path mapping resolution
- **GIVEN** `@cobies/webmcp-angular` path mapping in `tsconfig.json`
- **WHEN** importing from `@cobies/webmcp-angular`
- **THEN** imports resolve directly to `./src/lib/public-api.ts`.

#### Scenario: Public API barrel export completeness
- **GIVEN** `src/lib/public-api.ts`
- **WHEN** inspecting exported symbols
- **THEN** all SubAgent types, `SubAgentRegistryService`, `createSubAgent`, tool scoping helpers, and delegation generators are accessible.
