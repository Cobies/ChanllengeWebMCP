import type { WebMcpToolDefinition } from '@webmcp/angular';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import type { BiExportFormat, BiExportResult } from '../bi.types';

function sanitizeOutputString(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '');
}

export function createTriggerAnalyticsExportTool(
  stateService: EnterpriseBiStateService,
  registry: BiToolRegistry
): WebMcpToolDefinition {
  return {
    name: 'trigger_analytics_export',
    description:
      'Generate sanitized CSV, JSON, or PDF data export artifacts for enterprise analytics and audit compliance with cryptographic checksum verification.',
    parameters: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description:
            'Target business domain identifier (supply_chain, financial_risk, customer_retention, cloud_finops). Defaults to active domain.',
        },
        format: {
          type: 'string',
          enum: ['json', 'csv', 'pdf'],
          description: 'Desired export file format (default: json).',
        },
      },
    },
    handler: async (params: Record<string, any> = {}): Promise<BiExportResult> => {
      // 1. Domain switch if requested
      if (params['domain'] && registry.hasAdapter(params['domain'])) {
        if (stateService.activeDomain() !== params['domain']) {
          await stateService.setActiveDomain(params['domain']);
        }
      }

      const rawFormat = (params['format'] || 'json').toString().toLowerCase();
      const format: BiExportFormat =
        rawFormat === 'csv' || rawFormat === 'pdf' ? rawFormat : 'json';

      const activeDomain = stateService.activeDomain();
      const adapter = registry.getAdapter(activeDomain) || registry.getDefaultAdapter();

      if (!adapter) {
        throw new Error(`No domain adapter found for domain: ${activeDomain}`);
      }

      const records = stateService.filteredRecords();
      const result: BiExportResult = await Promise.resolve(
        adapter.formatExportData(records, format)
      );

      // Apply XSS sanitization to the export payload
      result.data = sanitizeOutputString(result.data);

      return result;
    },
  };
}
