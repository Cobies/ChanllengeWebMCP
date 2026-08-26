import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-judge-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
      
      <!-- Section Header -->
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Devpost Judge & Evaluator Guide
            </h2>
            <p class="text-xs text-slate-400">Testing WebMCP Native & Emulated Capabilities</p>
          </div>
        </div>

        <div class="flex gap-1.5">
          <button
            (click)="activeTab.set('copilot')"
            class="px-2.5 py-1 text-xs rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'copilot' ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'">
            🤖 Gemini Copilot
          </button>
          <button
            (click)="activeTab.set('chrome')"
            class="px-2.5 py-1 text-xs rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'chrome' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'">
            Chrome Flag
          </button>
          <button
            (click)="activeTab.set('agent')"
            class="px-2.5 py-1 text-xs rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'agent' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'">
            Agent Prompts
          </button>
          <button
            (click)="activeTab.set('architecture')"
            class="px-2.5 py-1 text-xs rounded-lg transition-all font-medium"
            [ngClass]="activeTab() === 'architecture' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'">
            Architecture
          </button>
        </div>
      </div>

      <!-- Tab Content: Gemini Copilot Guide -->
      @if (activeTab() === 'copilot') {
        <div class="space-y-3 text-xs text-slate-300">
          <div class="p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 to-purple-950/30 border border-cyan-500/30 space-y-2">
            <h3 class="font-bold text-cyan-400 flex items-center gap-1.5">
              <span>🤖 Live In-App Conversational Copilot</span>
              <span class="px-1.5 py-0.5 text-[9px] rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono">Gemini 3.7 Flash High</span>
            </h3>
            <p class="text-slate-300 leading-relaxed">
              Click the glowing <strong class="text-cyan-300">"AI Copilot"</strong> button in the top header or the bottom-right floating launcher. The agent connects to the CPAMC Bridge Proxy, auto-discovers browser WebMCP tools, and runs an autonomous recursive execution loop up to 5 turns.
            </p>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span class="text-cyan-400 font-mono text-[10px] block">📸 Viewport Inspection</span>
                <span class="text-slate-400 text-[11px]">Takes WebGL screenshots and renders instant cards in chat.</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span class="text-purple-400 font-mono text-[10px] block">⚡ 3D & Form Automation</span>
                <span class="text-slate-400 text-[11px]">Rotates vehicle, changes materials, and autofills forms.</span>
              </div>
            </div>
          </div>
        </div>
      }


      <!-- Tab Content: Chrome Flag Setup -->
      @if (activeTab() === 'chrome') {
        <div class="space-y-3 text-xs text-slate-300">
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 class="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
              <span>1. Enable Native WebMCP in Chrome Canary</span>
            </h3>
            <p class="text-slate-400 mb-2">
              To test with genuine browser-native WebMCP execution:
            </p>
            <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[11px] text-cyan-300 select-all mb-2">
              chrome://flags/#enable-webmcp-testing
            </div>
            <p class="text-slate-400">
              Set the flag to <strong class="text-emerald-400">Enabled</strong> and relaunch Chrome. The header badge will immediately illuminate in green as <strong class="text-slate-200">Native Browser Context</strong>.
            </p>
          </div>

          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 class="font-bold text-purple-400 mb-1">
              2. Seamless Local Emulator Fallback
            </h3>
            <p class="text-slate-400">
              Without the flag enabled or in standard browsers, the built-in <code class="text-cyan-300">WebMcpEmulator</code> transparently attaches to <code class="text-purple-300">window.modelContext</code>, allowing 100% full tool execution, schema validation, and live event monitoring.
            </p>
          </div>
        </div>
      }

      <!-- Tab Content: Agent Prompts -->
      @if (activeTab() === 'agent') {
        <div class="space-y-2 text-xs">
          <p class="text-slate-400 mb-2">
            Try sending these prompts to an attached WebMCP browser AI agent (or execute via simulation chips):
          </p>

          <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all">
            <div class="flex items-center justify-between text-slate-400 mb-1">
              <span class="font-semibold text-cyan-400">Scenario 1: 3D Visual Inspection</span>
              <span class="text-[10px] font-mono text-purple-400">scene_3d_action + take_screenshot</span>
            </div>
            <p class="text-slate-300 font-mono text-[11px]">
              "Orbit the 3D vehicle 45 degrees to the right, zoom in by 20%, and take a high-resolution screenshot to inspect the front aerodynamic intake."
            </p>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all">
            <div class="flex items-center justify-between text-slate-400 mb-1">
              <span class="font-semibold text-cyan-400">Scenario 2: Autonomous Form Customizer</span>
              <span class="text-[10px] font-mono text-purple-400">form_action_runner</span>
            </div>
            <p class="text-slate-300 font-mono text-[11px]">
              "Configure the vehicle customizer form: set chassis color to '#00f0ff', select 'Overdrive' drive mode, enable active spoiler, and submit the order."
            </p>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all">
            <div class="flex items-center justify-between text-slate-400 mb-1">
              <span class="font-semibold text-cyan-400">Scenario 3: Multimodal Co-Piloting</span>
              <span class="text-[10px] font-mono text-purple-400">scene_3d_action + highlight_part</span>
            </div>
            <p class="text-slate-300 font-mono text-[11px]">
              "Highlight the rear spoiler mesh with emissive pulse, paint the underglow cyan, and capture the current viewport."
            </p>
          </div>
        </div>
      }

      <!-- Tab Content: Architecture -->
      @if (activeTab() === 'architecture') {
        <div class="space-y-2 text-xs text-slate-300">
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-cyan-400 block mb-0.5">Angular 22 Signals</span>
              <p class="text-[11px] text-slate-400">Fine-grained reactive signals binding agent tool state with zero change-detection overhead.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-purple-400 block mb-0.5">Three.js Action Bus</span>
              <p class="text-[11px] text-slate-400">Serialized async queue with frame-synchronized camera lerping and timeout recovery.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-emerald-400 block mb-0.5">Client-side Multimodal</span>
              <p class="text-[11px] text-slate-400">Direct WebGL buffer readback yielding zero-latency base64 image data URLs.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span class="font-bold text-amber-400 block mb-0.5">W3C WebMCP Standard</span>
              <p class="text-[11px] text-slate-400">Full compliance with JSON Schema parameter validation and modelContext protocol.</p>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class JudgeGuideComponent {
  activeTab = signal<'copilot' | 'chrome' | 'agent' | 'architecture'>('copilot');
}

