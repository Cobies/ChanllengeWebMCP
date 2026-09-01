import { InjectionToken } from '@angular/core';
import { WebMcpMemoryConfig } from './memory.types';
import { IWebMcpMemoryStore } from './memory-store.interface';
import { IWebMcpMemorySearchEngine } from './bm25-search-engine';

export const WEBMCP_MEMORY_CONFIG = new InjectionToken<WebMcpMemoryConfig>('WEBMCP_MEMORY_CONFIG');
export const WEBMCP_MEMORY_STORE = new InjectionToken<IWebMcpMemoryStore>('WEBMCP_MEMORY_STORE');
export const WEBMCP_MEMORY_SEARCH_ENGINE = new InjectionToken<IWebMcpMemorySearchEngine>(
  'WEBMCP_MEMORY_SEARCH_ENGINE'
);
