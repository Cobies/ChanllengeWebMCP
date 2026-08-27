import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { of, throwError } from 'rxjs';
import { WebMcpService, WebMcpToolDefinition } from '@webmcp/angular';
import {
  CopilotBridgeService,
  BRIDGE_API_BASE,
  DEFAULT_FALLBACK_MODELS,
} from './copilot-bridge.service';
import {
  ChatCompletionResponse,
  ModelsResponse,
} from './copilot-bridge.types';

describe('CopilotBridgeService & Autonomous Agent Loop', () => {
  let service: CopilotBridgeService;
  let mockHttp: any;
  let webmcpService: WebMcpService;

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });

    mockHttp = {
      get: (url: string) => of({ data: DEFAULT_FALLBACK_MODELS }),
      post: (url: string, body: any) => of({ choices: [] }),
    };

    service = new CopilotBridgeService(mockHttp as any, webmcpService);
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
});
