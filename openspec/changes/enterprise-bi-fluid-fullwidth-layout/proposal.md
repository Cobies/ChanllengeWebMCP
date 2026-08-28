# Proposal: Enterprise BI Fluid Full-Width Layout & High-Density Display Optimization

## Intent

Remove restrictive fixed-width box constraints (`max-w-7xl` / 1280px) across the application shell, header, footer, and Enterprise BI dashboard to deliver a fluid edge-to-edge layout (`w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`) optimized for high-resolution displays (1080p, 1440p, 4K, ultra-wide) while preserving dedicated full-bleed canvas routing for the 3D Showroom.

## Scope

### In Scope
- Upgrade `src/app/app.html` non-full-bleed `<main>` container and `<footer>` wrapper to responsive fluid full-width padding (`w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`).
- Update `src/app/components/header/header.component.ts` top bar container to fluid full-width with progressive horizontal padding.
- Modernize `EnterpriseBiComponent` views (Analytics, Transactions, Inventory) with 100% viewport expansion, adaptive responsive grids (`2xl:grid-cols-4`), dense fluid data tables, and expanded SVG chart canvases.
- Preserve dedicated route-aware full-bleed edge-to-edge mode for `/3d-showroom` and `/`.
- Verify responsive layout integrity and automated unit test suite.

### Out of Scope
- Modifying Three.js WebGL canvas rendering pipelines or 3D scene controls in `Showroom3dComponent`.
- Changing WebMCP tool schemas or enterprise service business logic.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `fullbleed-cad-layout`: Update non-full-bleed shell, header, and footer layout contracts from `max-w-7xl` to fluid full-width container (`w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`) while retaining zero-margin full-bleed for CAD showroom.
- `webmcp-enterprise-bi`: Enhance Enterprise BI view specifications for fluid full-viewport utilization, adaptive multi-column grid layouts, and high-density responsive tables on wide displays.

## Approach
1. Update `app.html` `<main>` conditional classes and footer inner container to fluid full-width padding.
2. Update `header.component.ts` header inner container to matching fluid full-width padding.
3. Optimize `enterprise-bi.component.ts` grid containers and table wrappers to utilize full available horizontal space without artificial bounding boxes.
4. Verify responsive visual flow across standard breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/app.html` | Modified | Replace `max-w-7xl` with `w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12` in `<main>` and footer |
| `src/app/components/header/header.component.ts` | Modified | Update top bar inner container to fluid full-width padding |
| `src/app/components/enterprise-bi/enterprise-bi.component.ts` | Modified | Enhance grid layouts (`2xl:grid-cols-4`), chart widths, and table density for 100% viewport |
| `src/app/app.spec.ts` | Modified | Validate route detection and shell container styling integrity |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Horizontal content overstretching on 4K/ultra-wide | Low | Use progressive horizontal padding (`xl:px-10 2xl:px-12`) and multi-column grid scaling |
| Regression in 3D Showroom full-bleed mode | Low | Route detection logic (`isFullBleedRoute()`) remains completely intact and tested |

## Rollback Plan
Revert layout class changes in `app.html`, `header.component.ts`, and `enterprise-bi.component.ts` via Git checkout to restore previous `max-w-7xl` constraints.

## Dependencies
- Tailwind CSS v4 styling rules
- Angular 22 standalone router and components

## Success Criteria
- [ ] Application shell, header, and footer span 100% viewport width without `max-w-7xl` bounding.
- [ ] Enterprise BI components adaptively scale across 1080p, 1440p, 4K, and ultra-wide screens.
- [ ] 3D Showroom retains borderless full-bleed viewport without regressions.
- [ ] All unit tests pass cleanly (`bun test`).
