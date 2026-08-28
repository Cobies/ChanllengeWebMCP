import { describe, it, expect, beforeEach } from 'bun:test';
import { EnterpriseDataService } from './enterprise-data.service';
import { BiFilterState, ExportFormat } from '../models/enterprise-bi.types';

describe('EnterpriseDataService (Signals & Analytics)', () => {
  let service: EnterpriseDataService;

  beforeEach(() => {
    service = new EnterpriseDataService();
  });

  describe('Signal Initialization & Mock Dataset', () => {
    it('should initialize with standard enterprise metrics', () => {
      const metrics = service.metrics();
      expect(metrics.length).toBeGreaterThanOrEqual(4);
      
      const revenueMetric = metrics.find(m => m.id === 'revenue_ytd');
      expect(revenueMetric).toBeDefined();
      expect(revenueMetric?.category).toBe('financial');

      const latencyMetric = metrics.find(m => m.id === 'system_latency');
      expect(latencyMetric).toBeDefined();
      expect(latencyMetric?.category).toBe('performance');
    });

    it('should initialize with a robust transaction dataset', () => {
      const txs = service.transactions();
      expect(txs.length).toBeGreaterThanOrEqual(20);
      
      const first = txs[0];
      expect(first.id).toBeDefined();
      expect(first.amount).toBeGreaterThan(0);
      expect(first.status).toBeDefined();
      expect(first.department).toBeDefined();
    });

    it('should initialize with default filter state', () => {
      const filter = service.filterState();
      expect(filter.status).toBe('all');
      expect(filter.department).toBe('all');
      expect(filter.searchTerm).toBe('');
      expect(filter.minAmount).toBe(0);
      expect(filter.timeRange).toBe('24h');
    });
  });

  describe('Reactive Filtering & Computed Signals', () => {
    it('should filter transactions by status', () => {
      service.updateFilter({ status: 'completed' });
      const filtered = service.filteredTransactions();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(tx => tx.status === 'completed')).toBe(true);

      service.updateFilter({ status: 'flagged' });
      const flagged = service.filteredTransactions();
      expect(flagged.every(tx => tx.status === 'flagged')).toBe(true);
    });

    it('should filter transactions by minimum amount', () => {
      const minVal = 5000;
      service.updateFilter({ minAmount: minVal });
      const filtered = service.filteredTransactions();
      expect(filtered.every(tx => tx.amount >= minVal)).toBe(true);
    });

    it('should filter transactions by department', () => {
      service.updateFilter({ department: 'Engineering' });
      const filtered = service.filteredTransactions();
      expect(filtered.every(tx => tx.department === 'Engineering')).toBe(true);
    });

    it('should search transactions by service name or ID', () => {
      const firstId = service.transactions()[0].id;
      service.updateFilter({ searchTerm: firstId.substring(0, 5) });
      const filtered = service.filteredTransactions();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(tx => tx.id.includes(firstId.substring(0, 5)))).toBe(true);
    });

    it('should reset filters to default state', () => {
      service.updateFilter({ status: 'flagged', minAmount: 10000, searchTerm: 'Alpha' });
      service.resetFilter();
      const filter = service.filterState();
      expect(filter.status).toBe('all');
      expect(filter.minAmount).toBe(0);
      expect(filter.searchTerm).toBe('');
      expect(service.filteredTransactions().length).toBe(service.transactions().length);
    });
  });

  describe('Computed Aggregation Analytics', () => {
    it('should calculate accurate aggregation summary over transactions', () => {
      const agg = service.aggregation();
      expect(agg.totalTransactions).toBe(service.filteredTransactions().length);
      expect(agg.totalVolume).toBeGreaterThan(0);
      expect(agg.averageLatencyMs).toBeGreaterThan(0);
      expect(agg.anomalyRatePercent).toBeGreaterThanOrEqual(0);
      expect(agg.statusCounts.completed + agg.statusCounts.pending + agg.statusCounts.flagged).toBe(agg.totalTransactions);
    });

    it('should recompute aggregation reactively when filter updates', () => {
      const initialTotal = service.aggregation().totalTransactions;
      service.updateFilter({ status: 'flagged' });
      const filteredTotal = service.aggregation().totalTransactions;
      expect(filteredTotal).toBeLessThanOrEqual(initialTotal);
      expect(service.aggregation().statusCounts.completed).toBe(0);
    });
  });

  describe('WebMCP Tool Execution Handlers', () => {
    it('should query metrics by category or timeRange', () => {
      const perfMetrics = service.queryMetrics({ category: 'performance' });
      expect(perfMetrics.length).toBeGreaterThan(0);
      expect(perfMetrics.every(m => m.category === 'performance')).toBe(true);

      const allMetrics = service.queryMetrics({});
      expect(allMetrics.length).toBe(service.metrics().length);
    });

    it('should calculate KPI summary for requested metric IDs', () => {
      const summary = service.calculateKpiSummary(['revenue_ytd', 'system_latency']);
      expect(summary.length).toBe(2);
      expect(summary[0].metricId).toBe('revenue_ytd');
      expect(summary[0].currentValue).toBeGreaterThan(0);
      expect(summary[1].metricId).toBe('system_latency');
    });

    it('should trigger and record export audit reports', () => {
      const report = service.triggerExport('csv', 'Status: all, Dept: Engineering');
      expect(report.exportId).toBeDefined();
      expect(report.format).toBe('csv');
      expect(report.recordCount).toBe(service.filteredTransactions().length);
      expect(report.checksum).toMatch(/^sha256-[a-f0-9]{8}$/);
      expect(report.downloadUrl).toContain('blob:');

      const auditLog = service.exportAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
      expect(auditLog[0].exportId).toBe(report.exportId);
    });
  });

  describe('Multi-Domain Inventory Signals & Catalog Seeding', () => {
    it('should initialize with a 16-SKU catalog across 4 distinct domains', () => {
      const inventory = service.inventory();
      expect(inventory.length).toBeGreaterThanOrEqual(16);

      const domains = ['retail', 'hardware', 'logistics', 'pharma'] as const;
      for (const d of domains) {
        const domainItems = inventory.filter((item) => item.domain === d);
        expect(domainItems.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('should initialize with default inventory filter state', () => {
      const filter = service.inventoryFilter();
      expect(filter.domain).toBe('all');
      expect(filter.status).toBe('all');
      expect(filter.searchTerm).toBe('');
      expect(filter.lowStockOnly).toBe(false);
    });

    it('should initialize with empty reorder audit log', () => {
      expect(service.reorderLog()).toEqual([]);
    });
  });

  describe('Reactive Inventory Filtering & Computed Signals', () => {
    it('should filter inventory by business domain', () => {
      service.updateInventoryFilter({ domain: 'pharma' });
      const filtered = service.filteredInventory();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((item) => item.domain === 'pharma')).toBe(true);

      service.updateInventoryFilter({ domain: 'hardware' });
      const hwFiltered = service.filteredInventory();
      expect(hwFiltered.every((item) => item.domain === 'hardware')).toBe(true);
    });

    it('should filter inventory by stock status', () => {
      service.updateInventoryFilter({ status: 'low_stock' });
      const filtered = service.filteredInventory();
      expect(filtered.every((item) => item.status === 'low_stock')).toBe(true);
    });

    it('should filter inventory by lowStockOnly flag', () => {
      service.updateInventoryFilter({ lowStockOnly: true });
      const filtered = service.filteredInventory();
      expect(filtered.every((item) => item.stockLevel <= item.minThreshold || item.status === 'low_stock' || item.status === 'out_of_stock')).toBe(true);
    });

    it('should search inventory by SKU, name, or location', () => {
      const firstItem = service.inventory()[0];
      service.updateInventoryFilter({ searchTerm: firstItem.sku });
      const filtered = service.filteredInventory();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((item) => item.sku === firstItem.sku)).toBe(true);
    });

    it('should reset inventory filters to defaults', () => {
      service.updateInventoryFilter({ domain: 'retail', status: 'out_of_stock', searchTerm: 'ABC', lowStockOnly: true });
      service.resetInventoryFilter();
      const filter = service.inventoryFilter();
      expect(filter.domain).toBe('all');
      expect(filter.status).toBe('all');
      expect(filter.searchTerm).toBe('');
      expect(filter.lowStockOnly).toBe(false);
      expect(service.filteredInventory().length).toBe(service.inventory().length);
    });

    it('should query inventory without mutating active signal filter state', () => {
      const initialFilter = service.inventoryFilter();
      const queried = service.queryInventory({ domain: 'logistics', lowStockOnly: false });
      expect(queried.length).toBeGreaterThan(0);
      expect(queried.every((item) => item.domain === 'logistics')).toBe(true);
      expect(service.inventoryFilter()).toEqual(initialFilter);
    });
  });

  describe('Stock Level Mutations & Threshold Guards', () => {
    it('should adjust stock level and automatically transition in_stock to low_stock', () => {
      const target = service.inventory().find((i) => i.stockLevel > i.minThreshold)!;
      const initialStock = target.stockLevel;
      const reduction = -(initialStock - (target.minThreshold - 1));

      const res = service.updateStockLevel(target.sku, reduction, 'High Demand Spike');
      expect(res.success).toBe(true);
      expect(res.newStock).toBe(target.minThreshold - 1);
      expect(res.item?.status).toBe('low_stock');
    });

    it('should clamp negative stock level at zero and set status to out_of_stock', () => {
      const target = service.inventory()[0];
      const res = service.updateStockLevel(target.sku, -999999, 'Warehouse Depletion');
      expect(res.success).toBe(true);
      expect(res.newStock).toBe(0);
      expect(res.item?.status).toBe('out_of_stock');
    });

    it('should transition status back to in_stock when restocked above minThreshold', () => {
      const target = service.inventory()[0];
      service.updateStockLevel(target.sku, -999999);
      expect(service.inventory().find((i) => i.sku === target.sku)?.status).toBe('out_of_stock');

      const restockRes = service.updateStockLevel(target.sku, target.minThreshold + 50, 'Supplier Delivery');
      expect(restockRes.success).toBe(true);
      expect(restockRes.item?.status).toBe('in_stock');
      expect(restockRes.newStock).toBe(target.minThreshold + 50);
    });

    it('should return error when updating non-existent SKU', () => {
      const res = service.updateStockLevel('NON-EXISTENT-SKU-999', 10);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('Autonomous Reorder Pipeline', () => {
    it('should generate a valid reorder receipt and record it in reorderLog', () => {
      const target = service.inventory()[0];
      const res = service.reorderItem(target.sku, 50, 'expedited');

      expect(res.success).toBe(true);
      expect(res.receipt).toBeDefined();
      expect(res.receipt?.sku).toBe(target.sku);
      expect(res.receipt?.quantity).toBe(50);
      expect(res.receipt?.priority).toBe('expedited');
      expect(res.receipt?.totalCost).toBeGreaterThan(0);
      expect(res.receipt?.supplier.name).toBe(target.supplier.name);

      const logs = service.reorderLog();
      expect(logs.length).toBe(1);
      expect(logs[0].reorderId).toBe(res.receipt!.reorderId);
    });

    it('should update item status to reordered when placed', () => {
      const target = service.inventory()[0];
      service.updateStockLevel(target.sku, -999999); // make out_of_stock
      const res = service.reorderItem(target.sku, 100, 'critical');

      expect(res.success).toBe(true);
      const updatedItem = service.inventory().find((i) => i.sku === target.sku);
      expect(updatedItem?.status).toBe('reordered');
    });

    it('should reject reorders with zero or negative quantities or invalid SKU', () => {
      const target = service.inventory()[0];
      const resZero = service.reorderItem(target.sku, 0);
      expect(resZero.success).toBe(false);

      const resInvalid = service.reorderItem('UNKNOWN-SKU-000', 10);
      expect(resInvalid.success).toBe(false);
    });
  });

  describe('Multi-Domain Scorecard Aggregations & Health Scores', () => {
    it('should calculate domain summaries with accurate valuation and health scores', () => {
      const summaries = service.domainSummaries();
      expect(summaries.length).toBe(4);

      const domainNames = ['retail', 'hardware', 'logistics', 'pharma'];
      for (const d of domainNames) {
        const summary = summaries.find((s) => s.domain === d);
        expect(summary).toBeDefined();
        expect(summary!.totalSkus).toBeGreaterThanOrEqual(4);
        expect(summary!.totalValuation).toBeGreaterThan(0);
        expect(summary!.healthScore).toBeGreaterThanOrEqual(0);
        expect(summary!.healthScore).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate total inventory valuation across all domains', () => {
      const totalVal = service.totalInventoryValuation();
      expect(totalVal).toBeGreaterThan(0);
    });

    it('should identify low stock alerts reactively', () => {
      const alerts = service.lowStockAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should query specific domain summary using getDomainSummary()', () => {
      const pharmaSummary = service.getDomainSummary('pharma') as any;
      expect(pharmaSummary.domain).toBe('pharma');
      expect(pharmaSummary.totalSkus).toBeGreaterThanOrEqual(4);

      const allSummaries = service.getDomainSummary('all') as any[];
      expect(allSummaries.length).toBe(4);
    });
  });
});
