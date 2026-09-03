import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { of, throwError } from 'rxjs';
import { WebMcpService } from '@webmcp/angular';
import {
  SubAgentRunnerService,
  BUILTIN_SUBAGENT_PROFILES,
} from './subagent-runner.service';
import {
  COPILOT_API_BASE,
  DEFAULT_COPILOT_API_BASE,
} from './copilot-bridge.service';
import { ChatCompletionResponse } from './copilot-bridge.types';
import { SubAgentRegistryService, createSubAgent } from '@cobies/webmcp-angular';

describe('SubAgentRunnerService (Hierarchical Orchestrator-Worker Engine)', () => {
  let runner: SubAgentRunnerService;
  let mockHttp: any;
  let webmcpService: WebMcpService;
  let subAgentRegistry: SubAgentRegistryService;

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });

    mockHttp = {
      post: () => of({ choices: [] }),
    };

    subAgentRegistry = new SubAgentRegistryService();
    runner = new SubAgentRunnerService(mockHttp as any, webmcpService, subAgentRegistry);
  });


  describe('Specialist Profiles & Tool Filtering', () => {
    it('should return correct builtin profiles for 3d-specialist, analytics-specialist, audit-specialist', () => {
      const p3d = runner.getProfile('3d-specialist');
      expect(p3d.type).toBe('3d-specialist');
      expect(p3d.preferredModel).toBe('gemini-2.5-flash');

      const pBi = runner.getProfile('analytics-specialist');
      expect(pBi.type).toBe('analytics-specialist');

      const pAudit = runner.getProfile('audit-specialist');
      expect(pAudit.type).toBe('audit-specialist');

      const pCustom = runner.getProfile('custom');
      expect(pCustom.type).toBe('custom');
    });

    it('should filter registered WebMCP tools based on specialist whitelist', async () => {
      await webmcpService.registerTool({
        name: 'cad_draw_shape',
        description: 'CAD draw',
        parameters: { type: 'object', properties: {} },
        handler: () => ({ ok: true }),
      });
      await webmcpService.registerTool({
        name: 'query_enterprise_metrics',
        description: 'Query BI metrics',
        parameters: { type: 'object', properties: {} },
        handler: () => ({ ok: true }),
      });
      await webmcpService.registerTool({
        name: 'get_execution_logs',
        description: 'Inspect logs',
        parameters: { type: 'object', properties: {} },
        handler: () => ({ ok: true }),
      });

      const p3d = runner.getProfile('3d-specialist');
      const tools3d = runner.getFilteredTools(p3d);
      const names3d = tools3d.map((t) => t.function.name);
      expect(names3d).toContain('cad_draw_shape');
      expect(names3d).not.toContain('query_enterprise_metrics');

      const pBi = runner.getProfile('analytics-specialist');
      const toolsBi = runner.getFilteredTools(pBi);
      const namesBi = toolsBi.map((t) => t.function.name);
      expect(namesBi).toContain('query_enterprise_metrics');
      expect(namesBi).not.toContain('cad_draw_shape');
    });
  });

  describe('Isolated Subagent Execution Loop', () => {
    it('should execute task in isolated context and return clean SubAgentExecutionReceipt', async () => {
      let executedAction = false;
      await webmcpService.registerTool({
        name: 'query_enterprise_metrics',
        description: 'Query BI metrics',
        parameters: { type: 'object', properties: {} },
        handler: () => {
          executedAction = true;
          return {
            recordsCount: 500,
            heavyDataset: new Array(500).fill({ id: 1, revenue: 1000 }),
          };
        },
      });

      let turnCount = 0;
      mockHttp.post = (url: string, body: any) => {
        expect(url).toBe(`${DEFAULT_COPILOT_API_BASE}/chat/completions`);
        turnCount++;
        if (turnCount === 1) {
          // Model chooses to call tool
          const responseWithTool: ChatCompletionResponse = {
            id: 'sub-call-1',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gemini-2.5-flash',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Querying enterprise metrics...',
                  tool_calls: [
                    {
                      id: 'call-1',
                      type: 'function',
                      function: {
                        name: 'query_enterprise_metrics',
                        arguments: JSON.stringify({ domain: 'cloud_finops' }),
                      },
                    },
                  ],
                },
                finish_reason: 'tool_calls',
              },
            ],
            usage: { prompt_tokens: 150, completion_tokens: 40, total_tokens: 190 },
          };
          return of(responseWithTool);
        } else {
          // Subagent receives tool result and responds with concise summary
          const responseFinal: ChatCompletionResponse = {
            id: 'sub-call-2',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gemini-2.5-flash',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Analysis complete: Cloud spend is optimal with total revenue $500,000.',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 300, completion_tokens: 25, total_tokens: 325 },
          };
          return of(responseFinal);
        }
      };

      const receipt = await runner.executeTask({
        agentType: 'analytics-specialist',
        objective: 'Analyze cloud spend and revenue',
      });

      expect(executedAction).toBe(true);
      expect(receipt.status).toBe('success');
      expect(receipt.agentType).toBe('analytics-specialist');
      expect(receipt.summary).toBe('Analysis complete: Cloud spend is optimal with total revenue $500,000.');
      expect(receipt.toolsUsed).toContain('query_enterprise_metrics');
      expect(receipt.totalTurns).toBe(2);
      expect(receipt.tokenUsageEstimate?.totalTokens).toBe(515);

      // Verify that history signal has the receipt recorded
      expect(runner.executionHistory().length).toBe(1);
      expect(runner.executionHistory()[0].summary).toContain('Analysis complete');
    });

    it('should handle subagent error and return failed receipt gracefully without throwing', async () => {
      mockHttp.post = () => throwError(() => new Error('Subagent API timeout'));

      const receipt = await runner.executeTask({
        agentType: '3d-specialist',
        objective: 'Rotate camera 45 degrees',
      });

      expect(receipt.status).toBe('failed');
      expect(receipt.error).toContain('Subagent API timeout');
      expect(receipt.summary).toContain('Subagent failed: Subagent API timeout');
    });

    it('should use configured COPILOT_API_BASE when provided', async () => {
      const customBase = 'https://custom-proxy.internal.corp/v1';
      const customRunner = new SubAgentRunnerService(
        mockHttp as any,
        webmcpService,
        subAgentRegistry,
        customBase
      );

      let requestedUrl = '';
      mockHttp.post = (url: string) => {
        requestedUrl = url;
        return of({
          id: 'custom-sub-1',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gemini-2.5-flash',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Custom proxy response',
              },
              finish_reason: 'stop',
            },
          ],
        });
      };

      await customRunner.executeTask({
        agentType: '3d-specialist',
        objective: 'Test endpoint routing',
      });

      expect(requestedUrl).toBe(`${customBase}/chat/completions`);
    });
  });

  describe('Dynamic SubAgentRegistryService Integration', () => {
    it('should register built-in specialist profiles into SubAgentRegistryService on init', () => {
      const subagents = subAgentRegistry.subagents();
      expect(subagents.length).toBe(3);

      const ids = subagents.map((s) => s.config.id);
      expect(ids).toContain('3d-specialist');
      expect(ids).toContain('analytics-specialist');
      expect(ids).toContain('audit-specialist');
    });

    it('should dynamically include runtime custom subagents in delegation tool schema', () => {
      const tool = subAgentRegistry.createDelegationTool();
      const enumValues = tool.parameters.properties['target_subagent'].enum;
      expect(enumValues).toContain('3d-specialist');
      expect(enumValues).toContain('analytics-specialist');
      expect(enumValues).toContain('audit-specialist');

      // Create a custom runtime subagent
      createSubAgent(
        {
          id: 'custom-view-worker',
          name: 'Custom View Worker',
          description: 'Specialized in view-specific operations',
          systemPrompt: 'You are a custom view worker.',
        },
        { registry: subAgentRegistry, webmcp: webmcpService }
      );

      const updatedEnum = tool.parameters.properties['target_subagent'].enum;
      expect(updatedEnum).toContain('custom-view-worker');
      expect(updatedEnum.length).toBe(4);
    });

    it('should execute task dispatched through SubAgentRegistryService and return SubAgentResult', async () => {
      mockHttp.post = (_url: string, _body: any) => {
        const finalResponse: ChatCompletionResponse = {
          id: 'sub-call-registry',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gemini-2.5-flash',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Registry execution completed: 3D scene calibrated.',
              },
              finish_reason: 'stop',
            },
          ],
        };
        return of(finalResponse);
      };

      const result = await subAgentRegistry.execute('3d-specialist', {
        objective: 'Calibrate 3D scene camera',
      });

      expect(result.status).toBe('success');
      expect(result.subagentId).toBe('3d-specialist');
      expect(result.summary).toBe('Registry execution completed: 3D scene calibrated.');
    });
  });
});

