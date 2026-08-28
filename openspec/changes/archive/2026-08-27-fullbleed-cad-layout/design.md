# Design: Full-Bleed Edge-to-Edge Web CAD Workspace Layout

## Architecture Overview

The Full-Bleed CAD Workspace Layout eliminates layout constraints on wide and ultrawide displays by implementing dynamic, route-aware presentation styling at the application shell level down to the Three.js WebGL canvas container.

### Visual Hierarchy & Layout Architecture

```text
+-----------------------------------------------------------------------+
| App Header (h-16 / 4rem, border-b, nav links, Copilot toggle)        |
+-----------------------------------------------------------------------+
| Dynamic Main Container:                                               |
| - Standard Routes (/enterprise-bi, /judge-guide): max-w-7xl, py-6     |
| - CAD Routes (/3d-showroom, /): w-full h-full p-0 m-0 overflow-hidden |
|                                                                       |
| +-------------------------------------------------------------------+ |
| | Showroom Component (h-full flex flex-col flex-1 min-h-0)          | |
| | - Floating Mode Switcher Pill (absolute top-2.5 right-4 z-40)     | |
| |                                                                   | |
| | +---------------------------------------------------------------+ | |
| | | Visualizer 3D Container (w-full h-full flex-1 min-h-0)        | | |
| | | - Top Desktop Menu Ribbon                                     | | |
| | | - Left CAD Tool Strip (13 SketchUp tools)                     | | |
| | | - Center Canvas (100% WebGL buffer, ResizeObserver driven)    | | |
| | | - Right Dock (Outliner / Inspector / Materials Trays)         | | |
| | | - Bottom HUD (Guidance & VCB Metric Dimension input)          | | |
| | +---------------------------------------------------------------+ | |
| +-------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
| Conditional Footer: Suppressed on CAD routes (@if (!isFullBleedRoute))|
+-----------------------------------------------------------------------+
```

## Core Decisions

1. **Route Detection via Signal**: `App` shell injects `Router` and maintains a computed signal `isFullBleedRoute()` derived from `NavigationEnd` events and `Router.url` pathname checks.
2. **Conditional Shell Presentation**: When `isFullBleedRoute()` is true, `App` renders `<main>` with full viewport dimensions (`w-full h-full p-0 m-0 max-w-none flex flex-col min-h-0 overflow-hidden`) and suppresses the global `<footer>` entirely.
3. **Single Visualizer Instance**: The Showroom component preserves a single `<app-visualizer-3d>` instance across fullscreen CAD mode and multi-panel inspector layout modes to prevent WebGL context loss or reinitialization flicker.
4. **Dynamic Resizing**: A native `ResizeObserver` on the 3D visualizer's parent element dynamically calls `camera.updateProjectionMatrix()` and `renderer.setSize()` to ensure pixel-perfect rendering across window resizes and sidebar toggles.
