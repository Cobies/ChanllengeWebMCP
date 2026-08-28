# SDD Design: 3D Creation Studio & WebMCP DCC Co-Pilot Architecture

**Change**: `3d-creation-studio`  
**Date**: 2026-08-27  
**Status**: Completed & Archived  

## 1. System Architecture

```mermaid
graph TB
    subgraph UI ["Studio UI Layout (DCC Workstation)"]
        TopBar["Viewport HUD & Studio Toolbar\n(Shading, Gizmos, Snapping, Camera, Lighting, Export)"]
        AddShelf["Add/Create Shelf\n(Box, Sphere, Cylinder, Torus, Text, Lights, Pedestal)"]
        Outliner["Outliner Dock (Left)\n(Scene Tree, Visibility, Lock, Duplicate, Delete)"]
        Viewport["Interactive 3D Canvas (Center)\n(OrbitControls, TransformGizmos, Raycaster, Grid)"]
        Inspector["Inspector Dock (Right)\n(Live Matrix, PBR Material Studio, Geometry Dimensions)"]
    end

    subgraph State ["Reactive State Management"]
        SceneBridge["WebmcpThreeSceneBridge\n(Angular Signals & Computed Selection)"]
    end

    subgraph Engine ["Three.js Engine Core"]
        ThreeScene["THREE.Scene Graph"]
        ThreeRenderer["WebGLRenderer (Shadows & Alpha)"]
        GizmoCtrl["TransformControls (Translate/Rotate/Scale)"]
        CamCtrl["OrbitControls + Camera Presets"]
        Exporter["GLTFExporter (Download / Base64)"]
    end

    subgraph WebMCP ["Autonomous AI Layer"]
        McpTools["WebMCP Studio Tools\n(create, transform, material, hierarchy, viewport, export)"]
        ActionBus["Scene3DActionBus (FIFO Queue)"]
        Copilot["Gemini 3.7 Flash Copilot\n(Natural Language DCC Tool Calling)"]
    end

    TopBar --> SceneBridge
    AddShelf --> SceneBridge
    Outliner <--> SceneBridge
    Inspector <--> SceneBridge
    SceneBridge <--> Viewport

    SceneBridge <--> ThreeScene
    Viewport --> GizmoCtrl
    Viewport --> CamCtrl
    Viewport --> Exporter

    Copilot <--> McpTools
    McpTools --> ActionBus
    ActionBus --> SceneBridge
```

## 2. Technical Decisions & Tradeoffs

1. **TransformControls & OrbitControls Mediation**:
   - *Problem*: OrbitControls listening to mouse events while dragging TransformControls causes extreme camera shaking and disorientation.
   - *Solution*: Bind `dragging-changed` event on `TransformControls` to dynamically toggle `orbitControls.enabled = !event.value`.

2. **Angular Signals for Scene State**:
   - *Problem*: Frequent Three.js render loops (60fps) should not trigger excessive Angular change detection.
   - *Solution*: Bridge exposes standalone Angular signals (`selectedNode`, `sceneNodes`, `viewportConfig`, `sceneMetrics`) updated selectively on user interaction and tool actions.

3. **GPU Resource Disposal**:
   - *Problem*: Removing meshes dynamically during creation/deletion leads to WebGL memory leaks.
   - *Solution*: Recursive disposal helper disposing geometries, materials, and textures when deleting or resetting objects.

4. **SSR Safety**:
   - *Problem*: Angular Universal / SSR prerendering fails on direct window/WebGL access.
   - *Solution*: All Three.js canvas access, event listeners, and export triggers are gated behind `isPlatformBrowser(this.platformId)`.
