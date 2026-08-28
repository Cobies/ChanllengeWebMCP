# Specification: SketchUp-Style Full-Screen Web CAD Studio & WebMCP Co-Design

## Purpose
Specifies the functional and technical requirements for transforming the WebMCP 3D showroom into a desktop-grade, full-bleed SketchUp-style Web CAD environment with 5 dedicated WebMCP architectural co-design tools, 3-axis coordinates, drawing engine, dynamic measurement HUD, collapsible trays, and AI prompt chips.

---

## 1. Requirements Matrix

### 1.1 Full-Bleed CAD Viewport Layout
| ID | Requirement Statement | Priority | Conformance |
|---|---|---|---|
| **REQ-CAD-01** | The CAD showroom MUST render in a 100% full-bleed viewport (`h-[calc(100vh-4.5rem)]` / full screen) with zero page-level scrollbars on the `3d-showroom` route. | P0 | MUST |
| **REQ-CAD-02** | The viewport MUST support full-screen toggle mode (`Esc` to exit) while retaining all HUD overlays and tools. | P1 | MUST |
| **REQ-CAD-03** | Canvas resize observer MUST trigger WebGL renderer resize and perspective camera aspect ratio update within 1 frame (<16ms). | P0 | MUST |

#### Scenario: Fullscreen Viewport Resize
- **GIVEN** a user opens `/3d-showroom` on a 1920x1080 display
- **WHEN** the browser window or sidebar expands/collapses
- **THEN** the 3D canvas dimensions SHALL adapt without inducing body scrollbars
- **AND** the Three.js camera aspect ratio and renderer buffer MUST update immediately without distortion.

---

### 1.2 Desktop CAD Overlays & Tool Palette
| ID | Requirement Statement | Priority | Conformance |
|---|---|---|---|
| **REQ-CAD-04** | Top CAD Header MUST provide a desktop menu ribbon (File, Edit, View, Draw, Tools, Window), model title, Undo/Redo stack triggers, Snapshot, and GLTF export. | P0 | MUST |
| **REQ-CAD-05** | Left Tool Strip MUST provide SketchUp-style tools with hotkeys: Select (`Space`), Line (`L`), Rectangle (`R`), Circle (`C`), Push-Pull (`P`), Move (`M`), Rotate (`Q`), Scale (`S`), Tape Measure (`T`), Paint Bucket (`B`), Orbit (`O`), Pan (`H`), Zoom (`Z`). | P0 | MUST |
| **REQ-CAD-06** | Right Dock MUST feature collapsible floating trays: Outliner (Hierarchy), Entity Info (Inspector), Materials (Paint Palette), Components Library, and Styles/Environment. | P0 | MUST |
| **REQ-CAD-07** | Bottom HUD MUST display live active tool guidance prompts, dynamic measurement input box (VCB), snapping indicator, 3D cursor coordinates `(X, Y, Z)`, and triangle/vertex telemetry. | P0 | MUST |

#### Scenario: Tool Selection and Hotkey Switch
- **GIVEN** the CAD workspace is active with Select tool selected
- **WHEN** the user presses the `P` key or clicks Push-Pull on the tool strip
- **THEN** active tool SHALL switch to `push_pull`
- **AND** the bottom status bar MUST update guidance to "Click face to extrude. Type distance + Enter in Measurements."

#### Scenario: Undo / Redo Stack Navigation
- **GIVEN** a drawn rectangle or placed component in the CAD scene
- **WHEN** the user presses `Ctrl+Z` (or clicks Edit > Undo)
- **THEN** the system MUST revert the last scene action and update the outliner hierarchy
- **AND** subsequent `Ctrl+Y` (Redo) MUST restore the reverted entity.

---

### 1.3 3D CAD Coordinate System & Interactive Drawing
| ID | Requirement Statement | Priority | Conformance |
|---|---|---|---|
| **REQ-CAD-08** | The 3D scene MUST render infinite 3-Axis coordinate lines: Red (X-axis, width), Green (Z-axis, depth/ground), Blue (Y-axis, elevation). | P0 | MUST |
| **REQ-CAD-09** | The scene MUST render an architectural horizon gradient with a ground snap grid (1.0m major, 0.2m minor subdivisions). | P0 | MUST |
| **REQ-CAD-10** | Interactive drawing tools (`line`, `rectangle`, `circle`) MUST support mouse raycasting to ground plane (Y=0) and existing mesh planar faces with vertex/edge snapping. | P0 | MUST |
| **REQ-CAD-11** | Typing metric dimensions into the Measurements HUD (e.g. `4.5, 3.0` or `5.2m`) while drawing MUST commit the exact geometric dimensions. | P1 | MUST |

#### Scenario: Interactive Rectangle Drawing with Dimension Input
- **GIVEN** the Rectangle tool (`R`) is active and mouse hovers on the ground plane
- **WHEN** user clicks origin point `(0, 0, 0)`, types `6.0, 4.0`, and presses `Enter`
- **THEN** a planar 2D rectangle face of `6.0m x 4.0m` SHALL be instantiated on the ground
- **AND** the face MUST become pickable for the Push-Pull tool.

#### Scenario: Face Snapping and Normal Raycasting
- **GIVEN** a 3D extruded box in the scene
- **WHEN** the user activates Line tool (`L`) and hovers over the top face of the box
- **THEN** cursor MUST snap to the top planar face along its normal
- **AND** HUD snapping badge SHALL indicate "On Face: Box_01".

---

### 1.4 WebMCP CAD Autonomous Tools Contract

The system MUST register 5 new first-class WebMCP CAD tools alongside existing studio tools:

```
Registered WebMCP CAD Tools:
├── cad_draw_shape        (2D planar footprints, walls, rectangles, circles, polylines)
├── cad_push_pull         (Extrude planar 2D profiles into 3D architectural solids)
├── cad_place_component   (Architectural library asset placement & parametric scaling)
├── cad_apply_material    (Architectural PBR materials & texture map assignment)
└── cad_measure           (Spatial distance, bounding box, floor area, & clearance queries)
```

#### Tool 1: `cad_draw_shape`
- **Description**: Draws 2D planar profiles, architectural floor plan outlines, rectangles, circles, or walls on ground or entity faces.
- **Parameters**: `shape` (enum), `plane` (enum), `origin` ({x,y,z}), `dimensions` (width, length, radius, wallThickness, points), `name`, `fill`.

#### Tool 2: `cad_push_pull`
- **Description**: Extrudes a 2D planar profile or target face into a 3D architectural solid volume (slab, wall, room, column).
- **Parameters**: `target` (string), `distance` (number), `direction` (enum), `hollow` (boolean), `bevel` (boolean).

#### Tool 3: `cad_place_component`
- **Description**: Instantiates pre-built architectural and interior design assets into the CAD scene with precise coordinates and orientations.
- **Parameters**: `componentType` (enum: desk, chair, sofa, door, window, column, pedestal, staircase, tree, cyber_car, lamp), `name`, `position` ({x,y,z}), `rotationY`, `scale`, `materialPreset`.

#### Tool 4: `cad_apply_material`
- **Description**: Applies architectural PBR materials (concrete, oak wood, red brick, frosted glass, marble, brushed metal, ceramic tile) to entities or individual faces.
- **Parameters**: `target` (string), `materialPreset` (enum), `color` (hex), `roughness`, `metalness`, `opacity`, `repeat`.

#### Tool 5: `cad_measure`
- **Description**: Inspects geometric entities to calculate 3D distances, bounding box dimensions, surface floor areas (m²), and spatial clearances.
- **Parameters**: `targetA` (string), `targetB` (string), `measurementType` (enum: distance, bounding_box, floor_area, volume, clearance).

---

### 1.5 WebMCP Autonomous Co-Design Scenarios

#### Scenario: AI Multi-Turn Architectural Building Generation
- **GIVEN** Gemini 3.7 Copilot receives user prompt: *"Draw a 10m x 8m concrete showroom floor, push-pull it up 3.5m into walls, and place an executive desk and cyber car inside."*
- **WHEN** the autonomous execution loop runs
- **THEN** it MUST execute `cad_draw_shape(shape='rectangle', dimensions={width:10, length:8}, fill=true)`
- **AND** execute `cad_push_pull(target='...', distance=3.5)`
- **AND** execute `cad_apply_material(target='...', materialPreset='concrete')`
- **AND** execute `cad_place_component(componentType='desk', position={x:2, y:0, z:2})`
- **AND** execute `cad_place_component(componentType='cyber_car', position={x:-2, y:0, z:0})`
- **AND** all created entities MUST be synchronized to the CAD Outliner and Inspector without page reload.

#### Scenario: AI Spatial Measurement and Query
- **GIVEN** a furnished architectural room in the scene
- **WHEN** Copilot receives prompt: *"What is the clearance distance between the desk and the cyber car?"*
- **THEN** Copilot SHALL invoke `cad_measure(targetA='Desk_01', targetB='CyberCar_01', measurementType='distance')`
- **AND** return the exact Euclidean distance in meters formatted with metric precision to the user.

---

### 1.6 Copilot Prompt Chips for CAD Co-Design

The Copilot Drawer MUST provide quick architectural prompt chips:
1. 🏛️ **"Modern Pavillion"**: *"Draw an 8m x 6m floor slab, push-pull 3.2m glass walls, and add 4 marble columns."*
2. 🛋️ **"Furnish Office"**: *"Place a modern executive desk, ergonomic chair, and ambient lamp at the center."*
3. 📐 **"Measure Clearances"**: *"Measure the total floor area and bounding box of all objects in the scene."*
4. 🧱 **"Apply Materials"**: *"Apply red brick to the walls, oak wood to the floor, and frosted glass to windows."*
5. 🏎️ **"Cyber Showroom"**: *"Create a 12m circular showroom platform with brushed metal material and place a cyber car."*

---

## 2. Acceptance & Conformance Criteria

1. **Zero Layout Scroll**: The showroom container on `/3d-showroom` MUST remain `overflow-hidden` at all viewport sizes $\ge 1024px$ with full 100% viewport coverage.
2. **CAD Visuals**: Red/Green/Blue axis guides MUST intersect at `(0,0,0)` and extend infinitely along axes.
3. **Tool Completeness**: All 13 SketchUp tool shortcuts MUST be bound to keyboard events and reflect in the left palette.
4. **Autonomous WebMCP Execution**: All 5 new `cad_*` tools MUST be callable by external MCP clients and internal Gemini 3.7 Copilot agent with strictly validated schemas.
5. **Telemetry Synchronization**: Any drawing, push-pull extrusion, or asset placement MUST dynamically update vertex/polygon counts and outliner tree nodes in real time.
