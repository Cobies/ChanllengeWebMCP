import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpService } from '@webmcp/angular';

describe('App Root Component & WebMCP Runtime', () => {
  let webmcpService: WebMcpService;

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
  });

  it('should initialize WebMCP service successfully', () => {
    expect(webmcpService).toBeDefined();
    expect(webmcpService.isReady()).toBe(true);
  });

  it('should expose reactive registeredTools signal', () => {
    expect(webmcpService.registeredTools()).toBeDefined();
    expect(Array.isArray(webmcpService.registeredTools())).toBe(true);
  });

  it('should track execution logs reactively', () => {
    expect(webmcpService.executionLogs()).toBeDefined();
    expect(Array.isArray(webmcpService.executionLogs())).toBe(true);
  });
});


