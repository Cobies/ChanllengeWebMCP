# WebMCP Application Views & Workspace Guide 📚

This guide provides an in-depth explanation of every view in the application, including its architectural purpose, UI capabilities, registered W3C WebMCP tools, parameter contracts, and AI Copilot interaction scenarios.

---

## 🗺️ View Navigation Map

| View Name | Route | Category | Core Purpose | Active WebMCP Tools |
| :--- | :--- | :--- | :--- | :--- |
| **3D Digital Twin Showroom** | `/3d-showroom` | `workspace` | 3D WebGL scene manipulation, CAD modeling, vehicle customization, and viewport rasterization | `scene_3d_action`, `take_screenshot`, `form_action_runner`, `cad_draw_shape`, `cad_push_pull`, `cad_place_component`, `cad_apply_material`, `cad_measure`, `studio_create_object`, `studio_transform_object`, `studio_update_material`, `studio_manage_hierarchy`, `studio_set_viewport`, `studio_export_gltf` |
| **Enterprise BI & Analytics** | `/enterprise-bi` | `workspace` | Real-time business intelligence, financial/performance telemetry, transaction ledger, and multi-domain inventory operations | `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export`, `query_inventory`, `update_inventory_stock`, `reorder_inventory_item`, `filter_inventory_by_domain`, `get_business_domain_summary` |
| **WebMCP Live Inspector** | `/inspector` | `telemetry` | Real-time tool invocation logs, latency duration monitoring, audit stream, and payload inspection | *(Observes and logs all tool executions across the runtime)* |
| **Devpost Judge & Rubric Guide** | `/judge-guide` | `workspace` | Hackathon criteria validation, interactive verification test harness, Chrome flag instructions, and architecture maps | `judge_rubric_evaluation`, `verify_harness` |
| **AI Copilot Assistant** | *Drawer Overlay* | `assistant` | Multimodal conversational AI drawer with autonomous multi-turn tool loops | *Dynamic reflection of all currently registered WebMCP tools* |

---

## 1. 🏎️ 3D Digital Twin Showroom (`/3d-showroom`)

### Overview & Architecture
The 3D Digital Twin Showroom connects browser-based WebGL Three.js rendering directly to the Model Context Protocol. It bridges spatial scene graphs, camera matrices, geometric meshes, and reactive forms to autonomous AI agents and interactive DCC controls.

### View Modes
1. **SketchUp / CAD Studio Mode (`cad_fullscreen`)**:
   - Maximized DCC CAD modeling viewport with top modeling shelf, snapping guides, transform gizmos, rubber-band drawing, and direct mesh extrusion/push-pull.
2. **Multi-Panel Inspector Mode (`multi_panel`)**:
   - Comprehensive multi-column workstation:
     - **Left Dock**: Add Shelf (primitive spawners & asset library) + Scene Outliner Tree.
     - **Center**: Persistent Three.js WebGL canvas viewport + Judge Guide embed.
     - **Right Dock**: Studio Mesh Inspector + Vehicle Customizer Form + WebMCP Telemetry Inspector.

### Core UI Capabilities
- **Direct Raycast Selection**: Click any 3D object to select, translate, rotate, scale, or inspect properties in real time.
- **2D/3D CAD Rubber-Band Drawing**: Draw rectangles, circles, and lines directly on the ground plane with snapping.
- **Push-Pull Extrusion**: Extrude 2D planar geometries into 3D solid volumes.
- **Multimodal Viewport Capture**: High-speed canvas rasterization producing base64 PNG data URLs for visual LLM reasoning.
- **Reactive Form Customizer**: Real-time vehicle chassis color, spoiler toggles, and drive modes with bi-directional synchronization.

### Registered WebMCP Tools
* `scene_3d_action`: Directs camera orbits (`rotate`, `zoom`, `reset_camera`), material changes (`change_mesh_color`), animations, and mesh highlights.
* `take_screenshot`: Captures the WebGL canvas as a base64 image data URL with token optimization for LLM multi-modal analysis.
* `form_action_runner`: Fills, validates, and submits Angular Reactive Forms autonomously.
* `cad_draw_shape`: Generates parametric 2D shapes on specific planes (`xy`, `xz`, `yz`).
* `cad_push_pull`: Extrudes faces along surface normals by specified distance units.
* `cad_place_component`: Places standard architectural/industrial components (`door`, `window`, `column`, `solar_panel`, `chair`, `desk`).
* `cad_apply_material`: Applies PBR materials, roughness, metalness, and colors to target meshes.
* `studio_create_object`: Creates 3D primitives (`box`, `sphere`, `cylinder`, `torus`, `plane`, `cone`).
* `studio_transform_object`: Modifies position, rotation, and scale vectors of scene nodes.
* `studio_export_gltf`: Generates standard `.gltf` / `.glb` scene exports.

### Sample AI Copilot Prompts
```text
"Orbit the camera 45 degrees to the right, paint the vehicle chassis Neon Cyan (#00f0ff), and take a screenshot to inspect the front aerodynamic intake."
"Draw a 10x10 rectangle at the origin, push-pull it up by 4 units, and place a door component on the front face."
```

---

## 2. 📊 Enterprise BI & Data Intelligence (`/enterprise-bi`)

### Overview & Architecture
The Enterprise BI dashboard demonstrates high-throughput business data pipelines managed entirely through Angular Signals (`signal`, `computed`, `effect`). It provides zero-overhead reactivity, anomaly detection, and cryptographic audit export pipelines exposed as first-class WebMCP tools.

### Sub-Navigation Tabs
1. **Analytics & Telemetry Tab**:
   - 4 Live KPI metric summary cards (Total Revenue, System Latency, CPU Utilization, Active Security Incidents).
   - SVG interactive latency trend chart.
   - Dynamic time-range filters (`1h`, `24h`, `7d`, `30d`, `1y`) and category selectors.
2. **Transactions Ledger Tab**:
   - Filterable transaction dataset with status indicators (`completed`, `pending`, `flagged`).
   - Live search by merchant, department, or minimum dollar amount.
   - Dynamic batch summary cards with automatic anomaly percentage calculations.
3. **Multi-Domain Inventory Tab**:
   - Inventory management across 4 business domains: `retail`, `manufacturing`, `logistics`, `it_assets`.
   - Low-stock badge counters and threshold triggers.
   - Autonomous stock adjustment and reorder pipeline.

### Registered WebMCP Tools (9 Active Tools)
| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `query_enterprise_metrics` | `category?`: string, `timeRange?`: string | Fetches high-level operational KPIs and historical trend series |
| `filter_business_data` | `status?`: string, `minAmount?`: number, `department?`: string | Filters live transactional data table and triggers re-aggregations |
| `calculate_kpi_summary` | `metrics`: string[] | Computes real-time sums, averages, anomaly rates, and volume breakdowns |
| `trigger_analytics_export` | `format`: 'json'\|'csv'\|'pdf', `filterSummary?`: string | Generates downloadable audit export with SHA-256 cryptographic verification hash |
| `query_inventory` | `domain?`: string, `stockStatus?`: string, `searchQuery?`: string | Queries inventory items by operational domain and availability status |
| `update_inventory_stock` | `itemId`: string, `quantityChange`: number, `reason`: string | Adjusts warehouse inventory levels and automatically recalculates valuations |
| `reorder_inventory_item` | `itemId`: string, `quantity`: number, `priority`: 'low'\|'medium'\|'high'\|'urgent' | Dispatches replenishment purchase orders with priority routing |
| `filter_inventory_by_domain` | `domain`: string | Isolates domain-specific supply chain pipelines |
| `get_business_domain_summary` | `domain?`: string | Returns aggregated metrics across inventory, transactions, and assets |

### Sample AI Copilot Prompts
```text
"Query enterprise metrics for the performance category, filter business data for flagged transactions over $500, calculate the KPI summary, and export the audit report as CSV."
"Check all items in the manufacturing domain, find any with low stock, and trigger an urgent reorder of 50 units."
```

---

## 3. 🔍 WebMCP Live Inspector (`/inspector`)

### Overview & Architecture
The Inspector is the real-time observability console for the Model Context Protocol runtime. It listens to all tool invocations from browser AI agents, the internal AI Copilot, or UI manual simulations.

### Core UI Capabilities
- **Live Tool Invocation Feed**: Displays tool name, execution timestamp, duration latency in milliseconds, execution source (`ai_copilot`, `emulator`, `manual`), and status badge.
- **Parameters & Payload Inspector**: Expandable JSON code blocks displaying exact input arguments and returned result payloads.
- **Status Filtering**: Filter logs by success or error status, or search by tool name.
- **Log Management**: Clear execution history or export audit traces.

---

## 4. 📋 Devpost Judge & Evaluation Guide (`/judge-guide`)

### Overview & Architecture
A comprehensive, interactive scorecard and verification suite designed for hackathon judges and evaluators to test and certify 100% compliance with the W3C WebMCP specification.

### Interactive Sections
1. **🤖 AI Copilot Guide**: Step-by-step instructions for testing the autonomous multimodal agent loop.
2. **📊 Enterprise BI Guide**: Overview of data intelligence tools, reactive Signals, and cryptographic audit hashing.
3. **🏎️ 3D Digital Twin Guide**: WebGL Three.js action bus and viewport rasterization workflows.
4. **🏆 Rubric Checklist**: Interactive matrix verifying technical depth, agent autonomy, UI/UX polish, and security.
5. **🌐 Chrome Flag Instructions**: Setup guide for testing native `window.modelContext` / `navigator.modelContext`.
6. **🏗️ Architecture Blueprint**: Complete component and service hierarchy diagrams.

### Registered WebMCP Tools
* `judge_rubric_evaluation`: Returns automated compliance scores and feature checklist status.
* `verify_harness`: Executes the internal test suite and returns end-to-end verification health metrics.

---

## 5. 🤖 AI Copilot Drawer (`CopilotChatComponent`)

### Overview & Architecture
The Copilot Drawer is an autonomous multimodal assistant connected through an OpenAI-compatible Bridge Proxy.

### Core Autonomous Capabilities
- **Dynamic Schema Reflection**: Automatically reads all WebMCP tools currently registered on the active route and transforms them into standard function calling schemas in real time.
- **Autonomous Multi-Turn Loop**: Executes up to 5 consecutive tool calling rounds autonomously without requiring manual user prompting between intermediate steps.
- **Multimodal Visual Reasoning**: Receives base64 WebGL screenshots from `take_screenshot`, renders interactive previews with an expand lightbox, and sanitizes payload tokens before context feedback.
- **Self-Correcting JSON Recovery**: Catches malformed argument payloads from LLMs and provides structured diagnostics for autonomous recovery.
- **Latency & Status Badges**: Displays millisecond execution durations and status pills for every tool call.

---

## 🧭 Navigation & Shell Integration

The top navigation header (`HeaderComponent`) and collapsible sidebar (`SidebarComponent`) provide immediate access to all views:
- **Runtime Status Indicator**: Displays whether the browser is running on **Native Context** (Chrome flags enabled) or the in-memory **Polyfill / Emulator**.
- **Active Tools Counter**: Shows the live count of WebMCP tools registered for the current view.
- **Quick View Guide Modal**: Click the **"📖 View Guide"** button in the header or inside any view to open interactive documentation with runnable prompts.
