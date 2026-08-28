# Technical Design: SketchUp-Style Full-Screen Web CAD Studio & WebMCP Co-Design

## 1. System Architecture & Components

```
+----------------------------------------------------------------------------------------------------+
|                                    Angular 19 Application (Browser)                                |
|                                                                                                    |
|  +---------------------------+  +---------------------------------------------------------------+  |
|  |     CopilotChatComponent  |  |                 Visualizer3dComponent (CAD Studio)            |  |
|  |                           |  |                                                               |  |
|  | - Architectural Chips     |  | - Top Ribbon (File, Edit, View, Draw, Tools)                  |  |
|  | - Multi-turn Autonomous   |  | - Left Tool Strip (Select, Line, Rect, Circle, Push-Pull...) |  |
|  |   Tool Loop               |  | - Three.js WebGL Full-Bleed Viewport Canvas                   |  |
|  | - Prompt Streaming        |  | - 3-Axis RGB Ground Lines & Dynamic Snapping Cursor          |  |
|  +-------------+-------------+  | - Right Collapsible Trays (Entity Info, Materials, Library)   |  |
|                |                | - Bottom Measurements (VCB) & Telemetry HUD                   |  |
|                |                +-------------------------------+-------------------------------+  |
|                |                                                |                                  |
|                v                                                v                                  |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                 WebMcpService (Tool Registry)                                |  |
|  |  [cad_draw_shape] [cad_push_pull] [cad_place_component] [cad_apply_material] [cad_measure]     |  |
|  |  [studio_create]  [studio_transform] [studio_update_mat] [studio_hierarchy] [studio_viewport]  |  |
|  +----------------------------------------------+-----------------------------------------------+  |
|                                                 |                                                  |
|                                                 v                                                  |
|  +----------------------------------------------------------------------------------------------+  |
|  |                            WebmcpThreeSceneBridge (DCC & CAD Engine)                         |  |
|  |                                                                                              |  |
|  |  - Planar Geometry Triangulation (Rectangles, Circles, Polylines, Walls)                     |  |
|  |  - Push-Pull Extrusion Engine (Solid Prism, Hollow Enclosure, Elevation & Normals)          |  |
|  |  - Architectural PBR Material Presets (Concrete, Oak Wood, Brick, Glass, Marble, Steel...)  |  |
|  |  - Procedural Asset Library Catalog (11 Architectural & Urban Components)                    |  |
|  |  - Spatial Telemetry & Measurement Engine (Euclidean Distance, Floor Area, Volume, Bounds)   |  |
|  |  - OrbitControls vs TransformControls Event Mediation & GPU Disposal Manager                |  |
|  +----------------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. WebMCP CAD Tools Specification & Implementation

### 2.1 Tool: `cad_draw_shape`
- **Purpose**: Generates 2D planar profiles on the ground (Y=0) or mesh faces.
- **Supported Shapes**: `rectangle`, `circle`, `polyline`, `wall`.
- **Implementation**: Constructs Three.js `Shape` and `ShapeGeometry` or `PlaneGeometry`, oriented on XZ ground plane with metadata tagging (`shapeType`, `dimensions`, `isPlanarFace`).

### 2.2 Tool: `cad_push_pull`
- **Purpose**: Extrudes a 2D planar profile into a 3D architectural solid volume.
- **Implementation**: Computes bounding box/profile parameters of the target 2D mesh, generates solid `BoxGeometry`, `CylinderGeometry`, or `ExtrudeGeometry` with appropriate height and elevation offset (`y = height / 2`), and cleanly replaces 2D profile while preserving material and transform settings. Hollow mode creates hollow wall room enclosures with thickness.

### 2.3 Tool: `cad_place_component`
- **Purpose**: Places parametric 3D architectural assets into the workspace.
- **Supported Assets**: `desk`, `chair`, `sofa`, `door`, `window`, `column`, `pedestal`, `staircase`, `tree`, `cyber_car`, `lamp`.
- **Implementation**: Procedurally constructs compound Three.js `Group` assemblies with detailed geometries, sub-meshes, and PBR materials.

### 2.4 Tool: `cad_apply_material`
- **Purpose**: Applies high-fidelity architectural PBR materials.
- **Supported Presets**: `concrete`, `oak_wood`, `red_brick`, `frosted_glass`, `marble`, `brushed_metal`, `ceramic_tile`, `gold`, `carbon_fiber`, `mirror`, `asphalt`.
- **Implementation**: Updates `MeshPhysicalMaterial` / `MeshStandardMaterial` properties (roughness, metalness, transmission, clearcoat, roughnessMap repetition).

### 2.5 Tool: `cad_measure`
- **Purpose**: Spatial telemetry and geometric queries.
- **Capabilities**:
  - `distance`: Euclidean distance between object centroids or points.
  - `bounding_box`: Exact bounding box size `(width, height, depth)` in meters.
  - `floor_area`: Surface area footprint (calculating $W \times D$ for boxes and $\pi \times R^2$ for cylinders).
  - `volume`: Solid 3D volume in $m^3$.
  - `clearance`: Bounding box edge-to-edge separation clearance.

---

## 3. CAD Viewport, Snapping & UI Overlays

### 3.1 Full-Bleed Fluid Layout
- Uses `h-[calc(100vh-4.5rem)]` container in standard mode and `fixed inset-0 z-50 h-screen w-screen` in full-screen mode.
- `ResizeObserver` monitors canvas container and updates Three.js perspective camera aspect ratio and WebGL renderer resolution immediately.

### 3.2 3-Axis RGB Lines & Snapping Raycaster
- Red Line (X-axis: $-50m$ to $+50m$)
- Green Line (Z-axis: $-50m$ to $+50m$)
- Blue Line (Y-axis: $0$ to $+30m$)
- Raycaster detects ground plane intersection and mesh planar faces, providing live coordinate telemetry `(X, Y, Z)` and snapping badges (`On Ground`, `On Face: Box_01`).

### 3.3 Desktop CAD Overlays & VCB HUD
- **Top Menu Ribbon**: File, Edit, View, Draw, Tools, Window.
- **Left Tool Strip**: 11 SketchUp tools with hotkeys (`Space`, `L`, `R`, `C`, `P`, `M`, `Q`, `S`, `T`, `B`, `O`).
- **Right Floating Trays**: Entity Info, Materials (11 swatches), Component Library (11 items), Outliner Tree, Styles Config.
- **Bottom Measurements HUD**: Active guidance badge, live coordinates, and VCB metric input box with unit parsing (`mm`, `cm`, `m`).
