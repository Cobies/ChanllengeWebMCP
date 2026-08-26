import { Signal, WritableSignal, effect, inject } from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import { WebMcpToolDefinition, WebMcpToolParameterSchema } from '../core/webmcp.types';

export interface SignalToolOptions<T> {
  name: string;
  description: string;
  parameters?: WebMcpToolParameterSchema;
  /**
   * Value transformer for converting agent parameters to signal value.
   */
  transform?: (params: Record<string, unknown>) => T;
}

/**
 * Connects a WritableSignal directly to a registered WebMCP tool.
 * When the agent calls the tool, the signal is updated reactively.
 *
 * @example
 * ```typescript
 * const colorSignal = signal('#00ffff');
 * toWebMcpTool(colorSignal, {
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
 */
export function toWebMcpTool<T>(
  targetSignal: WritableSignal<T>,
  options: SignalToolOptions<T>,
  webmcpService?: WebMcpService
): void {
  const service = webmcpService || inject(WebMcpService);

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
}
