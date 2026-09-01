# WebMCP Tools API Reference 🛠️

This document provides the complete, authoritative specification for all **WebMCP tools** registered across the application. Each tool adheres strictly to the **W3C Model Context Protocol in the Browser** standard with validated JSON Schema parameter contracts, type definitions, return payloads, and real-world AI prompt invocations.

---

## 📑 Tool Index by Domain

| Category | Tool Identifier | Active Route | Core Purpose |
| :--- | :--- | :--- | :--- |
| **3D CAD & Spatial Studio** | [`scene_3d_action`](#1-scene_3d_action) | `/3d-showroom` | Camera orbits, zoom, mesh colors, animations, and camera reset |
| | [`take_screenshot`](#2-take_screenshot) | Global / `/3d-showroom` | Client-side WebGL canvas rasterization to base64 PNG |
| | [`cad_draw_shape`](#3-cad_draw_shape) | `/3d-showroom` | Generates 2D planar CAD profiles on ground or entity faces |
| | [`cad_push_pull`](#4-cad_push_pull) | `/3d-showroom` | Extrudes 2D planar profiles into 3D architectural solid volumes |
| | [`cad_place_component`](#5-cad_place_component) | `/3d-showroom` | Spawns architectural/interior components into the scene |
| | [`cad_apply_material`](#6-cad_apply_material) | `/3d-showroom` | Assigns PBR architectural materials to meshes and faces |
| | [`cad_measure`](#7-cad_measure) | `/3d-showroom` | Calculates distances, bounding boxes, areas ($m^2$), and volumes |
| | [`studio_create_object`](#8-studio_create_object) | `/3d-showroom` | Procedural 3D primitive and light instantiation |
| | [`studio_transform_object`](#9-studio_transform_object) | `/3d-showroom` | Modifies position, rotation, and scale transforms |
| | [`studio_update_material`](#10-studio_update_material) | `/3d-showroom` | Configures PBR physical material properties |
| | [`studio_manage_hierarchy`](#11-studio_manage_hierarchy) | `/3d-showroom` | Scene graph operations (select, delete, duplicate, lock) |
| | [`studio_set_viewport`](#12-studio_set_viewport) | `/3d-showroom` | Viewport shaders (PBR, wireframe) and camera view presets |
| | [`studio_export_gltf`](#13-studio_export_gltf) | `/3d-showroom` | Exports 3D scene or selected mesh as GLTF / GLB |
| **Enterprise BI & Analytics** | [`query_enterprise_metrics`](#14-query_enterprise_metrics) | `/enterprise-bi` | Queries operational KPIs across FinOps, Retention, Risk, Supply Chain |
| | [`filter_business_data`](#15-filter_business_data) | `/enterprise-bi` | Filters transaction datasets by status, min amount, and department |
| | [`calculate_kpi_summary`](#16-calculate_kpi_summary) | `/enterprise-bi` | Computes real-time sums, averages, and anomaly distributions |
| | [`trigger_analytics_export`](#17-trigger_analytics_export) | `/enterprise-bi` | Generates audit exports with SHA-256 cryptographic verification |
| | [`query_inventory`](#18-query_inventory) | `/enterprise-bi` | Queries catalog across retail, hardware, logistics, and pharma |
| | [`update_inventory_stock`](#19-update_inventory_stock) | `/enterprise-bi` | Adjusts stock quantities with operational audit reasons |
| | [`reorder_inventory_item`](#20-reorder_inventory_item) | `/enterprise-bi` | Dispatches replenishment purchase orders with priority routing |
| | [`filter_inventory_by_domain`](#21-filter_inventory_by_domain) | `/enterprise-bi` | Isolates domain-specific supply chain pipelines |
| | [`get_business_domain_summary`](#22-get_business_domain_summary) | `/enterprise-bi` | Aggregates scorecard metrics, valuation, and SKU health |
| | [`open_purchase_order_modal`](#23-open_purchase_order_modal) | `/enterprise-bi` | Opens procurement modal with optional prefilled parameters |
| | [`fill_purchase_order_form`](#24-fill_purchase_order_form) | `/enterprise-bi` | Autofills procurement modal fields in real time |
| | [`submit_purchase_order`](#25-submit_purchase_order) | `/enterprise-bi` | Confirms and submits active procurement order |
| | [`close_purchase_order_modal`](#26-close_purchase_order_modal) | `/enterprise-bi` | Closes procurement order modal |
| **Shell & Orchestration** | [`navigate_to_view`](#27-navigate_to_view) | Global Shell | Autonomous workspace router (`/3d-showroom`, `/enterprise-bi`, etc.) |
| | [`form_action_runner`](#28-form_action_runner) | `/3d-showroom` | Fills, validates, and submits Angular Reactive Forms |
| | [`judge_rubric_evaluation`](#29-judge_rubric_evaluation) | `/judge-guide` | Returns automated compliance score and feature checklist |
| | [`delegate_to_subagent`](#31-delegate_to_subagent) | Global / Copilot | Dynamically synthesizes task delegation to specialized subagents |
| **In-Browser Agent Memory** | [`mem_save`](#32-mem_save) | Global / Inspector | Saves or updates episodic observations, facts, rules, contexts, preferences |
| | [`mem_search`](#33-mem_search) | Global / Inspector | Performs BM25 lexical ranking queries across stored agent memories |
| | [`mem_context`](#34-mem_context) | Global / Inspector | Retrieves consolidated active project context and pinned rules |
| | [`mem_pin`](#35-mem_pin) | Global / Inspector | Pins a critical memory/rule so it is never evicted from working context |
| | [`mem_unpin`](#36-mem_unpin) | Global / Inspector | Unpins a previously pinned memory item |
| | [`mem_session_summary`](#37-mem_session_summary) | Global / Inspector | Records, retrieves, or lists multi-turn session summaries |

---

## 🏎️ 1. 3D CAD & Spatial Studio Tools

### 1. `scene_3d_action`
* **Route**: `/3d-showroom`
* **Purpose**: Manipulates the interactive Three.js WebGL viewport: camera orbit rotation, zoom level, mesh material colors, animation clips, and camera resets.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["rotate", "zoom", "change_mesh_color", "play_animation", "reset_camera", "highlight_part"],
      "description": "Spatial action command to execute"
    },
    "deltaX": { "type": "number", "description": "Horizontal orbit degrees (e.g. 45)" },
    "deltaY": { "type": "number", "description": "Vertical orbit degrees (e.g. -15)" },
    "zoomFactor": { "type": "number", "description": "Multiplier (0.8 = zoom in, 1.25 = zoom out)" },
    "meshName": { "type": "string", "description": "Target mesh identifier in 3D scene graph" },
    "hexColor": { "type": "string", "description": "Hex color string (e.g. '#00f0ff')" },
    "clipName": { "type": "string", "description": "Animation clip identifier" },
    "durationMs": { "type": "number", "default": 600, "description": "Lerp transition time in milliseconds" }
  },
  "required": ["action"]
}
```

#### Return Interface (`Scene3DActionResult`)
```typescript
interface Scene3DActionResult {
  success: boolean;
  action: 'rotate' | 'zoom' | 'change_mesh_color' | 'play_animation' | 'reset_camera' | 'highlight_part';
  sceneState: {
    camera: { x: number; y: number; z: number; target: [number, number, number] };
    activeMeshes: string[];
    currentAnimation?: string;
  };
  message: string;
}
```

#### Sample AI Invocation
```text
"Orbit the camera 90 degrees right and paint the chassis Neon Cyan (#00f0ff)."
```
```json
{
  "name": "scene_3d_action",
  "arguments": {
    "action": "rotate",
    "deltaX": 90,
    "durationMs": 600
  }
}
```

---

### 2. `take_screenshot`
* **Route**: Global / `/3d-showroom`
* **Purpose**: Performs client-side WebGL canvas rasterization to capture a high-resolution base64 PNG/JPEG snapshot for multimodal LLM vision reasoning.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "selector": { "type": "string", "description": "Target element CSS selector (default: 'canvas, body')" },
    "format": { "type": "string", "enum": ["image/png", "image/jpeg", "image/webp"], "default": "image/png" },
    "quality": { "type": "number", "default": 0.92, "description": "Compression quality (0.1 to 1.0)" }
  }
}
```

#### Return Interface (`TakeScreenshotResult`)
```typescript
interface TakeScreenshotResult {
  success: boolean;
  image: string; // "data:image/png;base64,iVBORw0KGgo..."
  mimeType: string;
  dimensions: { width: number; height: number };
  timestamp: number;
  error?: string;
}
```

#### Sample AI Invocation
```text
"Take a high-resolution screenshot to inspect the front aerodynamic intake."
```
```json
{
  "name": "take_screenshot",
  "arguments": {
    "selector": "canvas",
    "format": "image/png"
  }
}
```

---

### 3. `cad_draw_shape`
* **Route**: `/3d-showroom`
* **Purpose**: Generates parametric 2D planar CAD profiles, floor plan footprints, rectangles, circles, walls, and polylines on ground or entity faces.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "shape": {
      "type": "string",
      "enum": ["rectangle", "circle", "line", "polyline", "wall", "polygon"],
      "description": "2D shape geometry type to generate"
    },
    "name": { "type": "string", "description": "Unique identifier name for the 2D node" },
    "plane": { "type": "string", "enum": ["xz", "xy", "yz", "ground"], "default": "ground" },
    "origin": {
      "type": "object",
      "properties": { "x": { "type": "number" }, "y": { "type": "number" }, "z": { "type": "number" } }
    },
    "dimensions": {
      "type": "object",
      "properties": {
        "width": { "type": "number" },
        "length": { "type": "number" },
        "radius": { "type": "number" },
        "wallThickness": { "type": "number" },
        "height": { "type": "number" }
      }
    },
    "fill": { "type": "boolean", "default": true },
    "materialPreset": {
      "type": "string",
      "enum": ["concrete", "wood_oak", "brick_red", "glass_frosted", "marble_carrara", "steel_brushed", "tile_subway", "gold", "neon_cyan", "matte_dark", "plaster_white"]
    }
  },
  "required": ["shape"]
}
```

---

### 4. `cad_push_pull`
* **Route**: `/3d-showroom`
* **Purpose**: Extrudes a 2D planar face or target profile into a 3D architectural solid volume along surface normal vectors.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "target": { "type": "string", "description": "Target 2D shape name or 'selected'" },
    "distance": { "type": "number", "description": "Metric extrusion distance in meters (e.g. 3.2)" },
    "direction": { "type": "string", "enum": ["up", "down", "normal", "x", "y", "z"], "default": "up" },
    "hollow": { "type": "boolean", "description": "If true, extrudes hollow perimeter walls" },
    "bevel": { "type": "boolean", "description": "If true, adds subtle edge beveling" },
    "materialPreset": { "type": "string", "description": "PBR material preset for extruded solid" }
  },
  "required": ["target", "distance"]
}
```

---

### 5. `cad_place_component`
* **Route**: `/3d-showroom`
* **Purpose**: Instantiates pre-built parametric architectural and interior design assets into the scene.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "componentType": {
      "type": "string",
      "enum": ["desk", "chair", "sofa", "door", "window", "column", "pedestal", "staircase", "tree", "car", "cyber_car", "lamp"],
      "description": "Architectural archetype to place"
    },
    "name": { "type": "string", "description": "Unique component node name" },
    "position": {
      "type": "object",
      "properties": { "x": { "type": "number" }, "y": { "type": "number" }, "z": { "type": "number" } }
    },
    "rotationY": { "type": "number", "description": "Rotation around vertical Y axis in degrees" },
    "scale": { "oneOf": [{ "type": "number" }, { "type": "object", "properties": { "x": { "type": "number" }, "y": { "type": "number" }, "z": { "type": "number" } } }] },
    "materialPreset": { "type": "string", "description": "Material preset override" }
  },
  "required": ["componentType"]
}
```

---

### 6. `cad_apply_material`
* **Route**: `/3d-showroom`
* **Purpose**: Applies architectural PBR materials, roughness, metalness, clearcoat, and colors to entities or individual faces.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "target": { "type": "string", "description": "Target mesh name or 'selected'" },
    "materialPreset": {
      "type": "string",
      "enum": ["concrete", "wood_oak", "brick_red", "glass_frosted", "marble_carrara", "steel_brushed", "tile_subway", "gold", "neon_cyan", "matte_dark", "plaster_white"]
    },
    "color": { "type": "string", "description": "Hex color override (e.g. '#94a3b8')" },
    "roughness": { "type": "number", "description": "Roughness scalar (0.0 to 1.0)" },
    "metalness": { "type": "number", "description": "Metalness scalar (0.0 to 1.0)" },
    "opacity": { "type": "number", "description": "Opacity scalar (0.0 to 1.0)" },
    "transmission": { "type": "number", "description": "Optical transmission for glass" },
    "wireframe": { "type": "boolean" }
  },
  "required": ["target", "materialPreset"]
}
```

---

### 7. `cad_measure`
* **Route**: `/3d-showroom`
* **Purpose**: Inspects geometric entities to compute 3D distances, bounding box dimensions, floor areas ($m^2$), volumes ($m^3$), and spatial clearances.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "targetA": { "type": "string", "description": "First target entity name (or 'scene')" },
    "targetB": { "type": "string", "description": "Second target entity name for clearance / distance" },
    "measurementType": {
      "type": "string",
      "enum": ["distance", "bounding_box", "floor_area", "volume", "clearance"]
    }
  },
  "required": ["targetA", "measurementType"]
}
```

---

### 8. `studio_create_object`
* **Route**: `/3d-showroom`
* **Purpose**: Procedural instantiation of 3D primitives (`box`, `sphere`, `cylinder`, `cone`, `torus`, `torus_knot`, `plane`, `pedestal`, `light`, `text`) with customized PBR materials.

---

### 9. `studio_transform_object`
* **Route**: `/3d-showroom`
* **Purpose**: Modifies position, rotation, and scale vectors of a target scene node with absolute or relative coordinates.

---

### 10. `studio_update_material`
* **Route**: `/3d-showroom`
* **Purpose**: Updates PBR material attributes (color, metalness, roughness, transmission, emissive, opacity, wireframe) of target objects.

---

### 11. `studio_manage_hierarchy`
* **Route**: `/3d-showroom`
* **Purpose**: Performs scene tree management: `select`, `duplicate`, `delete`, `toggle_visibility`, `lock`, `clear_custom`, or `reset_scene`.

---

### 12. `studio_set_viewport`
* **Route**: `/3d-showroom`
* **Purpose**: Configures viewport rendering passes (`pbr`, `wireframe`, `solid`, `normal`), camera view presets (`perspective`, `top`, `front`, `side`, `iso`), floor grid, shadows, and transform gizmo modes (`translate`, `rotate`, `scale`, `none`).

---

### 13. `studio_export_gltf`
* **Route**: `/3d-showroom`
* **Purpose**: Exports the active 3D scene or selected mesh as a standard `.gltf` or binary `.glb` asset.

---

## 📊 2. Enterprise BI & Analytics Tools

### 14. `query_enterprise_metrics`
* **Route**: `/enterprise-bi`
* **Purpose**: Queries enterprise operational KPIs, latency, and telemetry series filtered by category, business domain, or time window.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "domain": {
      "type": "string",
      "description": "Target business domain (supply_chain, financial_risk, customer_retention, cloud_finops)"
    },
    "category": {
      "type": "string",
      "enum": ["performance", "financial", "infrastructure", "security"],
      "description": "Metric category filter"
    },
    "department": { "type": "string", "description": "Filter by department or segment" },
    "timeRange": { "type": "string", "enum": ["1h", "24h", "7d", "30d"], "description": "Historical time window" },
    "limit": { "type": "number", "description": "Maximum records to return" }
  }
}
```

---

### 15. `filter_business_data`
* **Route**: `/enterprise-bi`
* **Purpose**: Filters the live transactional ledger reactively by status, minimum dollar amount, department, or search query.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "domain": { "type": "string" },
    "status": { "type": "string", "enum": ["completed", "pending", "flagged", "all"] },
    "minAmount": { "type": "number", "description": "Minimum transaction USD amount" },
    "department": { "type": "string" },
    "searchTerm": { "type": "string" }
  }
}
```

---

### 16. `calculate_kpi_summary`
* **Route**: `/enterprise-bi`
* **Purpose**: Computes arithmetic aggregations, anomaly detection percentages, and department volume distributions across selected metrics.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "domain": { "type": "string" },
    "metrics": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of metric IDs to include in the calculation"
    }
  }
}
```

---

### 17. `trigger_analytics_export`
* **Route**: `/enterprise-bi`
* **Purpose**: Generates a downloadable compliance audit export (JSON, CSV, or PDF) with an immutable SHA-256 cryptographic checksum.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "domain": { "type": "string" },
    "format": { "type": "string", "enum": ["json", "csv", "pdf"] },
    "filterSummary": { "type": "string", "description": "Audit justification or notes" }
  },
  "required": ["format"]
}
```

---

### 18. `query_inventory`
* **Route**: `/enterprise-bi`
* **Purpose**: Queries the multi-domain inventory catalog with domain, status, search term, and low-stock filters.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "domain": { "type": "string", "enum": ["retail", "hardware", "logistics", "pharma", "all"] },
    "status": { "type": "string", "enum": ["in_stock", "low_stock", "out_of_stock", "reordered", "all"] },
    "searchTerm": { "type": "string" },
    "lowStockOnly": { "type": "boolean" }
  }
}
```

---

### 19. `update_inventory_stock`
* **Route**: `/enterprise-bi`
* **Purpose**: Adjusts inventory stock levels by a positive or negative delta with an operational audit justification.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "sku": { "type": "string", "description": "Item SKU code (e.g. RET-101)" },
    "delta": { "type": "number", "description": "Quantity change delta (+/-)" },
    "reason": { "type": "string", "description": "Operational audit reason" }
  },
  "required": ["sku", "delta"]
}
```

---

### 20. `reorder_inventory_item`
* **Route**: `/enterprise-bi`
* **Purpose**: Dispatches automated replenishment purchase orders with supplier lead time calculations and priority ratings.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "sku": { "type": "string", "description": "Target SKU to replenish" },
    "quantity": { "type": "number", "description": "Units to reorder (> 0)" },
    "priority": { "type": "string", "enum": ["standard", "expedited", "critical"] }
  },
  "required": ["sku", "quantity"]
}
```

---

### 21. `filter_inventory_by_domain`
* **Route**: `/enterprise-bi`
* **Purpose**: Sets active domain and status filters for the multi-domain supply chain workspace.

---

### 22. `get_business_domain_summary`
* **Route**: `/enterprise-bi`
* **Purpose**: Computes multi-domain operational scorecards, total valuations, and low-stock alert tallies.

---

### 23. `open_purchase_order_modal`
* **Route**: `/enterprise-bi`
* **Purpose**: Opens the procurement purchase order modal with optional prefilled SKU, quantity, priority, and notes.

---

### 24. `fill_purchase_order_form`
* **Route**: `/enterprise-bi`
* **Purpose**: Real-time programmatic control of procurement input fields, select dropdowns, and supplier selectors.

---

### 25. `submit_purchase_order`
* **Route**: `/enterprise-bi`
* **Purpose**: Confirms the active procurement order, creates an official purchase receipt, updates warehouse status, and appends to the audit trail.

---

### 26. `close_purchase_order_modal`
* **Route**: `/enterprise-bi`
* **Purpose**: Closes the procurement purchase order modal.

---

## 🧭 3. Shell, Forms, Navigation & Evaluation Tools

### 27. `navigate_to_view`
* **Route**: Global Shell
* **Purpose**: Switches active UI workspaces (`3d-showroom`, `enterprise-bi`, `inspector`, `judge-guide`), mounting route-specific WebMCP tools automatically.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "targetView": { "type": "string", "description": "Target workspace (e.g. '3d-showroom', 'enterprise-bi')" },
    "reason": { "type": "string", "description": "Navigation justification" }
  },
  "required": ["targetView", "reason"]
}
```

---

### 28. `form_action_runner`
* **Route**: `/3d-showroom`
* **Purpose**: Fills input controls, triggers validation checks, and submits Angular Reactive Forms (`vehicle-customizer`).

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "formId": { "type": "string", "description": "Target reactive form ID (e.g. 'vehicle-customizer')" },
    "fields": { "type": "object", "description": "Key-value map of form controls" },
    "submit": { "type": "boolean", "default": false }
  },
  "required": ["formId", "fields"]
}
```

---

### 29. `judge_rubric_evaluation`
* **Route**: `/judge-guide`
* **Purpose**: Returns an automated evaluation report containing compliance scores across all hackathon rubric dimensions.

---

### 30. `verify_harness`
* **Route**: `/judge-guide`
* **Purpose**: Runs end-to-end unit tests and verification checks across the WebMCP runtime.

---

### 31. `delegate_to_subagent`
* **Route**: Global / Copilot
* **Purpose**: Dynamically synthesized delegation meta-tool allowing parent orchestrator agents to assign sub-tasks to active specialist subagents.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "target_subagent": {
      "type": "string",
      "description": "Identifier of the target specialist subagent",
      "enum": ["3d-specialist", "analytics-specialist", "audit-specialist"]
    },
    "objective": { "type": "string", "description": "Clear, actionable subagent task prompt" },
    "parameters": { "type": "object", "description": "Optional parameters map" },
    "context_hint": { "type": "string", "description": "Background context or previous tool data" }
  },
  "required": ["target_subagent", "objective"]
}
```

---

## 🧠 4. In-Browser Agent Memory Tools

### 32. `mem_save`
* **Route**: Global / Inspector
* **Purpose**: Saves or updates an episodic observation, learned fact, business rule, context note, preference, or session note in client-side IndexedDB with automatic BM25 index synchronization.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "topic": { "type": "string", "description": "Unique key or topic identifier for the memory" },
    "content": { "type": "string", "description": "The detailed content, fact, rule, or observation" },
    "category": {
      "type": "string",
      "enum": ["observation", "fact", "rule", "context", "preference", "session"],
      "default": "observation",
      "description": "Category classification"
    },
    "tags": { "type": "array", "items": { "type": "string" }, "description": "Searchable tag keywords" },
    "pinned": { "type": "boolean", "default": false, "description": "If true, pins memory to prevent LRU eviction" },
    "metadata": { "type": "object", "description": "Optional arbitrary metadata map" }
  },
  "required": ["topic", "content"]
}
```

---

### 33. `mem_search`
* **Route**: Global / Inspector
* **Purpose**: Executes pure TypeScript BM25 lexical search ranking over stored memories with category filters, tag matches, score thresholds, and top-K limits.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Search keywords, query string, or topic" },
    "category": { "type": "string", "description": "Optional category filter" },
    "tags": { "type": "array", "items": { "type": "string" }, "description": "Filter by tags" },
    "pinnedOnly": { "type": "boolean", "default": false, "description": "Restrict results to pinned memories" },
    "topK": { "type": "number", "default": 10, "description": "Maximum ranked results to return" },
    "minScore": { "type": "number", "default": 0.1, "description": "Minimum BM25 score threshold" }
  },
  "required": ["query"]
}
```

---

### 34. `mem_context`
* **Route**: Global / Inspector
* **Purpose**: Retrieves a consolidated, prompt-ready markdown context block containing active project rules, pinned preferences, and recent observations for LLM system prompt injection.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string", "description": "Filter by specific category" },
    "maxTokens": { "type": "number", "default": 2000, "description": "Estimated token budget limit" },
    "includePinned": { "type": "boolean", "default": true, "description": "Always prioritize pinned memories" }
  }
}
```

---

### 35. `mem_pin`
* **Route**: Global / Inspector
* **Purpose**: Pins a critical memory, rule, or preference by ID or topic so it is never discarded by LRU eviction and is always preloaded into agent context.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "Unique memory item ID" },
    "topic": { "type": "string", "description": "Memory topic name to pin" },
    "pinned": { "type": "boolean", "default": true }
  }
}
```

---

### 36. `mem_unpin`
* **Route**: Global / Inspector
* **Purpose**: Unpins a previously pinned memory item by ID or topic.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "Unique memory item ID" },
    "topic": { "type": "string", "description": "Memory topic name to unpin" }
  }
}
```

---

### 37. `mem_session_summary`
* **Route**: Global / Inspector
* **Purpose**: Records, retrieves, or lists multi-turn agent session summaries with key learnings, topics covered, and tool invocation counts.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "action": { "type": "string", "enum": ["get", "save", "list"], "default": "save" },
    "summary": { "type": "string", "description": "Session summary narrative" },
    "sessionId": { "type": "string", "description": "Unique session ID" },
    "keyLearnings": { "type": "array", "items": { "type": "string" } }
  }
}
```

