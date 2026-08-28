import { describe, it, expect, beforeEach } from 'bun:test';
import { createFilterBusinessDataTool } from './filter-business-data.tool';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import { SupplyChainAdapter } from '../adapters/supply-chain.adapter';

describe('WebMCP Tool: filter_business_data', () => {
  let registry: BiToolRegistry;
  let stateService: EnterpriseBiStateService;
  let toolDef: ReturnType<typeof createFilterBusinessDataTool>;

  beforeEach(async () => {
    registry = new BiToolRegistry([new SupplyChainAdapter()]);
    stateService = new EnterpriseBiStateService(registry);
    await stateService.initialize();
    toolDef = createFilterBusinessDataTool(stateService, registry);
  });

  it('should expose valid filter_business_data tool schema', () => {
    expect(toolDef.name).toBe('filter_business_data');
    expect(toolDef.parameters.properties['department']).toBeDefined();
    expect(toolDef.parameters.properties['status']).toBeDefined();
    expect(toolDef.parameters.properties['searchTerm']).toBeDefined();
    expect(toolDef.parameters.properties['minAmount']).toBeDefined();
  });

  it('should filter reactive state records and return structured response', async () => {
    const result = (await toolDef.handler({
      department: 'Logistics',
      status: 'delivered',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.domain).toBe('supply_chain');
    expect(result.matchCount).toBeGreaterThan(0);
    expect(result.records.every((r: any) => r.department === 'Logistics' && r.status === 'delivered')).toBe(true);
    expect(stateService.filteredRecords().length).toBe(result.matchCount);
  });

  it('should handle payload capping (< 4KB preview truncation if payload exceeds 100 items)', async () => {
    const result = (await toolDef.handler({
      maxPayloadRecords: 2,
    })) as any;

    expect(result.success).toBe(true);
    expect(result.records.length).toBeLessThanOrEqual(2);
    expect(result.matchCount).toBeGreaterThanOrEqual(result.records.length);
  });
});
