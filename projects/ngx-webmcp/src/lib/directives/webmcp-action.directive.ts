import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  inject,
} from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';

/**
 * Exposes a clickable DOM element as a registered WebMCP tool action
 * or dispatches a tool execution on element click.
 *
 * @example
 * ```html
 * <button
 *   webmcpAction="reset_simulation"
 *   actionDescription="Resets the current 3D physics and visual simulation"
 *   (click)="onReset()">
 *   Reset
 * </button>
 * ```
 */
@Directive({
  selector: '[webmcpAction]',
  standalone: true,
})
export class WebmcpActionDirective implements OnInit, OnDestroy {
  private readonly webmcp = inject(WebMcpService);
  private readonly el = inject(ElementRef<HTMLElement>);

  @Input('webmcpAction') actionName!: string;
  @Input() actionDescription = 'Triggers an interactive element action';

  ngOnInit(): void {
    if (this.actionName) {
      this.webmcp.registerTool({
        name: this.actionName,
        description: this.actionDescription,
        parameters: {
          type: 'object',
          properties: {},
        },
        handler: () => {
          this.el.nativeElement.click();
          return {
            success: true,
            action: this.actionName,
            element: this.el.nativeElement.tagName.toLowerCase(),
          };
        },
      });
    }
  }

  ngOnDestroy(): void {
    if (this.actionName) {
      this.webmcp.unregisterTool(this.actionName);
    }
  }
}
