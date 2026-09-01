import { describe, it, expect, beforeEach } from 'bun:test';
import { signal, DestroyRef } from '@angular/core';
import { WebMcpService, WebMcpToolDefinition } from '../core/webmcp.service';
import {
  SubAgentConfig,
  SubAgentInstance,
  SubAgentStatus,
  SubAgentTask,
  SubAgentResult,
  SubAgentToolFilter,
} from './subagent.types';
import { filterToolsForSubAgent } from './subagent-tool-scoper';
import { SubAgentRegistryService } from './subagent-registry.service';
import { createSubAgent } from './create-subagent';
import { getDelegationToolDefinition, createDelegationTool } from './subagent-delegation-tool';

class MockDestroyRef implements DestroyRef {
  private callbacks: (() => void)[] = [];

  onDestroy(callback: () => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  destroy(): void {
    for (const cb of this.callbacks) {
      cb();
    }
  }
}

const SAMPLE_TOOLS: WebMcpToolDefinition[] = [
  {
    name: 'scene_3d_rotate',
    description: 'Rotate 3D scene camera',
    parameters: { type: 'object', properties: { deltaX: { type: 'number' } } },
    handler: async () => ({ rotated: true }),
  },
  {
    name: 'scene_3d_zoom',
    description: 'Zoom 3D scene camera',
    parameters: { type: 'object', properties: { factor: { type: 'number' } } },
    handler: async () => ({ zoomed: true }),
  },
  {
    name: 'cad_draw_shape',
    description: 'Draw CAD 2D/3D shape',
    parameters: { type: 'object', properties: { shape: { type: 'string' } } },
    handler: async () => ({ shapeDrawn: true }),
  },
  {
    name: 'bi_query_metrics',
    description: 'Query enterprise BI metrics',
    parameters: { type: 'object', properties: { domain: { type: 'string' } } },
    handler: async () => ({ metrics: [1, 2, 3] }),
  },
  {
    name: 'bi_calculate_kpi',
    description: 'Calculate BI KPIs',
    parameters: { type: 'object', properties: { domain: { type: 'string' } } },
    handler: async () => ({ healthScore: 95 }),
  },
  {
    name: 'take_screenshot',
    description: 'Capture screenshot of viewport',
    parameters: { type: 'object', properties: { format: { type: 'string' } } },
    handler: async () => ({ image: 'data:image/png;base64,...' }),
  },
];

describe('Dynamic SubAgents SDK - Core Unit Suite', () => {
  /* ==========================================================================
     1. Tool Scoper Multi-Strategy Filtering
     ========================================================================== */
  describe('Tool Scoper (filterToolsForSubAgent)', () => {
    it('should return all tools when no filters and no local tools are defined', () => {
      const scoped = filterToolsForSubAgent(SAMPLE_TOOLS);
      expect(scoped).toHaveLength(SAMPLE_TOOLS.length);
      expect(scoped.map((t) => t.name)).toEqual(SAMPLE_TOOLS.map((t) => t.name));
    });

    it('should filter tools by exact string name allowlist', () => {
      const filters: SubAgentToolFilter[] = ['take_screenshot', 'scene_3d_rotate'];
      const scoped = filterToolsForSubAgent(SAMPLE_TOOLS, filters);

      expect(scoped).toHaveLength(2);
      expect(scoped.map((t) => t.name)).toEqual(['scene_3d_rotate', 'take_screenshot']);
    });

    it('should filter tools using RegExp pattern matching', () => {
      const filters: SubAgentToolFilter[] = [/^scene_3d_/, /^bi_/];
      const scoped = filterToolsForSubAgent(SAMPLE_TOOLS, filters);

      expect(scoped).toHaveLength(4);
      expect(scoped.map((t) => t.name)).toEqual([
        'scene_3d_rotate',
        'scene_3d_zoom',
        'bi_query_metrics',
        'bi_calculate_kpi',
      ]);
    });

    it('should filter tools using custom predicate functions', () => {
      const filters: SubAgentToolFilter[] = [
        (tool) => tool.description.toLowerCase().includes('cad'),
      ];
      const scoped = filterToolsForSubAgent(SAMPLE_TOOLS, filters);

      expect(scoped).toHaveLength(1);
      expect(scoped[0].name).toBe('cad_draw_shape');
    });

    it('should enforce denylist precedence over allowlist patterns', () => {
      const filters: SubAgentToolFilter[] = [
        {
          allow: [/^scene_3d_/, 'take_screenshot'],
          deny: ['scene_3d_zoom'],
        },
      ];
      const scoped = filterToolsForSubAgent(SAMPLE_TOOLS, filters);

      expect(scoped).toHaveLength(2);
      expect(scoped.map((t) => t.name)).toEqual(['scene_3d_rotate', 'take_screenshot']);
    });

    it('should evaluate group predicate in conjunction with allowlist and denylist', () => {
      const filters: SubAgentToolFilter[] = [
        {
          allow: [/^bi_/],
          predicate: (tool) => tool.name.endsWith('_kpi'),
          deny: ['bi_query_metrics'],
        },
      ];
      const scoped = filterToolsForSubAgent(SAMPLE_TOOLS, filters);

      expect(scoped).toHaveLength(1);
      expect(scoped[0].name).toBe('bi_calculate_kpi');
    });

    it('should merge subagent-local tools and override global tools with identical names', () => {
      const localTools: WebMcpToolDefinition[] = [
        {
          name: 'local_custom_tool',
          description: 'Specialized local helper tool',
          parameters: { type: 'object', properties: {} },
          handler: async () => ({ custom: true }),
        },
        {
          name: 'take_screenshot',
          description: 'Overridden local screenshot with watermark',
          parameters: { type: 'object', properties: { watermark: { type: 'string' } } },
          handler: async () => ({ image: 'overridden-screenshot' }),
        },
      ];

      const filters: SubAgentToolFilter[] = ['take_screenshot', 'cad_draw_shape'];
      const scoped = filterToolsForSubAgent(SAMPLE_TOOLS, filters, localTools);

      expect(scoped).toHaveLength(3);
      const names = scoped.map((t) => t.name);
      expect(names).toContain('cad_draw_shape');
      expect(names).toContain('take_screenshot');
      expect(names).toContain('local_custom_tool');

      // The overridden tool must be the local tool instance
      const screenshotTool = scoped.find((t) => t.name === 'take_screenshot');
      expect(screenshotTool?.description).toBe('Overridden local screenshot with watermark');
    });
  });

  /* ==========================================================================
     2. SubAgentRegistryService Reactive Signals & Execution
     ========================================================================== */
  describe('SubAgentRegistryService', () => {
    let registry: SubAgentRegistryService;

    beforeEach(() => {
      registry = new SubAgentRegistryService();
    });

    it('should register and retrieve subagent instances reactively', () => {
      expect(registry.subagents()).toHaveLength(0);
      expect(registry.activeSubagents()).toHaveLength(0);

      const statusSignal = signal<SubAgentStatus>('idle');
      const taskSignal = signal<SubAgentTask | null>(null);
      const historySignal = signal<SubAgentResult[]>([]);

      const mockSubagent: SubAgentInstance = {
        config: {
          id: 'test-agent-1',
          name: 'Test Agent 1',
          description: 'A test subagent',
          systemPrompt: 'You are a test agent.',
        },
        status: statusSignal.asReadonly(),
        activeTask: taskSignal.asReadonly(),
        history: historySignal.asReadonly(),
        execute: async (task) => ({
          subagentId: 'test-agent-1',
          objective: task.objective,
          status: 'success',
          summary: 'Task done',
          toolsUsed: [],
          totalTurns: 1,
          durationMs: 10,
        }),
        destroy: () => {},
      };

      registry.register(mockSubagent);

      expect(registry.subagents()).toHaveLength(1);
      expect(registry.get('test-agent-1')).toBe(mockSubagent);
      expect(registry.getSubagents()).toHaveLength(1);
    });

    it('should throw an error when registering a duplicate subagent ID', () => {
      const makeMockAgent = (id: string): SubAgentInstance => ({
        config: { id, name: id, description: 'desc', systemPrompt: 'prompt' },
        status: signal<SubAgentStatus>('idle').asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async () => ({
          subagentId: id,
          objective: 'obj',
          status: 'success',
          summary: 'done',
          toolsUsed: [],
          totalTurns: 1,
          durationMs: 5,
        }),
        destroy: () => {},
      });

      registry.register(makeMockAgent('duplicate-id'));

      expect(() => {
        registry.register(makeMockAgent('duplicate-id'));
      }).toThrow(/already registered/i);
    });

    it('should unregister subagents and update reactive signals', () => {
      const mockAgent: SubAgentInstance = {
        config: { id: 'removable-agent', name: 'Removable', description: 'desc', systemPrompt: 'prompt' },
        status: signal<SubAgentStatus>('idle').asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async () => ({
          subagentId: 'removable-agent',
          objective: 'obj',
          status: 'success',
          summary: 'done',
          toolsUsed: [],
          totalTurns: 1,
          durationMs: 5,
        }),
        destroy: () => {},
      };

      registry.register(mockAgent);
      expect(registry.subagents()).toHaveLength(1);

      const unregisterResult = registry.unregister('removable-agent');
      expect(unregisterResult).toBe(true);
      expect(registry.subagents()).toHaveLength(0);
      expect(registry.get('removable-agent')).toBeUndefined();

      // Subsequent unregister returns false
      expect(registry.unregister('removable-agent')).toBe(false);
    });

    it('should track activeSubagents signal based on running status', () => {
      const statusA = signal<SubAgentStatus>('idle');
      const statusB = signal<SubAgentStatus>('idle');

      const agentA: SubAgentInstance = {
        config: { id: 'agent-a', name: 'Agent A', description: 'desc A', systemPrompt: 'prompt' },
        status: statusA.asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async () => ({
          subagentId: 'agent-a',
          objective: 'obj',
          status: 'success',
          summary: 'done',
          toolsUsed: [],
          totalTurns: 1,
          durationMs: 5,
        }),
        destroy: () => {},
      };

      const agentB: SubAgentInstance = {
        config: { id: 'agent-b', name: 'Agent B', description: 'desc B', systemPrompt: 'prompt' },
        status: statusB.asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async () => ({
          subagentId: 'agent-b',
          objective: 'obj',
          status: 'success',
          summary: 'done',
          toolsUsed: [],
          totalTurns: 1,
          durationMs: 5,
        }),
        destroy: () => {},
      };

      registry.register(agentA);
      registry.register(agentB);

      expect(registry.activeSubagents()).toHaveLength(0);

      statusA.set('running');
      expect(registry.activeSubagents()).toHaveLength(1);
      expect(registry.activeSubagents()[0].config.id).toBe('agent-a');

      statusB.set('running');
      expect(registry.activeSubagents()).toHaveLength(2);

      statusA.set('completed');
      expect(registry.activeSubagents()).toHaveLength(1);
      expect(registry.activeSubagents()[0].config.id).toBe('agent-b');
    });

    it('should dispatch execution to target subagent and record in executionHistory', async () => {
      let executedTask: SubAgentTask | null = null;

      const mockAgent: SubAgentInstance = {
        config: { id: 'worker-agent', name: 'Worker', description: 'Executes work', systemPrompt: 'prompt' },
        status: signal<SubAgentStatus>('idle').asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async (task) => {
          executedTask = task;
          return {
            subagentId: 'worker-agent',
            objective: task.objective,
            status: 'success',
            summary: `Completed: ${task.objective}`,
            data: { processed: true },
            toolsUsed: ['tool_1'],
            totalTurns: 2,
            durationMs: 45,
          };
        },
        destroy: () => {},
      };

      registry.register(mockAgent);

      const task: SubAgentTask = { objective: 'Process invoice #12345', parameters: { id: 12345 } };
      const result = await registry.execute('worker-agent', task);

      expect(executedTask).toEqual(task);
      expect(result.status).toBe('success');
      expect(result.summary).toBe('Completed: Process invoice #12345');
      expect(result.subagentId).toBe('worker-agent');

      // executionHistory signal updated
      expect(registry.executionHistory()).toHaveLength(1);
      expect(registry.executionHistory()[0]).toEqual(result);
    });

    it('should throw an error when executing an unregistered subagent ID', async () => {
      let error: Error | null = null;
      try {
        await registry.execute('unknown-agent', { objective: 'Do something' });
      } catch (err: any) {
        error = err;
      }

      expect(error).not.toBeNull();
      expect(error?.message).toContain('unknown-agent');
    });
  });

  /* ==========================================================================
     3. createSubAgent Factory & DestroyRef Lifecycle Teardown
     ========================================================================== */
  describe('createSubAgent Factory & Lifecycle', () => {
    let registry: SubAgentRegistryService;
    let webmcp: WebMcpService;

    beforeEach(() => {
      registry = new SubAgentRegistryService();
      webmcp = new WebMcpService({
        enableEmulatorFallback: true,
        logExecutionToConsole: false,
      });
    });

    it('should initialize subagent instance with reactive signals and default state', () => {
      const subagent = createSubAgent(
        {
          id: 'cad-expert',
          name: 'CAD Expert',
          description: 'Parametric CAD generator',
          systemPrompt: 'You design 3D CAD objects.',
          toolFilters: [/^cad_/],
        },
        { registry, webmcp }
      );

      expect(subagent.config.id).toBe('cad-expert');
      expect(subagent.status()).toBe('idle');
      expect(subagent.activeTask()).toBeNull();
      expect(subagent.history()).toEqual([]);

      // Automatically registered in registry
      expect(registry.get('cad-expert')).toBe(subagent);
    });

    it('should automatically unregister and mark status destroyed when DestroyRef fires', () => {
      const mockDestroyRef = new MockDestroyRef();

      const subagent = createSubAgent(
        {
          id: 'ephemeral-agent',
          name: 'Ephemeral Agent',
          description: 'Bound to component lifecycle',
          systemPrompt: 'Ephemeral',
        },
        { registry, webmcp, destroyRef: mockDestroyRef }
      );

      expect(registry.get('ephemeral-agent')).toBe(subagent);
      expect(subagent.status()).toBe('idle');

      // Trigger component/directive unmount
      mockDestroyRef.destroy();

      expect(subagent.status()).toBe('destroyed');
      expect(registry.get('ephemeral-agent')).toBeUndefined();
      expect(registry.subagents()).toHaveLength(0);
    });

    it('should support manual subagent.destroy() teardown idempotently', () => {
      const subagent = createSubAgent(
        {
          id: 'manual-agent',
          name: 'Manual Teardown Agent',
          description: 'Test manual destroy',
          systemPrompt: 'Manual',
        },
        { registry, webmcp }
      );

      expect(registry.get('manual-agent')).toBe(subagent);

      subagent.destroy();
      expect(subagent.status()).toBe('destroyed');
      expect(registry.get('manual-agent')).toBeUndefined();

      // Calling destroy again should not throw
      expect(() => subagent.destroy()).not.toThrow();
    });

    it('should execute task, transition signals (idle -> running -> completed), and record history', async () => {
      let executedTools: string[] = [];

      const subagent = createSubAgent(
        {
          id: 'bi-expert',
          name: 'BI Specialist',
          description: 'Calculates business metrics',
          systemPrompt: 'You analyze business data.',
          handler: async (task, context) => {
            expect(context.subagentId).toBe('bi-expert');
            executedTools.push('tool_run');
            return {
              subagentId: 'bi-expert',
              objective: task.objective,
              status: 'success',
              summary: 'BI metrics analyzed: revenue up 18%',
              data: { growth: 0.18 },
              toolsUsed: ['bi_query_metrics', 'bi_calculate_kpi'],
              totalTurns: 2,
              durationMs: 15,
            };
          },
        },
        { registry, webmcp }
      );

      expect(subagent.status()).toBe('idle');

      const task: SubAgentTask = { objective: 'Analyze quarterly growth' };
      const executionPromise = subagent.execute(task);

      // Verify active task during execution
      expect(subagent.activeTask()).toEqual(task);

      const result = await executionPromise;

      expect(result.status).toBe('success');
      expect(result.summary).toContain('revenue up 18%');
      expect(subagent.status()).toBe('completed');
      expect(subagent.activeTask()).toBeNull();
      expect(subagent.history()).toHaveLength(1);
      expect(subagent.history()[0]).toEqual(result);
    });

    it('should transition status to error and record error result when handler throws', async () => {
      const subagent = createSubAgent(
        {
          id: 'failing-agent',
          name: 'Failing Agent',
          description: 'Throws an error',
          systemPrompt: 'Error simulation',
          handler: async () => {
            throw new Error('LLM connection timed out');
          },
        },
        { registry, webmcp }
      );

      let thrownError: Error | null = null;
      try {
        await subagent.execute({ objective: 'Will fail' });
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe('LLM connection timed out');
      expect(subagent.status()).toBe('error');
      expect(subagent.activeTask()).toBeNull();
      expect(subagent.history()).toHaveLength(1);
      expect(subagent.history()[0].status).toBe('failed');
      expect(subagent.history()[0].error).toBe('LLM connection timed out');
    });

    it('should provide scoped tools and executeTool function in SubAgentExecutionContext', async () => {
      let receivedToolsCount = 0;

      // Register tools into webmcp
      for (const tool of SAMPLE_TOOLS) {
        await webmcp.registerTool(tool);
      }

      const localTool: WebMcpToolDefinition = {
        name: 'custom_local_analysis',
        description: 'Local analysis function',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({ score: 100 }),
      };

      const subagent = createSubAgent(
        {
          id: 'scoped-agent',
          name: 'Scoped Agent',
          description: 'Uses scoped tools',
          systemPrompt: 'Prompt',
          toolFilters: [/^bi_/],
          localTools: [localTool],
          handler: async (task, context) => {
            receivedToolsCount = context.availableTools.length;
            // Execute local tool via context
            const localResult = await context.executeTool<{ score: number }>('custom_local_analysis');
            // Execute filtered global tool via context
            const globalResult = await context.executeTool<{ healthScore: number }>('bi_calculate_kpi', { domain: 'finops' });

            return {
              subagentId: 'scoped-agent',
              objective: task.objective,
              status: 'success',
              summary: `Local score: ${localResult.score}, KPI: ${globalResult.healthScore}`,
              toolsUsed: ['custom_local_analysis', 'bi_calculate_kpi'],
              totalTurns: 2,
              durationMs: 20,
            };
          },
        },
        { registry, webmcp }
      );

      const result = await subagent.execute({ objective: 'Run scoped tool test' });

      // Available tools should be: 2 bi_ tools + 1 local tool = 3 tools
      expect(receivedToolsCount).toBe(3);
      expect(result.status).toBe('success');
      expect(result.summary).toBe('Local score: 100, KPI: 95');
    });
  });

  /* ==========================================================================
     4. Dynamic Orchestrator Delegation Tool Synthesis
     ========================================================================== */
  describe('Dynamic Delegation Tool Synthesis (getDelegationToolDefinition)', () => {
    let registry: SubAgentRegistryService;

    beforeEach(() => {
      registry = new SubAgentRegistryService();
    });

    it('should synthesize OpenAI function tool definition with name delegate_to_subagent', () => {
      const toolDef = getDelegationToolDefinition(registry);

      expect(toolDef.name).toBe('delegate_to_subagent');
      expect(toolDef.description).toContain('specialist subagent');
      expect(toolDef.parameters.type).toBe('object');
      expect(toolDef.parameters.required).toContain('target_subagent');
      expect(toolDef.parameters.required).toContain('objective');
      expect(toolDef.parameters.properties['target_subagent']).toBeDefined();
      expect(toolDef.parameters.properties['objective']).toBeDefined();
    });

    it('should dynamically update target_subagent enum based on active registered subagents', () => {
      const toolDef = getDelegationToolDefinition(registry);

      // Initially empty registry -> empty enum
      const enumInitial = toolDef.parameters.properties['target_subagent'].enum;
      expect(enumInitial).toEqual([]);

      // Register first subagent
      const agent1: SubAgentInstance = {
        config: {
          id: '3d-specialist',
          name: '3D Specialist',
          description: 'Handles 3D CAD & visualizer',
          systemPrompt: '3D prompt',
        },
        status: signal<SubAgentStatus>('idle').asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async () => ({
          subagentId: '3d-specialist',
          objective: 'obj',
          status: 'success',
          summary: 'done 3d',
          toolsUsed: [],
          totalTurns: 1,
          durationMs: 10,
        }),
        destroy: () => {},
      };
      registry.register(agent1);

      // Enum should now contain '3d-specialist'
      const enumAfter1 = toolDef.parameters.properties['target_subagent'].enum;
      expect(enumAfter1).toEqual(['3d-specialist']);

      // Register second subagent
      const agent2: SubAgentInstance = {
        config: {
          id: 'analytics-specialist',
          name: 'Analytics Specialist',
          description: 'Handles BI data & metrics',
          systemPrompt: 'BI prompt',
        },
        status: signal<SubAgentStatus>('idle').asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async () => ({
          subagentId: 'analytics-specialist',
          objective: 'obj',
          status: 'success',
          summary: 'done bi',
          toolsUsed: [],
          totalTurns: 1,
          durationMs: 10,
        }),
        destroy: () => {},
      };
      registry.register(agent2);

      const enumAfter2 = toolDef.parameters.properties['target_subagent'].enum;
      expect(enumAfter2).toEqual(['3d-specialist', 'analytics-specialist']);

      // Unregister first subagent
      registry.unregister('3d-specialist');
      const enumAfterUnregister = toolDef.parameters.properties['target_subagent'].enum;
      expect(enumAfterUnregister).toEqual(['analytics-specialist']);
    });

    it('should dispatch delegation call through tool.handler to the target subagent', async () => {
      const agent: SubAgentInstance = {
        config: {
          id: 'designer-subagent',
          name: 'Designer Subagent',
          description: 'Generates UI layouts',
          systemPrompt: 'Designer prompt',
        },
        status: signal<SubAgentStatus>('idle').asReadonly(),
        activeTask: signal<SubAgentTask | null>(null).asReadonly(),
        history: signal<SubAgentResult[]>([]).asReadonly(),
        execute: async (task) => ({
          subagentId: 'designer-subagent',
          objective: task.objective,
          status: 'success',
          summary: `Created wireframe for ${task.objective}`,
          data: { layout: 'grid', columns: 4 },
          toolsUsed: ['generate_wireframe'],
          totalTurns: 1,
          durationMs: 25,
        }),
        destroy: () => {},
      };

      registry.register(agent);

      const toolDef = getDelegationToolDefinition(registry);

      const delegationParams = {
        target_subagent: 'designer-subagent',
        objective: 'Create dashboard layout',
        parameters: { theme: 'dark' },
        context_hint: 'Prior conversation about dark mode',
      };

      const result = (await toolDef.handler(delegationParams)) as SubAgentResult;

      expect(result.status).toBe('success');
      expect(result.subagentId).toBe('designer-subagent');
      expect(result.summary).toBe('Created wireframe for Create dashboard layout');
      expect(result.data).toEqual({ layout: 'grid', columns: 4 });
    });

    it('should expose createDelegationTool as alias to getDelegationToolDefinition', () => {
      const toolA = getDelegationToolDefinition(registry);
      const toolB = createDelegationTool(registry);

      expect(toolA.name).toBe(toolB.name);
      expect(toolA.parameters.required).toEqual(toolB.parameters.required);
    });

    it('should expose registry.createDelegationTool() helper directly on SubAgentRegistryService', () => {
      const tool = registry.createDelegationTool();
      expect(tool.name).toBe('delegate_to_subagent');
      expect(typeof tool.handler).toBe('function');
    });
  });

  /* ==========================================================================
     5. Public API Exports & Path Mappings Verification
     ========================================================================== */
  describe('Public SDK Export Surface (@cobies/webmcp-angular)', () => {
    it('should export all dynamic subagents types, services, and factory helpers from public-api', async () => {
      const publicApi = await import('../public-api');

      // Services & Tokens
      expect(publicApi.SubAgentRegistryService).toBeDefined();
      expect(publicApi.SUBAGENT_EXECUTION_HANDLER).toBeDefined();

      // Factory Helpers & Functions
      expect(typeof publicApi.createSubAgent).toBe('function');
      expect(typeof publicApi.filterToolsForSubAgent).toBe('function');
      expect(typeof publicApi.createSubAgentToolFilter).toBe('function');
      expect(typeof publicApi.getDelegationToolDefinition).toBe('function');
      expect(typeof publicApi.createDelegationTool).toBe('function');
      expect(publicApi.DELEGATE_TO_SUBAGENT_TOOL_NAME).toBe('delegate_to_subagent');
    });
  });
});

