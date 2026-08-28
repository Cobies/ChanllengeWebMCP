import { Component, OnInit, OnDestroy, inject, signal, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  WebMcpViewportCaptureService,
  WebmcpThreeSceneBridge,
  WebmcpFormRunnerService,
} from '@webmcp/angular';
import { ViewGuideService } from '../../services/view-guide.service';
import { Visualizer3dComponent } from '../visualizer-3d/visualizer-3d.component';
import { AddShelfComponent } from './add-shelf.component';
import { OutlinerDockComponent } from './outliner-dock.component';
import { StudioInspectorComponent } from './studio-inspector.component';
import { CustomizerFormComponent } from '../customizer-form/customizer-form.component';
import { InspectorComponent } from '../inspector/inspector.component';
import { JudgeGuideComponent } from '../judge-guide/judge-guide.component';

@Component({
  selector: 'app-showroom',
  standalone: true,
  imports: [
    CommonModule,
    Visualizer3dComponent,
    AddShelfComponent,
    OutlinerDockComponent,
    StudioInspectorComponent,
    CustomizerFormComponent,
    InspectorComponent,
    JudgeGuideComponent,
  ],
  template: `
    <div class="w-full h-full relative flex flex-col min-h-0 overflow-hidden">
      <!-- Floating Glassmorphic View Mode Pill (offset to avoid occluding top-right Export/Full buttons) -->
      @if (viewMode() === 'cad_fullscreen') {
        <div class="absolute top-2.5 right-36 z-40 flex items-center bg-white/90 backdrop-blur-md p-0.5 rounded-xl border border-slate-300/80 text-xs font-semibold shadow-md">
          <button
            (click)="viewMode.set('cad_fullscreen')"
            [class]="viewMode() === 'cad_fullscreen' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
            <span>⬡</span>
            <span class="hidden sm:inline">SketchUp Studio</span>
          </button>
          <button
            (click)="viewMode.set('multi_panel')"
            [class]="viewMode() === 'multi_panel' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
            <span>🎛️</span>
            <span class="hidden sm:inline">Multi-Panel</span>
          </button>
          <button
            (click)="openGuide()"
            class="px-2 py-1 rounded-lg text-slate-600 hover:text-cyan-800 hover:bg-slate-100 transition-all flex items-center gap-1 border-l border-slate-200 ml-0.5 cursor-pointer"
            title="Open 3D View Documentation">
            <span>📖</span>
            <span class="hidden md:inline">Guide</span>
          </button>
        </div>
      }

      <div [class]="viewMode() === 'cad_fullscreen' ? 'w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden' : 'w-full h-full space-y-4 p-4 lg:p-6 overflow-y-auto'">
        <!-- Top Layout Mode Switcher Bar (when in multi_panel) -->
        @if (viewMode() === 'multi_panel') {
          <div class="flex items-center justify-between gap-3 px-1">
            <div class="flex items-center gap-2">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
                <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <span>WebMCP CAD Studio</span>
              </div>
              <span class="text-xs text-slate-500 hidden sm:inline">SketchUp-Style Web CAD & Co-Design DCC</span>
            </div>

            <!-- Mode & Guide Toggles -->
            <div class="flex items-center gap-2">
              <button
                (click)="openGuide()"
                class="px-2.5 py-1 rounded-xl bg-white border border-slate-300/80 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Open 3D Showroom Documentation & Tools">
                <span>📖</span>
                <span>View Guide</span>
              </button>

              <div class="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/80 text-xs font-semibold shadow-xs">
                <button
                  (click)="viewMode.set('cad_fullscreen')"
                  [class]="viewMode() === 'cad_fullscreen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                  class="px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <span>⬡</span>
                  <span>SketchUp Studio</span>
                </button>
                <button
                  (click)="viewMode.set('multi_panel')"
                  [class]="viewMode() === 'multi_panel' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                  class="px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <span>🎛️</span>
                  <span>Multi-Panel Inspector</span>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Main Studio Layout: Cad Fullscreen Container or Multi-Panel Grid -->
        <div [class]="viewMode() === 'cad_fullscreen' ? 'w-full h-full flex flex-col flex-1 min-h-0' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'">
          <!-- Left Dock: Add Shelf + Scene Outliner Tree -->
          @if (viewMode() === 'multi_panel') {
            <div class="lg:col-span-4 xl:col-span-3 space-y-4">
              <app-add-shelf></app-add-shelf>
              <app-outliner-dock></app-outliner-dock>
            </div>
          }

          <!-- Center Viewport: Single Persistent 3D Viewport Engine + Rubric Guide -->
          <div [class]="viewMode() === 'cad_fullscreen' ? 'w-full h-full flex-1 flex flex-col min-h-0' : 'lg:col-span-8 xl:col-span-5 space-y-6'">
            <div [class]="viewMode() === 'cad_fullscreen' ? 'w-full h-full flex-1 flex flex-col min-h-0' : 'w-full min-h-[520px] h-[580px] rounded-xl overflow-hidden border border-slate-300/80 shadow-md flex flex-col'">
              <app-visualizer-3d class="w-full h-full flex-1 flex flex-col min-h-0"></app-visualizer-3d>
            </div>
            @if (viewMode() === 'multi_panel') {
              <app-judge-guide></app-judge-guide>
            }
          </div>

          <!-- Right Dock: Inspector + Customizer + Telemetry -->
          @if (viewMode() === 'multi_panel') {
            <div class="lg:col-span-12 xl:col-span-4 space-y-6">
              <app-studio-inspector></app-studio-inspector>
              <app-customizer-form></app-customizer-form>
              <app-inspector></app-inspector>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ShowroomComponent implements OnInit, OnDestroy {
  readonly viewportCapture: WebMcpViewportCaptureService;
  readonly sceneBridge: WebmcpThreeSceneBridge;
  readonly formRunner: WebmcpFormRunnerService;
  readonly guideService: ViewGuideService;

  readonly viewMode = signal<'cad_fullscreen' | 'multi_panel'>('cad_fullscreen');

  constructor(
    @Optional() viewportCapture?: WebMcpViewportCaptureService,
    @Optional() sceneBridge?: WebmcpThreeSceneBridge,
    @Optional() formRunner?: WebmcpFormRunnerService,
    @Optional() guideService?: ViewGuideService
  ) {
    if (viewportCapture) {
      this.viewportCapture = viewportCapture;
    } else {
      try {
        this.viewportCapture = inject(WebMcpViewportCaptureService, { optional: true }) || new WebMcpViewportCaptureService();
      } catch {
        this.viewportCapture = new WebMcpViewportCaptureService();
      }
    }

    if (sceneBridge) {
      this.sceneBridge = sceneBridge;
    } else {
      try {
        this.sceneBridge = inject(WebmcpThreeSceneBridge, { optional: true }) || new WebmcpThreeSceneBridge();
      } catch {
        this.sceneBridge = new WebmcpThreeSceneBridge();
      }
    }

    if (formRunner) {
      this.formRunner = formRunner;
    } else {
      try {
        this.formRunner = inject(WebmcpFormRunnerService, { optional: true }) || new WebmcpFormRunnerService();
      } catch {
        this.formRunner = new WebmcpFormRunnerService();
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
  }

  openGuide(): void {
    this.guideService.openGuide('3d-showroom');
  }

  ngOnInit(): void {
    this.sceneBridge.registerAllTools();
    this.viewportCapture.registerScreenshotTool?.();
  }

  ngOnDestroy(): void {
    this.sceneBridge.unregisterAllTools();
    this.viewportCapture.unregisterScreenshotTool?.();
  }
}
