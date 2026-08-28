import { describe, it, expect } from 'bun:test';
import { Injector } from '@angular/core';
import { provideWebMcp, withInterceptors } from './webmcp.provider';
import { WebMcpService } from './webmcp.service';
import { WebMcpInterceptor, WebMcpExecutionContext, WebMcpHandler } from './webmcp.types';

class SampleLoggingInterceptor implements WebMcpInterceptor {
  async intercept(context: WebMcpExecutionContext, next: WebMcpHandler): Promise<unknown> {
    context.metadata = { ...context.metadata, logged: true };
    return next(context);
  }
}

describe('provideWebMcp and withInterceptors Provider Factory', () => {
  it('should create EnvironmentProviders with default config and WebMcpService', () => {
    const providers = provideWebMcp();
    expect(providers).toBeDefined();

    const injector = Injector.create({
      providers: [providers],
    });

    const service = injector.get(WebMcpService);
    expect(service).toBeDefined();
    expect(service.isReady()).toBe(true);
  });

  it('should configure DI interceptors using withInterceptors and execute pipeline correctly', async () => {
    const auditFn = async (context: WebMcpExecutionContext, next: WebMcpHandler) => {
      const res = (await next(context)) as { value: string };
      return { ...res, audited: true };
    };

    const providers = provideWebMcp(
      { enableEmulatorFallback: true, logExecutionToConsole: false },
      withInterceptors(SampleLoggingInterceptor, auditFn)
    );

    const injector = Injector.create({
      providers: [providers],
    });

    const service = injector.get(WebMcpService);
    expect(service).toBeDefined();

    await service.registerTool({
      name: 'provider_test_tool',
      description: 'Tests provider pipeline',
      parameters: { type: 'object', properties: {} },
      handler: () => ({ value: 'original' }),
    });

    const result = (await service.executeTool('provider_test_tool', {})) as any;
    expect(result.value).toBe('original');
    expect(result.audited).toBe(true);
  });
});
