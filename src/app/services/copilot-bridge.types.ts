/**
 * CPAMC Copilot Chat Bridge & OpenAI Protocol Data Contracts.
 * Conforms to Gemini 3.7 Flash High bridge schema & OpenAI Function Calling standards.
 */

export interface BridgeModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  data: BridgeModel[];
}

export interface OpenAiFunctionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
}

export interface ToolCallPayload {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolExecutionMeta {
  toolName: string;
  params: Record<string, unknown>;
  result?: unknown;
  durationMs?: number;
  status: 'running' | 'success' | 'error';
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCallPayload[];
  imageUrl?: string;
  toolExecution?: ToolExecutionMeta;
  timestamp: number;
  execution_time_ms?: number;
  thinking?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string | null;
    name?: string;
    tool_call_id?: string;
    tool_calls?: ToolCallPayload[];
  }>;
  tools?: OpenAiFunctionTool[];
  temperature?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content?: string | null;
      tool_calls?: ToolCallPayload[];
      reasoning_content?: string;
    };
    finish_reason: 'stop' | 'tool_calls' | 'length' | string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PromptChip {
  label: string;
  icon: string;
  prompt: string;
  category?: string;
}
