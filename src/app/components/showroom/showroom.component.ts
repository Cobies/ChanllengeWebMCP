import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  WebMcpViewportCaptureService,
  WebmcpThreeSceneBridge,
  WebmcpFormRunnerService,
} from '@webmcp/angular';
import { Visualizer3dComponent } from '../visualizer-3d/visualizer-3d.component';
import { CustomizerFormComponent } from '../customizer-form/customizer-form.component';
import { InspectorComponent } from '../inspector/inspector.component';
import { JudgeGuideComponent } from '../judge-guide/judge-guide.component';

@Component({
  selector: 'app-showroom',
  standalone: true,
  imports: [
    CommonModule,
    Visualizer3dComponent,
    CustomizerFormComponent,
    InspectorComponent,
    JudgeGuideComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Hero / Introduction Banner -->
      <div class="glass-panel rounded-2xl p-6 border border-slate-200/80 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1.5 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/80 text-xs font-semibold">
              <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              3D Digital Twin & Autonomous Agent Viewport
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Bidirectional 3D WebMCP Co-Piloting
            </h2>
            <p class="text-sm text-slate-600 leading-relaxed">
              Directly control Three.js 3D WebGL scenes, inspect meshes, capture high-res viewports, and execute reactive form configurations autonomously.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <div class="text-xs text-slate-500">Toolkit Version</div>
              <div class="text-sm font-mono font-bold text-slate-800">&#64;webmcp/angular v1.0.0</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Grid: Left Column (3D Scene + Guide) | Right Column (Customizer Form + Inspector) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left Column (7 cols on lg) -->
        <div class="lg:col-span-7 space-y-6">
          <!-- 3D Interactive Viewport -->
          <app-visualizer-3d></app-visualizer-3d>

          <!-- Devpost Judge Guide Quick Tab -->
          <app-judge-guide></app-judge-guide>
        </div>

        <!-- Right Column (5 cols on lg) -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Vehicle Customizer Reactive Form -->
          <app-customizer-form></app-customizer-form>

          <!-- Live WebMCP Execution & Event Inspector -->
          <app-inspector></app-inspector>
        </div>

      </div>
    </div>
  `,
})
export class ShowroomComponent {
  // Inject services to ensure 3D tools and multimodal capture are active
  readonly viewportCapture = inject(WebMcpViewportCaptureService);
  readonly sceneBridge = inject(WebmcpThreeSceneBridge);
  readonly formRunner = inject(WebmcpFormRunnerService);
}
