import {
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import {
  CreateSubAgentOptions,
  SUBAGENT_EXECUTION_HANDLER,
  SubAgentConfig,
  SubAgentExecutionContext,
  SubAgentExecutionHandler,
  SubAgentInstance,
  SubAgentResult,
  SubAgentStatus,
  SubAgentTask,
} from './subagent.types';
import { filterToolsForSubAgent } from './subagent-tool-scoper';
import { SubAgentRegistryService } from './subagent-registry.service';

function tryInject<T>(token: any): T | undefined {
  try {
    return inject(token, { optional: true }) as T | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Factory helper for instantiating reactive SubAgents with fine-grained signals,
 * automatic DestroyRef lifecycle unregistration, and dynamic tool scoping.
 *
 * @param config Declarative configuration for the subagent.
 * @param options Optional overrides for DestroyRef, SubAgentRegistryService, and WebMcpService.
 * @returns SubAgentInstance with reactive signals and execute/destroy methods.
 */
export function createSubAgent<
  TParams = Record<string, unknown>,
  TData = unknown
>(
  config: SubAgentConfig<TParams, TData>,
  options?: CreateSubAgentOptions<TParams, TData>
): SubAgentInstance<TParams, TData> {
  const destroyRef = options?.destroyRef ?? tryInject(DestroyRef);
  const registry = options?.registry ?? tryInject(SubAgentRegistryService);
  const webmcp = options?.webmcp ?? tryInject(WebMcpService);
  const globalHandler =
    options?.handler ?? tryInject<SubAgentExecutionHandler<TParams, TData>>(SUBAGENT_EXECUTION_HANDLER);

  const _status = signal<SubAgentStatus>('idle');
  const _activeTask = signal<SubAgentTask<TParams> | null>(null);
  const _history = signal<SubAgentResult<TData>[]>([]);

  const defaultHandler: SubAgentExecutionHandler<TParams, TData> = async (task, context) => {
    return {
      subagentId: config.id,
      objective: task.objective,
      status: 'success',
      summary: `SubAgent "${config.name}" (${config.id}) processed objective: "${task.objective}". Scoped tools available: ${context.availableTools.length}.`,
      toolsUsed: [],
      totalTurns: 1,
      durationMs: 0,
    };
  };

  const instance: SubAgentInstance<TParams, TData> = {
    config,
    status: _status.asReadonly(),
    activeTask: _activeTask.asReadonly(),
    history: _history.asReadonly(),

    async execute(task: SubAgentTask<TParams>): Promise<SubAgentResult<TData>> {
      if (_status() === 'destroyed') {
        throw new Error(
          `Cannot execute task on destroyed subagent "${config.id}".`
        );
      }

      _status.set('running');
      _activeTask.set(task);
      const startTime = performance.now();

      const globalTools = webmcp ? webmcp.getTools() : [];
      const availableTools = filterToolsForSubAgent(
        globalTools,
        config.toolFilters,
        config.localTools
      );

      const executeTool = async <T = unknown>(
        name: string,
        params: Record<string, unknown> = {}
      ): Promise<T> => {
        // Check local tools first
        const localTool = config.localTools?.find((t) => t.name === name);
        if (localTool) {
          return (await localTool.handler(params)) as T;
        }

        // Delegate to webmcp service
        if (webmcp && typeof webmcp.executeTool === 'function') {
          return (await webmcp.executeTool(name, params)) as T;
        }

        throw new Error(
          `Tool "${name}" not found in subagent "${config.id}" execution context.`
        );
      };

      const context: SubAgentExecutionContext = {
        subagentId: config.id,
        availableTools,
        executeTool,
        signalState: () => ({
          status: _status(),
          activeTask: _activeTask(),
        }),
      };

      try {
        const handlerToRun =
          config.handler ?? options?.handler ?? globalHandler ?? defaultHandler;

        const result = await handlerToRun(task, context);
        const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

        const finalResult: SubAgentResult<TData> = {
          ...result,
          subagentId: config.id,
          objective: task.objective,
          durationMs: result.durationMs ?? durationMs,
        };

        _status.set('completed');
        _history.update((prev) => [finalResult, ...prev]);
        return finalResult;
      } catch (err: unknown) {
        const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
        const errorMessage = err instanceof Error ? err.message : String(err);

        const failedResult: SubAgentResult<TData> = {
          subagentId: config.id,
          objective: task.objective,
          status: 'failed',
          summary: `SubAgent execution failed: ${errorMessage}`,
          toolsUsed: [],
          totalTurns: 0,
          durationMs,
          error: errorMessage,
        };

        _status.set('error');
        _history.update((prev) => [failedResult, ...prev]);
        throw err;
      } finally {
        _activeTask.set(null);
      }
    },

    destroy(): void {
      if (_status() === 'destroyed') {
        return;
      }

      _status.set('destroyed');
      _activeTask.set(null);

      if (registry) {
        registry.unregister(config.id);
      }
    },
  };

  // Register with SubAgentRegistryService if available
  if (registry) {
    registry.register(instance);
  }

  // Hook automatic lifecycle cleanup with DestroyRef if available
  if (destroyRef) {
    destroyRef.onDestroy(() => {
      instance.destroy();
    });
  }

  return instance;
}
