import { Injectable, Inject, Optional, Injector } from '@angular/core';
import {
  WebMcpInterceptor,
  WebMcpExecutionContext,
  WebMcpHandler,
} from '../core/webmcp.types';
import { WebMcpMemoryService } from './webmcp-memory.service';
import { WebMcpMemoryConfig } from './memory.types';
import { WEBMCP_MEMORY_CONFIG } from './memory.tokens';

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '... [truncated]';
}

/**
 * WebMcpMemoryInterceptor - Passive Execution Interceptor.
 * Captures tool execution outcomes and error telemetry as episodic observations with anti-recursion guards.
 */
@Injectable({ providedIn: 'root' })
export class WebMcpMemoryInterceptor implements WebMcpInterceptor {
  private memoryServiceInstance: WebMcpMemoryService | null = null;
  private readonly config?: Partial<WebMcpMemoryConfig>;

  constructor(
    @Optional() @Inject(Injector) private readonly injector?: Injector | WebMcpMemoryService | null,
    @Optional() @Inject(WEBMCP_MEMORY_CONFIG) config?: Partial<WebMcpMemoryConfig>
  ) {
    this.config = config;
    if (injector && typeof (injector as any).save === 'function') {
      this.memoryServiceInstance = injector as WebMcpMemoryService;
    }
  }

  private getMemoryService(): WebMcpMemoryService | null {
    if (this.memoryServiceInstance) {
      return this.memoryServiceInstance;
    }
    if (this.injector && 'get' in this.injector && typeof this.injector.get === 'function') {
      try {
        this.memoryServiceInstance = this.injector.get(WebMcpMemoryService, null);
      } catch {
        this.memoryServiceInstance = null;
      }
    }
    return this.memoryServiceInstance;
  }

  async intercept(
    context: WebMcpExecutionContext,
    next: WebMcpHandler
  ): Promise<unknown> {
    // 1. Anti-Recursion Loop Guard: Bypass internal memory tool calls
    if (context.toolName.startsWith('mem_') || context.toolName.startsWith('memory_')) {
      return next(context);
    }

    // 2. Configuration check
    if (this.config?.enablePassiveToolCapture === false) {
      return next(context);
    }

    const startTime = Date.now();

    try {
      const result = await next(context);
      const durationMs = Date.now() - startTime;

      let paramStr = '';
      try {
        paramStr = JSON.stringify(context.parameters ?? {});
      } catch {
        paramStr = '[Unserializable Parameters]';
      }

      let resultStr = '';
      try {
        resultStr = JSON.stringify(result ?? {});
      } catch {
        resultStr = '[Unserializable Result]';
      }

      const content = `Tool "${context.toolName}" executed successfully in ${durationMs}ms.\nParameters: ${truncateString(paramStr, 500)}\nResult: ${truncateString(resultStr, 1000)}`;

      const memoryService = this.getMemoryService();
      if (memoryService) {
        try {
          await memoryService.save({
            topic: `tool_exec:${context.toolName}`,
            content,
            category: 'observation',
            tags: ['passive', 'tool-execution', context.toolName],
            metadata: {
              toolName: context.toolName,
              durationMs,
              success: true,
              timestamp: Date.now(),
            },
          });
        } catch (saveErr) {
          // Storage failure during passive capture must not abort execution
          console.warn('[WebMCP Memory] Passive capture observation failed:', saveErr);
        }
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const content = `Tool "${context.toolName}" failed after ${durationMs}ms: ${errorMsg}`;

      const memoryService = this.getMemoryService();
      if (memoryService) {
        try {
          await memoryService.save({
            topic: `tool_error:${context.toolName}`,
            content,
            category: 'observation',
            tags: ['passive', 'tool-error', context.toolName],
            metadata: {
              toolName: context.toolName,
              error: errorMsg,
              durationMs,
              success: false,
              timestamp: Date.now(),
            },
          });
        } catch (saveErr) {
          console.warn('[WebMCP Memory] Passive capture error observation failed:', saveErr);
        }
      }

      throw error;
    }
  }
}
