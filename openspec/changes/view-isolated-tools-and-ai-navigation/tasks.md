# Tasks: View-Isolated WebMCP Tools and AI View Navigation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350 - 450 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Navigation & Router Sync) → PR 2 (Dynamic Prompt & Chips) → PR 3 (Tool Lifecycle & E2E) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | AI Navigation Service & Router Sync | PR 1 | `bun test src/app/services/ai-navigation.service.spec.ts src/app/services/sidebar-module-registry.service.spec.ts` | Router navigation event harness | `src/app/services/ai-navigation.service.ts`, `src/app/app.config.ts`, `src/app/services/sidebar-module-registry.service.ts` |
| 2 | Dynamic System Prompt & Adaptive Chips | PR 2 | `bun test src/app/services/copilot-bridge.service.spec.ts src/app/components/copilot-chat/copilot-chat.component.spec.ts` | Copilot chat autonomous drawer | `src/app/services/copilot-bridge.service.ts`, `src/app/components/copilot-chat/copilot-chat.component.ts` |
| 3 | Tool Lifecycle Isolation & View Teardown | PR 3 | `bun test src/app/components/showroom/showroom.component.spec.ts src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` | Multi-view navigation tool check | `src/lib/three/three-scene-bridge.ts`, `src/app/components/showroom/showroom.component.ts`, `src/app/components/visualizer-3d/visualizer-3d.component.ts` |

## Phase 1: Global AI Navigation Service (`navigate_to_view`)

- [x] 1.1 [RED] Write unit tests in `src/app/services/ai-navigation.service.spec.ts` for tool registration, route navigation, and rejection of invalid `targetView`.
- [x] 1.2 [GREEN] Implement `src/app/services/ai-navigation.service.ts` registering `navigate_to_view` WebMCP tool with catalog validation and `NavigateToViewResult`.
- [x] 1.3 [GREEN] Register `AiNavigationService` provider in `src/app/app.config.ts` during application bootstrap.

## Phase 2: Router Navigation Synchronization

- [x] 2.1 [RED] Write unit tests in `src/app/services/sidebar-module-registry.service.spec.ts` for `NavigationEnd` event tracking and `activeRoute` / `activeView` signals.
- [x] 2.2 [GREEN] Update `src/app/services/sidebar-module-registry.service.ts` to subscribe to `Router.events` (`NavigationEnd`) with `takeUntilDestroyed` and expose `activeView` signal.

## Phase 3: Dynamic Contextual System Prompt

- [x] 3.1 [RED] Write unit tests in `src/app/services/copilot-bridge.service.spec.ts` for dynamic system prompt formatting, bounded size (<1.5KB), and screenshot sanitization.
- [x] 3.2 [GREEN] Update `src/app/services/copilot-bridge.service.ts` to inject `SidebarModuleRegistryService` and prepend dynamic contextual `system` message before LLM requests.

## Phase 4: View-Adaptive Prompt Chips

- [x] 4.1 [RED] Write unit tests in `src/app/components/copilot-chat/copilot-chat.component.spec.ts` verifying reactive `promptChips` signal changes on route updates.
- [x] 4.2 [GREEN] Update `src/app/components/copilot-chat/copilot-chat.component.ts` to derive `promptChips` reactively from `SidebarModuleRegistryService.activeView()`.

## Phase 5: Route-Scoped Tool Lifecycle Isolation

- [x] 5.1 [RED] Write tool lifecycle tests in `src/app/components/showroom/showroom.component.spec.ts` and `src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` for mount/unmount isolation.
- [x] 5.2 [GREEN] Add `unregisterAllTools()` to `src/lib/three/three-scene-bridge.ts` for clean WebMCP tool removal.
- [x] 5.3 [GREEN] Implement `ngOnInit` / `ngOnDestroy` lifecycle tool registration in `src/app/components/showroom/showroom.component.ts` and `src/app/components/visualizer-3d/visualizer-3d.component.ts`.
- [x] 5.4 [VERIFY] Verify `EnterpriseBiComponent` and `InspectorComponent` preserve verified tool isolation and teardown.

## Phase 6: TDD Verification & End-to-End Validation

- [x] 6.1 [TEST] Run complete unit test suite across all modified services and components (`bun test`).
- [x] 6.2 [INTEGRATION] Verify autonomous cross-view tool execution flow from `/3d-showroom` to `/enterprise-bi` via `navigate_to_view`.
