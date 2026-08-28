# WebMCP 3D Creation Studio & DCC Specification

## Purpose
Elevate the browser 3D Showroom into an interactive Digital Content Creation (DCC) Studio & Co-Pilot authoring suite with Three.js WebGL rendering, TransformControls gizmos, Raycasting selection, Outliner hierarchy, PBR Material Inspector, and autonomous Gemini 3.7 WebMCP tool calling.

## Requirements

### Requirement: WebMCP 3D DCC Tool Suite
The system MUST register and handle 7 bidirectional WebMCP tools for autonomous 3D scene manipulation (`studio_create_object`, `studio_transform_object`, `studio_update_material`, `studio_manage_hierarchy`, `studio_set_viewport`, `studio_export_gltf`, and backward-compatible `scene_3d_action`).

#### Scenario: Tool Registration
- **GIVEN** WebMcpService initialized in browser
- **WHEN** tools are listed
- **THEN** `studio_create_object`, `studio_transform_object`, `studio_update_material`, `studio_manage_hierarchy`, `studio_set_viewport`, `studio_export_gltf`, and `scene_3d_action` are registered.

#### Scenario: Procedural Primitive Creation
- **GIVEN** an active Three.js 3D scene
- **WHEN** `studio_create_object({ primitive: "box", color: "#00E5FF", metalness: 0.8, roughness: 0.2 })` is called
- **THEN** a procedural box mesh is added to the scene graph
- **AND** returned node metadata contains unique name, type, position, and material parameters.

#### Scenario: Spatial Object Transformation
- **GIVEN** a mesh in the scene named `Box_1`
- **WHEN** `studio_transform_object({ objectId: "Box_1", position: { x: 0, y: 1.5, z: 0 }, durationMs: 0 })` is called
- **THEN** the target object is transformed to the specified coordinates
- **AND** returns updated world matrix coordinates.

#### Scenario: PBR Material Live Update
- **GIVEN** a mesh in the scene named `Sphere_1`
- **WHEN** `studio_update_material({ objectId: "Sphere_1", color: "#FF0055", roughness: 0.1, transmission: 0.9 })` is called
- **THEN** the object material updates with glass transmission and cyan reflection.

#### Scenario: Scene Hierarchy Management
- **GIVEN** objects in the scene
- **WHEN** `studio_manage_hierarchy({ action: "duplicate", objectId: "Box_1" })` or `{ action: "delete", objectId: "Box_1" }` is called
- **THEN** the object is duplicated with an offset or cleanly disposed from GPU memory.

#### Scenario: Viewport Configuration & Shading Modes
- **GIVEN** the active viewport
- **WHEN** `studio_set_viewport({ shadingMode: "wireframe", cameraPreset: "top" })` is called
- **THEN** shading mode overrides are applied and camera smoothly interpolates to top-down view.

#### Scenario: GLTF/GLB Scene Export
- **GIVEN** an active 3D scene
- **WHEN** `studio_export_gltf({ binary: true })` is called
- **THEN** GLB binary is generated and browser download is triggered.

### Requirement: 3D Viewport Interaction Engine
The system MUST provide interactive Three.js viewport with OrbitControls, TransformControls gizmos, raycasting selection, and HUD toolbars.

#### Scenario: Transform Gizmo Modes
- **GIVEN** a selected 3D mesh
- **WHEN** hotkeys W, E, R, or Q are pressed or HUD buttons clicked
- **THEN** gizmo mode switches between translate, rotate, scale, and pointer.

#### Scenario: OrbitControls & TransformControls Mediation
- **GIVEN** TransformControls is being dragged
- **WHEN** mouse moves
- **THEN** OrbitControls is temporarily disabled to prevent camera jitter.

### Requirement: Scene Outliner & Property Inspector
The system MUST provide an Outliner dock for hierarchy navigation and an Inspector dock for live numeric transforms and PBR material editing.
