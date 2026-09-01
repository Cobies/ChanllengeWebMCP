/**
 * WebMCP Subagent & Hierarchical Orchestrator-Worker Contracts.
 * Facilitates isolated worker contexts, domain-specific prompt engineering,
 * and token-efficient execution receipts.
 */

export type SubAgentType = '3d-specialist' | 'analytics-specialist' | 'audit-specialist' | 'custom';

export interface SubAgentTaskRequest {
  agentType: SubAgentType;
  objective: string;
  parameters?: Record<string, unknown>;
  contextHint?: string;
  modelOverride?: string;
  maxTurns?: number;
}

export interface SubAgentExecutionReceipt {
  agentType: SubAgentType;
  objective: string;
  status: 'success' | 'failed';
  summary: string;
  resultData?: unknown;
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

export interface SubAgentProfile {
  type: SubAgentType;
  name: string;
  description: string;
  systemPrompt: string;
  toolFilters: Array<string | RegExp>;
  preferredModel?: string;
  maxTurns?: number;
}
