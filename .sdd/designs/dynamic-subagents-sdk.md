# Design: Dynamic SubAgents SDK for WebMCP Angular

## Technical Approach

Establish a first-class, signal-driven Dynamic SubAgents module in `@cobies/webmcp-angular` (`src/lib/subagents/`). The module provides reactive subagent creation, multi-strategy tool scoping, automated `DestroyRef` lifecycle cleanup, dynamic orchestrator delegation schema synthesis, and IoC execution handling.

```
┌────────────────────────────────────────────────────────┐
│               Copilot / Orchestrator Agent             │
└───────────────────────────┬────────────────────────────┘
                            │ delegates via dynamic tool
                            ▼
┌────────────────────────────────────────────────────────┐
│            SubAgentRegistryService (Signals)           │
│  - subagents: Signal<SubAgentInstance[]>               │
│  - activeTasks: Signal<SubAgentTask[]>                 │
│  - createDelegationTool() -> OpenAI Function Schema    │
└────────────┬───────────────────────────────┬───────────┘
             │ manages                       │ manages
             ▼                               ▼
┌─────────────────────────┐     ┌────────────────────────┐
│   createSubAgent() #1   │     │  createSubAgent() #2   │
│ - status: Signal        │     │ - status: Signal       │
│ - history: Signal       │     │ - history: Signal      │
│ - DestroyRef cleanup    │     │ - DestroyRef cleanup   │
│ - Scoped Tool Filter    │     │ - Scoped Tool Filter   │
└─────────────────────────┘     └────────────────────────┘
```

## Architecture Decisions

| Decision Area | Option Selected | Tradeoffs Considered | Rationale |
|---|---|---|---|
| **State Management** | Angular 22 Signals (`signal`, `computed`) | RxJS Subjects vs. Plain State Objects | Native zoneless reactivity, fine-grained UI binding, zero subscription leak risk. |
| **Lifecycle Teardown** | Automatic `DestroyRef` hook in `createSubAgent` | Manual `.destroy()` calls vs. NgOnDestroy | Guarantees automatic subagent cleanup when host component/directive unmounts. |
| **Tool Scoping** | Multi-strategy scoper (allow/deny/regex/predicate + local tools) | Exact string whitelist only | Supports flexible namespace matching (e.g. `/^scene_3d_/`), exclusions, and component-local mock tools. |
| **Delegation Synthesis** | Dynamic OpenAI tool generator tracking registry signal | Static hardcoded enum in copilot prompt | Automatically adapts schema enums and descriptions as view subagents mount/unmount. |
| **Execution Extensibility** | Inversion of Control via `SubAgentExecutionHandler` / DI Token | Hardcoded HTTP client in library | Keeps library core lightweight and decoupled from proprietary backend endpoints. |

## Data Flow

```
1. Component init ───► createSubAgent(config) ───► registers in SubAgentRegistryService
                                │
2. Orchestrator ────► createDelegationTool() ───► schema reflects active subagents
        │
3. Parent LLM invokes 'delegate_to_subagent'
        │
4. Registry dispatches ──► Tool Scoper filters WebMcpService tools + local tools
        │
5. Execution Handler executes isolated multi-turn loop ──► updates status & history signals
        │
6. Executive Receipt returned to Parent Orchestrator
        │
7. Component unmount ──► DestroyRef triggers instance.destroy() ──► unregisters from Registry
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/subagents/subagent.types.ts` | Create | Contracts for `SubAgentConfig`, `SubAgentInstance`, `SubAgentStatus`, `SubAgentTask`, `SubAgentResult`, `SubAgentToolFilter`. |
| `src/lib/subagents/subagent-tool-scoper.ts` | Create | Pure helper functions for multi-strategy tool filtering and local tool merging. |
| `src/lib/subagents/subagent-delegation-tool.ts` | Create | Dynamic OpenAI function tool schema generator for orchestrator delegation. |
| `src/lib/subagents/subagent-registry.service.ts` | Create | Root-scoped registry managing active subagents, dynamic dispatching, and global signals. |
| `src/lib/subagents/create-subagent.ts` | Create | Factory function creating reactive subagent instances with automatic `DestroyRef` cleanup. |
| `src/lib/subagents/index.ts` | Create | Barrel exports for the subagents module. |
| `src/lib/subagents/subagent.spec.ts` | Create | Strict TDD test suite covering lifecycle, filtering, signals, delegation, and execution. |
| `src/lib/public-api.ts` | Modify | Export subagents API surface. |
| `tsconfig.json` | Modify | Add `@cobies/webmcp-angular` path mapping. |

## Interfaces / Contracts

```typescript
export type SubAgentStatus = 'idle' | 'running' | 'completed' | 'error' | 'destroyed';

export type SubAgentToolFilter =
  | string
  | RegExp
  | ((tool: WebMcpToolDefinition) => boolean)
  | {
      allow?: (string | RegExp)[];
      deny?: (string | RegExp)[];
      predicate?: (tool: WebMcpToolDefinition) => boolean;
    };

export interface SubAgentTask<TParams = Record<string, unknown>> {
  objective: string;
  parameters?: TParams;
  contextHint?: string;
  maxTurns?: number;
}

export interface SubAgentResult<TData = unknown> {
  subagentId: string;
  objective: string;
  status: 'success' | 'failed';
  summary: string;
  data?: TData;
  toolsUsed: string[];
  totalTurns: number;
  durationMs: number;
  error?: string;
}

export interface SubAgentConfig<TParams = Record<string, unknown>, TData = unknown> {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  toolFilters?: SubAgentToolFilter[];
  localTools?: WebMcpToolDefinition[];
  preferredModel?: string;
  maxTurns?: number;
  handler?: (task: SubAgentTask<TParams>, context: SubAgentExecutionContext) => Promise<SubAgentResult<TData>>;
}

export interface SubAgentInstance<TParams = Record<string, unknown>, TData = unknown> {
  readonly config: SubAgentConfig<TParams, TData>;
  readonly status: Signal<SubAgentStatus>;
  readonly activeTask: Signal<SubAgentTask<TParams> | null>;
  readonly history: Signal<SubAgentResult<TData>[]>;
  execute(task: SubAgentTask<TParams>): Promise<SubAgentResult<TData>>;
  destroy(): void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `createSubAgent` & `DestroyRef` lifecycle | Verify signal transitions, task execution, and automatic unregistration upon DestroyRef destroy callback. |
| Unit | `subagent-tool-scoper` | Test string matching, regex patterns, predicate filters, denylist precedence, and local tool override. |
| Unit | `SubAgentRegistryService` | Verify registration, unregistration, duplicate ID handling, and reactive `subagents()` / `activeTasks()` signals. |
| Unit | Dynamic delegation generator | Verify JSON schema generation reflects currently registered subagents dynamically. |
| Integration | Path aliases & exports | Validate import resolution from `@cobies/webmcp-angular` in test specs. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

1. **SDK Introduction**: Implement `src/lib/subagents/` and expose via `src/lib/public-api.ts` and `tsconfig.json`.
2. **Showcase Integration**: Refactor `SubAgentRunnerService` to register built-in profiles into `SubAgentRegistryService`.
3. **Copilot Bridge Delegation**: Replace static `DELEGATE_TO_SPECIALIST_TOOL` with dynamic `registry.createDelegationTool()`.
4. **Backward Compatibility**: Maintain existing application UI bindings through adapted `SubAgentExecutionReceipt` mapping.

## Open Questions

- None. Architecture and integration boundaries are fully specified.
