import { describe, it, expect, beforeEach } from 'bun:test';
import { createCalculateKpiSummaryTool } from './calculate-kpi-summary.tool';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import { SupplyChainAdapter } from '../adapters/supply-chain.adapter';
import { FinancialRiskAdapter } from '../adapters/financial-risk.adapter';

describe('WebMCP Tool: calculate_kpi_summary', () => {
  let registry: BiToolRegistry;
  let stateService: EnterpriseBiStateService;
  let toolDef: ReturnType<typeof createCalculateKpiSummaryTool>;

  beforeEach(async () => {
    registry = new BiToolRegistry([new SupplyChainAdapter(), new FinancialRiskAdapter()]);
    stateService = new EnterpriseBiStateService(registry);
    await stateService.initialize();
    toolDef = createCalculateKpiSummaryTool(stateService, registry);
  });

  it('should expose valid calculate_kpi_summary tool definition', () => {
    expect(toolDef.name).toBe('calculate_kpi_summary');
    expect(toolDef.parameters.properties['domain']).toBeDefined();
    expect(toolDef.parameters.properties['department']).toBeDefined();
  });

  it('should calculate KPI metrics for active domain with clamped healthScore [0, 100]', async () => {
    const result = (await toolDef.handler({})) as any;

    expect(result.success).toBe(true);
    expect(result.summary.domain).toBe('supply_chain');
    expect(result.summary.totalRecords).toBeGreaterThan(0);
    expect(result.summary.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.summary.healthScore).toBeLessThanOrEqual(100);
    expect(result.summary.keyMetrics['otifRatePercent']).toBeDefined();
  });

  it('should calculate KPI metrics for financial_risk domain when domain parameter is passed', async () => {
    const result = (await toolDef.handler({ domain: 'financial_risk' })) as any;

    expect(result.success).toBe(true);
    expect(result.summary.domain).toBe('financial_risk');
    expect(result.summary.keyMetrics['fraudDetectionRatePercent']).toBeDefined();
  });

  it('should handle empty filtered dataset without zero-division runtime errors', async () => {
    stateService.setFilterCriteria({ department: 'NonexistentDept' });
    const result = (await toolDef.handler({})) as any;

    expect(result.success).toBe(true);
    expect(result.summary.totalRecords).toBe(0);
    expect(result.summary.totalVolume).toBe(0);
    expect(result.summary.healthScore).toBe(100);
  });
});
