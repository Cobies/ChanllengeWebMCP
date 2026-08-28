# Delta for WebMCP 3D Scene Controller

## ADDED Requirements

### Requirement: Procedural Pop-In Spawn Scale Animation
Newly created 3D primitives, CAD shapes, and library components MUST execute a procedural scale pop-in animation from `(0,0,0)` to target scale using cubic-out or back-out easing over a configurable duration (default 240ms), with SSR and headless environment safety guards.

#### Scenario: Mesh creation initiates scale tween
- GIVEN an active Three.js scene bridge in a browser environment
- WHEN `cad_draw_shape`, `cad_place_component`, or `studio_create_object` adds a new mesh
- THEN the mesh scale MUST initialize at `(0.001, 0.001, 0.001)`
- AND animate to full scale `(1, 1, 1)` over 240ms with cubic-out easing.

#### Scenario: Headless / SSR animation safety fallback
- GIVEN a test or server-side environment where `window` or `requestAnimationFrame` is unavailable
- WHEN an entity is created
- THEN the bridge MUST synchronously apply final scale without throwing runtime errors.

### Requirement: Resource Disposal and Zero-Leak Memory Management
When meshes, temporary preview geometries, materials, or textures are removed or converted (such as during push-pull extrusion or scene clearing), the system MUST deterministically invoke `.dispose()` on all geometries, material instances, and texture maps.

#### Scenario: Push-pull replaces 2D profile with 3D solid without memory leak
- GIVEN an existing 2D planar profile mesh in the scene
- WHEN `cad_push_pull` converts the profile into a 3D solid volume
- THEN the original 2D geometry and materials MUST be disposed
- AND the new 3D mesh MUST replace the reference in the `meshes` map.

#### Scenario: Hierarchy deletion and scene clear cleanup
- GIVEN custom scene objects with PBR textures and geometries
- WHEN `manageHierarchy({ action: 'delete' })` or `clear_custom` executes
- THEN all associated geometries, materials, and textures MUST be disposed.

### Requirement: DCC Interaction & Animation Test Coverage Contract
The test suites `visualizer-3d.component.spec.ts` and `three-scene-bridge.spec.ts` MUST provide 100% automated test coverage for transform selection, rubber-band state machine, OrbitControls isolation, push-pull extrusion, spawn animations, and resource disposal.

#### Scenario: Viewport interaction and rubber-band tests
- GIVEN `visualizer-3d.component.spec.ts`
- WHEN testing `move`, `rotate`, `scale`, `line`, `rectangle`, `circle`, and `push_pull`
- THEN tests MUST assert raycast selection, gizmo attachment, preview creation/cleanup, and `orbitControls.enabled` suspension.

#### Scenario: Scene bridge extrusion and animation tests
- GIVEN `three-scene-bridge.spec.ts`
- WHEN executing shape creation, push-pull conversion, and node deletion
- THEN tests MUST assert scale tweening, geometry disposal calls, and scene hierarchy updates.
