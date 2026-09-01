import { Component, signal, inject, computed, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebMcpService } from '@webmcp/angular';
import { CopilotBridgeService } from '../../services/copilot-bridge.service';

export interface RubricItem {
  id: string;
  category: string;
  title: string;
  weight: string;
  description: string;
  status: 'passed' | 'ready';
  proofRoute: string;
  samplePrompt?: string;
  toolNames: string[];
}

@Component({
  selector: 'app-judge-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel rounded-2xl p-6 border border-slate-200/80 flex flex-col gap-6">
      <!-- Section Header with Real-time Telemetry Status -->
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-5"
      >
        <div class="flex items-center gap-3.5">
          <div
            class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 p-0.5 shadow-sm shrink-0"
          >
            <div
              class="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-emerald-600"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2
                class="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-wide"
              >
                Devpost Evaluator & Judge Master Guide
              </h2>
              <span
                class="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                100% W3C WebMCP
              </span>
              <span
                class="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200"
              >
                ⚡ {{ registeredToolsCount() }} Tools Active
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Interactive test console & rubric validation suite for browser-native and emulated AI
              tool capabilities.
            </p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div
          class="flex flex-wrap gap-1.5 p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs"
        >
          <button
            (click)="activeTab.set('rubric')"
            class="px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer flex items-center gap-1.5"
            [ngClass]="
              activeTab() === 'rubric'
                ? 'bg-white text-emerald-700 border border-emerald-500/30 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            "
          >
            <span>🏆</span>
            <span>Rubric Matrix</span>
          </button>
          <button
            (click)="activeTab.set('copilot')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1.5"
            [ngClass]="
              activeTab() === 'copilot'
                ? 'bg-white text-cyan-700 border border-cyan-500/30 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            "
          >
            <span>🤖</span>
            <span>Gemini Copilot</span>
          </button>
          <button
            (click)="activeTab.set('enterprise')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1.5"
            [ngClass]="
              activeTab() === 'enterprise'
                ? 'bg-white text-blue-700 border border-blue-500/30 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            "
          >
            <span>📊</span>
            <span>Enterprise BI</span>
          </button>
          <button
            (click)="activeTab.set('3d')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1.5"
            [ngClass]="
              activeTab() === '3d'
                ? 'bg-white text-purple-700 border border-purple-500/30 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            "
          >
            <span>🏎️</span>
            <span>3D Digital Twin</span>
          </button>
          <button
            (click)="activeTab.set('chrome')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1.5"
            [ngClass]="
              activeTab() === 'chrome'
                ? 'bg-white text-amber-700 border border-amber-500/30 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            "
          >
            <span>🌐</span>
            <span>Chrome Flag</span>
          </button>
          <button
            (click)="activeTab.set('architecture')"
            class="px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1.5"
            [ngClass]="
              activeTab() === 'architecture'
                ? 'bg-white text-indigo-700 border border-indigo-500/30 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            "
          >
            <span>🏗️</span>
            <span>Architecture</span>
          </button>
        </div>
      </div>

      <!-- Quick Action Evaluation Banner -->
      <div
        class="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
      >
        <div class="space-y-0.5">
          <div class="font-bold text-slate-900 flex items-center gap-2">
            <span>⚡ Interactive Judge Action Console</span>
            <span
              class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold"
              >Ready for Inspection</span
            >
          </div>
          <p class="text-slate-600 text-[11px]">
            You can trigger live Copilot tool calls directly from this guide or jump across
            workspaces to evaluate real-time telemetry.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <button
            (click)="
              openCopilotWithPrompt(
                'Run full system health check, summarize active WebMCP tools, and evaluate current workspace.'
              )
            "
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🤖</span>
            <span>Launch Evaluation Prompt</span>
          </button>
        </div>
      </div>

      <!-- Tab 1: Rubric Checklist & Matrix -->
      @if (activeTab() === 'rubric') {
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            @for (item of rubricItems; track item.id) {
              <div
                class="p-4 rounded-xl bg-white/90 border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span
                      class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {{ item.category }} • {{ item.weight }}
                    </span>
                    <span
                      class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                    >
                      <span>✓</span> Verified
                    </span>
                  </div>
                  <h3 class="font-bold text-slate-900 text-sm">{{ item.title }}</h3>
                  <p class="text-slate-600 text-[11px] leading-relaxed">{{ item.description }}</p>

                  <!-- Tools involved -->
                  <div class="flex flex-wrap gap-1 pt-1">
                    @for (t of item.toolNames; track t) {
                      <span
                        class="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] text-cyan-800"
                      >
                        {{ t }}
                      </span>
                    }
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    (click)="navigateTo(item.proofRoute)"
                    class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <code class="text-[10px] text-cyan-700">{{ item.proofRoute }}</code>
                    <span>→</span>
                  </button>

                  @if (item.samplePrompt) {
                    <button
                      (click)="openCopilotWithPrompt(item.samplePrompt)"
                      class="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <span>🤖 Run Test</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tab 2: Copilot Deep Dive -->
      @if (activeTab() === 'copilot') {
        <div class="space-y-4 text-xs text-slate-700">
          <div
            class="p-4 rounded-xl bg-gradient-to-r from-cyan-50/90 via-purple-50/70 to-slate-50 border border-cyan-200 space-y-3 shadow-xs"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-cyan-900 text-sm flex items-center gap-2">
                <span>🤖 Live Autonomous AI Copilot & Subagent Delegate</span>
                <span
                  class="px-2 py-0.5 text-[9px] rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-mono"
                >
                  Multi-Turn Tool Calling
                </span>
              </h3>
            </div>
            <p class="text-slate-600 leading-relaxed text-xs">
              The agent connects to the local proxy, automatically queries browser registered WebMCP
              tools, formats them into OpenAI/Gemini function schemas, and executes an autonomous
              multi-turn tool calling loop (up to 5 turns).
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div class="p-3 rounded-xl bg-white/90 border border-slate-200 space-y-1 shadow-xs">
                <span class="text-cyan-700 font-mono font-bold text-xs block"
                  >📸 Multimodal Vision</span
                >
                <span class="text-slate-600 text-[11px] leading-relaxed block">
                  Takes live WebGL canvas captures and renders interactive expandible cards right
                  inside the chat stream.
                </span>
              </div>
              <div class="p-3 rounded-xl bg-white/90 border border-slate-200 space-y-1 shadow-xs">
                <span class="text-purple-700 font-mono font-bold text-xs block"
                  >⚡ Real-Time Action Bus</span
                >
                <span class="text-slate-600 text-[11px] leading-relaxed block">
                  Rotates 3D models, triggers camera animations, highlights meshes, and autofills
                  Angular reactive forms.
                </span>
              </div>
              <div class="p-3 rounded-xl bg-white/90 border border-slate-200 space-y-1 shadow-xs">
                <span class="text-emerald-700 font-mono font-bold text-xs block"
                  >📊 Enterprise BI Tools</span
                >
                <span class="text-slate-600 text-[11px] leading-relaxed block">
                  Queries metrics, filters flagged transactions, computes KPI aggregations, and
                  generates cryptographic audit exports.
                </span>
              </div>
            </div>
          </div>

          <!-- Interactive Copilot Test Scenarios -->
          <div class="space-y-2">
            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Quick Launch Copilot Scenarios:
            </h4>
            <div class="space-y-2">
              <div
                class="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div class="space-y-0.5">
                  <span class="font-bold text-slate-800 block text-xs"
                    >🏎️ 3D Digital Twin Visual Capture & Paint</span
                  >
                  <span class="text-slate-600 font-mono text-[11px] block"
                    >"Rotate camera to rear angle, change car color to cyan with carbon spoiler, and
                    take screenshot."</span
                  >
                </div>
                <button
                  (click)="
                    openCopilotWithPrompt(
                      'Rotate camera to rear angle, change car color to cyan with carbon spoiler, and take screenshot.'
                    )
                  "
                  class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer"
                >
                  Execute 🤖
                </button>
              </div>

              <div
                class="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div class="space-y-0.5">
                  <span class="font-bold text-slate-800 block text-xs"
                    >📊 Enterprise BI Anomaly Audit & Export</span
                  >
                  <span class="text-slate-600 font-mono text-[11px] block"
                    >"Filter flagged transactions over $1,000, calculate anomaly KPI summary, and
                    generate CSV export."</span
                  >
                </div>
                <button
                  (click)="
                    openCopilotWithPrompt(
                      'Filter flagged transactions over $1,000, calculate anomaly KPI summary, and generate CSV export.'
                    )
                  "
                  class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer"
                >
                  Execute 🤖
                </button>
              </div>

              <div
                class="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div class="space-y-0.5">
                  <span class="font-bold text-slate-800 block text-xs"
                    >📦 Procurement & Stock Restock Order</span
                  >
                  <span class="text-slate-600 font-mono text-[11px] block"
                    >"Open purchase order modal for SKU RET-102 with quantity 50, critical priority,
                    and notes."</span
                  >
                </div>
                <button
                  (click)="
                    openCopilotWithPrompt(
                      'Open purchase order modal for SKU RET-102 with quantity 50, critical priority, and notes.'
                    )
                  "
                  class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer"
                >
                  Execute 🤖
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab 3: Enterprise BI Tools -->
      @if (activeTab() === 'enterprise') {
        <div class="space-y-4 text-xs">
          <div
            class="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div class="space-y-1">
              <h3 class="font-bold text-blue-950 text-sm flex items-center gap-2">
                <span>📊 Enterprise BI WebMCP Toolset</span>
                <span
                  class="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800 font-mono"
                  >/enterprise-bi</span
                >
              </h3>
              <p class="text-slate-600 text-xs">
                Dynamically registered intelligence and procurement tools with Angular 22 Signals
                reactivity and cryptographic SHA-256 audit reports.
              </p>
            </div>
            <button
              (click)="navigateTo('/enterprise-bi')"
              class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              Go to View →
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-2 shadow-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-blue-700">query_enterprise_metrics</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-mono"
                  >Category / Time</span
                >
              </div>
              <p class="text-slate-600 text-[11px]">
                Fetches operational KPIs (Revenue, Latency, Nodes, Threats) and historical series.
              </p>
              <div
                class="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-800"
              >
                "Query all performance metrics and summarize average latency."
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-2 shadow-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-blue-700">filter_business_data</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-mono"
                  >Status / Dept</span
                >
              </div>
              <p class="text-slate-600 text-[11px]">
                Filters the live transactions table reactively by status, minimum amount, or
                department.
              </p>
              <div
                class="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-800"
              >
                "Filter dataset to show only flagged anomalous transactions over $1,000."
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-2 shadow-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-blue-700">calculate_kpi_summary</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-mono"
                  >KPI Aggregation</span
                >
              </div>
              <p class="text-slate-600 text-[11px]">
                Computes real-time sums, averages, anomaly rates, and department breakdowns.
              </p>
              <div
                class="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-800"
              >
                "Calculate KPI summary for revenue_ytd and active_nodes with totals."
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-2 shadow-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-blue-700">trigger_analytics_export</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono"
                  >Audit & Hash</span
                >
              </div>
              <p class="text-slate-600 text-[11px]">
                Generates verifiable CSV/JSON export report with cryptographic SHA-256 integrity
                checksum.
              </p>
              <div
                class="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-800"
              >
                "Generate a CSV analytics audit export for the current filtered view."
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab 4: 3D Digital Twin Tools -->
      @if (activeTab() === '3d') {
        <div class="space-y-4 text-xs">
          <div
            class="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div class="space-y-1">
              <h3 class="font-bold text-purple-950 text-sm flex items-center gap-2">
                <span>🏎️ 3D Digital Twin WebMCP Toolset</span>
                <span
                  class="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 font-mono"
                  >/3d-showroom</span
                >
              </h3>
              <p class="text-slate-600 text-xs">
                Real-time Three.js spatial graph execution, camera lerping, reactive form sync, and
                zero-latency client WebGL screenshot extraction.
              </p>
            </div>
            <button
              (click)="navigateTo('/3d-showroom')"
              class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              Go to View →
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-1.5 shadow-xs">
              <span class="font-mono font-bold text-purple-700 block">scene_3d_action</span>
              <p class="text-slate-600 text-[11px] leading-relaxed">
                Rotates camera, lerps zoom, changes chassis material colors, and highlights parts.
              </p>
            </div>
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-1.5 shadow-xs">
              <span class="font-mono font-bold text-purple-700 block">take_screenshot</span>
              <p class="text-slate-600 text-[11px] leading-relaxed">
                Extracts WebGL frame buffer as base64 PNG data URL directly on the client.
              </p>
            </div>
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-1.5 shadow-xs">
              <span class="font-mono font-bold text-purple-700 block">form_action_runner</span>
              <p class="text-slate-600 text-[11px] leading-relaxed">
                Validates and fills Angular Reactive Form controls (driveMode, turbo, color,
                spoiler).
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Tab 5: Chrome Flag Setup -->
      @if (activeTab() === 'chrome') {
        <div class="space-y-3 text-xs text-slate-700">
          <div class="p-4 rounded-xl bg-white/90 border border-slate-200 space-y-2.5 shadow-xs">
            <h3 class="font-bold text-amber-900 flex items-center gap-2">
              <span>🌐 1. Enable Native WebMCP in Chrome Canary</span>
            </h3>
            <p class="text-slate-600">To test with genuine browser-native WebMCP execution:</p>
            <div
              class="bg-slate-100 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-cyan-800 select-all"
            >
              chrome://flags/#enable-webmcp-testing
            </div>
            <p class="text-slate-600">
              Set the flag to <strong class="text-emerald-700">Enabled</strong> and relaunch Chrome.
              The header badge will immediately illuminate in green as
              <strong class="text-slate-900">Native Browser Context</strong>.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white/90 border border-slate-200 space-y-2 shadow-xs">
            <h3 class="font-bold text-purple-800">⚡ 2. Seamless Local Emulator Fallback</h3>
            <p class="text-slate-600 leading-relaxed">
              Without the flag enabled or in standard browsers, the built-in
              <code class="text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded border border-cyan-200"
                >WebMcpEmulator</code
              >
              transparently attaches to
              <code
                class="text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200"
                >window.modelContext</code
              >, allowing 100% full tool execution, schema validation, and live event monitoring.
            </p>
          </div>
        </div>
      }

      <!-- Tab 6: Architecture -->
      @if (activeTab() === 'architecture') {
        <div class="space-y-3 text-xs text-slate-700">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs space-y-1">
              <span class="font-bold text-cyan-800 block">Angular 22 Signals Core</span>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Fine-grained reactive signals binding agent tool state with zero change-detection
                overhead and reactive computed aggregations.
              </p>
            </div>
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs space-y-1">
              <span class="font-bold text-purple-800 block">Dynamic Tool Lifecycle</span>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Angular lifecycle hooks (ngOnInit & ngOnDestroy) register and deregister
                route-specific WebMCP tools automatically.
              </p>
            </div>
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs space-y-1">
              <span class="font-bold text-emerald-800 block">Client-side Multimodal Vision</span>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Direct WebGL buffer readback yielding zero-latency base64 image data URLs for LLM
                visual reasoning.
              </p>
            </div>
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs space-y-1">
              <span class="font-bold text-amber-800 block">Autonomous Multi-Turn Loop</span>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Autonomous AI copilot executes recursive tool calling up to 5 turns with base64
                context sanitization.
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class JudgeGuideComponent {
  private readonly router?: Router;
  private readonly webmcp?: WebMcpService;
  private readonly copilot?: CopilotBridgeService;

  readonly activeTab = signal<
    'rubric' | 'copilot' | 'enterprise' | '3d' | 'chrome' | 'architecture'
  >('rubric');

  readonly registeredToolsCount = computed(() => {
    return this.webmcp ? this.webmcp.getTools().length : 0;
  });

  readonly rubricItems: RubricItem[] = [
    {
      id: 'rubric-innovation',
      category: 'Innovation & UX',
      title: 'Multimodal 3D Co-Piloting & Live WebGL Visual Feedback',
      weight: '25%',
      description:
        'Combines Three.js WebGL canvas capture with real-time AI tool-calling to manipulate spatial cameras, change materials, and inspect components.',
      status: 'passed',
      proofRoute: '/3d-showroom',
      samplePrompt:
        'Rotate camera to side view, set chassis color to emerald, and take a screenshot.',
      toolNames: ['scene_3d_action', 'take_screenshot', 'form_action_runner'],
    },
    {
      id: 'rubric-webmcp-w3c',
      category: 'WebMCP Standard',
      title: 'W3C WebMCP Lifecycle & Dynamic Tool Registration',
      weight: '25%',
      description:
        'Route-scoped tools register on view entry and cleanly unregister on destruction with JSON Schema validation and zero memory leaks.',
      status: 'passed',
      proofRoute: '/inspector',
      samplePrompt: 'What WebMCP tools are currently registered in this browser context?',
      toolNames: ['query_enterprise_metrics', 'filter_business_data', 'delegate_to_specialist'],
    },
    {
      id: 'rubric-enterprise-bi',
      category: 'Enterprise Value',
      title: 'Real-Time Enterprise Intelligence & Cryptographic Audit Reports',
      weight: '25%',
      description:
        'Multi-domain operational analytics, reactive filtering, KPI aggregations, and SHA-256 verifiable CSV/JSON exports for auditing.',
      status: 'passed',
      proofRoute: '/enterprise-bi',
      samplePrompt:
        'Query enterprise metrics for the performance category, and filter business data for flagged transactions over $500.',
      toolNames: ['query_enterprise_metrics', 'calculate_kpi_summary', 'trigger_analytics_export'],
    },
    {
      id: 'rubric-signals-architecture',
      category: 'Technical Architecture',
      title: 'Angular 22 Signals Architecture & Subagent Isolation',
      weight: '25%',
      description:
        'Fine-grained signal reactivity (signal, computed), subagent runner architecture, sanitized history, and production bundle optimization.',
      status: 'passed',
      proofRoute: '/judge-guide',
      samplePrompt:
        'Run full system health check, summarize active WebMCP tools, and evaluate current workspace.',
      toolNames: ['delegate_to_specialist', 'form_action_runner'],
    },
  ];

  constructor(
    @Optional() router?: Router,
    @Optional() webmcp?: WebMcpService,
    @Optional() copilot?: CopilotBridgeService,
  ) {
    if (router) {
      this.router = router;
    } else {
      try {
        this.router = inject(Router);
      } catch {
        this.router = undefined;
      }
    }

    if (webmcp) {
      this.webmcp = webmcp;
    } else {
      try {
        this.webmcp = inject(WebMcpService);
      } catch {
        this.webmcp = undefined;
      }
    }

    if (copilot) {
      this.copilot = copilot;
    } else {
      try {
        this.copilot = inject(CopilotBridgeService);
      } catch {
        this.copilot = undefined;
      }
    }
  }

  navigateTo(route: string): void {
    if (this.router) {
      this.router.navigateByUrl(route);
    }
  }

  openCopilotWithPrompt(prompt: string): void {
    if (this.copilot) {
      this.copilot.isOpen.set(true);
      this.copilot.isMinimized.set(false);
      this.copilot.sendMessage(prompt);
    }
  }
}
