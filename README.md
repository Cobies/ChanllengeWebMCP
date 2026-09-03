# WebMCP Angular Toolkit & 3D Interactive Enterprise Showcase 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular 22](https://img.shields.io/badge/Angular-22.0-dd0031.svg?logo=angular)](https://angular.dev)
[![Bun Runtime](https://img.shields.io/badge/Runtime-Bun-f472b6.svg?logo=bun)](https://bun.sh)
[![Tests: 483 Passing](https://img.shields.io/badge/Tests-483%20Passing-10b981.svg)](docs/ARCHITECTURE.md)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg?logo=threedotjs)](https://threejs.org)
[![AI Copilot](https://img.shields.io/badge/AI%20Copilot-Multimodal%20Agent-purple.svg)](docs/SUBAGENTS_SDK.md)
[![In-Browser Memory](https://img.shields.io/badge/Memory-IndexedDB%20%2B%20BM25-blueviolet.svg)](docs/ARCHITECTURE.md)
[![W3C WebMCP Standard](https://img.shields.io/badge/WebMCP-W3C%20Standard-emerald.svg)](https://modelcontextprotocol.io)

An enterprise Angular 22 toolkit and multi-route interactive showcase for the **W3C WebMCP (Model Context Protocol in the Browser)** standard. Bridges browser AI agents (Chrome AI, ChatGPT in-app browser, Claude, and **built-in Autonomous AI Copilot**) directly with Angular reactive Signals, client-side Three.js WebGL scenes, enterprise business intelligence analytics, declarative template directives, form automation, multimodal viewport snapshots, a dynamic **SubAgents Orchestration SDK**, and an **In-Browser Episodic & Semantic Memory Engine**.

---

## 📚 Documentation Suite & Deep-Dives

Explore the comprehensive documentation guides created for developers, architects, and hackathon judges:

- 🏗️ **[System Architecture & In-Depth Design](docs/ARCHITECTURE.md)**: Full ASCII/Mermaid blueprints, 5-layer architecture breakdown, frame-synchronized WebGL action bus, reactive data flow sequences, and in-browser memory subsystem.
- 🤖 **[Dynamic SubAgents SDK Guide](docs/SUBAGENTS_SDK.md)**: Complete guide to `@cobies/webmcp-angular` subagent registry, multi-strategy tool scoping, ephemeral execution loops, and dynamic function schema synthesis.
- 🛠️ **[WebMCP Tools API Reference](docs/WEBMCP_TOOLS.md)**: Authoritative parameter contracts, JSON schemas, return payloads, and sample prompts for all 37 registered WebMCP tools across 3D CAD, BI, shell, and memory domains.
- 📖 **[Application Views & Workspace Guide](docs/VIEWS_GUIDE.md)**: Detailed manual for all 4 routed workspaces (`/3d-showroom`, `/enterprise-bi`, `/inspector`, `/judge-guide`), modal guides, and copilot drawers.
- 🏆 **[Devpost Submission & Hackathon Write-up](docs/DEVPOST_SUBMISSION.md)**: Official hackathon submission answering all 4 mandatory criteria prompts, plus a timestamped 3-minute demo video script.

---

## 🌟 Key Capabilities & Highlights

1. **🤖 Autonomous In-App AI Copilot & SubAgents Delegation**:
   - Built-in conversational chat drawer powered by an AI Copilot connected through an OpenAI-compatible bridge proxy (`https://api.your-proxy.com/v1` by default). The Copilot proxy is fully decoupled and configurable via Angular Dependency Injection: developers can provide `COPILOT_API_BASE` in `src/app/app.config.ts` (`{ provide: COPILOT_API_BASE, useValue: 'https://my-proxy.company.com/v1' }`) to point to their own enterprise or local proxy endpoint.
   - Dynamic WebMCP-to-OpenAI function schema conversion with autonomous multi-turn recursive execution loop (up to 5 turns).
   - Dynamic delegation meta-tool (`delegate_to_subagent`) that offloads complex sub-tasks to specialized domain workers (`3d-specialist`, `analytics-specialist`, `audit-specialist`), saving up to **85% of LLM context tokens**.

2. **🧠 Zero-Backend In-Browser Episodic & Semantic Memory Engine (Engram-Style)**:
   - **Client-Side Persistence**: `WebMcpIndexedDbStore` with compound indexing (`webmcp_memory_db`) and automatic in-memory fallback for SSR hydration.
   - **Pure TypeScript BM25 Search**: Fast sub-millisecond lexical search ranking with Robertson-Spärck Jones IDF and field boosts (topic 2x, tags 1.5x).
   - **6 Standardized Memory Tools**: `mem_save`, `mem_search`, `mem_context`, `mem_pin`, `mem_unpin`, and `mem_session_summary`.
   - **Orchestrator-Driven Proactivity**: Pre-turn context enrichment in system prompts, proactive memory saving directives, and passive tool outcome interceptors.
   - **Live Inspector Memory Store**: Dedicated interactive UI tab for auditing memories, testing BM25 queries, and toggling pins.

3. **🏎️ SketchUp-Style 3D CAD Studio & Multimodal Viewport Vision**:
   - Frame-synchronized Three.js WebGL spatial engine (`SceneActionBus`) for camera orbit rotation (`rotate`), zoom (`zoom`), material colors (`change_mesh_color`), animations, and part highlighting.
   - Parametric 2D rubber-band drawing (`cad_draw_shape`) on arbitrary planes (`xz`, `xy`, `yz`) and push-pull solid volume extrusion (`cad_push_pull`).
   - Zero-latency client-side WebGL canvas rasterization (`take_screenshot`) producing base64 image data URLs with rich in-chat preview cards and lightbox expanders.

4. **📊 Enterprise BI & Multi-Domain Supply Chain Intelligence**:
   - **4 Pluggable Domain Adapters**: `CloudFinOpsAdapter`, `SupplyChainAdapter`, `FinancialRiskAdapter`, and `CustomerRetentionAdapter`.
   - Real-time arithmetic aggregations, anomaly detection percentages, and department volume distributions (`calculate_kpi_summary`, `filter_business_data`).
   - Procurement & Purchase Order pipeline (`open_purchase_order_modal`, `fill_purchase_order_form`, `submit_purchase_order`) with cryptographic SHA-256 audit exports (`trigger_analytics_export`).

5. **⚡ Angular 22 Reactive Signals First**:
   - Pure reactive signals (`signal()`, `computed()`, `effect()`) for state management with zero change-detection penalty.
   - Declarative template directives: `[webmcpTool]`, `[webmcpAction]`, and `toWebMcpTool()`.

6. **🌐 Hybrid Context Sensing & Seamless In-Memory Emulator**:
   - Automatically detects browser-native `window.modelContext` / `navigator.modelContext` (when Chrome flags are active).
   - Transparently falls back to an in-memory `WebMcpEmulator` for standard browsers, node test runners, and instant developer evaluation.

---

## 🏛️ System Architecture Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       HUMAN & AI AGENT INTERFACES                                      │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │   Interactive UI /     │  │   Built-in AI Copilot   │  │   External Browser AI Agent             │  │
│  │   Direct Manipulation  │  │   (Autonomous Multimodal)│  │   (Chrome Canary window.modelContext)   │  │
│  └───────────┬────────────┘  └────────────┬────────────┘  └────────────────────┬────────────────────┘  │
└──────────────┼────────────────────────────┼────────────────────────────────────┼───────────────────────┘
               │                            │                                    │
               ▼                            ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ANGULAR 22 PRESENTATION LAYER                                       │
│  ┌───────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────────────────┐  │
│  │ 3D Showroom View  │  │ Enterprise BI View │  │ WebMCP Inspector   │  │ Devpost Judge Guide       │  │
│  │ (/3d-showroom)    │  │ (/enterprise-bi)   │  │ (/inspector)       │  │ (/judge-guide)            │  │
│  └─────────┬─────────┘  └─────────┬──────────┘  └─────────┬──────────┘  └─────────────┬─────────────┘  │
│            │                      │                       │                           │                │
│            │  Angular Directives: [webmcpTool], [webmcpAction], toWebMcpTool()        │                │
└────────────┼──────────────────────┼───────────────────────┼───────────────────────────┼────────────────┘
             │                      │                       │                           │
             ▼                      ▼                       ▼                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  WEBMCP INFRASTRUCTURE LAYER                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                      WebMcpService                                               │  │
│  │  - Context Resolver: navigator.modelContext / window.modelContext || WebMcpEmulator              │  │
│  │  - Interceptor Pipeline: WEBMCP_INTERCEPTORS (Auth, Logging, Latency Metrics, Rate Limiting)     │  │
│  │  - Reactive Signals: registeredTools(), isNativeContext(), executionLogs(), isReady()            │  │
│  └────────────────────────────────────────────────┬─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┼────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                       ┌────────────────────────────┼────────────────────────────┬────────────────────────────┐
                       ▼                            ▼                            ▼                            ▼
┌──────────────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
│     THREE.JS SPATIAL ENGINE          │ │     ENTERPRISE BI ENGINE     │ │      SUBAGENTS SDK           │ │      IN-BROWSER MEMORY       │
│  - WebmcpThreeSceneBridge            │ │ - EnterpriseBiStateService   │ │ - SubAgentRegistryService    │ │ - WebMcpMemoryService        │
│  - SceneActionBus (Frame-Sync)       │ │ - 4 Domain Adapters          │ │ - Tool Scoper & Predicates   │ │ - WebMcpIndexedDbStore       │
│  - 2D/3D CAD Drawing & Extrusion     │ │ - Real-time KPI Aggregation  │ │ - createSubAgent Factory     │ │ - WebMcpBm25SearchEngine     │
│  - ViewportCaptureService (Base64)   │ │ - SHA-256 Audit Exports      │ │ - Ephemeral Multi-Turn Loop  │ │ - 6 Declarative mem_* Tools  │
└──────────────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🧠 In-Browser Episodic & Semantic Memory Code Example

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideWebMcp, provideWebMcpMemory } from '@cobies/webmcp-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWebMcp(),
    // Registers client-side IndexedDB persistence, BM25 search, and mem_* tools
    provideWebMcpMemory({
      dbName: 'webmcp_memory_db',
      enablePassiveToolCapture: true,
      enableNavigationCapture: true,
      maxMemories: 10000,
    }),
  ],
};
```

---

## 🤖 Dynamic SubAgents SDK Code Example

```typescript
import { Component, DestroyRef, inject } from '@angular/core';
import { createSubAgent, SubAgentRegistryService } from '@cobies/webmcp-angular';

@Component({ ... })
export class EnterpriseWorkspaceComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly subagents = inject(SubAgentRegistryService);

  // Instantiates subagent with automatic DestroyRef lifecycle unregistration
  readonly biWorker = createSubAgent(
    {
      id: 'bi-analyst',
      name: 'Financial Risk Analyst',
      description: 'Specialist in fraud detection rates and portfolio risk aggregations.',
      systemPrompt: 'You are the Financial Risk Analyst. Retrieve transaction records, compute FDR %, and formulate anomaly reports.',
      toolFilters: [
        'query_enterprise_metrics',
        'calculate_kpi_summary',
        'filter_business_data',
        'trigger_analytics_export',
      ],
      maxTurns: 4,
    },
    { destroyRef: this.destroyRef }
  );

  async triggerDelegation(): Promise<void> {
    const receipt = await this.subagents.execute('bi-analyst', {
      objective: 'Filter flagged transactions over $1,000 and calculate KPI anomaly breakdown.',
    });
    console.log('Executive Summary Receipt:', receipt.summary);
  }
}
```

---

## ⚡ Quickstart with Bun

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) or Node.js (v20+)

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Showcase Application
```bash
bun start
```
Open **[http://localhost:4200](http://localhost:4200)** in your browser.

### 3. Run Automated Test Suite (483 Tests)
```bash
bun test
```

### 4. Build Production Distribution
```bash
bun run build
```

---

## 🐳 Docker & Portainer Deployment (SSR)

The project includes a production-ready, multi-stage Docker configuration using **Bun** for high-speed compilation and lightweight SSR execution.

### 1. Build Image Locally
```bash
docker compose build
# Or build directly with Docker CLI:
# docker build -t challenge-webmcp:latest .
```

### 2. Run with Docker Compose
```bash
docker compose up -d
```
The application will be accessible at `http://127.0.0.1:50016` (mapped to internal SSR port `4000`).

### 3. (Optional) Tag & Push to Container Registry
```bash
docker tag challenge-webmcp:latest <your-dockerhub-username>/challenge-webmcp:latest
docker push <your-dockerhub-username>/challenge-webmcp:latest
```

### 4. Deploy in Portainer (Stack Web Editor)
```yaml
services:
  challenge-webmcp:
    image: <your-dockerhub-username>/challenge-webmcp:latest
    container_name: challenge-webmcp-ssr
    restart: unless-stopped
    ports:
      - "127.0.0.1:50016:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
```

---

## 🧪 Devpost Judge Testing Guide

### Option A: In-App AI Copilot 🤖 [Recommended]
1. Click the glowing **"🤖 AI Copilot"** button in the top navigation header or the floating launcher.
2. The Cyberpunk slide-over drawer will expand.
3. Select any quick action prompt chip or type custom natural language prompts:

#### 📊 Enterprise BI Scenario:
> *"Query enterprise metrics for the performance category, filter business data for flagged transactions over $1,000, calculate KPI summary, and export the audit report as CSV."*

#### 🏎️ 3D Visual Inspection Scenario:
> *"Orbit camera 90 degrees to the right, paint vehicle chassis Neon Cyan (#00f0ff), and take a screenshot to inspect the front aerodynamic intake."*

#### 🏗️ SketchUp CAD Modeling Scenario:
> *"Draw a 10x10 rectangle on the ground plane, push-pull it up by 4 meters, and place a door component on the front face."*

#### 📦 Procurement & Purchase Order Scenario:
> *"Open the purchase order modal for SKU RET-102 with 50 units, critical priority, and submit the order."*

4. Watch the AI Copilot reason in real time, invoke WebMCP tools autonomously, update the dashboard / 3D viewport, and render rich visual cards!

> **💡 Configurable Proxy Endpoint**:
> By default, the AI Copilot and SubAgents connect to `DEFAULT_COPILOT_API_BASE` (`https://api.your-proxy.com/v1`). You can point the Copilot to any custom OpenAI-compatible proxy by providing `COPILOT_API_BASE` in `src/app/app.config.ts`:
> ```typescript
> import { COPILOT_API_BASE } from './services/copilot-bridge.service';
> // In appConfig providers:
> { provide: COPILOT_API_BASE, useValue: 'https://your-custom-proxy.com/v1' }
> ```


---

### Option B: Native Browser WebMCP Testing (Chrome Canary / Chromium)
1. Open Google Chrome or Chrome Canary and navigate to:
   ```text
   chrome://flags/#enable-webmcp-testing
   ```
2. Set the flag to **Enabled** and restart Chrome.
3. Open the showcase application at `http://localhost:4200`.
4. The header status badge will display **Native Browser Context** (Green indicator).
5. Attached AI agents or browser devtools can now execute tools directly via `window.modelContext`.

---

### Option C: Seamless In-Memory Emulator (Any Modern Browser)
- If testing in standard Chrome without flags, Firefox, Safari, or Edge, the application automatically mounts `WebMcpEmulator`.
- Use the **Agent Simulators** bar in the top navigation header or the interactive UI panels to trigger real-time WebMCP tool executions.
- The **Live WebMCP Inspector** on `/inspector` displays exact parameter contracts, execution timestamps, and duration latency metrics.

---

## 🛠️ Complete WebMCP Tool Catalog Summary

| Tool Name | Route | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `scene_3d_action` | `/3d-showroom` | `action`, `deltaX?`, `hexColor?`, `meshName?`, `durationMs?` | Directs Three.js camera orbits, zoom, animations, and materials |
| `take_screenshot` | Global / `/3d-showroom` | `selector?`, `format?`, `quality?` | Client-side WebGL canvas rasterization to base64 PNG data URL |
| `cad_draw_shape` | `/3d-showroom` | `shape`, `plane?`, `origin?`, `dimensions?`, `materialPreset?` | Generates 2D planar CAD profiles on ground or entity faces |
| `cad_push_pull` | `/3d-showroom` | `target`, `distance`, `direction?`, `hollow?`, `materialPreset?` | Extrudes 2D planar profiles into 3D architectural solid volumes |
| `cad_place_component` | `/3d-showroom` | `componentType`, `position?`, `rotationY?`, `scale?` | Spawns architectural/interior components into the scene |
| `cad_apply_material` | `/3d-showroom` | `target`, `materialPreset`, `color?`, `roughness?`, `metalness?` | Assigns PBR architectural materials to meshes and faces |
| `cad_measure` | `/3d-showroom` | `targetA`, `targetB?`, `measurementType` | Calculates 3D distances, bounding boxes, areas ($m^2$), and volumes |
| `query_enterprise_metrics` | `/enterprise-bi` | `domain?`, `category?`, `department?`, `timeRange?` | Fetches high-level operational KPIs and historical trend series |
| `filter_business_data` | `/enterprise-bi` | `domain?`, `status?`, `minAmount?`, `department?` | Filters live transactional data table and triggers re-aggregations |
| `calculate_kpi_summary` | `/enterprise-bi` | `domain?`, `metrics?` | Computes real-time sums, averages, anomaly rates, and volume breakdowns |
| `trigger_analytics_export` | `/enterprise-bi` | `domain?`, `format`, `filterSummary?` | Generates audit export with SHA-256 cryptographic verification hash |
| `query_inventory` | `/enterprise-bi` | `domain?`, `status?`, `searchTerm?`, `lowStockOnly?` | Queries inventory catalog across retail, hardware, logistics, pharma |
| `update_inventory_stock` | `/enterprise-bi` | `sku`, `delta`, `reason?` | Adjusts warehouse stock levels with operational audit reasons |
| `reorder_inventory_item` | `/enterprise-bi` | `sku`, `quantity`, `priority?` | Dispatches replenishment purchase orders with priority routing |
| `filter_inventory_by_domain` | `/enterprise-bi` | `domain?`, `status?`, `searchTerm?`, `lowStockOnly?` | Isolates domain-specific supply chain pipelines |
| `get_business_domain_summary` | `/enterprise-bi` | `domain?` | Aggregates scorecard metrics, valuation, and SKU health summaries |
| `open_purchase_order_modal` | `/enterprise-bi` | `sku?`, `domain?`, `quantity?`, `priority?`, `notes?` | Opens procurement modal with optional prefilled parameters |
| `fill_purchase_order_form` | `/enterprise-bi` | `sku?`, `domain?`, `supplierId?`, `quantity?`, `priority?` | Autofills procurement modal fields and selects in real time |
| `submit_purchase_order` | `/enterprise-bi` | `sku?`, `quantity?`, `priority?`, `supplierId?`, `notes?` | Submits purchase order and generates official procurement receipt |
| `close_purchase_order_modal` | `/enterprise-bi` | *none* | Closes procurement modal |
| `navigate_to_view` | Global Shell | `targetView`, `reason` | Autonomous workspace router (`/3d-showroom`, `/enterprise-bi`, etc.) |
| `form_action_runner` | `/3d-showroom` | `formId`, `fields`, `submit?` | Fills, validates, and submits Angular Reactive Forms |
| `judge_rubric_evaluation` | `/judge-guide` | *none* | Returns automated compliance score and feature checklist status |
| `verify_harness` | `/judge-guide` | *none* | Runs end-to-end verification health metrics and test checks |
| `delegate_to_subagent` | Global / Copilot | `target_subagent`, `objective`, `parameters?`, `context_hint?` | Dynamically delegates subtasks to active specialist subagents |

---

## 🔒 Security & Threat Analysis

- **Autonomous Loop Recursion Guard**: Prevents infinite tool-calling loops by enforcing a strict 5-turn hard cap with clear user notification.
- **Context Window Token Optimization**: Automatically sanitizes large Base64 PNGs (~500KB) from `take_screenshot` when sending context back to the LLM while preserving rich previews in the UI.
- **Dynamic Tool Lifecycle Isolation**: Tools register on route entry and unregister on leave, preventing namespace collisions and stale invocations.
- **Parameter Validation**: Input parameters are strictly validated against JSON Schema / typing contracts before executing handlers.
- **Tainted Canvas Safeguards**: Canvas readbacks catch cross-origin or buffer security violations and return structured error payloads without crashing.
- **Malformed JSON Recovery**: Catches syntax errors in LLM function arguments and feeds structured error diagnostics back to the model for self-correction.
- **Action Bus Timeout Safeguards**: Frame-based 3D animations have timeout limits (`durationMs + 2000ms`) to avoid blocking agent execution queues.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
