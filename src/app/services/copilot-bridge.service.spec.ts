import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { of, throwError } from 'rxjs';
import { WebMcpService, WebMcpToolDefinition } from '@webmcp/angular';
import {
  CopilotBridgeService,
  BRIDGE_API_BASE,
  DEFAULT_COPILOT_API_BASE,
  COPILOT_API_BASE,
  DEFAULT_FALLBACK_MODELS,
} from './copilot-bridge.service';
import {
  ChatCompletionResponse,
  ModelsResponse,
} from './copilot-bridge.types';
import { SidebarModuleRegistryService } from './sidebar-module-registry.service';
import { DEFAULT_SIDEBAR_MODULES } from '../config/sidebar-modules.config';

describe('CopilotBridgeService & Autonomous Agent Loop', () => {
  let service: CopilotBridgeService;
  let mockHttp: any;
  let webmcpService: WebMcpService;
  let registry: SidebarModuleRegistryService;

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });

    registry = new SidebarModuleRegistryService(DEFAULT_SIDEBAR_MODULES, webmcpService);
    registry.setActiveRoute('/3d-showroom');

    mockHttp = {
      get: (url: string) => of({ data: DEFAULT_FALLBACK_MODELS }),
      post: (url: string, body: any) => of({ choices: [] }),
    };

    service = new CopilotBridgeService(mockHttp as any, webmcpService, registry);
  });

  describe('Model Discovery & Fallback Resilience (Threat Matrix)', () => {
    it('should initialize with default selected model gemini-3.7-flash-high', () => {
      expect(service.selectedModel()).toBe('gemini-3.7-flash-high');
    });

    it('should fetch available models from bridge proxy successfully', async () => {
      const mockModelsResponse: ModelsResponse = {
        data: [
          { id: 'gemini-3.7-flash-high', object: 'model', owned_by: 'google' },
          { id: 'gemini-2.5-flash', object: 'model', owned_by: 'google' },
          { id: 'gemini-2.5-pro', object: 'model', owned_by: 'google' },
        ],
      };

      mockHttp.get = (url: string) => {
        expect(url).toBe(`${BRIDGE_API_BASE}/models`);
        return of(mockModelsResponse);
      };

      const models = await service.fetchModels();
      expect(models.length).toBe(3);
      expect(service.availableModels().map((m) => m.id)).toContain('gemini-3.7-flash-high');
    });

    it('should fallback to default models on network/HTTP error without crashing (Threat Matrix)', async () => {
      mockHttp.get = (url: string) => throwError(() => new Error('HTTP 500 Network Failure'));

      const models = await service.fetchModels();
      expect(models.length).toBe(DEFAULT_FALLBACK_MODELS.length);
      expect(service.availableModels().map((m) => m.id)).toEqual(
        DEFAULT_FALLBACK_MODELS.map((m) => m.id)
      );
    });

    it('should use configured COPILOT_API_BASE when provided', async () => {
      const customBase = 'https://custom-proxy.internal.corp/v1';
      const customService = new CopilotBridgeService(
        mockHttp as any,
        webmcpService,
        registry,
        undefined,
        undefined,
        undefined,
        customBase
      );

      let requestedUrl = '';
      mockHttp.get = (url: string) => {
        requestedUrl = url;
        return of({ data: DEFAULT_FALLBACK_MODELS });
      };

      await customService.fetchModels();
      expect(requestedUrl).toBe(`${customBase}/models`);
    });
  });

  describe('WebMCP Tool to OpenAI Function Schema Conversion', () => {
    it('should convert registered WebMCP tools to OpenAI function schema format', async () => {
      const mockTool: WebMcpToolDefinition = {
        name: 'test_action',
        description: 'Performs a test action',
        parameters: {
          type: 'object',
          properties: {
            target: { type: 'string', description: 'Target mesh' },
            intensity: { type: 'number', description: 'Action intensity' },
          },
          required: ['target'],
        },
        handler: async () => ({ success: true }),
      };

      await webmcpService.registerTool(mockTool);

      const openAiTools = service.getOpenAiTools();
      const matched = openAiTools.find((t) => t.function.name === 'test_action');

      expect(matched).toBeDefined();
      expect(matched?.type).toBe('function');
      expect(matched?.function.description).toBe('Performs a test action');
      expect(matched?.function.parameters.properties['target']).toBeDefined();
      expect(matched?.function.parameters.required).toContain('target');
    });
  });

  describe('Dynamic Contextual System Prompt Construction (Threat Matrix)', () => {
    it('should prepend dynamic system message at index 0 with active view and available tools', async () => {
      registry.setActiveRoute('/enterprise-bi');

      const mockResponse: ChatCompletionResponse = {
        id: 'chatcmpl-sys',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Enterprise BI report ready.' },
            finish_reason: 'stop',
          },
        ],
      };

      let postedMessages: any[] = [];
      mockHttp.post = (url: string, body: any) => {
        postedMessages = body.messages;
        return of(mockResponse);
      };

      await service.sendMessage('Summarize Q3 financial health');

      expect(postedMessages.length).toBeGreaterThanOrEqual(2);
      const systemMsg = postedMessages[0];
      expect(systemMsg.role).toBe('system');
      expect(systemMsg.content).toContain('CURRENT WORKSPACE CONTEXT:');
      expect(systemMsg.content).toContain('Enterprise BI');
      expect(systemMsg.content).toContain('/enterprise-bi');
      expect(systemMsg.content).toContain('AVAILABLE WORKSPACE VIEWS CATALOG:');
      expect(systemMsg.content).toContain('navigate_to_view');
      expect(systemMsg.content).toContain('OPERATIONAL DIRECTIVES:');
    });

    it('should generate bounded system prompt under 1.5KB (Threat Matrix)', () => {
      const prompt = service.buildDynamicSystemPrompt();
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeLessThan(1500); // Strict bounded size < 1.5 KB
      expect(prompt).toContain('AI Copilot');
      expect(prompt).toContain('AVAILABLE WORKSPACE VIEWS CATALOG:');
    });
  });

  describe('Single-Turn Chat Completions', () => {
    it('should send user prompt and append assistant response on stop finish_reason', async () => {
      const mockResponse: ChatCompletionResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! I am your Cyberpunk 3D Copilot powered by Gemini 3.7 Flash High.',
            },
            finish_reason: 'stop',
          },
        ],
      };

      let postedBody: any = null;
      mockHttp.post = (url: string, body: any) => {
        expect(url).toBe(`${BRIDGE_API_BASE}/chat/completions`);
        postedBody = body;
        return of(mockResponse);
      };

      await service.sendMessage('Hello');

      expect(postedBody.messages.some((m: any) => m.role === 'user' && m.content === 'Hello')).toBe(true);

      const msgs = service.messages();
      expect(msgs.length).toBe(2);
      expect(msgs[0].role).toBe('user');
      expect(msgs[0].content).toBe('Hello');
      expect(msgs[1].role).toBe('assistant');
      expect(msgs[1].content).toContain('Gemini 3.7 Flash High');
      expect(service.isGenerating()).toBe(false);
    });
  });

  describe('Autonomous Multi-Turn Execution Loop with Tool Calling', () => {
    it('should execute tool call via WebMcpService and send tool result back to completions', async () => {
      let executedAction = '';
      const testTool: WebMcpToolDefinition = {
        name: 'scene_3d_action',
        description: 'Rotates camera or changes vehicle color',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['rotate', 'reset_camera'] },
            deltaX: { type: 'number' },
          },
          required: ['action'],
        },
        handler: async (params: any) => {
          executedAction = params.action;
          return { success: true, message: `Action ${params.action} applied` };
        },
      };

      await webmcpService.registerTool(testTool);

      // Turn 1 response: Tool Call
      const toolCallResponse: ChatCompletionResponse = {
        id: 'chatcmpl-turn1',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_scene_1',
                  type: 'function',
                  function: {
                    name: 'scene_3d_action',
                    arguments: JSON.stringify({ action: 'rotate', deltaX: 45 }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      };

      // Turn 2 response: Stop
      const finalResponse: ChatCompletionResponse = {
        id: 'chatcmpl-turn2',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'I have rotated the 3D cybercar 45 degrees!',
            },
            finish_reason: 'stop',
          },
        ],
      };

      let postCount = 0;
      let lastPostedMessages: any[] = [];
      mockHttp.post = (url: string, body: any) => {
        postCount++;
        lastPostedMessages = body.messages;
        if (postCount === 1) {
          return of(toolCallResponse);
        }
        return of(finalResponse);
      };

      await service.sendMessage('Rotate the car 45 degrees');

      expect(executedAction).toBe('rotate');
      expect(postCount).toBe(2);
      expect(lastPostedMessages.some((m) => m.role === 'tool' && m.tool_call_id === 'call_scene_1')).toBe(true);

      const msgs = service.messages();
      expect(msgs.some((m) => m.role === 'user')).toBe(true);
      expect(msgs.some((m) => m.role === 'tool' && m.toolExecution?.status === 'success')).toBe(true);
      expect(msgs[msgs.length - 1].role).toBe('assistant');
      expect(msgs[msgs.length - 1].content).toContain('rotated the 3D cybercar');
      expect(service.isGenerating()).toBe(false);
    });

    it('should halt autonomous loop and warn when exceeding MAX_TOOL_TURNS (Threat Matrix)', async () => {
      const loopTool: WebMcpToolDefinition = {
        name: 'loop_tool',
        description: 'Tool that simulates endless loop',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({ success: true }),
      };
      await webmcpService.registerTool(loopTool);

      let turnCount = 0;
      mockHttp.post = (url: string, body: any) => {
        turnCount++;
        return of({
          id: `chatcmpl-loop-${turnCount}`,
          object: 'chat.completion',
          created: Date.now(),
          model: 'gemini-3.7-flash-high',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: `call_loop_${turnCount}`,
                    type: 'function',
                    function: { name: 'loop_tool', arguments: '{}' },
                  },
                ],
              },
              finish_reason: 'tool_calls',
            },
          ],
        });
      };

      await service.sendMessage('Start endless loop');

      expect(turnCount).toBe(5); // Capped at turn 5
      const msgs = service.messages();
      const lastMsg = msgs[msgs.length - 1];
      expect(lastMsg.content).toContain('Maximum autonomous tool recursion limit');
      expect(service.isGenerating()).toBe(false);
    });

    it('should format domain-isolated enterprise BI WebMCP tool schemas correctly for OpenAI API', async () => {
      const biTools: WebMcpToolDefinition[] = [
        {
          name: 'query_enterprise_metrics',
          description: 'Query enterprise metrics and logs',
          parameters: {
            type: 'object',
            properties: {
              domain: { type: 'string', description: 'Business domain' },
              department: { type: 'string', description: 'Department' },
            },
          },
          handler: async () => ({ success: true }),
        },
        {
          name: 'calculate_kpi_summary',
          description: 'Calculate real-time KPIs',
          parameters: {
            type: 'object',
            properties: {
              domain: { type: 'string' },
            },
          },
          handler: async () => ({ success: true }),
        },
      ];

      for (const t of biTools) {
        await webmcpService.registerTool(t);
      }

      const openAiTools = service.getOpenAiTools();
      const queryTool = openAiTools.find((t) => t.function.name === 'query_enterprise_metrics');
      expect(queryTool).toBeDefined();
      expect(queryTool?.function.parameters.properties['domain']).toBeDefined();

      const kpiTool = openAiTools.find((t) => t.function.name === 'calculate_kpi_summary');
      expect(kpiTool).toBeDefined();
    });

    it('should safely recover from malformed JSON tool arguments (Threat Matrix)', async () => {
      const testTool: WebMcpToolDefinition = {
        name: 'safe_tool',
        description: 'Safe tool',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({ success: true }),
      };
      await webmcpService.registerTool(testTool);

      const malformedResponse: ChatCompletionResponse = {
        id: 'chatcmpl-malformed',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_malformed',
                  type: 'function',
                  function: {
                    name: 'safe_tool',
                    arguments: '{ broken json: invalid, missing closing',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      };

      const finalResponse: ChatCompletionResponse = {
        id: 'chatcmpl-recovered',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Recovered from malformed arguments.' },
            finish_reason: 'stop',
          },
        ],
      };

      let postCount = 0;
      let lastPostedMessages: any[] = [];
      mockHttp.post = (url: string, body: any) => {
        postCount++;
        lastPostedMessages = body.messages;
        if (postCount === 1) return of(malformedResponse);
        return of(finalResponse);
      };

      await service.sendMessage('Run malformed test');

      const toolMsg = lastPostedMessages.find((m: any) => m.role === 'tool');
      expect(toolMsg.content).toContain('Malformed JSON payload');

      expect(service.messages().length).toBeGreaterThan(2);
      expect(service.isGenerating()).toBe(false);
    });

    it('should sanitize base64 image data from take_screenshot before sending back to LLM context (Threat Matrix)', async () => {
      const largeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const screenshotTool: WebMcpToolDefinition = {
        name: 'take_screenshot',
        description: 'Captures canvas viewport',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({
          success: true,
          image: largeBase64,
          mimeType: 'image/png',
          dimensions: { width: 800, height: 600 },
          timestamp: Date.now(),
        }),
      };
      await webmcpService.registerTool(screenshotTool);

      const toolCallResponse: ChatCompletionResponse = {
        id: 'chatcmpl-shot',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_shot_1',
                  type: 'function',
                  function: { name: 'take_screenshot', arguments: '{}' },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      };

      const finalResponse: ChatCompletionResponse = {
        id: 'chatcmpl-final-shot',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Screenshot captured and rendered in UI!' },
            finish_reason: 'stop',
          },
        ],
      };

      let postCount = 0;
      let lastPostedMessages: any[] = [];
      mockHttp.post = (url: string, body: any) => {
        postCount++;
        lastPostedMessages = body.messages;
        if (postCount === 1) return of(toolCallResponse);
        return of(finalResponse);
      };

      await service.sendMessage('Take a screenshot');

      const toolMsg = lastPostedMessages.find((m: any) => m.role === 'tool');
      // Context sent to LLM must NOT contain the raw base64 data URL
      expect(toolMsg.content).not.toContain('iVBORw0KGgoAAAANSUhEUg');
      expect(toolMsg.content).toContain('dimensions');

      // The message stored in service.messages() for UI rendering MUST have imageUrl
      const toolUiMsg = service.messages().find((m) => m.imageUrl);
      expect(toolUiMsg).toBeDefined();
      expect(toolUiMsg?.imageUrl).toBe(largeBase64);
    });
  });

  describe('Session Management & State Signals', () => {
    it('should clear messages and reset generation state', () => {
      service.clearHistory();
      expect(service.messages().length).toBe(0);
      expect(service.isGenerating()).toBe(false);
    });

    it('should allow changing selected model', () => {
      service.selectModel('gemini-2.5-pro');
      expect(service.selectedModel()).toBe('gemini-2.5-pro');
    });

    it('should manage drawer open and minimized state', () => {
      expect(service.isOpen()).toBe(false);
      service.openDrawer();
      expect(service.isOpen()).toBe(true);
      expect(service.isMinimized()).toBe(false);

      service.toggleMinimize();
      expect(service.isMinimized()).toBe(true);

      service.closeDrawer();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('Thinking & Reasoning Extraction', () => {
    it('should extract reasoning from reasoning_content field', () => {
      const result = service.extractThinkingAndCleanContent({
        content: 'Final response text',
        reasoning_content: 'Step 1: Check inputs. Step 2: Validate.',
      });

      expect(result.cleanContent).toBe('Final response text');
      expect(result.thinking).toBe('Step 1: Check inputs. Step 2: Validate.');
    });

    it('should extract thinking from <think>...</think> tags and strip them from content', () => {
      const result = service.extractThinkingAndCleanContent({
        content: '<think>Let me formulate the answer.\nAnalyzing parameters...</think>Here is the completed setup.',
      });

      expect(result.cleanContent).toBe('Here is the completed setup.');
      expect(result.thinking).toBe('Let me formulate the answer.\nAnalyzing parameters...');
    });

    it('should extract thinking from <thought>...</thought> tags and strip them from content', () => {
      const result = service.extractThinkingAndCleanContent({
        content: '<thought>Evaluating scene hierarchy.</thought>Scene loaded successfully.',
      });

      expect(result.cleanContent).toBe('Scene loaded successfully.');
      expect(result.thinking).toBe('Evaluating scene hierarchy.');
    });

    it('should combine reasoning_content and embedded tags if both present', () => {
      const result = service.extractThinkingAndCleanContent({
        content: '<think>Internal tag thought.</think>Result text.',
        reasoning_content: 'Proxy reasoning content.',
      });

      expect(result.cleanContent).toBe('Result text.');
      expect(result.thinking).toContain('Proxy reasoning content.');
      expect(result.thinking).toContain('Internal tag thought.');
    });

    it('should set thinking on assistant message in autonomous turn', async () => {
      const mockResponse: ChatCompletionResponse = {
        id: 'chatcmpl-think',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gemini-3.7-flash-high',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '<think>Considering vehicle transformation</think>Vehicle colored red.',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttp.post = () => of(mockResponse);

      await service.sendMessage('Color vehicle red');

      const msgs = service.messages();
      const assistantMsg = msgs.find((m) => m.role === 'assistant');
      expect(assistantMsg).toBeDefined();
      expect(assistantMsg?.content).toBe('Vehicle colored red.');
      expect(assistantMsg?.thinking).toBe('Considering vehicle transformation');
    });
  });

  describe('Hierarchical Subagent Delegation (Noise-Free Main Context)', () => {
    it('should delegate domain tasks to SubAgentRunnerService and return clean receipt to orchestrator', async () => {
      const mockRunner: any = {
        executeTask: async (req: any) => ({
          agentType: req.agentType,
          objective: req.objective,
          status: 'success',
          summary: 'Specialist optimized 3D scene: Adjusted 3 meshes and framed camera.',
          toolsUsed: ['cad_draw_shape', 'scene_3d_action'],
          totalTurns: 2,
          durationMs: 120,
          tokenUsageEstimate: { promptTokens: 400, completionTokens: 50, totalTokens: 450 },
        }),
      };

      const orchestratorService = new CopilotBridgeService(
        mockHttp as any,
        webmcpService,
        registry,
        mockRunner
      );

      // Verify that delegate_to_specialist tool is available in orchestrator tools
      const tools = orchestratorService.getOpenAiTools();
      const delegatorTool = tools.find((t) => t.function.name === 'delegate_to_specialist');
      expect(delegatorTool).toBeDefined();

      let turn = 0;
      mockHttp.post = (_url: string, body: any) => {
        turn++;
        if (turn === 1) {
          // Orchestrator decides to delegate to 3d-specialist
          return of({
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Delegating to 3D specialist...',
                  tool_calls: [
                    {
                      id: 'call-deleg-1',
                      type: 'function',
                      function: {
                        name: 'delegate_to_specialist',
                        arguments: JSON.stringify({
                          specialist: '3d-specialist',
                          taskObjective: 'Frame camera and highlight components',
                        }),
                      },
                    },
                  ],
                },
                finish_reason: 'tool_calls',
              },
            ],
          });
        } else {
          // Orchestrator gets receipt and responds to user
          return of({
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'All done! The 3D scene was framed and highlighted.',
                },
                finish_reason: 'stop',
              },
            ],
          });
        }
      };

      await orchestratorService.sendMessage('Prepare the 3D showcase presentation');

      const messages = orchestratorService.messages();
      const toolMsg = messages.find((m) => m.role === 'tool' && m.name === 'delegate_to_specialist');

      expect(toolMsg).toBeDefined();
      expect(toolMsg?.toolExecution?.subagentReceipt).toBeDefined();
      expect(toolMsg?.toolExecution?.subagentReceipt?.summary).toContain('Specialist optimized 3D scene');
      expect(toolMsg?.toolExecution?.status).toBe('success');

      // The final assistant message synthesized the receipt
      const finalMsg = messages[messages.length - 1];
      expect(finalMsg.role).toBe('assistant');
      expect(finalMsg.content).toBe('All done! The 3D scene was framed and highlighted.');
    });

    it('should dynamically synthesize delegate_to_subagent tool when subagents are registered in SubAgentRegistryService', async () => {
      const { SubAgentRegistryService } = await import('@cobies/webmcp-angular');
      const { SubAgentRunnerService } = await import('./subagent-runner.service');

      const subagentRegistry = new SubAgentRegistryService();
      const runner = new SubAgentRunnerService(mockHttp as any, webmcpService, subagentRegistry);

      const orchestratorService = new CopilotBridgeService(
        mockHttp as any,
        webmcpService,
        registry,
        runner,
        subagentRegistry
      );

      const openAiTools = orchestratorService.getOpenAiTools();
      const dynamicTool = openAiTools.find((t) => t.function.name === 'delegate_to_subagent');

      expect(dynamicTool).toBeDefined();
      expect(dynamicTool?.function.parameters.properties['target_subagent']).toBeDefined();
      const subagentEnum = dynamicTool?.function.parameters.properties['target_subagent'].enum;
      expect(subagentEnum).toContain('3d-specialist');
      expect(subagentEnum).toContain('analytics-specialist');
      expect(subagentEnum).toContain('audit-specialist');

      // Test execution via delegate_to_subagent
      let turn = 0;
      mockHttp.post = (_url: string, body: any) => {
        turn++;
        if (turn === 1) {
          // Parent LLM triggers delegate_to_subagent
          return of({
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call-dyn-sub-1',
                      type: 'function',
                      function: {
                        name: 'delegate_to_subagent',
                        arguments: JSON.stringify({
                          target_subagent: 'analytics-specialist',
                          objective: 'Compute Q3 ARR growth and risk profile',
                        }),
                      },
                    },
                  ],
                },
                finish_reason: 'tool_calls',
              },
            ],
          });
        } else if (turn === 2) {
          // Specialist subagent internal turn: returns completion summary
          return of({
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Analytics complete: ARR growth is 24%, low risk detected.',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 200, completion_tokens: 50, total_tokens: 250 },
          });
        } else {
          // Parent LLM receives receipt and gives final answer
          return of({
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Here is the summary: ARR growth is 24% with low risk profile.',
                },
                finish_reason: 'stop',
              },
            ],
          });
        }
      };

      await orchestratorService.sendMessage('Analyze Q3 business metrics');

      const messages = orchestratorService.messages();
      const toolMsg = messages.find((m) => m.role === 'tool' && m.name === 'delegate_to_subagent');

      expect(toolMsg).toBeDefined();
      expect(toolMsg?.toolExecution?.subagentReceipt).toBeDefined();
      expect(toolMsg?.toolExecution?.subagentReceipt?.agentType).toBe('analytics-specialist');
      expect(toolMsg?.toolExecution?.subagentReceipt?.summary).toContain('ARR growth is 24%');
    });
  });

  describe('Optional Proactive Memory System Prompt Enrichment', () => {
    it('should build standard prompt without memory block when memoryService is not provided', () => {
      const prompt = service.buildDynamicSystemPrompt();
      expect(prompt).not.toContain('ACTIVE AGENT MEMORY');
      expect(prompt).not.toContain('MEMORY & PROACTIVE RECALL');
    });

    it('should enrich prompt with active pinned memories and proactive directives when memoryService is active', async () => {
      const mockMemoryService: any = {
        isReady: () => true,
        pinnedMemories: () => [
          {
            id: 'mem-1',
            topic: 'theme_color',
            content: '#00f0ff neon cyan',
            category: 'preference',
            tags: ['theme'],
            pinned: true,
            createdAt: 1000,
            updatedAt: 1000,
            lastAccessedAt: 1000,
            accessCount: 1,
          },
        ],
        memories: () => [],
      };

      const memoryEnrichedService = new CopilotBridgeService(
        mockHttp as any,
        webmcpService,
        registry,
        undefined,
        undefined,
        mockMemoryService
      );

      const prompt = memoryEnrichedService.buildDynamicSystemPrompt();
      expect(prompt).toContain('ACTIVE AGENT MEMORY & PINNED RULES:');
      expect(prompt).toContain('[PREFERENCE] theme_color: #00f0ff neon cyan');
      expect(prompt).toContain('MEMORY & PROACTIVE RECALL:');
    });
  });
});


