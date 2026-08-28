import { Component, inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  WebmcpThreeSceneBridge,
  StudioPrimitiveType,
} from '@webmcp/angular';

interface ShelfItem {
  type: StudioPrimitiveType;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-add-shelf',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3.5 rounded-2xl bg-white/95 border border-slate-200 shadow-sm backdrop-blur-xl space-y-2.5 select-none">
      
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="text-sm">✨</span>
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-800">
            Primitive Shelf
          </h3>
        </div>
        <span class="text-[10px] font-mono text-slate-500">1-Click Spawn</span>
      </div>

      <!-- Primitive Buttons Grid -->
      <div class="grid grid-cols-5 gap-1.5">
        @for (item of shelfItems; track item.type) {
          <button
            (click)="createPrimitive(item.type)"
            [title]="item.description"
            class="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-400 hover:shadow-sm text-slate-700 hover:text-cyan-700 transition-all group active:scale-95">
            <span class="text-base group-hover:scale-110 transition-transform">{{ item.icon }}</span>
            <span class="text-[9px] font-semibold tracking-tight mt-1 truncate max-w-full">
              {{ item.label }}
            </span>
          </button>
        }
      </div>

    </div>
  `,
})
export class AddShelfComponent {
  readonly bridge: WebmcpThreeSceneBridge;

  readonly shelfItems: ShelfItem[] = [
    { type: 'box', label: 'Cube', icon: '📦', description: 'Create 3D Box Primitive' },
    { type: 'sphere', label: 'Sphere', icon: '⚪', description: 'Create 3D Sphere Primitive' },
    { type: 'cylinder', label: 'Cylinder', icon: '🥫', description: 'Create 3D Cylinder Primitive' },
    { type: 'cone', label: 'Cone', icon: '🔺', description: 'Create 3D Cone Primitive' },
    { type: 'torus', label: 'Torus', icon: '🍩', description: 'Create 3D Torus Ring' },
    { type: 'torus_knot', label: 'T-Knot', icon: '🥨', description: 'Create 3D Torus Knot' },
    { type: 'plane', label: 'Plane', icon: '▭', description: 'Create 3D Ground Plane' },
    { type: 'pedestal', label: 'Pedestal', icon: '🏛️', description: 'Create Glowing Cyber Pedestal' },
    { type: 'light', label: 'Light', icon: '💡', description: 'Create Point Light Source' },
    { type: 'text', label: '3D Text', icon: '🔤', description: 'Create 3D Text Plate' },
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

  async createPrimitive(type: StudioPrimitiveType): Promise<void> {
    await this.bridge.createObject({
      type,
      position: { x: (Math.random() - 0.5) * 2, y: 1.0, z: (Math.random() - 0.5) * 2 },
    });
  }
}
