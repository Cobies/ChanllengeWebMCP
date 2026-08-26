import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { WebMcpConfig } from './webmcp.types';
import { WEBMCP_CONFIG, WebMcpService } from './webmcp.service';

/**
 * Configure and provide WebMCP services for an Angular application or library.
 *
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideWebMcp({
 *       enableEmulatorFallback: true,
 *       enableBuiltInScreenshot: true
 *     })
 *   ]
 * };
 * ```
 */
export function provideWebMcp(config?: WebMcpConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: WEBMCP_CONFIG,
      useValue: config || {},
    },
    WebMcpService,
  ]);
}
