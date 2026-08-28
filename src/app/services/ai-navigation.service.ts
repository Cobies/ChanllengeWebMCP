import { Injectable, inject, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { WebMcpService, WebMcpToolDefinition } from '@webmcp/angular';
import { SidebarModuleRegistryService } from './sidebar-module-registry.service';
import { SidebarViewConfig } from '../models/sidebar.models';

export interface NavigateToViewParams {
  targetView: string;
  reason: string;
}

export interface NavigateToViewResult {
  success: boolean;
  targetView: string;
  route: string;
  previousRoute: string;
  toolsAvailable: string[];
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiNavigationService {
  private readonly router?: Router;
  private readonly webmcp: WebMcpService;
  private readonly registry: SidebarModuleRegistryService;

  constructor(
    @Optional() router?: Router,
    @Optional() webmcp?: WebMcpService,
    @Optional() registry?: SidebarModuleRegistryService
  ) {
    this.router = router ?? inject(Router, { optional: true }) ?? undefined;
    this.webmcp = webmcp ?? inject(WebMcpService);
    this.registry = registry ?? inject(SidebarModuleRegistryService);

    this.registerNavigationTool();
  }

  private registerNavigationTool(): void {
    const toolDef: WebMcpToolDefinition<NavigateToViewParams, NavigateToViewResult> = {
      name: 'navigate_to_view',
      description:
        'Navigates the application to a specific workspace view or route, switching the active UI context and mounting view-specific WebMCP tools.',
      parameters: {
        type: 'object',
        properties: {
          targetView: {
            type: 'string',
            description:
              'Target workspace view identifier or route path to navigate to (e.g. "3d-showroom", "enterprise-bi", "judge-guide", "inspector")',
          },
          reason: {
            type: 'string',
            description: "Clear explanation of why navigation is required to fulfill the user's intent",
          },
        },
        required: ['targetView', 'reason'],
        additionalProperties: false,
      },
      handler: async (params: NavigateToViewParams) => {
        return await this.navigateToView(params);
      },
    };

    this.webmcp.registerTool(toolDef);
  }

  async navigateToView(params: NavigateToViewParams): Promise<NavigateToViewResult> {
    const targetInput = (params?.targetView || '').trim();
    const reason = (params?.reason || '').trim();
    const views = this.registry.views();
    const previousRoute = this.registry.activeRoute() || (this.router ? this.router.url : '');

    // Resolve target view
    const matchedView = this.resolveView(targetInput, views);

    if (!matchedView) {
      const validChoices = views
        .filter((v) => v.route)
        .map((v) => `${v.id} (${v.route})`)
        .join(', ');
      return {
        success: false,
        targetView: targetInput,
        route: '',
        previousRoute,
        toolsAvailable: [],
        message: `Invalid targetView '${targetInput}'. Valid views are: ${validChoices || 'view-3d-showroom, view-enterprise-bi, view-judge-guide, view-inspector'}`,
      };
    }

    const targetRoute = matchedView.route || ('/' + targetInput.replace(/^\//, ''));

    if (this.router) {
      await this.router.navigateByUrl(targetRoute);
    }
    this.registry.setActiveRoute(targetRoute);

    return {
      success: true,
      targetView: matchedView.id,
      route: targetRoute,
      previousRoute,
      toolsAvailable: matchedView.tools || [],
      message: `Successfully navigated to ${matchedView.title} (${targetRoute}). Reason: ${reason}`,
    };
  }

  private resolveView(target: string, views: SidebarViewConfig[]): SidebarViewConfig | undefined {
    if (!target) return undefined;
    const cleanTarget = target.toLowerCase().trim();
    const strippedTarget = cleanTarget.replace(/^\//, '');

    return views.find((v) => {
      const vid = v.id.toLowerCase();
      const vroute = (v.route || '').toLowerCase();
      const vrouteStripped = vroute.replace(/^\//, '');

      return (
        vid === cleanTarget ||
        vid === `view-${cleanTarget}` ||
        vid === `view-${strippedTarget}` ||
        vroute === cleanTarget ||
        vroute === `/${strippedTarget}` ||
        vrouteStripped === strippedTarget ||
        v.title.toLowerCase() === cleanTarget
      );
    });
  }
}
