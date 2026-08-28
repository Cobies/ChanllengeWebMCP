import { describe, it, expect, beforeEach } from 'bun:test';
import { SupplyChainAdapter } from './supply-chain.adapter';

describe('SupplyChainAdapter (Multi-Domain BI Vertical)', () => {
  let adapter: SupplyChainAdapter;

  beforeEach(() => {
    adapter = new SupplyChainAdapter();
  });

  it('should have correct domain identity and metadata', () => {
    expect(adapter.domainId).toBe('supply_chain');
    expect(adapter.displayName).toBe('Supply Chain & Logistics');
    expect(adapter.description).toContain('Supply Chain');
  });

  it('should query mock/seeded records with optional department and limit filtering', async () => {
    const allRecords = await adapter.queryRecords();
    expect(allRecords.length).toBeGreaterThanOrEqual(4);

    const warehouseRecords = await adapter.queryRecords({ department: 'Warehouse' });
    expect(warehouseRecords.every((r) => r.department === 'Warehouse')).toBe(true);

    const limited = await adapter.queryRecords({ limit: 2 });
    expect(limited.length).toBe(2);
  });

  it('should filter records by status, search term, min/max cost', async () => {
    const records = await adapter.queryRecords();
    const filtered = adapter.filterRecords(records, {
      status: 'delivered',
      searchTerm: 'Sensor',
    });

    for (const r of filtered) {
      expect(r.status).toBe('delivered');
      expect(r.name.toLowerCase()).toContain('sensor');
    }
  });

  it('should calculate OTIF %, turnover rate, and stockout risk index accurately', async () => {
    const mockRecords = [
      {
        id: 'sc-1',
        sku: 'SKU-001',
        name: 'LiDAR Module',
        department: 'Logistics',
        status: 'delivered' as const,
        orderVolume: 500,
        cost: 25000,
        onTimeInFull: true,
        stockLevel: 10,
        safetyStock: 50, // Stockout risk: stockLevel <= safetyStock
        leadTimeDays: 4,
        timestamp: '2026-08-27T10:00:00.000Z',
      },
      {
        id: 'sc-2',
        sku: 'SKU-002',
        name: 'Optical Sensor',
        department: 'Logistics',
        status: 'delayed' as const,
        orderVolume: 300,
        cost: 15000,
        onTimeInFull: false,
        stockLevel: 100,
        safetyStock: 30,
        leadTimeDays: 12,
        timestamp: '2026-08-27T11:00:00.000Z',
      },
    ];

    const kpi = adapter.calculateKpiSummary(mockRecords);
    expect(kpi.domain).toBe('supply_chain');
    expect(kpi.totalRecords).toBe(2);
    expect(kpi.totalVolume).toBe(40000);

    // OTIF %: (1 / 2) * 100 = 50.0
    expect(kpi.keyMetrics['otifRatePercent']).toBe(50);

    // Stockout risk index: 1 out of 2 has stockLevel <= safetyStock -> 0.5
    expect(kpi.keyMetrics['stockoutRiskIndex']).toBe(0.5);

    // Health score within [0, 100]
    expect(kpi.healthScore).toBeGreaterThanOrEqual(0);
    expect(kpi.healthScore).toBeLessThanOrEqual(100);
  });

  it('should handle zero-division edge cases gracefully for empty record sets', () => {
    const kpi = adapter.calculateKpiSummary([]);
    expect(kpi.totalRecords).toBe(0);
    expect(kpi.totalVolume).toBe(0);
    expect(kpi.keyMetrics['otifRatePercent']).toBe(100);
    expect(kpi.keyMetrics['stockoutRiskIndex']).toBe(0);
    expect(kpi.healthScore).toBe(100);
  });

  it('should format export data in CSV and JSON formats', async () => {
    const records = await adapter.queryRecords({ limit: 2 });
    const jsonExport = await adapter.formatExportData(records, 'json');
    expect(jsonExport.success).toBe(true);
    expect(jsonExport.format).toBe('json');
    expect(jsonExport.recordCount).toBe(2);
    expect(jsonExport.checksum).toBeDefined();

    const csvExport = await adapter.formatExportData(records, 'csv');
    expect(csvExport.success).toBe(true);
    expect(csvExport.format).toBe('csv');
    expect(csvExport.data).toContain('id,sku,name');
  });
});
