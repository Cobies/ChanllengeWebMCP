import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CopilotBridgeService } from '../../services/copilot-bridge.service';
import { PromptChip, ChatMessage } from '../../services/copilot-bridge.types';

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
          class="group relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-600/20 to-pink-500/20 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all duration-300 transform hover:-translate-y-1">
          <span class="relative flex h-3.5 w-3.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
          </span>
          <div class="text-left">
            <div class="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <span>🤖 Gemini 3.7 Copilot</span>
              <span class="px-1.5 py-0.2 text-[9px] rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">AI Loop</span>
            </div>
            <div class="text-[11px] text-slate-300 font-mono">Autonomous WebMCP Agent</div>
          </div>
          <svg class="w-5 h-5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    }

    <!-- Minimized Floating Bar (when minimized) -->
    @if (bridge.isOpen() && bridge.isMinimized()) {
      <div class="fixed bottom-6 right-6 z-50 animate-fade-in">
        <div class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-bold text-slate-200">Gemini 3.7 Copilot (Minimized)</span>
            <span class="text-slate-400 font-mono text-[10px]">[{{ bridge.messages().length }} msgs]</span>
          </div>
          <div class="flex items-center gap-1.5 ml-2">
            <button
              (click)="toggleMinimize()"
              class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Expand Drawer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              (click)="closeDrawer()"
              class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close Drawer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Full Floating Glassmorphic Slide-over Drawer -->
    @if (bridge.isOpen() && !bridge.isMinimized()) {
      <div class="fixed bottom-4 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[460px] md:w-[500px] h-[640px] max-h-[calc(100vh-2rem)] z-50 flex flex-col rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden animate-slide-up">
        
        <!-- Drawer Header -->
        <div class="p-3.5 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 select-none">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px] shadow-md shadow-cyan-500/20">
              <div class="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <span class="text-xs font-black text-cyan-400">AI</span>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-extrabold text-white tracking-wide">
                  Gemini 3.7 Copilot
                </h3>
                <span class="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Bridge Proxy
                </span>
              </div>
              <p class="text-[10px] text-slate-400 font-mono">
                CPAMC Autonomous Loop
              </p>
            </div>
          </div>

          <!-- Controls: Model Selector & Window Buttons -->
          <div class="flex items-center gap-1.5">
            <!-- Model Selector Dropdown -->
            <select
              [ngModel]="bridge.selectedModel()"
              (ngModelChange)="onModelChange($event)"
              class="bg-slate-950 border border-slate-700 text-[11px] font-mono text-cyan-300 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[130px] truncate">
              @for (m of bridge.availableModels(); track m.id) {
                <option [value]="m.id">{{ m.id }}</option>
              }
            </select>

            <!-- Clear Chat -->
            <button
              (click)="clearChat()"
              class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Clear Chat History">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <!-- Minimize -->
            <button
              (click)="toggleMinimize()"
              class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Minimize">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>

            <!-- Close -->
            <button
              (click)="closeDrawer()"
              class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Live Status Sub-bar -->
        <div class="px-4 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" [ngClass]="bridge.isGenerating() ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'"></span>
            <span>Status: {{ bridge.isGenerating() ? 'Thinking & Executing...' : 'Agent Idle / Listening' }}</span>
          </div>
          <div class="text-slate-500">
            Max Recursion: 5 Turns
          </div>
        </div>

        <!-- Message Stream Scroll Area -->
        <div #scrollContainer class="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
          
          <!-- Empty State / Welcome & Quick Action Chips -->
          @if (bridge.messages().length === 0) {
            <div class="space-y-4 py-3">
              <div class="p-4 rounded-xl bg-gradient-to-b from-cyan-950/30 to-purple-950/20 border border-cyan-500/20 text-center space-y-2">
                <div class="inline-flex p-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 class="text-sm font-bold text-white">Multimodal Autonomous Copilot</h4>
                <p class="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Ask Gemini 3.7 Flash High to control the 3D visualizer, inspect parameters, take screenshots, or fill customizer forms.
                </p>
              </div>

              <div class="space-y-2">
                <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono px-1">
                  ⚡ Quick Demo Actions:
                </div>
                <div class="grid grid-cols-1 gap-2">
                  @for (chip of promptChips; track chip.label) {
                    <button
                      (click)="selectPromptChip(chip)"
                      class="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group">
                      <span class="text-base">{{ chip.icon }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                          {{ chip.label }}
                        </div>
                        <div class="text-[10px] text-slate-400 truncate font-mono">
                          {{ chip.prompt }}
                        </div>
                      </div>
                      <svg class="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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
                <div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-cyan-600/20 border border-cyan-500/40 p-3 text-xs text-slate-100 shadow-md shadow-cyan-950/30">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-[10px] font-mono font-bold text-cyan-400 uppercase">You</span>
                    <span class="text-[9px] font-mono text-slate-500">{{ formatTimestamp(msg.timestamp) }}</span>
                  </div>
                  <div class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</div>
                </div>
              </div>
            }

            <!-- Assistant Text Message -->
            @if (msg.role === 'assistant' && msg.content) {
              <div class="flex justify-start">
                <div class="max-w-[88%] rounded-2xl rounded-tl-sm bg-slate-900/90 border border-purple-500/30 p-3 text-xs text-slate-200 shadow-lg shadow-purple-950/20">
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      <span class="text-[10px] font-mono font-bold text-purple-300 uppercase">Gemini 3.7</span>
                    </div>
                    <span class="text-[9px] font-mono text-slate-500">{{ formatTimestamp(msg.timestamp) }}</span>
                  </div>
                  <div class="whitespace-pre-wrap leading-relaxed text-slate-300">{{ msg.content }}</div>
                </div>
              </div>
            }

            <!-- Tool Execution Card / Pill -->
            @if (msg.role === 'tool') {
              <div class="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2">
                
                <!-- Status Pill Header -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    @if (msg.toolExecution?.status === 'success') {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span>✓</span>
                        <span>{{ msg.name }}</span>
                      </span>
                    } @else if (msg.toolExecution?.status === 'error') {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <span>✗</span>
                        <span>{{ msg.name }}</span>
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                        <span>⚡</span>
                        <span>{{ msg.name }}</span>
                      </span>
                    }

                    <span class="text-[10px] text-slate-400 font-mono">
                      {{ msg.toolExecution?.durationMs || 0 }}ms
                    </span>
                  </div>

                  <span class="text-[9px] font-mono text-slate-500">Tool Result</span>
                </div>

                <!-- Multimodal Base64 Image Preview (if take_screenshot) -->
                @if (msg.imageUrl) {
                  <div class="rounded-lg overflow-hidden border border-cyan-500/30 relative group bg-black">
                    <img
                      [src]="msg.imageUrl"
                      alt="3D Viewport Capture"
                      class="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      (click)="openImageModal(msg.imageUrl)" />
                    <button
                      (click)="openImageModal(msg.imageUrl)"
                      class="absolute bottom-2 right-2 px-2 py-1 rounded bg-slate-950/80 hover:bg-cyan-950 text-[10px] font-mono text-cyan-300 border border-cyan-500/40 backdrop-blur-md flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span>Expand</span>
                    </button>
                  </div>
                }

              </div>
            }

          }

          <!-- Generating / Tool Execution Animated Indicator -->
          @if (bridge.isGenerating()) {
            <div class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs text-cyan-300">
              <div class="flex gap-1">
                <span class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                <span class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                <span class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span class="font-mono text-[11px]">
                {{ bridge.activeToolExecution() ? 'Executing ' + bridge.activeToolExecution()?.toolName + '...' : 'Gemini 3.7 Flash High reasoning...' }}
              </span>
            </div>
          }

        </div>

        <!-- Quick Action Prompt Chips Bar (when conversation active) -->
        @if (bridge.messages().length > 0) {
          <div class="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800/60 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            @for (chip of promptChips; track chip.label) {
              <button
                (click)="selectPromptChip(chip)"
                [disabled]="bridge.isGenerating()"
                class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-[10px] font-medium text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 whitespace-nowrap transition-all flex items-center gap-1">
                <span>{{ chip.icon }}</span>
                <span>{{ chip.label }}</span>
              </button>
            }
          </div>
        }

        <!-- Chat Input & Submit Area -->
        <div class="p-3 bg-slate-900/90 border-t border-slate-800">
          <form (ngSubmit)="submitMessage()" class="flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="inputText"
              name="promptInput"
              [disabled]="bridge.isGenerating()"
              placeholder="Ask Copilot (e.g. Orbit 90° and screenshot)..."
              class="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors" />

            <button
              type="submit"
              [disabled]="!inputText.trim() || bridge.isGenerating()"
              class="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-cyan-500/20 transition-all">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
        class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
        <div class="relative max-w-4xl w-full max-h-[90vh] bg-slate-950 rounded-2xl border border-cyan-500/40 p-2 shadow-2xl overflow-hidden" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-2 border-b border-slate-800">
            <span class="text-xs font-mono font-bold text-cyan-400">📸 WebGL Canvas Viewport Capture</span>
            <button
              (click)="closeImageModal()"
              class="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-2 flex items-center justify-center bg-black/40">
            <img [src]="previewImageUrl()" alt="Full Capture" class="max-h-[75vh] w-auto object-contain rounded-lg" />
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
        background: rgba(15, 23, 42, 0.6);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.3);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.6);
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
        0%, 100% {
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

  inputText = '';
  readonly previewImageUrl = signal<string | null>(null);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly promptChips: PromptChip[] = [
    {
      label: 'Take 3D Screenshot',
      icon: '📸',
      prompt: 'Take a screenshot of the 3D car viewport and describe the current view.',
    },
    {
      label: 'Orbit 90° & Neon Cyan',
      icon: '🏎️',
      prompt: 'Orbit camera 90 degrees and set vehicle paint to Neon Cyan (#00f0ff).',
    },
    {
      label: 'Boost Turbo & Sport Rims',
      icon: '⚡',
      prompt: 'Boost turbo, switch to sport rims, autofill pro customizer, and build report.',
    },
    {
      label: 'Reset Camera & Specs',
      icon: '🔄',
      prompt: 'Reset camera to origin and show current vehicle specifications.',
    },
  ];

  constructor(@Optional() bridge?: CopilotBridgeService) {
    this.bridge = bridge ?? inject(CopilotBridgeService);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch (e) {
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
}
