import { Injectable, inject } from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import {
  TakeScreenshotParams,
  TakeScreenshotResult,
  WebMcpToolDefinition,
} from '../core/webmcp.types';
import { CanvasRasterizer } from './canvas-rasterizer';

@Injectable({
  providedIn: 'root',
})
export class WebmcpViewportCaptureService {
  private readonly webmcp: WebMcpService;

  constructor(webmcp?: WebMcpService) {
    this.webmcp = webmcp || inject(WebMcpService);
    this.registerScreenshotTool();
  }

  /**
   * Register the `take_screenshot` tool with the WebMCP service.
   */
  private registerScreenshotTool(): void {
    const screenshotTool: WebMcpToolDefinition<TakeScreenshotParams, TakeScreenshotResult> = {
      name: 'take_screenshot',
      description:
        'Captures a high-resolution base64 snapshot of the active 3D WebGL viewport or any DOM element.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of target element or canvas (default: "canvas, body")',
          },
          format: {
            type: 'string',
            description: 'Image MIME format: "image/png", "image/jpeg", or "image/webp"',
            enum: ['image/png', 'image/jpeg', 'image/webp'],
            default: 'image/png',
          },
          quality: {
            type: 'number',
            description: 'Compression quality from 0.1 to 1.0 (for jpeg/webp)',
            default: 0.92,
          },
        },
      },
      handler: async (params: TakeScreenshotParams) => {
        return await this.takeScreenshot(params);
      },
    };

    this.webmcp.registerTool(screenshotTool);
  }

  /**
   * Programmatically capture a screenshot.
   */
  async takeScreenshot(params: TakeScreenshotParams = {}): Promise<TakeScreenshotResult> {
    return await CanvasRasterizer.captureElement(params);
  }
}
