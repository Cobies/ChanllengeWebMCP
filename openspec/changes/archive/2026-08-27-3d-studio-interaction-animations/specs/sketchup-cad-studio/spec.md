# Delta for SketchUp CAD Studio

## ADDED Requirements

### Requirement: Direct Transform Tool Raycast Selection
When `move`, `rotate`, `scale`, or `push_pull` tools are active in `Visualizer3dComponent`, clicking an unselected scene mesh MUST perform raycasting, select the mesh in `WebmcpThreeSceneBridge`, and synchronously attach `TransformControls` in the matching gizmo mode (`translate`, `rotate`, `scale`).

#### Scenario: Object selection with Move tool active
- GIVEN the viewport has active tool set to `move` with no selected object
- WHEN user clicks on an unselected mesh in the viewport
- THEN the bridge MUST select the clicked mesh
- AND `TransformControls` MUST attach immediately in `translate` mode.

#### Scenario: Direct selection with Rotate and Scale tools
- GIVEN active tool is `rotate` or `scale`
- WHEN user clicks an unselected mesh
- THEN the mesh MUST be selected and `TransformControls` MUST attach in the respective gizmo mode.

### Requirement: 2D Rubber-Band Preview & OrbitControls Isolation
The 2D drawing state machine for `line`, `rectangle`, and `circle` tools MUST suspend `OrbitControls.enabled` upon placing the first anchor point, render dynamic preview geometries on pointer movement, and restore `OrbitControls.enabled` upon commit or cancellation (`Escape`).

#### Scenario: Rectangle rubber-band preview with orbit locked
- GIVEN `rectangle` tool is active and user clicks first anchor point `(0,0,0)`
- WHEN user moves cursor to `(4,0,3)` before placing the second point
- THEN `OrbitControls.enabled` MUST be set to `false`
- AND a dynamic preview `PlaneGeometry` with edge outlines MUST track the cursor.

#### Scenario: Line and Circle live previews
- GIVEN `line` or `circle` tool is active with first anchor point registered
- WHEN user moves pointer across the ground plane
- THEN a dynamic `Line` segment or circular preview mesh MUST render interactively.

#### Scenario: Drawing completion or cancellation restores camera orbit
- GIVEN an in-progress rubber-band drawing state with `OrbitControls.enabled = false`
- WHEN user clicks second point, submits VCB measurement, or presses `Escape`
- THEN temporary preview meshes MUST be removed and disposed
- AND `OrbitControls.enabled` MUST return to `true`.

### Requirement: Interactive Hover Highlight Outline Lifecycle
Moving pointer over unselected meshes MUST display a hover bounding indicator (`BoxHelper` or outline highlight helper) that dynamically tracks candidate targets and cleans up upon pointer exit or tool change.

#### Scenario: Hovering candidate mesh
- GIVEN multiple meshes present in the 3D scene
- WHEN user moves cursor over mesh `Desk_01`
- THEN hover highlight indicator MUST wrap `Desk_01`
- AND indicator MUST hide when pointer moves off the mesh.

## MODIFIED Requirements

### Requirement: Interactive 2D Drawing & Plane Raycasting
The system MUST support multi-point raycasting on ground plane `(Y=0)` and planar mesh faces for `line`, `rectangle`, and `circle`, isolating camera controls and rendering live dimensional previews.
(Previously: Drawing tools raycasted to ground plane without OrbitControls isolation or complete rubber-band wireframe previews for lines and circles.)

#### Scenario: Multi-step interactive drawing with dimension input
- GIVEN `rectangle` tool active on ground plane
- WHEN user clicks origin, types `6.0, 4.0` in Measurements HUD, and presses `Enter`
- THEN a 2D planar face of `6.0m x 4.0m` MUST be created in the scene
- AND camera orbit controls MUST remain enabled for subsequent navigation.
