# Design: WebMCP Enterprise Routing & BI Dashboard Architecture

**Change**: `webmcp-enterprise-routing-bi`  
**Status**: Ready for Implementation  
**Target Platform**: Angular 22, Bun Runtime, Tailwind CSS v4, Three.js, W3C WebMCP Standard, Gemini 3.7 Flash High  

---

## 1. Technical Approach

The `webmcp-enterprise-routing-bi` change evolves the showcase application from a single-page 3D vehicle demo into a multi-route enterprise application featuring:
1. **Declarative Angular Routing**: Standalone routing configured via `provideRouter` with `withComponentInputBinding()`, hosting `/3d-showroom`, `/enterprise-bi`, and `/judge-guide`, with `/` redirect and wildcard fallback `**`.
2. **Persistent App Shell**: Unified root layout with dynamic `HeaderComponent` (route-aware cyber glow tabs and quick prompts), `<router-outlet>`, and the global `CopilotChatComponent`.
3. **Enterprise BI Telemetry Dashboard (`EnterpriseBiComponent`)**: Standalone dashboard featuring 4 live KPI metric cards, high-performance pure SVG multi-metric trend charts, searchable transactional data table with status badges, and a WebMCP simulation action bar.
4. **Reactive Data Management (`EnterpriseDataService`)**: Signal-driven in-memory store maintaining deterministic business datasets, query filtering, and statistical aggregations.
5. **Dynamic Tool Lifecycle**: Route-scoped tool registration in `ngOnInit()` and deregistration in `ngOnDestroy()` to ensure AI agents have access only to tools relevant to the active context.

---

## 2. Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Routing Strategy** | Declarative Standalone Routes (`provideRouter`) | Single-page tab switching / modal views | Clean separation of concerns, deep-linking capability, route guards, and standardized Angular architecture. |
| **Tool Lifecycle** | Route-Scoped Dynamic Tool Binding | Global permanent tool registration | Prevents agent hallucinations by exposing only context-relevant tools (`scene_3d_action` on 3D Showroom vs `query_enterprise_metrics` on BI). |
| **State Management** | Fine-Grained Angular Signals | RxJS BehaviorSubject / NgRx store | Zero change-detection overhead, synchronous signal reads, instant computed derivations, and modern Angular 22 idioms. |
| **Trend Charting** | Native Reactive SVG Visualizer | 3rd-party charting libraries (Chart.js, D3) | Zero external bundle dependencies, sub-millisecond redraws, responsive viewBox scaling, and full Tailwind cyber styling. |
| **Export Engine** | In-Memory Audited Report Generator with SHA-256 Checksum | External backend microservice | Fully client-side execution matching WebMCP browser agent paradigm with zero backend server dependencies. |

---

## 3. System Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                 App Shell (`AppComponent`)                         |
|  +-----------------------------------------------------------------------------+  |
|  | HeaderComponent: Cyber Glow Nav Tabs (/3d-showroom, /enterprise-bi, /guide)  |  |
|  | Route-Aware Quick Simulation Action Chips                                   |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                  <router-outlet>                                  |
|         +-------------------------------+-------------------------------+         |
|         |                               |                               |         |
|         v                               v                               v         |
|  ShowroomComponent            EnterpriseBiComponent           JudgeGuideComponent |
|  - Visualizer3dComponent      - 4 KPI Metric Cards            - Rubric Checklist  |
|  - CustomizerFormComponent    - SVG Trend Visualizer          - Architecture Map  |
|  - InspectorComponent         - Transaction Data Table        - Prompt Harness    |
|  (Registers 3D WebMCP tools)  - BI Simulation Action Bar                          |
|                               (Registers 4 BI WebMCP tools)                       |
|         |                               |                                         |
|         |                               v                                         |
|         |                     EnterpriseDataService                               |
|         |                     - Signal State & Filters                            |
|         |                     - Aggregations & Exports                            |
|         +-------------------------------+-----------------------------------------+
|                                         |
|                                         v
|                    WebMcpService (Browser ModelContext / Emulator)
|                                         ^
|                                         |
|                 CopilotBridgeService <-> CopilotChatComponent
|                   (Gemini 3.7 Flash High Recursive Tool Calling)
+-----------------------------------------------------------------------------------+
```

### Route & Tool Lifecycle Flow
1. **Navigate to `/enterprise-bi`**:
   - Router mounts `EnterpriseBiComponent`.
   - `ngOnInit()` executes `webmcp.registerTool()` for `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, and `trigger_analytics_export`.
   - `CopilotBridgeService.getOpenAiTools()` dynamically reflects the 4 enterprise tools.
2. **AI Agent Tool Invocation**:
   - User enters prompt: *"Filter flagged transactions over $500 and summarize revenue"*.
   - Gemini selects `filter_business_data(status='flagged', minAmount=500)` -> `WebMcpService.executeTool()`.
   - `EnterpriseDataService` updates signals -> Table and KPI cards update reactively.
   - Tool returns sanitized summary -> Gemini synthesizes final response.
3. **Navigate away (e.g. to `/3d-showroom`)**:
   - `EnterpriseBiComponent.ngOnDestroy()` deregisters the 4 BI tools.
   - `ShowroomComponent.ngOnInit()` registers 3D viewport tools.

---

## 4. File Changes

| File | Action | Description |
| :--- | :--- | :--- |
| `projects/showcase/src/app/app.routes.ts` | **Create** | Standalone Angular route definitions (`/3d-showroom`, `/enterprise-bi`, `/judge-guide`, redirects). |
| `projects/showcase/src/app/app.config.ts` | **Modify** | Add `provideRouter(routes, withComponentInputBinding())`. |
| `projects/showcase/src/app/app.component.ts` | **Modify** | Refactor root component into clean shell importing `RouterOutlet`, `HeaderComponent`, `CopilotChatComponent`. |
| `projects/showcase/src/app/app.component.html` | **Modify** | Replace monolithic layout with `<app-header>`, `<router-outlet>`, and `<app-copilot-chat>`. |
| `projects/showcase/src/app/components/showroom/showroom.component.ts` | **Create** | Standalone wrapper hosting `Visualizer3dComponent`, `CustomizerFormComponent`, and `InspectorComponent`. |
| `projects/showcase/src/app/components/showroom/showroom.component.html` | **Create** | View layout for 3D showroom, customizer form, and live event inspector. |
| `projects/showcase/src/app/services/enterprise-data.types.ts` | **Create** | TypeScript interfaces for telemetry metrics, transactions, aggregations, export receipts, and tool results. |
| `projects/showcase/src/app/services/enterprise-data.service.ts` | **Create** | Signal-based data provider holding mock business dataset, query filters, and tool execution handlers. |
| `projects/showcase/src/app/components/enterprise-bi/enterprise-bi.component.ts` | **Create** | Standalone BI dashboard component with KPI cards, SVG trend chart, data table, simulation bar, and tool lifecycle. |
| `projects/showcase/src/app/components/enterprise-bi/enterprise-bi.component.html` | **Create** | Template with cyber-themed KPI metric cards, SVG trend visualization, transaction table, and simulation controls. |
| `projects/showcase/src/app/components/header/header.component.ts` | **Modify** | Add navigation tabs with cyber glow active state, route-aware quick prompts, and router navigation triggers. |
| `projects/showcase/src/app/components/judge-guide/judge-guide.component.ts` | **Modify** | Enhance into full-page view featuring Devpost rubric checklist, dual-domain interactive test prompts, and architecture map. |

---

## 5. Interfaces & Contracts

### 5.1 Data Contracts (`enterprise-data.types.ts`)

```typescript
export type Department = 'Engineering' | 'Finance' | 'Operations' | 'Security' | 'Global';
export type MetricCategory = 'revenue' | 'latency' | 'anomaly' | 'throughput' | 'conversion';
export type TransactionStatus = 'completed' | 'pending' | 'flagged';
export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface EnterpriseMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  department: Department;
  category: MetricCategory;
  timestamp: string;
}

export interface TransactionRecord {
  id: string;
  reference: string;
  timestamp: string;
  department: Exclude<Department, 'Global'>;
  amount: number;
  currency: string;
  status: TransactionStatus;
  riskScore: number;
  customerRegion: string;
  description: string;
}

export interface BiAggregationResult {
  totalRevenue: number;
  averageLatencyMs: number;
  anomalyRatio: number;
  conversionRate: number;
  activeNodes: number;
  queryThroughputRps: number;
  computedAt: string;
  metricsAnalyzed: number;
  includedMetrics: string[];
  departmentBreakdown: Record<string, number>;
}

export interface ExportAuditReport {
  reportId: string;
  generatedAt: string;
  format: ExportFormat;
  recordCount: number;
  filtersApplied: string;
  checksum: string;
  downloadUrl: string;
  status: 'ready' | 'downloading';
  fileSizeBytes: number;
}
```

### 5.2 WebMCP BI Tools Contracts

1. **`query_enterprise_metrics`**:
   - Parameters: `{ timeRange?: '1h'|'24h'|'7d'|'30d'|'quarter'|'all', department?: Department|'All' }`
   - Output: `{ metrics: EnterpriseMetric[], totalCount: number, timeRange: string, department: string, summary: string }`
2. **`filter_business_data`**:
   - Parameters: `{ status?: 'completed'|'pending'|'flagged'|'all', minAmount?: number, department?: Department|'All' }`
   - Output: `{ filteredCount: number, totalCount: number, status: string, minAmount: number, department: string, records: TransactionRecord[], appliedFiltersSummary: string }`
3. **`calculate_kpi_summary`**:
   - Parameters: `{ metrics: string[], department?: Department|'All' }` (required: `['metrics']`)
   - Output: `{ totalRevenue: number, averageLatencyMs: number, anomalyRatio: number, conversionRate: number, activeNodes: number, queryThroughputRps: number, computedAt: string, metricsAnalyzed: number, executiveSummary: string }`
4. **`trigger_analytics_export`**:
   - Parameters: `{ format: 'json'|'csv'|'pdf', filterSummary?: string }` (required: `['format']`)
   - Output: `{ reportId: string, generatedAt: string, format: string, recordCount: number, checksum: string, downloadUrl: string, status: string, message: string }`

---

## 6. Testing Strategy

| Layer | Target | Approach |
| :--- | :--- | :--- |
| **Unit Tests** | `EnterpriseDataService` | Test metric queries, transaction filtering with edge cases (minAmount=0, empty status), aggregation formulas, and deterministic export generation. |
| **Unit Tests** | `app.routes.ts` & Navigation | Test route mapping, default redirect to `/3d-showroom`, wildcard fallback on unrecognized paths. |
| **Component Tests** | `EnterpriseBiComponent` | Verify tool registration on `ngOnInit()`, deregistration on `ngOnDestroy()`, signal updates on filter change, and SVG chart rendering. |
| **Integration Tests** | `CopilotBridgeService` + WebMCP | Verify dynamic tool discovery: switching routes changes tools returned by `getOpenAiTools()`, preventing invalid cross-domain invocations. |
| **End-to-End / Visual** | Browser Verification | Verify cyber glow active tab indicator, simulation action bar execution, and live Copilot tool-calling loops. |

---

## 7. Threat Matrix & Security Analysis

| Boundary | Minimum Adversarial Cases | Applicability | Design Response | Planned RED Tests |
| :--- | :--- | :--- | :--- | :--- |
| **Client-Side URL Routing** | Unknown paths (`/admin`, `/../../etc`), malformed query params | **Applicable** | Angular Router wildcard `**` redirects all unmapped paths safely to `/3d-showroom`. Component input binding strictly validates typed params. | Test navigation to `/invalid-path` redirects to `/3d-showroom` without throwing unhandled exceptions. |
| **Input Sanitization & Injection** | Malformed filter strings, XSS payloads in `filterSummary`, script tags in export names | **Applicable** | Strict enum type validation and text escaping on export receipts and query summaries. | Test `trigger_analytics_export` with `<script>` tags in `filterSummary` produces sanitized plain-text output. |
| **Tool Lifecycle & Memory Leak** | Rapid navigation between routes without unregistering tools | **Applicable** | `ngOnDestroy` explicitly removes all registered tools via `WebMcpService.unregisterTool()`. | Test navigating between `/3d-showroom` and `/enterprise-bi` 10 times leaves exactly the active route's tools in registry. |
| **LLM Token Budget Protection** | High transaction counts returned in tool execution result | **Applicable** | Tool return payloads return truncated subsets (max 10 sample records) alongside statistical summaries to avoid breaching model context. | Test `filter_business_data` with 100+ matching records returns bounded payload under 4KB. |
| **Git / VCS Automations** | Git repo selection, commit state, push state, PR commands | **N/A** | Client-side Angular web application; no CLI shell or VCS subprocess execution exists in runtime. | None (N/A). |

---

## 8. Migration & Rollout

- **Non-breaking transition**: The existing 3D showroom functionality is encapsulated into `ShowroomComponent` under route `/3d-showroom`.
- **Default path preservation**: Visiting `/` automatically redirects to `/3d-showroom`, ensuring backwards compatibility for existing links and bookmarks.
- **Standalone components**: All newly added views (`ShowroomComponent`, `EnterpriseBiComponent`, updated `JudgeGuideComponent`) are standalone with zero module dependencies.

---

## 9. Open Questions

*None. The technical architecture, route contracts, tool schemas, and security guardrails are fully resolved and ready for task breakdown.*
