# Tasks: Dynamic SubAgents SDK for WebMCP Angular

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600-800 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (SDK Core: Types, Scoper, Registry, Factory, Delegation) → PR 2 (Exports & Showcase Integration) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | SDK Core Types, Scoper, Registry, Factory, Delegation Tool & Unit Tests | PR 1 (base: feature/dynamic-subagents-sdk) | `bun test src/lib/subagents/subagent.spec.ts` | N/A (pure library unit tests) | Delete `src/lib/subagents/` |
| 2 | Public API Exports, Path Mappings, and Showcase Service Integration | PR 2 (base: PR 1 branch) | `bun test && bun run build` | `bun run build` | Revert `src/lib/public-api.ts`, `tsconfig.json`, `src/app/services/*` |

## Phase 1: Core SubAgent Types & Pure Multi-Strategy Tool Scoper

- [x] 1.1 (RED) Add unit tests for tool scoper (string, regex, predicate, deny, local tools) in `src/lib/subagents/subagent.spec.ts`.
- [x] 1.2 (GREEN) Define contracts (`SubAgentConfig`, `SubAgentInstance`, `SubAgentStatus`, etc.) in `src/lib/subagents/subagent.types.ts`.
- [x] 1.3 (GREEN) Implement pure tool scoping logic in `src/lib/subagents/subagent-tool-scoper.ts`.
- [x] 1.4 (REFACTOR) Optimize predicate evaluation and regex caching in `src/lib/subagents/subagent-tool-scoper.ts`.

## Phase 2: Reactive SubAgentRegistryService with Signals

- [x] 2.1 (RED) Add unit tests for `SubAgentRegistryService` registration, unregistration, duplicate ID handling, and signals in `src/lib/subagents/subagent.spec.ts`.
- [x] 2.2 (GREEN) Implement `SubAgentRegistryService` with `subagents` and `activeTasks` signals in `src/lib/subagents/subagent-registry.service.ts`.
- [x] 2.3 (REFACTOR) Harden error handling and state signal immutability in `src/lib/subagents/subagent-registry.service.ts`.

## Phase 3: createSubAgent Factory Helper & Lifecycle Teardown

- [x] 3.1 (RED) Add unit tests for `createSubAgent` execution, signal updates, and `DestroyRef` automatic teardown in `src/lib/subagents/subagent.spec.ts`.
- [x] 3.2 (GREEN) Implement `createSubAgent` factory with reactive signals and `DestroyRef.onDestroy` cleanup in `src/lib/subagents/create-subagent.ts`.
- [x] 3.3 (REFACTOR) Streamline default fallback execution handler and cleanup callbacks in `src/lib/subagents/create-subagent.ts`.

## Phase 4: Dynamic Orchestrator Delegation Tool Synthesis

- [x] 4.1 (RED) Add unit tests for `createDelegationTool` verifying dynamic OpenAI schema reflecting registered subagents in `src/lib/subagents/subagent.spec.ts`.
- [x] 4.2 (GREEN) Implement `createDelegationTool` helper in `src/lib/subagents/subagent-delegation-tool.ts`.
- [x] 4.3 (REFACTOR) Add barrel exports in `src/lib/subagents/index.ts`.

## Phase 5: Public API Exports & Path Mappings

- [x] 5.1 (RED) Add test verifying import resolution from `@cobies/webmcp-angular` in `src/lib/subagents/subagent.spec.ts`.
- [x] 5.2 (GREEN) Add `@cobies/webmcp-angular` path mapping in `tsconfig.json`.
- [x] 5.3 (GREEN) Export subagents module in `src/lib/public-api.ts`.
- [x] 5.4 (REFACTOR) Verify clean barrel exports and type isolation.

## Phase 6: Showcase Integration

- [x] 6.1 (RED) Add unit tests for `SubAgentRunnerService` profile registration and execution adapter in `src/app/services/subagent-runner.service.spec.ts`.
- [x] 6.2 (GREEN) Integrate `SubAgentRegistryService` and register built-in profiles in `src/app/services/subagent-runner.service.ts`.
- [x] 6.3 (GREEN) Refactor `CopilotBridgeService` to use dynamic delegation tool in `src/app/services/copilot-bridge.service.ts`.
- [x] 6.4 (REFACTOR) Clean up legacy hardcoded delegation tool in `src/app/services/copilot-bridge.service.ts`.

## Phase 7: Full Test Suite Verification & Production Build

- [x] 7.1 (VERIFY) Run full unit test suite via `bun test` to ensure 100% pass rate.
- [x] 7.2 (VERIFY) Run production build via `bun run build` to validate compilation and bundling.

