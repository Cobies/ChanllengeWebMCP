import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpService, WebMcpToolDefinition } from '@webmcp/angular';
import { SidebarModuleRegistryService } from './sidebar-module-registry.service';
import {
  SidebarViewConfig,
  SidebarViewCategory,
} from '../models/sidebar.models';

describe('SidebarModuleRegistryService (Workspace View Navigation Hub)', () => {
  let webmcpService: WebMcpService;
  let service: SidebarModuleRegistryService;

  const sampleViewBi: SidebarViewConfig = {
    id: 'view-enterprise-bi',
    title: 'Enterprise BI',
    icon: '📊',
    category: 'workspace',
    order: 20,
    route: '/enterprise-bi',
    tools: ['query_enterprise_metrics', 'filter_business_data', 'calculate_kpi_summary'],
  };

  const sampleViewTwin: SidebarViewConfig = {
    id: 'view-3d-showroom',
    title: '3D Showroom',
    icon: '🏎️',
    category: 'workspace',
    order: 10,
    route: '/3d-showroom',
    tools: ['scene_3d_action', 'take_screenshot'],
  };

  const sampleViewJudge: SidebarViewConfig = {
    id: 'view-judge-guide',
    title: 'Judge Guide',
    icon: '📋',
    category: 'workspace',
    order: 30,
    route: '/judge-guide',
    tools: ['judge_rubric_evaluation'],
  };

  const sampleViewInspector: SidebarViewConfig = {
    id: 'view-inspector',
    title: 'Inspector',
    icon: '🔍',
    category: 'telemetry',
    order: 40,
    route: '/inspector',
  };

  const sampleViewCopilot: SidebarViewConfig = {
    id: 'view-copilot',
    title: 'Copilot AI',
    icon: '🤖',
    category: 'assistant',
    order: 50,
  };

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
  });

  describe('Initialization & Multi-Provider DI Resolution', () => {
    it('should initialize with empty views when no providers are configured', () => {
      service = new SidebarModuleRegistryService([], webmcpService);
      expect(service.views()).toEqual([]);
      expect(service.dockMode()).toBe('expanded');
      expect(service.isMobileDrawerOpen()).toBe(false);
      expect(service.activeRoute()).toBe('');
    });

    it('should flatten and sort provided view configurations by order ascending', () => {
      const multiProvided = [[sampleViewBi, sampleViewTwin], [sampleViewJudge, sampleViewInspector]];
      service = new SidebarModuleRegistryService(multiProvided, webmcpService);

      const views = service.views();
      expect(views.length).toBe(4);
      expect(views[0].id).toBe('view-3d-showroom'); // order 10
      expect(views[1].id).toBe('view-enterprise-bi'); // order 20
      expect(views[2].id).toBe('view-judge-guide'); // order 30
      expect(views[3].id).toBe('view-inspector'); // order 40
    });

    it('should support legacy modules signal alias returning the sorted views', () => {
      service = new SidebarModuleRegistryService([sampleViewTwin, sampleViewBi], webmcpService);
      expect(service.modules()).toEqual(service.views());
      expect(service.modules().length).toBe(2);
    });
  });

  describe('Dynamic View Registration & Queries', () => {
    beforeEach(() => {
      service = new SidebarModuleRegistryService([sampleViewTwin], webmcpService);
    });

    it('should dynamically register new view and preserve ascending order', () => {
      expect(service.views().length).toBe(1);

      service.registerView(sampleViewBi); // order 20 > 10
      service.registerView(sampleViewInspector); // order 40

      const views = service.views();
      expect(views.length).toBe(3);
      expect(views[0].id).toBe('view-3d-showroom');
      expect(views[1].id).toBe('view-enterprise-bi');
      expect(views[2].id).toBe('view-inspector');
    });

    it('should replace view if registered with existing ID', () => {
      const updatedTwin: SidebarViewConfig = {
        ...sampleViewTwin,
        title: '3D Showroom Pro',
      };
      service.registerView(updatedTwin);

      expect(service.views().length).toBe(1);
      expect(service.getView('view-3d-showroom')?.title).toBe('3D Showroom Pro');
    });

    it('should unregister view by ID', () => {
      service.registerView(sampleViewBi);
      expect(service.views().length).toBe(2);

      service.unregisterView('view-3d-showroom');
      expect(service.views().length).toBe(1);
      expect(service.getView('view-3d-showroom')).toBeUndefined();
    });

    it('should retrieve views for a specific category', () => {
      service.registerView(sampleViewBi);
      service.registerView(sampleViewInspector);
      service.registerView(sampleViewCopilot);

      const workspaceViews = service.getViewsForCategory('workspace');
      expect(workspaceViews.length).toBe(2);
      expect(workspaceViews.map((v) => v.id)).toEqual(['view-3d-showroom', 'view-enterprise-bi']);

      const telemetryViews = service.getViewsForCategory('telemetry');
      expect(telemetryViews.length).toBe(1);
      expect(telemetryViews[0].id).toBe('view-inspector');

      const assistantViews = service.getViewsForCategory('assistant');
      expect(assistantViews.length).toBe(1);
      expect(assistantViews[0].id).toBe('view-copilot');
    });
  });

  describe('Reactive Computed Signals (categoryViewsMap & viewToolCountsMap)', () => {
    beforeEach(async () => {
      service = new SidebarModuleRegistryService(
        [sampleViewTwin, sampleViewBi, sampleViewJudge, sampleViewInspector, sampleViewCopilot],
        webmcpService
      );

      // Register tools in WebMcpService
      const tool1: WebMcpToolDefinition = {
        name: 'query_enterprise_metrics',
        description: 'Query BI metrics',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({ ok: true }),
      };
      const tool2: WebMcpToolDefinition = {
        name: 'scene_3d_action',
        description: 'Control 3D scene',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({ success: true }),
      };
      const tool3: WebMcpToolDefinition = {
        name: 'take_screenshot',
        description: 'Take screenshot',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({ image: 'data:image/png' }),
      };

      await webmcpService.registerTool(tool1);
      await webmcpService.registerTool(tool2);
      await webmcpService.registerTool(tool3);
    });

    it('should group views by category in categoryViewsMap', () => {
      const catMap = service.categoryViewsMap();
      expect(catMap.get('workspace')?.length).toBe(3);
      expect(catMap.get('telemetry')?.length).toBe(1);
      expect(catMap.get('assistant')?.length).toBe(1);
    });

    it('should compute reactive viewToolCountsMap based on active registered tools in WebMcpService', () => {
      const toolCounts = service.viewToolCountsMap();

      // 3D showroom has 2 tools registered out of 2 declared
      const twinCount = toolCounts.get('view-3d-showroom');
      expect(twinCount).toBeDefined();
      expect(twinCount?.active).toBe(2);
      expect(twinCount?.total).toBe(2);

      // Enterprise BI has 1 tool registered (query_enterprise_metrics) out of 3 declared
      const biCount = toolCounts.get('view-enterprise-bi');
      expect(biCount).toBeDefined();
      expect(biCount?.active).toBe(1);
      expect(biCount?.total).toBe(3);

      // Judge Guide has 0 registered out of 1 declared
      const judgeCount = toolCounts.get('view-judge-guide');
      expect(judgeCount).toBeDefined();
      expect(judgeCount?.active).toBe(0);
      expect(judgeCount?.total).toBe(1);

      // Inspector has no declared tools
      const inspectorCount = toolCounts.get('view-inspector');
      expect(inspectorCount).toBeDefined();
      expect(inspectorCount?.active).toBe(0);
      expect(inspectorCount?.total).toBe(0);
    });
  });

  describe('Active Route & View Selection', () => {
    beforeEach(() => {
      service = new SidebarModuleRegistryService([sampleViewTwin, sampleViewCopilot], webmcpService);
    });

    it('should update active route signal', () => {
      expect(service.activeRoute()).toBe('');
      service.setActiveRoute('/3d-showroom');
      expect(service.activeRoute()).toBe('/3d-showroom');
    });

    it('should execute onSelect callback when selecting a view with handler', () => {
      let customRan = false;
      const customView: SidebarViewConfig = {
        id: 'view-custom',
        title: 'Custom',
        icon: '⚡',
        category: 'assistant',
        order: 99,
        onSelect: () => {
          customRan = true;
        },
      };

      service.selectView(customView);
      expect(customRan).toBe(true);
    });

    it('should set active route when selecting a view with route', () => {
      service.selectView(sampleViewTwin);
      expect(service.activeRoute()).toBe('/3d-showroom');
    });
  });

  describe('Router Navigation Synchronization & activeView Signal', () => {
    let routerEventsSubject: any;
    let mockRouter: any;

    beforeEach(() => {
      const { Subject } = require('rxjs');
      const { NavigationEnd } = require('@angular/router');
      routerEventsSubject = new Subject();
      mockRouter = {
        events: routerEventsSubject.asObservable(),
        url: '/3d-showroom',
      };
      service = new SidebarModuleRegistryService(
        [sampleViewTwin, sampleViewBi, sampleViewJudge, sampleViewInspector],
        webmcpService,
        undefined,
        mockRouter
      );
    });

    it('should resolve activeView matching initial route or default view', () => {
      expect(service.activeView()).toBeDefined();
      expect(service.activeView()?.id).toBe('view-3d-showroom');
    });

    it('should retrieve view by route with getViewByRoute', () => {
      expect(service.getViewByRoute('/enterprise-bi')?.id).toBe('view-enterprise-bi');
      expect(service.getViewByRoute('enterprise-bi')?.id).toBe('view-enterprise-bi');
      expect(service.getViewByRoute('/judge-guide?filter=compliance')?.id).toBe('view-judge-guide');
      expect(service.getViewByRoute('/')?.id).toBe('view-3d-showroom');
      expect(service.getViewByRoute('/non-existent')).toBeUndefined();
    });

    it('should reactively update activeRoute and activeView when NavigationEnd fires', () => {
      const { NavigationEnd } = require('@angular/router');
      routerEventsSubject.next(new NavigationEnd(1, '/enterprise-bi', '/enterprise-bi'));

      expect(service.activeRoute()).toBe('/enterprise-bi');
      expect(service.activeView()?.id).toBe('view-enterprise-bi');
      expect(service.activeView()?.title).toBe('Enterprise BI');

      routerEventsSubject.next(new NavigationEnd(2, '/judge-guide', '/judge-guide'));

      expect(service.activeRoute()).toBe('/judge-guide');
      expect(service.activeView()?.id).toBe('view-judge-guide');
    });

    it('should normalize route paths with query parameters and trailing slashes', () => {
      const { NavigationEnd } = require('@angular/router');
      routerEventsSubject.next(new NavigationEnd(3, '/inspector?tab=logs#top', '/inspector?tab=logs#top'));

      expect(service.activeRoute()).toBe('/inspector');
      expect(service.activeView()?.id).toBe('view-inspector');
    });
  });

  describe('Docking & Mobile Drawer State', () => {
    beforeEach(() => {
      service = new SidebarModuleRegistryService([], webmcpService);
    });

    it('should toggle dockMode between expanded and rail', () => {
      expect(service.dockMode()).toBe('expanded');

      service.toggleDockMode();
      expect(service.dockMode()).toBe('rail');

      service.toggleDockMode();
      expect(service.dockMode()).toBe('expanded');
    });

    it('should explicitly set dockMode', () => {
      service.setDockMode('collapsed');
      expect(service.dockMode()).toBe('collapsed');

      service.setDockMode('drawer');
      expect(service.dockMode()).toBe('drawer');
    });

    it('should toggle and control mobile drawer visibility', () => {
      expect(service.isMobileDrawerOpen()).toBe(false);

      service.toggleMobileDrawer();
      expect(service.isMobileDrawerOpen()).toBe(true);

      service.toggleMobileDrawer(false);
      expect(service.isMobileDrawerOpen()).toBe(false);

      service.toggleMobileDrawer(true);
      expect(service.isMobileDrawerOpen()).toBe(true);
    });
  });
});

