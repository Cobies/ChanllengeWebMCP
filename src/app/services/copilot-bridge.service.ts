import { Injectable, inject, signal, Optional, InjectionToken, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  WebMcpService,
  WebMcpToolDefinition,
  WebMcpMemoryService,
  SubAgentRegistryService,
  createDelegationTool,
  getDelegationToolDefinition,
  DELEGATE_TO_SUBAGENT_TOOL_NAME,
  SubAgentResult,
} from '@cobies/webmcp-angular';
import {
  BridgeModel,
  ModelsResponse,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  OpenAiFunctionTool,
  ToolExecutionMeta,
} from './copilot-bridge.types';
export * from './copilot-bridge.tokens';
import {
  DEFAULT_COPILOT_API_BASE,
  COPILOT_API_BASE,
  BRIDGE_API_BASE,
} from './copilot-bridge.tokens';
import { SidebarModuleRegistryService } from './sidebar-module-registry.service';
import { SubAgentRunnerService } from './subagent-runner.service';
import { SubAgentType, SubAgentExecutionReceipt } from './subagent.types';

export const DEFAULT_FALLBACK_MODELS: BridgeModel[] = [
  { id: 'gemini-3.7-flash-high', object: 'model', owned_by: 'google' },
  { id: 'gemini-2.5-flash', object: 'model', owned_by: 'google' },
  { id: 'gemini-2.5-pro', object: 'model', owned_by: 'google' },
];

export const MAX_TOOL_TURNS = 5;

export const DELEGATE_TO_SPECIALIST_TOOL: OpenAiFunctionTool = {
  type: 'function',
  function: {
    name: 'delegate_to_specialist',
    description: 'Delegates complex, multi-step domain analysis or spatial operations to an isolated specialist subagent (3D, BI, or System Audit). Keeps parent context clean and returns an executive receipt.',
    parameters: {
      type: 'object',
      properties: {
        specialist: {
          type: 'string',
          enum: ['3d-specialist', 'analytics-specialist', 'audit-specialist'],
          description: 'The specialized subagent best suited for the task',
        },
        taskObjective: {
          type: 'string',
          description: 'The detailed objective or instructions for the subagent to execute',
        },
        parameters: {
          type: 'object',
          description: 'Optional structured parameters or filter criteria to pass to the subagent',
        },
      },
      required: ['specialist', 'taskObjective'],
      additionalProperties: false,
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class CopilotBridgeService {
  private readonly http: HttpClient;
  private readonly webmcp: WebMcpService;
  private readonly registry?: SidebarModuleRegistryService;
  private readonly subagentRunner?: SubAgentRunnerService;
  private readonly subagentRegistry?: SubAgentRegistryService;
  private readonly memoryService?: WebMcpMemoryService;
  private readonly apiBase: string;

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
    @Optional() webmcp?: WebMcpService,
    @Optional() registry?: SidebarModuleRegistryService,
    @Optional() subagentRunner?: SubAgentRunnerService,
    @Optional() subagentRegistry?: SubAgentRegistryService,
    @Optional() memoryService?: WebMcpMemoryService,
    @Optional() @Inject(COPILOT_API_BASE) apiBase?: string
  ) {
    if (http) {
      this.http = http;
    } else {
      try {
        this.http = inject(HttpClient);
      } catch {
        this.http = undefined as any;
      }
    }

    if (apiBase) {
      this.apiBase = apiBase;
    } else {
      try {
        this.apiBase = inject(COPILOT_API_BASE, { optional: true }) ?? DEFAULT_COPILOT_API_BASE;
      } catch {
        this.apiBase = DEFAULT_COPILOT_API_BASE;
      }
    }

    if (webmcp) {
      this.webmcp = webmcp;
    } else {
      try {
        this.webmcp = inject(WebMcpService);
      } catch {
        this.webmcp = undefined as any;
      }
    }

    if (registry) {
      this.registry = registry;
    } else {
      try {
        this.registry = inject(SidebarModuleRegistryService, { optional: true }) ?? undefined;
      } catch {
        this.registry = undefined;
      }
    }

    if (subagentRunner) {
      this.subagentRunner = subagentRunner;
    } else {
      try {
        this.subagentRunner = inject(SubAgentRunnerService, { optional: true }) ?? undefined;
      } catch {
        this.subagentRunner = undefined;
      }
    }

    if (subagentRegistry) {
      this.subagentRegistry = subagentRegistry;
    } else if (this.subagentRunner?.registry) {
      this.subagentRegistry = this.subagentRunner.registry;
    } else {
      try {
        this.subagentRegistry = inject(SubAgentRegistryService, { optional: true }) ?? undefined;
      } catch {
        this.subagentRegistry = undefined;
      }
    }

    if (memoryService) {
      this.memoryService = memoryService;
    } else {
      try {
        this.memoryService = inject(WebMcpMemoryService, { optional: true }) ?? undefined;
      } catch {
        this.memoryService = undefined;
      }
    }
  }


  /**
   * Discovers available models from CPAMC Bridge Proxy, falling back safely on error.
   */
  async fetchModels(): Promise<BridgeModel[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ModelsResponse>(`${this.apiBase}/models`)
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
   * Prepends dynamic subagent delegation tool when subagents are registered.
   */
  getOpenAiTools(): OpenAiFunctionTool[] {
    const webmcpTools: WebMcpToolDefinition[] = this.webmcp.getTools();
    const tools: OpenAiFunctionTool[] = webmcpTools.map((tool) => ({
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

    const activeRegistry = this.subagentRegistry ?? this.subagentRunner?.registry;
    if (activeRegistry && activeRegistry.subagents().length > 0) {
      const delegationDef = activeRegistry.createDelegationTool();
      tools.unshift({
        type: 'function',
        function: {
          name: delegationDef.name,
          description: delegationDef.description,
          parameters: {
            type: 'object',
            properties: (delegationDef.parameters?.properties || {}) as Record<string, unknown>,
            required: delegationDef.parameters?.required || [],
            additionalProperties: delegationDef.parameters?.additionalProperties ?? false,
          },
        },
      });
    } else if (this.subagentRunner) {
      tools.unshift(DELEGATE_TO_SPECIALIST_TOOL);
    }

    return tools;
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
   * Constructs the dynamic contextual system prompt embedding current workspace view, active tools, views catalog, and operational directives.
   */
  buildDynamicSystemPrompt(): string {
    const activeView = this.registry?.activeView();
    const activeRoute = this.registry?.activeRoute() || '/3d-showroom';
    const activeTools = this.webmcp.getTools().map((t) => t.name);
    const views = this.registry?.views() || [];

    const activeToolsList = activeTools.length > 0 ? activeTools.join(', ') : 'none';
    const currentViewTitle = activeView?.title || '3D Digital Twin';
    const currentViewId = activeView?.id || 'view-3d-showroom';
    const currentViewRoute = activeView?.route || activeRoute;

    let catalogTable = '| View | Route | Tools |\n|---|---|---|\n';
    for (const v of views) {
      if (!v.route && !v.tools?.length) continue;
      const toolList = (v.tools || []).join(', ') || 'none';
      catalogTable += `| ${v.id} | ${v.route || 'N/A'} | ${toolList} |\n`;
    }

    const activeRegistry = this.subagentRegistry ?? this.subagentRunner?.registry;
    const registeredSubagents = activeRegistry?.subagents().map((a) => a.config.id) || [
      '3d-specialist',
      'analytics-specialist',
      'audit-specialist',
    ];
    const subagentsList = registeredSubagents.length > 0 ? registeredSubagents.join(', ') : 'none';

    let memoryBlock = '';
    let memoryDirective = '';

    if (this.memoryService && this.memoryService.isReady()) {
      const pinned = this.memoryService.pinnedMemories();
      const allMemories = this.memoryService.memories();
      const relevantMemories = pinned.length > 0 ? pinned : allMemories.slice(0, 5);

      if (relevantMemories.length > 0) {
        const memoryList = relevantMemories
          .map((m) => `- [${m.category.toUpperCase()}] ${m.topic}: ${m.content}`)
          .join('\n');
        memoryBlock = `\n\n### ACTIVE AGENT MEMORY & PINNED RULES:\n${memoryList}`;
      }

      memoryDirective = `\n5. MEMORY & PROACTIVE RECALL: You have persistent memory tools available (mem_save, mem_pin, mem_search, mem_context). When the user states preferences, domain constraints, or key rules, proactively call \`mem_save\` or \`mem_pin\` to persist them. Search memory via \`mem_search\` when answering queries about past decisions.`;
    }

    return `You are AI Copilot, an autonomous multimodal AI assistant embedded in the WebMCP Angular Showcase.

### CURRENT WORKSPACE CONTEXT:
- Active View: ${currentViewTitle} (ID: ${currentViewId}, Route: ${currentViewRoute})
- Available WebMCP Tools: ${activeToolsList}
- Specialists: ${subagentsList}${memoryBlock}

### AVAILABLE WORKSPACE VIEWS CATALOG:
${catalogTable.trim()}

### OPERATIONAL DIRECTIVES:
1. DELEGATION: Call \`delegate_to_subagent\` for multi-step tasks to isolate context and get receipts.
2. DIRECT TOOLS: Directly execute any tool from 'Available WebMCP Tools'.
3. CROSS-VIEW ACTIONS: Call \`navigate_to_view\` with \`targetView\` if target tools are in another view.
4. Tone: Concise, fluid, and human-friendly.${memoryDirective}`;
  }

  /**
   * Extracts reasoning / thought contents from API response or embedded XML tags,
   * stripping thought tags from user-facing content.
   */
  extractThinkingAndCleanContent(message?: {
    content?: string | null;
    reasoning_content?: string;
  }): { cleanContent: string | null; thinking?: string } {
    if (!message) {
      return { cleanContent: null, thinking: undefined };
    }

    const thinkingParts: string[] = [];
    const msgAny = message as any;

    if (
      msgAny.reasoning_content &&
      typeof msgAny.reasoning_content === 'string' &&
      msgAny.reasoning_content.trim()
    ) {
      thinkingParts.push(msgAny.reasoning_content.trim());
    } else if (
      msgAny.reasoning &&
      typeof msgAny.reasoning === 'string' &&
      msgAny.reasoning.trim()
    ) {
      thinkingParts.push(msgAny.reasoning.trim());
    }

    let content = message.content ?? null;

    if (content) {
      const tagRegex = /<(?:think|thought)>([\s\S]*?)<\/(?:think|thought)>/gi;
      let match: RegExpExecArray | null;

      while ((match = tagRegex.exec(content)) !== null) {
        if (match[1] && match[1].trim()) {
          thinkingParts.push(match[1].trim());
        }
      }

      const stripped = content.replace(tagRegex, '').trim();
      content = stripped.length > 0 ? stripped : null;
    }

    return {
      cleanContent: content,
      thinking: thinkingParts.length > 0 ? thinkingParts.join('\n\n') : undefined,
    };
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
    const dynamicSystemPrompt = this.buildDynamicSystemPrompt();

    // Sanitize context for OpenAI Chat Completions API
    const sanitizedHistory: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content?: string | null;
      name?: string;
      tool_call_id?: string;
      tool_calls?: any[];
    }> = [
      {
        role: 'system',
        content: dynamicSystemPrompt,
      },
      ...this.messages().map((m) => {
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
      }),
    ];

    const requestPayload: ChatCompletionRequest = {
      model: this.selectedModel(),
      messages: sanitizedHistory,
      tools: openAiTools.length > 0 ? openAiTools : undefined,
      temperature: 0.2,
    };

    const response = await firstValueFrom(
      this.http.post<ChatCompletionResponse>(
        `${this.apiBase}/chat/completions`,
        requestPayload
      )
    );

    const choice = response?.choices?.[0];
    if (!choice) {
      throw new Error('Empty response received from Bridge Proxy');
    }

    const message = choice.message;
    const toolCalls = message?.tool_calls;
    const { cleanContent, thinking } = this.extractThinkingAndCleanContent(message);

    // Case 1: Model finished with text response
    if (choice.finish_reason === 'stop' || !toolCalls || toolCalls.length === 0) {
      if (cleanContent || thinking) {
        this.messages.update((prev) => [
          ...prev,
          {
            id: 'msg-' + Math.random().toString(36).substring(2, 9),
            role: 'assistant',
            content: cleanContent,
            thinking,
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
        content: cleanContent,
        thinking,
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

      // Execute tool through SubAgentRunnerService or WebMcpService
      const startTime = performance.now();
      this.activeToolExecution.set({
        toolName,
        params: parsedArgs,
        status: 'running',
      });

      try {
        let compactResult: unknown;
        let imageUrl: string | undefined = undefined;
        let subagentReceipt: SubAgentExecutionReceipt | undefined = undefined;

        const isDelegationCall =
          toolName === DELEGATE_TO_SUBAGENT_TOOL_NAME ||
          toolName === 'delegate_to_subagent' ||
          toolName === 'delegate_to_specialist';

        if (isDelegationCall && (this.subagentRegistry || this.subagentRunner)) {
          const activeRegistry = this.subagentRegistry ?? this.subagentRunner?.registry;
          const targetSubagent =
            (parsedArgs['target_subagent'] as string) ||
            (parsedArgs['specialist'] as SubAgentType) ||
            'custom';
          const taskObjective =
            (parsedArgs['objective'] as string) ||
            (parsedArgs['taskObjective'] as string) ||
            'Execute domain task';
          const taskParams = parsedArgs['parameters'] as Record<string, unknown> | undefined;
          const contextHint =
            (parsedArgs['context_hint'] as string | undefined) ??
            (parsedArgs['contextHint'] as string | undefined) ??
            `Current Active View: ${this.registry?.activeView()?.title || '3D Digital Twin'} (${this.registry?.activeRoute() || '/3d-showroom'})`;

          let receipt: SubAgentExecutionReceipt;

          if (activeRegistry && activeRegistry.get(targetSubagent)) {
            const result = await activeRegistry.execute(targetSubagent, {
              objective: taskObjective,
              parameters: taskParams,
              contextHint,
            });
            receipt = {
              agentType: result.subagentId as SubAgentType,
              objective: result.objective,
              status: result.status,
              summary: result.summary,
              resultData: result.data,
              toolsUsed: result.toolsUsed,
              totalTurns: result.totalTurns,
              durationMs: result.durationMs,
              tokenUsageEstimate: result.tokenUsageEstimate,
              error: result.error,
            };
          } else if (this.subagentRunner) {
            receipt = await this.subagentRunner.executeTask({
              agentType: targetSubagent as SubAgentType,
              objective: taskObjective,
              parameters: taskParams,
              contextHint,
            });
          } else {
            throw new Error(`Target subagent "${targetSubagent}" is not available in registry.`);
          }

          subagentReceipt = receipt;
          compactResult = {
            success: receipt.status === 'success',
            specialist: receipt.agentType,
            summary: receipt.summary,
            toolsUsed: receipt.toolsUsed,
            steps: receipt.totalTurns,
            durationMs: receipt.durationMs,
            tokenEstimate: receipt.tokenUsageEstimate,
          };
        } else {
          const rawResult = (await this.webmcp.executeTool(
            toolName,
            parsedArgs,
            'ui'
          )) as any;

          compactResult = rawResult;

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
        }

        const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

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
            status: subagentReceipt ? (subagentReceipt.status === 'success' ? 'success' : 'error') : 'success',
            errorMessage: subagentReceipt?.error,
            subagentReceipt,
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
