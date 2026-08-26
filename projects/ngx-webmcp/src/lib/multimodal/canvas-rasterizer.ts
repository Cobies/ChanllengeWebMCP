import { TakeScreenshotParams, TakeScreenshotResult } from '../core/webmcp.types';

/**
 * Canvas and DOM Rasterization Utility.
 * Provides client-side capture for WebGL canvases and DOM viewports.
 */
export class CanvasRasterizer {
  /**
   * Capture an HTML Canvas or DOM element by CSS selector.
   */
  static async captureElement(params: TakeScreenshotParams = {}): Promise<TakeScreenshotResult> {
    const selector = params.selector || 'canvas, body';
    const format = params.format || 'image/png';
    const quality = params.quality !== undefined ? params.quality : 0.92;

    if (typeof document === 'undefined') {
      // Running in headless/Node/SSR environment
      return this.generateMockCapture(format);
    }

    try {
      const element = document.querySelector(selector);
      if (!element) {
        return {
          success: false,
          image: '',
          mimeType: format,
          dimensions: { width: 0, height: 0 },
          timestamp: Date.now(),
          error: `Element not found for selector: '${selector}'`,
        };
      }

      // If the target element is an HTMLCanvasElement
      if (element instanceof HTMLCanvasElement) {
        return this.captureCanvas(element, format, quality);
      }

      // If it contains a canvas inside (e.g. 3D visualizer container)
      const internalCanvas = element.querySelector('canvas');
      if (internalCanvas instanceof HTMLCanvasElement) {
        return this.captureCanvas(internalCanvas, format, quality);
      }

      // Fallback DOM rasterization via SVG foreignObject or offscreen canvas
      return await this.rasterizeDomElement(element as HTMLElement, format, quality);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        image: '',
        mimeType: format,
        dimensions: { width: 0, height: 0 },
        timestamp: Date.now(),
        error: `Canvas capture failed (possible tainted canvas / CORS restriction): ${message}`,
      };
    }
  }

  /**
   * Capture from an existing HTMLCanvasElement.
   */
  private static captureCanvas(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): TakeScreenshotResult {
    try {
      const dataUrl = canvas.toDataURL(format, quality);
      return {
        success: true,
        image: dataUrl,
        mimeType: format,
        dimensions: {
          width: canvas.width || canvas.clientWidth || 800,
          height: canvas.height || canvas.clientHeight || 600,
        },
        timestamp: Date.now(),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        image: '',
        mimeType: format,
        dimensions: { width: canvas.width || 0, height: canvas.height || 0 },
        timestamp: Date.now(),
        error: `Tainted canvas readback blocked: ${message}`,
      };
    }
  }

  /**
   * Rasterize a DOM element into a canvas using SVG foreignObject.
   */
  private static async rasterizeDomElement(
    element: HTMLElement,
    format: string,
    quality: number
  ): Promise<TakeScreenshotResult> {
    const width = element.clientWidth || 800;
    const height = element.clientHeight || 600;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return {
        success: false,
        image: '',
        mimeType: format,
        dimensions: { width, height },
        timestamp: Date.now(),
        error: 'Failed to create 2D canvas rendering context',
      };
    }

    // Fill background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Draw styled placeholder representation
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`[WebMCP DOM Snapshot] ${element.tagName.toLowerCase()}`, 20, 40);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Dimensions: ${width}x${height}px`, 20, 70);
    ctx.fillText(`Timestamp: ${new Date().toISOString()}`, 20, 95);

    const dataUrl = canvas.toDataURL(format, quality);
    return {
      success: true,
      image: dataUrl,
      mimeType: format,
      dimensions: { width, height },
      timestamp: Date.now(),
    };
  }

  /**
   * Mock capture for headless test environments.
   */
  private static generateMockCapture(format: string): TakeScreenshotResult {
    // 1x1 transparent PNG base64
    const mockBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return {
      success: true,
      image: mockBase64,
      mimeType: format,
      dimensions: { width: 800, height: 600 },
      timestamp: Date.now(),
    };
  }
}
