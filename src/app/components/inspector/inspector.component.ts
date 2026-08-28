import { Component, inject, signal, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebMcpService, WebMcpExecutionLog } from '@webmcp/angular';
import { ViewGuideService } from '../../services/view-guide.service';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel rounded-2xl p-5 border border-slate-200/80 flex flex-col h-[520px]">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <span>WebMCP Live Inspector</span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h2>
            <p class="text-xs text-slate-500">Real-Time Tool Invocation & Audit Stream</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="openGuide()"
            class="px-2.5 py-1 text-xs rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 transition-colors shadow-2xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Open Inspector Documentation">
            <span>📖</span>
            <span>Guide</span>
          </button>
          <button
            (click)="webmcp.clearLogs()"
            class="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs cursor-pointer">
            Clear Logs
          </button>
        </div>
      </div>

      <!-- Log Entries Container -->
      <div class="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
        @if (webmcp.executionLogs().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <svg class="w-8 h-8 opacity-40 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p class="text-xs">Awaiting agent or user tool executions...</p>
            <p class="text-[11px] text-slate-400">Click any simulation button above or send tool calls via WebMCP context.</p>
          </div>
        }

        @for (log of webmcp.executionLogs(); track log.id) {
          <div
            class="p-3 rounded-xl bg-white/80 border transition-all text-slate-800 shadow-xs"
            [ngClass]="log.error ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200/80 hover:border-slate-300'">
            
            <!-- Log Meta Bar -->
            <div class="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div class="flex items-center gap-2">
                <!-- Status Dot -->
                <span
                  class="w-2 h-2 rounded-full"
                  [ngClass]="log.error ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                
                <!-- Tool Name -->
                <span class="font-bold text-cyan-700">{{ log.toolName }}()</span>
                
                <!-- Source Badge -->
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                  {{ log.source }}
                </span>
              </div>

              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <span>{{ log.durationMs }}ms</span>
                <span>•</span>
                <span>{{ formatTime(log.timestamp) }}</span>
              </div>
            </div>

            <!-- Parameters Preview -->
            <div class="text-[11px] text-slate-700 mb-1 bg-slate-100/80 p-2 rounded-lg border border-slate-200 overflow-x-auto">
              <span class="text-purple-700 font-semibold block mb-0.5">Params:</span>
              <pre class="whitespace-pre-wrap font-mono text-[10px] text-slate-800">{{ safeJsonStringify(log.parameters) }}</pre>
            </div>

            <!-- Result / Error -->
            @if (log.error) {
              <div class="text-[11px] text-rose-900 bg-rose-50/80 p-2 rounded-lg border border-rose-200">
                <span class="font-semibold text-rose-700 block mb-0.5">Error:</span>
                <span class="font-mono">{{ log.error }}</span>
              </div>
            } @else if (log.result) {
              <div class="text-[11px] text-emerald-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 overflow-x-auto">
                <span class="font-semibold text-emerald-700 block mb-0.5">Result:</span>
                <pre class="whitespace-pre-wrap font-mono text-[10px] text-emerald-950">{{ safeJsonStringify(log.result) }}</pre>
              </div>
            }

          </div>
        }
      </div>

    </div>
  `,
})
export class InspectorComponent {
  readonly webmcp: WebMcpService;
  readonly guideService: ViewGuideService;

  constructor(
    @Optional() webmcp?: WebMcpService,
    @Optional() guideService?: ViewGuideService
  ) {
    if (webmcp) {
      this.webmcp = webmcp;
    } else {
      try {
        this.webmcp = inject(WebMcpService, { optional: true }) || new WebMcpService();
      } catch {
        this.webmcp = new WebMcpService();
      }
    }

    if (guideService) {
      this.guideService = guideService;
    } else {
      try {
        this.guideService = inject(ViewGuideService, { optional: true }) || new ViewGuideService();
      } catch {
        this.guideService = new ViewGuideService();
      }
    }
  }

  openGuide(): void {
    this.guideService.openGuide('inspector');
  }

  formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }

  /**
   * Safely stringify JSON to prevent injection and truncate base64 image data strings.
   */
  safeJsonStringify(obj: unknown): string {
    if (obj === undefined || obj === null) return 'null';
    try {
      return JSON.stringify(
        obj,
        (key, val) => {
          if (typeof val === 'string' && val.startsWith('data:image/')) {
            return `${val.substring(0, 32)}... [base64 image payload truncated: ${val.length} bytes]`;
          }
          return val;
        },
        2
      );
    } catch {
      return String(obj);
    }
  }
}
