# Proposal: Dynamic SubAgents SDK for WebMCP Angular

## Intent

Establish a first-class, signal-driven SubAgent architecture within `@cobies/webmcp-angular` (`src/lib/subagents`). This enables library consumers to define, isolate, and run specialized AI subagents for views/components with zero boilerplate, dynamic tool filtering, automatic `DestroyRef` lifecycle teardown, and dynamic orchestrator delegation schema generation. Also update `tsconfig.json` path mappings for `@cobies/webmcp-angular`.

## Scope

### In Scope
- Core SubAgent types and contracts in `src/lib/subagents/subagent.types.ts` (`SubAgentConfig`, `SubAgentInstance`, `SubAgentStatus`, `SubAgentTask`, `SubAgentResult`, `SubAgentToolFilter`).
- `SubAgentRegistryService` managing active subagents, dynamic tool scoping, and execution dispatching.
- `createSubAgent` / `provideSubAgent` factory API with reactive signals (`status`, `activeTask`, `history`) and automated `DestroyRef` teardown.
- Dynamic tool filtering (allowlist, denylist, namespaces, predicate filters, and subagent-local tools).
- Dynamic orchestrator delegation schema generator (`delegate_to_subagent`) exposing registered subagents to main agents.
- Public exports in `src/lib/public-api.ts` and `@cobies/webmcp-angular` path mapping in `tsconfig.json`.
- Strict TDD unit test suite covering registration, filtering, execution, delegation, and lifecycle teardown.

### Out of Scope
- Remote backend LLM hosting or server-side orchestration.
- Cross-session persistence of subagent execution history across page reloads.

## Capabilities

### New Capabilities
- `webmcp-dynamic-subagents`: Dynamic, customizable SubAgent architecture, registry, reactive state signals, tool filtering, and orchestrator delegation tools.

### Modified Capabilities
- `webmcp-core-service`: Expose subagent registry integration and support scoped subagent execution contexts.

## Approach

1. **Contracts & Types**: Define `SubAgentConfig`, `SubAgentInstance`, `SubAgentStatus`, and tool scoping types in `src/lib/subagents/subagent.types.ts`.
2. **Registry & Execution**: Build `SubAgentRegistryService` to manage active subagents, filter tools from `WebMcpService`, and dispatch subagent executions.
3. **Reactive Factory**: Implement `createSubAgent` utilizing Angular's `DestroyRef` (injected or passed) to bind teardown automatically and expose reactive signals (`status`, `activeTask`, `history`).
4. **Dynamic Delegation**: Implement dynamic delegation tool generation (`delegate_to_subagent`) that automatically reflects active subagents and their capabilities in its schema.
5. **Path Mappings & Public API**: Add `@cobies/webmcp-angular` to `tsconfig.json` paths and export subagent APIs in `src/lib/public-api.ts`.
6. **Strict TDD Suite**: Author unit tests (`src/lib/subagents/*.spec.ts`) validating lifecycle, tool scoping, execution, and delegation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/subagents/` | New | SubAgent types, registry service, factory functions (`createSubAgent`), and delegation generator |
| `src/lib/public-api.ts` | Modified | Export subagents public API surface |
| `tsconfig.json` | Modified | Add `@cobies/webmcp-angular` path mapping pointing to `./src/lib/public-api.ts` |
| `src/lib/subagents/subagent.spec.ts` | New | Unit test suite for SubAgent lifecycle, filtering, and delegation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Memory leaks from orphaned subagents | Low | Bind registration directly to `DestroyRef` with automatic unregistration |
| Tool collisions between subagents | Low | Enforce subagent prefixing/scoping in isolated execution contexts |
| Delegation schema staleness | Low | Derive delegation schema dynamically via computed signals tracking registered subagents |

## Rollback Plan

Delete `src/lib/subagents/` and revert modifications to `src/lib/public-api.ts` and `tsconfig.json` via Git checkout.

## Dependencies

- `@angular/core` (`DestroyRef`, `signal`, `computed`, `inject`, `Injectable`)
- `@webmcp/angular` (`WebMcpService`, `WebMcpToolDefinition`)

## Success Criteria

- [ ] `createSubAgent` initializes subagents with zero boilerplate and exposes reactive signals (`status`, `history`, `activeTask`).
- [ ] Dynamic tool filtering accurately scopes tools (allowlist, denylist, predicate, local tools).
- [ ] Subagents unregister and clean up resources automatically on `DestroyRef` teardown.
- [ ] Dynamic orchestrator delegation schema registers delegation tool and reflects active subagents.
- [ ] `tsconfig.json` resolves `@cobies/webmcp-angular` successfully.
- [ ] 100% unit test pass rate with strict TDD test coverage.
