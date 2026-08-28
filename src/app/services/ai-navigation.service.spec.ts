import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpService } from '@webmcp/angular';
import { SidebarModuleRegistryService } from './sidebar-module-registry.service';
import { AiNavigationService, NavigateToViewResult } from './ai-navigation.service';
import { DEFAULT_SIDEBAR_MODULES } from '../config/sidebar-modules.config';

describe('AiNavigationService (Autonomous WebMCP AI View Navigation)', () => {
  let webmcp: WebMcpService;
  let registry: SidebarModuleRegistryService;
  let mockRouter: any;
  let service: AiNavigationService;
  let navigatedUrl: string | null = null;

  beforeEach(() => {
    webmcp = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });

    registry = new SidebarModuleRegistryService(DEFAULT_SIDEBAR_MODULES, webmcp);
    registry.setActiveRoute('/3d-showroom');

    navigatedUrl = null;
    mockRouter = {
      url: '/3d-showroom',
      navigateByUrl: async (url: string) => {
        navigatedUrl = url;
        registry.setActiveRoute(url);
        return true;
      },
    };

    service = new AiNavigationService(mockRouter, webmcp, registry);
  });

  describe('Tool Registration', () => {
    it('should register navigate_to_view tool in WebMcpService upon creation', () => {
      const tool = webmcp.getTool('navigate_to_view');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('navigate_to_view');
      expect(tool?.description).toContain('Navigates the application');
      expect(tool?.parameters?.required).toContain('targetView');
      expect(tool?.parameters?.required).toContain('reason');
    });
  });

  describe('Autonomous Navigation Execution', () => {
    it('should navigate to enterprise-bi view and return success payload with available tools', async () => {
      const result = await webmcp.executeTool<NavigateToViewResult>('navigate_to_view', {
        targetView: 'enterprise-bi',
        reason: 'Inspect financial telemetry and stock records',
      });

      expect(result.success).toBe(true);
      expect(result.targetView).toBe('view-enterprise-bi');
      expect(result.route).toBe('/enterprise-bi');
      expect(result.previousRoute).toBe('/3d-showroom');
      expect(navigatedUrl).toBe('/enterprise-bi');
      expect(result.toolsAvailable).toContain('query_enterprise_metrics');
      expect(result.toolsAvailable).toContain('filter_business_data');
      expect(result.message).toContain('Enterprise BI');
    });

    it('should support navigating using route path string with leading slash', async () => {
      const result = await webmcp.executeTool<NavigateToViewResult>('navigate_to_view', {
        targetView: '/judge-guide',
        reason: 'Review rubric scorecard',
      });

      expect(result.success).toBe(true);
      expect(result.targetView).toBe('view-judge-guide');
      expect(result.route).toBe('/judge-guide');
      expect(navigatedUrl).toBe('/judge-guide');
      expect(result.toolsAvailable).toContain('judge_rubric_evaluation');
    });

    it('should support navigating using explicit view ID', async () => {
      const result = await webmcp.executeTool<NavigateToViewResult>('navigate_to_view', {
        targetView: 'view-inspector',
        reason: 'Inspect real-time WebMCP protocol logs',
      });

      expect(result.success).toBe(true);
      expect(result.targetView).toBe('view-inspector');
      expect(result.route).toBe('/inspector');
      expect(navigatedUrl).toBe('/inspector');
    });

    it('should reject unknown targetView with validation error without crashing (Threat Matrix)', async () => {
      const result = await webmcp.executeTool<NavigateToViewResult>('navigate_to_view', {
        targetView: 'malicious-injected-view',
        reason: 'Attempt unauthorized access',
      });

      expect(result.success).toBe(false);
      expect(result.targetView).toBe('malicious-injected-view');
      expect(result.toolsAvailable).toEqual([]);
      expect(result.message).toContain('Invalid targetView');
      expect(result.message).toContain('view-3d-showroom');
      expect(navigatedUrl).toBeNull();
    });
  });
});
