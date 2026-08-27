import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { WebMcpService } from '@webmcp/angular';
import { CopilotBridgeService } from '../../services/copilot-bridge.service';
import { EnterpriseDataService } from '../../services/enterprise-data.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <!-- Branding & Logo -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-sm shadow-cyan-500/20 shrink-0">
            <div class="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <span class="text-cyan-600 font-black text-xl tracking-tighter">W</span>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-bold text-slate-900">
                WebMCP Angular Enterprise
              </h1>
              <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/80">
                Angular 22
              </span>
            </div>
            <p class="text-xs text-slate-500">
              W3C Model Context Protocol for Enterprise Intelligence & 3D Twins
            </p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="flex items-center gap-1.5 p-1 bg-slate-200/60 border border-slate-300/60 rounded-xl text-xs font-medium">
          <a
            routerLink="/3d-showroom"
            routerLinkActive="bg-white text-cyan-700 border-cyan-500/30 shadow-sm font-semibold"
            [routerLinkActiveOptions]="{ exact: false }"
            class="px-3 py-1.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5">
            <span>🏎️</span>
            <span>3D Showroom</span>
          </a>
          <a
            routerLink="/enterprise-bi"
            routerLinkActive="bg-white text-cyan-700 border-cyan-500/30 shadow-sm font-semibold"
            class="px-3 py-1.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5">
            <span>📊</span>
            <span>Enterprise BI</span>
          </a>
          <a
            routerLink="/judge-guide"
            routerLinkActive="bg-white text-cyan-700 border-cyan-500/30 shadow-sm font-semibold"
            class="px-3 py-1.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5">
            <span>📋</span>
            <span>Judge Guide</span>
          </a>
        </nav>

        <!-- Status Badges & AI Trigger -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Runtime Mode Badge -->
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200/80 text-xs text-slate-700 shadow-xs">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                [ngClass]="webmcp.isNativeContext() ? 'bg-emerald-400' : 'bg-blue-400'"></span>
              <span class="relative inline-flex rounded-full h-2 w-2"
                [ngClass]="webmcp.isNativeContext() ? 'bg-emerald-500' : 'bg-blue-500'"></span>
            </span>
            <span class="text-slate-700 font-medium">
              {{ webmcp.isNativeContext() ? 'Native Browser Context' : 'WebMCP Polyfill' }}
            </span>
          </div>

          <!-- Registered Tools Count -->
          <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200/80 text-xs text-slate-700 shadow-xs">
            <svg class="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span class="font-semibold text-purple-700">{{ webmcp.registeredTools().length }}</span>
            <span class="text-slate-500">Tools</span>
          </div>

          <!-- AI Copilot Trigger -->
          <button
            (click)="openCopilot()"
            class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/15 to-purple-600/15 hover:from-cyan-500/25 hover:to-purple-600/25 border border-cyan-500/40 hover:border-cyan-500 text-xs font-semibold text-cyan-800 shadow-sm transition-all flex items-center gap-1.5">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>🤖 AI Copilot</span>
          </button>
        </div>

      </div>

      <!-- Route-Aware Agent Simulation Bar -->
      <div class="border-t border-slate-200/60 bg-white/40 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto flex items-center gap-2">
        <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
          @if (isEnterpriseRoute()) {
            Enterprise Simulators:
          } @else {
            3D Twin Simulators:
          }
        </span>

        @if (isEnterpriseRoute()) {
          <!-- Enterprise BI Simulation Actions -->
          <button
            (click)="triggerQueryMetrics()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-cyan-700 hover:border-cyan-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            📈 <span>query_enterprise_metrics()</span>
          </button>

          <button
            (click)="triggerFilterFlagged()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-rose-700 hover:border-rose-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            🚨 <span>filter_business_data('flagged')</span>
          </button>

          <button
            (click)="triggerKpiSummary()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-purple-700 hover:border-purple-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            🧮 <span>calculate_kpi_summary()</span>
          </button>

          <button
            (click)="triggerExportReport()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-emerald-700 hover:border-emerald-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            📑 <span>trigger_analytics_export('csv')</span>
          </button>

          <button
            (click)="triggerResetFilters()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            🔄 <span>Reset Filters</span>
          </button>
        } @else {
          <!-- 3D Showroom Simulation Actions -->
          <button
            (click)="triggerOrbit()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-cyan-700 hover:border-cyan-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            🔄 <span>Orbit 3D (+45°)</span>
          </button>

          <button
            (click)="triggerScreenshot()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-purple-700 hover:border-purple-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            📸 <span>take_screenshot()</span>
          </button>

          <button
            (click)="triggerColorChange('#00f0ff')"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-cyan-700 hover:border-cyan-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            🎨 <span>Paint Cyan</span>
          </button>

          <button
            (click)="triggerColorChange('#ff0055')"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white hover:text-rose-700 hover:border-rose-500/40 border border-slate-200 text-slate-700 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            🔥 <span>Paint Crimson</span>
          </button>

          <button
            (click)="triggerResetCamera()"
            class="px-2.5 py-1 text-xs rounded-md bg-white/80 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all whitespace-nowrap flex items-center gap-1">
            ✨ <span>Reset Camera</span>
          </button>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly webmcp = inject(WebMcpService);
  readonly copilot = inject(CopilotBridgeService);
  readonly router = inject(Router);
  readonly enterpriseData = inject(EnterpriseDataService);

  isEnterpriseRoute(): boolean {
    return this.router.url.includes('enterprise-bi');
  }

  openCopilot(): void {
    this.copilot.openDrawer();
  }

  // 3D Showroom Simulation Actions
  async triggerOrbit(): Promise<void> {
    try {
      await this.webmcp.executeTool('scene_3d_action', {
        action: 'rotate',
        deltaX: 45,
        durationMs: 600,
      });
    } catch (e) {
      console.warn('Orbit trigger notice:', e);
    }
  }

  async triggerScreenshot(): Promise<void> {
    try {
      await this.webmcp.executeTool('take_screenshot', {
        selector: 'canvas',
        format: 'image/png',
      });
    } catch (e) {
      console.warn('Screenshot trigger notice:', e);
    }
  }

  async triggerColorChange(color: string): Promise<void> {
    try {
      await this.webmcp.executeTool('scene_3d_action', {
        action: 'change_mesh_color',
        meshName: 'vehicle_chassis',
        hexColor: color,
      });
    } catch (e) {
      console.warn('Color trigger notice:', e);
    }
  }

  async triggerResetCamera(): Promise<void> {
    try {
      await this.webmcp.executeTool('scene_3d_action', {
        action: 'reset_camera',
        durationMs: 600,
      });
    } catch (e) {
      console.warn('Reset camera notice:', e);
    }
  }

  // Enterprise BI Simulation Actions
  async triggerQueryMetrics(): Promise<void> {
    try {
      await this.webmcp.executeTool('query_enterprise_metrics', {
        category: 'performance',
      });
    } catch (e) {
      console.warn('Query metrics trigger notice:', e);
    }
  }

  async triggerFilterFlagged(): Promise<void> {
    try {
      await this.webmcp.executeTool('filter_business_data', {
        status: 'flagged',
      });
    } catch (e) {
      console.warn('Filter flagged trigger notice:', e);
    }
  }

  async triggerKpiSummary(): Promise<void> {
    try {
      await this.webmcp.executeTool('calculate_kpi_summary', {
        metrics: ['revenue_ytd', 'system_latency', 'active_nodes'],
      });
    } catch (e) {
      console.warn('KPI summary trigger notice:', e);
    }
  }

  async triggerExportReport(): Promise<void> {
    try {
      await this.webmcp.executeTool('trigger_analytics_export', {
        format: 'csv',
        filterSummary: 'Executive Briefing Export',
      });
    } catch (e) {
      console.warn('Export report trigger notice:', e);
    }
  }

  triggerResetFilters(): void {
    this.enterpriseData.resetFilter();
  }
}
