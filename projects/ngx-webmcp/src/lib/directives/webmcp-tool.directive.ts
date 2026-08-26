import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import { WebMcpToolParameterSchema } from '../core/webmcp.types';

/**
 * Declarative Angular Directive to register a component method or handler as a WebMCP Tool.
 *
 * @example
 * ```html
 * <div
 *   webmcpTool
 *   toolName="set_theme"
 *   toolDescription="Switches the active UI color theme"
 *   [toolParameters]="{
 *     type: 'object',
 *     properties: { theme: { type: 'string', enum: ['dark', 'light', 'cyber'] } },
 *     required: ['theme']
 *   }"
 *   (toolInvoked)="handleSetTheme($event)">
 * </div>
 * ```
 */
@Directive({
  selector: '[webmcpTool]',
  standalone: true,
})
export class WebmcpToolDirective implements OnInit, OnDestroy {
  private readonly webmcp = inject(WebMcpService);

  @Input({ required: true }) toolName!: string;
  @Input({ required: true }) toolDescription!: string;
  @Input() toolParameters: WebMcpToolParameterSchema = {
    type: 'object',
    properties: {},
  };

  /**
   * Custom handler function. If provided, its return value will be passed back to the agent.
   */
  @Input() toolHandler?: (params: Record<string, unknown>) => Promise<unknown> | unknown;

  /**
   * Event emitted when an agent calls this tool.
   */
  @Output() toolInvoked = new EventEmitter<Record<string, unknown>>();

  ngOnInit(): void {
    if (!this.toolName) {
      console.error('[webmcpTool] toolName is required');
      return;
    }

    this.webmcp.registerTool({
      name: this.toolName,
      description: this.toolDescription,
      parameters: this.toolParameters,
      handler: async (params: Record<string, unknown>) => {
        if (this.toolHandler) {
          return await this.toolHandler(params);
        }
        this.toolInvoked.emit(params);
        return { success: true, tool: this.toolName, executedAt: Date.now() };
      },
    });
  }

  ngOnDestroy(): void {
    if (this.toolName) {
      this.webmcp.unregisterTool(this.toolName);
    }
  }
}
