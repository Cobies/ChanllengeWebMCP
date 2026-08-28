/**
 * Core type definitions and generic adapter contracts for Multi-Domain Enterprise BI WebMCP Library.
 */

export type BiTimeRange = '1h' | '24h' | '7d' | '30d' | 'all';
export type BiExportFormat = 'json' | 'csv' | 'pdf';

export interface BiFilterCriteria {
  department?: string;
  status?: string;
  searchTerm?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  timeRange?: BiTimeRange;
  [key: string]: unknown;
}

export interface BiQueryResult<T = unknown> {
  success: boolean;
  domain: string;
  totalCount: number;
  records: T[];
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface BiKpiSummary {
  domain: string;
  totalRecords: number;
  totalVolume: number;
  averageLatencyMs?: number;
  anomalyRatePercent?: number;
  healthScore: number; // 0 to 100
  keyMetrics: Record<string, number | string>;
  breakdown?: Record<string, unknown>;
  timestamp: string;
}

export interface BiExportResult {
  success: boolean;
  exportId: string;
  domain: string;
  format: BiExportFormat | string;
  recordCount: number;
  data: string;
  checksum: string;
  generatedAt: string;
  downloadUrl?: string;
}

export interface BiQueryParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  status?: string;
  limit?: number;
  [key: string]: unknown;
}

/**
 * Generic Domain Adapter contract for Enterprise BI verticals.
 */
export interface BiDomainAdapter<
  TRecord = unknown,
  TFilter extends BiFilterCriteria = BiFilterCriteria,
  TKpi extends BiKpiSummary = BiKpiSummary
> {
  /** Unique domain identifier (e.g., 'supply_chain', 'financial_risk', 'customer_retention', 'cloud_finops') */
  readonly domainId: string;

  /** Human-readable display title */
  readonly displayName: string;

  /** Domain description for AI Agent tool resolution */
  readonly description: string;

  /** Query raw or filtered records from this vertical */
  queryRecords(params?: BiQueryParams): Promise<TRecord[]> | TRecord[];

  /** Filter a set of records using domain-specific or universal criteria */
  filterRecords(records: TRecord[], criteria: TFilter): TRecord[];

  /** Compute composite KPIs and summary statistics */
  calculateKpiSummary(records: TRecord[]): Promise<TKpi> | TKpi;

  /** Format records into CSV/JSON/PDF export payload */
  formatExportData(
    records: TRecord[],
    format: BiExportFormat
  ): Promise<BiExportResult> | BiExportResult;
}
