import {
  Component,
  Optional,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WebMcpService } from '@webmcp/angular';
import { SidebarModuleRegistryService } from '../../services/sidebar-module-registry.service';
import { ViewGuideService, ViewGuideTab } from '../../services/view-guide.service';
import {
  SidebarDockMode,
  SidebarViewCategory,
  SidebarViewConfig,
} from '../../models/sidebar.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Mobile Backdrop Drawer -->
    @if (isMobileDrawerOpen()) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        (click)="closeMobileDrawer()"
        aria-hidden="true"></div>
    }

    <!-- Sidebar Navigation Hub Container -->
    <aside
      [ngClass]="{
        'translate-x-0': isMobileDrawerOpen(),
        '-translate-x-full lg:translate-x-0': !isMobileDrawerOpen(),
        'w-72': dockMode() === 'expanded',
        'w-16': dockMode() === 'rail',
        'w-0 -translate-x-full': dockMode() === 'collapsed'
      }"
      class="fixed top-0 bottom-0 left-0 z-40 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col transition-all duration-300 shadow-sm"
      role="navigation"
      aria-label="WebMCP Workspace Navigation Hub">

      <!-- Top Header / Branding & Dock Mode Toggle -->
      <div class="h-16 border-b border-slate-200/80 flex items-center justify-between px-3 shrink-0">
        @if (dockMode() === 'expanded') {
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-xs shrink-0">
              <div class="w-full h-full bg-white rounded-[7px] flex items-center justify-center">
                <span class="text-cyan-600 font-black text-sm tracking-tight">W</span>
              </div>
            </div>
            <div class="flex flex-col truncate">
              <span class="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                WebMCP Workspace
                <span class="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  v22
                </span>
              </span>
              <span class="text-[10px] text-slate-500 font-mono truncate">
                {{ activeToolsCount() }} Tools Active
              </span>
            </div>
          </div>
        } @else {
          <div class="mx-auto">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-xs">
              <div class="w-full h-full bg-white rounded-[7px] flex items-center justify-center">
                <span class="text-cyan-600 font-black text-sm">W</span>
              </div>
            </div>
          </div>
        }

        <!-- Toggle Rail/Expanded Button (Desktop) -->
        <button
          (click)="toggleDockMode()"
          class="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          [attr.aria-label]="dockMode() === 'expanded' ? 'Collapse to Rail' : 'Expand Sidebar'">
          @if (dockMode() === 'expanded') {
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          } @else {
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          }
        </button>

        <!-- Close Drawer Button (Mobile) -->
        <button
          (click)="closeMobileDrawer()"
          class="flex lg:hidden items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Close Mobile Drawer">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation Hub Body: Expanded Mode -->
      @if (dockMode() === 'expanded') {
        <div class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          @for (category of categories; track category.id) {
            @if (getViewsForCategory(category.id).length > 0) {
              <div class="space-y-1.5">
                <!-- Category Section Header -->
                <div class="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {{ category.label }}
                </div>

                <!-- Category Views Navigation Items -->
                <div class="space-y-1">
                  @for (view of getViewsForCategory(category.id); track view.id) {
                    @if (view.route) {
                      <a
                        [routerLink]="view.route"
                        (click)="onSelectView(view)"
                        class="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all border group"
                        [ngClass]="isRouteActive(view.route)
                          ? 'bg-cyan-50/90 text-cyan-900 border-cyan-300/80 font-semibold shadow-2xs'
                          : 'bg-white/60 text-slate-700 border-slate-200/60 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'">
                        <div class="flex items-center gap-2.5 truncate min-w-0">
                          <span class="text-base shrink-0">{{ view.icon }}</span>
                          <div class="flex flex-col truncate">
                            <span class="truncate">{{ view.title }}</span>
                            @if (view.description) {
                              <span class="text-[10px] text-slate-400 font-normal truncate group-hover:text-slate-500">
                                {{ view.description }}
                              </span>
                            }
                          </div>
                        </div>

                        <!-- Tool Count Badge -->
                        @if (view.tools && view.tools.length > 0) {
                          <span
                            class="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
                            [title]="getToolCount(view.id).active + ' of ' + getToolCount(view.id).total + ' tools active'">
                            {{ getToolCount(view.id).active }}/{{ getToolCount(view.id).total }}
                          </span>
                        } @else if (getViewBadge(view)) {
                          <span class="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0">
                            {{ getViewBadge(view) }}
                          </span>
                        }
                      </a>
                    } @else {
                      <button
                        (click)="onSelectView(view)"
                        class="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all border group text-left bg-white/60 text-slate-700 border-slate-200/60 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300">
                        <div class="flex items-center gap-2.5 truncate min-w-0">
                          <span class="text-base shrink-0">{{ view.icon }}</span>
                          <div class="flex flex-col truncate">
                            <span class="font-medium truncate">{{ view.title }}</span>
                            @if (view.description) {
                              <span class="text-[10px] text-slate-400 font-normal truncate group-hover:text-slate-500">
                                {{ view.description }}
                              </span>
                            }
                          </div>
                        </div>

                        @if (getViewBadge(view)) {
                          <span class="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0">
                            {{ getViewBadge(view) }}
                          </span>
                        } @else {
                          <span class="text-xs text-slate-400 group-hover:text-slate-600 shrink-0">
                            ↗
                          </span>
                        }
                      </button>
                    }
                  }
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- Navigation Hub Body: Compact Rail Mode -->
      @if (dockMode() === 'rail') {
        <div class="flex-1 overflow-y-auto px-2 py-4 space-y-3 flex flex-col items-center">
          @for (view of views(); track view.id) {
            <div class="relative group">
              @if (view.route) {
                <a
                  [routerLink]="view.route"
                  (click)="onSelectView(view)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all border"
                  [ngClass]="isRouteActive(view.route)
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'">
                  <span>{{ view.icon }}</span>
                </a>
              } @else {
                <button
                  (click)="onSelectView(view)"
                  class="w-10 h-10 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center text-lg transition-all">
                  <span>{{ view.icon }}</span>
                </button>
              }

              <!-- Tool Count Mini Badge -->
              @if (getToolCount(view.id).active > 0) {
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {{ getToolCount(view.id).active }}
                </span>
              }

              <!-- Tooltip on Hover in Rail Mode -->
              <div class="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs whitespace-nowrap z-50 shadow-lg pointer-events-none">
                {{ view.title }}
                @if (view.tools && view.tools.length > 0) {
                  <span class="ml-1.5 text-[10px] text-purple-300 font-mono">
                    ({{ getToolCount(view.id).active }}/{{ getToolCount(view.id).total }})
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Sidebar Footer Telemetry Status & View Guide -->
      <div class="border-t border-slate-200/80 p-3 bg-slate-50/70 shrink-0 space-y-2">
        @if (dockMode() === 'expanded') {
          <button
            (click)="openGuide()"
            class="w-full py-1.5 px-2.5 rounded-xl bg-white border border-slate-200/90 hover:bg-cyan-50 hover:border-cyan-200 text-slate-700 hover:text-cyan-800 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Open Views & Tools Documentation">
            <span>📖</span>
            <span>Views Guide</span>
          </button>

          <div class="flex items-center justify-between text-[11px] text-slate-500">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="font-medium text-slate-700">WebMCP Active</span>
            </div>
            <span class="font-mono text-[10px] text-slate-400">
              {{ telemetryLogsCount() }} logs
            </span>
          </div>
        } @else {
          <div class="flex flex-col items-center gap-2">
            <button
              (click)="openGuide()"
              class="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 flex items-center justify-center text-xs transition-all cursor-pointer"
              title="Open Views Guide">
              📖
            </button>
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-full rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly registry: SidebarModuleRegistryService;
  readonly router: Router;
  readonly webmcp: WebMcpService;
  readonly guideService: ViewGuideService;

  readonly dockMode = computed(() => this.registry?.dockMode() ?? 'expanded');
  readonly isMobileDrawerOpen = computed(() => this.registry?.isMobileDrawerOpen() ?? false);
  readonly views = computed(() => this.registry?.views() ?? []);
  readonly categoryViewsMap = computed(() => this.registry?.categoryViewsMap() ?? new Map());
  readonly viewToolCountsMap = computed(() => this.registry?.viewToolCountsMap() ?? new Map());
  readonly activeToolsCount = computed(() => this.webmcp?.registeredTools()?.length ?? 0);
  readonly telemetryLogsCount = computed(() => this.webmcp?.executionLogs()?.length ?? 0);

  readonly categories = [
    { id: 'workspace' as SidebarViewCategory, label: 'Workspaces' },
    { id: 'telemetry' as SidebarViewCategory, label: 'Telemetry & Logs' },
    { id: 'assistant' as SidebarViewCategory, label: 'AI Copilot' },
  ];

  constructor(
    @Optional() registry?: SidebarModuleRegistryService,
    @Optional() router?: Router,
    @Optional() webmcp?: WebMcpService,
    @Optional() guideService?: ViewGuideService
  ) {
    if (registry) {
      this.registry = registry;
    } else {
      try {
        this.registry = inject(SidebarModuleRegistryService);
      } catch {
        this.registry = undefined as any;
      }
    }

    if (router) {
      this.router = router;
    } else {
      try {
        this.router = inject(Router);
      } catch {
        this.router = undefined as any;
      }
    }

    if (webmcp) {
      this.webmcp = webmcp;
    } else {
      try {
        this.webmcp = inject(WebMcpService);
      } catch {
        this.webmcp = undefined as any;
      }
    }

    if (guideService) {
      this.guideService = guideService;
    } else {
      try {
        this.guideService = inject(ViewGuideService);
      } catch {
        this.guideService = undefined as any;
      }
    }
  }

  openGuide(): void {
    if (this.guideService) {
      const url = this.router?.url || '';
      let tab: ViewGuideTab = '3d-showroom';
      if (url.includes('enterprise-bi')) {
        tab = 'enterprise-bi';
      } else if (url.includes('inspector')) {
        tab = 'inspector';
      } else if (url.includes('judge-guide')) {
        tab = 'judge-guide';
      }
      this.guideService.openGuide(tab);
    }
  }

  getViewsForCategory(category: SidebarViewCategory): SidebarViewConfig[] {
    return this.categoryViewsMap().get(category) || [];
  }

  getToolCount(viewId: string): { active: number; total: number } {
    return this.viewToolCountsMap().get(viewId) || { active: 0, total: 0 };
  }

  getViewBadge(view: SidebarViewConfig): string | number | null {
    if (!view.badge) return null;
    return typeof view.badge === 'function' ? view.badge() : view.badge;
  }

  toggleDockMode(): void {
    this.registry?.toggleDockMode();
  }

  closeMobileDrawer(): void {
    this.registry?.toggleMobileDrawer(false);
  }

  onSelectView(view: SidebarViewConfig): void {
    this.closeMobileDrawer();
    if (this.registry) {
      this.registry.selectView(view);
    }
    if (view.route && this.router) {
      this.router.navigate([view.route]);
    }
  }

  isRouteActive(route?: string): boolean {
    if (!route || !this.router?.url) return false;
    return this.router.url.includes(route);
  }
}

