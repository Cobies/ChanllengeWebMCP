import type { WebMcpToolDefinition } from '@webmcp/angular';
import { BiToolRegistry } from '../registry';
import { EnterpriseBiStateService } from '../enterprise-bi-state.service';
import type { BiFilterCriteria } from '../bi.types';

export function createFilterBusinessDataTool(
  stateService: EnterpriseBiStateService,
  registry: BiToolRegistry
): WebMcpToolDefinition {
  return {
    name: 'filter_business_data',
    description:
      'Apply dynamic predicate filtering across active enterprise domain records (by department, status, search term, date ranges, and min/max thresholds) with reactive state updates.',
    parameters: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Optional business domain identifier.',
        },
        department: {
          type: 'string',
          description: 'Department, segment, or cost center to filter.',
        },
        status: {
          type: 'string',
          description: 'Status filter (e.g., delivered, flagged, active, completed).',
        },
        searchTerm: {
          type: 'string',
          description: 'Fuzzy keyword query across names, IDs, SKUs, or services.',
        },
        minAmount: {
          type: 'number',
          description: 'Minimum cost / volume / amount threshold.',
        },
        maxAmount: {
          type: 'number',
          description: 'Maximum cost / volume / amount threshold.',
        },
        startDate: {
          type: 'string',
          description: 'ISO 8601 start date timestamp.',
        },
        endDate: {
          type: 'string',
          description: 'ISO 8601 end date timestamp.',
        },
        maxPayloadRecords: {
          type: 'number',
          description: 'Limit output array length for token management (default: 50).',
        },
      },
    },
    handler: async (params: Record<string, any> = {}) => {
      // 1. Switch domain if requested
      if (params['domain'] && registry.hasAdapter(params['domain'])) {
        if (stateService.activeDomain() !== params['domain']) {
          await stateService.setActiveDomain(params['domain']);
        }
      }

      const criteria: Partial<BiFilterCriteria> = {
        department: params['department'],
        status: params['status'],
        searchTerm: params['searchTerm'],
        minAmount: typeof params['minAmount'] === 'number' ? params['minAmount'] : undefined,
        maxAmount: typeof params['maxAmount'] === 'number' ? params['maxAmount'] : undefined,
        startDate: params['startDate'],
        endDate: params['endDate'],
      };

      stateService.setFilterCriteria(criteria);

      const filtered = stateService.filteredRecords();
      const matchCount = filtered.length;

      const maxPayload = typeof params['maxPayloadRecords'] === 'number' ? Math.max(1, params['maxPayloadRecords']) : 50;
      const returnedRecords = filtered.slice(0, maxPayload);

      return {
        success: true,
        domain: stateService.activeDomain(),
        matchCount,
        records: returnedRecords,
        isTruncated: matchCount > maxPayload,
        activeCriteria: criteria,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
