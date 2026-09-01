import {
  Component,
  inject,
  signal,
  computed,
  type ElementRef,
  ViewChild,
  type AfterViewChecked,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CopilotBridgeService } from '../../services/copilot-bridge.service';
import { SidebarModuleRegistryService } from '../../services/sidebar-module-registry.service';
import type { PromptChip } from '../../services/copilot-bridge.types';

export const DEFAULT_CHAT_WIDTH = 500;
export const DEFAULT_CHAT_HEIGHT = 640;
export const MIN_CHAT_WIDTH = 360;
export const MIN_CHAT_HEIGHT = 400;
export const PRESET_COMPACT_WIDTH = 380;
export const PRESET_COMPACT_HEIGHT = 480;
export const PRESET_WIDE_WIDTH = 750;
export const PRESET_WIDE_HEIGHT = 780;
export const STORAGE_KEY_WIDTH = 'copilot_chat_width';
export const STORAGE_KEY_HEIGHT = 'copilot_chat_height';

export const SHOWROOM_3D_PROMPT_CHIPS: PromptChip[] = [
  {
    label: '🏛️ Modern Pavilion',
    icon: '🏛️',
    prompt: 'Draw an 8m x 6m floor slab, push-pull 3.2m glass walls, and add 4 marble columns.',
  },
  {
    label: '🏎️ Orbit 90° & Cyan',
    icon: '🏎️',
    prompt: 'Orbit camera 90 degrees and set vehicle paint to Neon Cyan (#00f0ff).',
  },
  {
    label: '📸 Take 3D Snapshot',
    icon: '📸',
    prompt: 'Take a high-resolution screenshot of the 3D car viewport and describe it.',
  },
  {
    label: '📐 Measure Clearances',
    icon: '📐',
    prompt: 'Measure the total floor area and bounding box of all objects in the scene.',
  },
  {
    label: '🛋️ Furnish Office',
    icon: '🛋️',
    prompt: 'Place a modern executive desk, ergonomic chair, and ambient lamp at the center.',
  },
  {
    label: '🧱 Apply Materials',
    icon: '🧱',
    prompt: 'Apply red brick to the walls, oak wood to the floor, and frosted glass to windows.',
  },
  {
    label: '🏎️ Cyber Showroom',
    icon: '🏎️',
    prompt:
      'Create a 12m circular showroom platform with brushed metal material and place a cyber car.',
  },
];

export const ENTERPRISE_BI_PROMPT_CHIPS: PromptChip[] = [
  {
    label: '📊 Q3 Telemetry',
    icon: '📊',
    prompt: 'Query enterprise metrics for Finance and Operations over the last 24 hours.',
  },
  {
    label: '🚩 Flagged Audit',
    icon: '🚩',
    prompt: 'Filter business data for flagged transactions with amount > 500.',
  },
  {
    label: '📝 Purchase Modal: RET-102',
    icon: '📝',
    prompt:
      'Open the inventory purchase order modal for SKU RET-102 with 45 units and expedited priority.',
  },
  {
    label: '🤖 Autofill Restock Order',
    icon: '🤖',
    prompt:
      'Autofill the inventory purchase order form for SKU RET-103 with quantity 100, critical priority, and justification notes.',
  },
  {
    label: '📈 Executive KPI',
    icon: '📈',
    prompt: 'Calculate executive KPI summary across revenue, latency, and anomaly index.',
  },
  {
    label: '📦 Reorder Stock: HDW-201',
    icon: '📦',
    prompt:
      'Reorder inventory item HDW-201 with 35 units, expedited priority, and note "Critical warehouse buffer".',
  },
];

export const JUDGE_GUIDE_PROMPT_CHIPS: PromptChip[] = [
  {
    label: '🏆 Devpost Audit',
    icon: '🏆',
    prompt: 'Evaluate WebMCP architectural compliance and run all autonomous verification tests.',
  },
  {
    label: '📋 View Rubric Scorecard',
    icon: '📋',
    prompt: 'Show the complete evaluation rubric breakdown for the WebMCP Challenge.',
  },
];

export const INSPECTOR_PROMPT_CHIPS: PromptChip[] = [
  {
    label: '🔍 Tool Telemetry',
    icon: '🔍',
    prompt: 'Inspect live WebMCP tool invocation logs and analyze round-trip latencies.',
  },
  {
    label: '⚡ Protocol History',
    icon: '⚡',
    prompt: 'Review the latest execution payload logs and JSON RPC arguments.',
  },
];

@Component({
  selector: 'app-copilot-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Trigger Launcher (when drawer is closed) -->
    @if (!bridge.isOpen()) {
      <div class="fixed bottom-6 right-6 z-50 flex items-center gap-2 animate-bounce-subtle">
        <button
          (click)="openDrawer()"
          class="group relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-500 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-1"
        >
          <span class="relative flex h-3.5 w-3.5">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
          </span>
          <div class="text-left">
            <div
              class="text-xs font-black uppercase tracking-wider text-cyan-700 flex items-center gap-1.5"
            >
              <span>🤖 AI Copilot</span>
              <span
                class="px-1.5 py-0.2 text-[9px] rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                >AI Loop</span
              >
            </div>
            <div class="text-[11px] text-slate-600 font-mono">Autonomous WebMCP Agent</div>
          </div>
          <svg
            class="w-5 h-5 text-cyan-600 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      </div>
    }

    <!-- Minimized Floating Bar (when minimized) -->
    @if (bridge.isOpen() && bridge.isMinimized()) {
      <div class="fixed bottom-6 right-6 z-50 animate-fade-in">
        <div
          class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-slate-900/10 text-xs text-slate-800"
        >
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-bold text-slate-800">AI Copilot (Minimized)</span>
            <span class="text-slate-500 font-mono text-[10px]"
              >[{{ bridge.messages().length }} msgs]</span
            >
          </div>
          <div class="flex items-center gap-1.5 ml-2">
            <button
              (click)="toggleMinimize()"
              class="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Expand Drawer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
            <button
              (click)="closeDrawer()"
              class="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors"
              title="Close Drawer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Full Floating Glassmorphic Slide-over Drawer -->
    @if (bridge.isOpen() && !bridge.isMinimized()) {
      <div
        class="fixed bottom-4 right-4 sm:right-6 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] z-50 flex flex-col rounded-2xl bg-[#fbf9f5]/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden animate-slide-up"
        [class.transition-[width,height]]="!isResizing()"
        [class.duration-150]="!isResizing()"
        [class.ease-out]="!isResizing()"
        [class.select-none]="isResizing()"
        [class.max-w-6xl]="isMaximized()"
        [style.width]="isMaximized() ? 'calc(100vw - 2rem)' : width() + 'px'"
        [style.height]="isMaximized() ? 'calc(100vh - 2rem)' : height() + 'px'"
      >
        <!-- Resize Handles (only active when not maximized) -->
        @if (!isMaximized()) {
          <!-- Top edge resize handle (vertical) with visible grab pill -->
          <div
            class="absolute top-0 left-0 right-0 h-3.5 cursor-ns-resize z-30 group flex items-start justify-center pt-0.5 hover:bg-cyan-500/15 active:bg-cyan-500/25 transition-colors"
            title="Arrastrar para ajustar altura"
            (pointerdown)="startResize($event, 'top')"
          >
            <div
              class="w-10 h-1 rounded-full bg-slate-300 group-hover:bg-cyan-500 transition-colors opacity-70 group-hover:opacity-100"
            ></div>
          </div>

          <!-- Left edge resize handle (horizontal) with visible grab line -->
          <div
            class="absolute top-0 bottom-0 left-0 w-3.5 cursor-ew-resize z-30 group flex items-center justify-start pl-0.5 hover:bg-cyan-500/15 active:bg-cyan-500/25 transition-colors"
            title="Arrastrar para ajustar ancho"
            (pointerdown)="startResize($event, 'left')"
          >
            <div
              class="w-1 h-10 rounded-full bg-slate-300 group-hover:bg-cyan-500 transition-colors opacity-70 group-hover:opacity-100"
            ></div>
          </div>

          <!-- Top-left corner resize handle (diagonal) with visual corner grip -->
          <div
            class="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-40 group flex items-center justify-center p-1 hover:bg-cyan-500/20 active:bg-cyan-500/30 rounded-tl-2xl transition-colors"
            title="Arrastrar esquina para ajustar tamaño libremente"
            (pointerdown)="startResize($event, 'top-left')"
          >
            <div
              class="w-2.5 h-2.5 border-t-2 border-l-2 border-slate-400 group-hover:border-cyan-600 transition-colors"
            ></div>
          </div>
        }

        <!-- Drawer Header -->
        <div
          class="p-3.5 px-4 bg-white/90 border-b border-slate-200 flex items-center justify-between gap-2 select-none relative z-10"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px] shadow-sm shadow-cyan-500/20"
            >
              <div class="w-full h-full bg-white rounded-[7px] flex items-center justify-center">
                <span class="text-xs font-black text-cyan-600">AI</span>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-extrabold text-slate-900 tracking-wide">AI Copilot</h3>
                <span
                  class="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded bg-cyan-50 text-cyan-700 border border-cyan-200"
                >
                  Bridge Proxy
                </span>
              </div>
              <p class="text-[10px] text-slate-500 font-mono">CPAMC Autonomous Loop</p>
            </div>
          </div>

          <!-- Controls: Window Buttons -->
          <div class="flex items-center gap-1.5">
            <!-- Size Preset Selector (S / M / L) -->
            @if (!isMaximized()) {
              <div
                class="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200 mr-0.5 text-[10px] font-mono"
              >
                <button
                  type="button"
                  (click)="applyPresetSize('compact')"
                  [class.bg-white]="width() <= 400"
                  [class.shadow-xs]="width() <= 400"
                  [class.text-cyan-700]="width() <= 400"
                  [class.font-bold]="width() <= 400"
                  class="px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-900 transition-all"
                  title="Tamaño Compacto (380x480)"
                >
                  S
                </button>
                <button
                  type="button"
                  (click)="applyPresetSize('default')"
                  [class.bg-white]="width() > 400 && width() <= 600"
                  [class.shadow-xs]="width() > 400 && width() <= 600"
                  [class.text-cyan-700]="width() > 400 && width() <= 600"
                  [class.font-bold]="width() > 400 && width() <= 600"
                  class="px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-900 transition-all"
                  title="Tamaño Estándar (500x640)"
                >
                  M
                </button>
                <button
                  type="button"
                  (click)="applyPresetSize('wide')"
                  [class.bg-white]="width() > 600"
                  [class.shadow-xs]="width() > 600"
                  [class.text-cyan-700]="width() > 600"
                  [class.font-bold]="width() > 600"
                  class="px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-900 transition-all"
                  title="Tamaño Amplio (750x780)"
                >
                  L
                </button>
              </div>
            }

            <!-- Clear Chat -->
            <button
              (click)="clearChat()"
              class="p-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors"
              title="Clear Chat History"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            <!-- Maximize / Restore -->
            <button
              (click)="toggleExpand()"
              class="p-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-cyan-700 transition-colors"
              [title]="isMaximized() ? 'Restore' : 'Maximize'"
            >
              @if (isMaximized()) {
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 9L4 4m0 0h5m-5 0v5m11 11l5 5m0 0h-5m5 0v-5m-11 0l-5 5m0 0h5m-5 0v-5m11-11l5-5m0 0h-5m5 0v5"
                  />
                </svg>
              } @else {
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              }
            </button>

            <!-- Minimize -->
            <button
              (click)="toggleMinimize()"
              class="p-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-cyan-700 transition-colors"
              title="Minimize"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 12H4"
                />
              </svg>
            </button>

            <!-- Close -->
            <button
              (click)="closeDrawer()"
              class="p-1.5 rounded-lg bg-slate-100/80 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors"
              title="Close"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Live Status Sub-bar -->
        <div
          class="px-4 py-1.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-600"
        >
          <div class="flex items-center gap-1.5">
            <span
              class="w-2 h-2 rounded-full"
              [ngClass]="bridge.isGenerating() ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'"
            ></span>
            <span
              >Status:
              {{ bridge.isGenerating() ? 'Thinking & Executing...' : 'Agent Idle / Ready' }}</span
            >
          </div>
          <div class="text-slate-500">Max Recursion: 5 Turns</div>
        </div>

        <!-- Message Stream Scroll Area -->
        <div #scrollContainer class="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
          <!-- Empty State / Welcome & Quick Action Chips -->
          @if (bridge.messages().length === 0) {
            <div class="space-y-4 py-3">
              <div
                class="p-4 rounded-xl bg-gradient-to-b from-cyan-50/80 to-purple-50/60 border border-cyan-200/80 text-center space-y-2"
              >
                <div
                  class="inline-flex p-2.5 rounded-full bg-cyan-100 border border-cyan-300/60 text-cyan-700"
                >
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h4 class="text-sm font-bold text-slate-900">Multimodal Autonomous Copilot</h4>
                <p class="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Ask AI Copilot to control the 3D visualizer, inspect parameters, take screenshots,
                  or fill customizer forms.
                </p>
              </div>

              <div class="space-y-2">
                <div
                  class="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono px-1"
                >
                  ⚡ Quick Demo Actions:
                </div>
                <div class="grid grid-cols-1 gap-2">
                  @for (chip of promptChips(); track chip.label) {
                    <button
                      (click)="selectPromptChip(chip)"
                      class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-500/40 text-left transition-all group shadow-xs"
                    >
                      <span class="text-base">{{ chip.icon }}</span>
                      <div class="flex-1 min-w-0">
                        <div
                          class="text-xs font-semibold text-slate-800 group-hover:text-cyan-700 truncate"
                        >
                          {{ chip.label }}
                        </div>
                        <div class="text-[10px] text-slate-500 truncate font-mono">
                          {{ chip.prompt }}
                        </div>
                      </div>
                      <svg
                        class="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Message History Items -->
          @for (msg of bridge.messages(); track msg.id) {
            <!-- User Message -->
            @if (msg.role === 'user') {
              <div class="flex justify-end">
                <div
                  class="max-w-[85%] rounded-2xl rounded-tr-sm bg-cyan-600 text-white border border-cyan-700 p-3 text-xs shadow-xs"
                >
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-[10px] font-mono font-bold text-cyan-100 uppercase">You</span>
                    <span class="text-[9px] font-mono text-cyan-200">{{
                      formatTimestamp(msg.timestamp)
                    }}</span>
                  </div>
                  <div
                    class="leading-relaxed"
                    [innerHTML]="formatMessageContent(msg.content)"
                  ></div>
                </div>
              </div>
            }

            <!-- Assistant Text Message -->
            @if (msg.role === 'assistant' && (msg.content || msg.thinking)) {
              <div class="flex justify-start">
                <div
                  class="max-w-[88%] rounded-2xl rounded-tl-sm bg-white border border-purple-200 p-3 text-xs text-slate-800 shadow-xs"
                >
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      <span class="text-[10px] font-mono font-bold text-purple-700 uppercase"
                        >AI Copilot</span
                      >
                    </div>
                    <span class="text-[9px] font-mono text-slate-400">{{
                      formatTimestamp(msg.timestamp)
                    }}</span>
                  </div>

                  @if (msg.thinking) {
                    <details
                      class="mb-2 group rounded-xl border border-slate-200/80 bg-slate-50/80 text-[11px] overflow-hidden"
                    >
                      <summary
                        class="px-3 py-1.5 cursor-pointer font-medium text-slate-500 hover:text-slate-800 flex items-center justify-between select-none bg-slate-100/50"
                      >
                        <span>💭 Thought Process</span>
                        <svg
                          class="w-3 h-3 transition-transform group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>
                      <div
                        class="p-2.5 text-slate-600 font-mono text-[11px] whitespace-pre-wrap border-t border-slate-200/60 bg-white/60"
                      >
                        {{ msg.thinking }}
                      </div>
                    </details>
                  }

                  @if (msg.content) {
                    <div
                      class="leading-relaxed text-slate-800"
                      [innerHTML]="formatMessageContent(msg.content)"
                    ></div>
                  }
                </div>
              </div>
            }

            <!-- Tool / Subagent Execution Card / Pill Accordion -->
            @if (msg.role === 'tool') {
              <details
                class="group rounded-xl border border-slate-200 bg-white/90 text-xs shadow-xs overflow-hidden"
              >
                <summary
                  class="px-3 py-2 cursor-pointer font-medium text-slate-700 hover:bg-slate-50/80 flex items-center justify-between select-none list-none [&::-webkit-details-marker]:hidden"
                >
                  <div class="flex items-center gap-2">
                    @if (msg.toolExecution?.subagentReceipt) {
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1"
                      >
                        <span>🤖</span>
                        <span>{{ msg.toolExecution?.subagentReceipt?.agentType }}</span>
                      </span>
                    } @else if (msg.toolExecution?.status === 'success') {
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                      >
                        <span>✓</span>
                        <span>{{ msg.name }}</span>
                      </span>
                    } @else if (msg.toolExecution?.status === 'error') {
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"
                      >
                        <span>✗</span>
                        <span>{{ msg.name }}</span>
                      </span>
                    } @else {
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse"
                      >
                        <span>⚡</span>
                        <span>{{ msg.name }}</span>
                      </span>
                    }

                    <span class="text-[10px] text-slate-500 font-mono">
                      {{ msg.toolExecution?.durationMs || 0 }}ms
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="text-[9px] font-mono text-slate-500">
                      {{ msg.toolExecution?.subagentReceipt ? 'Subagent Receipt' : 'Tool Result' }}
                    </span>
                    <svg
                      class="w-3 h-3 text-slate-400 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </summary>

                <div class="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
                  <!-- Subagent Structured Receipt Preview -->
                  @if (msg.toolExecution?.subagentReceipt; as receipt) {
                    <div
                      class="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200/80 space-y-1.5 text-[11px]"
                    >
                      <div
                        class="flex items-center justify-between font-mono text-[10px] text-purple-800"
                      >
                        <span class="font-bold">Target Specialist: {{ receipt.agentType }}</span>
                        <span>{{ receipt.totalTurns }} steps</span>
                      </div>
                      <p class="text-slate-700 font-medium leading-relaxed">
                        {{ receipt.summary }}
                      </p>
                      @if (receipt.toolsUsed.length > 0) {
                        <div class="text-[10px] text-slate-500 font-mono">
                          Internal Tools:
                          <span class="text-slate-700">{{ receipt.toolsUsed.join(', ') }}</span>
                        </div>
                      }
                      @if (receipt.tokenUsageEstimate) {
                        <div class="text-[9px] text-purple-600 font-mono">
                          Isolated Tokens: {{ receipt.tokenUsageEstimate.totalTokens }} (kept off
                          main context)
                        </div>
                      }
                    </div>
                  }

                  <!-- Multimodal Base64 Image Preview (if take_screenshot) -->
                  @if (msg.imageUrl) {
                    <div
                      class="rounded-lg overflow-hidden border border-cyan-300/80 relative group bg-slate-900"
                    >
                      <img
                        [src]="msg.imageUrl"
                        alt="3D Viewport Capture"
                        class="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        (click)="openImageModal(msg.imageUrl)"
                      />
                      <button
                        (click)="openImageModal(msg.imageUrl)"
                        class="absolute bottom-2 right-2 px-2 py-1 rounded bg-white/90 hover:bg-cyan-50 text-[10px] font-mono text-cyan-800 border border-cyan-300 backdrop-blur-md flex items-center gap-1 shadow-xs"
                      >
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                        <span>Expand</span>
                      </button>
                    </div>
                  }

                  @if (msg.toolExecution?.errorMessage) {
                    <div
                      class="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono"
                    >
                      {{ msg.toolExecution?.errorMessage }}
                    </div>
                  }

                  @if (msg.content) {
                    <div
                      class="p-2 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-600 max-h-36 overflow-y-auto whitespace-pre-wrap"
                    >
                      {{ msg.content }}
                    </div>
                  }
                </div>
              </details>
            }
          }

          <!-- Generating / Tool Execution Animated Indicator -->
          @if (bridge.isGenerating()) {
            <div
              class="flex items-center gap-2.5 p-3 rounded-xl bg-white/90 border border-cyan-300 text-xs text-cyan-800 shadow-xs"
            >
              <div class="flex gap-1">
                <span class="w-2 h-2 rounded-full bg-cyan-600 animate-bounce"></span>
                <span
                  class="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.2s]"
                ></span>
                <span
                  class="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.4s]"
                ></span>
              </div>
              <span class="font-mono text-[11px]">
                {{
                  bridge.activeToolExecution()
                    ? 'Executing ' + bridge.activeToolExecution()?.toolName + '...'
                    : 'Thinking & executing...'
                }}
              </span>
            </div>
          }
        </div>

        <!-- Quick Action Prompt Chips Bar (when conversation active) -->
        @if (bridge.messages().length > 0) {
          <div
            class="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 no-scrollbar"
          >
            @for (chip of promptChips(); track chip.label) {
              <button
                (click)="selectPromptChip(chip)"
                [disabled]="bridge.isGenerating()"
                class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-[10px] font-medium text-slate-700 hover:text-cyan-700 border border-slate-200 hover:border-cyan-500/40 whitespace-nowrap transition-all flex items-center gap-1 shadow-xs"
              >
                <span>{{ chip.icon }}</span>
                <span>{{ chip.label }}</span>
              </button>
            }
          </div>
        }

        <!-- Chat Input & Submit Area -->
        <div class="p-3 bg-white/90 border-t border-slate-200">
          <form (ngSubmit)="submitMessage()" class="flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="inputText"
              name="promptInput"
              [disabled]="bridge.isGenerating()"
              placeholder="Ask Copilot (e.g. Orbit 90° and screenshot)..."
              class="flex-1 bg-white border border-slate-200 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs transition-colors"
            />

            <button
              type="submit"
              [disabled]="!inputText.trim() || bridge.isGenerating()"
              class="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-cyan-600/20 transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    }

    <!-- Modal Lightbox for Screenshot Expand -->
    @if (previewImageUrl()) {
      <div
        (click)="closeImageModal()"
        class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      >
        <div
          class="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl border border-slate-200 p-2 shadow-2xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between p-2 border-b border-slate-200">
            <span class="text-xs font-mono font-bold text-cyan-800"
              >📸 WebGL Canvas Viewport Capture</span
            >
            <button
              (click)="closeImageModal()"
              class="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="p-2 flex items-center justify-center bg-slate-100/50">
            <img
              [src]="previewImageUrl()"
              alt="Full Capture"
              class="max-h-[75vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #efece4;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.4);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.7);
      }
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .animate-slide-up {
        animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes bounceSubtle {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-4px);
        }
      }
      .animate-bounce-subtle {
        animation: bounceSubtle 3s ease-in-out infinite;
      }
    `,
  ],
})
export class CopilotChatComponent implements AfterViewChecked {
  readonly bridge: CopilotBridgeService;
  readonly registry?: SidebarModuleRegistryService;

  inputText = '';
  readonly previewImageUrl = signal<string | null>(null);

  readonly width = signal<number>(this.getInitialWidth());
  readonly height = signal<number>(this.getInitialHeight());
  readonly isMaximized = signal<boolean>(false);
  readonly isResizing = signal<boolean>(false);
  readonly isExpanded = computed<boolean>(() => this.isMaximized());

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly promptChips = computed<PromptChip[]>(() => {
    const activeView = this.registry?.activeView();
    const viewId = activeView?.id || 'view-3d-showroom';
    const route = activeView?.route || '/3d-showroom';

    if (viewId === 'view-enterprise-bi' || route === '/enterprise-bi') {
      return ENTERPRISE_BI_PROMPT_CHIPS;
    }
    if (viewId === 'view-judge-guide' || route === '/judge-guide') {
      return JUDGE_GUIDE_PROMPT_CHIPS;
    }
    if (viewId === 'view-inspector' || route === '/inspector') {
      return INSPECTOR_PROMPT_CHIPS;
    }
    return SHOWROOM_3D_PROMPT_CHIPS;
  });

  constructor(
    @Optional() bridge?: CopilotBridgeService,
    @Optional() registry?: SidebarModuleRegistryService,
  ) {
    this.bridge = bridge ?? inject(CopilotBridgeService);
    this.registry =
      registry ?? inject(SidebarModuleRegistryService, { optional: true }) ?? undefined;
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch {
        // ignore
      }
    }
  }

  openDrawer(): void {
    this.bridge.openDrawer();
  }

  closeDrawer(): void {
    this.bridge.closeDrawer();
  }

  toggleMinimize(): void {
    this.bridge.toggleMinimize();
  }

  clearChat(): void {
    this.bridge.clearHistory();
  }

  onModelChange(modelId: string): void {
    this.bridge.selectModel(modelId);
  }

  async selectPromptChip(chip: PromptChip): Promise<void> {
    this.inputText = chip.prompt;
    await this.submitMessage();
  }

  async submitMessage(): Promise<void> {
    const text = this.inputText.trim();
    if (!text || this.bridge.isGenerating()) {
      return;
    }
    this.inputText = '';
    await this.bridge.sendMessage(text);
  }

  openImageModal(url: string): void {
    this.previewImageUrl.set(url);
  }

  closeImageModal(): void {
    this.previewImageUrl.set(null);
  }

  formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  }

  toggleExpand(): void {
    this.isMaximized.update((val) => !val);
  }

  toggleMaximizeWindow(): void {
    this.toggleExpand();
  }

  clampWidth(width: number): number {
    const maxWidth =
      typeof window === 'undefined' ? 1920 : Math.max(window.innerWidth - 32, MIN_CHAT_WIDTH);
    return Math.max(MIN_CHAT_WIDTH, Math.min(width, maxWidth));
  }

  clampHeight(height: number): number {
    const maxHeight =
      typeof window === 'undefined' ? 1080 : Math.max(window.innerHeight - 32, MIN_CHAT_HEIGHT);
    return Math.max(MIN_CHAT_HEIGHT, Math.min(height, maxHeight));
  }

  getInitialWidth(): number {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!Number.isNaN(parsed) && parsed > 0) {
            return this.clampWidth(parsed);
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return DEFAULT_CHAT_WIDTH;
  }

  getInitialHeight(): number {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_HEIGHT);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!Number.isNaN(parsed) && parsed > 0) {
            return this.clampHeight(parsed);
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return DEFAULT_CHAT_HEIGHT;
  }

  saveDimensions(width: number, height: number): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_WIDTH, width.toString());
        localStorage.setItem(STORAGE_KEY_HEIGHT, height.toString());
      } catch {
        // ignore storage errors
      }
    }
  }

  resetDimensions(): void {
    this.width.set(DEFAULT_CHAT_WIDTH);
    this.height.set(DEFAULT_CHAT_HEIGHT);
    this.saveDimensions(DEFAULT_CHAT_WIDTH, DEFAULT_CHAT_HEIGHT);
  }

  applyPresetSize(preset: 'compact' | 'default' | 'wide'): void {
    if (this.isMaximized()) {
      this.isMaximized.set(false);
    }
    let targetW = DEFAULT_CHAT_WIDTH;
    let targetH = DEFAULT_CHAT_HEIGHT;

    if (preset === 'compact') {
      targetW = PRESET_COMPACT_WIDTH;
      targetH = PRESET_COMPACT_HEIGHT;
    } else if (preset === 'wide') {
      targetW = PRESET_WIDE_WIDTH;
      targetH = PRESET_WIDE_HEIGHT;
    }

    const clampedW = this.clampWidth(targetW);
    const clampedH = this.clampHeight(targetH);

    this.width.set(clampedW);
    this.height.set(clampedH);
    this.saveDimensions(clampedW, clampedH);
  }

  startResize(event: PointerEvent, handle: 'top' | 'left' | 'top-left'): void {
    if (this.isMaximized()) {
      return;
    }

    event.preventDefault?.();
    event.stopPropagation?.();

    this.isResizing.set(true);

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = this.width();
    const startHeight = this.height();

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault?.();
      if (handle === 'left' || handle === 'top-left') {
        const deltaX = startX - moveEvent.clientX;
        const newWidth = this.clampWidth(startWidth + deltaX);
        this.width.set(newWidth);
      }
      if (handle === 'top' || handle === 'top-left') {
        const deltaY = startY - moveEvent.clientY;
        const newHeight = this.clampHeight(startHeight + deltaY);
        this.height.set(newHeight);
      }
    };

    const onPointerUp = () => {
      this.isResizing.set(false);
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      }
      this.saveDimensions(this.width(), this.height());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }
  }

  /**
   * Safely parses markdown strings into styled HTML, eliminating raw hash headers,
   * rendering code blocks/inline code, bold/italics, and lists while escaping raw HTML for XSS prevention.
   */
  formatMessageContent(content?: string | null): string {
    return formatMessageContent(content);
  }
}

/**
 * Pure helper function to format markdown content safely for copilot chat.
 */
export function formatMessageContent(content?: string | null): string {
  if (!content) {
    return '';
  }

  // 1. Escape raw HTML characters to avoid XSS
  let text = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // 2. Extract and protect fenced code blocks
  const codeBlocks: string[] = [];
  text = text.replace(/```(?:([a-zA-Z0-9_-]+)?\r?\n)?([\s\S]*?)```/g, (_match, _lang, code) => {
    const placeholder = `%%CODE_BLOCK_${codeBlocks.length}%%`;
    const cleanCode = (code || '').trim();
    codeBlocks.push(
      `<pre class="my-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto"><code>${cleanCode}</code></pre>`,
    );
    return placeholder;
  });

  // 3. Extract and protect inline code
  const inlineCodes: string[] = [];
  text = text.replace(/`([^`\r\n]+)`/g, (_match, code) => {
    const placeholder = `%%INLINE_CODE_${inlineCodes.length}%%`;
    inlineCodes.push(
      `<code class="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-cyan-800 border border-slate-200">${code}</code>`,
    );
    return placeholder;
  });

  // 4. Convert headings (#, ##, ###, ####, #####, ######) completely stripping # characters
  text = text.replace(/^(#{1,6})\s+(.+)$/gm, (_match, _hashes, headerText) => {
    return `<div class="font-bold text-slate-900 text-xs mt-2 mb-1">${headerText.trim()}</div>`;
  });

  // 5. Convert bold (**text** or __text__) and italic (*text* or _text_)
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong class="font-semibold text-slate-900">$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');

  // 6. Convert bullet lists (- or *) and numbered lists (1. ) into <ul> / <ol>
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/);

    if (bulletMatch) {
      if (inOl) {
        processedLines.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        processedLines.push('<ul class="list-disc list-inside my-1 space-y-0.5 text-slate-800">');
        inUl = true;
      }
      processedLines.push(`<li class="ml-1">${bulletMatch[1]}</li>`);
    } else if (numberedMatch) {
      if (inUl) {
        processedLines.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        processedLines.push(
          '<ol class="list-decimal list-inside my-1 space-y-0.5 text-slate-800">',
        );
        inOl = true;
      }
      processedLines.push(`<li class="ml-1">${numberedMatch[1]}</li>`);
    } else {
      if (inUl) {
        processedLines.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        processedLines.push('</ol>');
        inOl = false;
      }
      processedLines.push(line);
    }
  }

  if (inUl) {
    processedLines.push('</ul>');
    inUl = false;
  }
  if (inOl) {
    processedLines.push('</ol>');
    inOl = false;
  }

  text = processedLines.join('\n');

  // 7. Convert newlines to <br/> and double newlines to paragraph spacing
  text = text.replace(/\n\n+/g, '<div class="my-1.5"></div>');
  text = text.replace(/\n/g, '<br/>');

  // Clean up redundant <br/> around block tags
  text = text
    .replace(/(<\/ul>|<\/ol>|<\/div>|<\/pre>)(<br\/>)+/g, '$1')
    .replace(/(<br\/>)+(<ul|<ol|<div|<pre)/g, '$2');

  // 8. Restore protected inline code and code blocks
  text = text.replace(/%%INLINE_CODE_(\d+)%%/g, (_match, idx) => inlineCodes[Number(idx)] || '');
  text = text.replace(/%%CODE_BLOCK_(\d+)%%/g, (_match, idx) => codeBlocks[Number(idx)] || '');

  return text;
}
