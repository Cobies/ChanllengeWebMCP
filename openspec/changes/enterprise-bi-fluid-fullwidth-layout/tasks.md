# Tasks: Enterprise BI Fluid Full-Width Layout & High-Density Display Optimization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 45-70 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Fluid application shell, header, and footer container layout | PR 1 | `bun test src/app/app.spec.ts` | Open `/enterprise-bi` and verify 100% width | `src/app/app.html`, `src/app/components/header/header.component.ts` |
| 2 | Enterprise BI high-density grids and 100% viewport scaling | PR 1 | `bun test src/app/components/enterprise-bi/enterprise-bi.component.spec.ts` | Open `/enterprise-bi` at 2560px width | `src/app/components/enterprise-bi/enterprise-bi.component.ts` |
| 3 | Unit test suite update and end-to-end build verification | PR 1 | `bun test && bun run build` | Full test runner output | `src/app/app.spec.ts` |

## Phase 1: Shell & Header Fluid Layout

- [x] 1.1 Update `src/app/app.html` `<main>` conditional styling and `<footer>` inner wrapper to replace `max-w-7xl` with `w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`.
- [x] 1.2 Update `src/app/components/header/header.component.ts` top bar inner container to replace `max-w-7xl` with `w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`.

## Phase 2: Enterprise BI Responsive High-Density Scaling

- [x] 2.1 Update `src/app/components/enterprise-bi/enterprise-bi.component.ts` root container to ensure `w-full` elastic expansion across all views.
- [x] 2.2 Update `src/app/components/enterprise-bi/enterprise-bi.component.ts` audit logs and reorder receipts grid containers from `lg:grid-cols-3` to `lg:grid-cols-3 2xl:grid-cols-4`.

## Phase 3: Unit Testing & Contract Verification

- [x] 3.1 Update `src/app/app.spec.ts` to assert the non-full-bleed fluid layout class string contract (`w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`) and full-bleed isolation.
- [x] 3.2 Verify `src/app/components/enterprise-bi/enterprise-bi.component.spec.ts` passes with full WebMCP tool registration and signal state integrity.

## Phase 4: Full Validation & Build Verification

- [x] 4.1 Execute full test suite via `bun test` to ensure zero regressions across all components.
- [x] 4.2 Run project build via `bun run build` to ensure clean template compilation and Tailwind CSS v4 styling bundle generation.
