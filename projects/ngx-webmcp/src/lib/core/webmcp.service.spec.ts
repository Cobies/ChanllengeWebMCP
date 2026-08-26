import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpEmulator } from './webmcp.emulator';
import { WebMcpService } from './webmcp.service';
import { WebMcpToolDefinition } from './webmcp.types';
import { validateParameters } from './schema-generator';

describe('WebMcpEmulator & Schema Validation', () => {
  let emulator: WebMcpEmulator;

  beforeEach(() => {
    emulator = new WebMcpEmulator();
  });

  it('should register a tool and retrieve it via getTools()', async () => {
    const testTool: WebMcpToolDefinition = {
      name: 'test_action',
      description: 'Performs a test action',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Query text' },
        },
        required: ['query'],
      },
      handler: (params) => ({ echo: params['query'] }),
    };

    await emulator.registerTool(testTool);
    const tools = await emulator.getTools();
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe('test_action');
  });

  it('should execute a tool with valid parameters', async () => {
    const addTool: WebMcpToolDefinition = {
      name: 'add_numbers',
      description: 'Adds two numbers',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['a', 'b'],
      },
      handler: (params: any) => ({ sum: params.a + params.b }),
    };

    await emulator.registerTool(addTool);
    const result = (await emulator.executeTool('add_numbers', { a: 10, b: 25 })) as any;
    expect(result.sum).toBe(35);
  });

  it('should reject execution when required parameters are missing (Threat Matrix)', async () => {
    const secureTool: WebMcpToolDefinition = {
      name: 'secure_op',
      description: 'A secure operation',
      parameters: {
        type: 'object',
        properties: {
          authKey: { type: 'string' },
        },
        required: ['authKey'],
      },
      handler: (params) => ({ authorized: true }),
    };

    await emulator.registerTool(secureTool);

    let errorCaught = false;
    try {
      await emulator.executeTool('secure_op', {});
    } catch (e: any) {
      errorCaught = true;
      expect(e.message).toContain("Missing required parameter: 'authKey'");
    }
    expect(errorCaught).toBe(true);
  });

  it('should reject parameters with invalid types or disallowed enum values', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        mode: { type: 'string' as const, enum: ['active', 'idle'] },
        count: { type: 'integer' as const },
      },
      required: ['mode', 'count'],
    };

    // Invalid enum
    const res1 = validateParameters(schema, { mode: 'invalid_mode', count: 5 });
    expect(res1.valid).toBe(false);
    expect(res1.errors[0]).toContain("is not in allowed values: [active, idle]");

    // Invalid type (float instead of integer)
    const res2 = validateParameters(schema, { mode: 'active', count: 3.14 });
    expect(res2.valid).toBe(false);
    expect(res2.errors[0]).toContain("must be an integer");

    // Valid
    const res3 = validateParameters(schema, { mode: 'active', count: 42 });
    expect(res3.valid).toBe(true);
  });

  it('should unregister tools cleanly', async () => {
    const tempTool: WebMcpToolDefinition = {
      name: 'temp_tool',
      description: 'Temporary tool',
      parameters: { type: 'object', properties: {} },
      handler: () => ({ status: 'ok' }),
    };

    await emulator.registerTool(tempTool);
    expect((await emulator.getTools()).length).toBe(1);

    const unregistered = await emulator.unregisterTool('temp_tool');
    expect(unregistered).toBe(true);
    expect((await emulator.getTools()).length).toBe(0);
  });
});

describe('WebMcpService', () => {
  let service: WebMcpService;

  beforeEach(() => {
    service = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
  });

  it('should initialize with signals', () => {
    expect(service.isReady()).toBe(true);
    expect(service.registeredTools().length).toBe(0);
    expect(service.executionLogs().length).toBe(0);
  });

  it('should register tool and update registeredTools signal', async () => {
    await service.registerTool({
      name: 'ping',
      description: 'Returns pong',
      parameters: { type: 'object', properties: {} },
      handler: () => 'pong',
    });

    expect(service.registeredTools().length).toBe(1);
    expect(service.getTool('ping')?.name).toBe('ping');
  });

  it('should execute tool and record execution logs in signal', async () => {
    await service.registerTool({
      name: 'calculate',
      description: 'Multiplies input',
      parameters: {
        type: 'object',
        properties: { val: { type: 'number' } },
      },
      handler: (p: any) => ({ doubled: p.val * 2 }),
    });

    const res = (await service.executeTool('calculate', { val: 21 }, 'ui')) as any;
    expect(res.doubled).toBe(42);

    const logs = service.executionLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].toolName).toBe('calculate');
    expect(logs[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should capture and log errors when tool handler throws', async () => {
    await service.registerTool({
      name: 'failing_tool',
      description: 'Throws error',
      parameters: { type: 'object', properties: {} },
      handler: () => {
        throw new Error('Simulation fault');
      },
    });

    let failed = false;
    try {
      await service.executeTool('failing_tool', {}, 'ui');
    } catch {
      failed = true;
    }

    expect(failed).toBe(true);
    const logs = service.executionLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].error).toContain('Simulation fault');
  });
});
