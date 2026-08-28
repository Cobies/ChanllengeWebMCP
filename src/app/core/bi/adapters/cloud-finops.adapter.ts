import { Injectable } from '@angular/core';
import type {
  BiDomainAdapter,
  BiFilterCriteria,
  BiKpiSummary,
  BiQueryParams,
  BiExportResult,
  BiExportFormat,
} from '../bi.types';

export type FinOpsStatus = 'active' | 'idle' | 'provisioning' | 'deprecating';

export interface CloudFinOpsRecord {
  id: string;
  resourceId: string;
  service: string;
  department: string;
  status: FinOpsStatus;
  monthlySpend: number;
  budget: number;
  unitCostPerRequest: number;
  requestCount: number;
  idleSpend: number;
  incidentOutageCost: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class CloudFinOpsAdapter implements BiDomainAdapter<CloudFinOpsRecord> {
  readonly domainId = 'cloud_finops';
  readonly displayName = 'Cloud FinOps & Infrastructure Costs';
  readonly description = 'Cloud FinOps cost intelligence, unit economics per request, idle waste, and outage impact.';

  private readonly mockDataset: CloudFinOpsRecord[] = [
    {
      id: 'cfo-101',
      resourceId: 'res-eks-us-east-1',
      service: 'Kubernetes Cluster (EKS)',
      department: 'Engineering',
      status: 'active',
      monthlySpend: 18500,
      budget: 16000,
      unitCostPerRequest: 0.00028,
      requestCount: 66000000,
      idleSpend: 1400,
      incidentOutageCost: 2800,
      timestamp: '2026-08-27T08:00:00.000Z',
    },
    {
      id: 'cfo-102',
      resourceId: 'res-rds-pg-primary',
      service: 'Aurora PostgreSQL Multi-AZ',
      department: 'Data Platform',
      status: 'active',
      monthlySpend: 9200,
      budget: 10000,
      unitCostPerRequest: 0.00014,
      requestCount: 66000000,
      idleSpend: 300,
      incidentOutageCost: 0,
      timestamp: '2026-08-27T09:15:00.000Z',
    },
    {
      id: 'cfo-103',
      resourceId: 'res-redshift-dw',
      service: 'Redshift Data Warehouse',
      department: 'Analytics',
      status: 'idle',
      monthlySpend: 14000,
      budget: 12000,
      unitCostPerRequest: 0.0012,
      requestCount: 11000000,
      idleSpend: 5600,
      incidentOutageCost: 0,
      timestamp: '2026-08-27T10:30:00.000Z',
    },
    {
      id: 'cfo-104',
      resourceId: 'res-cf-edge-cdn',
      service: 'CloudFront Edge CDN & WAF',
      department: 'Security',
      status: 'active',
      monthlySpend: 4500,
      budget: 5000,
      unitCostPerRequest: 0.00003,
      requestCount: 150000000,
      idleSpend: 100,
      incidentOutageCost: 0,
      timestamp: '2026-08-27T11:45:00.000Z',
    },
    {
      id: 'cfo-105',
      resourceId: 'res-lambda-serverless',
      service: 'Serverless Compute Farm',
      department: 'Engineering',
      status: 'active',
      monthlySpend: 6800,
      budget: 6500,
      unitCostPerRequest: 0.00008,
      requestCount: 85000000,
      idleSpend: 0,
      incidentOutageCost: 1200,
      timestamp: '2026-08-27T13:00:00.000Z',
    },
  ];

  queryRecords(params?: BiQueryParams): CloudFinOpsRecord[] {
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

  filterRecords(records: CloudFinOpsRecord[], criteria: BiFilterCriteria): CloudFinOpsRecord[] {
    return records.filter((r) => {
      if (criteria.department && criteria.department !== 'all') {
        if (r.department.toLowerCase() !== criteria.department.toLowerCase()) return false;
      }
      if (criteria.status && criteria.status !== 'all') {
        if (r.status !== criteria.status) return false;
      }
      if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        const matchRes = r.resourceId.toLowerCase().includes(term);
        const matchSvc = r.service.toLowerCase().includes(term);
        const matchDept = r.department.toLowerCase().includes(term);
        if (!matchRes && !matchSvc && !matchDept) return false;
      }
      if (typeof criteria.minAmount === 'number' && r.monthlySpend < criteria.minAmount) return false;
      if (typeof criteria.maxAmount === 'number' && r.monthlySpend > criteria.maxAmount) return false;
      if (criteria.startDate && r.timestamp < criteria.startDate) return false;
      if (criteria.endDate && r.timestamp > criteria.endDate) return false;
      return true;
    });
  }

  calculateKpiSummary(records: CloudFinOpsRecord[]): BiKpiSummary {
    const total = records.length;
    if (total === 0) {
      return {
        domain: this.domainId,
        totalRecords: 0,
        totalVolume: 0,
        healthScore: 100,
        keyMetrics: {
          unitCostPerRequest: 0,
          totalIncidentOutageCost: 0,
          budgetVariancePercent: 0,
          idleSpendPercent: 0,
          totalIdleSpend: 0,
        },
        breakdown: { statusCounts: {} },
        timestamp: new Date().toISOString(),
      };
    }

    const totalSpend = records.reduce((sum, r) => sum + r.monthlySpend, 0);
    const totalBudget = records.reduce((sum, r) => sum + r.budget, 0);
    const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
    const totalIdleSpend = records.reduce((sum, r) => sum + r.idleSpend, 0);
    const totalIncidentOutageCost = records.reduce((sum, r) => sum + r.incidentOutageCost, 0);

    const unitCostPerRequest =
      totalRequests > 0 ? Number((totalSpend / totalRequests).toFixed(5)) : 0;

    const budgetVariancePercent =
      totalBudget > 0
        ? Number((((totalSpend - totalBudget) / totalBudget) * 100).toFixed(1))
        : 0;

    const idleSpendPercent =
      totalSpend > 0 ? Number(((totalIdleSpend / totalSpend) * 100).toFixed(1)) : 0;

    // Health Score: 100 minus budget overrun penalties and high idle spend
    const overrunPenalty = Math.max(0, budgetVariancePercent) * 1.5;
    const idlePenalty = idleSpendPercent * 1.2;
    let healthScore = Math.round(100 - overrunPenalty - idlePenalty);
    healthScore = Math.max(0, Math.min(100, healthScore));

    const statusCounts: Record<string, number> = {};
    for (const r of records) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return {
      domain: this.domainId,
      totalRecords: total,
      totalVolume: totalSpend,
      healthScore,
      keyMetrics: {
        unitCostPerRequest,
        totalIncidentOutageCost,
        budgetVariancePercent,
        idleSpendPercent,
        totalIdleSpend,
      },
      breakdown: { statusCounts },
      timestamp: new Date().toISOString(),
    };
  }

  formatExportData(records: CloudFinOpsRecord[], format: BiExportFormat): BiExportResult {
    const exportId = `exp-cfo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const generatedAt = new Date().toISOString();

    let data = '';
    if (format === 'csv') {
      const headers = [
        'id',
        'resourceId',
        'service',
        'department',
        'status',
        'monthlySpend',
        'budget',
        'unitCostPerRequest',
        'requestCount',
        'idleSpend',
        'incidentOutageCost',
        'timestamp',
      ];
      const rows = records.map((r) =>
        [
          r.id,
          r.resourceId,
          `"${r.service.replace(/"/g, '""')}"`,
          r.department,
          r.status,
          r.monthlySpend,
          r.budget,
          r.unitCostPerRequest,
          r.requestCount,
          r.idleSpend,
          r.incidentOutageCost,
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
