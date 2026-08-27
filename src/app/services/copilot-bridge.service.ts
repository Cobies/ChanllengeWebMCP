import { Injectable, inject, signal, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WebMcpService, WebMcpToolDefinition } from '@webmcp/angular';
import {
  BridgeModel,
  ModelsResponse,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  OpenAiFunctionTool,
  ToolExecutionMeta,
} from './copilot-bridge.types';

export const BRIDGE_API_BASE = 'https://bridge.cobiesscooby.com/v1';

export const DEFAULT_FALLBACK_MODELS: BridgeModel[] = [
  { id: 'gemini-3.7-flash-high', object: 'model', owned_by: 'google' },
  { id: 'gemini-2.5-flash', object: 'model', owned_by: 'google' },
  { id: 'gemini-2.5-pro', object: 'model', owned_by: 'google' },
];

export const MAX_TOOL_TURNS = 5;

@Injectable({
  providedIn: 'root',
})
export class CopilotBridgeService {
  private readonly http: HttpClient;
  private readonly webmcp: WebMcpService;

  readonly selectedModel = signal<string>('gemini-3.7-flash-high');
  readonly availableModels = signal<BridgeModel[]>(DEFAULT_FALLBACK_MODELS);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isGenerating = signal<boolean>(false);
  readonly activeToolExecution = signal<ToolExecutionMeta | null>(null);

  // Drawer UI visibility signals
  readonly isOpen = signal<boolean>(false);
  readonly isMinimized = signal<boolean>(false);

  constructor(
    @Optional() http?: HttpClient,
    @Optional() webmcp?: WebMcpService
  ) {
    this.http = http ?? inject(HttpClient);
    this.webmcp = webmcp ?? inject(WebMcpService);
  }


  /**
   * Discovers available models from CPAMC Bridge Proxy, falling back safely on error.
   */
  async fetchModels(): Promise<BridgeModel[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ModelsResponse>(`${BRIDGE_API_BASE}/models`)
      );
      if (response && Array.isArray(response.data) && response.data.length > 0) {
        this.availableModels.set(response.data);
        return response.data;
      }
      this.availableModels.set(DEFAULT_FALLBACK_MODELS);
      return DEFAULT_FALLBACK_MODELS;
    } catch (error) {
      console.warn('[CopilotBridge] Failed to load models from proxy, using fallback models.', error);
      this.availableModels.set(DEFAULT_FALLBACK_MODELS);
      return DEFAULT_FALLBACK_MODELS;
    }
  }

  selectModel(modelId: string): void {
    this.selectedModel.set(modelId);
  }

  /**
   * Converts all registered WebMCP browser tools into OpenAI Function Calling format.
   */
  getOpenAiTools(): OpenAiFunctionTool[] {
    const webmcpTools: WebMcpToolDefinition[] = this.webmcp.getTools();
    return webmcpTools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || `Execute ${tool.name} tool`,
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
   * Dispatches a user message and triggers the autonomous recursive tool-calling loop.
   */
  async sendMessage(content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed || this.isGenerating()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    this.messages.update((prev) => [...prev, userMessage]);
    this.isGenerating.set(true);

    try {
      await this.runAutonomousTurn(1);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.messages.update((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Math.random().toString(36).substring(2, 9),
          role: 'assistant',
          content: `⚠️ Bridge Proxy Error: ${errorMsg}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      this.isGenerating.set(false);
      this.activeToolExecution.set(null);
    }
  }

  /**
   * Recursive execution runner supporting multi-turn tool calling with safety recursion cap.
   */
  private async runAutonomousTurn(turn: number): Promise<void> {
    if (turn > MAX_TOOL_TURNS) {
      this.messages.update((prev) => [
        ...prev,
        {
          id: 'msg-limit-' + Math.random().toString(36).substring(2, 9),
          role: 'assistant',
          content: '⚠️ Maximum autonomous tool recursion limit (5) reached. Halting tool execution cycle.',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const openAiTools = this.getOpenAiTools();

    // Sanitize context for OpenAI Chat Completions API
    const sanitizedHistory = this.messages().map((m) => {
      const payload: {
        role: 'system' | 'user' | 'assistant' | 'tool';
        content?: string | null;
        name?: string;
        tool_call_id?: string;
        tool_calls?: any[];
      } = {
        role: m.role,
        content: m.content !== undefined ? m.content : null,
      };

      if (m.tool_call_id) {
        payload.tool_call_id = m.tool_call_id;
      }
      if (m.name) {
        payload.name = m.name;
      }
      if (m.tool_calls && m.tool_calls.length > 0) {
        payload.tool_calls = m.tool_calls;
      }

      return payload;
    });

    const requestPayload: ChatCompletionRequest = {
      model: this.selectedModel(),
      messages: sanitizedHistory,
      tools: openAiTools.length > 0 ? openAiTools : undefined,
      temperature: 0.2,
    };

    const response = await firstValueFrom(
      this.http.post<ChatCompletionResponse>(
        `${BRIDGE_API_BASE}/chat/completions`,
        requestPayload
      )
    );

    const choice = response?.choices?.[0];
    if (!choice) {
      throw new Error('Empty response received from Bridge Proxy');
    }

    const message = choice.message;
    const toolCalls = message?.tool_calls;

    // Case 1: Model finished with text response
    if (choice.finish_reason === 'stop' || !toolCalls || toolCalls.length === 0) {
      if (message?.content) {
        this.messages.update((prev) => [
          ...prev,
          {
            id: 'msg-' + Math.random().toString(36).substring(2, 9),
            role: 'assistant',
            content: message.content,
            timestamp: Date.now(),
          },
        ]);
      }
      return;
    }

    // Case 2: Model triggered one or more tool_calls
    this.messages.update((prev) => [
      ...prev,
      {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: message.content || null,
        tool_calls: toolCalls,
        timestamp: Date.now(),
      },
    ]);

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let parsedArgs: Record<string, unknown> = {};
      let parseError: string | null = null;

      try {
        parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
      } catch (err: unknown) {
        parseError = 'Malformed JSON payload in arguments';
      }

      if (parseError) {
        this.messages.update((prev) => [
          ...prev,
          {
            id: 'msg-' + Math.random().toString(36).substring(2, 9),
            role: 'tool',
            name: toolName,
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: parseError }),
            toolExecution: {
              toolName,
              params: {},
              status: 'error',
              errorMessage: parseError,
            },
            timestamp: Date.now(),
          },
        ]);
        continue;
      }

      // Execute tool through WebMcpService
      const startTime = performance.now();
      this.activeToolExecution.set({
        toolName,
        params: parsedArgs,
        status: 'running',
      });

      try {
        const rawResult = (await this.webmcp.executeTool(
          toolName,
          parsedArgs,
          'ui'
        )) as any;
        const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

        let imageUrl: string | undefined = undefined;
        let compactResult = rawResult;

        // Multimodal handling: extract image for UI preview & sanitize payload for LLM context
        if (toolName === 'take_screenshot' && rawResult?.image) {
          imageUrl = rawResult.image;
          compactResult = {
            success: rawResult.success ?? true,
            mimeType: rawResult.mimeType || 'image/png',
            dimensions: rawResult.dimensions || { width: 800, height: 600 },
            timestamp: rawResult.timestamp || Date.now(),
            note: 'Screenshot captured and rendered in UI preview card.',
          };
        }

        const toolMsg: ChatMessage = {
          id: 'msg-' + Math.random().toString(36).substring(2, 9),
          role: 'tool',
          name: toolName,
          tool_call_id: toolCall.id,
          content: JSON.stringify(compactResult),
          imageUrl,
          toolExecution: {
            toolName,
            params: parsedArgs,
            result: compactResult,
            durationMs,
            status: 'success',
          },
          timestamp: Date.now(),
          execution_time_ms: durationMs,
        };

        this.messages.update((prev) => [...prev, toolMsg]);
      } catch (err: unknown) {
        const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
        const errorMessage = err instanceof Error ? err.message : String(err);

        const toolMsg: ChatMessage = {
          id: 'msg-' + Math.random().toString(36).substring(2, 9),
          role: 'tool',
          name: toolName,
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: false, error: errorMessage }),
          toolExecution: {
            toolName,
            params: parsedArgs,
            durationMs,
            status: 'error',
            errorMessage,
          },
          timestamp: Date.now(),
          execution_time_ms: durationMs,
        };

        this.messages.update((prev) => [...prev, toolMsg]);
      } finally {
        this.activeToolExecution.set(null);
      }
    }

    // Recursively continue next turn
    await this.runAutonomousTurn(turn + 1);
  }

  // Drawer state management helpers
  toggleDrawer(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.isMinimized.set(false);
    }
  }

  openDrawer(): void {
    this.isOpen.set(true);
    this.isMinimized.set(false);
  }

  closeDrawer(): void {
    this.isOpen.set(false);
  }

  toggleMinimize(): void {
    this.isMinimized.update((v) => !v);
  }

  clearHistory(): void {
    this.messages.set([]);
    this.isGenerating.set(false);
    this.activeToolExecution.set(null);
  }
}
