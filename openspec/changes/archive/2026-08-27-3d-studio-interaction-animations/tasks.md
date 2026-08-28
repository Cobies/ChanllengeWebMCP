# Tasks: 3D Studio Interaction & Procedural Animations

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 420 - 520 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Scene Bridge Animations & Cleanup) → PR 2 (Viewport Raycasting, Rubber-Band & Hover) → PR 3 (Comprehensive Unit Tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Procedural spawn animations & resource disposal in scene bridge | PR 1 | `bun test src/lib/three/three-scene-bridge.spec.ts` | N/A (Unit test headless harness) | `src/lib/three/three-scene-bridge.ts` |
| 2 | Direct transform raycasting, 2D rubber-band preview, & hover indicator | PR 2 | `bun test src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` | `/showroom` visual CAD canvas | `src/app/components/visualizer-3d/visualizer-3d.component.ts` |
| 3 | Full unit test suite and TDD verification across visualizer & bridge | PR 3 | `bun test` | `/showroom` automated test suite | `src/**/*.spec.ts` |

## Phase 1: Direct Transform Tool Raycasting & Gizmo Attachment

- [x] 1.1 [RED] Write unit tests in `src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` for direct mesh raycast selection and gizmo mode attachment on `move`, `rotate`, `scale`, and `push_pull`.
- [x] 1.2 [GREEN] Update `onCanvasClick` in `src/app/components/visualizer-3d/visualizer-3d.component.ts` to raycast mesh hierarchy, select root node via `bridge.selectObject()`, and attach `TransformControls` in active tool gizmo mode.
- [x] 1.3 [REFACTOR] Centralize mesh hierarchy resolution and gizmo attachment helper in `src/app/components/visualizer-3d/visualizer-3d.component.ts`.

## Phase 2: 2D Rubber-Band Drawing & OrbitControls Isolation

- [x] 2.1 [RED] Write unit tests in `src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` asserting `orbitControls.enabled = false` during drawing and verifying preview mesh creation.
- [x] 2.2 [GREEN] Add `orbitControls.enabled` suspension on anchor click and implement live rubber-band wireframe previews for `line` and `circle` alongside `rectangle` in `updateDrawingPreview()`.
- [x] 2.3 [GREEN] Restore `orbitControls.enabled = true` and dispose preview geometry on second click, VCB metric commit, or `Escape` key in `src/app/components/visualizer-3d/visualizer-3d.component.ts`.

## Phase 3: Procedural Spawn Scale Animations & Resource Cleanup

- [x] 3.1 [RED] Write unit tests in `src/lib/three/three-scene-bridge.spec.ts` verifying scale tween from `(0.001,0.001,0.001)` to `(1,1,1)`, SSR safety, and geometry disposal during push-pull and node deletion.
- [x] 3.2 [GREEN] Implement `animateSpawn(object3D, durationMs)` with cubic-out easing and SSR/headless check (`typeof window === 'undefined'`) in `src/lib/three/three-scene-bridge.ts`.
- [x] 3.3 [GREEN] Integrate `animateSpawn()` into `createObject()`, `drawShape()`, `pushPull()`, and `placeComponent()` in `src/lib/three/three-scene-bridge.ts`.
- [x] 3.4 [GREEN] Harden `disposeObject()` in `src/lib/three/three-scene-bridge.ts` to deterministically dispose geometries, materials, and textures on push-pull conversion and scene clear.

## Phase 4: Hover Outline Highlight Indicator

- [x] 4.1 [RED] Write unit tests in `src/app/components/visualizer-3d/visualizer-3d.component.spec.ts` asserting hover indicator bounds update over candidate meshes and hide on mouse leave.
- [x] 4.2 [GREEN] Add persistent `hoverBoxHelper` in `src/app/components/visualizer-3d/visualizer-3d.component.ts`, update bounds dynamically on `onCanvasMouseMove`, and hide on canvas leave or tool switch.

## Phase 5: Test Suite & TDD Verification

- [x] 5.1 Run focused visualizer unit tests: `bun test src/app/components/visualizer-3d/visualizer-3d.component.spec.ts`.
- [x] 5.2 Run focused scene bridge unit tests: `bun test src/lib/three/three-scene-bridge.spec.ts`.
- [x] 5.3 Run full test suite: `bun test` to verify zero regressions across all WebMCP modules.
