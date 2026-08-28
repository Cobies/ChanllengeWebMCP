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

// --- Multi-Domain Inventory & Sub-Navigation Models ---
export type BusinessDomain = 'retail' | 'hardware' | 'logistics' | 'pharma' | 'all';
export type InventoryStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'reordered';
export type EnterpriseBiTab = 'analytics' | 'transactions' | 'inventory';
export type ReorderPriority = 'standard' | 'expedited' | 'critical';

export interface InventorySupplier {
  id: string;
  name: string;
  leadTimeDays: number;
  rating: number;
  contactEmail: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  domain: BusinessDomain;
  stockLevel: number;
  minThreshold: number;
  maxCapacity: number;
  unitPrice: number;
  currency: string;
  status: InventoryStockStatus;
  supplier: InventorySupplier;
  lastRestocked: string;
  location: string;
}

export interface InventoryFilterState {
  domain: BusinessDomain;
  status: InventoryStockStatus | 'all';
  searchTerm: string;
  lowStockOnly: boolean;
}

export interface DomainSummaryResult {
  domain: BusinessDomain;
  totalSkus: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthScore: number;
}

export interface ReorderReceipt {
  reorderId: string;
  sku: string;
  quantity: number;
  priority: ReorderPriority;
  supplier: InventorySupplier;
  estimatedArrival: string;
  totalCost: number;
  orderedAt: string;
}
