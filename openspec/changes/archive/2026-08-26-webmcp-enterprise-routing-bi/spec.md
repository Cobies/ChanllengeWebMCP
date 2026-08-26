# Specification: WebMCP Enterprise Routing & BI Dashboard

**Change**: `webmcp-enterprise-routing-bi`  
**Status**: Approved Specification  
**Target Architecture**: Angular 22, Bun Runtime, Tailwind CSS v4, `@webmcp/angular`, CPAMC Copilot Bridge (`gemini-3.7-flash-high`)  

---

## 1. Domain: Angular Enterprise Routing (`webmcp-showcase-routing`)

### Requirement: Multi-Route Declarative Routing Hierarchy
The system MUST provide declarative Angular route configurations in `projects/showcase/src/app/app.routes.ts` mapping navigation paths to dedicated standalone view components, configured with route redirect defaults, wildcard fallbacks, and page title metadata.

#### Route Table Specification
| Path | Target Component | Title / Metadata | Behavior |
|------|------------------|-------------------|----------|
| `''` | Redirect (`/3d-showroom`) | N/A | `pathMatch: 'full'`, redirects to primary 3D visualizer |
| `'3d-showroom'` | `Showroom3dComponent` | `'3D Digital Twin Showroom \| WebMCP Angular'` | Mounts Three.js WebGL viewport, customizer form, and screenshot tools |
| `'enterprise-bi'` | `EnterpriseBiComponent` | `'Enterprise BI Dashboard \| WebMCP Angular'` | Mounts enterprise telemetry, KPI trend charts, data tables, and BI tools |
| `'judge-guide'` | `JudgeGuideComponent` | `'Devpost Judge Guide & Rubric \| WebMCP Angular'` | Mounts interactive evaluation rubric, architecture deep-dive, and prompt harness |
| `'**'` | Redirect (`/3d-showroom`) | N/A | Wildcard fallback redirecting unknown URLs to 3D showroom |

#### Scenario: Default URL navigation redirects to 3D showroom
- **GIVEN** an application loaded at base URL `/`
- **WHEN** the Angular Router initializes
- **THEN** it MUST automatically redirect the user to `/3d-showroom`
- **AND** render `Showroom3dComponent` inside `<router-outlet>`.

#### Scenario: Direct deep-link navigation to Enterprise BI
- **GIVEN** a browser navigating directly to `/enterprise-bi`
- **WHEN** the route resolution finishes
- **THEN** the application MUST render `EnterpriseBiComponent`
- **AND** update the document title to `'Enterprise BI Dashboard | WebMCP Angular'`.

#### Scenario: Wildcard fallback on unknown route
- **GIVEN** a user or agent navigates to `/unknown-path/telemetry`
- **WHEN** router pattern matching fails
- **THEN** the router MUST trigger the wildcard route `**`
- **AND** redirect to `/3d-showroom`.

---

### Requirement: Cyber Glow Header Navigation & Context-Aware Prompt Chips
The `HeaderComponent` MUST display active navigation tabs with cyber glow visual styling (`bg-cyan-500/10 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20`) using `routerLink` and `routerLinkActive`, and SHALL display context-aware Quick Prompt chips corresponding to the active route.

#### Context-Aware Prompt Chips Matrix
| Route | Chip Label | Dispatched Copilot Prompt |
|-------|------------|---------------------------|
| `/3d-showroom` | 🔄 Orbit 45° | `"Rotate 3D model camera by 45 degrees around Y axis"` |
| `/3d-showroom` | 🎨 Neon Cyan | `"Update vehicle paint color to #00f0ff and rims to titanium"` |
| `/3d-showroom` | 📸 Screenshot | `"Take a high-resolution screenshot of the 3D canvas and verify"` |
| `/3d-showroom` | 📝 Auto-Fill | `"Configure customizer form: Cyber Cruiser, Carbon, Sport Aero, Submit"` |
| `/enterprise-bi` | 📊 Q3 Metrics | `"Query enterprise metrics for Finance and Operations over 24h"` |
| `/enterprise-bi` | 🚩 Flagged Audit | `"Filter business data for flagged transactions with amount > 500"` |
| `/enterprise-bi` | 📈 KPI Summary | `"Calculate executive KPI summary across revenue, latency, and anomalies"` |
| `/enterprise-bi` | 📥 Export PDF | `"Generate compliance audit analytics export in PDF format"` |
| `/judge-guide` | 🏆 Devpost Audit | `"Review WebMCP architectural compliance and run all autonomous tests"` |

#### Scenario: Active route tab highlight
- **GIVEN** the current URL is `/enterprise-bi`
- **WHEN** the header renders
- **THEN** the "Enterprise BI" tab MUST have the active cyber glow CSS classes
- **AND** the Quick Prompt bar MUST display the 4 enterprise telemetry prompt chips.

---

## 2. Domain: Enterprise BI Data Contracts & State (`webmcp-enterprise-bi`)

### Requirement: Enterprise BI Data Contracts
The system MUST define strict TypeScript interfaces for enterprise metrics, financial/operational transactions, KPI aggregation results, and audit export receipts in `projects/showcase/src/app/services/enterprise-data.types.ts`.

#### Data Schema Definitions
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
  riskScore: number; // 0 to 100
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
  checksum: string; // SHA-256 formatted hex string
  downloadUrl: string;
  status: 'ready' | 'downloading';
  fileSizeBytes: number;
}
```

---

### Requirement: Enterprise Data Service State Management
The `EnterpriseDataService` (`projects/showcase/src/app/services/enterprise-data.service.ts`) MUST manage an in-memory, deterministic enterprise dataset utilizing Angular Signals for fine-grained reactivity.

#### Service API Contract
```typescript
@Injectable({ providedIn: 'root' })
export class EnterpriseDataService {
  // Reactive Signals
  readonly metrics: Signal<EnterpriseMetric[]>;
  readonly transactions: Signal<TransactionRecord[]>;
  readonly selectedDepartment: Signal<Department | 'All'>;
  readonly statusFilter: Signal<TransactionStatus | 'all'>;
  readonly minAmountFilter: Signal<number>;
  readonly filteredTransactions: Signal<TransactionRecord[]>;
  readonly kpiSummary: Signal<BiAggregationResult>;
  readonly latestExport: Signal<ExportAuditReport | null>;

  // State Mutation Methods
  setDepartmentFilter(dept: Department | 'All'): void;
  setStatusFilter(status: TransactionStatus | 'all'): void;
  setMinAmountFilter(amount: number): void;
  
  // Data Query & Tool Handler Methods
  queryMetrics(timeRange?: string, department?: string): QueryMetricsResult;
  filterTransactions(status?: TransactionStatus | 'all', minAmount?: number, department?: string): FilterBusinessDataResult;
  calculateKpis(metricsList?: string[], department?: string): BiAggregationResult;
  generateExport(format: ExportFormat, filterSummary?: string): ExportAuditReport;
}
```

#### Scenario: Deterministic dataset initialization
- **GIVEN** `EnterpriseDataService` is instantiated
- **WHEN** initialization completes
- **THEN** it MUST contain at least 8 enterprise metrics spanning revenue, latency, anomaly, and throughput
- **AND** at least 20 transaction records with realistic distributions of `completed`, `pending`, and `flagged` statuses.

#### Scenario: Signal reactivity on filter mutation
- **GIVEN** `EnterpriseDataService` contains 25 transactions
- **WHEN** `setStatusFilter('flagged')` is invoked
- **THEN** `filteredTransactions()` MUST immediately recompute to contain only records where `status === 'flagged'`
- **AND** notify all dependent UI components without requiring manual change detection.

---

## 3. Domain: Enterprise WebMCP Tools (`webmcp-enterprise-tools`)

The system MUST implement and register 4 dedicated enterprise WebMCP tools when the BI dashboard mounts.

### Tool 1: `query_enterprise_metrics`
Queries business telemetry, server latencies, revenue performance, and security anomaly indicators.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "timeRange": {
      "type": "string",
      "enum": ["1h", "24h", "7d", "30d", "quarter", "all"],
      "description": "Time window for telemetry aggregation (default: '24h')"
    },
    "department": {
      "type": "string",
      "enum": ["Engineering", "Finance", "Operations", "Security", "Global", "All"],
      "description": "Department filter or 'All' (default: 'All')"
    }
  },
  "additionalProperties": false
}
```

#### Return Schema (`QueryMetricsResult`)
```typescript
export interface QueryMetricsResult {
  metrics: EnterpriseMetric[];
  totalCount: number;
  timeRange: string;
  department: string;
  summary: string;
}
```

#### Scenario: Query metrics for specific department
- **GIVEN** the BI tools are registered
- **WHEN** an AI agent executes `query_enterprise_metrics` with `{ "department": "Security" }`
- **THEN** the tool MUST return all metrics belonging to the Security department
- **AND** `summary` MUST provide an executive textual summary of the metric values.

---

### Tool 2: `filter_business_data`
Filters live enterprise transactions by status, minimum dollar amount, and department, updating both service state and UI view.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["completed", "pending", "flagged", "all"],
      "description": "Transaction lifecycle or risk status filter"
    },
    "minAmount": {
      "type": "number",
      "description": "Minimum transaction dollar threshold"
    },
    "department": {
      "type": "string",
      "enum": ["Engineering", "Finance", "Operations", "Security", "All"],
      "description": "Department scope"
    }
  },
  "additionalProperties": false
}
```

#### Return Schema (`FilterBusinessDataResult`)
```typescript
export interface FilterBusinessDataResult {
  filteredCount: number;
  totalCount: number;
  status: string;
  minAmount: number;
  department: string;
  records: TransactionRecord[];
  appliedFiltersSummary: string;
}
```

#### Scenario: Filter flagged high-value transactions
- **GIVEN** the transactions table contains items ranging from $50 to $2500
- **WHEN** `filter_business_data` is invoked with `{ "status": "flagged", "minAmount": 500 }`
- **THEN** the returned `records` MUST contain only items where `status === 'flagged'` AND `amount >= 500`
- **AND** `EnterpriseDataService.filteredTransactions` MUST update to reflect the filter on the UI.

---

### Tool 3: `calculate_kpi_summary`
Computes executive aggregated KPIs (Revenue, Latency, Anomaly Ratio, Conversion Rate).

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "metrics": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of metric IDs or categories to include in calculation (e.g. ['revenue', 'latency', 'anomaly'])"
    },
    "department": {
      "type": "string",
      "enum": ["Engineering", "Finance", "Operations", "Security", "Global", "All"],
      "description": "Optional department filter"
    }
  },
  "required": ["metrics"],
  "additionalProperties": false
}
```

#### Return Schema (`BiAggregationResult`)
```typescript
export interface CalculateKpiSummaryResult {
  totalRevenue: number;
  averageLatencyMs: number;
  anomalyRatio: number;
  conversionRate: number;
  activeNodes: number;
  queryThroughputRps: number;
  computedAt: string;
  metricsAnalyzed: number;
  executiveSummary: string;
}
```

#### Scenario: Calculate executive KPI summary for revenue and latency
- **GIVEN** active telemetry metrics in `EnterpriseDataService`
- **WHEN** `calculate_kpi_summary` is executed with `{ "metrics": ["revenue", "latency"] }`
- **THEN** the tool MUST calculate `totalRevenue` and `averageLatencyMs` from matching records
- **AND** return an `executiveSummary` string suitable for agent synthesis.

---

### Tool 4: `trigger_analytics_export`
Generates an audited export report with cryptographic hash checksum and creates a downloadable receipt.

#### Parameter Schema
```json
{
  "type": "object",
  "properties": {
    "format": {
      "type": "string",
      "enum": ["json", "csv", "pdf"],
      "description": "Desired file format for the business report"
    },
    "filterSummary": {
      "type": "string",
      "description": "Optional human-readable description of filter scope"
    }
  },
  "required": ["format"],
  "additionalProperties": false
}
```

#### Return Schema (`TriggerExportResult`)
```typescript
export interface TriggerExportResult {
  reportId: string;
  generatedAt: string;
  format: 'json' | 'csv' | 'pdf';
  recordCount: number;
  checksum: string;
  downloadUrl: string;
  status: 'ready' | 'downloading';
  message: string;
}
```

#### Scenario: Trigger PDF compliance export
- **GIVEN** active filtered transaction dataset
- **WHEN** `trigger_analytics_export` is called with `{ "format": "pdf", "filterSummary": "Flagged Security Transactions" }`
- **THEN** the tool MUST generate a unique `reportId` (e.g. `EXP-2026-XXXX`)
- **AND** return a valid SHA-256 formatted checksum and mock `downloadUrl`
- **AND** update `EnterpriseDataService.latestExport` signal.

---

## 4. Domain: Dynamic Tool Lifecycle & Copilot Bridge (`webmcp-tool-lifecycle`)

### Requirement: Route-Scoped Dynamic Tool Lifecycle
Components MUST explicitly register their route-specific tools in `ngOnInit()` and unregister them in `ngOnDestroy()` using `WebMcpService`.

#### Lifecycle Binding Rules
| Component / View | Registered Tools on Init | Unregistered on Destroy |
|-------------------|--------------------------|-------------------------|
| `Showroom3dComponent` | `scene_3d_action`, `take_screenshot`, `form_action_runner` | `scene_3d_action`, `take_screenshot`, `form_action_runner` |
| `EnterpriseBiComponent` | `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export` | `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export` |
| `JudgeGuideComponent` | None (View only) | None |

#### Scenario: Route transition tool unregistration and registration
- **GIVEN** the user is on `/3d-showroom` with 3 3D tools registered (`scene_3d_action`, `take_screenshot`, `form_action_runner`)
- **WHEN** the user navigates to `/enterprise-bi`
- **THEN** `Showroom3dComponent.ngOnDestroy()` MUST call `unregisterTool()` for all 3 3D tools
- **AND** `EnterpriseBiComponent.ngOnInit()` MUST call `registerTool()` for the 4 enterprise tools
- **AND** `webmcp.registeredTools()` MUST reflect exactly the 4 enterprise tools.

#### Scenario: Dynamic Copilot tool adaptation
- **GIVEN** the Copilot drawer is open on `/enterprise-bi`
- **WHEN** a user sends a prompt to Gemini 3.7 Flash High
- **THEN** `CopilotBridgeService.getOpenAiTools()` MUST return the OpenAI schemas for the 4 active enterprise tools
- **AND** MUST NOT include unregistered 3D tools.

---

## 5. Summary Matrix of Acceptance Criteria

| Domain | Total Requirements | Scenarios | Edge Cases Covered |
|--------|-------------------|-----------|--------------------|
| `webmcp-showcase-routing` | 2 | 4 | Wildcard route, root redirect, direct deep-link, active tab glow |
| `webmcp-enterprise-bi` | 2 | 4 | Empty filter fallback, signal reactivity, deterministic datasets |
| `webmcp-enterprise-tools` | 4 | 6 | All/empty params, invalid filters, checksum creation, executive synthesis |
| `webmcp-tool-lifecycle` | 1 | 3 | Route change unmount, Copilot dynamic schema isolation, memory leak prevention |

---

## 6. Next Recommended Phase
Ready for architecture and implementation design: `sdd-design`.
