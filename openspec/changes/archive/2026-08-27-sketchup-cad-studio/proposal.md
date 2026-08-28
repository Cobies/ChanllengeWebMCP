# Proposal: SketchUp-Style Full-Screen Web CAD Application & WebMCP Co-Design Studio

## Intent
Transform the browser 3D experience into a full-screen, desktop-grade Web CAD studio (SketchUp / Fusion 360 paradigm), eliminating page scrolling and unifying direct-manipulation canvas drawing with autonomous Gemini 3.7 Copilot WebMCP tools.

## Scope
### In Scope
- Full-bleed edge-to-edge CAD viewport (`h-[calc(100vh-4.5rem)]` / full-screen toggle) with horizon, RGB axes, and snap grid.
- Top dropdown menu strip (File, Edit, View, Draw, Tools, Window) & Quick Actions (Undo, Redo, Snapshot, GLB Export).
- Left floating SketchUp tool palette (Select, Line, Rectangle, Circle, Push-Pull, Move, Rotate, Scale, Tape Measure, Paint Bucket, Orbit, Pan, Zoom) with hotkeys.
- Right collapsible floating trays dock (Entity Info, Materials, Components Library, Outliner Scene Tree, Styles/Environment).
- Bottom Measurements & Status HUD with live numeric dimensional input (VCB) and snap indicators.
- Interactive canvas drawing & snapping engine (rubber-band guides, ground plane raycasting, face snapping, push-pull extrusion).
- 5 First-Class WebMCP CAD tools (`cad_draw_shape`, `cad_push_pull`, `cad_place_component`, `cad_apply_material`, `cad_measure`).
- 6 Architectural Copilot prompt chips for multimodal autonomous modeling.

### Out of Scope
- Multi-user collaborative CAD editing over WebRTC / WebSockets.
- NURBS / parametric B-Rep solid kernel (STEP/IGES export).

## Capabilities
### New Capabilities
- `sketchup-cad-viewport-layout`: Edge-to-edge desktop CAD layout with dropdown menus, floating tool palette, right tray system, and bottom measurement HUD.
- `cad-interactive-drawing-engine`: Canvas raycasting drafting engine for 2D shapes, snapping guides, and 3D face extrusion.
- `webmcp-cad-copilot-tools`: Gemini 3.7 WebMCP tools for procedural drawing, component placement, material assignment, and spatial measurement.

### Modified Capabilities
- `3d-creation-studio`: Integrate CAD drafting mode, surface extrusion, and architectural component catalog with existing DCC tools.

## Approach
1. Layout & Viewport: Implement full-height viewport container with floating liquid-glass trays and toolbars over Three.js canvas.
2. Drawing & Snapping: Construct raycasting-based plane/face drawing engine with dynamic preview meshes, snapping grid/axes, and polygon extrusion geometry generator.
3. WebMCP Bridge: Register 5 new CAD tools via WebMcpService, exposing bi-directional tool invocation to Copilot chat.
4. UI Overlays: Implement desktop ribbon menu, left 11-tool palette, right 5-tray dock, and bottom VCB input HUD.

## Affected Areas
- `src/lib/core/webmcp.types.ts` (CAD tool types, schemas, and payload interfaces)
- `src/lib/three/three-scene-bridge.ts` (5 CAD tools implementation, extrusion, PBR materials, measurements)
- `src/lib/three/three-scene-bridge.spec.ts` (CAD engine unit tests)
- `src/app/components/visualizer-3d/visualizer-3d.component.ts` (Full-bleed viewport, axes, snapping, ribbon, palette, trays, VCB HUD)
- `src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` (Visualizer CAD tests)
- `src/app/components/showroom/showroom.component.ts` (Full-bleed layout mode, view toggles)
- `src/app/components/copilot-chat/copilot-chat.component.ts` (Architectural CAD prompt chips)

## Risks & Mitigations
- Complex polygon triangulation: Restrict 2D planar drafting to ground and planar faces with robust polygon triangulation.
- OrbitControls conflict: Disable orbit controls dynamically while drawing/extrusion tool or gizmo dragging is active.

## Rollback Plan
Revert showroom template and visualizer CAD overlays to standard DCC inspector layout; unregister new CAD WebMCP tools.

## Success Criteria
- Viewport renders edge-to-edge full screen with 3-axis RGB lines and snap grid.
- Interactive canvas drawing and push-pull extrusion functioning smoothly.
- Autonomous Gemini 3.7 Copilot WebMCP tool invocation for shapes, extrusions, components, materials, and measurements.
- Live measurement HUD dynamic keyboard input and metric unit parsing (mm, cm, m).
- 100% unit tests passing and clean production build.
