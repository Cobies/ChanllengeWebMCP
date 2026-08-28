# Tasks: Modular WebMCP Sidebar Workspace Navigation Hub

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~350-450 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Models & Registry) → PR 2 (Component & Shell) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Models, clean module config, registry service signals, and unit test suite | PR 1 | `bun test src/app/services/sidebar-module-registry.service.spec.ts` | N/A (models & service registry layer) | `src/app/models/sidebar.models.ts`, `src/app/config/sidebar-modules.config.ts`, `src/app/services/sidebar-module-registry*` |
| 2 | Navigation hub component, docking UI, active route highlight, and shell integration | PR 2 | `bun test src/app/components/sidebar/sidebar.component.spec.ts` | `bun run build` (full compilation check) | `src/app/components/sidebar/`, `src/app/components/header/header.component.ts`, `src/app/app.ts` |

## Phase 1: Models & Type Definitions

- [x] 1.1 Update `src/app/models/sidebar.models.ts` with `SidebarViewCategory` (`workspace`, `telemetry`, `assistant`), `SidebarDockMode`, `SidebarModuleConfig` / `WorkspaceViewItem`, `SIDEBAR_MODULE_CONFIGS`, and `provideSidebarModules()`.

## Phase 2: Registry Service & Modules Config (TDD)

- [x] 2.1 [RED] Update `src/app/services/sidebar-module-registry.service.spec.ts` adding test cases for clean view registration, category grouping, `viewToolCountsMap` reactivity from `WebMcpService`, and `onSelect` delegation.
- [x] 2.2 [GREEN] Update `SidebarModuleRegistryService` in `src/app/services/sidebar-module-registry.service.ts` with reactive signals (`views`, `activeRoute`, `dockMode`, `isMobileDrawerOpen`, `categoryViewsMap`, `viewToolCountsMap`) and `selectView()` handler.
- [x] 2.3 [GREEN] Update `src/app/config/sidebar-modules.config.ts` defining the 5 clean workspace views (`/3d-showroom`, `/enterprise-bi`, `/judge-guide`, `/inspector`, Copilot) without embedded domain actions.

## Phase 3: Sidebar Component Navigation Hub (TDD)

- [x] 3.1 [RED] Update `src/app/components/sidebar/sidebar.component.spec.ts` adding test cases for clean view links, active route highlight, reactive tool count badges, docking mode toggle, and mobile drawer dismissal on navigation.
- [x] 3.2 [GREEN] Update `SidebarComponent` in `src/app/components/sidebar/sidebar.component.ts` rendering clean route links, active route indicator, reactive tool badges, rail mode tooltips, mobile overlay drawer, and WebMCP status footer.

## Phase 4: App Shell Integration & Header Clean-up

- [x] 4.1 Verify & update `src/app/app.ts` and `src/app/app.html` for dynamic sidebar docking margins (`lg:pl-72`, `lg:pl-16`, `lg:pl-0`).
- [x] 4.2 Verify & update `src/app/components/header/header.component.ts` and `src/app/app.config.ts` ensuring clean separation between header and sidebar navigation hub.

## Phase 5: Verification & Quality Assurance

- [x] 5.1 Run full unit test suite with `bun test` to verify 100% passing tests across all test suites.
- [x] 5.2 Validate application production build with `bun run build`.
