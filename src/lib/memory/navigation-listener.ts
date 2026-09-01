import { Injectable, Inject, Optional } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { WebMcpMemoryService } from './webmcp-memory.service';
import { MemoryItem, WebMcpMemoryConfig } from './memory.types';
import { WEBMCP_MEMORY_CONFIG } from './memory.tokens';

const SENSITIVE_PARAM_REGEX =
  /(^|[?&#])(token|apikey|api_key|secret|password|passwd|auth|bearer|access_token|refresh_token|credential|sessionid|session_id|private_key)=([^&#]*)/gi;

/**
 * WebMcpNavigationListener - Passive Navigation & Route Observer.
 * Tracks Angular router transitions and records context observations with secret sanitization.
 */
@Injectable({ providedIn: 'root' })
export class WebMcpNavigationListener {
  private isListening = false;

  constructor(
    @Inject(WebMcpMemoryService) private readonly memoryService: WebMcpMemoryService,
    @Optional() @Inject(WEBMCP_MEMORY_CONFIG) private readonly config?: Partial<WebMcpMemoryConfig>,
    @Optional() @Inject(Router) private readonly router?: Router
  ) {}

  /**
   * Start listening to Angular router NavigationEnd events.
   */
  init(): void {
    if (this.isListening) {
      return;
    }

    if (this.config?.enableNavigationCapture === false) {
      return;
    }

    this.isListening = true;

    if (this.router && this.router.events) {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const targetUrl = event.urlAfterRedirects || event.url;
          this.recordNavigation(targetUrl, {
            navigationId: event.id,
            source: 'angular_router',
          }).catch((err) => {
            console.warn('[WebMCP Memory] Failed to record route change:', err);
          });
        }
      });
    }
  }

  /**
   * Redacts sensitive tokens, API keys, credentials, and passwords from URL query strings.
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    return url.replace(SENSITIVE_PARAM_REGEX, (_match, prefix, paramName) => {
      return `${prefix}${paramName}=[REDACTED]`;
    });
  }

  /**
   * Record navigation transition as a 'context' memory item.
   */
  async recordNavigation(
    url: string,
    metadata?: Record<string, unknown>
  ): Promise<MemoryItem | null> {
    if (this.config?.enableNavigationCapture === false) {
      return null;
    }

    const sanitizedUrl = this.sanitizeUrl(url);

    try {
      return await this.memoryService.save({
        topic: 'navigation/route_change',
        content: `Navigated to route: ${sanitizedUrl}`,
        category: 'context',
        tags: ['navigation', 'route-change', 'context'],
        metadata: {
          url: sanitizedUrl,
          timestamp: Date.now(),
          ...(metadata || {}),
        },
      });
    } catch (err) {
      console.warn('[WebMCP Memory] Record navigation error:', err);
      return null;
    }
  }
}
