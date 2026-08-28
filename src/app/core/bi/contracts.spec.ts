import { describe, it, expect } from 'bun:test';
import type {
  BiDomainAdapter,
  BiFilterCriteria,
  BiQueryResult,
  BiKpiSummary,
  BiExportResult,
  BiTimeRange,
  BiExportFormat,
} from './bi.types';

describe('Enterprise BI Core Contracts & Invariants', () => {
  it('should validate mock BiDomainAdapter adhering to contract type definitions', async () => {
    interface MockRecord {
      id: string;
      value: number;
      department: string;
      status: string;
    }

    const mockAdapter: BiDomainAdapter<MockRecord> = {
      domainId: 'supply_chain',
      displayName: 'Supply Chain Logistics',
      description: 'Supply chain operations and warehouse inventory telemetry',
      queryRecords: async (params) => {
        const records: MockRecord[] = [
          { id: '1', value: 100, department: 'Logistics', status: 'completed' },
          { id: '2', value: 200, department: 'Procurement', status: 'pending' },
        ];
        if (params?.department) {
          return records.filter((r) => r.department === params.department);
        }
        return records;
      },
      filterRecords: (records, criteria) => {
        return records.filter((r) => {
          if (criteria.department && r.department !== criteria.department) return false;
          if (criteria.status && r.status !== criteria.status) return false;
          return true;
        });
      },
      calculateKpiSummary: (records) => {
        const total = records.length;
        const totalVolume = records.reduce((acc, r) => acc + r.value, 0);
        return {
          domain: 'supply_chain',
          totalRecords: total,
          totalVolume,
          healthScore: total > 0 ? 95 : 0,
          keyMetrics: {
            averageValue: total > 0 ? totalVolume / total : 0,
          },
          timestamp: new Date().toISOString(),
        };
      },
      formatExportData: (records, format) => {
        const data = JSON.stringify(records);
        return {
          success: true,
          exportId: 'exp-123',
          domain: 'supply_chain',
          format,
          recordCount: records.length,
          data,
          checksum: 'sha256-mock',
          generatedAt: new Date().toISOString(),
        };
      },
    };

    expect(mockAdapter.domainId).toBe('supply_chain');
    expect(mockAdapter.displayName).toBe('Supply Chain Logistics');

    const queried = await mockAdapter.queryRecords({ department: 'Logistics' });
    expect(queried.length).toBe(1);
    expect(queried[0].department).toBe('Logistics');

    const filtered = mockAdapter.filterRecords(queried, { status: 'completed' });
    expect(filtered.length).toBe(1);

    const kpi = mockAdapter.calculateKpiSummary(filtered);
    expect(kpi.domain).toBe('supply_chain');
    expect(kpi.healthScore).toBe(95);
    expect(kpi.keyMetrics['averageValue']).toBe(100);

    const exportResult = await mockAdapter.formatExportData(filtered, 'json');
    expect(exportResult.success).toBe(true);
    expect(exportResult.format).toBe('json');
    expect(exportResult.recordCount).toBe(1);
  });

  it('should enforce BiFilterCriteria type shape with standard fields', () => {
    const criteria: BiFilterCriteria = {
      department: 'Finance',
      status: 'flagged',
      searchTerm: 'anomaly',
      minAmount: 1000,
      maxAmount: 50000,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.999Z',
      customAttribute: 'special',
    };

    expect(criteria.department).toBe('Finance');
    expect(criteria.minAmount).toBe(1000);
    expect(criteria.maxAmount).toBe(50000);
  });

  it('should enforce BiKpiSummary healthScore boundaries [0, 100]', () => {
    const validSummary: BiKpiSummary = {
      domain: 'financial_risk',
      totalRecords: 10,
      totalVolume: 500000,
      healthScore: 88,
      keyMetrics: { fraudDetectionRate: 4.2 },
      timestamp: '2026-08-27T18:00:00.000Z',
    };

    expect(validSummary.healthScore).toBeGreaterThanOrEqual(0);
    expect(validSummary.healthScore).toBeLessThanOrEqual(100);
  });
});
