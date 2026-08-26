import { describe, it, expect, beforeEach } from 'bun:test';
import { signal } from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import { toWebMcpTool } from './webmcp-signal';

describe('WebMCP Directives & Signal Bridge', () => {
  let webmcp: WebMcpService;

  beforeEach(() => {
    webmcp = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
  });

  it('toWebMcpTool should bind a WritableSignal to WebMCP tool invocations', async () => {
    const activeColor = signal<string>('#ffffff');

    toWebMcpTool(
      activeColor,
      {
        name: 'set_vehicle_color',
        description: 'Updates exterior vehicle color',
        parameters: {
          type: 'object',
          properties: {
            color: { type: 'string', description: 'Hex color string' },
          },
          required: ['color'],
        },
        transform: (p) => String(p['color']),
      },
      webmcp
    );

    const tools = webmcp.getTools();
    expect(tools.some((t) => t.name === 'set_vehicle_color')).toBe(true);

    // Initial signal value
    expect(activeColor()).toBe('#ffffff');

    // Simulate tool execution by agent
    const result = (await webmcp.executeTool(
      'set_vehicle_color',
      { color: '#00e5ff' },
      'ui'
    )) as any;

    expect(result.success).toBe(true);
    expect(activeColor()).toBe('#00e5ff');
  });

  it('toWebMcpTool should support numeric signal transforms', async () => {
    const zoomLevel = signal<number>(1.0);

    toWebMcpTool(
      zoomLevel,
      {
        name: 'set_zoom',
        description: 'Adjusts camera zoom',
        parameters: {
          type: 'object',
          properties: {
            level: { type: 'number' },
          },
          required: ['level'],
        },
        transform: (p) => Number(p['level']),
      },
      webmcp
    );

    await webmcp.executeTool('set_zoom', { level: 2.5 });
    expect(zoomLevel()).toBe(2.5);
  });
});
