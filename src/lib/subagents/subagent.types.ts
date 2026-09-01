import { InjectionToken, Signal, DestroyRef } from '@angular/core';
import { WebMcpToolDefinition } from '../core/webmcp.types';

/**
 * Execution and lifecycle status of a SubAgent instance.
 */
export type SubAgentStatus = 'idle' | 'running' | 'completed' | 'error' | 'destroyed';

/**
 * Single tool filter rule matching either exact name, regular expression pattern,
 * or a dynamic predicate function against WebMcpToolDefinition.
 */
export type SubAgentToolFilterRule =
  | string
  | RegExp
  | ((tool: WebMcpToolDefinition) => boolean);

/**
 * Structured filter group with allowlist, denylist, and predicate logic.
 */
export interface SubAgentToolFilterGroup {
  allow?: (string | RegExp)[];
  deny?: (string | RegExp)[];
  predicate?: (tool: WebMcpToolDefinition) => boolean;
}

/**
 * Expressive tool filter contract supporting single rules and structured groups.
 */
export type SubAgentToolFilter =
  | string
  | RegExp
  | ((tool: WebMcpToolDefinition) => boolean)
  | SubAgentToolFilterGroup;

/**
 * Task request dispatched to a SubAgent instance.
 */
export interface SubAgentTask<TParams = Record<string, unknown>> {
  objective: string;
  parameters?: TParams;
  contextHint?: string;
  maxTurns?: number;
}

/**
 * Structured receipt/result returned after SubAgent task completion or failure.
 */
export interface SubAgentResult<TData = unknown> {
  subagentId: string;
  objective: string;
  status: 'success' | 'failed';
  summary: string;
  data?: TData;
  toolsUsed: string[];
  totalTurns: number;
  durationMs: number;
  tokenUsageEstimate?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/**
 * Isolated execution context provided to SubAgent execution handlers.
 */
export interface SubAgentExecutionContext {
  subagentId: string;
  availableTools: WebMcpToolDefinition[];
  executeTool: <T = unknown>(name: string, params?: Record<string, unknown>) => Promise<T>;
  signalState?: () => Record<string, unknown>;
}

/**
 * Execution handler signature for SubAgents (IoC pluggable execution).
 */
export type SubAgentExecutionHandler<
  TParams = Record<string, unknown>,
  TData = unknown
> = (
  task: SubAgentTask<TParams>,
  context: SubAgentExecutionContext
) => Promise<SubAgentResult<TData>>;

/**
 * Inversion-of-Control token for providing global default subagent execution handler.
 */
export const SUBAGENT_EXECUTION_HANDLER = new InjectionToken<SubAgentExecutionHandler>(
  'SUBAGENT_EXECUTION_HANDLER'
);

/**
 * Declarative configuration for creating a SubAgent.
 */
export interface SubAgentConfig<
  TParams = Record<string, unknown>,
  TData = unknown
> {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  toolFilters?: SubAgentToolFilter[];
  localTools?: WebMcpToolDefinition[];
  preferredModel?: string;
  maxTurns?: number;
  handler?: SubAgentExecutionHandler<TParams, TData>;
}

/**
 * Reactive SubAgent instance with fine-grained Angular Signals state.
 */
export interface SubAgentInstance<
  TParams = Record<string, unknown>,
  TData = unknown
> {
  readonly config: SubAgentConfig<TParams, TData>;
  readonly status: Signal<SubAgentStatus>;
  readonly activeTask: Signal<SubAgentTask<TParams> | null>;
  readonly history: Signal<SubAgentResult<TData>[]>;
  execute(task: SubAgentTask<TParams>): Promise<SubAgentResult<TData>>;
  destroy(): void;
}

/**
 * Optional dependency overrides for createSubAgent.
 */
export interface CreateSubAgentOptions<
  TParams = Record<string, unknown>,
  TData = unknown
> {
  destroyRef?: DestroyRef;
  registry?: any; // SubAgentRegistryService resolved via DI or passed explicitly
  webmcp?: any; // WebMcpService resolved via DI or passed explicitly
  handler?: SubAgentExecutionHandler<TParams, TData>;
}

/**
 * Configuration options for orchestrator dynamic delegation tool synthesis.
 */
export interface DelegationToolOptions {
  name?: string;
  description?: string;
}
