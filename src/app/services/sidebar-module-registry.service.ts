import {
  Injectable,
  Inject,
  Optional,
  Injector,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { WebMcpService } from '@webmcp/angular';
import {
  SIDEBAR_MODULE_CONFIGS,
  SidebarViewConfig,
  SidebarViewCategory,
  SidebarDockMode,
  SidebarModuleConfig,
} from '../models/sidebar.models';

@Injectable({
  providedIn: 'root',
})
export class SidebarModuleRegistryService {
  private readonly webmcp?: WebMcpService;
  private readonly injector?: Injector;
  private readonly router?: Router;
  private readonly destroyRef?: DestroyRef;

  private readonly _views = signal<SidebarViewConfig[]>([]);
  private readonly _activeRoute = signal<string>('');
  private readonly _dockMode = signal<SidebarDockMode>('expanded');
  private readonly _isMobileDrawerOpen = signal<boolean>(false);

  /**
   * Reactive signal containing all currently registered workspace views sorted by order.
   */
  readonly views = this._views.asReadonly();

  /**
   * Alias for views for backwards compatibility.
   */
  readonly modules = this.views;

  /**
   * Active route path for highlight state tracking.
   */
  readonly activeRoute = this._activeRoute.asReadonly();

  /**
   * Computed active view configuration resolved from activeRoute.
   */
  readonly activeView = computed<SidebarViewConfig | undefined>(() => {
    const route = this._activeRoute();
    if (!route || route === '/' || route === '') {
      return this.getView('view-3d-showroom') || this._views()[0];
    }
    return this.getViewByRoute(route) || this.getView('view-3d-showroom') || this._views()[0];
  });

  /**
   * Sidebar dock layout mode: 'expanded' | 'rail' | 'collapsed' | 'drawer'.
   */
  readonly dockMode = this._dockMode.asReadonly();

  /**
   * Mobile drawer slide-over visibility flag.
   */
  readonly isMobileDrawerOpen = this._isMobileDrawerOpen.asReadonly();

  /**
   * Computed Map grouping views by their SidebarViewCategory ('workspace', 'telemetry', 'assistant').
   */
  readonly categoryViewsMap = computed(() => {
    const map = new Map<SidebarViewCategory, SidebarViewConfig[]>([
      ['workspace', []],
      ['telemetry', []],
      ['assistant', []],
    ]);

    for (const view of this._views()) {
      const category = view.category || 'workspace';
      const list = map.get(category) || [];
      list.push(view);
      map.set(category, list);
    }
    return map;
  });

  /**
   * Computed Map tracking active vs total tool counts per workspace view based on WebMcpService.registeredTools().
   */
  readonly viewToolCountsMap = computed(() => {
    const map = new Map<string, { active: number; total: number }>();
    const registered = this.webmcp ? this.webmcp.registeredTools() : [];
    const activeToolNames = new Set(registered.map((t) => t.name));

    for (const view of this._views()) {
      const total = view.tools ? view.tools.length : 0;
      let active = 0;
      if (view.tools && total > 0) {
        for (const toolName of view.tools) {
          if (activeToolNames.has(toolName)) {
            active++;
          }
        }
      }
      map.set(view.id, { active, total });
    }
    return map;
  });

  constructor(
    @Optional()
    @Inject(SIDEBAR_MODULE_CONFIGS)
    injectedConfigs?: SidebarViewConfig[][] | SidebarViewConfig[],
    @Optional() webmcp?: WebMcpService,
    @Optional() injector?: Injector,
    @Optional() router?: Router,
    @Optional() destroyRef?: DestroyRef
  ) {
    if (webmcp) {
      this.webmcp = webmcp;
    } else {
      try {
        this.webmcp = inject(WebMcpService, { optional: true }) ?? undefined;
      } catch {
        this.webmcp = undefined;
      }
    }

    if (injector) {
      this.injector = injector;
    } else {
      try {
        this.injector = inject(Injector, { optional: true }) ?? undefined;
      } catch {
        this.injector = undefined;
      }
    }

    if (router) {
      this.router = router;
    } else {
      try {
        this.router = inject(Router, { optional: true }) ?? undefined;
      } catch {
        this.router = undefined;
      }
    }

    if (destroyRef) {
      this.destroyRef = destroyRef;
    } else {
      try {
        this.destroyRef = inject(DestroyRef, { optional: true }) ?? undefined;
      } catch {
        this.destroyRef = undefined;
      }
    }

    const flatConfigs = (injectedConfigs || []).flat(Infinity) as SidebarViewConfig[];
    const sorted = [...flatConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._views.set(sorted);

    this.initRouterSync();
  }

  private initRouterSync(): void {
    if (!this.router) return;

    if (this.router.url) {
      this.setActiveRoute(this.router.url);
    }

    if (this.router.events) {
      const events$ = this.router.events.pipe(
        filter((event: any) => event instanceof NavigationEnd || (event && event.url !== undefined))
      );

      if (this.destroyRef) {
        events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: any) => {
          const targetUrl = event.urlAfterRedirects || event.url;
          if (targetUrl) {
            this.setActiveRoute(targetUrl);
          }
        });
      } else {
        events$.subscribe((event: any) => {
          const targetUrl = event.urlAfterRedirects || event.url;
          if (targetUrl) {
            this.setActiveRoute(targetUrl);
          }
        });
      }
    }
  }

  /**
   * Retrieve a specific view configuration matching the given route path.
   */
  getViewByRoute(rawRoute: string): SidebarViewConfig | undefined {
    if (!rawRoute) return undefined;
    const clean = rawRoute.split('?')[0].split('#')[0].trim().replace(/\/+$/, '');
    const normalized = clean === '' ? '/' : (clean.startsWith('/') ? clean : `/${clean}`);

    if (normalized === '/') {
      return (
        this.getView('view-3d-showroom') ||
        this._views().find((v) => v.route === '/3d-showroom') ||
        this._views()[0]
      );
    }

    const stripped = normalized.replace(/^\//, '');

    return this._views().find((v) => {
      const vroute = (v.route || '').split('?')[0].split('#')[0].trim().replace(/\/+$/, '');
      const vnormalized = vroute === '' ? '/' : (vroute.startsWith('/') ? vroute : `/${vroute}`);
      const vstripped = vnormalized.replace(/^\//, '');

      return (
        vnormalized === normalized ||
        vstripped === stripped ||
        v.id === stripped ||
        v.id === `view-${stripped}` ||
        v.id === normalized
      );
    });
  }


  /**
   * Dynamically register or update a workspace view configuration.
   */
  registerView(config: SidebarViewConfig): void {
    this._views.update((current) => {
      const filtered = current.filter((v) => v.id !== config.id);
      return [...filtered, config].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
  }

  /**
   * Alias for registerView.
   */
  registerModule(config: SidebarModuleConfig): void {
    this.registerView(config);
  }

  /**
   * Unregister a workspace view configuration by ID.
   */
  unregisterView(viewId: string): void {
    this._views.update((current) => current.filter((v) => v.id !== viewId));
  }

  /**
   * Alias for unregisterView.
   */
  unregisterModule(moduleId: string): void {
    this.unregisterView(moduleId);
  }

  /**
   * Retrieve a specific view configuration by ID.
   */
  getView(viewId: string): SidebarViewConfig | undefined {
    return this._views().find((v) => v.id === viewId);
  }

  /**
   * Alias for getView.
   */
  getModule(moduleId: string): SidebarModuleConfig | undefined {
    return this.getView(moduleId);
  }

  /**
   * Retrieve all view configurations belonging to a specific category.
   */
  getViewsForCategory(category: SidebarViewCategory): SidebarViewConfig[] {
    return this._views().filter((v) => v.category === category);
  }

  /**
   * Update active route tracking signal.
   */
  setActiveRoute(route: string): void {
    if (!route) {
      this._activeRoute.set('');
      return;
    }
    const clean = route.split('?')[0].split('#')[0].trim().replace(/\/+$/, '');
    const normalized = clean === '' ? '/' : (clean.startsWith('/') ? clean : `/${clean}`);
    this._activeRoute.set(normalized);
  }

  /**
   * Select a workspace view: executes onSelect handler or activates route.
   */
  selectView(view: SidebarViewConfig): void {
    if (view.route) {
      this.setActiveRoute(view.route);
    }

    if (view.onSelect) {
      view.onSelect(this.injector!);
    }
  }

  /**
   * Explicitly set docking layout mode.
   */
  setDockMode(mode: SidebarDockMode): void {
    this._dockMode.set(mode);
  }

  /**
   * Toggle between desktop expanded (280px) and rail (64px) docking modes.
   */
  toggleDockMode(): void {
    this._dockMode.update((current) => (current === 'expanded' ? 'rail' : 'expanded'));
  }

  /**
   * Toggle or set mobile slide-over drawer visibility.
   */
  toggleMobileDrawer(force?: boolean): void {
    if (typeof force === 'boolean') {
      this._isMobileDrawerOpen.set(force);
    } else {
      this._isMobileDrawerOpen.update((v) => !v);
    }
  }
}

