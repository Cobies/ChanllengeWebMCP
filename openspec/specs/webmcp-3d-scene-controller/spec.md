# WebMCP 3D Scene Controller Specification

## Purpose
Expose Three.js WebGL orbit camera, mesh properties, material colors, and animations to WebMCP browser agents.

## Requirements

### Requirement: Three.js `scene_3d_action` Tool
The system MUST provide `scene_3d_action` tool supporting camera rotation, zoom, part highlighting, color changes, and animation playback.

#### Scenario: Orbit camera rotation
- **GIVEN** an active Three.js 3D scene
- **WHEN** `scene_3d_action({ action: "rotate", deltaX: 45, deltaY: 0 })` is executed
- **THEN** camera rotates 45 degrees smoothly
- **AND** returns updated camera coordinates.

#### Scenario: Mesh color change
- **GIVEN** a mesh named `Chassis_Body`
- **WHEN** `scene_3d_action({ action: "change_mesh_color", meshName: "Chassis_Body", hexColor: "#00E5FF" })` is executed
- **THEN** mesh material color updates to `#00E5FF`
- **AND** returns success confirmation.
