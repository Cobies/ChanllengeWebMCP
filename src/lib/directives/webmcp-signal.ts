import { DestroyRef, WritableSignal, inject } from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import type { SignalToolOptions, WebMcpToolParameterSchema } from '../core/webmcp.types';

export type { SignalToolOptions };

/**
 * Connects a WritableSignal directly to a registered WebMCP tool.
 * When the agent calls the tool, the signal is updated reactively.
 * Automatically handles lifecycle unregistration when DestroyRef fires.
 *
 * @example
 * ```typescript
 * const colorSignal = signal('#00ffff');
 * const unregister = toWebMcpTool(colorSignal, {
 *   name: 'set_vehicle_color',
 *   description: 'Sets the vehicle exterior color in hex format',
 *   parameters: {
 *     type: 'object',
 *     properties: { color: { type: 'string' } },
 *     required: ['color']
 *   },
 *   transform: (p) => String(p['color'])
 * });
 * ```
 *
 * @returns An imperative unregister teardown callback: () => Promise<boolean>
 */
export function toWebMcpTool<T>(
  targetSignal: WritableSignal<T>,
  options: SignalToolOptions<T>,
  webmcpService?: WebMcpService,
  destroyRef?: DestroyRef
): () => Promise<boolean> {
  const service = webmcpService || inject(WebMcpService);

  // 4-tier DestroyRef resolution cascade:
  // 1. Explicit parameter destroyRef
  // 2. Options destroyRef (options.destroyRef)
  // 3. Ambient injection context inject(DestroyRef, { optional: true })
  // 4. Graceful null fallback
  let dRef: DestroyRef | null = destroyRef ?? options.destroyRef ?? null;
  if (!dRef) {
    try {
      dRef = inject(DestroyRef, { optional: true });
    } catch {
      dRef = null;
    }
  }

  const parameters: WebMcpToolParameterSchema = options.parameters || {
    type: 'object',
    properties: {
      value: {
        type: 'string',
        description: `New value for ${options.name}`,
      },
    },
    required: ['value'],
  };

  service.registerTool({
    name: options.name,
    description: options.description,
    parameters,
    handler: (params: Record<string, unknown>) => {
      const val = options.transform ? options.transform(params) : (params['value'] as T);
      targetSignal.set(val);
      return {
        success: true,
        tool: options.name,
        newValue: targetSignal(),
      };
    },
  });

  // Idempotent unregister teardown callback
  let isUnregistered = false;
  const unregister = async (): Promise<boolean> => {
    if (isUnregistered) {
      return true;
    }
    isUnregistered = true;
    return await service.unregisterTool(options.name);
  };

  // Bind teardown hook if DestroyRef was resolved
  if (dRef) {
    dRef.onDestroy(() => {
      void unregister();
    });
  }

  return unregister;
}
