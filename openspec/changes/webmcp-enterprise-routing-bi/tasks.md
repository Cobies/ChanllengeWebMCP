# Tasks: WebMCP Enterprise Routing & BI Dashboard

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation & Routing) → PR 2 (BI Dashboard & Tools) → PR 3 (Judge Guide & Docs) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation & Shell Routing | PR 1 | `bun test projects/showcase/src/app/services/enterprise-data.service.spec.ts` | Navigate `/3d-showroom` and test `/` redirect | Data service, routes, showroom wrapper, shell |
| 2 | Enterprise BI View & WebMCP Tools | PR 2 | `bun test projects/showcase/src/app/components/enterprise-bi/enterprise-bi.component.spec.ts` | Navigate `/enterprise-bi` and run simulation actions | `enterprise-bi` component and tool registrations |
| 3 | Judge Guide & Polish | PR 3 | `bun run build` | Navigate `/judge-guide` and verify prompt chips | `judge-guide` component and `README.md` |

## Phase 1: Foundation & Data Models

- [x] 1.1 Create data contracts in `projects/showcase/src/app/services/enterprise-data.types.ts`.
- [x] 1.2 [RED] Write unit tests for XSS sanitization and <4KB payload truncation in `projects/showcase/src/app/services/enterprise-data.service.spec.ts`.
- [x] 1.3 [GREEN] Implement `EnterpriseDataService` with reactive signals, mock transactions, aggregations, and export generation in `projects/showcase/src/app/services/enterprise-data.service.ts`.
- [x] 1.4 Add unit tests for metrics query, status filtering, and PDF/CSV export generation in `projects/showcase/src/app/services/enterprise-data.service.spec.ts`.

## Phase 2: Routing Architecture & Shell Decoupling

- [x] 2.1 [RED] Write routing unit tests for wildcard `**` and root `/` redirection in `projects/showcase/src/app/app.routes.spec.ts`.
- [x] 2.2 Create standalone `ShowroomComponent` wrapping 3D viewport, customizer, and inspector in `projects/showcase/src/app/components/showroom/showroom.component.ts`.
- [x] 2.3 [GREEN] Define declarative routes (`/3d-showroom`, `/enterprise-bi`, `/judge-guide`, `**`) in `projects/showcase/src/app/app.routes.ts`.
- [x] 2.4 Register `provideRouter(routes, withComponentInputBinding())` in `projects/showcase/src/app/app.config.ts`.
- [x] 2.5 Refactor `projects/showcase/src/app/app.component.ts` and `app.component.html` to host `<app-header>`, `<router-outlet>`, and `<app-copilot-chat>`.
- [x] 2.6 Update `projects/showcase/src/app/components/header/header.component.ts` with cyber-glow navigation tabs and route-aware prompt chips.

## Phase 3: Enterprise BI Component & WebMCP Tools

- [x] 3.1 [RED] Write test for route-scoped tool unregistration and memory leak prevention in `projects/showcase/src/app/components/enterprise-bi/enterprise-bi.component.spec.ts`.
- [x] 3.2 [GREEN] Build `EnterpriseBiComponent` UI (KPI cards, pure SVG trend charts, transactional data table, simulation bar) in `projects/showcase/src/app/components/enterprise-bi/enterprise-bi.component.ts`.
- [x] 3.3 Register 4 WebMCP tools (`query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export`) in `ngOnInit` and clean unregister in `ngOnDestroy`.
- [x] 3.4 Verify tool lifecycle and execution unit tests in `projects/showcase/src/app/components/enterprise-bi/enterprise-bi.component.spec.ts`.

## Phase 4: Judge Guide Page & Documentation

- [x] 4.1 Expand `JudgeGuideComponent` into a full-page routed view with Devpost rubric, architecture diagrams, and prompt chips in `projects/showcase/src/app/components/judge-guide/judge-guide.component.ts`.
- [x] 4.2 Update `README.md` and documentation with multi-route details, enterprise WebMCP tool specs, and evaluation steps.

## Phase 5: Build & End-to-End Verification

- [x] 5.1 Execute `bun test` to ensure 100% unit tests pass with zero regressions.
- [x] 5.2 Execute `bun run build` ensuring `@webmcp/angular` library and `showcase` build cleanly.
