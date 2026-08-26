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
    it('should register all 4 enterprise analytics tools on ngOnInit', () => {
      const tools = webmcp.getTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('query_enterprise_metrics');
      expect(toolNames).toContain('filter_business_data');
      expect(toolNames).toContain('calculate_kpi_summary');
      expect(toolNames).toContain('trigger_analytics_export');
    });

    it('should provide complete JSON Schema definitions for enterprise tools', () => {
      const queryTool = webmcp.getTools().find((t) => t.name === 'query_enterprise_metrics');
      expect(queryTool).toBeDefined();
      expect(queryTool?.description).toContain('enterprise');
      expect(queryTool?.parameters.properties?.['category']).toBeDefined();

      const filterTool = webmcp.getTools().find((t) => t.name === 'filter_business_data');
      expect(filterTool).toBeDefined();
      expect(filterTool?.parameters.properties?.['status']).toBeDefined();
    });

    it('should cleanly unregister the 4 tools on ngOnDestroy', () => {
      component.ngOnDestroy();
      const tools = webmcp.getTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).not.toContain('query_enterprise_metrics');
      expect(toolNames).not.toContain('filter_business_data');
      expect(toolNames).not.toContain('calculate_kpi_summary');
      expect(toolNames).not.toContain('trigger_analytics_export');
    });
  });

  describe('WebMCP Tool Execution Handlers', () => {
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
  });

  describe('UI Signals & Component Helpers', () => {
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
  });
});
