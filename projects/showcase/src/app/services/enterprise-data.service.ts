import { Injectable, signal, computed } from '@angular/core';
import {
  EnterpriseMetric,
  TransactionRecord,
  BiAggregationResult,
  ExportAuditReport,
  BiFilterState,
  MetricCategory,
  BiTimeRange,
  ExportFormat,
} from '../models/enterprise-bi.types';

@Injectable({
  providedIn: 'root',
})
export class EnterpriseDataService {
  // --- Raw State Signals ---
  readonly metrics = signal<EnterpriseMetric[]>([
    {
      id: 'revenue_ytd',
      name: 'Total Revenue YTD',
      category: 'financial',
      value: 14820000,
      unit: 'USD',
      deltaPercent: 18.4,
      trend: 'up',
      history: [
        { timestamp: '00:00', value: 12100000 },
        { timestamp: '04:00', value: 12400000 },
        { timestamp: '08:00', value: 13200000 },
        { timestamp: '12:00', value: 13900000 },
        { timestamp: '16:00', value: 14350000 },
        { timestamp: '20:00', value: 14820000 },
      ],
      targetThreshold: 15000000,
      status: 'healthy',
    },
    {
      id: 'system_latency',
      name: 'Global Edge Latency',
      category: 'performance',
      value: 42.6,
      unit: 'ms',
      deltaPercent: -8.2,
      trend: 'down',
      history: [
        { timestamp: '00:00', value: 58.2 },
        { timestamp: '04:00', value: 51.4 },
        { timestamp: '08:00', value: 47.9 },
        { timestamp: '12:00', value: 44.1 },
        { timestamp: '16:00', value: 43.0 },
        { timestamp: '20:00', value: 42.6 },
      ],
      targetThreshold: 50.0,
      status: 'healthy',
    },
    {
      id: 'active_nodes',
      name: 'Active Mesh Nodes',
      category: 'infrastructure',
      value: 1284,
      unit: 'nodes',
      deltaPercent: 4.5,
      trend: 'up',
      history: [
        { timestamp: '00:00', value: 1150 },
        { timestamp: '04:00', value: 1180 },
        { timestamp: '08:00', value: 1220 },
        { timestamp: '12:00', value: 1260 },
        { timestamp: '16:00', value: 1275 },
        { timestamp: '20:00', value: 1284 },
      ],
      targetThreshold: 1000,
      status: 'healthy',
    },
    {
      id: 'anomaly_score',
      name: 'AI Threat Anomaly Index',
      category: 'security',
      value: 0.014,
      unit: 'idx',
      deltaPercent: -32.1,
      trend: 'down',
      history: [
        { timestamp: '00:00', value: 0.045 },
        { timestamp: '04:00', value: 0.038 },
        { timestamp: '08:00', value: 0.024 },
        { timestamp: '12:00', value: 0.019 },
        { timestamp: '16:00', value: 0.016 },
        { timestamp: '20:00', value: 0.014 },
      ],
      targetThreshold: 0.05,
      status: 'healthy',
    },
  ]);

  readonly transactions = signal<TransactionRecord[]>([
    {
      id: 'TXN-9021-AF',
      timestamp: '2026-08-26T17:15:00Z',
      department: 'Autonomous Fleet',
      service: 'LiDAR Mesh Ingestion',
      amount: 14250.0,
      currency: 'USD',
      latencyMs: 38.4,
      status: 'completed',
      anomalyScore: 0.02,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9022-FC',
      timestamp: '2026-08-26T17:18:22Z',
      department: 'Fintech Cloud',
      service: 'High-Freq Settlement',
      amount: 98400.0,
      currency: 'USD',
      latencyMs: 14.2,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'eu-west-1',
    },
    {
      id: 'TXN-9023-EN',
      timestamp: '2026-08-26T17:21:40Z',
      department: 'Engineering',
      service: 'Neural Model Fine-Tuning',
      amount: 5600.0,
      currency: 'USD',
      latencyMs: 145.0,
      status: 'pending',
      anomalyScore: 0.08,
      region: 'us-west-2',
    },
    {
      id: 'TXN-9024-AS',
      timestamp: '2026-08-26T17:24:10Z',
      department: 'AI Security',
      service: 'Zero-Trust Auth Token Verification',
      amount: 1200.0,
      currency: 'USD',
      latencyMs: 8.7,
      status: 'completed',
      anomalyScore: 0.005,
      region: 'ap-northeast-1',
    },
    {
      id: 'TXN-9025-GS',
      timestamp: '2026-08-26T17:28:55Z',
      department: 'Global Sales',
      service: 'B2B Enterprise License Renewal',
      amount: 250000.0,
      currency: 'USD',
      latencyMs: 62.1,
      status: 'completed',
      anomalyScore: 0.04,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9026-FC',
      timestamp: '2026-08-26T17:30:12Z',
      department: 'Fintech Cloud',
      service: 'Cross-Border FX Liquidity Pool',
      amount: 175000.0,
      currency: 'USD',
      latencyMs: 22.5,
      status: 'completed',
      anomalyScore: 0.015,
      region: 'eu-central-1',
    },
    {
      id: 'TXN-9027-AS',
      timestamp: '2026-08-26T17:32:05Z',
      department: 'AI Security',
      service: 'DDoS Mitigation Ingress Filter',
      amount: 450.0,
      currency: 'USD',
      latencyMs: 310.4,
      status: 'flagged',
      anomalyScore: 0.89,
      region: 'sa-east-1',
    },
    {
      id: 'TXN-9028-AF',
      timestamp: '2026-08-26T17:34:40Z',
      department: 'Autonomous Fleet',
      service: 'Telemetry Vector Stream',
      amount: 8750.0,
      currency: 'USD',
      latencyMs: 41.2,
      status: 'completed',
      anomalyScore: 0.03,
      region: 'us-west-1',
    },
    {
      id: 'TXN-9029-EN',
      timestamp: '2026-08-26T17:36:19Z',
      department: 'Engineering',
      service: 'CI/CD Distributed Test Matrix',
      amount: 3200.0,
      currency: 'USD',
      latencyMs: 89.0,
      status: 'completed',
      anomalyScore: 0.02,
      region: 'us-east-2',
    },
    {
      id: 'TXN-9030-FC',
      timestamp: '2026-08-26T17:38:00Z',
      department: 'Fintech Cloud',
      service: 'Automated Margin Clearing',
      amount: 64200.0,
      currency: 'USD',
      latencyMs: 18.9,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'ap-southeast-1',
    },
    {
      id: 'TXN-9031-AS',
      timestamp: '2026-08-26T17:40:11Z',
      department: 'AI Security',
      service: 'Outlier Payload Quarantine',
      amount: 890.0,
      currency: 'USD',
      latencyMs: 450.0,
      status: 'flagged',
      anomalyScore: 0.94,
      region: 'eu-west-2',
    },
    {
      id: 'TXN-9032-GS',
      timestamp: '2026-08-26T17:42:33Z',
      department: 'Global Sales',
      service: 'OEM Partner Onboarding Tier 1',
      amount: 120000.0,
      currency: 'USD',
      latencyMs: 54.0,
      status: 'pending',
      anomalyScore: 0.03,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9033-AF',
      timestamp: '2026-08-26T17:44:02Z',
      department: 'Autonomous Fleet',
      service: 'Over-The-Air Firmware Manifest',
      amount: 22400.0,
      currency: 'USD',
      latencyMs: 49.3,
      status: 'completed',
      anomalyScore: 0.025,
      region: 'eu-north-1',
    },
    {
      id: 'TXN-9034-EN',
      timestamp: '2026-08-26T17:45:15Z',
      department: 'Engineering',
      service: 'Vector Embeddings Cache Warmup',
      amount: 7800.0,
      currency: 'USD',
      latencyMs: 72.8,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'us-west-2',
    },
    {
      id: 'TXN-9035-FC',
      timestamp: '2026-08-26T17:46:50Z',
      department: 'Fintech Cloud',
      service: 'Real-Time Compliance Audit Sweep',
      amount: 31000.0,
      currency: 'USD',
      latencyMs: 29.5,
      status: 'completed',
      anomalyScore: 0.015,
      region: 'ap-east-1',
    },
    {
      id: 'TXN-9036-AS',
      timestamp: '2026-08-26T17:48:10Z',
      department: 'AI Security',
      service: 'Credential Stuffing Defense',
      amount: 1500.0,
      currency: 'USD',
      latencyMs: 198.2,
      status: 'flagged',
      anomalyScore: 0.78,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9037-GS',
      timestamp: '2026-08-26T17:49:25Z',
      department: 'Global Sales',
      service: 'Cloud Storage Tier Upgrade',
      amount: 18500.0,
      currency: 'USD',
      latencyMs: 34.1,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'eu-central-1',
    },
    {
      id: 'TXN-9038-AF',
      timestamp: '2026-08-26T17:50:45Z',
      department: 'Autonomous Fleet',
      service: '3D Point Cloud Ground Truth Sync',
      amount: 45000.0,
      currency: 'USD',
      latencyMs: 88.6,
      status: 'pending',
      anomalyScore: 0.05,
      region: 'us-west-1',
    },
    {
      id: 'TXN-9039-EN',
      timestamp: '2026-08-26T17:51:30Z',
      department: 'Engineering',
      service: 'GraphQL Gateway Query Compilation',
      amount: 2900.0,
      currency: 'USD',
      latencyMs: 16.4,
      status: 'completed',
      anomalyScore: 0.005,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9040-FC',
      timestamp: '2026-08-26T17:52:10Z',
      department: 'Fintech Cloud',
      service: 'Synthetic Derivatives Rebalancing',
      amount: 320000.0,
      currency: 'USD',
      latencyMs: 25.1,
      status: 'completed',
      anomalyScore: 0.02,
      region: 'eu-west-1',
    },
  ]);

  readonly filterState = signal<BiFilterState>({
    status: 'all',
    department: 'all',
    searchTerm: '',
    minAmount: 0,
    timeRange: '24h',
  });

  readonly exportAuditLog = signal<ExportAuditReport[]>([]);

  // --- Computed Reactive Signals ---
  readonly filteredTransactions = computed(() => {
    const list = this.transactions();
    const filter = this.filterState();
    const search = filter.searchTerm.trim().toLowerCase();

    return list.filter((tx) => {
      // Status filter
      if (filter.status !== 'all' && tx.status !== filter.status) {
        return false;
      }
      // Department filter
      if (filter.department !== 'all' && tx.department.toLowerCase() !== filter.department.toLowerCase()) {
        return false;
      }
      // Min amount filter
      if (filter.minAmount > 0 && tx.amount < filter.minAmount) {
        return false;
      }
      // Search term
      if (search) {
        const matchesId = tx.id.toLowerCase().includes(search);
        const matchesService = tx.service.toLowerCase().includes(search);
        const matchesDept = tx.department.toLowerCase().includes(search);
        const matchesRegion = tx.region.toLowerCase().includes(search);
        if (!matchesId && !matchesService && !matchesDept && !matchesRegion) {
          return false;
        }
      }
      return true;
    });
  });

  readonly aggregation = computed<BiAggregationResult>(() => {
    const list = this.filteredTransactions();
    const totalTransactions = list.length;

    if (totalTransactions === 0) {
      return {
        totalTransactions: 0,
        totalVolume: 0,
        averageLatencyMs: 0,
        anomalyRatePercent: 0,
        departmentBreakdown: {},
        statusCounts: { completed: 0, pending: 0, flagged: 0 },
      };
    }

    let totalVolume = 0;
    let totalLatency = 0;
    let anomalyCount = 0;
    const statusCounts = { completed: 0, pending: 0, flagged: 0 };
    const departmentBreakdown: Record<string, { count: number; volume: number }> = {};

    for (const tx of list) {
      totalVolume += tx.amount;
      totalLatency += tx.latencyMs;
      if (tx.anomalyScore > 0.5 || tx.status === 'flagged') {
        anomalyCount++;
      }
      statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1;

      if (!departmentBreakdown[tx.department]) {
        departmentBreakdown[tx.department] = { count: 0, volume: 0 };
      }
      departmentBreakdown[tx.department].count++;
      departmentBreakdown[tx.department].volume += tx.amount;
    }

    const averageLatencyMs = Math.round((totalLatency / totalTransactions) * 10) / 10;
    const anomalyRatePercent = Math.round((anomalyCount / totalTransactions) * 1000) / 10;

    return {
      totalTransactions,
      totalVolume: Math.round(totalVolume * 100) / 100,
      averageLatencyMs,
      anomalyRatePercent,
      departmentBreakdown,
      statusCounts,
    };
  });

  readonly departments = computed(() => {
    const set = new Set<string>();
    this.transactions().forEach((tx) => set.add(tx.department));
    return Array.from(set).sort();
  });

  // --- Actions & Methods ---
  updateFilter(partial: Partial<BiFilterState>): void {
    this.filterState.update((current) => ({
      ...current,
      ...partial,
    }));
  }

  resetFilter(): void {
    this.filterState.set({
      status: 'all',
      department: 'all',
      searchTerm: '',
      minAmount: 0,
      timeRange: '24h',
    });
  }

  queryMetrics(params: { category?: MetricCategory; department?: string; timeRange?: BiTimeRange }): EnterpriseMetric[] {
    const all = this.metrics();
    if (!params.category) {
      return all;
    }
    return all.filter((m) => m.category === params.category);
  }

  calculateKpiSummary(metricIds?: string[]): {
    metricId: string;
    name: string;
    currentValue: number;
    unit: string;
    deltaPercent: number;
    status: string;
  }[] {
    const all = this.metrics();
    const targets = metricIds && metricIds.length > 0
      ? all.filter((m) => metricIds.includes(m.id))
      : all;

    return targets.map((m) => ({
      metricId: m.id,
      name: m.name,
      currentValue: m.value,
      unit: m.unit,
      deltaPercent: m.deltaPercent,
      status: m.status,
    }));
  }

  filterTransactions(filters: Partial<BiFilterState>): TransactionRecord[] {
    this.updateFilter(filters);
    return this.filteredTransactions();
  }

  triggerExport(format: ExportFormat = 'json', filterSummary?: string): ExportAuditReport {
    const data = this.filteredTransactions();
    const exportId = `EXP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const generatedAt = new Date().toISOString();
    const recordCount = data.length;
    const checksum = `sha256-${Math.random().toString(16).substring(2, 10)}`;

    const summary = filterSummary || `Filter status=${this.filterState().status}, dept=${this.filterState().department}, minAmount=${this.filterState().minAmount}`;

    const report: ExportAuditReport = {
      exportId,
      format,
      generatedAt,
      recordCount,
      checksum,
      downloadUrl: `blob:https://webmcp-bi.local/reports/${exportId}.${format}`,
      filterSummary: summary,
    };

    this.exportAuditLog.update((logs) => [report, ...logs.slice(0, 19)]);
    return report;
  }
}
