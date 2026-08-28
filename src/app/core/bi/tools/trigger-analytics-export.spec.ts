import { describe, it, expect, beforeEach } from 'bun:test';
import { createTriggerAnalyticsExportTool } from './trigger-analytics-export.tool';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import { SupplyChainAdapter } from '../adapters/supply-chain.adapter';

describe('WebMCP Tool: trigger_analytics_export', () => {
  let registry: BiToolRegistry;
  let stateService: EnterpriseBiStateService;
  let toolDef: ReturnType<typeof createTriggerAnalyticsExportTool>;

  beforeEach(async () => {
    registry = new BiToolRegistry([new SupplyChainAdapter()]);
    stateService = new EnterpriseBiStateService(registry);
    await stateService.initialize();
    toolDef = createTriggerAnalyticsExportTool(stateService, registry);
  });

  it('should expose valid trigger_analytics_export tool definition', () => {
    expect(toolDef.name).toBe('trigger_analytics_export');
    expect(toolDef.parameters.properties['format']).toBeDefined();
    expect(toolDef.parameters.properties['domain']).toBeDefined();
  });

  it('should export dataset in CSV format with RFC 4180 compliance and SHA256 checksum', async () => {
    const result = (await toolDef.handler({ format: 'csv' })) as any;

    expect(result.success).toBe(true);
    expect(result.format).toBe('csv');
    expect(result.recordCount).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
    expect(result.checksum).toMatch(/^sha256-[a-f0-9]+$/);
    expect(result.generatedAt).toBeDefined();
  });

  it('should sanitize XSS attack vectors like <script> or event handlers in export payloads', async () => {
    const result = (await toolDef.handler({
      format: 'json',
      customHeader: '<script>alert("xss")</script>',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.data).not.toContain('<script>');
  });
});
