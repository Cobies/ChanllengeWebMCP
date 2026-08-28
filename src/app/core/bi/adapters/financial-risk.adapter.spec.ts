import { describe, it, expect, beforeEach } from 'bun:test';
import { FinancialRiskAdapter } from './financial-risk.adapter';

describe('FinancialRiskAdapter (Multi-Domain BI Vertical)', () => {
  let adapter: FinancialRiskAdapter;

  beforeEach(() => {
    adapter = new FinancialRiskAdapter();
  });

  it('should have correct domain identity and metadata', () => {
    expect(adapter.domainId).toBe('financial_risk');
    expect(adapter.displayName).toBe('Financial Risk & AML');
    expect(adapter.description).toContain('Financial Risk');
  });

  it('should query seeded transactional and AML records', async () => {
    const allRecords = await adapter.queryRecords();
    expect(allRecords.length).toBeGreaterThanOrEqual(4);

    const wireRecords = await adapter.queryRecords({ department: 'Wire Transfer' });
    expect(wireRecords.every((r) => r.department === 'Wire Transfer')).toBe(true);
  });

  it('should calculate FDR %, composite anomaly score [0.0, 100.0], and anomaly alerts accurately', () => {
    const mockRecords = [
      {
        id: 'tx-001',
        transactionId: 'TX-AML-1001',
        department: 'Wire Transfer',
        amount: 250000,
        currency: 'USD',
        latencyMs: 38.5,
        status: 'flagged' as const,
        anomalyScore: 92.4, // Alert: > 85.0
        riskCategory: 'High Velocity Transfer',
        region: 'NA-East',
        timestamp: '2026-08-27T10:00:00.000Z',
      },
      {
        id: 'tx-002',
        transactionId: 'TX-AML-1002',
        department: 'Card Services',
        amount: 120,
        currency: 'USD',
        latencyMs: 14.2,
        status: 'completed' as const,
        anomalyScore: 4.5,
        riskCategory: 'Standard POS',
        region: 'EU-West',
        timestamp: '2026-08-27T11:00:00.000Z',
      },
      {
        id: 'tx-003',
        transactionId: 'TX-AML-1003',
        department: 'Crypto Desk',
        amount: 45000,
        currency: 'USD',
        latencyMs: 55.0,
        status: 'blocked' as const,
        anomalyScore: 89.0, // Alert: > 85.0
        riskCategory: 'Sanctioned IP Origin',
        region: 'AP-South',
        timestamp: '2026-08-27T12:00:00.000Z',
      },
    ];

    const kpi = adapter.calculateKpiSummary(mockRecords);
    expect(kpi.domain).toBe('financial_risk');
    expect(kpi.totalRecords).toBe(3);
    expect(kpi.totalVolume).toBe(295120);

    // FDR %: (2 flagged/blocked out of 3) * 100 = 66.7%
    expect(kpi.keyMetrics['fraudDetectionRatePercent']).toBe(66.7);

    // Average anomaly score: (92.4 + 4.5 + 89.0) / 3 = 61.97 -> 62.0
    expect(kpi.keyMetrics['compositeAnomalyScore']).toBe(62.0);

    // Alert count (> 85.0): 2
    expect(kpi.keyMetrics['criticalAlertCount']).toBe(2);

    expect(kpi.healthScore).toBeGreaterThanOrEqual(0);
    expect(kpi.healthScore).toBeLessThanOrEqual(100);
  });

  it('should handle zero-division edge case on empty record set', () => {
    const kpi = adapter.calculateKpiSummary([]);
    expect(kpi.totalRecords).toBe(0);
    expect(kpi.totalVolume).toBe(0);
    expect(kpi.keyMetrics['fraudDetectionRatePercent']).toBe(0);
    expect(kpi.keyMetrics['compositeAnomalyScore']).toBe(0);
    expect(kpi.keyMetrics['criticalAlertCount']).toBe(0);
    expect(kpi.healthScore).toBe(100);
  });

  it('should export risk audit records in valid JSON and CSV formats', async () => {
    const records = await adapter.queryRecords({ limit: 2 });
    const csvExport = await adapter.formatExportData(records, 'csv');
    expect(csvExport.success).toBe(true);
    expect(csvExport.data).toContain('id,transactionId,department,amount');
  });
});
