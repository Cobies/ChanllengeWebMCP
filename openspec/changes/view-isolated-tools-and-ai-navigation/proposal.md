# Proposal: View-Isolated WebMCP Tools and AI View Navigation

## Intent

Establish strict route-scoped WebMCP tool isolation across Angular views, dynamic contextual system prompts with available view catalogs in CopilotBridgeService, a global `navigate_to_view` tool for autonomous AI navigation, automatic Router `NavigationEnd` synchronization, and view-adaptive prompt chips in CopilotChatComponent.

## Scope

### In Scope
- Route-scoped tool registration on `ngOnInit` and unregistration on `ngOnDestroy` across all view components (`ShowroomComponent`/`Visualizer3dComponent`, `EnterpriseBiComponent`, etc.).
- Global WebMCP tool `navigate_to_view` (`targetView: string`, `reason: string`) registered at application startup.
- Dynamic contextual system prompt generation in `CopilotBridgeService` embedding current active view, available view catalog, and cross-view delegation instructions.
- Automatic `activeRoute` and `activeView` synchronization in `SidebarModuleRegistryService` listening to Router `NavigationEnd`.
- Contextual, view-reactive prompt suggestion chips in `CopilotChatComponent`.

### Out of Scope
- Backend routing or server-side tool orchestration.
- Navigation history persistence across browser reload sessions.

## Capabilities

### New Capabilities
- `webmcp-ai-navigation`: Global AI-driven view navigation tool (`navigate_to_view`), router synchronization, and view catalog integration.

### Modified Capabilities
- `webmcp-tool-lifecycle`: Enforce strict per-view dynamic registration and cleanup so only active-view tools exist in registry.
- `webmcp-showcase-routing`: Automatic router `NavigationEnd` tracking in `SidebarModuleRegistryService` and route-adaptive prompt chips in `CopilotChatComponent`.

## Approach

1. **Global AI Navigation Tool**: Register `navigate_to_view` in `WebMcpService` at bootstrap, allowing AI to navigate via `Router.navigateByUrl` with parameter validation.
2. **Router Sync**: Subscribe `SidebarModuleRegistryService` to Router `NavigationEnd` to compute `activeRoute` and `activeView` reactively.
3. **View Tool Isolation**: Verify `ShowroomComponent`/`Visualizer3dComponent` and `EnterpriseBiComponent` mount tools in `ngOnInit` and clean them up in `ngOnDestroy`.
4. **Dynamic Contextual System Prompt**: Update `CopilotBridgeService` to construct dynamic `system` role instructions incorporating current view, available workspace views, and directives to invoke `navigate_to_view` when cross-view tools are requested.
5. **Adaptive Prompt Chips**: Refactor `CopilotChatComponent` prompt chips into a computed signal keyed on `SidebarModuleRegistryService.activeView`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/services/copilot-bridge.service.ts` | Modified | Inject dynamic system prompt with active view & view catalog; handle cross-view directions |
| `src/app/services/sidebar-module-registry.service.ts` | Modified | Subscribe to Router `NavigationEnd` and expose reactive `activeRoute` and `activeView` signals |
| `src/app/app.config.ts` | Modified | Register global `navigate_to_view` WebMCP tool during app init/providers |
| `src/app/components/copilot-chat/copilot-chat.component.ts` | Modified | Reactive view-adaptive prompt chips using computed signal from active view |
| `src/app/components/showroom/` & `src/app/components/visualizer-3d/` | Modified | Enforce strict tool lifecycle registration/unregistration |
| `src/app/components/enterprise-bi/enterprise-bi.component.ts` | Modified | Maintain verified lifecycle cleanup on destroy |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Invalid `targetView` from AI | Low | Validate `targetView` against `SidebarModuleRegistryService.views()` and return descriptive error |
| Memory leaks on route subscriptions | Low | Manage Router subscriptions with `takeUntilDestroyed` or `DestroyRef` |
| System prompt token overhead | Low | Keep view catalog and instructions concise and structured in JSON/YAML markdown |

## Rollback Plan
Revert changes to `copilot-bridge.service.ts`, `sidebar-module-registry.service.ts`, `copilot-chat.component.ts`, `app.config.ts`, and view components via Git checkout.

## Dependencies
- `@angular/router`
- `@webmcp/angular` (`WebMcpService`)

## Success Criteria
- [ ] Navigating between views unregisters prior view tools and registers current view tools.
- [ ] Copilot generates contextual system prompt with active view and available view catalog.
- [ ] AI executes `navigate_to_view` successfully and triggers route navigation.
- [ ] `SidebarModuleRegistryService.activeView` stays synchronized with Router `NavigationEnd`.
- [ ] `CopilotChatComponent` displays prompt chips tailored to the active view.
- [ ] All unit tests pass with zero regressions.
