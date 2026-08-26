# WebMCP Enterprise BI Specification

## Purpose
Enterprise data intelligence contracts and signal-driven reactive state management for metrics and transactions.

## Requirements

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
