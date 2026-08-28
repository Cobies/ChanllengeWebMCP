# SDD Proposal: 3D Creation Studio & WebMCP DCC Co-Pilot

**Change**: `3d-creation-studio`  
**Author**: SDD Propose Executor  
**Date**: 2026-08-27  
**Status**: Completed & Archived  

## 1. Executive Summary
Transform the static 3D Showroom into a professional browser-native Digital Content Creation (DCC) Studio & Co-Pilot environment. Combines Three.js WebGL viewport rendering (TransformControls gizmos, OrbitControls, raycasting selection, Outliner dock, Add Shelf primitive palette, PBR Material Studio Inspector) with 7 autonomous WebMCP AI tool contracts for bidirectional Gemini 3.7 Flash co-creation.

## 2. Motivation & User Value
Move beyond hardcoded showroom vehicle viewing to full in-browser 3D creation and digital twin management, controllable both via human mouse/keyboard UI interactions and multimodal natural language AI copilot tool executions.

## 3. Scope & Deliverables
- **Core Types & Data Models**: Parametric primitives (`box`, `sphere`, `cylinder`, `cone`, `torus`, `torus_knot`, `plane`, `pedestal`, `text`, `light`), shading modes (`pbr`, `wireframe`, `solid`, `normal`), camera presets, and transform schemas.
- **ThreeSceneBridge WebMCP DCC Handlers**: `studio_create_object`, `studio_transform_object`, `studio_update_material`, `studio_manage_hierarchy`, `studio_set_viewport`, `studio_export_gltf`, `scene_3d_action`.
- **Viewport Engine**: Three.js `OrbitControls` + `TransformControls` (hotkeys W/E/R/Q), raycasting selection, `BoxHelper` bounding boxes, HUD toolbars.
- **Studio Docks**: `AddShelfComponent`, `OutlinerDockComponent`, `StudioInspectorComponent`.
- **Showroom Integration**: Responsive 3-dock workspace layout with Gemini 3.7 Copilot prompt chips.
