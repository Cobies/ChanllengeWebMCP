import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { Router } from '@angular/router';
import { WebMcpService } from '@webmcp/angular';
import { SidebarComponent } from './sidebar.component';
import { SidebarModuleRegistryService } from '../../services/sidebar-module-registry.service';
import { DEFAULT_SIDEBAR_MODULES } from '../../config/sidebar-modules.config';
import { SidebarViewConfig } from '../../models/sidebar.models';

describe('SidebarComponent (Modular WebMCP Workspace Navigation Hub)', () => {
  let webmcpService: WebMcpService;
  let registryService: SidebarModuleRegistryService;
  let mockRouter: any;
  let component: SidebarComponent;
  let selectedViews: SidebarViewConfig[] = [];

  beforeEach(async () => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });

    registryService = new SidebarModuleRegistryService(
      [DEFAULT_SIDEBAR_MODULES],
      webmcpService
    );

    selectedViews = [];
    const origSelectView = registryService.selectView.bind(registryService);
    registryService.selectView = (view: SidebarViewConfig) => {
      selectedViews.push(view);
      origSelectView(view);
    };

    mockRouter = {
      url: '/3d-showroom',
      navigate: async () => true,
    };

    await webmcpService.registerTool({
      name: 'query_enterprise_metrics',
      description: 'Query BI metrics',
      parameters: { type: 'object', properties: {} },
      handler: async () => ({ ok: true }),
    });
    await webmcpService.registerTool({
      name: 'scene_3d_action',
      description: '3D Action',
      parameters: { type: 'object', properties: {} },
      handler: async () => ({ success: true }),
    });

    component = new SidebarComponent(registryService, mockRouter as Router, webmcpService);
  });

  describe('Initialization & Workspace Views Resolution', () => {
    it('should initialize with all 5 default workspace views', () => {
      const views = component.views();
      expect(views.length).toBe(5);
      expect(views.map((v) => v.id)).toEqual([
        'view-3d-showroom',
        'view-enterprise-bi',
        'view-judge-guide',
        'view-inspector',
        'view-copilot',
      ]);
    });

    it('should compute accurate tool count badge numbers for views', () => {
      const showroomCounts = component.getToolCount('view-3d-showroom');
      expect(showroomCounts).toEqual({ active: 1, total: 2 });

      const biCounts = component.getToolCount('view-enterprise-bi');
      expect(biCounts).toEqual({ active: 1, total: 13 });

      const judgeCounts = component.getToolCount('view-judge-guide');
      expect(judgeCounts).toEqual({ active: 0, total: 2 });

      const inspectorCounts = component.getToolCount('view-inspector');
      expect(inspectorCounts).toEqual({ active: 0, total: 0 });
    });

    it('should resolve custom badge string or function if defined on view', () => {
      const viewWithStaticBadge: SidebarViewConfig = {
        id: 'view-test-badge-static',
        title: 'Static Badge',
        icon: '🏷️',
        category: 'workspace',
        order: 99,
        badge: 'NEW',
      };
      expect(component.getViewBadge(viewWithStaticBadge)).toBe('NEW');

      const viewWithFnBadge: SidebarViewConfig = {
        id: 'view-test-badge-fn',
        title: 'Fn Badge',
        icon: '🏷️',
        category: 'workspace',
        order: 100,
        badge: () => 'PRO',
      };
      expect(component.getViewBadge(viewWithFnBadge)).toBe('PRO');

      const viewWithoutBadge: SidebarViewConfig = {
        id: 'view-test-no-badge',
        title: 'No Badge',
        icon: '🏷️',
        category: 'workspace',
        order: 101,
      };
      expect(component.getViewBadge(viewWithoutBadge)).toBeNull();
    });
  });

  describe('Navigation & View Selection Handling', () => {
    it('should delegate view selection to registryService and close mobile drawer', () => {
      registryService.toggleMobileDrawer(true);
      expect(component.isMobileDrawerOpen()).toBe(true);

      const biView = registryService.getView('view-enterprise-bi')!;
      component.onSelectView(biView);

      expect(selectedViews.length).toBe(1);
      expect(selectedViews[0].id).toBe('view-enterprise-bi');
      expect(component.isMobileDrawerOpen()).toBe(false);
    });

    it('should determine active route highlighting accurately', () => {
      expect(component.isRouteActive('/3d-showroom')).toBe(true);
      expect(component.isRouteActive('/enterprise-bi')).toBe(false);
      expect(component.isRouteActive(undefined)).toBe(false);
      expect(component.isRouteActive('')).toBe(false);
    });
  });

  describe('Docking Modes & Responsive Layouts', () => {
    it('should delegate dockMode toggling to registryService', () => {
      expect(component.dockMode()).toBe('expanded');

      component.toggleDockMode();
      expect(component.dockMode()).toBe('rail');

      component.toggleDockMode();
      expect(component.dockMode()).toBe('expanded');
    });

    it('should allow closing mobile drawer directly', () => {
      registryService.toggleMobileDrawer(true);
      expect(component.isMobileDrawerOpen()).toBe(true);

      component.closeMobileDrawer();
      expect(component.isMobileDrawerOpen()).toBe(false);
    });

    it('should group views by category in categoryViewsMap', () => {
      const map = component.categoryViewsMap();
      expect(map.get('workspace')?.length).toBe(3);
      expect(map.get('telemetry')?.length).toBe(1);
      expect(map.get('assistant')?.length).toBe(1);
    });
  });

  describe('Clean Encapsulation Guard (No Embedded Domain Action Forms)', () => {
    it('views configuration must not contain embedded domain actions or input forms', () => {
      for (const view of component.views()) {
        expect((view as any).actions).toBeUndefined();
      }
    });
  });
});

