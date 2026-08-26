import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-judge-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col gap-5">
      
      <!-- Section Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                Devpost Evaluator & Judge Master Guide
              </h2>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                100% W3C WebMCP
              </span>
            </div>
            <p class="text-xs text-slate-400">Comprehensive verification guide for browser-native and emulated AI tool capabilities</p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 border border-slate-800/90 rounded-xl text-xs">
          <button
            (click)="activeTab.set('copilot')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'copilot' ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'">
            🤖 Gemini Copilot
          </button>
          <button
            (click)="activeTab.set('enterprise')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'enterprise' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'">
            📊 Enterprise BI
          </button>
          <button
            (click)="activeTab.set('3d')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === '3d' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'">
            🏎️ 3D Digital Twin
          </button>
          <button
            (click)="activeTab.set('rubric')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'rubric' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'">
            🏆 Rubric Checklist
          </button>
          <button
            (click)="activeTab.set('chrome')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'chrome' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'">
            🌐 Chrome Flag
          </button>
          <button
            (click)="activeTab.set('architecture')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'architecture' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'">
            🏗️ Architecture
          </button>
        </div>
      </div>

      <!-- Tab Content: Gemini Copilot Guide -->
      @if (activeTab() === 'copilot') {
        <div class="space-y-4 text-xs text-slate-300">
          <div class="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-slate-900/60 border border-cyan-500/30 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-cyan-400 text-sm flex items-center gap-2">
                <span>🤖 Live Autonomous Copilot with Gemini 3.7 Flash High</span>
                <span class="px-2 py-0.5 text-[9px] rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono">
                  CPAMC Bridge Proxy
                </span>
              </h3>
            </div>
            <p class="text-slate-300 leading-relaxed text-xs">
              Click the glowing <strong class="text-cyan-300">"🤖 AI Copilot"</strong> button in the top header or floating bottom launcher. The agent connects to the local proxy, automatically queries browser registered WebMCP tools, formats them into OpenAI/Gemini function schemas, and executes an autonomous multi-turn tool calling loop (up to 5 turns).
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span class="text-cyan-400 font-mono font-bold text-xs block">📸 Multimodal Vision</span>
                <span class="text-slate-400 text-[11px] leading-relaxed block">
                  Takes live WebGL canvas captures and renders interactive expandible cards right inside the chat stream.
                </span>
              </div>
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span class="text-purple-400 font-mono font-bold text-xs block">⚡ Real-Time Action Bus</span>
                <span class="text-slate-400 text-[11px] leading-relaxed block">
                  Rotates 3D models, triggers camera animations, highlights meshes, and autofills Angular reactive forms.
                </span>
              </div>
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span class="text-emerald-400 font-mono font-bold text-xs block">📊 Enterprise BI Tools</span>
                <span class="text-slate-400 text-[11px] leading-relaxed block">
                  Queries metrics, filters flagged transactions, computes KPI aggregations, and generates cryptographic audit exports.
                </span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab Content: Enterprise BI Tools -->
      @if (activeTab() === 'enterprise') {
        <div class="space-y-4 text-xs">
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 class="font-bold text-cyan-400 mb-1">📊 Enterprise BI WebMCP Toolset</h3>
            <p class="text-slate-400 text-xs">
              When navigated to <code class="text-cyan-300">/enterprise-bi</code>, these 4 enterprise intelligence tools are dynamically registered with the WebMCP runtime:
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-cyan-400">query_enterprise_metrics</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">Category / Time</span>
              </div>
              <p class="text-slate-400 text-[11px]">
                Fetches operational KPIs (Revenue, Latency, Nodes, Threats) and historical series.
              </p>
              <div class="p-2 rounded bg-slate-900 font-mono text-[10px] text-slate-300">
                "Query all performance metrics and summarize average latency."
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-cyan-400">filter_business_data</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">Status / Dept</span>
              </div>
              <p class="text-slate-400 text-[11px]">
                Filters the live transactions table reactively by status, minimum amount, or department.
              </p>
              <div class="p-2 rounded bg-slate-900 font-mono text-[10px] text-slate-300">
                "Filter dataset to show only flagged anomalous transactions over $1,000."
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-cyan-400">calculate_kpi_summary</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">KPI Aggregation</span>
              </div>
              <p class="text-slate-400 text-[11px]">
                Computes real-time sums, averages, anomaly rates, and department breakdowns.
              </p>
              <div class="p-2 rounded bg-slate-900 font-mono text-[10px] text-slate-300">
                "Calculate KPI summary for revenue_ytd and active_nodes with totals."
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-cyan-400">trigger_analytics_export</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">Audit & Hash</span>
              </div>
              <p class="text-slate-400 text-[11px]">
                Generates verifiable CSV/JSON export report with cryptographic SHA-256 integrity checksum.
              </p>
              <div class="p-2 rounded bg-slate-900 font-mono text-[10px] text-slate-300">
                "Generate a CSV analytics audit export for the current filtered view."
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab Content: 3D Digital Twin Tools -->
      @if (activeTab() === '3d') {
        <div class="space-y-4 text-xs">
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 class="font-bold text-cyan-400 mb-1">🏎️ 3D Digital Twin WebMCP Toolset</h3>
            <p class="text-slate-400 text-xs">
              On <code class="text-cyan-300">/3d-showroom</code>, these 3D graphics & form automation tools provide multimodal co-piloting:
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span class="font-mono font-bold text-purple-400 block">scene_3d_action</span>
              <p class="text-slate-400 text-[11px]">
                Rotates camera, lerps zoom, changes chassis material colors, and highlights parts.
              </p>
            </div>
            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span class="font-mono font-bold text-purple-400 block">take_screenshot</span>
              <p class="text-slate-400 text-[11px]">
                Extracts WebGL frame buffer as base64 PNG data URL directly on the client.
              </p>
            </div>
            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span class="font-mono font-bold text-purple-400 block">form_action_runner</span>
              <p class="text-slate-400 text-[11px]">
                Validates and fills Angular Reactive Form controls (driveMode, turbo, color, spoiler).
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Tab Content: Rubric Checklist -->
      @if (activeTab() === 'rubric') {
        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <span class="font-bold text-white">Innovation & User Experience</span>
              </div>
              <p class="text-slate-400 text-[11px] leading-relaxed">
                Seamless multi-route Angular 22 dashboard combining Three.js 3D WebGL rendering, Enterprise BI analytics, and conversational Gemini 3.7 Copilot drawer.
              </p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <span class="font-bold text-white">Technical Execution & Signals</span>
              </div>
              <p class="text-slate-400 text-[11px] leading-relaxed">
                Full Angular 22 Signals reactive architecture (<code class="text-cyan-300">signal</code>, <code class="text-cyan-300">computed</code>), standalone components, lazy routes with <code class="text-cyan-300">provideRouter</code>.
              </p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <span class="font-bold text-white">W3C WebMCP Standard Compliance</span>
              </div>
              <p class="text-slate-400 text-[11px] leading-relaxed">
                Full JSON Schema parameter typing, dynamic tool registration/deregistration on route navigation, and dual native/emulator fallback.
              </p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <span class="font-bold text-white">Security & Threat Mitigations</span>
              </div>
              <p class="text-slate-400 text-[11px] leading-relaxed">
                Base64 payload truncation in agent completion history, strict schema validation, sanitized inspector rendering, and recursive loop guards.
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Tab Content: Chrome Flag Setup -->
      @if (activeTab() === 'chrome') {
        <div class="space-y-3 text-xs text-slate-300">
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h3 class="font-bold text-cyan-400 flex items-center gap-1.5">
              <span>1. Enable Native WebMCP in Chrome Canary</span>
            </h3>
            <p class="text-slate-400">
              To test with genuine browser-native WebMCP execution:
            </p>
            <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[11px] text-cyan-300 select-all">
              chrome://flags/#enable-webmcp-testing
            </div>
            <p class="text-slate-400">
              Set the flag to <strong class="text-emerald-400">Enabled</strong> and relaunch Chrome. The header badge will immediately illuminate in green as <strong class="text-slate-200">Native Browser Context</strong>.
            </p>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <h3 class="font-bold text-purple-400">
              2. Seamless Local Emulator Fallback
            </h3>
            <p class="text-slate-400 leading-relaxed">
              Without the flag enabled or in standard browsers, the built-in <code class="text-cyan-300">WebMcpEmulator</code> transparently attaches to <code class="text-purple-300">window.modelContext</code>, allowing 100% full tool execution, schema validation, and live event monitoring.
            </p>
          </div>
        </div>
      }

      <!-- Tab Content: Architecture -->
      @if (activeTab() === 'architecture') {
        <div class="space-y-3 text-xs text-slate-300">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-cyan-400 block mb-1">Angular 22 Signals Core</span>
              <p class="text-[11px] text-slate-400 leading-relaxed">Fine-grained reactive signals binding agent tool state with zero change-detection overhead and reactive computed aggregations.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-purple-400 block mb-1">Dynamic Tool Lifecycle</span>
              <p class="text-[11px] text-slate-400 leading-relaxed">Angular lifecycle hooks (ngOnInit & ngOnDestroy) register and deregister route-specific WebMCP tools automatically.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-emerald-400 block mb-1">Client-side Multimodal Vision</span>
              <p class="text-[11px] text-slate-400 leading-relaxed">Direct WebGL buffer readback yielding zero-latency base64 image data URLs for LLM visual reasoning.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-amber-400 block mb-1">Autonomous Multi-Turn Loop</span>
              <p class="text-[11px] text-slate-400 leading-relaxed">Gemini 3.7 Flash High copilot executes recursive tool calling up to 5 turns with base64 context sanitization.</p>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class JudgeGuideComponent {
  activeTab = signal<'copilot' | 'enterprise' | '3d' | 'rubric' | 'chrome' | 'architecture'>('copilot');
}
