import { describe, it, expect, beforeEach } from 'bun:test';
import { CustomerRetentionAdapter } from './customer-retention.adapter';

describe('CustomerRetentionAdapter (Multi-Domain BI Vertical)', () => {
  let adapter: CustomerRetentionAdapter;

  beforeEach(() => {
    adapter = new CustomerRetentionAdapter();
  });

  it('should have correct domain identity and metadata', () => {
    expect(adapter.domainId).toBe('customer_retention');
    expect(adapter.displayName).toBe('Customer Retention & SaaS Churn');
    expect(adapter.description).toContain('Customer Retention');
  });

  it('should query seeded accounts with department/tier filters', async () => {
    const allRecords = await adapter.queryRecords();
    expect(allRecords.length).toBeGreaterThanOrEqual(4);

    const enterpriseRecords = await adapter.queryRecords({ department: 'Enterprise' });
    expect(enterpriseRecords.every((r) => r.department === 'Enterprise')).toBe(true);
  });

  it('should calculate NRR %, churn risk count, and customer health score accurately', () => {
    const mockRecords = [
      {
        id: 'cust-01',
        customerId: 'CUST-ENT-001',
        companyName: 'Acme Corp',
        department: 'Enterprise',
        status: 'active' as const,
        arr: 120000,
        startingArr: 100000,
        expansionArr: 20000,
        churnedArr: 0,
        healthScore: 92,
        npsScore: 9,
        tenureMonths: 24,
        timestamp: '2026-08-27T08:00:00.000Z',
      },
      {
        id: 'cust-02',
        customerId: 'CUST-SMB-002',
        companyName: 'Beta Startups',
        department: 'SMB',
        status: 'churn_risk' as const,
        arr: 30000,
        startingArr: 40000,
        expansionArr: 0,
        churnedArr: 10000,
        healthScore: 45,
        npsScore: 4,
        tenureMonths: 8,
        timestamp: '2026-08-27T09:00:00.000Z',
      },
    ];

    const kpi = adapter.calculateKpiSummary(mockRecords);
    expect(kpi.domain).toBe('customer_retention');
    expect(kpi.totalRecords).toBe(2);
    expect(kpi.totalVolume).toBe(150000); // Sum of ARR

    // Total Starting ARR: 100000 + 40000 = 140000
    // Total Exp: 20000
    // Total Churn: 10000
    // NRR %: ((140000 + 20000 - 10000) / 140000) * 100 = (150000 / 140000) * 100 = 107.1%
    expect(kpi.keyMetrics['netRetentionRatePercent']).toBe(107.1);

    // Churn risk count: 1
    expect(kpi.keyMetrics['churnRiskCount']).toBe(1);

    // Average health score: (92 + 45) / 2 = 68.5
    expect(kpi.keyMetrics['averageHealthScore']).toBe(68.5);

    expect(kpi.healthScore).toBeGreaterThanOrEqual(0);
    expect(kpi.healthScore).toBeLessThanOrEqual(100);
  });

  it('should handle zero-division edge case on empty record set', () => {
    const kpi = adapter.calculateKpiSummary([]);
    expect(kpi.totalRecords).toBe(0);
    expect(kpi.totalVolume).toBe(0);
    expect(kpi.keyMetrics['netRetentionRatePercent']).toBe(100);
    expect(kpi.keyMetrics['churnRiskCount']).toBe(0);
    expect(kpi.healthScore).toBe(100);
  });

  it('should format export records in CSV and JSON formats', async () => {
    const records = await adapter.queryRecords({ limit: 2 });
    const jsonExport = await adapter.formatExportData(records, 'json');
    expect(jsonExport.success).toBe(true);
    expect(jsonExport.format).toBe('json');
    expect(jsonExport.recordCount).toBe(2);
  });
});
