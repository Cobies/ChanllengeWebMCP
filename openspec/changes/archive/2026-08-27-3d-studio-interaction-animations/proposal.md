# Proposal: 3D Studio Interaction & Animation Upgrades

## Intent
Elevate the 3D CAD/DCC studio into a responsive, desktop-grade authoring tool with direct transform raycast selection, real-time 2D CAD rubber-band previews, interactive push-pull extrusions, hover outlines, and procedural spawn animations without memory leaks.

## Scope

### In Scope
- Direct viewport mesh selection on `move`, `rotate`, and `scale` tools with immediate gizmo attachment.
- 2D rubber-band wireframe & fill preview for `line`, `rectangle`, and `circle` CAD tools.
- Camera `OrbitControls` isolation during active multi-point CAD drawing.
- Interactive face-picking and extrusion generation for Push/Pull tool.
- Procedural pop-in scale animation (0 to 1 cubic-out / back-out easing) on entity creation.
- Dynamic hover highlight outline for unselected candidate meshes.
- Systematic geometry/material disposal on node destruction.
- Comprehensive unit test suites for all interactions and animations.

### Out of Scope
- Multi-object boolean operations (CSG union/subtract).
- Physics simulation and skeletal rigging.
- Texture mapping UV unwrap editor.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `sketchup-cad-studio`: Direct transform raycast selection, 2D rubber-band previews with OrbitControls isolation, interactive push/pull face extrusion, mesh hover highlights, and spawn animation lifecycle.
- `webmcp-3d-scene-controller`: Procedural spawn animation scale runner, robust shape-to-solid push/pull conversion, and deterministic geometry/material disposal.

## Approach
- **Raycast Selection**: Extend `onCanvasClick` across `move`/`rotate`/`scale` to hit-test `meshes`, update bridge selection, and attach `TransformControls` synchronously.
- **Rubber-Band & Orbit Isolation**: Track drawing state in `visualizer-3d`; disable `orbitControls.enabled` on first point click until commit/cancel; render dynamic preview meshes for line, rect, circle.
- **Push/Pull Extrusion**: Raycast clicked 2D planar profile or 3D face, compute normal, and generate 3D extruded volume mesh via `ExtrudeGeometry` or bounding box expansion.
- **Spawn Animations**: Register active scale tweeners in a lightweight RAF ticker inside `three-scene-bridge` / `visualizer-3d` with cubic/back-out easing over 240ms.
- **Hover & Cleanup**: Raycast mouse moves to manage an emissive/outline highlight helper; invoke `.dispose()` on all geometries, materials, and textures upon mesh removal.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/components/visualizer-3d/visualizer-3d.component.ts` | Modified | Direct transform selection, rubber-band preview, orbit lock, hover helper, animation loop |
| `src/lib/three/three-scene-bridge.ts` | Modified | Spawn animation runner, push/pull geometry extrusion, disposal routines |
| `src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` | Modified | Unit tests for viewport interaction, rubber-band drawing, and orbit isolation |
| `src/lib/three/three-scene-bridge.spec.ts` | Modified | Unit tests for bridge push/pull, spawn animation ticker, and cleanup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| OrbitControls fight drawing drag | Medium | Explicitly disable `orbitControls.enabled` during active drawing mode |
| Performance overhead from RAF tweens | Low | Clean up completed animations from active ticker set |
| Memory leaks on rapid entity churn | Medium | Recursive disposal helper traversing geometry, materials, and textures |

## Rollback Plan
Revert changes to `visualizer-3d.component.ts` and `three-scene-bridge.ts` via Git commit revert to restore baseline CAD interactions.

## Dependencies
- Three.js core & addons (`OrbitControls`, `TransformControls`)

## Success Criteria
- [ ] Clicking any object while on Move/Rotate/Scale selects object and attaches transform gizmo immediately.
- [ ] Drawing Line, Rectangle, and Circle displays live rubber-band preview without camera orbit interference.
- [ ] Push/Pull tool extrudes selected 2D faces into 3D solid volumes.
- [ ] Newly spawned objects pop in smoothly from scale 0 to 1 with cubic-out easing.
- [ ] Hovering over scene objects highlights them with outline indicator.
- [ ] 100% of unit tests pass with zero geometry/material memory leaks.
