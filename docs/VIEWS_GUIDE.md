# WebMCP Application Views & Workspace Guide 📚

This guide provides an in-depth architectural and operational manual for every workspace view and persistent overlay in the application, including UI capabilities, registered W3C WebMCP tools, parameter schemas, and AI Copilot interaction scenarios.

---

## 🗺️ View Navigation Map

| View Name | Route | Category | Core Purpose | Active WebMCP Tools |
| :--- | :--- | :--- | :--- | :--- |
| **3D Digital Twin Showroom** | `/3d-showroom` | `workspace` | 3D WebGL Three.js viewport, CAD sketching, vehicle customization, and client-side rasterization | `scene_3d_action`, `take_screenshot`, `form_action_runner`, `cad_draw_shape`, `cad_push_pull`, `cad_place_component`, `cad_apply_material`, `cad_measure`, `studio_create_object`, `studio_transform_object`, `studio_update_material`, `studio_manage_hierarchy`, `studio_set_viewport`, `studio_export_gltf` |
| **Enterprise BI & Analytics** | `/enterprise-bi` | `workspace` | Multi-domain business intelligence, financial/performance telemetry, transaction ledger, and procurement | `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export`, `query_inventory`, `update_inventory_stock`, `reorder_inventory_item`, `filter_inventory_by_domain`, `get_business_domain_summary`, `open_purchase_order_modal`, `fill_purchase_order_form`, `submit_purchase_order`, `close_purchase_order_modal` |
| **WebMCP Live Inspector** | `/inspector` | `telemetry` | Real-time tool invocation logs, latency duration monitoring, audit stream, and payload inspection | *(Observes and records all tool executions across the runtime)* |
| **Devpost Judge & Rubric Guide** | `/judge-guide` | `workspace` | Hackathon criteria validation, interactive verification test harness, Chrome flag setup, and architecture maps | `judge_rubric_evaluation`, `verify_harness` |
| **AI Copilot Assistant** | *Persistent Drawer* | `assistant` | Multimodal conversational AI drawer with autonomous multi-turn loop and SubAgent delegation | `delegate_to_subagent` + *dynamic reflection of all active WebMCP tools* |
| **Interactive View Guide Modal** | *Modal Overlay* | `documentation` | In-app searchable tool documentation with one-click runnable prompts | *(Interactive reference accessible via header)* |

---

## 1. 🏎️ 3D Digital Twin Showroom (`/3d-showroom`)

### Overview & Architecture
The 3D Digital Twin Showroom bridges client-side WebGL Three.js rendering directly with the Model Context Protocol. It links 3D spatial scene graphs, camera matrices, geometric meshes, and reactive forms to autonomous AI agents and interactive DCC controls.

### View Modes
1. **SketchUp / CAD Studio Mode (`cad_fullscreen`)**:
   - Maximized DCC CAD modeling viewport with top ribbon menu, left floating modeling palette, snapping guides, transform gizmos, rubber-band drawing, and direct mesh extrusion/push-pull.
2. **Multi-Panel Inspector Mode (`multi_panel`)**:
   - Comprehensive multi-column workstation:
     - **Left Dock**: Add Shelf (primitive spawners & asset library) + Scene Outliner Tree.
     - **Center**: Persistent Three.js WebGL canvas viewport + Judge Guide embed.
     - **Right Dock**: Studio Mesh Inspector + Vehicle Customizer Form + WebMCP Telemetry Inspector.

### Core UI Capabilities
- **Direct Raycast Selection**: Click any 3D object to select, translate, rotate, scale, or inspect properties in real time.
- **2D/3D CAD Rubber-Band Drawing**: Draw rectangles, circles, and lines directly on the ground plane with snapping (`cad_draw_shape`).
- **Push-Pull Extrusion**: Extrude 2D planar geometries into 3D solid volumes (`cad_push_pull`).
- **Multimodal Viewport Capture**: High-speed canvas rasterization producing base64 PNG data URLs for visual LLM reasoning (`take_screenshot`).
- **Reactive Form Customizer**: Real-time vehicle chassis color, spoiler toggles, and drive modes with bi-directional synchronization (`form_action_runner`).

### Active WebMCP Tools
* `scene_3d_action`: Directs camera orbits (`rotate`, `zoom`, `reset_camera`), material changes (`change_mesh_color`), animations, and mesh highlights.
* `take_screenshot`: Captures the WebGL canvas as a base64 image data URL with token optimization for LLM multi-modal analysis.
* `form_action_runner`: Fills, validates, and submits Angular Reactive Forms autonomously.
* `cad_draw_shape`: Generates parametric 2D shapes on specific planes (`xy`, `xz`, `yz`).
* `cad_push_pull`: Extrudes faces along surface normals by specified distance units.
* `cad_place_component`: Places standard architectural/industrial components (`door`, `window`, `column`, `tree`, `car`).
* `cad_apply_material`: Applies PBR materials, roughness, metalness, and colors to target meshes.
* `cad_measure`: Calculates 3D distances, bounding boxes, floor areas ($m^2$), and volumes ($m^3$).
* `studio_create_object`: Creates 3D primitives (`box`, `sphere`, `cylinder`, `torus`, `plane`, `cone`).
* `studio_transform_object`: Modifies position, rotation, and scale vectors of scene nodes.
* `studio_update_material`: Configures PBR physical material properties.
* `studio_manage_hierarchy`: Selects, duplicates, deletes, or locks scene nodes.
* `studio_set_viewport`: Configures viewport rendering modes and camera presets.
* `studio_export_gltf`: Generates standard `.gltf` / `.glb` scene exports.

### Sample AI Copilot Prompts
```text
"Orbit the camera 45 degrees to the right, paint the vehicle chassis Neon Cyan (#00f0ff), and take a screenshot to inspect the front aerodynamic intake."
"Draw a 10x10 rectangle on the ground plane, push-pull it up by 4 meters, and place a door component on the front face."
```

---

## 2. 📊 Enterprise BI & Data Intelligence (`/enterprise-bi`)

### Overview & Architecture
The Enterprise BI dashboard demonstrates high-throughput business data pipelines managed through Angular Signals (`signal`, `computed`, `effect`). It provides zero-overhead reactivity, multi-domain adapters, anomaly detection, and cryptographic audit export pipelines exposed as first-class WebMCP tools.

### Workspace Tabs
1. **Analytics & Telemetry Tab**:
   - 4 Live KPI metric summary cards (Total Revenue, System Latency, CPU Utilization, Active Security Incidents).
   - Interactive SVG latency trend chart.
   - Dynamic time-range filters (`1h`, `24h`, `7d`, `30d`, `all`) and category selectors.
2. **Transactions Ledger Tab**:
   - Filterable transaction dataset with status indicators (`completed`, `pending`, `flagged`).
   - Live search by merchant, department, or minimum dollar amount.
   - Dynamic batch summary cards with automatic anomaly percentage calculations.
3. **Multi-Domain Inventory & Procurement Tab**:
   - Multi-domain inventory management across 4 verticals: `retail`, `hardware`, `logistics`, `pharma`.
   - Low-stock badge counters and threshold alerts.
   - Interactive procurement modal with automated supplier selection, priority lead time calculations, and purchase order receipts.

### Active WebMCP Tools
* `query_enterprise_metrics`: Fetches high-level operational KPIs and historical trend series.
* `filter_business_data`: Filters live transactional data table and triggers re-aggregations.
* `calculate_kpi_summary`: Computes real-time sums, averages, anomaly rates, and volume breakdowns.
* `trigger_analytics_export`: Generates downloadable audit export with SHA-256 cryptographic verification hash.
* `query_inventory`: Queries inventory items by operational domain and availability status.
* `update_inventory_stock`: Adjusts warehouse inventory levels and automatically recalculates valuations.
* `reorder_inventory_item`: Dispatches replenishment purchase orders with priority routing.
* `filter_inventory_by_domain`: Isolates domain-specific supply chain pipelines.
* `get_business_domain_summary`: Returns aggregated metrics across inventory, transactions, and assets.
* `open_purchase_order_modal`: Opens procurement purchase order modal with optional prefilled parameters.
* `fill_purchase_order_form`: Autofills procurement fields and selects in real time.
* `submit_purchase_order`: Confirms active purchase order and generates official procurement receipt.
* `close_purchase_order_modal`: Closes procurement modal.

### Sample AI Copilot Prompts
```text
"Query enterprise metrics for the performance category, filter business data for flagged transactions over $1,000, calculate the KPI summary, and export the audit report as CSV."
"Check all items in the manufacturing domain, find any with low stock, open the purchase order modal for SKU RET-102 with 50 units, and submit the order."
```

---

## 3. 🔍 WebMCP Live Inspector (`/inspector`)

### Overview & Architecture
The Inspector is the real-time observability console for the Model Context Protocol runtime. It listens to all tool invocations from browser AI agents, the internal AI Copilot, or UI manual simulations.

### Core UI Capabilities
- **Live Tool Invocation Feed**: Displays tool name, execution timestamp, duration latency in milliseconds, execution source (`native`, `emulator`, `ui`), and status badge (`success` / `error`).
- **Parameters & Payload Inspector**: Expandable JSON code blocks displaying exact input arguments and returned result payloads.
- **Status & Search Filtering**: Filter logs by success or error status, or search by tool name.
- **Log Management**: Clear execution history or export audit traces.

---

## 4. 📋 Devpost Judge & Evaluation Guide (`/judge-guide`)

### Overview & Architecture
A comprehensive, interactive scorecard and verification suite designed for hackathon judges and evaluators to test and certify 100% compliance with the W3C WebMCP specification.

### Interactive Sections
1. **🏆 Rubric Matrix**: 4-part scorecard verifying Innovation & UX (25%), WebMCP Standard (25%), Enterprise Value (25%), and Technical Architecture (25%).
2. **🤖 Copilot Deep Dive**: Step-by-step test scenarios for testing the autonomous multimodal agent loop.
3. **📊 Enterprise BI Guide**: Overview of data intelligence tools, reactive Signals, and cryptographic audit hashing.
4. **🏎️ 3D Digital Twin Guide**: WebGL Three.js action bus and viewport rasterization workflows.
5. **🌐 Chrome Flag Instructions**: Setup guide for testing native `window.modelContext` (`chrome://flags/#enable-webmcp-testing`).
6. **🏗️ Architecture Blueprint**: Complete component and service hierarchy diagrams.

### Active WebMCP Tools
* `judge_rubric_evaluation`: Returns automated compliance scores and feature checklist status.
* `verify_harness`: Executes the internal test suite and returns end-to-end verification health metrics.

---

## 5. 🤖 Persistent AI Copilot Drawer (`CopilotChatComponent`)

### Overview & Architecture
The Copilot Drawer is an autonomous multimodal assistant connected through an OpenAI-compatible Bridge Proxy (`https://bridge.cobiesscooby.com/v1`).

### Core Autonomous Capabilities
- **Dynamic Schema Reflection**: Automatically reads all WebMCP tools currently registered on the active route and transforms them into standard function calling schemas in real time.
- **Autonomous Multi-Turn Loop**: Executes up to 5 consecutive tool calling rounds autonomously without requiring manual user prompting between intermediate steps.
- **SubAgent Delegation Hub**: Integrates `delegate_to_subagent` to seamlessly offload domain tasks to `3d-specialist`, `analytics-specialist`, or `audit-specialist` workers.
- **Multimodal Visual Reasoning**: Receives base64 WebGL screenshots from `take_screenshot`, renders interactive previews with an expand lightbox, and sanitizes payload tokens before context feedback.
- **Self-Correcting JSON Recovery**: Catches malformed argument payloads from LLMs and provides structured diagnostics for autonomous recovery.
- **Latency & Status Badges**: Displays millisecond execution durations and status pills for every tool call.

---

## 6. 📖 Interactive View Guide Modal (`ViewGuideModalComponent`)

Accessible via the glowing **"📖 View Guide"** button in the top navigation header:
- Searchable directory of all 4 views and 30+ registered WebMCP tools.
- One-click **"🤖 Run Prompt"** buttons that immediately populate the AI Copilot with real-world task prompts.
- Keyboard accessible (`Esc` to dismiss).
