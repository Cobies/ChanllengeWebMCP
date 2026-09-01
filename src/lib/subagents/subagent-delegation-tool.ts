import { WebMcpToolDefinition, WebMcpToolParameterSchema } from '../core/webmcp.types';
import { SubAgentRegistryService } from './subagent-registry.service';
import { DelegationToolOptions, SubAgentResult } from './subagent.types';

/**
 * Default delegation tool name identifier.
 */
export const DELEGATE_TO_SUBAGENT_TOOL_NAME = 'delegate_to_subagent';

/**
 * Parameters contract for dynamic subagent delegation.
 */
export interface SubAgentDelegationParams {
  target_subagent: string;
  objective: string;
  parameters?: Record<string, unknown>;
  context_hint?: string;
  [key: string]: unknown;
}

/**
 * Dynamic OpenAI Function Tool definition synthesis for delegating tasks
 * from parent orchestrator to registered subagents.
 *
 * The tool parameters schema reactively reflects registered subagent IDs in `target_subagent.enum`.
 */
export function getDelegationToolDefinition(
  registry: SubAgentRegistryService,
  options?: DelegationToolOptions
): WebMcpToolDefinition<SubAgentDelegationParams, SubAgentResult> {
  const toolName = options?.name ?? DELEGATE_TO_SUBAGENT_TOOL_NAME;
  const defaultDesc =
    options?.description ??
    'Delegate a specialized sub-task to an active specialist subagent. Subagents execute in isolated multi-turn loops with scoped tools and return an executive summary.';

  return {
    name: toolName,
    get description(): string {
      const activeAgents = registry.subagents();
      if (activeAgents.length === 0) {
        return defaultDesc;
      }
      const agentsSummary = activeAgents
        .map((a) => `- "${a.config.id}" (${a.config.name}): ${a.config.description}`)
        .join('\n');
      return `${defaultDesc}\n\nAvailable Specialist Subagents:\n${agentsSummary}`;
    },
    get parameters(): WebMcpToolParameterSchema {
      const subagentIds = registry.subagents().map((a) => a.config.id);
      return {
        type: 'object',
        properties: {
          target_subagent: {
            type: 'string',
            description:
              'The identifier of the specialist subagent to delegate the task to.',
            enum: subagentIds,
          },
          objective: {
            type: 'string',
            description:
              'Clear, actionable prompt and detailed instruction of what the subagent should accomplish.',
          },
          parameters: {
            type: 'object',
            description:
              'Optional dictionary of parameters, inputs, or configurations for the subagent.',
            properties: {},
          },
          context_hint: {
            type: 'string',
            description:
              'Optional background context, prior conversation snippet, or relevant tool outputs.',
          },
        },
        required: ['target_subagent', 'objective'],
      };
    },
    handler: async (params: {
      target_subagent: string;
      objective: string;
      parameters?: Record<string, unknown>;
      context_hint?: string;
    }): Promise<SubAgentResult> => {
      if (!params || typeof params !== 'object') {
        throw new Error('Invalid delegation arguments: payload must be an object.');
      }
      const { target_subagent, objective, parameters: taskParams, context_hint } = params;
      if (!target_subagent || typeof target_subagent !== 'string') {
        throw new Error('Delegation failed: target_subagent is required and must be a string.');
      }
      if (!objective || typeof objective !== 'string') {
        throw new Error('Delegation failed: objective is required and must be a string.');
      }

      return registry.execute(target_subagent, {
        objective,
        parameters: taskParams,
        contextHint: context_hint,
      });
    },
  };
}

/**
 * Alias for getDelegationToolDefinition.
 */
export const createDelegationTool = getDelegationToolDefinition;
