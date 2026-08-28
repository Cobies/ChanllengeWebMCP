# Spec: Full-Bleed Edge-to-Edge Web CAD Workspace Layout

## Purpose

Define formal requirements, contracts, and scenarios for transforming the 3D Showroom / SketchUp CAD Studio into an edge-to-edge full-bleed viewport on wide displays while maintaining constrained dashboard views for BI and guide routes.

## Requirements

### Requirement: Route-Aware Shell Layout Detection

The application root shell MUST detect route changes and determine if the active route is a full-bleed CAD workspace (`/3d-showroom`, `3d-showroom`, `/`) or a standard layout route (`/enterprise-bi`, `/judge-guide`, `/inspector`).

#### Scenario: Full-bleed route detection
- GIVEN the application initializes or navigates to `/3d-showroom` or `/`
- WHEN `NavigationEnd` event resolves
- THEN `isFullBleedRoute()` MUST return `true`

#### Scenario: Standard dashboard route detection
- GIVEN the application navigates to `/enterprise-bi` or `/judge-guide`
- WHEN `NavigationEnd` event resolves
- THEN `isFullBleedRoute()` MUST return `false`

---

### Requirement: Dynamic Shell Main Container & Footer Presentation

The application shell MUST conditionally style the `<main>` container and toggle footer visibility based on `isFullBleedRoute()`.

| State | `<main>` CSS Classes | Footer Visible |
|---|---|---|
| `isFullBleedRoute() === true` | `w-full h-full p-0 m-0 max-w-none flex-1 overflow-hidden flex flex-col min-h-0` | No (`@if (!isFullBleedRoute())`) |
| `isFullBleedRoute() === false` | `max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 overflow-y-auto` | Yes |

#### Scenario: Full-bleed shell presentation
- GIVEN `isFullBleedRoute()` evaluates to `true`
- WHEN the application template renders
- THEN `<main>` MUST have zero padding, zero margins, and fill 100% viewport space
- AND the global `<footer>` MUST NOT be rendered in the DOM

#### Scenario: Standard constrained shell presentation
- GIVEN `isFullBleedRoute()` evaluates to `false`
- WHEN the application template renders
- THEN `<main>` MUST be constrained to `max-w-7xl` with horizontal padding
- AND the global `<footer>` MUST be rendered at the bottom

---

### Requirement: Zero-Margin CAD Studio Workspace & Floating Mode Toggle

The showroom component MUST adapt its root container to full height without vertical gaps in `cad_fullscreen` mode and position the layout mode toggle as a floating HUD badge.

#### Scenario: Fullscreen CAD layout mode
- GIVEN `viewMode()` is set to `'cad_fullscreen'`
- WHEN Showroom component renders
- THEN root container MUST apply `w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden relative`
- AND the mode toggle pill MUST float at `top-2.5 right-4 z-40`

#### Scenario: Multi-panel inspector mode
- GIVEN `viewMode()` is set to `'multi_panel'`
- WHEN Showroom component renders
- THEN the 12-column grid with Add Shelf, Outliner, Judge Guide, and Inspector docks MUST be displayed

---

### Requirement: Edge-to-Edge 3D Viewport & Dynamic Canvas Resizing

The 3D visualizer component MUST render borderless without corner radiuses or outer drop shadows, and dynamically adapt WebGL canvas rendering dimensions via `ResizeObserver`.

#### Scenario: Borderless canvas viewport rendering
- GIVEN Visualizer 3D component is rendered in CAD mode
- WHEN the viewport container mounts
- THEN the container MUST apply `w-full h-full flex-1 min-h-0 relative flex flex-col rounded-none border-0 shadow-none bg-[#ebe7df]`
- AND the canvas MUST apply `w-full h-full flex-1 block cursor-crosshair outline-none`

#### Scenario: Dynamic viewport resizing
- GIVEN the window or sidebar dock mode changes dimensions
- WHEN `ResizeObserver` detects container width or height change
- THEN Three.js camera aspect ratio and WebGL renderer dimensions MUST update to 100% of container size without distortion
