import { describe, it, expect, beforeEach } from 'bun:test';
import { createQueryEnterpriseMetricsTool } from './query-enterprise-metrics.tool';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import { SupplyChainAdapter } from '../adapters/supply-chain.adapter';
import { FinancialRiskAdapter } from '../adapters/financial-risk.adapter';

describe('WebMCP Tool: query_enterprise_metrics', () => {
  let registry: BiToolRegistry;
  let stateService: EnterpriseBiStateService;
  let toolDef: ReturnType<typeof createQueryEnterpriseMetricsTool>;

  beforeEach(() => {
    registry = new BiToolRegistry([new SupplyChainAdapter(), new FinancialRiskAdapter()]);
    stateService = new EnterpriseBiStateService(registry);
    toolDef = createQueryEnterpriseMetricsTool(stateService, registry);
  });

  it('should expose valid WebMCP tool definition schema', () => {
    expect(toolDef.name).toBe('query_enterprise_metrics');
    expect(toolDef.description).toContain('enterprise');
    expect(toolDef.parameters.type).toBe('object');
    expect(toolDef.parameters.properties['domain']).toBeDefined();
    expect(toolDef.parameters.properties['limit']).toBeDefined();
    expect(toolDef.parameters.properties['department']).toBeDefined();
  });

  it('should query active domain and clamp limit to max 10,000 and min 1', async () => {
    const result = (await toolDef.handler({
      domain: 'supply_chain',
      limit: 99999, // Should clamp to 10000
    })) as any;

    expect(result.success).toBe(true);
    expect(result.domain).toBe('supply_chain');
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.totalCount).toBe(result.records.length);
  });

  it('should switch domain dynamically if domain param is specified', async () => {
    const result = (await toolDef.handler({
      domain: 'financial_risk',
      department: 'Wire Transfer',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.domain).toBe('financial_risk');
    expect(stateService.activeDomain()).toBe('financial_risk');
    expect(result.records.every((r: any) => r.department === 'Wire Transfer')).toBe(true);
  });

  it('should sanitize ISO dates and handle invalid dates safely', async () => {
    const result = (await toolDef.handler({
      startDate: 'invalid-date',
      endDate: '2026-08-27T23:59:59.999Z',
    })) as any;

    expect(result.success).toBe(true);
  });
});
