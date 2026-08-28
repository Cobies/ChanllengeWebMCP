import { Injectable, Inject, Optional, InjectionToken, signal, computed } from '@angular/core';
import {
  BrowserModelContext,
  WebMcpConfig,
  WebMcpExecutionLog,
  WebMcpToolDefinition,
} from './webmcp.types';
import { WebMcpEmulator } from './webmcp.emulator';

export const WEBMCP_CONFIG = new InjectionToken<WebMcpConfig>('WEBMCP_CONFIG');

const DEFAULT_CONFIG: WebMcpConfig = {
  enableEmulatorFallback: true,
  enableBuiltInScreenshot: true,
  logExecutionToConsole: true,
};

@Injectable({
  providedIn: 'root',
})
export class WebMcpService {
  private config: WebMcpConfig;
  private context: BrowserModelContext;
  private readonly _isNativeContext = signal<boolean>(false);
  private readonly _tools = signal<Map<string, WebMcpToolDefinition>>(new Map());
  private readonly _logs = signal<WebMcpExecutionLog[]>([]);
  private readonly _isReady = signal<boolean>(false);

  /**
   * Signal exposing whether the current session is using a native browser modelContext.
   */
  readonly isNativeContext = this._isNativeContext.asReadonly();

  /**
   * Reactive signal with all currently registered tools.
   */
  readonly registeredTools = computed(() => Array.from(this._tools().values()));

  /**
   * Reactive signal with the history of all tool executions.
   */
  readonly executionLogs = this._logs.asReadonly();

  /**
   * Reactive signal indicating initialization state.
   */
  readonly isReady = this._isReady.asReadonly();

  constructor(@Optional() @Inject(WEBMCP_CONFIG) config?: WebMcpConfig) {
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) };
    this.context = this.resolveContext();
    this.initContextListeners();
    this._isReady.set(true);
  }

  /**
   * Detect and resolve native or emulated ModelContext.
   */
  private resolveContext(): BrowserModelContext {
    const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : undefined;

    // Check for native window.modelContext or navigator.modelContext
    const nativeContext = win?.modelContext || nav?.modelContext;

    if (nativeContext && typeof nativeContext.registerTool === 'function') {
      this._isNativeContext.set(true);
      if (this.config.logExecutionToConsole) {
        console.log('%c[WebMCP] Native browser ModelContext detected.', 'color: #10b981; font-weight: bold;');
      }
      return nativeContext;
    }

    // Fallback to in-memory emulator
    this._isNativeContext.set(false);
    const emulator = new WebMcpEmulator();
    if (this.config.enableEmulatorFallback) {
      emulator.install(win);
      if (this.config.logExecutionToConsole) {
        console.log('%c[WebMCP] In-memory fallback WebMcpEmulator activated.', 'color: #3b82f6; font-weight: bold;');
      }
    }
    return emulator;
  }

  private initContextListeners(): void {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('webmcp:tool-executed', (event: any) => {
        const detail = event.detail;
        if (detail && detail.toolName) {
          // If not already logged from executeTool
          const existing = this._logs().find(
            (l) => l.toolName === detail.toolName && Math.abs(l.timestamp - Date.now()) < 500
          );
          if (!existing) {
            this.addLog({
              id: 'log-' + Math.random().toString(36).substring(2, 9),
              toolName: detail.toolName,
              parameters: detail.parameters || {},
              result: detail.result,
              error: detail.error,
              timestamp: Date.now(),
              durationMs: detail.durationMs || 0,
              source: this._isNativeContext() ? 'native' : 'emulator',
            });
          }
        }
      });
    }
  }

  /**
   * Register a new tool with the WebMCP context.
   */
  async registerTool<TParams = Record<string, unknown>, TResult = unknown>(
    tool: WebMcpToolDefinition<TParams, TResult>
  ): Promise<void> {
    if (!tool || !tool.name) {
      throw new Error('Cannot register tool without a valid name');
    }

    this._tools.update((current) => {
      const next = new Map(current);
      next.set(tool.name, tool as unknown as WebMcpToolDefinition);
      return next;
    });

    await this.context.registerTool(tool as unknown as WebMcpToolDefinition);

    if (this.config.logExecutionToConsole) {
      console.log(`%c[WebMCP] Registered tool: ${tool.name}`, 'color: #8b5cf6;');
    }
  }

  /**
   * Unregister a tool by name.
   */
  async unregisterTool(toolName: string): Promise<boolean> {
    this._tools.update((current) => {
      const next = new Map(current);
      next.delete(toolName);
      return next;
    });
    const success = await this.context.unregisterTool(toolName);
    return !!success;
  }

  /**
   * Get a registered tool by name.
   */
  getTool(toolName: string): WebMcpToolDefinition | undefined {
    return this._tools().get(toolName);
  }

  /**
   * Return array of all currently registered tools.
   */
  getTools(): WebMcpToolDefinition[] {
    return Array.from(this._tools().values());
  }

  /**
   * Execute a tool programmatically (e.g. from UI simulation or direct invocation).
   */
  async executeTool<TResult = unknown>(
    toolName: string,
    parameters: Record<string, unknown> = {},
    source: 'native' | 'emulator' | 'ui' = 'ui'
  ): Promise<TResult> {
    const startTime = performance.now();
    const logId = 'log-' + Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();

    try {
      const result = (await this.context.executeTool(toolName, parameters)) as TResult;
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

      // Prevent duplicate log insertion if window event listener already logged the execution
      const existing = this._logs().find(
        (l) => l.toolName === toolName && Math.abs(l.timestamp - timestamp) < 500
      );
      if (!existing) {
        this.addLog({
          id: logId,
          toolName,
          parameters,
          result,
          timestamp,
          durationMs,
          source,
        });
      }

      if (this.config.logExecutionToConsole) {
        console.log(
          `%c[WebMCP Exec] %c${toolName} %c(${durationMs}ms)`,
          'color: #06b6d4; font-weight: bold;',
          'color: #10b981; font-weight: bold;',
          'color: #94a3b8;',
          { parameters, result }
        );
      }

      return result;
    } catch (err: unknown) {
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Prevent duplicate log insertion if window event listener already logged the execution
      const existing = this._logs().find(
        (l) => l.toolName === toolName && Math.abs(l.timestamp - timestamp) < 500
      );
      if (!existing) {
        this.addLog({
          id: logId,
          toolName,
          parameters,
          error: errorMessage,
          timestamp,
          durationMs,
          source,
        });
      }

      if (this.config.logExecutionToConsole) {
        console.error(
          `%c[WebMCP Error] %c${toolName}: ${errorMessage}`,
          'color: #ef4444; font-weight: bold;',
          'color: #f87171;'
        );
      }

      throw err;
    }
  }

  private addLog(log: WebMcpExecutionLog): void {
    this._logs.update((current) => [log, ...current].slice(0, 100)); // Keep last 100 entries
  }

  /**
   * Clear all execution logs.
   */
  clearLogs(): void {
    this._logs.set([]);
  }
}
