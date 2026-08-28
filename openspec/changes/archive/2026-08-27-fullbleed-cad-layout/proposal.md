# Proposal: Full-Bleed Edge-to-Edge Web CAD Workspace Layout

## Intent

On wide/ultrawide displays, the 3D Showroom / SketchUp CAD Studio was confined within a fixed 1280px (`max-w-7xl`) card with lateral margins, vertical padding, and a persistent footer causing double scrollbars. This change delivers a true full-bleed (100% width and height) edge-to-edge CAD viewport matching professional desktop tools (SketchUp Web, Spline, Fusion 360).

## Scope

### In Scope
- Route-aware layout switching in `App` shell (`isFullBleedRoute`).
- Conditional full-bleed `<main>` container and footer suppression on `/3d-showroom`.
- Zero-margin, full-height CAD workspace layout in `showroom.component.ts` with floating top-right mode toggle pill.
- Borderless, unrounded, 100% width/height edge-to-edge canvas container in `visualizer-3d.component.ts`.

### Out of Scope
- Global removal of `max-w-7xl` or footer from standard dashboard routes (`/enterprise-bi`, `/judge-guide`, `/inspector`).
- Modifications to 3D mesh rendering logic, materials, or WebMCP tool contracts.

## Capabilities

### New Capabilities
- `fullbleed-cad-workspace`: Edge-to-edge CAD workspace layout with route-aware shell adaptation and floating UI controls.

### Modified Capabilities
- None

## Approach

1. **Route Detection (`app.ts`, `app.html`)**: Inject `Router` to compute `isFullBleedRoute`. When on `/3d-showroom`, apply `flex-1 w-full h-full p-0 m-0 max-w-none flex flex-col min-h-0 overflow-hidden` to `<main>` and hide `<footer>`.
2. **CAD Workspace Flexing (`showroom.component.ts`)**: Render a 100% height flex container in `cad_fullscreen` mode. Relocate view toggle to an absolute floating badge (`top-2.5 right-4 z-40`).
3. **Viewport Container (`visualizer-3d.component.ts`)**: Update root element to `w-full h-full flex-1 min-h-0 relative flex flex-col rounded-none border-0 shadow-none bg-[#ebe7df]` to let Three.js canvas occupy 100% screen area below header.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/app.ts` | Modified | Add `Router` injection and `isFullBleedRoute` computed signal. |
| `src/app/app.html` | Modified | Conditional `main` styling and dynamic footer visibility. |
| `src/app/components/showroom/showroom.component.ts` | Modified | Full-height layout in `cad_fullscreen` mode and floating pill toggle. |
| `src/app/components/visualizer-3d/visualizer-3d.component.ts` | Modified | Edge-to-edge styling, remove fixed rounded borders/shadows. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Route changes don't trigger layout resize | Low | Angular signals + `ResizeObserver` in `visualizer-3d` automatically triggers Three.js camera/renderer resize. |
| Non-CAD routes broken by layout change | Low | Layout classes are conditionally applied only when `isFullBleedRoute()` is true. |

## Rollback Plan

Revert `src/app/app.ts`, `src/app/app.html`, `src/app/components/showroom/showroom.component.ts`, and `src/app/components/visualizer-3d/visualizer-3d.component.ts` via `git checkout`.

## Dependencies

- Angular Router (`@angular/router`)
- Existing `ResizeObserver` logic in `visualizer-3d.component.ts`

## Success Criteria

- [x] 3D Showroom occupies 100% of viewport width and height below header.
- [x] No outer lateral margins, padding, or double scrollbars appear in CAD Studio.
- [x] Footer is hidden on `/3d-showroom` and retained on `/enterprise-bi` and `/judge-guide`.
- [x] Mode switcher floats unobtrusively at `top-2.5 right-4`.
