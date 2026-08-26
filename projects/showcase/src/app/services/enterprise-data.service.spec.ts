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
});
