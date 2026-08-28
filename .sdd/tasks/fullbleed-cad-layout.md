# SDD Tasks: Full-Bleed CAD Workspace Layout

## Phase 1: TDD & App Shell Route Detection
- [x] 1.1 Add unit tests for `isFullBleedRoute` computed property and route detection in `src/app/app.spec.ts`
- [x] 1.2 Implement `Router` injection, `currentUrl` signal, and `NavigationEnd` tracking in `src/app/app.ts`
- [x] 1.3 Implement `isFullBleedRoute` computed property in `src/app/app.ts`

## Phase 2: App Shell HTML & Conditional Layout
- [x] 2.1 Update `src/app/app.html` outer wrapper to `h-screen w-full overflow-hidden`
- [x] 2.2 Make `<main>` container dynamically flex `w-full h-full p-0 m-0 max-w-none flex flex-col min-h-0 overflow-hidden` when on full-bleed routes
- [x] 2.3 Suppress `<footer>` on full-bleed routes via `@if (!isFullBleedRoute())`

## Phase 3: Showroom Fullscreen & Floating Pill Controls
- [x] 3.1 Refactor `src/app/components/showroom/showroom.component.ts` to render `w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden relative` in `cad_fullscreen` mode
- [x] 3.2 Place view mode toggle as a glassmorphic floating pill at `absolute top-2.5 right-4 z-40`
- [x] 3.3 Retain standard multi-panel grid layout in `multi_panel` mode

## Phase 4: Visualizer 3D Container Full-Bleed Styling
- [x] 4.1 Update `src/app/components/visualizer-3d/visualizer-3d.component.ts` root container to `relative w-full h-full flex-1 min-h-0 rounded-none border-0 shadow-none bg-[#ebe7df]`
- [x] 4.2 Verify Three.js `ResizeObserver` automatically sizes WebGL canvas to 100% viewport width and height
