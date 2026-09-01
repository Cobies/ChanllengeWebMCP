import { Injectable, inject, signal, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  WebMcpService,
  WebMcpToolDefinition,
  SubAgentRegistryService,
  SubAgentConfig,
  createSubAgent,
  filterToolsForSubAgent,
  SubAgentResult,
  SubAgentTask,
} from '@cobies/webmcp-angular';
import {
  SubAgentType,
  SubAgentTaskRequest,
  SubAgentExecutionReceipt,
  SubAgentProfile,
} from './subagent.types';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  OpenAiFunctionTool,
} from './copilot-bridge.types';

export const SUBAGENT_API_BASE = 'https://bridge.cobiesscooby.com/v1';

export const BUILTIN_SUBAGENT_PROFILES: Record<Exclude<SubAgentType, 'custom'>, SubAgentProfile> = {
  '3d-specialist': {
    type: '3d-specialist',
    name: '3D Scene & CAD Specialist',
    description: 'Expert in Three.js visualizer, mesh manipulation, lighting, camera controls, CAD actions, and 3D studio operations.',
    systemPrompt: `You are the 3D Scene Specialist Subagent in the WebMCP Angular Showcase.
Your mission is to perform detailed 3D spatial operations, inspections, transformations, and visualizer adjustments.
DIRECTIVES:
1. Execute the necessary 3D tools to fulfill the user's objective.
2. If multiple actions are needed (e.g. adjust camera, change material, isolate mesh), call them sequentially.
3. Once completed, provide a concise summary report explaining what spatial changes and meshes were modified.
4. Keep intermediate calculations internal; return only the high-level summary and status.`,
    toolFilters: [
      /^scene_3d_/,
      /^cad_/,
      /^studio_/,
      'take_screenshot',
      'inspect_3d_mesh',
      'transform_3d_object',
    ],
    preferredModel: 'gemini-2.5-flash',
    maxTurns: 4,
  },
  'analytics-specialist': {
    type: 'analytics-specialist',
    name: 'Enterprise BI Analytics Specialist',
    description: 'Expert in multi-domain business intelligence, KPI calculations, metric querying, financial risk, and telemetry aggregation.',
    systemPrompt: `You are the Enterprise BI Analytics Specialist Subagent in the WebMCP Angular Showcase.
Your mission is to query business datasets, calculate KPIs, filter data, and diagnose anomalies.
DIRECTIVES:
1. Execute query and calculation tools to retrieve business metrics across FinOps, Retention, Supply Chain, and Risk domains.
2. Analyze and aggregate raw records internally.
3. DO NOT return massive JSON data dumps to the parent orchestrator.
4. Return an executive summary with key metrics, top items, trends, and risk indicators.`,
    toolFilters: [
      'query_enterprise_metrics',
      'calculate_kpi_summary',
      'filter_business_data',
      'trigger_analytics_export',
      /^bi_/,
    ],
    preferredModel: 'gemini-2.5-flash',
    maxTurns: 4,
  },
  'audit-specialist': {
    type: 'audit-specialist',
    name: 'System Inspector & Audit Specialist',
    description: 'Expert in WebMCP tool execution logs, DOM telemetry, contract verification, and error triage.',
    systemPrompt: `You are the System Inspector & Audit Specialist Subagent in the WebMCP Angular Showcase.
Your mission is to audit tool executions, verify DOM states, analyze failure logs, and perform diagnostic checks.
DIRECTIVES:
1. Query execution history and active tools.
2. Trace errors or latency bottlenecks.
3. Return a structured diagnosis report with status, root causes, and verification results.`,
    toolFilters: [
      'get_execution_logs',
      'inspect_tools',
      'navigate_to_view',
      /^audit_/,
      /^inspect_/,
    ],
    preferredModel: 'gemini-2.5-flash',
    maxTurns: 4,
  },
};

@Injectable({
  providedIn: 'root',
})
export class SubAgentRunnerService {
  private readonly http: HttpClient;
  private readonly webmcp: WebMcpService;
  readonly registry: SubAgentRegistryService;

  readonly activeSubagents = signal<SubAgentTaskRequest[]>([]);
  readonly executionHistory = signal<SubAgentExecutionReceipt[]>([]);

  constructor(
    @Optional() http?: HttpClient,
    @Optional() webmcp?: WebMcpService,
    @Optional() registry?: SubAgentRegistryService
  ) {
    this.http = http ?? inject(HttpClient);
    this.webmcp = webmcp ?? inject(WebMcpService);
    this.registry = registry ?? inject(SubAgentRegistryService);

    this.initBuiltinSubagents();
  }

  /**
   * Registers the built-in specialist profiles into the SubAgentRegistryService.
   */
  private initBuiltinSubagents(): void {
    const builtinKeys: Array<Exclude<SubAgentType, 'custom'>> = [
      '3d-specialist',
      'analytics-specialist',
      'audit-specialist',
    ];

    for (const key of builtinKeys) {
      if (this.registry.get(key)) {
        continue;
      }
      const profile = BUILTIN_SUBAGENT_PROFILES[key];
      createSubAgent(
        {
          id: profile.type,
          name: profile.name,
          description: profile.description,
          systemPrompt: profile.systemPrompt,
          toolFilters: profile.toolFilters,
          preferredModel: profile.preferredModel,
          maxTurns: profile.maxTurns,
          handler: async (task: SubAgentTask, _context) => {
            const receipt = await this.executeTask({
              agentType: profile.type,
              objective: task.objective,
              parameters: task.parameters as Record<string, unknown> | undefined,
              contextHint: task.contextHint,
              maxTurns: task.maxTurns ?? profile.maxTurns,
            });

            const result: SubAgentResult = {
              subagentId: receipt.agentType,
              objective: receipt.objective,
              status: receipt.status,
              summary: receipt.summary,
              data: receipt.resultData,
              toolsUsed: receipt.toolsUsed,
              totalTurns: receipt.totalTurns,
              durationMs: receipt.durationMs,
              tokenUsageEstimate: receipt.tokenUsageEstimate,
              error: receipt.error,
            };

            return result;
          },
        },
        {
          registry: this.registry,
          webmcp: this.webmcp,
        }
      );
    }
  }

  /**
   * Resolves the profile definition for a given subagent type.
   */
  getProfile(agentType: SubAgentType): SubAgentProfile {
    if (agentType === 'custom' || !BUILTIN_SUBAGENT_PROFILES[agentType as keyof typeof BUILTIN_SUBAGENT_PROFILES]) {
      return {
        type: 'custom',
        name: 'Custom Domain Worker',
        description: 'Generic isolated worker agent',
        systemPrompt: 'You are a specialized worker subagent. Execute the necessary tools to achieve the objective and return a concise summary.',
        toolFilters: [/.*/],
        preferredModel: 'gemini-2.5-flash',
        maxTurns: 4,
      };
    }
    return BUILTIN_SUBAGENT_PROFILES[agentType as keyof typeof BUILTIN_SUBAGENT_PROFILES];
  }

  /**
   * Filters all registered WebMCP tools based on the subagent's whitelist.
   */
  getFilteredTools(profile: SubAgentProfile): OpenAiFunctionTool[] {
    const allTools: WebMcpToolDefinition[] = this.webmcp.getTools();
    const filtered = filterToolsForSubAgent(allTools, profile.toolFilters);

    return filtered.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || `Execute ${tool.name}`,
        parameters: {
          type: 'object',
          properties: (tool.parameters?.properties || {}) as Record<string, unknown>,
          required: tool.parameters?.required || [],
          additionalProperties: tool.parameters?.additionalProperties ?? false,
        },
      },
    }));
  }

  /**
   * Executes a task in an isolated ephemeral subagent context, returning only the summary receipt.
   */
  async executeTask(request: SubAgentTaskRequest): Promise<SubAgentExecutionReceipt> {
    const startTime = performance.now();
    const profile = this.getProfile(request.agentType);
    const maxTurns = request.maxTurns ?? profile.maxTurns ?? 4;
    const model = request.modelOverride ?? profile.preferredModel ?? 'gemini-2.5-flash';
    const tools = this.getFilteredTools(profile);

    const toolsUsedSet = new Set<string>();
    let totalTurns = 0;
    let accumulatedPromptTokens = 0;
    let accumulatedCompletionTokens = 0;

    // Ephemeral isolated context
    const ephemeralMessages: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content?: string | null;
      name?: string;
      tool_call_id?: string;
      tool_calls?: any[];
    }> = [
      {
        role: 'system',
        content: profile.systemPrompt,
      },
      {
        role: 'user',
        content: `Objective: ${request.objective}${
          request.contextHint ? `\nContext: ${request.contextHint}` : ''
        }${
          request.parameters
            ? `\nParameters: ${JSON.stringify(request.parameters)}`
            : ''
        }`,
      },
    ];

    this.activeSubagents.update((prev) => [...prev, request]);

    try {
      let finalSummary = '';
      let lastResultData: unknown = undefined;

      while (totalTurns < maxTurns) {
        totalTurns++;

        const requestPayload: ChatCompletionRequest = {
          model,
          messages: ephemeralMessages as any,
          tools: tools.length > 0 ? tools : undefined,
          temperature: 0.1,
        };

        const response = await firstValueFrom(
          this.http.post<ChatCompletionResponse>(
            `${SUBAGENT_API_BASE}/chat/completions`,
            requestPayload
          )
        );

        if (response?.usage) {
          accumulatedPromptTokens += response.usage.prompt_tokens || 0;
          accumulatedCompletionTokens += response.usage.completion_tokens || 0;
        }

        const choice = response?.choices?.[0];
        if (!choice) {
          throw new Error('Empty response from subagent model');
        }

        const message = choice.message;
        const toolCalls = message?.tool_calls;

        // If subagent completed with a final response
        if (choice.finish_reason === 'stop' || !toolCalls || toolCalls.length === 0) {
          finalSummary = (message?.content || '').replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, '').trim();
          break;
        }

        // Subagent issued tool calls
        ephemeralMessages.push({
          role: 'assistant',
          content: message.content ?? null,
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          toolsUsedSet.add(toolName);
          let parsedArgs: Record<string, unknown> = {};

          try {
            parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            parsedArgs = {};
          }

          let toolResult: unknown;
          try {
            toolResult = await this.webmcp.executeTool(toolName, parsedArgs, 'emulator');
            lastResultData = toolResult;
          } catch (err: unknown) {
            toolResult = { error: err instanceof Error ? err.message : String(err) };
          }

          ephemeralMessages.push({
            role: 'tool',
            name: toolName,
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      if (!finalSummary) {
        finalSummary = `Completed task across ${totalTurns} steps using tools: ${Array.from(toolsUsedSet).join(', ') || 'none'}.`;
      }

      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
      const receipt: SubAgentExecutionReceipt = {
        agentType: request.agentType,
        objective: request.objective,
        status: 'success',
        summary: finalSummary,
        resultData: lastResultData,
        toolsUsed: Array.from(toolsUsedSet),
        totalTurns,
        durationMs,
        tokenUsageEstimate: {
          promptTokens: accumulatedPromptTokens,
          completionTokens: accumulatedCompletionTokens,
          totalTokens: accumulatedPromptTokens + accumulatedCompletionTokens,
        },
      };

      this.executionHistory.update((prev) => [receipt, ...prev]);
      return receipt;
    } catch (error: unknown) {
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const receipt: SubAgentExecutionReceipt = {
        agentType: request.agentType,
        objective: request.objective,
        status: 'failed',
        summary: `Subagent failed: ${errorMessage}`,
        toolsUsed: Array.from(toolsUsedSet),
        totalTurns,
        durationMs,
        error: errorMessage,
      };

      this.executionHistory.update((prev) => [receipt, ...prev]);
      return receipt;
    } finally {
      this.activeSubagents.update((prev) => prev.filter((r) => r !== request));
    }
  }
}
