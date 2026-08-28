import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpEmulator } from './webmcp.emulator';
import { WebMcpService } from './webmcp.service';
import { WebMcpToolDefinition, WebMcpInterceptor } from './webmcp.types';
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

describe('WebMcpService Interceptor Pipeline', () => {
  let service: WebMcpService;

  beforeEach(() => {
    service = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
  });

  it('should execute DI multi-token interceptors in order', async () => {
    const events: string[] = [];

    const interceptor1: WebMcpInterceptor = {
      async intercept(context, next) {
        events.push('interceptor1:before');
        const res = await next(context);
        events.push('interceptor1:after');
        return res;
      },
    };

    const interceptor2: WebMcpInterceptor = {
      async intercept(context, next) {
        events.push('interceptor2:before');
        const res = await next(context);
        events.push('interceptor2:after');
        return res;
      },
    };

    const diService = new WebMcpService(
      { enableEmulatorFallback: true, logExecutionToConsole: false },
      [interceptor1, interceptor2]
    );

    await diService.registerTool({
      name: 'hello_tool',
      description: 'Greets',
      parameters: { type: 'object', properties: {} },
      handler: () => {
        events.push('handler');
        return 'hello';
      },
    });

    const result = await diService.executeTool('hello_tool', {});
    expect(result).toBe('hello');
    expect(events).toEqual([
      'interceptor1:before',
      'interceptor2:before',
      'handler',
      'interceptor2:after',
      'interceptor1:after',
    ]);
  });

  it('should support dynamic addInterceptor and returned remove callback', async () => {
    const trace: string[] = [];

    await service.registerTool({
      name: 'echo_tool',
      description: 'Echos input',
      parameters: { type: 'object', properties: {} },
      handler: () => 'echo',
    });

    const customInterceptor: WebMcpInterceptor = {
      async intercept(context, next) {
        trace.push(`dynamic:${context.toolName}`);
        return next(context);
      },
    };

    const remove = service.addInterceptor(customInterceptor);

    await service.executeTool('echo_tool', {});
    expect(trace).toEqual(['dynamic:echo_tool']);

    // Remove the interceptor
    remove();

    await service.executeTool('echo_tool', {});
    // Trace should not have grown
    expect(trace).toEqual(['dynamic:echo_tool']);
  });

  it('should allow interceptors to mutate context and parameters before handler execution', async () => {
    await service.registerTool({
      name: 'greet',
      description: 'Greets user',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
      handler: (params: any) => `Hello, ${params.name}!`,
    });

    const sanitizingInterceptor: WebMcpInterceptor = {
      async intercept(context, next) {
        const rawName = String(context.parameters['name'] || '');
        context.parameters['name'] = rawName.trim().toUpperCase();
        return next(context);
      },
    };

    service.addInterceptor(sanitizingInterceptor);

    const result = await service.executeTool('greet', { name: '  world  ' });
    expect(result).toBe('Hello, WORLD!');
  });

  it('should support short-circuiting in interceptor without calling handler', async () => {
    let handlerCalled = false;

    await service.registerTool({
      name: 'cached_query',
      description: 'Expensive query',
      parameters: { type: 'object', properties: {} },
      handler: () => {
        handlerCalled = true;
        return { data: 'fresh' };
      },
    });

    const cachingInterceptor: WebMcpInterceptor = {
      async intercept(context, next) {
        if (context.parameters['useCache'] === true) {
          return { data: 'cached_response', fromCache: true };
        }
        return next(context);
      },
    };

    service.addInterceptor(cachingInterceptor);

    // Call with cache enabled -> short-circuit
    const cachedResult = (await service.executeTool('cached_query', { useCache: true })) as any;
    expect(cachedResult.data).toBe('cached_response');
    expect(cachedResult.fromCache).toBe(true);
    expect(handlerCalled).toBe(false);

    // Call without cache -> handler runs
    const freshResult = (await service.executeTool('cached_query', { useCache: false })) as any;
    expect(freshResult.data).toBe('fresh');
    expect(handlerCalled).toBe(true);
  });

  it('should propagate errors and capture execution logs when error occurs in pipeline', async () => {
    await service.registerTool({
      name: 'buggy_tool',
      description: 'Throws error',
      parameters: { type: 'object', properties: {} },
      handler: () => {
        throw new Error('Database connection failed');
      },
    });

    const auditLogs: string[] = [];
    const auditInterceptor: WebMcpInterceptor = {
      async intercept(context, next) {
        try {
          return await next(context);
        } catch (err: any) {
          auditLogs.push(`caught:${err.message}`);
          throw err; // rethrow
        }
      },
    };

    service.addInterceptor(auditInterceptor);

    let errorThrown = false;
    try {
      await service.executeTool('buggy_tool', {});
    } catch (e: any) {
      errorThrown = true;
      expect(e.message).toBe('Database connection failed');
    }

    expect(errorThrown).toBe(true);
    expect(auditLogs).toEqual(['caught:Database connection failed']);

    // Check service execution logs
    const logs = service.executionLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].toolName).toBe('buggy_tool');
    expect(logs[0].error).toContain('Database connection failed');
    expect(logs[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should support function-based interceptor (WebMcpInterceptorFn) and transform results', async () => {
    await service.registerTool({
      name: 'get_score',
      description: 'Returns raw score',
      parameters: { type: 'object', properties: {} },
      handler: () => 42,
    });

    // Pure functional interceptor that decorates the returned result
    const fnInterceptor = async (context: any, next: any) => {
      context.metadata = { authenticated: true };
      const raw = (await next(context)) as number;
      return { score: raw, meta: context.metadata };
    };

    service.addInterceptor(fnInterceptor);

    const result = (await service.executeTool('get_score', {})) as any;
    expect(result).toEqual({
      score: 42,
      meta: { authenticated: true },
    });
  });

  it('should execute DI interceptors followed by dynamic interceptors in combined pipeline', async () => {
    const sequence: string[] = [];

    const diInterceptor: WebMcpInterceptor = {
      async intercept(context, next) {
        sequence.push('di:in');
        const res = await next(context);
        sequence.push('di:out');
        return res;
      },
    };

    const combinedService = new WebMcpService(
      { enableEmulatorFallback: true, logExecutionToConsole: false },
      [diInterceptor]
    );

    await combinedService.registerTool({
      name: 'order_item',
      description: 'Places order',
      parameters: { type: 'object', properties: {} },
      handler: () => {
        sequence.push('target_handler');
        return 'success';
      },
    });

    const dynamicInterceptor: WebMcpInterceptor = {
      async intercept(context, next) {
        sequence.push('dynamic:in');
        const res = await next(context);
        sequence.push('dynamic:out');
        return res;
      },
    };

    combinedService.addInterceptor(dynamicInterceptor);

    const res = await combinedService.executeTool('order_item', {});
    expect(res).toBe('success');
    expect(sequence).toEqual(['di:in', 'dynamic:in', 'target_handler', 'dynamic:out', 'di:out']);
  });
});
