import type { WebMcpToolDefinition } from '@webmcp/angular';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import type { BiKpiSummary } from '../bi.types';

export function createCalculateKpiSummaryTool(
  stateService: EnterpriseBiStateService,
  registry: BiToolRegistry
): WebMcpToolDefinition {
  return {
    name: 'calculate_kpi_summary',
    description:
      'Compute real-time composite KPI metrics, health scores, financial volumes, anomaly rates, and status distributions across the active or specified domain records.',
    parameters: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description:
            'Target business domain identifier (supply_chain, financial_risk, customer_retention, cloud_finops). Defaults to active domain.',
        },
        department: {
          type: 'string',
          description: 'Filter calculations by specific department before KPI aggregation.',
        },
        status: {
          type: 'string',
          description: 'Filter calculations by status before aggregation.',
        },
      },
    },
    handler: async (params: Record<string, any> = {}) => {
      // 1. Domain switch if requested
      if (params['domain'] && registry.hasAdapter(params['domain'])) {
        if (stateService.activeDomain() !== params['domain']) {
          await stateService.setActiveDomain(params['domain']);
        }
      }

      if (params['department'] || params['status']) {
        stateService.setFilterCriteria({
          department: params['department'],
          status: params['status'],
        });
      }

      const activeDomain = stateService.activeDomain();
      const adapter = registry.getAdapter(activeDomain) || registry.getDefaultAdapter();

      if (!adapter) {
        throw new Error(`No domain adapter found for domain: ${activeDomain}`);
      }

      const records = stateService.filteredRecords();
      const summary: BiKpiSummary = await Promise.resolve(adapter.calculateKpiSummary(records));

      // Guard healthScore boundaries
      summary.healthScore = Math.max(0, Math.min(100, Math.round(summary.healthScore)));

      return {
        success: true,
        domain: activeDomain,
        summary,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
