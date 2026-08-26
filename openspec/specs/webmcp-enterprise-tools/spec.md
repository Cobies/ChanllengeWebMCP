# WebMCP Enterprise Tools Specification

## Purpose
Dedicated enterprise WebMCP tools exposed by the BI dashboard for autonomous metrics querying, transactional filtering, KPI aggregations, and cryptographic export generation.

## Requirements

### Requirement: Tool 1: query_enterprise_metrics
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

### Requirement: Tool 2: filter_business_data
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

### Requirement: Tool 3: calculate_kpi_summary
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

#### Return Schema (`CalculateKpiSummaryResult`)
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

### Requirement: Tool 4: trigger_analytics_export
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
