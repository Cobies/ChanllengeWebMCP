import { describe, it, expect } from 'bun:test';
import { CanvasRasterizer } from './canvas-rasterizer';

describe('WebmcpViewportCapture & CanvasRasterizer', () => {
  it('should return a valid base64 image capture payload in headless mode', async () => {
    const result = await CanvasRasterizer.captureElement({
      format: 'image/png',
    });

    expect(result.success).toBe(true);
    expect(result.mimeType).toBe('image/png');
    expect(result.image).toContain('data:image/png;base64,');
    expect(result.dimensions.width).toBeGreaterThan(0);
    expect(result.dimensions.height).toBeGreaterThan(0);
  });

  it('should handle missing selectors gracefully without throwing exceptions', async () => {
    // In DOM environment, a non-existent element returns an error payload
    const result = await CanvasRasterizer.captureElement({
      selector: '#non-existent-canvas-element-xyz',
    });

    // In both headless or DOM, it returns a structured result object
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.image).toBe('string');
  });

  it('should support multiple formats (png, jpeg, webp)', async () => {
    const jpegResult = await CanvasRasterizer.captureElement({
      format: 'image/jpeg',
      quality: 0.8,
    });
    expect(jpegResult.mimeType).toBe('image/jpeg');

    const webpResult = await CanvasRasterizer.captureElement({
      format: 'image/webp',
      quality: 0.95,
    });
    expect(webpResult.mimeType).toBe('image/webp');
  });
});
