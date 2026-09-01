import { Injectable, signal, computed, Signal } from '@angular/core';
import { WebMcpToolDefinition } from '../core/webmcp.types';
import {
  SubAgentInstance,
  SubAgentTask,
  SubAgentResult,
  DelegationToolOptions,
} from './subagent.types';
import { getDelegationToolDefinition } from './subagent-delegation-tool';

/**
 * Root-level SubAgent Registry Service.
 * Manages the lifecycle of active subagents, exposes reactive signals for UI binding,
 * and handles execution dispatching and delegation tool synthesis.
 */
@Injectable({
  providedIn: 'root',
})
export class SubAgentRegistryService {
  private readonly _subagents = signal<Map<string, SubAgentInstance>>(new Map());
  private readonly _executionHistory = signal<SubAgentResult[]>([]);

  /**
   * Reactive signal with all currently registered subagent instances.
   */
  readonly subagents: Signal<SubAgentInstance[]> = computed(() =>
    Array.from(this._subagents().values())
  );

  /**
   * Reactive signal with subagents that are currently in 'running' status.
   */
  readonly activeSubagents: Signal<SubAgentInstance[]> = computed(() =>
    this.subagents().filter((agent) => agent.status() === 'running')
  );

  /**
   * Reactive signal tracking tasks actively executing across all subagents.
   */
  readonly activeTasks: Signal<SubAgentTask[]> = computed(() =>
    this.subagents()
      .map((agent) => agent.activeTask())
      .filter((task): task is SubAgentTask => task !== null)
  );

  /**
   * Reactive signal exposing history of subagent execution receipts.
   */
  readonly executionHistory: Signal<SubAgentResult[]> = this._executionHistory.asReadonly();

  /**
   * Register a new SubAgent instance into the registry.
   * Throws an error if a subagent with the same ID is already registered.
   */
  register(subagent: SubAgentInstance): void {
    if (!subagent || !subagent.config || !subagent.config.id) {
      throw new Error('Cannot register subagent without a valid configuration and id.');
    }

    if (this._subagents().has(subagent.config.id)) {
      throw new Error(
        `SubAgent with id "${subagent.config.id}" is already registered. Unregister the existing instance first.`
      );
    }

    this._subagents.update((current) => {
      const next = new Map(current);
      next.set(subagent.config.id, subagent);
      return next;
    });
  }

  /**
   * Unregister a SubAgent instance by ID.
   * @returns boolean indicating whether the subagent was found and removed.
   */
  unregister(id: string): boolean {
    if (!id || !this._subagents().has(id)) {
      return false;
    }

    this._subagents.update((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });

    return true;
  }

  /**
   * Get a registered SubAgent instance by ID.
   */
  get(id: string): SubAgentInstance | undefined {
    return this._subagents().get(id);
  }

  /**
   * Get array of all registered SubAgent instances.
   */
  getSubagents(): SubAgentInstance[] {
    return Array.from(this._subagents().values());
  }

  /**
   * Dispatch a task to a registered SubAgent and record the result in executionHistory.
   */
  async execute<TParams extends Record<string, unknown> = Record<string, unknown>, TData = unknown>(
    subagentId: string,
    task: SubAgentTask<TParams>
  ): Promise<SubAgentResult<TData>> {
    const subagent = this.get(subagentId);
    if (!subagent) {
      throw new Error(
        `SubAgent with id "${subagentId}" is not registered in SubAgentRegistryService.`
      );
    }

    const result = await subagent.execute(task as any);

    this._executionHistory.update((current) => [
      result as SubAgentResult,
      ...current,
    ].slice(0, 100));

    return result as SubAgentResult<TData>;
  }

  /**
   * Synthesize a WebMCP Tool Definition for delegating tasks from orchestrator agent.
   */
  createDelegationTool(options?: DelegationToolOptions): WebMcpToolDefinition<any, any> {
    return getDelegationToolDefinition(this, options);
  }

  /**
   * Alias for createDelegationTool.
   */
  getDelegationToolDefinition(options?: DelegationToolOptions): WebMcpToolDefinition<any, any> {
    return getDelegationToolDefinition(this, options);
  }

  /**
   * Clear execution history logs.
   */
  clearHistory(): void {
    this._executionHistory.set([]);
  }
}
