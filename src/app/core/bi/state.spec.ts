import { describe, it, expect, beforeEach } from 'bun:test';
import { EnterpriseBiStateService } from './enterprise-bi-state.service';
import { BiToolRegistry } from './registry';
import type { BiDomainAdapter, BiFilterCriteria, BiKpiSummary } from './bi.types';

describe('EnterpriseBiStateService (Reactive Signals Store)', () => {
  let stateService: EnterpriseBiStateService;
  let registry: BiToolRegistry;

  const mockSupplyChainAdapter: BiDomainAdapter<any> = {
    domainId: 'supply_chain',
    displayName: 'Supply Chain & Logistics',
    description: 'Logistics and supply inventory',
    queryRecords: () => [
      { id: 'sc-1', sku: 'SKU-001', department: 'Logistics', status: 'delivered', cost: 1000 },
      { id: 'sc-2', sku: 'SKU-002', department: 'Warehouse', status: 'delayed', cost: 2000 },
      { id: 'sc-3', sku: 'SKU-003', department: 'Logistics', status: 'in_transit', cost: 1500 },
    ],
    filterRecords: (records, criteria) => {
      return records.filter((r) => {
        if (criteria.department && r.department !== criteria.department) return false;
        if (criteria.status && r.status !== criteria.status) return false;
        if (criteria.searchTerm && !r.sku.toLowerCase().includes(criteria.searchTerm.toLowerCase())) return false;
        return true;
      });
    },
    calculateKpiSummary: (records) => {
      const total = records.length;
      const totalVolume = records.reduce((acc, r) => acc + (r.cost || 0), 0);
      return {
        domain: 'supply_chain',
        totalRecords: total,
        totalVolume,
        healthScore: total > 0 ? 88 : 0,
        keyMetrics: { otifRate: 85 },
        timestamp: new Date().toISOString(),
      };
    },
    formatExportData: (records, format) => ({
      success: true,
      exportId: 'exp-sc',
      domain: 'supply_chain',
      format,
      recordCount: records.length,
      data: JSON.stringify(records),
      checksum: 'chk-sc',
      generatedAt: new Date().toISOString(),
    }),
  };

  const mockRiskAdapter: BiDomainAdapter<any> = {
    domainId: 'financial_risk',
    displayName: 'Financial Risk & AML',
    description: 'Fraud detection and AML telemetry',
    queryRecords: () => [
      { id: 'tx-1', amount: 5000, department: 'Card', status: 'completed' },
      { id: 'tx-2', amount: 95000, department: 'Wire', status: 'flagged' },
    ],
    filterRecords: (records, criteria) => {
      return records.filter((r) => {
        if (criteria.department && r.department !== criteria.department) return false;
        if (criteria.status && r.status !== criteria.status) return false;
        return true;
      });
    },
    calculateKpiSummary: (records) => {
      const total = records.length;
      const totalVolume = records.reduce((acc, r) => acc + (r.amount || 0), 0);
      return {
        domain: 'financial_risk',
        totalRecords: total,
        totalVolume,
        healthScore: 75,
        keyMetrics: { fdrRate: 50 },
        timestamp: new Date().toISOString(),
      };
    },
    formatExportData: (records, format) => ({
      success: true,
      exportId: 'exp-risk',
      domain: 'financial_risk',
      format,
      recordCount: records.length,
      data: JSON.stringify(records),
      checksum: 'chk-risk',
      generatedAt: new Date().toISOString(),
    }),
  };

  beforeEach(() => {
    registry = new BiToolRegistry([mockSupplyChainAdapter, mockRiskAdapter]);
    stateService = new EnterpriseBiStateService(registry);
  });

  it('should initialize with default domain and load initial state reactively', async () => {
    expect(stateService.activeDomain()).toBe('supply_chain');
    await stateService.initialize();

    expect(stateService.records().length).toBe(3);
    expect(stateService.filteredRecords().length).toBe(3);
    expect(stateService.kpiSummary()?.domain).toBe('supply_chain');
    expect(stateService.kpiSummary()?.totalVolume).toBe(4500);
    expect(stateService.kpiSummary()?.healthScore).toBe(88);
  });

  it('should apply filters and compute derived filteredRecords & kpiSummary reactively', async () => {
    await stateService.initialize();
    stateService.setFilterCriteria({ department: 'Logistics' });

    expect(stateService.filteredRecords().length).toBe(2);
    expect(stateService.kpiSummary()?.totalRecords).toBe(2);
    expect(stateService.kpiSummary()?.totalVolume).toBe(2500);

    stateService.updateSearchTerm('SKU-001');
    expect(stateService.filteredRecords().length).toBe(1);
    expect(stateService.filteredRecords()[0].sku).toBe('SKU-001');

    stateService.resetFilters();
    expect(stateService.filteredRecords().length).toBe(3);
  });

  it('should switch active domain with latency < 50ms and update all signals', async () => {
    await stateService.initialize();

    const t0 = performance.now();
    await stateService.setActiveDomain('financial_risk');
    const elapsed = performance.now() - t0;

    expect(elapsed).toBeLessThan(50);
    expect(stateService.activeDomain()).toBe('financial_risk');
    expect(stateService.records().length).toBe(2);
    expect(stateService.kpiSummary()?.domain).toBe('financial_risk');
    expect(stateService.kpiSummary()?.totalVolume).toBe(100000);
  });

  it('should handle isExecuting and errorState signals during async operations', async () => {
    expect(stateService.isExecuting()).toBe(false);
    expect(stateService.errorState()).toBeNull();

    await stateService.executeQuery({ department: 'Warehouse' });
    expect(stateService.isExecuting()).toBe(false);
    expect(stateService.filteredRecords().length).toBe(1);
  });
});
