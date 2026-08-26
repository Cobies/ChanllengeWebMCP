import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebMcpService } from '@webmcp/angular';
import { CopilotBridgeService } from '../../services/copilot-bridge.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <!-- Branding & Logo -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div class="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <span class="text-cyan-400 font-black text-xl tracking-tighter">W</span>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                WebMCP Angular Toolkit
              </h1>
              <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Angular 22
              </span>
            </div>
            <p class="text-xs text-slate-400">
              W3C Model Context Protocol for Browser AI Agents & 3D Digital Twins
            </p>
          </div>
        </div>

        <!-- Connection & Tools Status Badges -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Runtime Mode Badge -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                [ngClass]="webmcp.isNativeContext() ? 'bg-emerald-400' : 'bg-blue-400'"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5"
                [ngClass]="webmcp.isNativeContext() ? 'bg-emerald-500' : 'bg-blue-500'"></span>
            </span>
            <span class="text-slate-300 font-medium">
              {{ webmcp.isNativeContext() ? 'Native Browser Context' : 'WebMCP Emulator Polyfill' }}
            </span>
          </div>

          <!-- Registered Tools Count -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span class="font-semibold text-purple-400">{{ webmcp.registeredTools().length }}</span>
            <span class="text-slate-400">Tools Online</span>
          </div>

          <!-- AI Copilot Glowing Trigger Button -->
          <button
            (click)="openCopilot()"
            class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-600/20 hover:from-cyan-500/30 hover:to-purple-600/30 border border-cyan-500/50 hover:border-cyan-400 text-xs font-semibold text-cyan-300 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 group">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span>🤖 AI Copilot (Gemini 3.7)</span>
          </button>

          <!-- Devpost GitHub Link -->
          <a
            href="https://github.com/angular/angular"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5">
            <span>Devpost Challenge</span>
            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

      </div>

      <!-- Agent Simulation Bar -->
      <div class="border-t border-slate-800/60 bg-slate-950/40 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto flex items-center gap-2">
        <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Agent Simulators:
        </span>

        <button
          (click)="triggerOrbit()"
          class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 text-slate-300 transition-all whitespace-nowrap flex items-center gap-1">
          🔄 <span>Orbit 3D (+45°)</span>
        </button>

        <button
          (click)="triggerScreenshot()"
          class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-purple-950/40 hover:text-purple-300 hover:border-purple-500/40 border border-slate-800 text-slate-300 transition-all whitespace-nowrap flex items-center gap-1">
          📸 <span>take_screenshot()</span>
        </button>

        <button
          (click)="triggerColorChange('#00f0ff')"
          class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 text-slate-300 transition-all whitespace-nowrap flex items-center gap-1">
          🎨 <span>Paint Cyan</span>
        </button>

        <button
          (click)="triggerColorChange('#ff0055')"
          class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40 border border-slate-800 text-slate-300 transition-all whitespace-nowrap flex items-center gap-1">
          🔥 <span>Paint Crimson</span>
        </button>

        <button
          (click)="triggerResetCamera()"
          class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all whitespace-nowrap flex items-center gap-1">
          ✨ <span>Reset Camera</span>
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly webmcp = inject(WebMcpService);
  readonly copilot = inject(CopilotBridgeService);

  openCopilot(): void {
    this.copilot.openDrawer();
  }

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
}

