import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
  ENVIRONMENT_INITIALIZER,
  inject,
  Optional,
} from '@angular/core';
import { WebMcpMemoryConfig } from './memory.types';
import { IWebMcpMemoryStore } from './memory-store.interface';
import { IWebMcpMemorySearchEngine, WebMcpBm25SearchEngine } from './bm25-search-engine';
import { WebMcpIndexedDbStore } from './indexeddb-store';
import { WebMcpInMemoryStore } from './in-memory-store';
import { WebMcpMemoryService } from './webmcp-memory.service';
import { WebMcpMemoryInterceptor } from './memory-interceptor';
import { WebMcpNavigationListener } from './navigation-listener';
import { WEBMCP_INTERCEPTORS } from '../core/webmcp.types';

export {
  WEBMCP_MEMORY_CONFIG,
  WEBMCP_MEMORY_STORE,
  WEBMCP_MEMORY_SEARCH_ENGINE,
} from './memory.tokens';
import {
  WEBMCP_MEMORY_CONFIG,
  WEBMCP_MEMORY_STORE,
  WEBMCP_MEMORY_SEARCH_ENGINE,
} from './memory.tokens';

/**
 * Configures the WebMCP In-Browser Memory System.
 * Registers storage backend, BM25 search engine, reactive service, execution interceptors, and navigation listeners.
 */
export function provideWebMcpMemory(
  config?: Partial<WebMcpMemoryConfig>
): EnvironmentProviders {
  const mergedConfig: WebMcpMemoryConfig = {
    dbName: 'webmcp_memory_db',
    dbVersion: 1,
    bm25_k1: 1.2,
    bm25_b: 0.75,
    enablePassiveToolCapture: true,
    enableNavigationCapture: true,
    maxMemories: 10000,
    autoRegisterTools: true,
    ...(config || {}),
  };

  const providers: any[] = [
    { provide: WEBMCP_MEMORY_CONFIG, useValue: mergedConfig },
    {
      provide: WEBMCP_MEMORY_STORE,
      useFactory: (cfg?: WebMcpMemoryConfig) => {
        const activeConfig = cfg || mergedConfig;
        if (typeof indexedDB !== 'undefined') {
          return new WebMcpIndexedDbStore(activeConfig);
        }
        return new WebMcpInMemoryStore(activeConfig);
      },
      deps: [[new Optional(), WEBMCP_MEMORY_CONFIG]],
    },
    {
      provide: WEBMCP_MEMORY_SEARCH_ENGINE,
      useFactory: (cfg?: WebMcpMemoryConfig) => {
        const activeConfig = cfg || mergedConfig;
        return new WebMcpBm25SearchEngine({
          k1: activeConfig.bm25_k1,
          b: activeConfig.bm25_b,
        });
      },
      deps: [[new Optional(), WEBMCP_MEMORY_CONFIG]],
    },
    {
      provide: WebMcpMemoryService,
      useClass: WebMcpMemoryService,
    },
    {
      provide: WebMcpNavigationListener,
      useClass: WebMcpNavigationListener,
    },
  ];

  if (mergedConfig.enablePassiveToolCapture !== false) {
    providers.push({
      provide: WEBMCP_INTERCEPTORS,
      useClass: WebMcpMemoryInterceptor,
      multi: true,
    });
  }

  providers.push({
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useValue: () => {
      const memoryService = inject(WebMcpMemoryService);
      const navListener = inject(WebMcpNavigationListener, { optional: true });

      memoryService
        .init()
        .then(() => {
          if (mergedConfig.enableNavigationCapture !== false && navListener) {
            navListener.init();
          }
        })
        .catch((err) => {
          console.warn('[WebMCP Memory] Auto-initialization warning:', err);
        });
    },
  });

  return makeEnvironmentProviders(providers);
}
