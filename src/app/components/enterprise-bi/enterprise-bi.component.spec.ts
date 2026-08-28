import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { EnterpriseBiComponent } from './enterprise-bi.component';
import { WebMcpService } from '@webmcp/angular';
import { EnterpriseDataService } from '../../services/enterprise-data.service';

describe('EnterpriseBiComponent (WebMCP Tools & Reactive Dashboard)', () => {
  let component: EnterpriseBiComponent;
  let webmcp: WebMcpService;
  let dataService: EnterpriseDataService;

  beforeEach(() => {
    webmcp = new WebMcpService();
    dataService = new EnterpriseDataService();
    component = new EnterpriseBiComponent(webmcp, dataService);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('WebMCP Tool Lifecycle Registration (ngOnInit & ngOnDestroy)', () => {
    it('should register all 9 enterprise and inventory tools on ngOnInit', () => {
      const tools = webmcp.getTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames.length).toBe(9);
      expect(toolNames).toContain('query_enterprise_metrics');
      expect(toolNames).toContain('filter_business_data');
      expect(toolNames).toContain('calculate_kpi_summary');
      expect(toolNames).toContain('trigger_analytics_export');
      expect(toolNames).toContain('query_inventory');
      expect(toolNames).toContain('update_inventory_stock');
      expect(toolNames).toContain('reorder_inventory_item');
      expect(toolNames).toContain('filter_inventory_by_domain');
      expect(toolNames).toContain('get_business_domain_summary');
    });

    it('should provide complete JSON Schema definitions for enterprise & inventory tools', () => {
      const queryTool = webmcp.getTools().find((t) => t.name === 'query_enterprise_metrics');
      expect(queryTool).toBeDefined();
      expect(queryTool?.description).toContain('enterprise');
      expect(queryTool?.parameters.properties?.['category']).toBeDefined();

      const filterTool = webmcp.getTools().find((t) => t.name === 'filter_business_data');
      expect(filterTool).toBeDefined();
      expect(filterTool?.parameters.properties?.['status']).toBeDefined();

      const invQueryTool = webmcp.getTools().find((t) => t.name === 'query_inventory');
      expect(invQueryTool).toBeDefined();
      expect(invQueryTool?.parameters.properties?.['domain']).toBeDefined();

      const stockTool = webmcp.getTools().find((t) => t.name === 'update_inventory_stock');
      expect(stockTool).toBeDefined();
      expect(stockTool?.parameters.required).toContain('sku');
      expect(stockTool?.parameters.required).toContain('delta');

      const reorderTool = webmcp.getTools().find((t) => t.name === 'reorder_inventory_item');
      expect(reorderTool).toBeDefined();
      expect(reorderTool?.parameters.required).toContain('sku');
      expect(reorderTool?.parameters.required).toContain('quantity');

      const domainFilterTool = webmcp.getTools().find((t) => t.name === 'filter_inventory_by_domain');
      expect(domainFilterTool).toBeDefined();
      expect(domainFilterTool?.parameters.properties?.['domain']).toBeDefined();

      const domainSummaryTool = webmcp.getTools().find((t) => t.name === 'get_business_domain_summary');
      expect(domainSummaryTool).toBeDefined();
    });

    it('should cleanly unregister all 9 tools on ngOnDestroy', () => {
      component.ngOnDestroy();
      const tools = webmcp.getTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).not.toContain('query_enterprise_metrics');
      expect(toolNames).not.toContain('filter_business_data');
      expect(toolNames).not.toContain('calculate_kpi_summary');
      expect(toolNames).not.toContain('trigger_analytics_export');
      expect(toolNames).not.toContain('query_inventory');
      expect(toolNames).not.toContain('update_inventory_stock');
      expect(toolNames).not.toContain('reorder_inventory_item');
      expect(toolNames).not.toContain('filter_inventory_by_domain');
      expect(toolNames).not.toContain('get_business_domain_summary');
    });

    it('should prevent memory leaks and duplicate registrations during rapid route mounting/unmounting', () => {
      for (let i = 0; i < 5; i++) {
        const c = new EnterpriseBiComponent(webmcp, dataService);
        c.ngOnInit();
        expect(webmcp.getTools().length).toBe(9);
        c.ngOnDestroy();
        expect(webmcp.getTools().length).toBe(0);
      }
    });

    it('should support dynamic domain switcher via EnterpriseBiStateService', async () => {
      expect(component.biState).toBeDefined();
      expect(component.biRegistry).toBeDefined();

      await component.switchBiDomain('financial_risk');
      expect(component.biState.activeDomain()).toBe('financial_risk');
      expect(component.biState.records().length).toBeGreaterThan(0);
    });
  });

  describe('WebMCP Tool Execution Handlers (BI & Inventory)', () => {
    it('should execute query_enterprise_metrics with category filter', async () => {
      const result = await webmcp.executeTool('query_enterprise_metrics', {
        category: 'financial',
      }) as any;

      expect(result.success).toBe(true);
      expect(result.metrics.length).toBeGreaterThan(0);
      expect(result.metrics[0].category).toBe('financial');
    });

    it('should execute filter_business_data and update reactive state', async () => {
      const result = await webmcp.executeTool('filter_business_data', {
        status: 'flagged',
        minAmount: 1000,
      }) as any;

      expect(result.success).toBe(true);
      expect(result.matchedCount).toBeGreaterThanOrEqual(0);
      expect(dataService.filterState().status).toBe('flagged');
      expect(dataService.filterState().minAmount).toBe(1000);
    });

    it('should execute calculate_kpi_summary and return aggregation summary', async () => {
      const result = await webmcp.executeTool('calculate_kpi_summary', {
        metrics: ['revenue_ytd', 'active_nodes'],
      }) as any;

      expect(result.success).toBe(true);
      expect(result.summary.length).toBe(2);
      expect(result.aggregation).toBeDefined();
      expect(result.aggregation.totalTransactions).toBeGreaterThan(0);
    });

    it('should execute trigger_analytics_export and return audit report', async () => {
      const result = await webmcp.executeTool('trigger_analytics_export', {
        format: 'json',
        filterSummary: 'Autonomous Security Sweep',
      }) as any;

      expect(result.success).toBe(true);
      expect(result.export).toBeDefined();
      expect(result.export.format).toBe('json');
      expect(result.export.filterSummary).toBe('Autonomous Security Sweep');
      expect(result.export.checksum).toBeDefined();
    });

    it('should execute query_inventory tool and return matching inventory items', async () => {
      const result = await webmcp.executeTool('query_inventory', {
        domain: 'pharma',
      }) as any;

      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every((i: any) => i.domain === 'pharma')).toBe(true);
    });

    it('should execute update_inventory_stock tool and modify stock levels', async () => {
      const first = dataService.inventory()[0];
      const initialStock = first.stockLevel;

      const result = await webmcp.executeTool('update_inventory_stock', {
        sku: first.sku,
        delta: 20,
        reason: 'Restocking batch',
      }) as any;

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(initialStock + 20);
      expect(component.lastActionResult()).toContain(first.sku);
    });

    it('should execute reorder_inventory_item tool and create order receipt', async () => {
      const target = dataService.inventory().find((i) => i.domain === 'hardware')!;

      const result = await webmcp.executeTool('reorder_inventory_item', {
        sku: target.sku,
        quantity: 25,
        priority: 'critical',
      }) as any;

      expect(result.success).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.receipt.sku).toBe(target.sku);
      expect(result.receipt.priority).toBe('critical');
    });

    it('should execute filter_inventory_by_domain tool and activate inventory sub-tab', async () => {
      const result = await webmcp.executeTool('filter_inventory_by_domain', {
        domain: 'hardware',
        status: 'all',
      }) as any;

      expect(result.success).toBe(true);
      expect(dataService.inventoryFilter().domain).toBe('hardware');
      expect(component.activeTab()).toBe('inventory');
    });

    it('should execute get_business_domain_summary tool and return scorecard', async () => {
      const result = await webmcp.executeTool('get_business_domain_summary', {
        domain: 'pharma',
      }) as any;

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.domain).toBe('pharma');
    });
  });

  describe('UI Sub-Navigation & Component Helpers', () => {
    it('should initialize activeTab to analytics and switch between tabs', () => {
      expect(component.activeTab()).toBe('analytics');

      component.setActiveTab('transactions');
      expect(component.activeTab()).toBe('transactions');

      component.setActiveTab('inventory');
      expect(component.activeTab()).toBe('inventory');
    });

    it('should format currency amounts accurately', () => {
      expect(component.formatCurrency(14820000)).toBe('$14,820,000');
      expect(component.formatCurrency(14250.5)).toBe('$14,250.50');
    });

    it('should format timestamps cleanly', () => {
      const formatted = component.formatTime('2026-08-26T17:15:00Z');
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should select department and status filters interactively', () => {
      component.setStatusFilter('pending');
      expect(dataService.filterState().status).toBe('pending');

      component.setDepartmentFilter('Engineering');
      expect(dataService.filterState().department).toBe('Engineering');
    });

    it('should update inventory domain and status filters interactively', () => {
      component.setDomainFilter('logistics');
      expect(dataService.inventoryFilter().domain).toBe('logistics');

      component.setInventoryStatusFilter('low_stock');
      expect(dataService.inventoryFilter().status).toBe('low_stock');

      component.toggleLowStockOnly();
      expect(dataService.inventoryFilter().lowStockOnly).toBe(true);
    });

    it('should resolve CSS badge classes for inventory statuses and domains', () => {
      expect(component.getInventoryStatusBadgeClass('in_stock')).toContain('emerald');
      expect(component.getInventoryStatusBadgeClass('low_stock')).toContain('amber');
      expect(component.getInventoryStatusBadgeClass('out_of_stock')).toContain('rose');
      expect(component.getInventoryStatusBadgeClass('reordered')).toContain('purple');

      expect(component.getDomainBadgeClass('retail')).toContain('blue');
      expect(component.getDomainBadgeClass('hardware')).toContain('amber');
      expect(component.getDomainBadgeClass('logistics')).toContain('indigo');
      expect(component.getDomainBadgeClass('pharma')).toContain('emerald');
    });

    it('should calculate accurate stock capacity percentage', () => {
      const item = dataService.inventory()[0];
      const pct = component.calculateStockPercentage(item);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });

    it('should perform quick stock adjustment via component helper', () => {
      const item = dataService.inventory()[0];
      const initialStock = item.stockLevel;

      component.quickAdjustStock(item.sku, 5);
      const updated = dataService.inventory().find((i) => i.sku === item.sku);
      expect(updated?.stockLevel).toBe(initialStock + 5);
    });

    it('should trigger quick reorder via component helper', () => {
      const item = dataService.inventory()[0];
      component.quickReorder(item.sku, 20);
      expect(dataService.reorderLog().length).toBe(1);
    });
  });
});
