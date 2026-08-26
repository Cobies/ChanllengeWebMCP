# Proposal: WebMCP Enterprise Routing & BI Dashboard

## Intent

Expand the WebMCP showcase application into a multi-route Angular 19/22 enterprise platform featuring a dedicated Enterprise Data Intelligence & BI dashboard alongside the 3D Digital Twin Showroom and full-page Judge Guide. This demonstrates real-world enterprise AI agent co-piloting across heterogeneous domains (WebGL 3D graphics and Business Intelligence) with dynamic tool lifecycle management.

## Scope

### In Scope
- **Multi-Route Navigation**: Configure Angular router with `/3d-showroom` (default), `/enterprise-bi`, and `/judge-guide`.
- **Enterprise BI Dashboard**: KPI summary cards (Revenue, Active Nodes, Query Throughput, Anomaly Score), interactive SVG trend charts, transactional data table with status filtering.
- **Enterprise WebMCP Tools**: Register 4 route-scoped tools: `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, and `trigger_analytics_export`.
- **Dynamic Tool Lifecycle**: Automatic tool registration on route init (`ngOnInit`) and unregistration on route teardown (`ngOnDestroy`) via `WebMcpService`.
- **Context-Aware Header Navigation**: Route links with active tab styling and domain-specific agent simulation triggers.
- **Dedicated Judge Guide View**: Interactive Devpost rubric checklist, dual-domain Copilot prompts, and architectural breakdown.
- **Copilot Integration & Unit Tests**: Seamless Copilot integration and 100% unit test coverage for new components and services.

### Out of Scope
- Backend database integration (uses deterministic in-memory enterprise data service).
- Server-side rendering (CSR architecture preserved).

## Capabilities

### New Capabilities
- `webmcp-enterprise-bi`: Enterprise Data Intelligence dashboard, data service, and 4 BI WebMCP tools.
- `webmcp-showcase-routing`: Angular routing structure with route-scoped tool registration lifecycle.

### Modified Capabilities
- `webmcp-showcase-app`: Modularized into routed views with dynamic header controls and router outlet.

## Approach

1. **Router Setup**: Configure `app.routes.ts` with routes for `3d-showroom`, `enterprise-bi`, and `judge-guide`, with root redirecting to `3d-showroom`. Update `app.config.ts` with `provideRouter()`.
2. **Enterprise BI Module**: Build `EnterpriseBiComponent` and `EnterpriseDataService` managing KPI metrics, time-series trends, and transaction filtering. Register the 4 BI tools on `ngOnInit` and clean them up on `ngOnDestroy`.
3. **Route Extraction**: Refactor 3D visualizer and customizer into `Showroom3dComponent`; convert judge guide into full-page `JudgeGuideViewComponent`.
4. **Header Navigation & Simulation**: Update `HeaderComponent` with router navigation tabs and route-aware simulation actions.
5. **Testing**: Write comprehensive unit tests for routing, BI service, BI component, and lifecycle cleanup.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `projects/showcase/src/app/app.routes.ts` | New | Angular route definitions |
| `projects/showcase/src/app/components/enterprise-bi/` | New | Enterprise BI dashboard component, charts, and table |
| `projects/showcase/src/app/services/enterprise-data.service.ts` | New | Business metrics state & tool handlers |
| `projects/showcase/src/app/components/showroom-3d/` | New | 3D showroom page view component |
| `projects/showcase/src/app/components/header/header.component.ts` | Modified | Router links and dynamic simulation buttons |
| `projects/showcase/src/app/app.component.ts` & `html` | Modified | Replace monolithic grid with `<router-outlet>` |
| `projects/showcase/src/app/app.config.ts` | Modified | Add `provideRouter(routes)` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale tool registrations across route transitions | Low | Enforce explicit `unregisterTool()` in `ngOnDestroy` lifecycle hooks |
| Copilot referencing unmounted tools | Low | `CopilotBridgeService` queries active tools dynamically on each turn |
| Bundle size increase | Low | Lightweight standalone components and pure SVG charts without heavy external chart libraries |

## Rollback Plan

Revert `app.config.ts`, `app.component.ts`, `app.component.html`, and `header.component.ts` to their previous monolithic state and delete newly created routing and BI files.

## Dependencies

- `@angular/router` / `provideRouter()`
- Existing `@webmcp/angular` library services
- CPAMC Copilot Bridge (`CopilotBridgeService`)

## Success Criteria

- [ ] Navigation between `/3d-showroom`, `/enterprise-bi`, and `/judge-guide` works smoothly with active tab indicators.
- [ ] Active WebMCP tools update dynamically per route in the header badge and Copilot tool definitions.
- [ ] Gemini 3.7 Flash High Copilot executes all 4 enterprise BI tools and 3D tools when navigating between respective views.
- [ ] Enterprise BI charts, KPI metrics, and filtered data tables respond accurately to UI and tool invocations.
- [ ] 100% unit test coverage achieved for all new routes, components, and services.
