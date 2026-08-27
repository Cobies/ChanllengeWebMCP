# WebMCP Angular Toolkit & 3D Interactive Enterprise Showcase 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular 22](https://img.shields.io/badge/Angular-22.0-dd0031.svg?logo=angular)](https://angular.dev)
[![Bun Runtime](https://img.shields.io/badge/Runtime-Bun-f472b6.svg?logo=bun)](https://bun.sh)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg?logo=threedotjs)](https://threejs.org)
[![Gemini 3.7 Flash High](https://img.shields.io/badge/AI%20Copilot-Gemini%203.7%20Flash%20High-purple.svg)](https://deepmind.google/technologies/gemini/)
[![W3C WebMCP Standard](https://img.shields.io/badge/WebMCP-W3C%20Standard-emerald.svg)](https://modelcontextprotocol.io)

An enterprise Angular 22 toolkit and multi-route interactive showcase for the **W3C WebMCP (Model Context Protocol in the Browser)** standard. Bridges browser AI agents (Chrome AI, ChatGPT in-app browser, Claude, and **built-in Gemini 3.7 Flash High Copilot**) directly with Angular reactive Signals, client-side Three.js WebGL scenes, enterprise business intelligence analytics, declarative template directives, form automation, and multimodal viewport snapshots.

---

## 🌟 Key Features

1. **🤖 Live In-App AI Copilot (Gemini 3.7 Flash High via CPAMC Bridge)**:
   - Built-in conversational chat drawer powered by Gemini 3.7 Flash High through the CPAMC Secure Bridge Proxy (`https://bridge.cobiesscooby.com/v1`).
   - Dynamic WebMCP-to-OpenAI function schema conversion with autonomous multi-turn recursive execution loop (up to 5 turns).
   - Real-time tool execution status pills (duration latency, status badges) and multimodal WebGL canvas screenshot cards with expand lightbox.

2. **📊 Enterprise Business Intelligence & Autonomous Data Tools**:
   - **4 Enterprise WebMCP Tools** dynamically registered on `/enterprise-bi`:
     - `query_enterprise_metrics`: Real-time KPI queries by category (financial, performance, infrastructure, security) and time window.
     - `filter_business_data`: Reactive filtering of transaction datasets by status (`completed`, `pending`, `flagged`), minimum dollar amount, and department.
     - `calculate_kpi_summary`: Real-time arithmetic aggregations, anomaly detection percentages, and department volume distributions.
     - `trigger_analytics_export`: Autonomous cryptographic audit export generation (JSON/CSV/PDF) with SHA-256 verification hashes.

3. **🏎️ 3D Digital Twin & Multimodal Viewport Capture**:
   - Frame-synchronized Three.js bridge (`scene_3d_action`) for camera orbit rotation (`rotate`), zoom (`zoom`), material colors (`change_mesh_color`), animations (`play_animation`), part highlighting (`highlight_part`), and camera resets (`reset_camera`).
   - Client-side WebGL canvas rasterization (`take_screenshot`) producing zero-latency base64 image data URLs with token-saving LLM context sanitization.

4. **⚡ Multi-Route Shell & Dynamic Tool Lifecycle**:
   - Decoupled Angular 22 routing architecture:
     - `/3d-showroom`: 3D Digital Twin viewport, interactive vehicle customizer form, and live event inspector.
     - `/enterprise-bi`: Enterprise BI dashboard, KPI cards, SVG trend charts, and transactional data intelligence.
     - `/judge-guide`: Master evaluation rubric, architecture diagrams, and testing checklists for Devpost evaluators.
   - Route-aware tool registration: Tools register on `ngOnInit` and cleanly unregister on `ngOnDestroy`.

5. **Angular 22 Reactive Signals First**:
   - Seamlessly connect Angular signals (`signal()`, `computed()`, `effect()`) to agent tools using `toWebMcpTool()`.
   - Real-time reactivity with zero change-detection penalty.

6. **Hybrid Context Sensing & Seamless In-Memory Emulator**:
   - Automatically detects browser-native `window.modelContext` / `navigator.modelContext` (when Chrome flags are active).
   - Transparently falls back to an in-memory `WebMcpEmulator` for standard browsers, node test runners, and instant developer evaluation.

7. **💎 Refined Light Liquid-Glass Aesthetic & Warm Matte Foundation**:
   - Sophisticated light liquid-glass theme with warm matte cream foundation (`#f6f4ee` / `#f7f5f0`), multi-layered specular frosted glass relief (`.glass-panel`, `.glass-panel-glow`), and ocean blue accents.
   - High-contrast slate typography (`slate-800`/`slate-900`) and warm Three.js 3D WebGL scene lighting (`#f4f0e6`, depth fog, light grid helper).

---

## 📐 Architecture: Multi-Route WebMCP Enterprise Shell

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   HeaderComponent                                       │
│  - Branding & Badges   - Navigation Tabs (/3d-showroom, /enterprise-bi, /judge-guide)     │
│  - Runtime Badge (Native / Polyfill)   - Route-Aware Simulation Action Bar              │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      ▼                      ▼                      ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│     ShowroomComponent     │ │   EnterpriseBiComponent   │ │    JudgeGuideComponent    │
│  - Visualizer3dComponent  │ │  - 4 KPI Metric Cards     │ │  - Rubric Checklist Matrix  │
│  - CustomizerFormComponent│ │  - SVG Latency Trend Chart│ │  - Chrome Flag Instructions │
│  - InspectorComponent     │ │  - Transaction Data Table │ │  - Copyable Agent Prompts   │
│  Tools: scene_3d_action,  │ │  - Export Audit Trail     │ │  - System Architecture View │
│    take_screenshot,       │ │  Tools: query_metrics,    │ │                             │
│    form_action_runner     │ │    filter_data, kpi_sum,  │ │                             │
│                           │ │    trigger_export         │ │                             │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CopilotChatComponent                                    │
│  - Gemini 3.7 Flash High Autonomous Loop (Max 5 Turns)                                   │
│  - Dynamic WebMCP-to-OpenAI Schema Converter                                            │
│  - Multimodal WebGL Screenshot Lightbox                                                 │
│  - Context Token Sanitizer & Malformed JSON Self-Correction                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘
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
Open [http://localhost:4200](http://localhost:4200) in your browser.

### 3. Run Unit & Threat Matrix Tests
```bash
bun test
```

### 4. Build Library & Showcase
```bash
bun run build
```

---

## 🐳 Docker & Portainer Deployment (SSR)

The project includes a production-ready, multi-stage Docker configuration using **Bun** for high-speed compilation and lightweight SSR execution.

### 1. Build & Push to Docker Hub
```bash
# Build image tagged as cobies/challenge-webmcp:latest
docker compose build

# Push to Docker Hub
docker compose push
```

*(Or via standard Docker CLI)*:
```bash
docker build -t cobies/challenge-webmcp:latest .
docker push cobies/challenge-webmcp:latest
```

### 2. Run Locally with Docker Compose
```bash
docker compose up -d
```
The server binds to `http://127.0.0.1:50016` (mapped internally to SSR port `4000`).

### 3. Deploy in Portainer (Stack Web Editor)
1. Open Portainer and go to **Stacks** > **Add stack**.
2. Paste the stack definition:
```yaml
services:
  challenge-webmcp:
    image: cobies/challenge-webmcp:latest
    container_name: challenge-webmcp-ssr
    restart: unless-stopped
    ports:
      - "127.0.0.1:50016:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
```
3. Click **Deploy the stack**.

---

## 🧪 Devpost Judge Testing Guide

### Option A: In-App AI Copilot (Gemini 3.7 Flash High) 🤖 [Recommended]
1. Click the glowing **"🤖 AI Copilot"** button in the top navigation header or the bottom-right launcher.
2. The Cyberpunk slide-over drawer will expand.
3. Select any quick action prompt chip or type custom natural language prompts:

#### 📊 Enterprise BI Scenario:
> *"Query enterprise metrics for the performance category, filter business data for flagged transactions over $500, calculate KPI summary for revenue_ytd, and export the audit report as CSV."*

#### 🏎️ 3D Visual Inspection Scenario:
> *"Orbit camera 90 degrees to the right, paint vehicle chassis Neon Cyan (#00f0ff), and take a screenshot to inspect the front aerodynamic intake."*

#### ⚡ Autonomous Form Customizer Scenario:
> *"Configure the vehicle customizer form: set chassis color to '#00f0ff', select 'Overdrive' drive mode, enable active spoiler, and submit the order."*

4. Watch Gemini 3.7 Flash High reason in real time, invoke browser WebMCP tools autonomously, update the dashboard / 3D viewport, and render rich visual cards!

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
- The **Live WebMCP Inspector** on `/3d-showroom` displays exact parameter contracts and execution duration metrics.

---

## 🛠️ WebMCP Tool Specifications

| Tool Name | Route | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `query_enterprise_metrics` | `/enterprise-bi` | `category?`: string, `timeRange?`: string | Fetches high-level operational KPIs and historical trend series |
| `filter_business_data` | `/enterprise-bi` | `status?`: string, `minAmount?`: number, `department?`: string | Filters live transactional data table and triggers re-aggregations |
| `calculate_kpi_summary` | `/enterprise-bi` | `metrics`: string[] | Computes real-time sums, averages, anomaly rates, and breakdowns |
| `trigger_analytics_export` | `/enterprise-bi` | `format`: 'json'\|'csv'\|'pdf', `filterSummary?`: string | Generates downloadable audit export with SHA-256 integrity hash |
| `scene_3d_action` | `/3d-showroom` | `action`: string, `deltaX?`: number, `hexColor?`: string, `meshName?`: string | Directs Three.js WebGL scene animations, rotations, and materials |
| `take_screenshot` | `/3d-showroom` | `selector?`: string, `format?`: string | Captures client-side WebGL canvas as base64 PNG data URL |
| `form_action_runner` | `/3d-showroom` | `formName`: string, `action`: string, `values?`: object | Fills, validates, and submits Angular Reactive Forms |

---

## 📦 Workspace Package Layout

```
ChanllengeWebMCP/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Continuous integration pipeline
├── projects/
│   ├── ngx-webmcp/                    # Core Angular 22 Library (@webmcp/angular)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── core/              # WebMcpService, Emulator, Types, Schemas
│   │   │   │   ├── directives/        # [webmcpTool], [webmcpAction], toWebMcpTool()
│   │   │   │   ├── multimodal/        # take_screenshot tool & CanvasRasterizer
│   │   │   │   ├── three/             # scene_3d_action tool, Scene3DActionBus, lerp
│   │   │   │   └── forms/             # form_action_runner & FormRegistry
│   │   │   └── public-api.ts          # Public library entrypoint
│   │   ├── ng-package.json
│   │   └── package.json
│   └── showcase/                      # Interactive Demo Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   │   ├── copilot-chat/   # Cyberpunk Gemini 3.7 Copilot Chat Drawer
│       │   │   │   ├── enterprise-bi/  # Enterprise BI Dashboard & 4 WebMCP Tools
│       │   │   │   ├── header/         # Connection status & Navigation Bar
│       │   │   │   ├── showroom/       # 3D Digital Twin Showroom Shell
│       │   │   │   ├── visualizer-3d/  # Three.js 3D viewport canvas
│       │   │   │   ├── customizer-form/# Reactive configuration form
│       │   │   │   ├── inspector/      # Real-time WebMCP execution console
│       │   │   │   └── judge-guide/    # Devpost evaluator guide & rubric
│       │   │   ├── models/
│       │   │   │   └── enterprise-bi.types.ts # BI data interfaces & contracts
│       │   │   ├── services/
│       │   │   │   ├── copilot-bridge.service.ts # CPAMC Bridge & Autonomous Loop
│       │   │   │   ├── copilot-bridge.types.ts   # OpenAI & Model data contracts
│       │   │   │   └── enterprise-data.service.ts # Signals-based business dataset
│       │   │   ├── app.component.ts    # Shell with RouterOutlet & Header
│       │   │   ├── app.component.html  # Decoupled root template
│       │   │   ├── app.config.ts       # Router & WebMCP provider config
│       │   │   └── app.routes.ts       # Standalone lazy routes definition
│       │   ├── styles.css              # Tailwind CSS v4 directives & theme
│       │   └── main.ts                 # App bootstrap
│       └── tsconfig.app.json
├── angular.json                        # Angular CLI multi-project workspace config
├── package.json                        # Root workspace scripts & dependencies
├── tsconfig.json                       # Path aliases for @webmcp/angular
├── LICENSE                             # MIT License
└── README.md                           # Documentation & Devpost Submission Guide
```

---

## 🔒 Security & Threat Analysis

- **Autonomous Loop Recursion Guard**: Prevents infinite tool-calling loops by enforcing a strict 5-turn hard cap with clear user notification.
- **Malformed JSON Recovery**: Catches syntax errors in LLM function arguments and feeds structured error diagnostics back to the model for self-correction.
- **Context Window Token Optimization**: Automatically sanitizes large Base64 PNGs (~500KB) from `take_screenshot` when sending context back to the LLM while preserving rich previews in the UI.
- **Dynamic Tool Lifecycle Isolation**: Tools register on route entry and unregister on leave, preventing namespace collisions and stale invocations.
- **Parameter Validation**: Input parameters are strictly validated against JSON Schema / typing contracts before executing handlers.
- **Tainted Canvas Safeguards**: Canvas readbacks catch cross-origin or buffer security violations and return structured error payloads without crashing.
- **XSS Prevention**: Inspector log visualizer truncates large binary payloads and sanitizes JSON outputs.
- **Action Bus Timeout Safeguards**: Frame-based 3D animations have timeout limits (`durationMs + 2000ms`) to avoid blocking agent execution queues.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
