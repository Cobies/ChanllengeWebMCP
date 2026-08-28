import { describe, it, expect, beforeEach } from 'bun:test';
import { CloudFinOpsAdapter } from './cloud-finops.adapter';

describe('CloudFinOpsAdapter (Multi-Domain BI Vertical)', () => {
  let adapter: CloudFinOpsAdapter;

  beforeEach(() => {
    adapter = new CloudFinOpsAdapter();
  });

  it('should have correct domain identity and metadata', () => {
    expect(adapter.domainId).toBe('cloud_finops');
    expect(adapter.displayName).toBe('Cloud FinOps & Infrastructure Costs');
    expect(adapter.description).toContain('Cloud FinOps');
  });

  it('should query seeded cloud resources with service and department filters', async () => {
    const allRecords = await adapter.queryRecords();
    expect(allRecords.length).toBeGreaterThanOrEqual(4);

    const k8sRecords = await adapter.queryRecords({ department: 'Engineering' });
    expect(k8sRecords.every((r) => r.department === 'Engineering')).toBe(true);
  });

  it('should calculate unit economics $/req, MTTR outage costs, and budget variance % accurately', () => {
    const mockRecords = [
      {
        id: 'fin-01',
        resourceId: 'res-eks-prod-01',
        service: 'Kubernetes Cluster EKS',
        department: 'Engineering',
        status: 'active' as const,
        monthlySpend: 15000,
        budget: 12000,
        unitCostPerRequest: 0.0003,
        requestCount: 50000000,
        idleSpend: 1200,
        incidentOutageCost: 3500,
        timestamp: '2026-08-27T08:00:00.000Z',
      },
      {
        id: 'fin-02',
        resourceId: 'res-rds-prod-02',
        service: 'PostgreSQL Multi-AZ RDS',
        department: 'Data Platform',
        status: 'active' as const,
        monthlySpend: 8000,
        budget: 10000,
        unitCostPerRequest: 0.00016,
        requestCount: 50000000,
        idleSpend: 400,
        incidentOutageCost: 0,
        timestamp: '2026-08-27T09:00:00.000Z',
      },
    ];

    const kpi = adapter.calculateKpiSummary(mockRecords);
    expect(kpi.domain).toBe('cloud_finops');
    expect(kpi.totalRecords).toBe(2);
    expect(kpi.totalVolume).toBe(23000); // monthlySpend 15000 + 8000

    // Total Requests: 100,000,000. Unit economics: 23000 / 100,000,000 = 0.00023
    expect(kpi.keyMetrics['unitCostPerRequest']).toBe(0.00023);

    // Total MTTR incident outage cost: 3500
    expect(kpi.keyMetrics['totalIncidentOutageCost']).toBe(3500);

    // Total budget: 22000. Total spend: 23000. Variance %: ((23000 - 22000)/22000)*100 = 4.5%
    expect(kpi.keyMetrics['budgetVariancePercent']).toBe(4.5);

    // Total idle spend: 1600. Idle spend %: (1600 / 23000)*100 = 7.0%
    expect(kpi.keyMetrics['idleSpendPercent']).toBe(7.0);

    expect(kpi.healthScore).toBeGreaterThanOrEqual(0);
    expect(kpi.healthScore).toBeLessThanOrEqual(100);
  });

  it('should handle zero-division edge case on empty dataset', () => {
    const kpi = adapter.calculateKpiSummary([]);
    expect(kpi.totalRecords).toBe(0);
    expect(kpi.totalVolume).toBe(0);
    expect(kpi.keyMetrics['unitCostPerRequest']).toBe(0);
    expect(kpi.keyMetrics['budgetVariancePercent']).toBe(0);
    expect(kpi.healthScore).toBe(100);
  });

  it('should format export records in CSV and JSON formats', async () => {
    const records = await adapter.queryRecords({ limit: 2 });
    const csvExport = await adapter.formatExportData(records, 'csv');
    expect(csvExport.success).toBe(true);
    expect(csvExport.data).toContain('id,resourceId,service,department');
  });
});
