import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { Subject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { WebMcpService } from '@webmcp/angular';
import { App } from './app';
import { SidebarModuleRegistryService } from './services/sidebar-module-registry.service';

describe('App Root Component & WebMCP Runtime', () => {
  let webmcpService: WebMcpService;
  let registryService: SidebarModuleRegistryService;
  let routerEvents$: Subject<any>;
  let mockRouter: any;

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
    registryService = new SidebarModuleRegistryService([], webmcpService);
    routerEvents$ = new Subject<any>();
    mockRouter = {
      url: '/3d-showroom',
      events: routerEvents$.asObservable(),
      navigate: async () => true,
    };
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

  describe('Full-Bleed Route Detection & Shell Adaptability', () => {
    it('should identify /3d-showroom, root /, and empty route as full-bleed routes', () => {
      mockRouter.url = '/3d-showroom';
      const app = new App(mockRouter as Router, registryService, webmcpService);
      expect(app.isFullBleedRoute()).toBe(true);

      mockRouter.url = '/';
      const appRoot = new App(mockRouter as Router, registryService, webmcpService);
      expect(appRoot.isFullBleedRoute()).toBe(true);

      mockRouter.url = '';
      const appEmpty = new App(mockRouter as Router, registryService, webmcpService);
      expect(appEmpty.isFullBleedRoute()).toBe(true);
    });

    it('should identify standard content routes (BI, Judge Guide, Inspector) as non-full-bleed', () => {
      mockRouter.url = '/enterprise-bi';
      const appBi = new App(mockRouter as Router, registryService, webmcpService);
      expect(appBi.isFullBleedRoute()).toBe(false);

      mockRouter.url = '/judge-guide';
      const appGuide = new App(mockRouter as Router, registryService, webmcpService);
      expect(appGuide.isFullBleedRoute()).toBe(false);

      mockRouter.url = '/inspector';
      const appInspector = new App(mockRouter as Router, registryService, webmcpService);
      expect(appInspector.isFullBleedRoute()).toBe(false);

      // Verify query params do not falsely trigger full bleed
      mockRouter.url = '/enterprise-bi?ref=3d-showroom';
      const appBiQuery = new App(mockRouter as Router, registryService, webmcpService);
      expect(appBiQuery.isFullBleedRoute()).toBe(false);
    });

    it('should update isFullBleedRoute reactively on NavigationEnd router events', () => {
      mockRouter.url = '/3d-showroom';
      const app = new App(mockRouter as Router, registryService, webmcpService);
      expect(app.isFullBleedRoute()).toBe(true);

      // Navigate to BI view
      routerEvents$.next(new NavigationEnd(1, '/enterprise-bi', '/enterprise-bi'));
      expect(app.isFullBleedRoute()).toBe(false);

      // Navigate back to 3D Showroom
      routerEvents$.next(new NavigationEnd(2, '/3d-showroom', '/3d-showroom'));
      expect(app.isFullBleedRoute()).toBe(true);
    });

    it('should assert fluid full-width layout contract on non-full-bleed routes and preserve full-bleed isolation', () => {
      const fullBleedClasses = 'flex-1 w-full h-full p-0 m-0 max-w-none flex flex-col min-h-0 overflow-hidden';
      const fluidDashboardClasses = 'flex-1 w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 overflow-y-auto';
      const fluidContainerPadding = 'w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12';

      mockRouter.url = '/enterprise-bi';
      const appBi = new App(mockRouter as Router, registryService, webmcpService);
      expect(appBi.isFullBleedRoute()).toBe(false);

      const biMainClasses = appBi.isFullBleedRoute() ? fullBleedClasses : fluidDashboardClasses;
      expect(biMainClasses).toBe(fluidDashboardClasses);
      expect(biMainClasses).toContain('w-full');
      expect(biMainClasses).toContain('max-w-none');
      expect(biMainClasses).toContain('2xl:px-12');
      expect(biMainClasses).not.toContain('max-w-7xl');
      expect(biMainClasses).not.toContain('mx-auto');

      mockRouter.url = '/3d-showroom';
      const appShowroom = new App(mockRouter as Router, registryService, webmcpService);
      expect(appShowroom.isFullBleedRoute()).toBe(true);

      const showroomMainClasses = appShowroom.isFullBleedRoute() ? fullBleedClasses : fluidDashboardClasses;
      expect(showroomMainClasses).toBe(fullBleedClasses);
      expect(showroomMainClasses).toContain('p-0');
      expect(showroomMainClasses).toContain('m-0');
      expect(showroomMainClasses).toContain('max-w-none');
      expect(showroomMainClasses).toContain('h-full');
    });
  });
});



