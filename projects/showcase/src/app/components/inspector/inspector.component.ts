import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebMcpService, WebMcpExecutionLog } from '@webmcp/angular';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-[520px]">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <span>WebMCP Live Inspector</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h2>
            <p class="text-xs text-slate-400">Real-Time Tool Invocation & Audit Stream</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="webmcp.clearLogs()"
            class="px-2.5 py-1 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors">
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
            <p class="text-[11px] text-slate-600">Click any simulation button above or send tool calls via WebMCP context.</p>
          </div>
        }

        @for (log of webmcp.executionLogs(); track log.id) {
          <div
            class="p-3 rounded-xl bg-slate-900/80 border transition-all"
            [ngClass]="log.error ? 'border-rose-500/30 bg-rose-950/10' : 'border-slate-800/80 hover:border-slate-700'">
            
            <!-- Log Meta Bar -->
            <div class="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div class="flex items-center gap-2">
                <!-- Status Dot -->
                <span
                  class="w-2 h-2 rounded-full"
                  [ngClass]="log.error ? 'bg-rose-500' : 'bg-emerald-400'"></span>
                
                <!-- Tool Name -->
                <span class="font-bold text-cyan-400">{{ log.toolName }}()</span>
                
                <!-- Source Badge -->
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
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
            <div class="text-[11px] text-slate-400 mb-1 bg-slate-950/60 p-2 rounded-lg border border-slate-900 overflow-x-auto">
              <span class="text-purple-400 font-semibold block mb-0.5">Params:</span>
              <pre class="whitespace-pre-wrap font-mono text-[10px] text-slate-300">{{ safeJsonStringify(log.parameters) }}</pre>
            </div>

            <!-- Result / Error -->
            @if (log.error) {
              <div class="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
                <span class="font-semibold block mb-0.5">Error:</span>
                <span class="font-mono">{{ log.error }}</span>
              </div>
            } @else if (log.result) {
              <div class="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/30 overflow-x-auto">
                <span class="font-semibold text-emerald-400 block mb-0.5">Result:</span>
                <pre class="whitespace-pre-wrap font-mono text-[10px] text-slate-300">{{ safeJsonStringify(log.result) }}</pre>
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

  constructor(webmcp?: WebMcpService) {
    this.webmcp = webmcp || inject(WebMcpService);
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
