import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpMemoryInterceptor } from './memory-interceptor';
import { WebMcpMemoryService } from './webmcp-memory.service';
import { WebMcpInMemoryStore } from './in-memory-store';
import { WebMcpBm25SearchEngine } from './bm25-search-engine';
import { WebMcpService } from '../core/webmcp.service';
import { WebMcpExecutionContext, WebMcpHandler } from '../core/webmcp.types';

describe('WebMcpMemoryInterceptor (Passive Observation & Recursion Guard)', () => {
  let store: WebMcpInMemoryStore;
  let searchEngine: WebMcpBm25SearchEngine;
  let memoryService: WebMcpMemoryService;
  let interceptor: WebMcpMemoryInterceptor;

  beforeEach(async () => {
    store = new WebMcpInMemoryStore();
    searchEngine = new WebMcpBm25SearchEngine();
    memoryService = new WebMcpMemoryService(
      { enablePassiveToolCapture: true, autoRegisterTools: false },
      store,
      searchEngine
    );
    await memoryService.init();
    interceptor = new WebMcpMemoryInterceptor(memoryService, { enablePassiveToolCapture: true });
  });

  it('should bypass all mem_* memory tools without capturing to avoid recursion loops', async () => {
    const memoryTools = ['mem_save', 'mem_search', 'mem_context', 'mem_pin', 'mem_unpin', 'mem_session_summary'];

    for (const toolName of memoryTools) {
      const context: WebMcpExecutionContext = {
        toolName,
        parameters: { test: 123 },
      };
      const next: WebMcpHandler = async (ctx) => ({ executed: ctx.toolName });

      const result = await interceptor.intercept(context, next);
      expect(result).toEqual({ executed: toolName });
    }

    // Memory store should have 0 memories (recursion guard prevented any save)
    expect(memoryService.memories().length).toBe(0);
    expect(memoryService.stats().totalCount).toBe(0);
  });

  it('should passively capture successful non-memory tool execution as observation', async () => {
    const context: WebMcpExecutionContext = {
      toolName: 'rotate_camera',
      parameters: { deltaX: 45, deltaY: 30 },
      metadata: { source: 'agent_ui' },
    };
    const next: WebMcpHandler = async (_ctx) => ({ success: true, newAngle: 45 });

    const result = (await interceptor.intercept(context, next)) as { success: boolean; newAngle: number };

    expect(result.success).toBe(true);
    expect(result.newAngle).toBe(45);

    // Memory store should have 1 observation
    const memories = memoryService.memories();
    expect(memories.length).toBe(1);
    expect(memories[0].category).toBe('observation');
    expect(memories[0].topic).toMatch(/^tool_exec[:/]rotate_camera$/);
    expect(memories[0].tags).toContain('passive');
    expect(memories[0].tags).toContain('tool-execution');
    expect(memories[0].tags).toContain('rotate_camera');
    expect(memories[0].content).toContain('rotate_camera');
  });

  it('should capture tool error observations and re-throw original error', async () => {
    const context: WebMcpExecutionContext = {
      toolName: 'fetch_data',
      parameters: { endpoint: '/api/invalid' },
    };
    const next: WebMcpHandler = async () => {
      throw new Error('Network 404: Endpoint not found');
    };

    let caughtError: Error | null = null;
    try {
      await interceptor.intercept(context, next);
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toBe('Network 404: Endpoint not found');

    // Error observation should be saved in memory
    const memories = memoryService.memories();
    expect(memories.length).toBe(1);
    expect(memories[0].category).toBe('observation');
    expect(memories[0].topic).toMatch(/^tool_error[:/]fetch_data$/);
    expect(memories[0].tags).toContain('tool-error');
    expect(memories[0].content).toContain('Network 404');
  });

  it('should do nothing when enablePassiveToolCapture is false', async () => {
    const disabledInterceptor = new WebMcpMemoryInterceptor(memoryService, {
      enablePassiveToolCapture: false,
    });

    const context: WebMcpExecutionContext = {
      toolName: 'cad_draw_shape',
      parameters: { shape: 'cylinder' },
    };
    const next: WebMcpHandler = async () => ({ status: 'drawn' });

    const result = await disabledInterceptor.intercept(context, next);
    expect(result).toEqual({ status: 'drawn' });

    expect(memoryService.memories().length).toBe(0);
  });

  it('should integrate end-to-end with WebMcpService execution pipeline', async () => {
    const webmcp = new WebMcpService(
      {
        enableEmulatorFallback: true,
        logExecutionToConsole: false,
      },
      [interceptor]
    );

    await webmcp.registerTool({
      name: 'calculate_tax',
      description: 'Calculates sales tax',
      parameters: {
        type: 'object',
        properties: { amount: { type: 'number' } },
        required: ['amount'],
      },
      handler: (params: { amount: number }) => ({
        tax: Math.round(params.amount * 0.1),
        total: Math.round(params.amount * 1.1),
      }),
    });

    const toolResult = (await webmcp.executeTool('calculate_tax', { amount: 100 })) as {
      tax: number;
      total: number;
    };

    expect(toolResult.tax).toBe(10);
    expect(toolResult.total).toBe(110);

    // Passive memory observation verified
    expect(memoryService.memories().length).toBe(1);
    expect(memoryService.memories()[0].topic).toMatch(/^tool_exec[:/]calculate_tax$/);
  });
});
