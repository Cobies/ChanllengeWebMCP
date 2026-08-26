import { Injectable } from '@angular/core';
import { Scene3DActionParams, Scene3DActionResult } from '../core/webmcp.types';

export interface QueuedSceneAction {
  id: string;
  params: Scene3DActionParams;
  resolve: (result: Scene3DActionResult) => void;
  reject: (err: unknown) => void;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export type SceneActionExecutor = (params: Scene3DActionParams) => Promise<Scene3DActionResult>;

@Injectable({
  providedIn: 'root',
})
export class Scene3DActionBus {
  private actionQueue: QueuedSceneAction[] = [];
  private isProcessing = false;
  private executor: SceneActionExecutor | null = null;

  /**
   * Set the active 3D scene action executor (typically the ThreeSceneBridge).
   */
  registerExecutor(executor: SceneActionExecutor): void {
    this.executor = executor;
    this.processQueue();
  }

  /**
   * Unregister the active executor.
   */
  unregisterExecutor(): void {
    this.executor = null;
  }

  /**
   * Enqueue a 3D scene action for execution.
   */
  enqueueAction(params: Scene3DActionParams): Promise<Scene3DActionResult> {
    return new Promise<Scene3DActionResult>((resolve, reject) => {
      const actionId = 'act-3d-' + Math.random().toString(36).substring(2, 9);
      const durationMs = params.durationMs || 500;
      const timeoutLimit = durationMs + 2000; // 2s buffer over duration

      const queued: QueuedSceneAction = {
        id: actionId,
        params,
        resolve,
        reject,
      };

      // Safety timeout in case frame hangs or executor does not finish
      queued.timeoutId = setTimeout(() => {
        const idx = this.actionQueue.findIndex((q) => q.id === actionId);
        if (idx !== -1) {
          this.actionQueue.splice(idx, 1);
        }
        reject(
          new Error(`Scene 3D action '${params.action}' timed out after ${timeoutLimit}ms`)
        );
      }, timeoutLimit);

      this.actionQueue.push(queued);
      this.processQueue();
    });
  }

  /**
   * Process the next action in the queue sequentially.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.actionQueue.length === 0 || !this.executor) {
      return;
    }

    this.isProcessing = true;
    const currentAction = this.actionQueue.shift();
    if (!currentAction) {
      this.isProcessing = false;
      return;
    }

    try {
      const result = await this.executor(currentAction.params);
      if (currentAction.timeoutId) {
        clearTimeout(currentAction.timeoutId);
      }
      currentAction.resolve(result);
    } catch (err: unknown) {
      if (currentAction.timeoutId) {
        clearTimeout(currentAction.timeoutId);
      }
      currentAction.reject(err);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  /**
   * Return number of pending actions in the queue.
   */
  getQueueLength(): number {
    return this.actionQueue.length;
  }

  /**
   * Clear all pending queued actions.
   */
  clearQueue(): void {
    while (this.actionQueue.length > 0) {
      const item = this.actionQueue.shift();
      if (item) {
        if (item.timeoutId) clearTimeout(item.timeoutId);
        item.reject(new Error('Action cancelled: queue cleared'));
      }
    }
    this.isProcessing = false;
  }
}
