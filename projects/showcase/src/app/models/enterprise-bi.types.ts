export type MetricCategory = 'performance' | 'financial' | 'infrastructure' | 'security';
export type MetricTrend = 'up' | 'down' | 'neutral';
export type MetricHealthStatus = 'healthy' | 'warning' | 'critical';
export type TransactionStatus = 'completed' | 'pending' | 'flagged';
export type ExportFormat = 'json' | 'csv' | 'pdf';
export type BiTimeRange = '1h' | '24h' | '7d' | '30d';

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface EnterpriseMetric {
  id: string;
  name: string;
  category: MetricCategory;
  value: number;
  unit: string;
  deltaPercent: number;
  trend: MetricTrend;
  history: MetricDataPoint[];
  targetThreshold?: number;
  status: MetricHealthStatus;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  department: string;
  service: string;
  amount: number;
  currency: string;
  latencyMs: number;
  status: TransactionStatus;
  anomalyScore: number; // 0.0 to 1.0
  region: string;
}

export interface BiAggregationResult {
  totalTransactions: number;
  totalVolume: number;
  averageLatencyMs: number;
  anomalyRatePercent: number;
  departmentBreakdown: Record<string, { count: number; volume: number }>;
  statusCounts: Record<TransactionStatus, number>;
}

export interface ExportAuditReport {
  exportId: string;
  format: ExportFormat;
  generatedAt: string;
  recordCount: number;
  checksum: string;
  downloadUrl?: string;
  filterSummary: string;
}

export interface BiFilterState {
  status: TransactionStatus | 'all';
  department: string;
  searchTerm: string;
  minAmount: number;
  timeRange: BiTimeRange;
}
