import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { WebMcpService } from '@webmcp/angular';
import { CopilotBridgeService } from '../../services/copilot-bridge.service';
import { SidebarModuleRegistryService } from '../../services/sidebar-module-registry.service';
import { ViewGuideService, ViewGuideTab } from '../../services/view-guide.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
      <div class="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <!-- Left: Mobile Menu Trigger & Branding -->
        <div class="flex items-center gap-3">
          <!-- Mobile Sidebar Drawer Hamburger -->
          <button
            (click)="toggleMobileDrawer()"
            class="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            aria-label="Open Navigation Drawer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Branding & Logo -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-xs shadow-cyan-500/20 shrink-0">
              <div class="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <span class="text-cyan-600 font-black text-lg tracking-tighter">W</span>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  WebMCP Angular Enterprise
                </h1>
                <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/80">
                  Angular 22
                </span>
              </div>
              <p class="text-xs text-slate-500 hidden sm:block">
                W3C Model Context Protocol for Enterprise Intelligence & 3D Twins
              </p>
            </div>
          </div>
        </div>

        <!-- Center: Navigation Tabs -->
        <nav class="flex items-center gap-1.5 p-1 bg-slate-200/60 border border-slate-300/60 rounded-xl text-xs font-medium self-start md:self-auto">
          <a
            routerLink="/3d-showroom"
            routerLinkActive="bg-white text-cyan-700 border-cyan-500/30 shadow-xs font-semibold"
            [routerLinkActiveOptions]="{ exact: false }"
            class="px-3 py-1.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5">
            <span>🏎️</span>
            <span>3D Showroom</span>
          </a>
          <a
            routerLink="/enterprise-bi"
            routerLinkActive="bg-white text-cyan-700 border-cyan-500/30 shadow-xs font-semibold"
            class="px-3 py-1.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5">
            <span>📊</span>
            <span>Enterprise BI</span>
          </a>
          <a
            routerLink="/judge-guide"
            routerLinkActive="bg-white text-cyan-700 border-cyan-500/30 shadow-xs font-semibold"
            class="px-3 py-1.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5">
            <span>📋</span>
            <span>Judge Guide</span>
          </a>
        </nav>

        <!-- Right: Status Badges, View Guide & AI Trigger -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- View Guide Documentation Trigger -->
          <button
            (click)="openViewGuide()"
            class="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-300 text-xs font-semibold text-slate-700 hover:text-cyan-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open Interactive Views Documentation & WebMCP Tool Guide">
            <span>📖</span>
            <span class="hidden sm:inline">View Guide</span>
          </button>

          <!-- Runtime Mode Badge -->
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                [ngClass]="webmcp.isNativeContext() ? 'bg-emerald-400' : 'bg-blue-400'"></span>
              <span class="relative inline-flex rounded-full h-2 w-2"
                [ngClass]="webmcp.isNativeContext() ? 'bg-emerald-500' : 'bg-blue-500'"></span>
            </span>
            <span class="text-slate-700 font-medium">
              {{ webmcp.isNativeContext() ? 'Native Context' : 'Polyfill' }}
            </span>
          </div>

          <!-- Registered Tools Count -->
          <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
            <svg class="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span class="font-semibold text-purple-700">{{ webmcp.registeredTools().length }}</span>
            <span class="text-slate-500">Tools</span>
          </div>

          <!-- AI Copilot Trigger -->
          <button
            (click)="openCopilot()"
            class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/15 to-purple-600/15 hover:from-cyan-500/25 hover:to-purple-600/25 border border-cyan-500/40 hover:border-cyan-500 text-xs font-semibold text-cyan-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>🤖 Copilot</span>
          </button>
        </div>

      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly webmcp = inject(WebMcpService);
  readonly copilot = inject(CopilotBridgeService);
  readonly router = inject(Router);
  readonly sidebarRegistry = inject(SidebarModuleRegistryService);
  readonly guideService = inject(ViewGuideService);

  toggleMobileDrawer(): void {
    this.sidebarRegistry.toggleMobileDrawer();
  }

  openCopilot(): void {
    this.copilot.openDrawer();
  }

  openViewGuide(): void {
    const url = this.router.url || '';
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
