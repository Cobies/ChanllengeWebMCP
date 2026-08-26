import { BrowserModelContext, WebMcpToolDefinition } from './webmcp.types';
import { validateParameters } from './schema-generator';

/**
 * WebMcpEmulator: An in-memory ModelContext polyfill.
 * Conforms to the standard W3C WebMCP browser runtime interface.
 */
export class WebMcpEmulator implements BrowserModelContext {
  private tools = new Map<string, WebMcpToolDefinition>();
  private eventListeners = new Map<string, Set<(event: CustomEvent) => void>>();

  constructor() {}

  /**
   * Return all currently registered tools.
   */
  async getTools(): Promise<WebMcpToolDefinition[]> {
    return Array.from(this.tools.values());
  }

  /**
   * Register a new tool into the context.
   */
  async registerTool(tool: WebMcpToolDefinition): Promise<void> {
    if (!tool || !tool.name) {
      throw new Error('Invalid tool definition: missing name');
    }
    if (this.tools.has(tool.name)) {
      console.warn(`[WebMCP Emulator] Overwriting existing tool: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    this.dispatchEvent('webmcp:tool-registered', { toolName: tool.name });
  }

  /**
   * Unregister a tool by name.
   */
  async unregisterTool(name: string): Promise<boolean> {
    const existed = this.tools.delete(name);
    if (existed) {
      this.dispatchEvent('webmcp:tool-unregistered', { toolName: name });
    }
    return existed;
  }

  /**
   * Execute a tool by name with parameters.
   * Validates parameters against the tool's schema before invoking the handler.
   */
  async executeTool(name: string, parameters: Record<string, unknown> = {}): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`WebMCP tool not found: '${name}'`);
    }

    // Validate parameters against schema
    if (tool.parameters) {
      const validation = validateParameters(tool.parameters, parameters);
      if (!validation.valid) {
        throw new Error(
          `Validation failed for tool '${name}': ${validation.errors.join('; ')}`
        );
      }
    }

    const startTime = performance.now();
    try {
      const result = await tool.handler(parameters);
      const durationMs = performance.now() - startTime;
      this.dispatchEvent('webmcp:tool-executed', {
        toolName: name,
        parameters,
        result,
        durationMs,
        success: true,
      });
      return result;
    } catch (err: unknown) {
      const durationMs = performance.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.dispatchEvent('webmcp:tool-executed', {
        toolName: name,
        parameters,
        error: errorMessage,
        durationMs,
        success: false,
      });
      throw err;
    }
  }

  addEventListener(type: string, listener: (event: CustomEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: CustomEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private dispatchEvent(type: string, detail: Record<string, unknown>): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event = new CustomEvent(type, { detail });
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.error(`[WebMCP Emulator] Error in event listener for ${type}:`, e);
        }
      });
    }

    // Also dispatch to window if in browser environment
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent(type, { detail }));
      } catch {
        // Safe ignore
      }
    }
  }

  /**
   * Mount this emulator to window.modelContext or globalThis.modelContext
   * if no native implementation is present.
   */
  install(target: any = typeof window !== 'undefined' ? window : globalThis): void {
    if (!target.modelContext) {
      target.modelContext = this;
    }
  }
}
