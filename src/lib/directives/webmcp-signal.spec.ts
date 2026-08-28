import { describe, it, expect, beforeEach } from 'bun:test';
import { signal, DestroyRef } from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import { toWebMcpTool } from './webmcp-signal';

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

describe('toWebMcpTool Lifecycle & Teardown', () => {
  let webmcp: WebMcpService;

  beforeEach(() => {
    webmcp = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
  });

  it('should automatically unregister tool when explicit destroyRef parameter triggers destruction', async () => {
    const mockDestroyRef = new MockDestroyRef();
    const colorSignal = signal<string>('#ff0000');

    toWebMcpTool(
      colorSignal,
      {
        name: 'vehicle_color',
        description: 'Updates exterior color',
        parameters: {
          type: 'object',
          properties: { color: { type: 'string' } },
        },
        transform: (p) => String(p['color']),
      },
      webmcp,
      mockDestroyRef
    );

    expect(webmcp.getTool('vehicle_color')).toBeDefined();
    expect(webmcp.getTools().some((t) => t.name === 'vehicle_color')).toBe(true);

    // Trigger component/directive destruction
    mockDestroyRef.destroy();

    expect(webmcp.getTool('vehicle_color')).toBeUndefined();
    expect(webmcp.getTools().some((t) => t.name === 'vehicle_color')).toBe(false);
  });

  it('should automatically unregister tool when options.destroyRef triggers destruction', async () => {
    const mockDestroyRef = new MockDestroyRef();
    const zoomSignal = signal<number>(1.0);

    toWebMcpTool(
      zoomSignal,
      {
        name: 'camera_zoom',
        description: 'Sets camera zoom level',
        parameters: {
          type: 'object',
          properties: { level: { type: 'number' } },
        },
        transform: (p) => Number(p['level']),
        destroyRef: mockDestroyRef,
      },
      webmcp
    );

    expect(webmcp.getTool('camera_zoom')).toBeDefined();

    mockDestroyRef.destroy();

    expect(webmcp.getTool('camera_zoom')).toBeUndefined();
  });

  it('should return an imperative unregister callback () => Promise<boolean>', async () => {
    const activeSignal = signal<boolean>(true);

    const unregister = toWebMcpTool(
      activeSignal,
      {
        name: 'toggle_engine',
        description: 'Toggles vehicle engine',
        parameters: {
          type: 'object',
          properties: { active: { type: 'boolean' } },
        },
        transform: (p) => Boolean(p['active']),
      },
      webmcp
    );

    expect(typeof unregister).toBe('function');
    expect(webmcp.getTool('toggle_engine')).toBeDefined();

    const result = await unregister();
    expect(result).toBe(true);
    expect(webmcp.getTool('toggle_engine')).toBeUndefined();
  });

  it('should make subsequent calls to imperative unregister idempotent', async () => {
    const countSignal = signal<number>(0);

    const unregister = toWebMcpTool(
      countSignal,
      {
        name: 'increment_counter',
        description: 'Increments counter',
      },
      webmcp
    );

    const first = await unregister();
    expect(first).toBe(true);
    expect(webmcp.getTool('increment_counter')).toBeUndefined();

    // Calling again should resolve safely to true
    const second = await unregister();
    expect(second).toBe(true);
  });

  it('should gracefully register tool without error outside injection context when no DestroyRef is provided', async () => {
    const textSignal = signal<string>('initial');

    const unregister = toWebMcpTool(
      textSignal,
      {
        name: 'update_text',
        description: 'Updates text value',
      },
      webmcp
    );

    expect(webmcp.getTool('update_text')).toBeDefined();
    await webmcp.executeTool('update_text', { value: 'updated' });
    expect(textSignal()).toBe('updated');

    await unregister();
    expect(webmcp.getTool('update_text')).toBeUndefined();
  });

  it('should handle unregister before destroyRef fires without crashing when destroyRef later fires', async () => {
    const mockDestroyRef = new MockDestroyRef();
    const modeSignal = signal<string>('draft');

    const unregister = toWebMcpTool(
      modeSignal,
      {
        name: 'set_mode',
        description: 'Sets application mode',
        destroyRef: mockDestroyRef,
      },
      webmcp
    );

    // Manually unregister first
    const unregisterResult = await unregister();
    expect(unregisterResult).toBe(true);
    expect(webmcp.getTool('set_mode')).toBeUndefined();

    // Now fire DestroyRef onDestroy
    expect(() => mockDestroyRef.destroy()).not.toThrow();
  });

  it('should reject executeTool after tool has been unregistered', async () => {
    const statusSignal = signal<string>('pending');

    const unregister = toWebMcpTool(
      statusSignal,
      {
        name: 'set_status',
        description: 'Sets status',
      },
      webmcp
    );

    // Execute when registered succeeds
    await webmcp.executeTool('set_status', { value: 'in-progress' });
    expect(statusSignal()).toBe('in-progress');

    // Unregister tool
    await unregister();

    // Now executing should throw
    let errorCaught = false;
    try {
      await webmcp.executeTool('set_status', { value: 'completed' });
    } catch (e: any) {
      errorCaught = true;
      expect(e.message).toContain('not found');
    }
    expect(errorCaught).toBe(true);
    // Value remains unchanged
    expect(statusSignal()).toBe('in-progress');
  });

  it('should selectively destroy only the signal bound to the triggered DestroyRef', async () => {
    const refA = new MockDestroyRef();
    const refB = new MockDestroyRef();

    const signalA = signal<string>('A');
    const signalB = signal<string>('B');

    toWebMcpTool(
      signalA,
      { name: 'tool_a', description: 'Tool A', destroyRef: refA },
      webmcp
    );

    toWebMcpTool(
      signalB,
      { name: 'tool_b', description: 'Tool B', destroyRef: refB },
      webmcp
    );

    expect(webmcp.getTool('tool_a')).toBeDefined();
    expect(webmcp.getTool('tool_b')).toBeDefined();

    // Destroy refA only
    refA.destroy();

    expect(webmcp.getTool('tool_a')).toBeUndefined();
    expect(webmcp.getTool('tool_b')).toBeDefined();

    // tool_b can still be executed
    await webmcp.executeTool('tool_b', { value: 'B_updated' });
    expect(signalB()).toBe('B_updated');

    // Destroy refB
    refB.destroy();
    expect(webmcp.getTool('tool_b')).toBeUndefined();
  });
});
