import { Component, inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  WebmcpThreeSceneBridge,
  StudioMaterialConfig,
} from '@webmcp/angular';

interface MaterialPreset {
  name: string;
  icon: string;
  config: StudioMaterialConfig;
}

@Component({
  selector: 'app-studio-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 rounded-2xl bg-white/95 border border-slate-200 shadow-sm backdrop-blur-xl space-y-4 select-none">
      
      <!-- Inspector Header -->
      <div class="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-sm">🎛️</span>
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-900">
              Studio Inspector
            </h3>
            <p class="text-[10px] text-slate-500 font-mono">Transforms & PBR Materials</p>
          </div>
        </div>

        @if (bridge.selectedNode(); as sel) {
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-300">
            {{ sel.name }}
          </span>
        }
      </div>

      <!-- No Selection Empty State -->
      @if (!bridge.selectedNode()) {
        <div class="p-8 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <span class="text-2xl">🎯</span>
          <div class="text-xs font-semibold text-slate-700">No Object Selected</div>
          <p class="text-[11px] text-slate-500 max-w-xs mx-auto">
            Click any 3D object in the canvas or select from the Outliner to edit live transforms and physical materials.
          </p>
        </div>
      } @else {
        <!-- Active Selection Panels -->
        @if (bridge.selectedNode(); as node) {
          <div class="space-y-4 text-xs">
            
            <!-- 1. Transform Matrix Section -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <span>📐 Transform Matrix</span>
                <div class="flex items-center gap-1">
                  <button
                    (click)="snapToFloor()"
                    title="Snap to floor (Y=0)"
                    class="px-2 py-0.5 rounded text-[10px] font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors">
                    Snap Floor
                  </button>
                  <button
                    (click)="resetTransforms()"
                    title="Reset position and rotation"
                    class="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Reset
                  </button>
                </div>
              </div>

              <!-- Position (X, Y, Z) -->
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Pos X</label>
                  <input
                    type="number"
                    step="0.1"
                    [ngModel]="node.position.x"
                    (ngModelChange)="updatePosition('x', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Pos Y</label>
                  <input
                    type="number"
                    step="0.1"
                    [ngModel]="node.position.y"
                    (ngModelChange)="updatePosition('y', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Pos Z</label>
                  <input
                    type="number"
                    step="0.1"
                    [ngModel]="node.position.z"
                    (ngModelChange)="updatePosition('z', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <!-- Rotation (X, Y, Z) in Degrees -->
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Rot X°</label>
                  <input
                    type="number"
                    step="15"
                    [ngModel]="node.rotation.x"
                    (ngModelChange)="updateRotation('x', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Rot Y°</label>
                  <input
                    type="number"
                    step="15"
                    [ngModel]="node.rotation.y"
                    (ngModelChange)="updateRotation('y', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Rot Z°</label>
                  <input
                    type="number"
                    step="15"
                    [ngModel]="node.rotation.z"
                    (ngModelChange)="updateRotation('z', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <!-- Scale (X, Y, Z) -->
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Scale X</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    [ngModel]="node.scale.x"
                    (ngModelChange)="updateScale('x', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Scale Y</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    [ngModel]="node.scale.y"
                    (ngModelChange)="updateScale('y', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-500">Scale Z</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    [ngModel]="node.scale.z"
                    (ngModelChange)="updateScale('z', $event)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="w-full h-[1px] bg-slate-200/80"></div>

            <!-- 2. PBR Physical Material Studio Section -->
            <div class="space-y-3">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                🎨 PBR Material Studio
              </div>

              <!-- Quick Material Presets -->
              <div class="grid grid-cols-3 gap-1.5">
                @for (preset of presets; track preset.name) {
                  <button
                    (click)="applyPreset(preset)"
                    class="p-1.5 rounded-lg bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-[10px] font-semibold text-slate-700 hover:text-cyan-800 flex items-center gap-1 transition-all">
                    <span>{{ preset.icon }}</span>
                    <span class="truncate">{{ preset.name }}</span>
                  </button>
                }
              </div>

              <!-- Color Picker -->
              <div class="flex items-center justify-between gap-3">
                <label class="text-[11px] text-slate-600 font-medium">Base Color</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    [ngModel]="node.material?.color || '#00f0ff'"
                    (ngModelChange)="updateMaterialProperty('color', $event)"
                    class="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent" />
                  <input
                    type="text"
                    [ngModel]="node.material?.color || '#00f0ff'"
                    (ngModelChange)="updateMaterialProperty('color', $event)"
                    class="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono uppercase text-slate-800 focus:outline-none" />
                </div>
              </div>

              <!-- Metalness Slider -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] text-slate-600">
                  <span>Metalness</span>
                  <span class="font-mono text-[10px] text-slate-500">{{ node.material?.metalness ?? 0.8 }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  [ngModel]="node.material?.metalness ?? 0.8"
                  (ngModelChange)="updateMaterialProperty('metalness', $event)"
                  class="w-full accent-cyan-600 cursor-pointer" />
              </div>

              <!-- Roughness Slider -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] text-slate-600">
                  <span>Roughness</span>
                  <span class="font-mono text-[10px] text-slate-500">{{ node.material?.roughness ?? 0.2 }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  [ngModel]="node.material?.roughness ?? 0.2"
                  (ngModelChange)="updateMaterialProperty('roughness', $event)"
                  class="w-full accent-cyan-600 cursor-pointer" />
              </div>

              <!-- Transmission / Glass Slider -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] text-slate-600">
                  <span>Transmission (Glass)</span>
                  <span class="font-mono text-[10px] text-slate-500">{{ node.material?.transmission ?? 0.0 }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  [ngModel]="node.material?.transmission ?? 0.0"
                  (ngModelChange)="updateMaterialProperty('transmission', $event)"
                  class="w-full accent-cyan-600 cursor-pointer" />
              </div>

              <!-- Emissive Intensity -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] text-slate-600">
                  <span>Emissive Glow</span>
                  <span class="font-mono text-[10px] text-slate-500">{{ node.material?.emissiveIntensity ?? 0.2 }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  [ngModel]="node.material?.emissiveIntensity ?? 0.2"
                  (ngModelChange)="updateMaterialProperty('emissiveIntensity', $event)"
                  class="w-full accent-cyan-600 cursor-pointer" />
              </div>

              <!-- Wireframe Toggle -->
              <div class="flex items-center justify-between pt-1">
                <label class="text-[11px] text-slate-600 font-medium">Wireframe Overlay</label>
                <input
                  type="checkbox"
                  [ngModel]="node.material?.wireframe ?? false"
                  (ngModelChange)="updateMaterialProperty('wireframe', $event)"
                  class="w-4 h-4 accent-purple-600 rounded cursor-pointer" />
              </div>

            </div>

          </div>
        }
      }

    </div>
  `,
})
export class StudioInspectorComponent {
  readonly bridge: WebmcpThreeSceneBridge;

  readonly presets: MaterialPreset[] = [
    {
      name: 'Gold',
      icon: '🏆',
      config: { color: '#ffd700', metalness: 0.95, roughness: 0.1, transmission: 0 },
    },
    {
      name: 'Chrome',
      icon: '💿',
      config: { color: '#f1f5f9', metalness: 1.0, roughness: 0.05, transmission: 0 },
    },
    {
      name: 'Stealth',
      icon: '🌑',
      config: { color: '#0f172a', metalness: 0.2, roughness: 0.8, transmission: 0 },
    },
    {
      name: 'Neon',
      icon: '⚡',
      config: { color: '#00f0ff', metalness: 0.6, roughness: 0.1, emissive: '#00f0ff', emissiveIntensity: 1.0 },
    },
    {
      name: 'Glass',
      icon: '💎',
      config: { color: '#10b981', metalness: 0.0, roughness: 0.05, transmission: 0.9 },
    },
    {
      name: 'Carbon',
      icon: '🏁',
      config: { color: '#18181b', metalness: 0.5, roughness: 0.4, transmission: 0 },
    },
  ];

  constructor(@Optional() bridge?: WebmcpThreeSceneBridge) {
    if (bridge) {
      this.bridge = bridge;
    } else {
      try {
        this.bridge = inject(WebmcpThreeSceneBridge, { optional: true }) || new WebmcpThreeSceneBridge();
      } catch {
        this.bridge = new WebmcpThreeSceneBridge();
      }
    }
  }

  async updatePosition(axis: 'x' | 'y' | 'z', value: number): Promise<void> {
    const node = this.bridge.selectedNode();
    if (!node) return;
    const pos = { ...node.position, [axis]: Number(value) };
    await this.bridge.transformObject({ target: node.name, position: pos });
  }

  async updateRotation(axis: 'x' | 'y' | 'z', value: number): Promise<void> {
    const node = this.bridge.selectedNode();
    if (!node) return;
    const rot = { ...node.rotation, [axis]: Number(value) };
    await this.bridge.transformObject({ target: node.name, rotation: rot });
  }

  async updateScale(axis: 'x' | 'y' | 'z', value: number): Promise<void> {
    const node = this.bridge.selectedNode();
    if (!node) return;
    const scl = { ...node.scale, [axis]: Math.max(0.01, Number(value)) };
    await this.bridge.transformObject({ target: node.name, scale: scl });
  }

  async snapToFloor(): Promise<void> {
    const node = this.bridge.selectedNode();
    if (!node) return;
    await this.bridge.transformObject({ target: node.name, position: { y: 0 } });
  }

  async resetTransforms(): Promise<void> {
    const node = this.bridge.selectedNode();
    if (!node) return;
    await this.bridge.transformObject({
      target: node.name,
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1.0,
    });
  }

  async updateMaterialProperty(key: keyof StudioMaterialConfig, value: any): Promise<void> {
    const node = this.bridge.selectedNode();
    if (!node) return;
    const current = node.material || {};
    const updated: StudioMaterialConfig = {
      ...current,
      [key]: value,
    };
    await this.bridge.updateMaterial({ target: node.name, material: updated });
  }

  async applyPreset(preset: MaterialPreset): Promise<void> {
    const node = this.bridge.selectedNode();
    if (!node) return;
    await this.bridge.updateMaterial({ target: node.name, material: preset.config });
  }
}
