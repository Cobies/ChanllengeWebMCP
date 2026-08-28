import {
  EnvironmentProviders,
  Inject,
  makeEnvironmentProviders,
  Optional,
  Provider,
  Type,
} from '@angular/core';
import {
  WebMcpConfig,
  WebMcpInterceptor,
  WebMcpInterceptorFn,
  WEBMCP_INTERCEPTORS,
} from './webmcp.types';
import { WEBMCP_CONFIG, WebMcpService } from './webmcp.service';

export interface WebMcpFeature {
  ɵproviders: Provider[];
}

export type WebMcpInterceptorToken =
  | WebMcpInterceptor
  | WebMcpInterceptorFn
  | Type<WebMcpInterceptor>;

/**
 * Creates a WebMCP feature configuration for registering interceptors.
 *
 * @example
 * ```typescript
 * provideWebMcp(
 *   { enableEmulatorFallback: true },
 *   withInterceptors(LoggingInterceptor, customAuthInterceptor)
 * )
 * ```
 */
export function withInterceptors(
  ...interceptors: WebMcpInterceptorToken[]
): WebMcpFeature {
  const providers: Provider[] = interceptors.map((interceptor) => {
    // Check if it's an instantiable class implementing WebMcpInterceptor
    if (
      typeof interceptor === 'function' &&
      interceptor.prototype &&
      typeof (interceptor.prototype as any).intercept === 'function'
    ) {
      return {
        provide: WEBMCP_INTERCEPTORS,
        useClass: interceptor as Type<WebMcpInterceptor>,
        multi: true,
      };
    }

    return {
      provide: WEBMCP_INTERCEPTORS,
      useValue: interceptor,
      multi: true,
    };
  });

  return {
    ɵproviders: providers,
  };
}

/**
 * Configure and provide WebMCP services for an Angular application or library.
 *
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideWebMcp(
 *       {
 *         enableEmulatorFallback: true,
 *         enableBuiltInScreenshot: true,
 *       },
 *       withInterceptors(LoggingInterceptor)
 *     )
 *   ]
 * };
 * ```
 */
export function provideWebMcp(
  config?: WebMcpConfig,
  ...features: WebMcpFeature[]
): EnvironmentProviders {
  const featureProviders = features.flatMap((f) => f.ɵproviders);

  return makeEnvironmentProviders([
    {
      provide: WEBMCP_CONFIG,
      useValue: config || {},
    },
    {
      provide: WebMcpService,
      useFactory: (
        cfg?: WebMcpConfig,
        diInterceptors?: (WebMcpInterceptor | WebMcpInterceptorFn)[]
      ) => new WebMcpService(cfg, diInterceptors),
      deps: [
        [new Optional(), new Inject(WEBMCP_CONFIG)],
        [new Optional(), new Inject(WEBMCP_INTERCEPTORS)],
      ],
    },
    ...featureProviders,
  ]);
}
