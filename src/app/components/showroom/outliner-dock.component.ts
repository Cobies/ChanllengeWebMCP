import { Component, inject, Optional, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  WebmcpThreeSceneBridge,
  StudioSceneNode,
} from '@webmcp/angular';

@Component({
  selector: 'app-outliner-dock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 rounded-2xl bg-white/95 border border-slate-200 shadow-sm backdrop-blur-xl space-y-3 select-none flex flex-col h-[400px]">
      
      <!-- Outliner Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm">🗂️</span>
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-900">
            Scene Outliner
          </h3>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
            {{ bridge.sceneNodes().length }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            (click)="clearCustom()"
            title="Remove all custom objects"
            class="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors">
            Clear Custom
          </button>
          <button
            (click)="resetScene()"
            title="Reset whole scene & camera"
            class="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Reset
          </button>
        </div>
      </div>

      <!-- Search Filter Input -->
      <div class="relative">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="Filter scene nodes..."
          class="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors" />
        @if (searchQuery) {
          <button
            (click)="searchQuery = ''"
            class="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700">
            ✕
          </button>
        }
      </div>

      <!-- Scene Nodes Tree Scroll Area -->
      <div class="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        @if (filteredNodes().length === 0) {
          <div class="p-6 text-center text-xs text-slate-400 font-mono">
            No matching scene nodes found.
          </div>
        }

        @for (node of filteredNodes(); track node.id) {
          <div
            (click)="selectNode(node)"
            [class]="isSelected(node) ? 'bg-cyan-50 border-cyan-400 shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-200/80'"
            class="flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer group">
            
            <!-- Left: Node Name & Type Badge -->
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-xs">{{ getNodeIcon(node) }}</span>
              <span
                class="text-xs font-semibold truncate"
                [ngClass]="isSelected(node) ? 'text-cyan-900 font-bold' : 'text-slate-700'">
                {{ node.name }}
              </span>
              @if (node.isCustom) {
                <span class="px-1 py-0.2 rounded text-[8px] uppercase font-mono font-bold bg-amber-100 text-amber-800">
                  Custom
                </span>
              }
            </div>

            <!-- Right: Quick Actions (Visibility, Lock, Duplicate, Delete) -->
            <div class="flex items-center gap-0.5 opacity-80 group-hover:opacity-100" (click)="$event.stopPropagation()">
              
              <!-- Visibility Toggle -->
              <button
                (click)="toggleVisibility(node)"
                [title]="node.visible ? 'Hide object' : 'Show object'"
                class="p-1 rounded-md hover:bg-slate-200/80 text-xs transition-colors"
                [ngClass]="node.visible ? 'text-slate-600' : 'text-slate-300'">
                {{ node.visible ? '👁️' : '🕶️' }}
              </button>

              <!-- Lock Toggle -->
              <button
                (click)="toggleLock(node)"
                [title]="node.locked ? 'Unlock object' : 'Lock object'"
                class="p-1 rounded-md hover:bg-slate-200/80 text-xs transition-colors"
                [ngClass]="node.locked ? 'text-amber-600' : 'text-slate-300'">
                {{ node.locked ? '🔒' : '🔓' }}
              </button>

              <!-- Duplicate -->
              <button
                (click)="duplicateNode(node)"
                title="Duplicate object"
                class="p-1 rounded-md hover:bg-cyan-100 text-slate-500 hover:text-cyan-800 text-xs transition-colors">
                📋
              </button>

              <!-- Delete -->
              <button
                (click)="deleteNode(node)"
                title="Delete object"
                class="p-1 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-700 text-xs transition-colors">
                🗑️
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `,
  ],
})
export class OutlinerDockComponent {
  readonly bridge: WebmcpThreeSceneBridge;
  searchQuery = '';

  readonly filteredNodes = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    const all = this.bridge.sceneNodes();
    if (!q) return all;
    return all.filter(
      (n) => n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    );
  });

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

  isSelected(node: StudioSceneNode): boolean {
    return this.bridge.selectedNode()?.name === node.name;
  }

  selectNode(node: StudioSceneNode): void {
    this.bridge.selectObject(node.name);
  }

  async toggleVisibility(node: StudioSceneNode): Promise<void> {
    await this.bridge.manageHierarchy({
      action: 'toggle_visibility',
      target: node.name,
      visible: !node.visible,
    });
  }

  async toggleLock(node: StudioSceneNode): Promise<void> {
    await this.bridge.manageHierarchy({
      action: 'lock',
      target: node.name,
      locked: !node.locked,
    });
  }

  async duplicateNode(node: StudioSceneNode): Promise<void> {
    await this.bridge.manageHierarchy({
      action: 'duplicate',
      target: node.name,
    });
  }

  async deleteNode(node: StudioSceneNode): Promise<void> {
    await this.bridge.manageHierarchy({
      action: 'delete',
      target: node.name,
    });
  }

  async clearCustom(): Promise<void> {
    await this.bridge.manageHierarchy({ action: 'clear_custom' });
  }

  async resetScene(): Promise<void> {
    await this.bridge.manageHierarchy({ action: 'reset_scene' });
  }

  getNodeIcon(node: StudioSceneNode): string {
    const type = (node.type || '').toLowerCase();
    if (type.includes('box')) return '📦';
    if (type.includes('sphere')) return '⚪';
    if (type.includes('cylinder')) return '🥫';
    if (type.includes('cone')) return '🔺';
    if (type.includes('torus_knot')) return '🥨';
    if (type.includes('torus')) return '🍩';
    if (type.includes('plane')) return '▭';
    if (type.includes('pedestal')) return '🏛️';
    if (type.includes('light')) return '💡';
    if (type.includes('text')) return '🔤';
    if (type.includes('group')) return '📁';
    return '🔷';
  }
}
