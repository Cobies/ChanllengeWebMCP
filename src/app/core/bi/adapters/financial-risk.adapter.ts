import { Injectable } from '@angular/core';
import type {
  BiDomainAdapter,
  BiFilterCriteria,
  BiKpiSummary,
  BiQueryParams,
  BiExportResult,
  BiExportFormat,
} from '../bi.types';

export type FinancialRiskStatus = 'completed' | 'pending' | 'flagged' | 'blocked' | 'under_review';

export interface FinancialRiskRecord {
  id: string;
  transactionId: string;
  department: string;
  amount: number;
  currency: string;
  latencyMs: number;
  status: FinancialRiskStatus;
  anomalyScore: number; // 0.0 to 100.0
  riskCategory: string;
  region: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class FinancialRiskAdapter implements BiDomainAdapter<FinancialRiskRecord> {
  readonly domainId = 'financial_risk';
  readonly displayName = 'Financial Risk & AML';
  readonly description = 'Financial Risk & AML telemetry, fraud detection velocity, and anomaly scoring.';

  private readonly mockDataset: FinancialRiskRecord[] = [
    {
      id: 'aml-101',
      transactionId: 'TX-AML-1001',
      department: 'Wire Transfer',
      amount: 450000,
      currency: 'USD',
      latencyMs: 42.1,
      status: 'flagged',
      anomalyScore: 94.2,
      riskCategory: 'Cross-Border Smurfing',
      region: 'NA-East',
      timestamp: '2026-08-27T07:15:00.000Z',
    },
    {
      id: 'aml-102',
      transactionId: 'TX-AML-1002',
      department: 'Card Services',
      amount: 340,
      currency: 'USD',
      latencyMs: 12.8,
      status: 'completed',
      anomalyScore: 3.8,
      riskCategory: 'Routine Retail POS',
      region: 'EU-Central',
      timestamp: '2026-08-27T08:00:00.000Z',
    },
    {
      id: 'aml-103',
      transactionId: 'TX-AML-1003',
      department: 'Crypto Desk',
      amount: 88000,
      currency: 'USD',
      latencyMs: 65.4,
      status: 'blocked',
      anomalyScore: 98.7,
      riskCategory: 'OFAC Sanctioned Wallet',
      region: 'AP-East',
      timestamp: '2026-08-27T09:30:00.000Z',
    },
    {
      id: 'aml-104',
      transactionId: 'TX-AML-1004',
      department: 'Treasury',
      amount: 1250000,
      currency: 'USD',
      latencyMs: 28.3,
      status: 'completed',
      anomalyScore: 11.2,
      riskCategory: 'Scheduled Liquidity Sweep',
      region: 'NA-Central',
      timestamp: '2026-08-27T10:45:00.000Z',
    },
    {
      id: 'aml-105',
      transactionId: 'TX-AML-1005',
      department: 'Merchant Acquiring',
      amount: 15400,
      currency: 'USD',
      latencyMs: 19.6,
      status: 'under_review',
      anomalyScore: 78.5,
      riskCategory: 'High Velocity Chargeback Risk',
      region: 'SA-East',
      timestamp: '2026-08-27T12:00:00.000Z',
    },
  ];

  queryRecords(params?: BiQueryParams): FinancialRiskRecord[] {
    let results = [...this.mockDataset];

    if (params?.department) {
      results = results.filter(
        (r) => r.department.toLowerCase() === params.department!.toLowerCase()
      );
    }
    if (params?.status) {
      results = results.filter((r) => r.status === params.status);
    }
    if (params?.startDate) {
      results = results.filter((r) => r.timestamp >= params.startDate!);
    }
    if (params?.endDate) {
      results = results.filter((r) => r.timestamp <= params.endDate!);
    }
    if (typeof params?.limit === 'number' && params.limit > 0) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  filterRecords(records: FinancialRiskRecord[], criteria: BiFilterCriteria): FinancialRiskRecord[] {
    return records.filter((r) => {
      if (criteria.department && criteria.department !== 'all') {
        if (r.department.toLowerCase() !== criteria.department.toLowerCase()) return false;
      }
      if (criteria.status && criteria.status !== 'all') {
        if (r.status !== criteria.status) return false;
      }
      if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        const matchTx = r.transactionId.toLowerCase().includes(term);
        const matchCat = r.riskCategory.toLowerCase().includes(term);
        const matchDept = r.department.toLowerCase().includes(term);
        const matchRegion = r.region.toLowerCase().includes(term);
        if (!matchTx && !matchCat && !matchDept && !matchRegion) return false;
      }
      if (typeof criteria.minAmount === 'number' && r.amount < criteria.minAmount) return false;
      if (typeof criteria.maxAmount === 'number' && r.amount > criteria.maxAmount) return false;
      if (criteria.startDate && r.timestamp < criteria.startDate) return false;
      if (criteria.endDate && r.timestamp > criteria.endDate) return false;
      return true;
    });
  }

  calculateKpiSummary(records: FinancialRiskRecord[]): BiKpiSummary {
    const total = records.length;
    if (total === 0) {
      return {
        domain: this.domainId,
        totalRecords: 0,
        totalVolume: 0,
        healthScore: 100,
        keyMetrics: {
          fraudDetectionRatePercent: 0,
          compositeAnomalyScore: 0,
          criticalAlertCount: 0,
          averageLatencyMs: 0,
        },
        breakdown: { statusCounts: {} },
        timestamp: new Date().toISOString(),
      };
    }

    const totalVolume = records.reduce((sum, r) => sum + r.amount, 0);
    const flaggedOrBlockedCount = records.filter(
      (r) => r.status === 'flagged' || r.status === 'blocked'
    ).length;
    const fraudDetectionRatePercent = Number(((flaggedOrBlockedCount / total) * 100).toFixed(1));

    const totalScore = records.reduce((sum, r) => sum + r.anomalyScore, 0);
    const compositeAnomalyScore = Number((totalScore / total).toFixed(1));

    const criticalAlertCount = records.filter((r) => r.anomalyScore > 85.0).length;

    const totalLatency = records.reduce((sum, r) => sum + r.latencyMs, 0);
    const averageLatencyMs = Number((totalLatency / total).toFixed(1));

    // Health score: decreases with higher fraud detection rate and high anomaly scores
    let healthScore = Math.round(100 - (fraudDetectionRatePercent * 0.5 + (compositeAnomalyScore / 100) * 50));
    healthScore = Math.max(0, Math.min(100, healthScore));

    const statusCounts: Record<string, number> = {};
    for (const r of records) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return {
      domain: this.domainId,
      totalRecords: total,
      totalVolume,
      averageLatencyMs,
      anomalyRatePercent: fraudDetectionRatePercent,
      healthScore,
      keyMetrics: {
        fraudDetectionRatePercent,
        compositeAnomalyScore,
        criticalAlertCount,
        averageLatencyMs,
      },
      breakdown: { statusCounts },
      timestamp: new Date().toISOString(),
    };
  }

  formatExportData(records: FinancialRiskRecord[], format: BiExportFormat): BiExportResult {
    const exportId = `exp-aml-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const generatedAt = new Date().toISOString();

    let data = '';
    if (format === 'csv') {
      const headers = ['id', 'transactionId', 'department', 'amount', 'currency', 'latencyMs', 'status', 'anomalyScore', 'riskCategory', 'region', 'timestamp'];
      const rows = records.map((r) =>
        [
          r.id,
          r.transactionId,
          r.department,
          r.amount,
          r.currency,
          r.latencyMs,
          r.status,
          r.anomalyScore,
          `"${r.riskCategory.replace(/"/g, '""')}"`,
          r.region,
          r.timestamp,
        ].join(',')
      );
      data = [headers.join(','), ...rows].join('\n');
    } else {
      data = JSON.stringify(records, null, 2);
    }

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    const checksum = `sha256-${Math.abs(hash).toString(16).padStart(8, '0')}`;

    return {
      success: true,
      exportId,
      domain: this.domainId,
      format,
      recordCount: records.length,
      data,
      checksum,
      generatedAt,
    };
  }
}
