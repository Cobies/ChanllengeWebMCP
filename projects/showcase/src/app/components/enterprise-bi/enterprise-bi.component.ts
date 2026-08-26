import { Component, OnInit, OnDestroy, inject, signal, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebMcpService } from '@webmcp/angular';
import { EnterpriseDataService } from '../../services/enterprise-data.service';
import {
  EnterpriseMetric,
  TransactionRecord,
  TransactionStatus,
  ExportFormat,
  MetricCategory,
  BiTimeRange,
} from '../../models/enterprise-bi.types';

@Component({
  selector: 'app-enterprise-bi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Enterprise BI Hero Header -->
      <div class="glass-panel rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1.5 max-w-3xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Enterprise BI & Autonomous Analytics Runtime
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Data Intelligence & AI Agent Operations
            </h2>
            <p class="text-sm text-slate-400 leading-relaxed">
              Expose live enterprise metrics, transactional datasets, and cryptographic audit export pipelines directly to WebMCP AI agents via Angular Signals.
            </p>
          </div>

          <!-- Quick Stat Summaries -->
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
              <div class="text-[11px] text-slate-400">Total Volume</div>
              <div class="text-base font-mono font-bold text-emerald-400">
                {{ formatCurrency(dataService.aggregation().totalVolume) }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
              <div class="text-[11px] text-slate-400">Filtered Records</div>
              <div class="text-base font-mono font-bold text-cyan-400">
                {{ dataService.filteredTransactions().length }} / {{ dataService.transactions().length }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action / Notification Toast Feedback -->
      @if (lastActionResult()) {
        <div class="p-3 rounded-xl bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-slate-950 border border-blue-500/40 text-xs flex items-center justify-between shadow-lg shadow-blue-500/10 animate-fadeIn">
          <div class="flex items-center gap-2.5">
            <span class="text-base">⚡</span>
            <div>
              <span class="font-bold text-cyan-300">WebMCP Tool Execution: </span>
              <span class="text-slate-200">{{ lastActionResult() }}</span>
            </div>
          </div>
          <button (click)="lastActionResult.set(null)" class="text-slate-400 hover:text-white text-xs px-2 py-0.5">✕</button>
        </div>
      }

      <!-- 4 KPI Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (metric of dataService.metrics(); track metric.id) {
          <div class="glass-panel p-4 rounded-xl border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-3 relative overflow-hidden group">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium uppercase tracking-wider text-[10px]">{{ metric.category }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                [ngClass]="metric.deltaPercent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'">
                {{ metric.deltaPercent >= 0 ? '+' : '' }}{{ metric.deltaPercent }}%
              </span>
            </div>

            <div>
              <div class="text-xs text-slate-400 font-medium truncate">{{ metric.name }}</div>
              <div class="text-2xl font-bold font-mono text-white tracking-tight mt-0.5">
                @if (metric.unit === 'USD') {
                  {{ formatCurrency(metric.value, true) }}
                } @else {
                  {{ metric.value }} <span class="text-xs font-normal text-slate-400">{{ metric.unit }}</span>
                }
              </div>
            </div>

            <!-- Mini Sparkline SVG -->
            <div class="h-8 w-full pt-1">
              <svg class="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                <defs>
                  <linearGradient [id]="'grad-' + metric.id" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <path
                  [attr.d]="generateSparklineArea(metric.history)"
                  [attr.fill]="'url(#grad-' + metric.id + ')'"/>
                <path
                  [attr.d]="generateSparklinePath(metric.history)"
                  fill="none"
                  stroke="#00f0ff"
                  stroke-width="2"
                  stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        }
      </div>

      <!-- Charts & Visual Analytics Section -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left SVG Chart: Global Latency & Throughput Curves (7 cols) -->
        <div class="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>📉</span> Real-Time Latency & Throughput Timeline
              </h3>
              <p class="text-xs text-slate-400">24-hour edge node latency curve with automated anomaly threshold</p>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400">
              Avg: {{ dataService.aggregation().averageLatencyMs }}ms
            </span>
          </div>

          <!-- Main SVG Interactive Trend Chart -->
          <div class="h-56 w-full bg-slate-950/60 rounded-xl border border-slate-900 p-3 relative flex flex-col justify-end">
            <svg class="w-full h-44 overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
              <!-- Grid Lines -->
              <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" stroke-dasharray="4" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" stroke-dasharray="4" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" stroke-dasharray="4" />

              <!-- Threshold Line (50ms) -->
              <line x1="0" y1="45" x2="500" y2="45" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="6" opacity="0.6" />
              <text x="440" y="40" fill="#f43f5e" font-size="9" font-family="monospace">SLA Limit (50ms)</text>

              <!-- Chart Gradient Fill -->
              <defs>
                <linearGradient id="mainChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <polygon points="0,150 0,60 100,80 200,95 300,105 400,110 500,115 500,150" fill="url(#mainChartGrad)" />

              <!-- Primary Trend Line -->
              <polyline
                points="0,60 100,80 200,95 300,105 400,110 500,115"
                fill="none"
                stroke="#38bdf8"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data Points -->
              <circle cx="0" cy="60" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2" />
              <circle cx="100" cy="80" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2" />
              <circle cx="200" cy="95" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2" />
              <circle cx="300" cy="105" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2" />
              <circle cx="400" cy="110" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2" />
              <circle cx="500" cy="115" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2" />
            </svg>

            <!-- X-Axis Timestamps -->
            <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-900">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00 (Current)</span>
            </div>
          </div>
        </div>

        <!-- Right Breakdown: Department Volume & Anomaly Metrics (5 cols) -->
        <div class="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>🏢</span> Department Transaction Allocation
            </h3>
            <p class="text-xs text-slate-400">Current volume distribution and threat breakdown</p>
          </div>

          <div class="space-y-3 py-1">
            @for (dept of getDepartmentBreakdownList(); track dept.name) {
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-300 font-medium">{{ dept.name }}</span>
                  <span class="font-mono text-slate-400">{{ formatCurrency(dept.volume) }} ({{ dept.count }} tx)</span>
                </div>
                <div class="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    class="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                    [style.width.%]="getDeptPercentage(dept.volume)">
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div class="text-slate-400 text-[11px]">Anomaly Flag Rate</div>
              <div class="font-bold text-rose-400 font-mono text-sm">
                {{ dataService.aggregation().anomalyRatePercent }}%
              </div>
            </div>
            <button
              (click)="triggerExport('json')"
              class="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all flex items-center gap-1.5">
              <span>📥 Export JSON</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Filter Controls & Transaction Intelligence Table -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        
        <!-- Filter Toolbar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          
          <!-- Status Selector Pills -->
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-slate-400 font-medium mr-1">Status:</span>
            <button
              (click)="setStatusFilter('all')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              [ngClass]="dataService.filterState().status === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 hover:text-white'">
              All ({{ dataService.transactions().length }})
            </button>
            <button
              (click)="setStatusFilter('completed')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              [ngClass]="dataService.filterState().status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 hover:text-white'">
              Completed ({{ dataService.aggregation().statusCounts.completed }})
            </button>
            <button
              (click)="setStatusFilter('pending')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              [ngClass]="dataService.filterState().status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:text-white'">
              Pending ({{ dataService.aggregation().statusCounts.pending }})
            </button>
            <button
              (click)="setStatusFilter('flagged')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              [ngClass]="dataService.filterState().status === 'flagged' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-900 text-slate-400 hover:text-white'">
              🚨 Flagged ({{ dataService.aggregation().statusCounts.flagged }})
            </button>
          </div>

          <!-- Department Selector & Search -->
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Department Dropdown -->
            <select
              [ngModel]="dataService.filterState().department"
              (ngModelChange)="setDepartmentFilter($event)"
              class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
              <option value="all">All Departments</option>
              @for (dept of dataService.departments(); track dept) {
                <option [value]="dept">{{ dept }}</option>
              }
            </select>

            <!-- Search Input -->
            <div class="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                [ngModel]="dataService.filterState().searchTerm"
                (ngModelChange)="setSearchTerm($event)"
                class="px-3 py-1.5 pl-8 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"/>
              <span class="absolute left-2.5 top-1.5 text-slate-500 text-xs">🔍</span>
            </div>

            <!-- Reset Button -->
            <button
              (click)="resetFilters()"
              class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition-all">
              Reset
            </button>
          </div>

        </div>

        <!-- Transactions Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-800/80">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Transaction ID</th>
                <th class="py-3 px-4">Timestamp</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4">Service</th>
                <th class="py-3 px-4 text-right">Amount</th>
                <th class="py-3 px-4 text-right">Latency</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Anomaly Index</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900 bg-slate-950/40">
              @for (tx of dataService.filteredTransactions(); track tx.id) {
                <tr
                  class="hover:bg-slate-900/60 transition-colors"
                  [ngClass]="tx.status === 'flagged' ? 'bg-rose-950/10' : ''">
                  <td class="py-2.5 px-4 font-mono font-bold text-cyan-300">{{ tx.id }}</td>
                  <td class="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{{ formatTime(tx.timestamp) }}</td>
                  <td class="py-2.5 px-4 text-slate-300">{{ tx.department }}</td>
                  <td class="py-2.5 px-4 text-slate-400">{{ tx.service }}</td>
                  <td class="py-2.5 px-4 text-right font-mono font-semibold text-white">{{ formatCurrency(tx.amount) }}</td>
                  <td class="py-2.5 px-4 text-right font-mono text-slate-400">{{ tx.latencyMs }} ms</td>
                  <td class="py-2.5 px-4 text-center">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      [ngClass]="getStatusBadgeClass(tx.status)">
                      {{ tx.status }}
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-right font-mono"
                    [ngClass]="tx.anomalyScore > 0.5 ? 'text-rose-400 font-bold' : 'text-slate-500'">
                    {{ tx.anomalyScore }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-8 text-slate-500">
                    No transactions match current filters.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      </div>

      <!-- Export Audit Log Section -->
      @if (dataService.exportAuditLog().length > 0) {
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>📜</span> Cryptographic Export Audit Log
            </h3>
            <span class="text-xs text-slate-400 font-mono">{{ dataService.exportAuditLog().length }} Reports Generated</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (log of dataService.exportAuditLog(); track log.exportId) {
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-cyan-400">{{ log.exportId }}</span>
                  <span class="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {{ log.format }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 truncate">{{ log.filterSummary }}</div>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                  <span>{{ log.recordCount }} records</span>
                  <span>{{ log.checksum }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `],
})
export class EnterpriseBiComponent implements OnInit, OnDestroy {
  readonly webmcp: WebMcpService;
  readonly dataService: EnterpriseDataService;

  readonly lastActionResult = signal<string | null>(null);

  constructor(
    @Optional() webmcp?: WebMcpService,
    @Optional() dataService?: EnterpriseDataService
  ) {
    this.webmcp = webmcp ?? inject(WebMcpService);
    this.dataService = dataService ?? inject(EnterpriseDataService);
  }

  ngOnInit(): void {
    this.registerEnterpriseWebMcpTools();
  }

  ngOnDestroy(): void {
    this.unregisterEnterpriseWebMcpTools();
  }

  private registerEnterpriseWebMcpTools(): void {
    // 1. query_enterprise_metrics
    this.webmcp.registerTool({
      name: 'query_enterprise_metrics',
      description: 'Query enterprise high-level KPIs and operational metrics filtered by category or time range.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['performance', 'financial', 'infrastructure', 'security'],
            description: 'Metric category filter',
          },
          timeRange: {
            type: 'string',
            enum: ['1h', '24h', '7d', '30d'],
            description: 'Time window for historical metrics',
          },
        },
      },
      handler: async (args: { category?: MetricCategory; timeRange?: BiTimeRange }) => {
        const metrics = this.dataService.queryMetrics(args);
        const feedback = `Queried ${metrics.length} enterprise metrics (Category: ${args.category || 'all'})`;
        this.lastActionResult.set(feedback);
        return {
          success: true,
          count: metrics.length,
          metrics,
        };
      },
    });

    // 2. filter_business_data
    this.webmcp.registerTool({
      name: 'filter_business_data',
      description: 'Filter the enterprise transaction dataset by status, minimum transaction amount, or department.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['completed', 'pending', 'flagged', 'all'],
            description: 'Transaction processing status filter',
          },
          minAmount: {
            type: 'number',
            description: 'Minimum transaction USD amount threshold',
          },
          department: {
            type: 'string',
            description: "Department name or 'all'",
          },
          searchTerm: {
            type: 'string',
            description: 'Search keyword for service name or transaction ID',
          },
        },
      },
      handler: async (args: {
        status?: TransactionStatus | 'all';
        minAmount?: number;
        department?: string;
        searchTerm?: string;
      }) => {
        const results = this.dataService.filterTransactions(args);
        const feedback = `Filtered dataset: ${results.length} transactions matched filter criteria`;
        this.lastActionResult.set(feedback);
        return {
          success: true,
          matchedCount: results.length,
          filterApplied: this.dataService.filterState(),
        };
      },
    });

    // 3. calculate_kpi_summary
    this.webmcp.registerTool({
      name: 'calculate_kpi_summary',
      description: 'Compute real-time aggregation analytics and summaries across selected enterprise metrics and current filtered dataset.',
      parameters: {
        type: 'object',
        properties: {
          metrics: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of metric IDs to include in the KPI calculation',
          },
        },
      },
      handler: async (args: { metrics?: string[] }) => {
        const summary = this.dataService.calculateKpiSummary(args.metrics);
        const aggregation = this.dataService.aggregation();
        const feedback = `Calculated KPI summary: ${summary.length} metrics evaluated across ${aggregation.totalTransactions} transactions`;
        this.lastActionResult.set(feedback);
        return {
          success: true,
          summary,
          aggregation,
        };
      },
    });

    // 4. trigger_analytics_export
    this.webmcp.registerTool({
      name: 'trigger_analytics_export',
      description: 'Generate and record an enterprise audit export report in JSON, CSV, or PDF format with cryptographic integrity checksum.',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['json', 'csv', 'pdf'],
            description: 'Export document format',
          },
          filterSummary: {
            type: 'string',
            description: 'Optional notes or audit context description',
          },
        },
        required: ['format'],
      },
      handler: async (args: { format: ExportFormat; filterSummary?: string }) => {
        const report = this.dataService.triggerExport(args.format, args.filterSummary);
        const feedback = `Generated export ${report.exportId} (${report.format.toUpperCase()}) with ${report.recordCount} records`;
        this.lastActionResult.set(feedback);
        return {
          success: true,
          export: report,
        };
      },
    });
  }

  private unregisterEnterpriseWebMcpTools(): void {
    this.webmcp.unregisterTool('query_enterprise_metrics');
    this.webmcp.unregisterTool('filter_business_data');
    this.webmcp.unregisterTool('calculate_kpi_summary');
    this.webmcp.unregisterTool('trigger_analytics_export');
  }

  // --- UI Helpers ---
  setStatusFilter(status: TransactionStatus | 'all'): void {
    this.dataService.updateFilter({ status });
  }

  setDepartmentFilter(department: string): void {
    this.dataService.updateFilter({ department });
  }

  setSearchTerm(searchTerm: string): void {
    this.dataService.updateFilter({ searchTerm });
  }

  resetFilters(): void {
    this.dataService.resetFilter();
  }

  triggerExport(format: ExportFormat): void {
    this.dataService.triggerExport(format);
  }

  formatCurrency(value: number, compact: boolean = false): string {
    if (compact && value >= 1000000) {
      const millions = value / 1000000;
      return `$${millions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
  }

  formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  }

  getStatusBadgeClass(status: TransactionStatus): string {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'flagged':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
  }

  getDepartmentBreakdownList(): { name: string; count: number; volume: number }[] {
    const breakdown = this.dataService.aggregation().departmentBreakdown;
    return Object.keys(breakdown).map((name) => ({
      name,
      count: breakdown[name].count,
      volume: breakdown[name].volume,
    }));
  }

  getDeptPercentage(volume: number): number {
    const total = this.dataService.aggregation().totalVolume;
    if (total === 0) return 0;
    return Math.round((volume / total) * 100);
  }

  generateSparklinePath(history: { timestamp: string; value: number }[]): string {
    if (!history || history.length === 0) return '';
    const min = Math.min(...history.map((h) => h.value));
    const max = Math.max(...history.map((h) => h.value));
    const range = max - min || 1;

    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 20 - ((h.value - min) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  }

  generateSparklineArea(history: { timestamp: string; value: number }[]): string {
    const linePath = this.generateSparklinePath(history);
    if (!linePath) return '';
    return `${linePath} L 100,24 L 0,24 Z`;
  }
}
