# Tasks: SketchUp-Style Full-Screen Web CAD Application & WebMCP Co-Design Studio

## Review Workload Forecast
- Decision needed before apply: No
- Chained PRs recommended: Yes
- 400-line budget risk: Medium

---

## Phase 1: CAD Core Types & Tool Registration
- [x] **Task 1.1**: Define CAD tool schemas and parameter interfaces in `src/lib/core/webmcp.types.ts` (`cad_draw_shape`, `cad_push_pull`, `cad_place_component`, `cad_apply_material`, `cad_measure`).
- [x] **Task 1.2**: Register 5 CAD tool schemas in `WebMcpService` with strict validation contracts.
- [x] **Task 1.3**: Add architectural asset type enums and PBR material preset enums to CAD type contracts.
- [x] **Task 1.4**: Define telemetry and measurement result interfaces (`CadMeasureResult`, `CadShapeResult`, `CadExtrusionResult`).

## Phase 2: 3D CAD Drawing & Extrusion Engine
- [x] **Task 2.1**: Implement `cad_draw_shape` handler in `WebmcpThreeSceneBridge` (rectangle, circle, polyline, wall on ground plane).
- [x] **Task 2.2**: Implement `cad_push_pull` solid extrusion and hollow room enclosure generation in `WebmcpThreeSceneBridge`.
- [x] **Task 2.3**: Implement `cad_place_component` procedural asset generator (11 architectural components: desk, chair, sofa, door, window, column, pedestal, staircase, tree, cyber_car, lamp).
- [x] **Task 2.4**: Implement `cad_apply_material` PBR material applicator (11 architectural presets with roughness/metalness overrides).
- [x] **Task 2.5**: Implement `cad_measure` spatial telemetry handler (Euclidean distance, bounding box, floor area, volume, clearance).

## Phase 3: Full-Bleed Viewport Canvas & 3-Axis RGB Lines
- [x] **Task 3.1**: Update `ShowroomComponent` layout container to full-bleed edge-to-edge styling (`h-[calc(100vh-4.5rem)]` / fullscreen toggle).
- [x] **Task 3.2**: Add 3-Axis infinite RGB coordinate lines (Red=X, Green=Z, Blue=Y) and horizon grid to `Visualizer3dComponent`.
- [x] **Task 3.3**: Implement interactive mouse raycasting and snapping cursor for ground plane and mesh planar faces.
- [x] **Task 3.4**: Implement dynamic drawing rubber-band preview mesh generator and click-commit state machine.

## Phase 4: Floating CAD UI Overlays & Trays Dock
- [x] **Task 4.1**: Implement top desktop CAD menu ribbon (File, Edit, View, Draw, Tools, Window) with Undo/Redo/GLB triggers.
- [x] **Task 4.2**: Implement left floating SketchUp tool palette (11 CAD tools with keyboard hotkeys Space, L, R, C, P, M, Q, S, T, B, O).
- [x] **Task 4.3**: Implement right collapsible floating trays dock (Entity Info, Materials, Components Library, Outliner Tree, Styles Config).
- [x] **Task 4.4**: Implement bottom Measurements HUD with live guidance badge, coordinates telemetry, and VCB metric input box.

## Phase 5: Copilot Prompt Chips, Test Suites & Verification
- [x] **Task 5.1**: Add 6 architectural CAD co-design prompt chips to `CopilotChatComponent`.
- [x] **Task 5.2**: Add comprehensive unit tests in `three-scene-bridge.spec.ts` for all 5 CAD tools and DCC handlers.
- [x] **Task 5.3**: Add unit tests in `visualizer-3d.component.spec.ts` for CAD tool strip, hotkeys, VCB parsing, gizmos, and camera presets.
