import { Injectable } from '@angular/core';
import type {
  BiDomainAdapter,
  BiFilterCriteria,
  BiKpiSummary,
  BiQueryParams,
  BiExportResult,
  BiExportFormat,
} from '../bi.types';

export type CustomerStatus = 'active' | 'churn_risk' | 'churned' | 'expanded';

export interface CustomerRetentionRecord {
  id: string;
  customerId: string;
  companyName: string;
  department: string; // Tier or Industry segment
  status: CustomerStatus;
  arr: number;
  startingArr: number;
  expansionArr: number;
  churnedArr: number;
  healthScore: number; // 0 to 100
  npsScore: number; // 0 to 10
  tenureMonths: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerRetentionAdapter implements BiDomainAdapter<CustomerRetentionRecord> {
  readonly domainId = 'customer_retention';
  readonly displayName = 'Customer Retention & SaaS Churn';
  readonly description = 'Customer Retention metrics covering Net Retention Rate (NRR), churn hazard scores, and account health.';

  private readonly mockDataset: CustomerRetentionRecord[] = [
    {
      id: 'cr-101',
      customerId: 'CUST-ENT-101',
      companyName: 'Global Cloud Systems',
      department: 'Enterprise',
      status: 'expanded',
      arr: 240000,
      startingArr: 180000,
      expansionArr: 60000,
      churnedArr: 0,
      healthScore: 94,
      npsScore: 10,
      tenureMonths: 36,
      timestamp: '2026-08-27T08:00:00.000Z',
    },
    {
      id: 'cr-102',
      customerId: 'CUST-MM-102',
      companyName: 'Apex Data Labs',
      department: 'Mid-Market',
      status: 'active',
      arr: 75000,
      startingArr: 75000,
      expansionArr: 0,
      churnedArr: 0,
      healthScore: 82,
      npsScore: 8,
      tenureMonths: 18,
      timestamp: '2026-08-27T09:30:00.000Z',
    },
    {
      id: 'cr-103',
      customerId: 'CUST-SMB-103',
      companyName: 'Nexus Fintech AI',
      department: 'SMB',
      status: 'churn_risk',
      arr: 28000,
      startingArr: 35000,
      expansionArr: 0,
      churnedArr: 7000,
      healthScore: 42,
      npsScore: 4,
      tenureMonths: 9,
      timestamp: '2026-08-27T10:15:00.000Z',
    },
    {
      id: 'cr-104',
      customerId: 'CUST-ENT-104',
      companyName: 'CyberShield Security',
      department: 'Enterprise',
      status: 'active',
      arr: 160000,
      startingArr: 150000,
      expansionArr: 10000,
      churnedArr: 0,
      healthScore: 89,
      npsScore: 9,
      tenureMonths: 28,
      timestamp: '2026-08-27T11:45:00.000Z',
    },
    {
      id: 'cr-105',
      customerId: 'CUST-SMB-105',
      companyName: 'Hyperion Logistics Tech',
      department: 'SMB',
      status: 'churned',
      arr: 0,
      startingArr: 25000,
      expansionArr: 0,
      churnedArr: 25000,
      healthScore: 15,
      npsScore: 2,
      tenureMonths: 6,
      timestamp: '2026-08-27T13:00:00.000Z',
    },
  ];

  queryRecords(params?: BiQueryParams): CustomerRetentionRecord[] {
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

  filterRecords(
    records: CustomerRetentionRecord[],
    criteria: BiFilterCriteria
  ): CustomerRetentionRecord[] {
    return records.filter((r) => {
      if (criteria.department && criteria.department !== 'all') {
        if (r.department.toLowerCase() !== criteria.department.toLowerCase()) return false;
      }
      if (criteria.status && criteria.status !== 'all') {
        if (r.status !== criteria.status) return false;
      }
      if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        const matchComp = r.companyName.toLowerCase().includes(term);
        const matchId = r.customerId.toLowerCase().includes(term);
        const matchDept = r.department.toLowerCase().includes(term);
        if (!matchComp && !matchId && !matchDept) return false;
      }
      if (typeof criteria.minAmount === 'number' && r.arr < criteria.minAmount) return false;
      if (typeof criteria.maxAmount === 'number' && r.arr > criteria.maxAmount) return false;
      if (criteria.startDate && r.timestamp < criteria.startDate) return false;
      if (criteria.endDate && r.timestamp > criteria.endDate) return false;
      return true;
    });
  }

  calculateKpiSummary(records: CustomerRetentionRecord[]): BiKpiSummary {
    const total = records.length;
    if (total === 0) {
      return {
        domain: this.domainId,
        totalRecords: 0,
        totalVolume: 0,
        healthScore: 100,
        keyMetrics: {
          netRetentionRatePercent: 100,
          churnRiskCount: 0,
          averageHealthScore: 100,
          totalExpansionArr: 0,
          totalChurnedArr: 0,
        },
        breakdown: { statusCounts: {} },
        timestamp: new Date().toISOString(),
      };
    }

    const totalVolume = records.reduce((sum, r) => sum + r.arr, 0);
    const totalStartingArr = records.reduce((sum, r) => sum + r.startingArr, 0);
    const totalExpansionArr = records.reduce((sum, r) => sum + r.expansionArr, 0);
    const totalChurnedArr = records.reduce((sum, r) => sum + r.churnedArr, 0);

    const netRetentionRatePercent =
      totalStartingArr > 0
        ? Number((((totalStartingArr + totalExpansionArr - totalChurnedArr) / totalStartingArr) * 100).toFixed(1))
        : 100;

    const churnRiskCount = records.filter(
      (r) => r.status === 'churn_risk' || r.status === 'churned'
    ).length;

    const totalHealth = records.reduce((sum, r) => sum + r.healthScore, 0);
    const averageHealthScore = Number((totalHealth / total).toFixed(1));

    // Health score clamped between 0 and 100
    let healthScore = Math.round(averageHealthScore * 0.6 + (netRetentionRatePercent >= 100 ? 40 : (netRetentionRatePercent / 100) * 40));
    healthScore = Math.max(0, Math.min(100, healthScore));

    const statusCounts: Record<string, number> = {};
    for (const r of records) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return {
      domain: this.domainId,
      totalRecords: total,
      totalVolume,
      healthScore,
      keyMetrics: {
        netRetentionRatePercent,
        churnRiskCount,
        averageHealthScore,
        totalExpansionArr,
        totalChurnedArr,
      },
      breakdown: { statusCounts },
      timestamp: new Date().toISOString(),
    };
  }

  formatExportData(records: CustomerRetentionRecord[], format: BiExportFormat): BiExportResult {
    const exportId = `exp-cr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const generatedAt = new Date().toISOString();

    let data = '';
    if (format === 'csv') {
      const headers = [
        'id',
        'customerId',
        'companyName',
        'department',
        'status',
        'arr',
        'startingArr',
        'expansionArr',
        'churnedArr',
        'healthScore',
        'npsScore',
        'tenureMonths',
        'timestamp',
      ];
      const rows = records.map((r) =>
        [
          r.id,
          r.customerId,
          `"${r.companyName.replace(/"/g, '""')}"`,
          r.department,
          r.status,
          r.arr,
          r.startingArr,
          r.expansionArr,
          r.churnedArr,
          r.healthScore,
          r.npsScore,
          r.tenureMonths,
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
