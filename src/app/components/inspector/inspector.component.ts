import { Component, inject, signal, computed, Optional, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  WebMcpService,
  WebMcpExecutionLog,
  WebMcpMemoryService,
  MemoryItem,
  MemoryCategory,
  MemorySearchResult,
  MemoryStats,
  MemoryExportBundle,
  MemoryImportOptions,
  MemoryImportResult,
} from '@webmcp/angular';
import { ViewGuideService } from '../../services/view-guide.service';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-panel rounded-2xl p-5 border border-slate-200/80 flex flex-col h-[520px]">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3 flex-wrap gap-2">
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
            <p class="text-xs text-slate-500">Real-Time Tool Invocation, Memory & Audit Stream</p>
          </div>
        </div>

        <!-- Center Tabs -->
        <div class="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            (click)="setTab('logs')"
            [ngClass]="activeTab() === 'logs' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            class="px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
            <span>⚡ Live Logs</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
              {{ webmcp.executionLogs().length }}
            </span>
          </button>
          <button
            (click)="setTab('memory')"
            [ngClass]="activeTab() === 'memory' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            class="px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
            <span>🧠 Memory Store</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-mono">
              {{ stats().totalCount }}
            </span>
          </button>
        </div>

        <!-- Right Actions -->
        <div class="flex items-center gap-2">
          <button
            (click)="openGuide()"
            class="px-2.5 py-1 text-xs rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 transition-colors shadow-2xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Open Inspector Documentation">
            <span>📖</span>
            <span>Guide</span>
          </button>

          @if (activeTab() === 'logs') {
            <button
              (click)="webmcp.clearLogs()"
              class="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs cursor-pointer">
              Clear Logs
            </button>
          } @else {
            <button
              (click)="exportKnowledgeBase()"
              class="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 transition-colors shadow-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Export memory knowledge base as JSON">
              <span>⬇ Export JSON</span>
            </button>
            <label
              class="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 transition-colors shadow-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Import memory knowledge base from JSON file">
              <span>⬆ Import JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                (change)="onFileSelected($event)"
                class="hidden" />
            </label>
            <button
              (click)="toggleAddForm()"
              class="px-2.5 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-xs font-semibold flex items-center gap-1 cursor-pointer">
              <span>{{ showAddForm() ? '✕ Close' : '+ Add Memory' }}</span>
            </button>
            <button
              (click)="clearAllMemories()"
              class="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors shadow-xs cursor-pointer"
              title="Clear all stored memories">
              Clear All
            </button>
          }
        </div>
      </div>

      <!-- Content Area -->
      @if (activeTab() === 'logs') {
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
      } @else {
        <!-- Memory Store Container -->
        <div class="flex-1 flex flex-col min-h-0 space-y-3">
          <!-- Feedback Message Banner -->
          @if (statusFeedback(); as fb) {
            <div
              class="p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border transition-all"
              [ngClass]="fb.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'">
              <div class="flex items-center gap-1.5">
                <span>{{ fb.type === 'error' ? '⚠️' : '✓' }}</span>
                <span>{{ fb.message }}</span>
              </div>
              <button
                (click)="clearFeedback()"
                class="text-xs hover:opacity-75 cursor-pointer font-bold px-1">
                ✕
              </button>
            </div>
          }

          <!-- Telemetry Stats Ribbon -->
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px] font-medium text-slate-700">
            <div class="p-2 rounded-xl bg-purple-50/80 border border-purple-200/70 flex flex-col">
              <span class="text-[10px] text-purple-600 font-semibold uppercase">Total</span>
              <span class="text-base font-bold text-purple-900">{{ stats().totalCount }}</span>
            </div>
            <div class="p-2 rounded-xl bg-amber-50/80 border border-amber-200/70 flex flex-col">
              <span class="text-[10px] text-amber-600 font-semibold uppercase">Pinned</span>
              <span class="text-base font-bold text-amber-900">{{ stats().pinnedCount }}</span>
            </div>
            <div class="p-2 rounded-xl bg-blue-50/80 border border-blue-200/70 flex flex-col">
              <span class="text-[10px] text-blue-600 font-semibold uppercase">Facts</span>
              <span class="text-base font-bold text-blue-900">{{ stats().categoryCounts.fact }}</span>
            </div>
            <div class="p-2 rounded-xl bg-indigo-50/80 border border-indigo-200/70 flex flex-col">
              <span class="text-[10px] text-indigo-600 font-semibold uppercase">Rules</span>
              <span class="text-base font-bold text-indigo-900">{{ stats().categoryCounts.rule }}</span>
            </div>
            <div class="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex flex-col">
              <span class="text-[10px] text-emerald-600 font-semibold uppercase">Observations</span>
              <span class="text-base font-bold text-emerald-900">{{ stats().categoryCounts.observation }}</span>
            </div>
            <div class="p-2 rounded-xl bg-yellow-50/80 border border-yellow-200/70 flex flex-col">
              <span class="text-[10px] text-yellow-700 font-semibold uppercase">Context</span>
              <span class="text-base font-bold text-yellow-950">{{ stats().categoryCounts.context }}</span>
            </div>
            <div class="p-2 rounded-xl bg-pink-50/80 border border-pink-200/70 flex flex-col">
              <span class="text-[10px] text-pink-600 font-semibold uppercase">Preferences</span>
              <span class="text-base font-bold text-pink-900">{{ stats().categoryCounts.preference }}</span>
            </div>
          </div>

          <!-- Search & Category Filters Bar -->
          <div class="flex items-center gap-2 flex-wrap text-xs">
            <div class="relative flex-1 min-w-[200px]">
              <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                🔍
              </span>
              <input
                type="text"
                [value]="searchQuery()"
                (input)="onSearchQueryChange($any($event.target).value)"
                placeholder="Search memories with BM25 (e.g., query, tags, topics)..."
                class="w-full pl-8 pr-7 py-1.5 bg-white/90 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-xs transition-all" />
              @if (searchQuery()) {
                <button
                  (click)="onSearchQueryChange('')"
                  class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                  ✕
                </button>
              }
            </div>

            <!-- Category Pills -->
            <div class="flex items-center gap-1 overflow-x-auto text-[11px]">
              <button
                (click)="setCategoryFilter('all')"
                [ngClass]="selectedCategory() === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer">
                All
              </button>
              <button
                (click)="setCategoryFilter('rule')"
                [ngClass]="selectedCategory() === 'rule' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'"
                class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer">
                Rules
              </button>
              <button
                (click)="setCategoryFilter('fact')"
                [ngClass]="selectedCategory() === 'fact' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'"
                class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer">
                Facts
              </button>
              <button
                (click)="setCategoryFilter('observation')"
                [ngClass]="selectedCategory() === 'observation' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
                class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer">
                Observations
              </button>
              <button
                (click)="setCategoryFilter('context')"
                [ngClass]="selectedCategory() === 'context' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'"
                class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer">
                Context
              </button>
              <button
                (click)="setCategoryFilter('preference')"
                [ngClass]="selectedCategory() === 'preference' ? 'bg-pink-700 text-white' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'"
                class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer">
                Preferences
              </button>
            </div>
          </div>

          <!-- Expandable Add Memory Form -->
          @if (showAddForm()) {
            <div class="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2.5 text-xs text-slate-800 shadow-xs animate-fadeIn">
              <div class="flex items-center justify-between font-bold text-purple-900">
                <span class="flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Inject Working Memory Record</span>
                </span>
                <span class="text-[10px] font-normal text-purple-600">Manual Episodic/Semantic Entry</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  [value]="newTopic()"
                  (input)="newTopic.set($any($event.target).value)"
                  placeholder="Topic (e.g., auth_protocol, user_theme)"
                  class="px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
                
                <select
                  [value]="newCategory()"
                  (change)="newCategory.set($any($event.target).value)"
                  class="px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400">
                  <option value="observation">Observation</option>
                  <option value="fact">Fact</option>
                  <option value="rule">Rule (Invariant)</option>
                  <option value="context">Context</option>
                  <option value="preference">Preference</option>
                </select>

                <input
                  type="text"
                  [value]="newTags()"
                  (input)="newTags.set($any($event.target).value)"
                  placeholder="Tags (comma-separated, e.g. ui, security)"
                  class="px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
              </div>

              <textarea
                [value]="newContent()"
                (input)="newContent.set($any($event.target).value)"
                rows="2"
                placeholder="Memory content, rule specification, or context payload..."
                class="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"></textarea>

              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="newPinned()"
                    (change)="newPinned.set($any($event.target).checked)"
                    class="rounded text-purple-600 focus:ring-purple-400" />
                  <span class="font-medium">Pin this memory (high-priority context inclusion)</span>
                </label>

                <div class="flex items-center gap-2">
                  <button
                    (click)="toggleAddForm()"
                    class="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer">
                    Cancel
                  </button>
                  <button
                    (click)="saveNewMemory()"
                    [disabled]="!newTopic().trim() || !newContent().trim()"
                    class="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer">
                    Save Memory
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Memory Items Container -->
          <div class="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs">
            @if (isSearching()) {
              <div class="text-[11px] font-semibold text-purple-700 flex items-center justify-between pb-1">
                <span>BM25 Search Matches ({{ searchResults().length }} results for "{{ searchQuery() }}")</span>
              </div>

              @if (searchResults().length === 0) {
                <div class="h-36 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                  <span class="text-2xl">🔍</span>
                  <p class="text-xs font-semibold">No memories matched search query</p>
                  <p class="text-[11px] text-slate-400">Try broad keywords, topic names, or tag labels.</p>
                </div>
              }

              @for (result of searchResults(); track result.item.id) {
                <div class="p-3 rounded-xl bg-white/90 border border-slate-200 hover:border-purple-300 transition-all text-slate-800 shadow-xs space-y-2">
                  <!-- Header row -->
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                      <span [ngClass]="getCategoryBadgeClass(result.item.category)" class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">
                        {{ result.item.category }}
                      </span>
                      <span class="font-bold text-slate-900 text-xs font-mono">{{ result.item.topic }}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold">
                        ⚡ BM25: {{ result.score.toFixed(3) }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        (click)="togglePin(result.item)"
                        [title]="result.item.pinned ? 'Unpin Memory' : 'Pin Memory'"
                        class="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer">
                        <span [ngClass]="result.item.pinned ? 'text-amber-500 text-base font-bold' : 'text-slate-300 text-base'">
                          ★
                        </span>
                      </button>
                      <button
                        (click)="deleteMemory(result.item.id)"
                        title="Delete Memory"
                        class="px-1.5 py-0.5 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 text-xs transition-colors cursor-pointer">
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- Content snippet -->
                  <p class="text-slate-700 whitespace-pre-wrap font-sans text-xs bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                    {{ result.item.content }}
                  </p>

                  <!-- Tags and Metadata -->
                  <div class="flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2 pt-1 border-t border-slate-100">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @for (tag of result.item.tags; track tag) {
                        <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200/60">
                          #{{ tag }}
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-2">
                      <span>👁 {{ result.item.accessCount }} reads</span>
                      <span>•</span>
                      <span>🕒 {{ formatTime(result.item.updatedAt || result.item.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              }
            } @else {
              @if (displayedMemories().length === 0) {
                <div class="h-36 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                  <span class="text-2xl">🧠</span>
                  <p class="text-xs font-semibold">No memory records in browser store</p>
                  <p class="text-[11px] text-slate-400">Add memories using the button above or invoke WebMCP tools.</p>
                </div>
              }

              @for (item of displayedMemories(); track item.id) {
                <div class="p-3 rounded-xl bg-white/90 border border-slate-200/90 hover:border-slate-300 transition-all text-slate-800 shadow-xs space-y-2">
                  <!-- Header row -->
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                      <span [ngClass]="getCategoryBadgeClass(item.category)" class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">
                        {{ item.category }}
                      </span>
                      <span class="font-bold text-slate-900 text-xs font-mono">{{ item.topic }}</span>
                      @if (item.pinned) {
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-0.5">
                          <span>★</span>
                          <span>Pinned</span>
                        </span>
                      }
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        (click)="togglePin(item)"
                        [title]="item.pinned ? 'Unpin Memory' : 'Pin Memory'"
                        class="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer">
                        <span [ngClass]="item.pinned ? 'text-amber-500 text-base font-bold' : 'text-slate-300 text-base'">
                          ★
                        </span>
                      </button>
                      <button
                        (click)="deleteMemory(item.id)"
                        title="Delete Memory"
                        class="px-1.5 py-0.5 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 text-xs transition-colors cursor-pointer">
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- Content snippet -->
                  <p class="text-slate-700 whitespace-pre-wrap font-sans text-xs bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                    {{ item.content }}
                  </p>

                  <!-- Tags and Metadata -->
                  <div class="flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2 pt-1 border-t border-slate-100">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @for (tag of item.tags; track tag) {
                        <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200/60">
                          #{{ tag }}
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-2">
                      <span>👁 {{ item.accessCount }} reads</span>
                      <span>•</span>
                      <span>🕒 {{ formatTime(item.updatedAt || item.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

    </div>
  `,
})
export class InspectorComponent {
  readonly webmcp: WebMcpService;
  readonly guideService: ViewGuideService;
  readonly memoryService: WebMcpMemoryService;

  // Active Tab
  readonly activeTab = signal<'logs' | 'memory'>('logs');

  // Memory UI State Signals
  readonly selectedCategory = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly searchResults = signal<MemorySearchResult[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly showAddForm = signal<boolean>(false);

  // Add Form Signals
  readonly newTopic = signal<string>('');
  readonly newCategory = signal<MemoryCategory>('observation');
  readonly newContent = signal<string>('');
  readonly newTags = signal<string>('');
  readonly newPinned = signal<boolean>(false);

  // Derived Signals
  readonly stats: Signal<MemoryStats>;
  readonly memories: Signal<MemoryItem[]>;
  readonly displayedMemories: Signal<MemoryItem[]>;

  constructor(
    @Optional() webmcp?: WebMcpService,
    @Optional() guideService?: ViewGuideService,
    @Optional() memoryService?: WebMcpMemoryService
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

    if (memoryService) {
      this.memoryService = memoryService;
    } else {
      try {
        this.memoryService = inject(WebMcpMemoryService, { optional: true }) || new WebMcpMemoryService();
      } catch {
        this.memoryService = new WebMcpMemoryService();
      }
    }

    this.stats = this.memoryService.stats;
    this.memories = this.memoryService.memories;

    this.displayedMemories = computed(() => {
      const all = this.memories();
      const cat = this.selectedCategory();
      if (cat === 'all') {
        return all;
      }
      return all.filter((item) => item.category === cat);
    });
  }

  setTab(tab: 'logs' | 'memory'): void {
    this.activeTab.set(tab);
  }

  setCategoryFilter(category: string): void {
    this.selectedCategory.set(category);
  }

  async onSearchQueryChange(query: string): Promise<void> {
    const trimmed = (query || '').trim();
    this.searchQuery.set(query);

    if (!trimmed) {
      this.isSearching.set(false);
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    const results = await this.memoryService.search(trimmed);
    this.searchResults.set(results);
  }

  toggleAddForm(): void {
    this.showAddForm.update((prev) => !prev);
  }

  async saveNewMemory(): Promise<MemoryItem | null> {
    const topic = this.newTopic().trim();
    const content = this.newContent().trim();

    if (!topic || !content) {
      return null;
    }

    const tags = this.newTags()
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const saved = await this.memoryService.save({
      topic,
      category: this.newCategory(),
      content,
      tags,
      pinned: this.newPinned(),
    });

    // Reset form
    this.newTopic.set('');
    this.newCategory.set('observation');
    this.newContent.set('');
    this.newTags.set('');
    this.newPinned.set(false);
    this.showAddForm.set(false);

    if (this.isSearching()) {
      await this.onSearchQueryChange(this.searchQuery());
    }

    return saved;
  }

  async togglePin(item: MemoryItem): Promise<MemoryItem | null> {
    const updated = await this.memoryService.pin(item.id, !item.pinned);
    if (this.isSearching()) {
      await this.onSearchQueryChange(this.searchQuery());
    }
    return updated;
  }

  async deleteMemory(id: string): Promise<boolean> {
    const deleted = await this.memoryService.delete(id);
    if (this.isSearching()) {
      await this.onSearchQueryChange(this.searchQuery());
    }
    return deleted;
  }

  async clearAllMemories(): Promise<void> {
    await this.memoryService.clear();
    this.searchResults.set([]);
    this.isSearching.set(false);
    this.searchQuery.set('');
  }

  getCategoryBadgeClass(category: MemoryCategory | string): string {
    switch (category) {
      case 'rule':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'fact':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'observation':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'context':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'preference':
        return 'bg-pink-100 text-pink-700 border border-pink-200';
      case 'session':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  openGuide(): void {
    this.guideService.openGuide('inspector');
  }

  readonly statusFeedback = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  clearFeedback(): void {
    this.statusFeedback.set(null);
  }

  async exportKnowledgeBase(filename?: string): Promise<void> {
    try {
      await this.memoryService.downloadKnowledgeBaseJson(filename);
      this.statusFeedback.set({
        message: 'Knowledge base exported successfully.',
        type: 'success',
      });
      setTimeout(() => {
        if (this.statusFeedback()?.type === 'success') {
          this.statusFeedback.set(null);
        }
      }, 4000);
    } catch (err: any) {
      this.statusFeedback.set({
        message: `Export failed: ${err?.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      await this.importKnowledgeBaseFromJson(text, { mode: 'merge' });
    } catch (err: any) {
      this.statusFeedback.set({
        message: `Failed to read import file: ${err?.message || 'Invalid file'}`,
        type: 'error',
      });
    } finally {
      if (input) {
        input.value = '';
      }
    }
  }

  async importKnowledgeBaseFromJson(
    jsonString: string,
    options?: MemoryImportOptions
  ): Promise<MemoryImportResult> {
    try {
      const result = await this.memoryService.importKnowledgeBaseFromJson(jsonString, options);
      if (result.success) {
        this.statusFeedback.set({
          message: `Imported ${result.importedCount} memories successfully (${result.skippedCount} skipped).`,
          type: 'success',
        });
        setTimeout(() => {
          if (this.statusFeedback()?.type === 'success') {
            this.statusFeedback.set(null);
          }
        }, 5000);
      } else {
        this.statusFeedback.set({
          message: `Import failed: ${result.errors.join(', ')}`,
          type: 'error',
        });
      }
      return result;
    } catch (err: any) {
      this.statusFeedback.set({
        message: `Import error: ${err?.message || 'Unknown error'}`,
        type: 'error',
      });
      throw err;
    }
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

