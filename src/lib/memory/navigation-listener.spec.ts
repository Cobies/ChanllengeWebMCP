import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpNavigationListener } from './navigation-listener';
import { WebMcpMemoryService } from './webmcp-memory.service';
import { WebMcpInMemoryStore } from './in-memory-store';
import { WebMcpBm25SearchEngine } from './bm25-search-engine';

describe('WebMcpNavigationListener (Route Context & Secret Sanitization)', () => {
  let store: WebMcpInMemoryStore;
  let searchEngine: WebMcpBm25SearchEngine;
  let memoryService: WebMcpMemoryService;
  let listener: WebMcpNavigationListener;

  beforeEach(async () => {
    store = new WebMcpInMemoryStore();
    searchEngine = new WebMcpBm25SearchEngine();
    memoryService = new WebMcpMemoryService(
      { enableNavigationCapture: true, autoRegisterTools: false },
      store,
      searchEngine
    );
    await memoryService.init();
    listener = new WebMcpNavigationListener(memoryService, { enableNavigationCapture: true });
  });

  it('should sanitize query parameters containing sensitive tokens, passwords, and API keys', () => {
    const rawUrl = '/bi-dashboard?view=grid&token=eyJhbGciOiJIUzI1NiJ9.test&apiKey=secret_12345&tab=summary&password=supersecret';
    const sanitized = listener.sanitizeUrl(rawUrl);

    expect(sanitized).toContain('view=grid');
    expect(sanitized).toContain('tab=summary');
    expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiJ9.test');
    expect(sanitized).not.toContain('secret_12345');
    expect(sanitized).not.toContain('supersecret');
    expect(sanitized).toContain('token=[REDACTED]');
    expect(sanitized).toContain('apiKey=[REDACTED]');
    expect(sanitized).toContain('password=[REDACTED]');
  });

  it('should preserve benign URLs without sensitive query parameters intact', () => {
    const safeUrl = '/bi-dashboard?domain=financial_risk&page=2&sort=asc';
    const sanitized = listener.sanitizeUrl(safeUrl);

    expect(sanitized).toBe('/bi-dashboard?domain=financial_risk&page=2&sort=asc');
  });

  it('should record navigation event as context memory with sanitized route', async () => {
    const targetUrl = '/bi-dashboard/supply-chain?mode=analytics&bearer=sensitive_token';
    const memory = await listener.recordNavigation(targetUrl, { source: 'router_event' });

    expect(memory).not.toBeNull();
    expect(memory?.category).toBe('context');
    expect(memory?.topic).toBe('navigation/route_change');
    expect(memory?.content).toContain('/bi-dashboard/supply-chain?mode=analytics&bearer=[REDACTED]');
    expect(memory?.tags).toContain('navigation');
    expect(memory?.tags).toContain('route-change');
    expect(memory?.tags).toContain('context');

    // Verified in reactive signal
    expect(memoryService.memories().length).toBe(1);
    expect(memoryService.memories()[0].category).toBe('context');
  });

  it('should not record navigation when enableNavigationCapture is false', async () => {
    const disabledListener = new WebMcpNavigationListener(memoryService, {
      enableNavigationCapture: false,
    });

    const result = await disabledListener.recordNavigation('/settings/profile');
    expect(result).toBeNull();
    expect(memoryService.memories().length).toBe(0);
  });

  it('should support Angular Router events simulation or manual route changes', async () => {
    listener.init();

    await listener.recordNavigation('/canvas-3d/editor');
    await listener.recordNavigation('/forms/automation');

    expect(memoryService.memories().length).toBe(2);
    const topics = memoryService.memories().map((m) => m.content);
    expect(topics[0]).toContain('/canvas-3d/editor');
    expect(topics[1]).toContain('/forms/automation');
  });
});
