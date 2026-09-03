# WebMCP Angular Toolkit & 3D Enterprise Architecture 🏗️

This document outlines the end-to-end system architecture of the **WebMCP Angular Toolkit**, detailing the integration between **W3C WebMCP (Model Context Protocol in the Browser)**, Angular 22 Signals, Three.js WebGL Spatial Engine, Multi-Domain Enterprise Business Intelligence, and the Dynamic SubAgents Orchestration SDK.

---

## 🏛️ High-Level System Architecture

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
│  ┌────────────────────────────────┐  │ │ ┌──────────────────────────┐ │ │ ┌──────────────────────────┐ │ │ ┌──────────────────────────┐ │
│  │ WebmcpThreeSceneBridge         │  │ │ │ EnterpriseBiStateService │ │ │ │ SubAgentRegistryService  │ │ │ │ WebMcpMemoryService      │ │
│  │ - SceneActionBus (Frame-Sync)  │  │ │ │ - 4 Domain Adapters:     │ │ │ │ - Dynamic Tool Scoper    │ │ │ │ - WebMcpIndexedDbStore   │ │
│  │ - CameraInterpolator (Lerp)    │  │ │ │   * CloudFinOpsAdapter   │ │ │ │ - createSubAgent Factory │ │ │ │ - WebMcpBm25SearchEngine │ │
│  │ - 2D/3D CAD Drawing & Extrude  │  │ │ │   * SupplyChainAdapter   │ │ │ │ - createDelegationTool   │ │ │ │ - WebMcpMemoryInterceptor│ │
│  │ - PBR Material Engine          │  │ │ │   * FinancialRiskAdapter │ │ │ │ - Ephemeral Multi-Turn   │ │ │ │ - WebMcpNavigationList'r│ │
│  │ - ViewportCaptureService       │  │ │ │   * RetentionAdapter     │ │ │ │   Execution Loop         │ │ │ │ - 6 Standard mem_* Tools │ │
│  └────────────────────────────────┘  │ │ └──────────────────────────┘ │ │ └──────────────────────────┘ │ │ └──────────────────────────┘ │
└──────────────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🔄 Mermaid Architecture Blueprint

```mermaid
flowchart TB
    subgraph Clients["1. Agent & Human Ingestion"]
        UI["👤 Human Operator (UI Events)"]
        Copilot["🤖 In-App AI Copilot (Autonomous)"]
        NativeAgent["🌐 Browser AI Agent (window.modelContext)"]
    end

    subgraph Shell["2. Angular 22 Presentation & Routing"]
        Header["HeaderComponent (Status & Simulators)"]
        R1["Route: /3d-showroom (ShowroomComponent)"]
        R2["Route: /enterprise-bi (EnterpriseBiComponent)"]
        R3["Route: /inspector (InspectorComponent)"]
        R4["Route: /judge-guide (JudgeGuideComponent)"]
        CopilotChat["CopilotChatComponent (Slide-over Drawer)"]
    end

    subgraph WebMCPCore["3. WebMCP Infrastructure Layer"]
        Service["WebMcpService (Angular Root Service)"]
        Resolver{"Context Resolver"}
        NativeCtx["Browser Native Context (Chrome Flags)"]
        Emulator["WebMcpEmulator (In-Memory Polyfill)"]
        Pipeline["Interceptor Pipeline (Logging / Telemetry)"]
        Signals["Angular 22 Signals State (registeredTools, logs)"]
    end

    subgraph DomainEngines["4. Domain Execution Engines"]
        subgraph CAD["Spatial DCC Engine"]
            ThreeBridge["WebmcpThreeSceneBridge"]
            ActionBus["SceneActionBus (RAF Loop)"]
            ThreeCanvas["Three.js WebGL Viewport"]
            Capture["ViewportCaptureService (Base64 Rasterizer)"]
        end

        subgraph BI["Enterprise BI Engine"]
            BIState["EnterpriseBiStateService"]
            BIRegistry["BiToolRegistry"]
            FinOps["CloudFinOpsAdapter"]
            Supply["SupplyChainAdapter"]
            Risk["FinancialRiskAdapter"]
            Retention["CustomerRetentionAdapter"]
        end

        subgraph MemoryEngine["In-Browser Memory Engine"]
            MemService["WebMcpMemoryService (Signals)"]
            MemStore["WebMcpIndexedDbStore (webmcp_memory_db)"]
            MemFallback["WebMcpInMemoryStore (SSR Fallback)"]
            BM25Engine["WebMcpBm25SearchEngine (RSJ IDF)"]
            MemInterceptor["WebMcpMemoryInterceptor (Anti-Recursion)"]
            NavListener["WebMcpNavigationListener (Route Context)"]
            MemTools["6 Declarative Tools: mem_*"]
        end
    end

    Clients --> Shell
    Shell --> Service
    Service --> Resolver
    Resolver -- Flag Active --> NativeCtx
    Resolver -- Fallback --> Emulator
    Service --> Pipeline
    Pipeline --> Signals
    Pipeline --> MemInterceptor

    R1 --> ThreeBridge
    ThreeBridge --> ActionBus --> ThreeCanvas
    ThreeBridge --> Capture

    R2 --> BIState
    BIState --> BIRegistry
    BIRegistry --> FinOps & Supply & Risk & Retention

    R3 --> MemService
    MemService --> MemStore & MemFallback
    MemService --> BM25Engine
    MemService --> MemTools
    MemInterceptor --> MemService
    NavListener --> MemService

    CopilotChat --> SubRegistry
    SubRegistry --> Scoper
    SubRegistry --> DelegationTool
    SubRegistry --> Runner
    CopilotChat -. Optional Context .-> MemService
```

---

## 🧱 Core Architectural Layers

### 1. Presentation Layer (Angular 22 Signals)
The presentation layer is built on **Angular 22 Standalone Components** utilizing **fine-grained Signals** (`signal()`, `computed()`, `effect()`) for state management with zero change-detection overhead.

- **Zoneless-Ready Reactivity**: UI components subscribe to Signals rather than dirty-checking trees, ensuring 60fps WebGL rendering and instant telemetry updates.
- **Route-Scoped Lifecycle**: Each workspace (`/3d-showroom`, `/enterprise-bi`, `/inspector`, `/judge-guide`) declares its tools upon initialization (`ngOnInit`) and unregisters them upon disposal (`ngOnDestroy`).
- **Declarative Template Directives**:
  - `[webmcpTool]`: Binds DOM elements or custom component handlers directly to the WebMCP registry.
  - `[webmcpAction]`: Exposes one-click simulation buttons that fire standardized WebMCP tool calls.
  - `toWebMcpTool()`: Converts any Angular `WritableSignal` into an agent-controllable tool.

### 2. WebMCP Infrastructure Layer
The bridge between the WebMCP standard and Angular's dependency injection container.

- **Hybrid Context Sensing**:
  ```typescript
  // Checks for native window.modelContext or navigator.modelContext
  const nativeContext = win?.modelContext || nav?.modelContext;
  if (nativeContext && typeof nativeContext.registerTool === 'function') {
    return nativeContext; // Chrome Canary with #enable-webmcp-testing
  }
  return new WebMcpEmulator(); // In-memory fallback
  ```
- **Interceptor Middleware Pipeline**:
  Supports composable middleware via the `WEBMCP_INTERCEPTORS` injection token or dynamic runtime registration (`webmcp.addInterceptor()`):
  ```typescript
  export interface WebMcpInterceptor {
    intercept(context: WebMcpExecutionContext, next: WebMcpHandler): Promise<unknown>;
  }
  ```
- **Execution Telemetry & Logging**:
  Captures caller source (`native`, `emulator`, `ui`), execution timestamps, millisecond duration latency, input arguments, and structured return values into an immutable reactive log signal.

### 3. Three.js WebGL Spatial Engine Bridge
Connects spatial 3D DCC (Digital Content Creation) operations with conversational agent reasoning.

- **Frame-Synchronized Action Bus (`SceneActionBus`)**:
  Prevents race conditions by scheduling camera lerps, material updates, and mesh transformations on the WebGL `requestAnimationFrame` loop with timeout protections.
- **Camera Interpolation Engine (`CameraInterpolator`)**:
  Calculates smooth spherical orbit transitions (look-at target vectors, field-of-view adjustments, and spherical angles).
- **SketchUp-Style Parametric CAD Pipeline**:
  - `cad_draw_shape`: Generates parametric 2D planar profiles (`rectangle`, `circle`, `line`, `wall`, `polygon`) on arbitrary 3D planes (`xz`, `xy`, `yz`, `ground`).
  - `cad_push_pull`: Extrudes planar profiles into 3D architectural solid volumes along normal vectors.
  - `cad_place_component`: Spawns pre-configured parametric architectural assets (`desk`, `chair`, `sofa`, `door`, `window`, `column`, `tree`, `car`).
  - `cad_apply_material`: Configures physical PBR materials (`concrete`, `wood_oak`, `brick_red`, `glass_frosted`, `marble_carrara`, `steel_brushed`, `gold`, `neon_cyan`).
  - `cad_measure`: Calculates 3D euclidean distances, bounding boxes, surface floor areas ($m^2$), volumes ($m^3$), and spatial clearances.
- **Client-Side Viewport Rasterizer (`WebMcpViewportCaptureService`)**:
  Reads the active WebGL buffer directly using `canvas.toDataURL('image/png')`, bypassing backend GPU rendering clusters and providing zero-latency visual feeds for multimodal vision models.

### 4. Multi-Domain Enterprise BI Engine
A reactive business intelligence platform driven by pluggable domain adapters and cryptographic audit trails.

- **Pluggable Domain Adapters (`BiDomainAdapter<TRecord, TFilter, TKpi>`)**:
  - `CloudFinOpsAdapter`: Cloud infrastructure unit economics, cost anomaly rates, MTTR impact, and budget variance.
  - `SupplyChainAdapter`: Inventory turnover rates, stockout risk indices, On-Time In-Full (OTIF) fulfillment, and warehouse valuations.
  - `FinancialRiskAdapter`: Fraud detection rate (FDR), AML transaction anomaly scoring, and portfolio risk distributions.
  - `CustomerRetentionAdapter`: Net Revenue Retention (NRR), churn hazard alerts, and customer health score aggregation.
- **Cryptographic Audit Exporting**:
  Every export generated via `trigger_analytics_export` produces an immutable SHA-256 integrity hash:
  $$\text{Checksum} = \text{SHA256}(\text{ExportPayload} + \text{Timestamp})$$

### 5. Dynamic SubAgents SDK (`@cobies/webmcp-angular`)
An Inversion-of-Control (IoC) subagent orchestration engine enabling parent agents to delegate subtasks to specialized worker profiles.

- **Multi-Strategy Tool Scoping**: Pure functional filtering supporting exact strings, regular expressions, custom predicate functions, and denylist precedence.
- **Reactive SubAgent Registry**: Exposes reactive Signals (`subagents()`, `activeTasks()`, `activeSubagents()`, `executionHistory()`) for real-time UI HUDs.
- **Dynamic Delegation Tool Synthesis**: Generates OpenAI-compatible function calling schemas with a live `enum` of available subagents and an up-to-date description of registered capabilities.
- **Context Window Token Optimization**: Subagents execute multi-turn loops in isolated ephemeral scopes, returning concise executive receipts (`SubAgentResult`) to prevent parent context bloat.

### 6. In-Browser Agent Memory Engine (`@cobies/webmcp-angular`)
A zero-dependency, client-side episodic and semantic memory system that provides AI agents with continuous context and recall directly in the browser.

- **Dual-Backend Storage Engine (`IWebMcpMemoryStore`)**:
  - `WebMcpIndexedDbStore`: IndexedDB persistence (`webmcp_memory_db`) with compound indexes (`by_topic`, `by_category`, `by_pinned`, `by_updated`, `by_tags`) and LRU quota eviction.
  - `WebMcpInMemoryStore`: Ephemeral in-memory fallback for SSR hydration and private browser contexts.
- **Pure TypeScript BM25 Lexical Search (`WebMcpBm25SearchEngine`)**:
  - Robertson-Spärck Jones IDF scoring with field-weighted boosts ($\text{topic}: 2.0\times, \text{tags}: 1.5\times, \text{content}: 1.0\times$).
  - Multilingual Unicode tokenizer with stopword pruning and in-memory incremental inverted index.
- **8 Standardized WebMCP Memory Tools**:
  - `mem_save`: Persists or updates episodic observations, facts, rules, contexts, preferences, or sessions.
  - `mem_search`: BM25 lexical ranking queries with category, tag, and date filtering.
  - `mem_context`: Formats consolidated prompt-ready context blocks with pinned rules.
  - `mem_pin` / `mem_unpin`: Pins or unpins critical directives to prevent eviction.
  - `mem_session_summary`: Multi-turn session summarization and key learning tracking.
  - `mem_export`: Exports knowledge base and session summaries as portable JSON bundle.
  - `mem_import`: Imports JSON knowledge base bundles with merge or replace strategies and automated BM25 re-indexing.
- **Knowledge Base Portability & Synchronization**:
  - Portable JSON Knowledge Base Bundles (`MemoryExportBundle` v1.0) with schema versioning, system metadata, memory array, and session summaries.
  - Selective export filtering by category or tags.
  - Dual import strategies: `merge` (incremental deduplication by topic/ID) and `replace` (clean store wipe and full reload).
  - Automatic pure TypeScript BM25 search engine inverted index re-synchronization post-import.
- **Reactive Signals State (`WebMcpMemoryService`)**:
  - Signals (`memories()`, `pinnedMemories()`, `stats()`, `isReady()`, `recentQueries()`) powering the live Inspector UI.
- **Passive Execution Interceptors**:
  - `WebMcpMemoryInterceptor`: Automatically records non-memory tool outcomes and errors via `WEBMCP_INTERCEPTORS` with an anti-recursion guard on `mem_*`.
  - `WebMcpNavigationListener`: Captures router navigation changes with URL and secret token redaction.

---

## ⚡ Synchronous & Reactive Data Flow

### 1. AI Copilot / Agent Tool Invocation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Copilot as CopilotChatComponent
    participant Bridge as CopilotBridgeService
    participant WebMCP as WebMcpService
    participant Pipeline as Interceptor Pipeline
    participant Three as WebmcpThreeSceneBridge
    participant Canvas as WebGL Canvas Buffer

    User->>Copilot: "Rotate 90 deg right and paint chassis Neon Cyan"
    Copilot->>Bridge: Send prompt with available tools
    Bridge->>Bridge: LLM decides to call `scene_3d_action`
    Bridge->>WebMCP: executeTool('scene_3d_action', {action: 'rotate', deltaX: 90})
    WebMCP->>Pipeline: Intercept (Validation, Logging)
    Pipeline->>Three: Dispatch to SceneActionBus
    Three->>Three: Animate camera orbit on RAF loop (600ms)
    Three-->>Pipeline: Return {success: true, camera: {x,y,z}}
    Pipeline-->>Bridge: Tool execution result
    
    Bridge->>Bridge: LLM decides to call `cad_apply_material`
    Bridge->>WebMCP: executeTool('cad_apply_material', {target: 'chassis', materialPreset: 'neon_cyan'})
    WebMCP->>Three: Apply PBR material parameters
    Three-->>Bridge: Return {success: true, material: 'neon_cyan'}

    Bridge->>Bridge: LLM decides to call `take_screenshot`
    Bridge->>WebMCP: executeTool('take_screenshot', {format: 'image/png'})
    WebMCP->>Canvas: Rasterize WebGL buffer
    Canvas-->>Bridge: Return base64 data URL
    Bridge->>Copilot: Render response with rich interactive image preview card
    Copilot-->>User: Display final assistant message with screenshot lightbox
```

### 2. SubAgent Delegation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Orchestrator as Parent Copilot Agent
    participant DelegateTool as delegate_to_subagent Tool
    participant Registry as SubAgentRegistryService
    participant SubAgent as 3d-specialist (SubAgent)
    participant DomainTool as cad_push_pull Tool

    User->>Orchestrator: "Build a 10x10 building slab and extrude it by 3.5m"
    Orchestrator->>DelegateTool: call delegate_to_subagent({target_subagent: '3d-specialist', objective: 'Draw 10x10 rect and extrude 3.5m'})
    DelegateTool->>Registry: execute('3d-specialist', task)
    Registry->>SubAgent: Launch isolated ephemeral loop (Max 4 turns)
    
    Note over SubAgent: SubAgent operates with scoped CAD tools only
    SubAgent->>DomainTool: executeTool('cad_draw_shape', {shape: 'rectangle', dimensions: {width: 10, length: 10}})
    DomainTool-->>SubAgent: {nodeId: 'rect_01', success: true}
    
    SubAgent->>DomainTool: executeTool('cad_push_pull', {target: 'rect_01', distance: 3.5})
    DomainTool-->>SubAgent: {volume: 350, height: 3.5, success: true}

    SubAgent-->>Registry: Return SubAgentResult (Executive Summary Receipt)
    Registry-->>Orchestrator: Return concise summary (Tokens saved: ~85%)
    Orchestrator-->>User: "Completed slab construction and extrusion of 3.5m."
```

### 3. Orchestrator-Driven Memory & Context Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Copilot as CopilotChatComponent
    participant Bridge as CopilotBridgeService (Orchestrator)
    participant MemService as WebMcpMemoryService
    participant Store as WebMcpIndexedDbStore
    participant Interceptor as WebMcpMemoryInterceptor
    participant LLM as LLM Bridge Proxy

    Note over Bridge: 1. PRE-TURN: Context Enrichment
    Bridge->>MemService: Read pinnedMemories() & active context
    MemService-->>Bridge: [PREFERENCE] brand_color: #00f0ff
    Bridge->>Bridge: Inject memory block into system prompt

    User->>Copilot: "Remember that the maximum warehouse budget is $50,000"
    Copilot->>Bridge: sendMessage()
    Bridge->>LLM: Send enriched prompt + function tools

    Note over LLM: 2. IN-TURN: Proactive Memory Capture
    LLM-->>Bridge: Tool Call: mem_save({topic: 'warehouse_budget', content: '$50,000', category: 'rule', pinned: true})
    Bridge->>MemService: save({topic: 'warehouse_budget', content: '$50,000', pinned: true})
    MemService->>Store: Persist to IndexedDB & sync BM25 index
    Store-->>MemService: Stored successfully
    MemService-->>Bridge: {success: true, item: MemoryItem}
    Bridge->>LLM: Return tool response
    LLM-->>Bridge: "Got it! I saved and pinned your rule: maximum warehouse budget is $50,000."

    Note over Interceptor: 3. POST-TURN: Passive Interception (for other tools)
    Bridge->>Copilot: Display final assistant message
```

---

## 🛡️ Security, Validation & Resilience Architecture

1. **Recursion Guard & Turn Caps**:
   - The Copilot multi-turn loop enforces a strict limit of 5 turns.
   - Ephemeral subagent loops enforce configurable limits (default: 4 turns).
2. **Context Token Sanitization**:
   - Base64 image strings (~500KB) from `take_screenshot` are sanitized from the textual LLM context window before subsequent turns, while preserving rich UI previews in the chat stream.
3. **Malformed JSON Self-Correction**:
   - Catches JSON syntax errors in LLM function arguments and supplies structured diagnostics back to the model for automated self-healing.
4. **Tainted Canvas Protection**:
   - Direct WebGL framebuffer extraction wraps context calls in security blocks to catch cross-origin asset contamination gracefully.
5. **Frame-Bus Timeout Watchdogs**:
   - All spatial animations executed on `SceneActionBus` include a hard timeout ($durationMs + 2000ms$) to guarantee that async promises always resolve.
