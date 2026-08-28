import type { WebMcpToolDefinition } from '@webmcp/angular';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import type { BiQueryParams, BiQueryResult } from '../bi.types';

export function createQueryEnterpriseMetricsTool(
  stateService: EnterpriseBiStateService,
  registry: BiToolRegistry
): WebMcpToolDefinition {
  return {
    name: 'query_enterprise_metrics',
    description:
      'Query raw and structured enterprise metrics, financial risk records, supply chain telemetry, or cloud FinOps assets with optional domain dispatch and date/department filtering.',
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
          description: 'Filter by specific department, segment, or cost center.',
        },
        status: {
          type: 'string',
          description: 'Filter by lifecycle or record status.',
        },
        startDate: {
          type: 'string',
          description: 'UTC ISO 8601 start timestamp.',
        },
        endDate: {
          type: 'string',
          description: 'UTC ISO 8601 end timestamp.',
        },
        limit: {
          type: 'number',
          description: 'Maximum records to retrieve (clamped between 1 and 10,000).',
        },
      },
    },
    handler: async (params: Record<string, any> = {}): Promise<BiQueryResult> => {
      // 1. Resolve and switch domain if specified
      if (params['domain'] && registry.hasAdapter(params['domain'])) {
        if (stateService.activeDomain() !== params['domain']) {
          await stateService.setActiveDomain(params['domain']);
        }
      }

      const activeDomain = stateService.activeDomain();
      const adapter = registry.getAdapter(activeDomain) || registry.getDefaultAdapter();

      if (!adapter) {
        throw new Error(`No domain adapter found for domain: ${activeDomain}`);
      }

      // 2. Clamp limit to max 10000 and min 1
      let limit: number | undefined = undefined;
      if (typeof params['limit'] === 'number') {
        limit = Math.max(1, Math.min(10000, Math.floor(params['limit'])));
      }

      // 3. Sanitize ISO dates
      let startDate: string | undefined = undefined;
      if (params['startDate'] && typeof params['startDate'] === 'string') {
        const d = new Date(params['startDate']);
        if (!isNaN(d.getTime())) {
          startDate = d.toISOString();
        }
      }

      let endDate: string | undefined = undefined;
      if (params['endDate'] && typeof params['endDate'] === 'string') {
        const d = new Date(params['endDate']);
        if (!isNaN(d.getTime())) {
          endDate = d.toISOString();
        }
      }

      const queryParams: BiQueryParams = {
        department: params['department'],
        status: params['status'],
        startDate,
        endDate,
        limit,
      };

      const records = await stateService.executeQuery(queryParams);

      return {
        success: true,
        domain: activeDomain,
        totalCount: records.length,
        records,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
