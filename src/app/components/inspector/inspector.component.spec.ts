import '@angular/compiler';
import { describe, it, expect } from 'bun:test';
import { InspectorComponent } from './inspector.component';

describe('InspectorComponent Sanitization & XSS Prevention (Threat Matrix)', () => {
  it('should safely serialize and truncate large base64 image data strings', () => {
    const mockWebmcp = { executionLogs: () => [] } as any;
    const inspector = new InspectorComponent(mockWebmcp);

    const maliciousOrHugePayload = {
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk',
      prompt: '<script>alert("xss")</script>',
    };

    const formatted = inspector.safeJsonStringify(maliciousOrHugePayload);

    // Truncates large base64
    expect(formatted).toContain('[base64 image payload truncated:');
    // Escapes / formats JSON safely as string
    expect(formatted).toContain('<script>alert(\\"xss\\")</script>');
  });

  it('should format timestamp milliseconds correctly', () => {
    const mockWebmcp = { executionLogs: () => [] } as any;
    const inspector = new InspectorComponent(mockWebmcp);

    const timestamp = 1714500000123;
    const formatted = inspector.formatTime(timestamp);
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}\.123/);
  });
});
