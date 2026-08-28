import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ViewGuideService, ViewGuideTab } from '../../services/view-guide.service';
import { CopilotBridgeService } from '../../services/copilot-bridge.service';

@Component({
  selector: 'app-view-guide-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (guideService.isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        (click)="onBackdropClick($event)">
        
        <div
          class="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-scaleUp"
          (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-sm">
                <div class="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-lg">
                  📖
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold text-slate-900">Application Views & Tools Guide</h2>
                  <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                    W3C WebMCP
                  </span>
                </div>
                <p class="text-xs text-slate-500">Interactive architectural documentation, tool schemas, and runnable AI Copilot scenarios</p>
              </div>
            </div>

            <button
              (click)="guideService.closeGuide()"
              class="w-8 h-8 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center text-sm font-bold cursor-pointer"
              aria-label="Close modal">
              ✕
            </button>
          </div>

          <!-- Tab Bar -->
          <div class="px-6 py-2.5 border-b border-slate-200/80 bg-slate-100/50 flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button
              (click)="guideService.activeTab.set('3d-showroom')"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="guideService.activeTab() === '3d-showroom' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'">
              <span>🏎️</span>
              <span>3D Digital Twin</span>
            </button>

            <button
              (click)="guideService.activeTab.set('enterprise-bi')"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="guideService.activeTab() === 'enterprise-bi' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'">
              <span>📊</span>
              <span>Enterprise BI</span>
            </button>

            <button
              (click)="guideService.activeTab.set('inspector')"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="guideService.activeTab() === 'inspector' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'">
              <span>🔍</span>
              <span>Live Inspector</span>
            </button>

            <button
              (click)="guideService.activeTab.set('judge-guide')"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="guideService.activeTab() === 'judge-guide' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'">
              <span>📋</span>
              <span>Judge Guide</span>
            </button>

            <button
              (click)="guideService.activeTab.set('copilot')"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="guideService.activeTab() === 'copilot' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'">
              <span>🤖</span>
              <span>AI Copilot Drawer</span>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
            
            <!-- TAB 1: 3D DIGITAL TWIN -->
            @if (guideService.activeTab() === '3d-showroom') {
              <div class="space-y-5 animate-fadeIn">
                <div class="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <h3 class="text-sm font-bold text-cyan-900 flex items-center gap-2">
                      <span>🏎️ 3D Digital Twin Showroom</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-mono">/3d-showroom</span>
                    </h3>
                    <p class="text-slate-600 text-xs">
                      WebGL Three.js rendering engine bridging 3D scene graphs, CAD modeling, and spatial tools directly to WebMCP AI agents.
                    </p>
                  </div>
                  <button
                    (click)="navigateTo('/3d-showroom')"
                    class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer">
                    Go to View →
                  </button>
                </div>

                <!-- How it Works -->
                <div class="space-y-2">
                  <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">How This View Works:</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div class="font-bold text-cyan-800 flex items-center gap-1.5">
                        <span>📐</span>
                        <span>Dual Viewport Modes</span>
                      </div>
                      <p class="text-slate-600 text-[11px] leading-relaxed">
                        Switch between <strong>SketchUp Studio</strong> (maximized CAD viewport with top shelf, rubber-band drawing, and direct extrusion) and <strong>Multi-Panel</strong> (side docks with outliner tree, customizer form, and telemetry inspector).
                      </p>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div class="font-bold text-cyan-800 flex items-center gap-1.5">
                        <span>📸</span>
                        <span>Multimodal Viewport Capture</span>
                      </div>
                      <p class="text-slate-600 text-[11px] leading-relaxed">
                        Instant client-side canvas rasterization via <code>take_screenshot</code> converts the WebGL canvas into base64 PNG data URLs for visual LLM reasoning with automatic context sanitization.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- WebMCP Tools Table -->
                <div class="space-y-2">
                  <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Registered WebMCP Tools in this View:</h4>
                  <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table class="w-full text-left text-xs">
                      <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th class="p-2.5">Tool Name</th>
                          <th class="p-2.5">Parameters</th>
                          <th class="p-2.5">Action & Behavior</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200/80 bg-white">
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-cyan-700">scene_3d_action</td>
                          <td class="p-2.5 font-mono text-[11px]">action, deltaX?, hexColor?, meshName?</td>
                          <td class="p-2.5 text-slate-600">Controls camera orbit rotation, zoom, material colors, animations, and mesh highlights.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-cyan-700">take_screenshot</td>
                          <td class="p-2.5 font-mono text-[11px]">selector?, format?</td>
                          <td class="p-2.5 text-slate-600">Captures client-side WebGL canvas as base64 image data URL with token optimization.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-cyan-700">cad_draw_shape</td>
                          <td class="p-2.5 font-mono text-[11px]">shapeType, plane, width?, height?, radius?</td>
                          <td class="p-2.5 text-slate-600">Draws parametric 2D planar shapes (rectangles, circles, lines) on ground/wall planes.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-cyan-700">cad_push_pull</td>
                          <td class="p-2.5 font-mono text-[11px]">meshId, distance, direction?</td>
                          <td class="p-2.5 text-slate-600">Extrudes 2D planar faces into 3D geometric solid volumes along surface normals.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-cyan-700">form_action_runner</td>
                          <td class="p-2.5 font-mono text-[11px]">formName, action, values?</td>
                          <td class="p-2.5 text-slate-600">Autofills, validates, and submits Angular Reactive Forms (e.g. vehicle customizer).</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Sample AI Copilot Prompts -->
                <div class="space-y-2">
                  <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Try with AI Copilot:</h4>
                  <div class="space-y-2">
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <span class="text-slate-700 font-mono text-[11px]">"Orbit camera 90 degrees to the right, paint the vehicle chassis Neon Cyan (#00f0ff), and take a screenshot."</span>
                      <button
                        (click)="runPrompt('Orbit camera 90 degrees to the right, paint the vehicle chassis Neon Cyan (#00f0ff), and take a screenshot to inspect.')"
                        class="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer">
                        Run in Copilot 🤖
                      </button>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <span class="text-slate-700 font-mono text-[11px]">"Draw a 10x10 rectangle on the ground plane and push-pull it up by 4 units."</span>
                      <button
                        (click)="runPrompt('Draw a 10x10 rectangle on the ground plane and push-pull it up by 4 units to make a solid box.')"
                        class="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer">
                        Run in Copilot 🤖
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 2: ENTERPRISE BI -->
            @if (guideService.activeTab() === 'enterprise-bi') {
              <div class="space-y-5 animate-fadeIn">
                <div class="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <h3 class="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <span>📊 Enterprise BI & Data Intelligence</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">/enterprise-bi</span>
                    </h3>
                    <p class="text-slate-600 text-xs">
                      Reactive enterprise analytics powered by Angular Signals exposing high-throughput KPI metrics, transaction ledgers, and multi-domain inventory to AI agents.
                    </p>
                  </div>
                  <button
                    (click)="navigateTo('/enterprise-bi')"
                    class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer">
                    Go to View →
                  </button>
                </div>

                <!-- How it Works -->
                <div class="space-y-2">
                  <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">How This View Works:</h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div class="font-bold text-blue-800 flex items-center gap-1.5">
                        <span>📈</span>
                        <span>Analytics & Telemetry</span>
                      </div>
                      <p class="text-slate-600 text-[11px] leading-relaxed">
                        Real-time revenue, latency, CPU, and incident cards with interactive SVG trend visualizations and time-range filtering.
                      </p>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div class="font-bold text-blue-800 flex items-center gap-1.5">
                        <span>💳</span>
                        <span>Transactions Ledger</span>
                      </div>
                      <p class="text-slate-600 text-[11px] leading-relaxed">
                        Live search and filtering across completed, pending, and flagged transactions with instant anomaly rate calculation.
                      </p>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div class="font-bold text-blue-800 flex items-center gap-1.5">
                        <span>📦</span>
                        <span>Multi-Domain Inventory</span>
                      </div>
                      <p class="text-slate-600 text-[11px] leading-relaxed">
                        Stock monitoring across retail, manufacturing, logistics, and IT domains with autonomous restock reorders.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- WebMCP Tools Table -->
                <div class="space-y-2">
                  <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Active WebMCP Tools in this View (9 Tools):</h4>
                  <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table class="w-full text-left text-xs">
                      <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th class="p-2.5">Tool Name</th>
                          <th class="p-2.5">Parameters</th>
                          <th class="p-2.5">Action & Behavior</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200/80 bg-white">
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-blue-700">query_enterprise_metrics</td>
                          <td class="p-2.5 font-mono text-[11px]">category?, timeRange?</td>
                          <td class="p-2.5 text-slate-600">Queries high-level operational KPIs and historical trend series by category.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-blue-700">filter_business_data</td>
                          <td class="p-2.5 font-mono text-[11px]">status?, minAmount?, department?</td>
                          <td class="p-2.5 text-slate-600">Filters transactional records and triggers reactive re-aggregations.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-blue-700">calculate_kpi_summary</td>
                          <td class="p-2.5 font-mono text-[11px]">metrics: string[]</td>
                          <td class="p-2.5 text-slate-600">Computes real-time sums, averages, anomaly rates, and department volume distributions.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-blue-700">trigger_analytics_export</td>
                          <td class="p-2.5 font-mono text-[11px]">format, filterSummary?</td>
                          <td class="p-2.5 text-slate-600">Generates downloadable audit export (JSON/CSV/PDF) with SHA-256 integrity hash.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-blue-700">update_inventory_stock</td>
                          <td class="p-2.5 font-mono text-[11px]">itemId, quantityChange, reason</td>
                          <td class="p-2.5 text-slate-600">Adjusts warehouse stock levels and updates overall valuation automatically.</td>
                        </tr>
                        <tr>
                          <td class="p-2.5 font-mono font-bold text-blue-700">reorder_inventory_item</td>
                          <td class="p-2.5 font-mono text-[11px]">itemId, quantity, priority</td>
                          <td class="p-2.5 text-slate-600">Dispatches replenishment purchase orders with priority routing.</td>
                        </tr>
                      </tbody>
                    </table>
                      <span class="text-slate-700 font-mono text-[11px]">"Query enterprise metrics for the performance category, and filter business data for flagged transactions over $500."</span>
                      <button
                        (click)="copyPrompt('Query enterprise metrics for the performance category, and filter business data for flagged transactions over $500.')"
                        class="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600 transition-colors shrink-0 shadow-2xs cursor-pointer">
                        Copy
                      </button>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <span class="text-slate-700 font-mono text-[11px]">"Check items in manufacturing domain with low stock, and trigger an urgent reorder of 50 units."</span>
                      <button
                        (click)="copyPrompt('Check items in manufacturing domain with low stock, and trigger an urgent reorder of 50 units.')"
                        class="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600 transition-colors shrink-0 shadow-2xs cursor-pointer">
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 3: WEBMCP LIVE INSPECTOR -->
            @if (guideService.activeTab() === 'inspector') {
              <div class="space-y-5 animate-fadeIn">
                <div class="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 space-y-1">
                  <h3 class="text-sm font-bold text-cyan-900 flex items-center gap-2">
                    <span>🔍 WebMCP Live Inspector Telemetry</span>
                  </h3>
                  <p class="text-slate-600 text-xs">
                    Real-time observability and audit trail console. Logs all tool invocations with precise duration benchmarks and parameter breakdowns.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span class="font-bold text-slate-900 text-xs block">⏱️ Duration Benchmarking</span>
                    <p class="text-slate-600 text-[11px] leading-relaxed">
                      Measures tool execution latency in milliseconds to evaluate agent responsiveness and standard compliance.
                    </p>
                  </div>
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span class="font-bold text-slate-900 text-xs block">📡 Multi-Source Origin Tracking</span>
                    <p class="text-slate-600 text-[11px] leading-relaxed">
                      Distinguishes calls originating from AI Copilot, browser native context, or manual simulator buttons.
                    </p>
                  </div>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span class="font-bold text-slate-900 text-xs block">Inspect Payload Architecture:</span>
                  <pre class="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner">
&#123;
  "toolName": "calculate_kpi_summary",
  "source": "ai_copilot",
  "status": "success",
  "durationMs": 4.2,
  "args": &#123; "metrics": ["revenue_ytd", "net_margin"] &#125;
&#125;</pre>
                </div>
              </div>
            }

            <!-- TAB 4: JUDGE GUIDE & RUBRIC -->
            @if (guideService.activeTab() === 'judge') {
              <div class="space-y-5 animate-fadeIn">
                <div class="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <h3 class="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <span>📋 Devpost Judge Evaluation Matrix</span>
                  </h3>
                  <p class="text-slate-600 text-xs">
                    Comprehensive compliance rubric and interactive test suites designed for hackathon judges and evaluators.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span class="font-bold text-slate-900 text-xs block">🏆 Evaluation Areas</span>
                    <p class="text-slate-600 text-[11px] leading-relaxed">
                      Detailed scoring breakdown for Innovation, Technical Execution, Standard Compliance, and Security.
                    </p>
                  </div>
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span class="font-bold text-slate-900 text-xs block">🧪 Automated Test Harness</span>
                    <p class="text-slate-600 text-[11px] leading-relaxed">
                      Run automated health verification suites to validate all WebMCP tools in real time.
                    </p>
                  </div>
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span class="font-bold text-slate-900 text-xs block">🌐 Chrome Flag Manual</span>
                    <p class="text-slate-600 text-[11px] leading-relaxed">
                      Direct instructions for enabling genuine browser-native WebMCP support via <code class="font-mono text-[10px] bg-slate-200 px-1 py-0.5 rounded">chrome://flags</code>.
                    </p>
                  </div>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span class="font-bold text-slate-900 text-xs block">Evaluation Sequence:</span>
                  <ul class="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
                    <li>
                      <span class="font-bold text-emerald-700">1. AI Copilot Verification:</span> Test autonomous multi-turn reasoning and tool execution.
                    </li>
                    <li>
                      <span class="font-bold text-cyan-700">2. Interactive 3D & CAD Controls:</span> Verify procedural drawing, push-pull, and vision captures.
                    </li>
                    <li>
                      <span class="font-bold text-purple-700">3. Signals Reactivity:</span> Check instant business telemetry updates without change-detection penalties.
                    </li>
                  </ul>
                </div>
              </div>
            }

            <!-- TAB 5: AI COPILOT DRAWER -->
            @if (guideService.activeTab() === 'copilot') {
              <div class="space-y-5 animate-fadeIn">
                <div class="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <h3 class="text-sm font-bold text-purple-900 flex items-center gap-2">
                      <span>🤖 AI Copilot Drawer</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">Bridge Proxy</span>
                    </h3>
                    <p class="text-slate-600 text-xs">
                      Built-in multimodal conversational assistant with dynamic schema reflection and recursive autonomous tool calling loop (up to 5 turns).
                    </p>
                  </div>
                  <button
                    (click)="openCopilotChat()"
                    class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer">
                    Open Copilot Drawer 🤖
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div class="font-bold text-purple-800 flex items-center gap-1.5">
                      <span>🔄</span>
                      <span>Dynamic Schema Reflection</span>
                    </div>
                    <p class="text-slate-600 text-[11px] leading-relaxed">
                      As you navigate between routes, the Copilot automatically reflects the active tools on the current page and converts them into OpenAI function definitions.
                    </p>
                  </div>

                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div class="font-bold text-purple-800 flex items-center gap-1.5">
                      <span>📸</span>
                      <span>Multimodal Lightbox</span>
                    </div>
                    <p class="text-slate-600 text-[11px] leading-relaxed">
                      Screenshots captured by the agent appear as rich preview cards directly inside the conversation stream with click-to-expand lightbox support.
                    </p>
                  </div>
                </div>
              </div>
            }

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-3 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
            <span>Press <kbd class="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] border border-slate-300">ESC</kbd> to close</span>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% Client-Side Reactive W3C WebMCP</span>
            </div>
          </div>

        </div>
      </div>
    }
  `,
})
export class ViewGuideModalComponent {
  readonly guideService = inject(ViewGuideService);
  readonly copilot = inject(CopilotBridgeService);
  readonly router = inject(Router);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.guideService.isOpen()) {
      this.guideService.closeGuide();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    this.guideService.closeGuide();
  }

  navigateTo(route: string): void {
    this.guideService.closeGuide();
    this.router.navigate([route]);
  }

  openCopilotChat(): void {
    this.guideService.closeGuide();
    this.copilot.openDrawer();
  }

  runPrompt(promptText: string): void {
    this.guideService.closeGuide();
    this.copilot.openDrawer();
    this.copilot.sendMessage(promptText);
  }
}
