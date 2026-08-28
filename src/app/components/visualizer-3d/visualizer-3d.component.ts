import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  HostListener,
  PLATFORM_ID,
  Optional,
  Inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import {
  WebmcpThreeSceneBridge,
  StudioTransformGizmoMode,
  StudioShadingMode,
  StudioCameraViewPreset,
  WebMcpViewportCaptureService,
  CadActiveTool,
  CadComponentType,
  CadMaterialPreset,
  CadShapeType,
  StudioSceneNode,
} from '@webmcp/angular';

@Component({
  selector: 'app-visualizer-3d',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      [class]="isFullscreen() ? 'fixed inset-0 z-50 h-screen w-screen' : 'relative w-full h-full flex-1 min-h-0 rounded-none border-0 shadow-none'"
      class="overflow-hidden bg-[#ebe7df] flex flex-col select-none transition-all duration-300 font-sans">


      <!-- =====================================================================
           TOP CAD DESKTOP MENU RIBBON
           ===================================================================== -->
      <header class="h-10 bg-white/95 border-b border-slate-200/90 backdrop-blur-md px-3 flex items-center justify-between gap-2 z-30 select-none flex-shrink-0 text-xs shadow-xs">
        
        <!-- Left: App Brand & Desktop Menu Items -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- SketchUp Style Logo Badge -->
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-br from-rose-500 via-red-600 to-amber-600 text-white font-black tracking-wider text-[11px] shadow-xs">
            <span class="text-sm leading-none">⬡</span>
            <span>SketchUp CAD</span>
          </div>

          <!-- Menu Dropdown Buttons -->
          <nav class="hidden md:flex items-center gap-0.5 text-slate-700 font-medium">
            <!-- File Menu Dropdown Trigger -->
            <div class="relative group">
              <button class="px-2 py-1 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors">File</button>
              <div class="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-slate-700">
                <button (click)="newScene()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>New Model</span><span class="text-slate-400 font-mono text-[10px]">Ctrl+N</span>
                </button>
                <button (click)="captureSnapshot()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Take Snapshot</span><span class="text-slate-400 font-mono text-[10px]">📸</span>
                </button>
                <button (click)="exportGlb()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between font-semibold text-cyan-700">
                  <span>Export GLB</span><span class="text-slate-400 font-mono text-[10px]">💾</span>
                </button>
                <div class="h-[1px] bg-slate-100 my-1"></div>
                <button (click)="clearScene()" class="px-3 py-1.5 text-left rounded-lg hover:bg-rose-50 text-rose-600 flex items-center justify-between">
                  <span>Clear All</span><span class="text-slate-400 font-mono text-[10px]">Del</span>
                </button>
              </div>
            </div>

            <!-- Edit Menu Dropdown Trigger -->
            <div class="relative group">
              <button class="px-2 py-1 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors">Edit</button>
              <div class="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-slate-700">
                <button (click)="undo()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Undo</span><span class="text-slate-400 font-mono text-[10px]">Ctrl+Z</span>
                </button>
                <button (click)="redo()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Redo</span><span class="text-slate-400 font-mono text-[10px]">Ctrl+Y</span>
                </button>
                <div class="h-[1px] bg-slate-100 my-1"></div>
                <button (click)="deleteSelected()" class="px-3 py-1.5 text-left rounded-lg hover:bg-rose-50 text-rose-600 flex items-center justify-between">
                  <span>Delete</span><span class="text-slate-400 font-mono text-[10px]">Del</span>
                </button>
              </div>
            </div>

            <!-- View Menu -->
            <div class="relative group">
              <button class="px-2 py-1 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors">View</button>
              <div class="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-slate-700">
                <button (click)="setCameraPreset('perspective')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100">Perspective</button>
                <button (click)="setCameraPreset('top')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100">Top View (Plan)</button>
                <button (click)="setCameraPreset('front')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100">Front View</button>
                <button (click)="setCameraPreset('side')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100">Side View</button>
                <button (click)="setCameraPreset('iso')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100">Isometric</button>
                <div class="h-[1px] bg-slate-100 my-1"></div>
                <button (click)="toggleAxes()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>3-Axis RGB Lines</span><span>{{ showAxes() ? '✓' : '' }}</span>
                </button>
                <button (click)="toggleGrid()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Ground Grid</span><span>{{ showGrid() ? '✓' : '' }}</span>
                </button>
                <button (click)="toggleShadows()" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Sun Shadows</span><span>{{ showShadows() ? '✓' : '' }}</span>
                </button>
              </div>
            </div>

            <!-- Draw Menu -->
            <div class="relative group">
              <button class="px-2 py-1 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors">Draw</button>
              <div class="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-slate-700">
                <button (click)="setActiveCadTool('line')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Line</span><span class="text-slate-400 font-mono text-[10px]">L</span>
                </button>
                <button (click)="setActiveCadTool('rectangle')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Rectangle</span><span class="text-slate-400 font-mono text-[10px]">R</span>
                </button>
                <button (click)="setActiveCadTool('circle')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Circle</span><span class="text-slate-400 font-mono text-[10px]">C</span>
                </button>
              </div>
            </div>

            <!-- Tools Menu -->
            <div class="relative group">
              <button class="px-2 py-1 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors">Tools</button>
              <div class="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-slate-700">
                <button (click)="setActiveCadTool('push_pull')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between font-semibold text-rose-600">
                  <span>Push / Pull</span><span class="text-slate-400 font-mono text-[10px]">P</span>
                </button>
                <button (click)="setActiveCadTool('move')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Move</span><span class="text-slate-400 font-mono text-[10px]">M</span>
                </button>
                <button (click)="setActiveCadTool('rotate')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Rotate</span><span class="text-slate-400 font-mono text-[10px]">Q</span>
                </button>
                <button (click)="setActiveCadTool('scale')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Scale</span><span class="text-slate-400 font-mono text-[10px]">S</span>
                </button>
                <button (click)="setActiveCadTool('tape_measure')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Tape Measure</span><span class="text-slate-400 font-mono text-[10px]">T</span>
                </button>
                <button (click)="setActiveCadTool('paint_bucket')" class="px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between">
                  <span>Paint Bucket</span><span class="text-slate-400 font-mono text-[10px]">B</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        <!-- Center: Current Model / Project Title -->
        <div class="hidden lg:flex items-center gap-2 font-mono text-slate-600 text-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="font-bold text-slate-800">Untitled Architectural Studio.skp</span>
          <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">WebMCP DCC v2.5</span>
        </div>

        <!-- Right: Quick Action Controls & Fullscreen -->
        <div class="flex items-center gap-1.5">
          <!-- Camera Presets Quick Switch -->
          <div class="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              (click)="setCameraPreset('perspective')"
              [class]="currentCameraPreset() === 'perspective' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'"
              class="px-2 py-0.5 rounded text-[11px] font-mono transition-all">
              Persp
            </button>
            <button
              (click)="setCameraPreset('top')"
              [class]="currentCameraPreset() === 'top' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'"
              class="px-1.5 py-0.5 rounded text-[11px] font-mono transition-all">
              Top
            </button>
            <button
              (click)="setCameraPreset('front')"
              [class]="currentCameraPreset() === 'front' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'"
              class="px-1.5 py-0.5 rounded text-[11px] font-mono transition-all">
              Front
            </button>
            <button
              (click)="setCameraPreset('iso')"
              [class]="currentCameraPreset() === 'iso' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'"
              class="px-1.5 py-0.5 rounded text-[11px] font-mono transition-all">
              Iso
            </button>
          </div>

          <!-- Shading Quick Switch -->
          <div class="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              (click)="setShadingMode('pbr')"
              [class]="currentShadingMode() === 'pbr' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'"
              class="px-2 py-0.5 rounded text-[11px] transition-all">
              PBR
            </button>
            <button
              (click)="setShadingMode('wireframe')"
              [class]="currentShadingMode() === 'wireframe' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'"
              class="px-2 py-0.5 rounded text-[11px] transition-all">
              Wire
            </button>
            <button
              (click)="setShadingMode('solid')"
              [class]="currentShadingMode() === 'solid' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'"
              class="px-2 py-0.5 rounded text-[11px] transition-all">
              Solid
            </button>
          </div>

          <!-- Snapshot -->
          <button
            (click)="captureSnapshot()"
            title="Snapshot Viewport [Multimodal Vision]"
            class="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold flex items-center gap-1 transition-all">
            <span>📸</span>
            <span class="hidden xl:inline">Snap</span>
          </button>

          <!-- Export GLB -->
          <button
            (click)="exportGlb()"
            title="Export 3D Scene to GLB"
            class="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1">
            <span>💾</span>
            <span class="hidden md:inline">Export</span>
          </button>

          <!-- Fullscreen Toggle -->
          <button
            (click)="toggleFullscreen()"
            [title]="isFullscreen() ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'"
            class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors">
            @if (isFullscreen()) {
              <span class="font-bold text-xs">⤓ Exit</span>
            } @else {
              <span class="font-bold text-xs">⛶ Full</span>
            }
          </button>
        </div>
      </header>

      <!-- =====================================================================
           MAIN VIEWPORT CONTAINER WITH FLOATING CAD OVERLAYS
           ===================================================================== -->
      <div class="relative flex-1 w-full min-h-0 overflow-hidden flex">

        <!-- ===================================================================
             LEFT FLOATING SKETCHUP TOOL PALETTE
             =================================================================== -->
        <aside class="absolute left-3 top-3 bottom-3 z-20 flex flex-col justify-between pointer-events-none">
          <div class="p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-300 shadow-xl pointer-events-auto flex flex-col gap-1 w-11 sm:w-12 items-center">
            
            <!-- Tool 1: Select (Space) -->
            <button
              (click)="setActiveCadTool('select')"
              [class]="activeCadTool() === 'select' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Select (Space)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all group relative">
              <span>↖</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Sel</span>
            </button>

            <div class="w-6 h-[1px] bg-slate-200 my-0.5"></div>

            <!-- Tool 2: Line (L) -->
            <button
              (click)="setActiveCadTool('line')"
              [class]="activeCadTool() === 'line' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Line Tool (L)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all group relative">
              <span>✏️</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Line</span>
            </button>

            <!-- Tool 3: Rectangle (R) -->
            <button
              (click)="setActiveCadTool('rectangle')"
              [class]="activeCadTool() === 'rectangle' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Rectangle Tool (R)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all group relative">
              <span>▭</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Rect</span>
            </button>

            <!-- Tool 4: Circle (C) -->
            <button
              (click)="setActiveCadTool('circle')"
              [class]="activeCadTool() === 'circle' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Circle Tool (C)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all group relative">
              <span>◯</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Circ</span>
            </button>

            <!-- Tool 5: Push-Pull (P) -->
            <button
              (click)="setActiveCadTool('push_pull')"
              [class]="activeCadTool() === 'push_pull' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300' : 'text-amber-700 hover:bg-amber-50'"
              title="Push / Pull Extrude (P)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-black transition-all group relative">
              <span>⮉</span>
              <span class="text-[8px] leading-none font-mono opacity-80">Push</span>
            </button>

            <div class="w-6 h-[1px] bg-slate-200 my-0.5"></div>

            <!-- Tool 6: Move (M / W) -->
            <button
              (click)="setActiveCadTool('move')"
              [class]="activeCadTool() === 'move' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Move (M / W)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all">
              <span>✥</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Move</span>
            </button>

            <!-- Tool 7: Rotate (Q / E) -->
            <button
              (click)="setActiveCadTool('rotate')"
              [class]="activeCadTool() === 'rotate' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Rotate (Q / E)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all">
              <span>↻</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Rot</span>
            </button>

            <!-- Tool 8: Scale (S / R) -->
            <button
              (click)="setActiveCadTool('scale')"
              [class]="activeCadTool() === 'scale' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Scale (S)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all">
              <span>⤢</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Scale</span>
            </button>

            <div class="w-6 h-[1px] bg-slate-200 my-0.5"></div>

            <!-- Tool 9: Tape Measure (T) -->
            <button
              (click)="setActiveCadTool('tape_measure')"
              [class]="activeCadTool() === 'tape_measure' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-700 hover:bg-emerald-50'"
              title="Tape Measure & Area (T)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all">
              <span>📐</span>
              <span class="text-[8px] leading-none font-mono opacity-80">Tape</span>
            </button>

            <!-- Tool 10: Paint Bucket (B) -->
            <button
              (click)="setActiveCadTool('paint_bucket')"
              [class]="activeCadTool() === 'paint_bucket' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-700 hover:bg-indigo-50'"
              title="Paint Bucket Materials (B)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all">
              <span>🎨</span>
              <span class="text-[8px] leading-none font-mono opacity-80">Paint</span>
            </button>

            <!-- Tool 11: Orbit (O) -->
            <button
              (click)="setActiveCadTool('orbit')"
              [class]="activeCadTool() === 'orbit' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'"
              title="Orbit Camera (O)"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all">
              <span>🌐</span>
              <span class="text-[8px] leading-none font-mono opacity-60">Orbit</span>
            </button>
          </div>
        </aside>

        <!-- ===================================================================
             3D WEBGL CAD CANVAS
             =================================================================== -->
        <canvas
          #viewportCanvas
          tabindex="0"
          (mousedown)="onCanvasMouseDown($event)"
          (mouseup)="onCanvasMouseUp($event)"
          (mousemove)="onCanvasMouseMove($event)"
          (click)="onCanvasClick($event)"
          class="w-full h-full flex-1 block cursor-crosshair outline-none"></canvas>

        <!-- ===================================================================
             RIGHT FLOATING COLLAPSIBLE CAD TRAYS DOCK
             =================================================================== -->
        <aside class="absolute right-3 top-3 bottom-3 z-20 flex flex-col pointer-events-none max-w-[340px] w-[calc(100vw-5rem)]">
          <!-- Tray Tab Strip -->
          <div class="flex items-center gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-300 shadow-xl pointer-events-auto self-end overflow-x-auto max-w-full">
            <button
              (click)="toggleTrayTab('entity')"
              [class]="activeTrayTab() === 'entity' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
              class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all">
              <span>ℹ️</span>
              <span class="hidden sm:inline">Entity</span>
            </button>
            <button
              (click)="toggleTrayTab('materials')"
              [class]="activeTrayTab() === 'materials' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
              class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all">
              <span>🧱</span>
              <span class="hidden sm:inline">Materials</span>
            </button>
            <button
              (click)="toggleTrayTab('components')"
              [class]="activeTrayTab() === 'components' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
              class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all">
              <span>🏛️</span>
              <span class="hidden sm:inline">Components</span>
            </button>
            <button
              (click)="toggleTrayTab('outliner')"
              [class]="activeTrayTab() === 'outliner' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
              class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all">
              <span>🌲</span>
              <span class="hidden sm:inline">Outliner</span>
            </button>
            <button
              (click)="toggleTrayTab('styles')"
              [class]="activeTrayTab() === 'styles' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
              class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all">
              <span>⚙️</span>
              <span class="hidden sm:inline">Styles</span>
            </button>
          </div>

          <!-- Tray Content Panel (when expanded) -->
          @if (activeTrayTab(); as tab) {
            <div class="mt-2 flex-1 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-300 shadow-2xl p-3.5 pointer-events-auto overflow-y-auto max-h-[calc(100%-3.5rem)] flex flex-col text-xs text-slate-700">
              
              <!-- Header -->
              <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span class="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>{{ getTrayTitle(tab) }}</span>
                </span>
                <button (click)="activeTrayTab.set(null)" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xs">✕</button>
              </div>

              <!-- Tab 1: Entity Info -->
              @if (tab === 'entity') {
                <div class="space-y-3">
                  @if (bridge.selectedNode(); as sel) {
                    <div class="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-200/80 space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-cyan-900 text-sm truncate">{{ sel.name }}</span>
                        <span class="px-2 py-0.5 rounded-full bg-cyan-200 text-cyan-900 text-[10px] font-mono uppercase">{{ sel.type }}</span>
                      </div>
                      <div class="text-[11px] text-cyan-800 font-mono">
                        Pos: ({{ sel.position.x }}m, {{ sel.position.y }}m, {{ sel.position.z }}m)
                      </div>
                    </div>

                    <!-- Quick Operations -->
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        (click)="quickPushPullSelected(3.0)"
                        class="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold flex items-center justify-center gap-1.5 transition-all">
                        <span>⮉</span>
                        <span>Push 3.0m</span>
                      </button>
                      <button
                        (click)="quickPushPullSelected(0.2)"
                        class="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold flex items-center justify-center gap-1.5 transition-all">
                        <span>⮉</span>
                        <span>Slab 0.2m</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <button
                        (click)="deleteSelected()"
                        class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold flex items-center justify-center gap-1 transition-all">
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                      <button
                        (click)="measureSelected()"
                        class="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold flex items-center justify-center gap-1 transition-all">
                        <span>📐</span>
                        <span>Measure Area</span>
                      </button>
                    </div>
                  } @else {
                    <div class="py-8 text-center text-slate-400 space-y-1.5">
                      <div class="text-2xl">↖</div>
                      <p class="font-medium">No Entity Selected</p>
                      <p class="text-[11px] text-slate-400">Click any mesh in the scene or pick from the Outliner tray.</p>
                    </div>
                  }
                </div>
              }

              <!-- Tab 2: Materials Swatch Tray -->
              @if (tab === 'materials') {
                <div class="space-y-3">
                  <p class="text-[11px] text-slate-500">Pick a preset to apply to selection or click with Paint Bucket [B]:</p>
                  <div class="grid grid-cols-2 gap-2">
                    @for (mat of materialPresets; track mat.id) {
                      <button
                        (click)="applyPresetMaterial(mat.id)"
                        [class]="selectedMaterialPreset() === mat.id ? 'ring-2 ring-cyan-500 bg-cyan-50/50' : 'bg-slate-50 hover:bg-slate-100'"
                        class="p-2 rounded-xl border border-slate-200 text-left flex items-center gap-2 transition-all">
                        <span class="w-5 h-5 rounded-lg flex-shrink-0 shadow-xs border border-slate-300" [style.background-color]="mat.color"></span>
                        <div class="min-w-0">
                          <div class="font-semibold text-slate-800 text-[11px] truncate">{{ mat.name }}</div>
                          <div class="text-[9px] text-slate-400 font-mono capitalize">{{ mat.type }}</div>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Tab 3: Components Asset Library -->
              @if (tab === 'components') {
                <div class="space-y-3">
                  <p class="text-[11px] text-slate-500">Click to place architectural assets at the cursor / origin:</p>
                  <div class="grid grid-cols-2 gap-2">
                    @for (comp of componentLibrary; track comp.type) {
                      <button
                        (click)="placePresetComponent(comp.type)"
                        class="p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 text-left flex items-center gap-2 transition-all group">
                        <span class="text-lg">{{ comp.icon }}</span>
                        <div class="min-w-0">
                          <div class="font-bold text-slate-800 group-hover:text-cyan-800 text-[11px] truncate">{{ comp.name }}</div>
                          <div class="text-[9px] text-slate-400 font-mono">{{ comp.category }}</div>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Tab 4: Scene Outliner Tree -->
              @if (tab === 'outliner') {
                <div class="space-y-1.5">
                  @for (node of bridge.sceneNodes(); track node.id) {
                    <div
                      (click)="bridge.selectObject(node.name)"
                      [class]="bridge.selectedNode()?.name === node.name ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold' : 'hover:bg-slate-50 border-transparent text-slate-700'"
                      class="p-1.5 px-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors text-[11px]">
                      <div class="flex items-center gap-2 truncate">
                        <span>{{ getNodeIcon(node.type) }}</span>
                        <span class="truncate">{{ node.name }}</span>
                      </div>
                      <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{{ node.type }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Tab 5: Styles & Viewport Config -->
              @if (tab === 'styles') {
                <div class="space-y-3">
                  <div class="space-y-1">
                    <label class="font-bold text-slate-700 text-[11px]">Coordinate Guides</label>
                    <div class="grid grid-cols-2 gap-1.5">
                      <button (click)="toggleAxes()" class="px-2 py-1.5 rounded-lg border text-left text-xs" [class]="showAxes() ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-semibold' : 'bg-slate-50 text-slate-500'">
                        {{ showAxes() ? '✓ Axes Active' : '✕ Axes Hidden' }}
                      </button>
                      <button (click)="toggleGrid()" class="px-2 py-1.5 rounded-lg border text-left text-xs" [class]="showGrid() ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-semibold' : 'bg-slate-50 text-slate-500'">
                        {{ showGrid() ? '✓ Ground Grid' : '✕ Grid Hidden' }}
                      </button>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="font-bold text-slate-700 text-[11px]">Shadows & Sun Light</label>
                    <button (click)="toggleShadows()" class="w-full px-2 py-1.5 rounded-lg border text-left text-xs" [class]="showShadows() ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold' : 'bg-slate-50 text-slate-500'">
                      {{ showShadows() ? '✓ Sun Soft Shadows Enabled' : '✕ Shadows Disabled' }}
                    </button>
                  </div>
                </div>
              }

            </div>
          }
        </aside>

      </div>

      <!-- =====================================================================
           BOTTOM SKETCHUP MEASUREMENTS & STATUS HUD
           ===================================================================== -->
      <footer class="h-10 bg-white/95 border-t border-slate-200/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600 select-none z-30 flex-shrink-0 shadow-xs">
        
        <!-- Left: Tool Guidance Tip -->
        <div class="flex items-center gap-2 min-w-0 flex-1 truncate">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-bold flex-shrink-0">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span class="uppercase tracking-wider text-[10px]">{{ activeCadTool() }}</span>
          </span>
          <span class="text-slate-600 truncate hidden md:inline font-sans text-xs">{{ activeToolHint() }}</span>
        </div>

        <!-- Center: Snapping Pill & Coordinates -->
        <div class="hidden lg:flex items-center gap-3 text-slate-500">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
            <span class="text-cyan-600">●</span>
            <span>{{ snapTarget() }}</span>
          </span>
          <span class="font-mono text-[11px] text-slate-700">
            X: <strong class="text-slate-900">{{ cursorCoords().x.toFixed(2) }}m</strong>
            Y: <strong class="text-slate-900">{{ cursorCoords().y.toFixed(2) }}m</strong>
            Z: <strong class="text-slate-900">{{ cursorCoords().z.toFixed(2) }}m</strong>
          </span>
        </div>

        <!-- Right: Measurements VCB Input Box & Telemetry -->
        <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          <!-- Measurements VCB Box -->
          <div class="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-lg px-2 py-0.5 focus-within:border-cyan-500 focus-within:bg-white shadow-xs">
            <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Measurements:</label>
            <input
              type="text"
              [(ngModel)]="vcbInputText"
              (keydown.enter)="commitVcbInput()"
              placeholder="e.g. 6.0, 4.0"
              class="w-24 sm:w-28 bg-transparent text-slate-900 font-mono text-xs focus:outline-none placeholder:text-slate-400 font-bold" />
            <button
              (click)="commitVcbInput()"
              class="px-1.5 py-0.2 text-[9px] rounded bg-slate-200 hover:bg-cyan-600 hover:text-white font-bold transition-colors">
              ⏎
            </button>
          </div>

          <!-- Scene Poly Count / FPS -->
          <div class="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
            <span>▲ {{ bridge.sceneMetrics().triangles | number }}</span>
            <span>•</span>
            <span class="font-bold text-emerald-600">{{ fps() }} FPS</span>
          </div>

        </div>

      </footer>

    </div>
  `,
})
export class Visualizer3dComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewportCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly bridge: WebmcpThreeSceneBridge;
  private readonly captureService?: WebMcpViewportCaptureService;
  private readonly platformId: Object;

  // Viewport State Signals
  readonly currentGizmoMode = signal<StudioTransformGizmoMode>('translate');
  readonly currentShadingMode = signal<StudioShadingMode>('pbr');
  readonly currentCameraPreset = signal<StudioCameraViewPreset>('perspective');
  readonly showGrid = signal<boolean>(true);
  readonly showShadows = signal<boolean>(true);
  readonly showAxes = signal<boolean>(true);
  readonly isFullscreen = signal<boolean>(false);
  readonly fps = signal<number>(60);

  // CAD Tool & UI State
  readonly activeCadTool = signal<CadActiveTool>('select');
  readonly activeTrayTab = signal<'entity' | 'materials' | 'components' | 'outliner' | 'styles' | null>('entity');
  readonly selectedMaterialPreset = signal<CadMaterialPreset>('wood_oak');
  readonly cursorCoords = signal<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  readonly snapTarget = signal<string>('Ground Plane [XZ]');
  readonly lastCommittedDimension = signal<string>('');

  vcbInputText = '';

  // Dynamic active tool guidance hint
  readonly activeToolHint = computed(() => {
    switch (this.activeCadTool()) {
      case 'select':
        return 'Click mesh to select. Press Space to switch to Select tool anytime.';
      case 'line':
        return 'Line Tool [L]: Click ground/face to start line, click again to finish or type length + Enter.';
      case 'rectangle':
        return 'Rectangle Tool [R]: Click first corner, drag, and click opposite corner or type dimensions (e.g. 6.0, 4.0).';
      case 'circle':
        return 'Circle Tool [C]: Click center point, drag radius, click to commit or type radius in Measurements.';
      case 'push_pull':
        return 'Push-Pull Tool [P]: Click face to extrude into 3D solid. Type distance + Enter in Measurements.';
      case 'tape_measure':
        return 'Tape Measure [T]: Click entity to inspect Euclidean distance, bounding box, and floor area.';
      case 'paint_bucket':
        return 'Paint Bucket [B]: Click any object to apply active material preset.';
      case 'move':
        return 'Move Tool [M]: Drag gizmo handles to translate object in 3D space.';
      case 'rotate':
        return 'Rotate Tool [Q]: Drag circular arc gizmo to rotate.';
      case 'scale':
        return 'Scale Tool [S]: Drag bounding handles to scale.';
      default:
        return 'SketchUp CAD Studio ready. Choose a tool or ask AI Copilot.';
    }
  });

  // Architectural Material Presets for Tray
  readonly materialPresets: { id: CadMaterialPreset; name: string; type: string; color: string }[] = [
    { id: 'concrete', name: 'Polished Concrete', type: 'Stone', color: '#94a3b8' },
    { id: 'wood_oak', name: 'Natural Oak Wood', type: 'Timber', color: '#a2703f' },
    { id: 'brick_red', name: 'Terracotta Brick', type: 'Masonry', color: '#b91c1c' },
    { id: 'glass_frosted', name: 'Architectural Glass', type: 'Glass', color: '#e0f2fe' },
    { id: 'marble_carrara', name: 'Carrara Marble', type: 'Stone', color: '#f8fafc' },
    { id: 'steel_brushed', name: 'Brushed Steel', type: 'Metal', color: '#64748b' },
    { id: 'tile_subway', name: 'White Ceramic Tile', type: 'Ceramic', color: '#ffffff' },
    { id: 'gold', name: 'Polished Brass / Gold', type: 'Metal', color: '#ffd700' },
    { id: 'neon_cyan', name: 'Cyber Neon Emissive', type: 'Light', color: '#00f0ff' },
    { id: 'matte_dark', name: 'Matte Charcoal Slate', type: 'Composite', color: '#1e293b' },
    { id: 'plaster_white', name: 'Smooth White Plaster', type: 'Finish', color: '#f1f5f9' },
  ];

  // Architectural Component Library for Tray
  readonly componentLibrary: { type: CadComponentType; name: string; category: string; icon: string }[] = [
    { type: 'desk', name: 'Executive Desk', category: 'Furniture', icon: '🪵' },
    { type: 'chair', name: 'Ergonomic Chair', category: 'Furniture', icon: '🪑' },
    { type: 'sofa', name: 'Modern Sofa', category: 'Living', icon: '🛋️' },
    { type: 'door', name: 'Entrance Door', category: 'Structure', icon: '🚪' },
    { type: 'window', name: 'Glass Window', category: 'Structure', icon: '🪟' },
    { type: 'column', name: 'Marble Column', category: 'Structure', icon: '🏛️' },
    { type: 'pedestal', name: 'Display Plinth', category: 'Display', icon: '⚪' },
    { type: 'staircase', name: 'Stair Flight', category: 'Structure', icon: '🪜' },
    { type: 'tree', name: 'Landscape Tree', category: 'Nature', icon: '🌳' },
    { type: 'cyber_car', name: 'Concept Vehicle', category: 'Transport', icon: '🏎️' },
    { type: 'lamp', name: 'Standing Floor Lamp', category: 'Lighting', icon: '💡' },
  ];

  // Three.js Core Objects
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private orbitControls!: OrbitControls;
  private transformControls!: TransformControls;
  private selectionBox!: THREE.BoxHelper;
  private hoverBoxHelper!: THREE.BoxHelper;
  private gridHelper!: THREE.GridHelper;
  private axesGroup!: THREE.Group;
  private meshes = new Map<string, THREE.Mesh | THREE.Object3D>();
  private animFrameId: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Pointer drag vs click tracking
  private pointerDownPos = { x: 0, y: 0 };
  private isPointerDragging = false;

  // Raycasting & Drawing Preview State
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private drawingStartPoint: THREE.Vector3 | null = null;
  private previewMesh: THREE.Object3D | null = null;

  // FPS Calculation
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private fpsUpdateTime = performance.now();

  constructor(
    @Optional() bridge?: WebmcpThreeSceneBridge,
    @Optional() @Inject(PLATFORM_ID) platformId?: Object,
    @Optional() captureService?: WebMcpViewportCaptureService
  ) {
    if (bridge) {
      this.bridge = bridge;
    } else {
      try {
        this.bridge = inject(WebmcpThreeSceneBridge, { optional: true }) || new WebmcpThreeSceneBridge();
      } catch {
        this.bridge = new WebmcpThreeSceneBridge();
      }
    }

    if (platformId) {
      this.platformId = platformId;
    } else {
      try {
        this.platformId = inject(PLATFORM_ID, { optional: true }) || 'browser';
      } catch {
        this.platformId = 'browser';
      }
    }

    if (captureService) {
      this.captureService = captureService;
    } else {
      try {
        this.captureService = inject(WebMcpViewportCaptureService, { optional: true }) || undefined;
      } catch {
        this.captureService = undefined;
      }
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.initThree();
    this.buildSketchUpEnvironment();
    this.bindToBridge();
    this.setupTransformGizmo();
    this.setupInteractivity();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.hoverBoxHelper) {
      this.hoverBoxHelper.dispose?.();
      this.scene?.remove(this.hoverBoxHelper);
    }
    if (this.selectionBox) {
      this.selectionBox.dispose?.();
      this.scene?.remove(this.selectionBox);
    }
    this.clearDrawingPreview();
    this.transformControls?.dispose();
    this.orbitControls?.dispose();
    this.bridge?.unbindScene();
    this.renderer?.dispose();
  }

  // =========================================================================
  // Viewport Setup & Three.js Initializer
  // =========================================================================

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement || canvas;
    const width = container.clientWidth || canvas.clientWidth || 1000;
    const height = container.clientHeight || canvas.clientHeight || 700;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xebe7df); // SketchUp Warm Horizon
    this.scene.fog = new THREE.FogExp2(0xebe7df, 0.015);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    this.camera.position.set(7, 4.5, 9);
    this.camera.lookAt(0, 0, 0);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orbit Controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.005;
    this.orbitControls.minDistance = 1.0;
    this.orbitControls.maxDistance = 100;

    // Lighting (SketchUp Sun Light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    dirLight.position.set(12, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.6);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);

    // 1. SketchUp Ground Grid
    this.gridHelper = new THREE.GridHelper(40, 40, 0x0284c7, 0xd4cdc3);
    this.gridHelper.position.y = 0;
    this.scene.add(this.gridHelper);

    // 2. SketchUp 3-Axis RGB Coordinates (Red = X, Green = Z depth, Blue = Y elevation)
    this.axesGroup = new THREE.Group();
    this.axesGroup.name = 'sketchup_3axis_guides';

    // Red Line: X axis (-50m to +50m)
    const xPoints = [new THREE.Vector3(-50, 0.005, 0), new THREE.Vector3(50, 0.005, 0)];
    const xGeo = new THREE.BufferGeometry().setFromPoints(xPoints);
    const xLine = new THREE.Line(xGeo, new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 }));
    this.axesGroup.add(xLine);

    // Green Line: Z axis (-50m to +50m, ground depth in Three.js)
    const zPoints = [new THREE.Vector3(0, 0.005, -50), new THREE.Vector3(0, 0.005, 50)];
    const zGeo = new THREE.BufferGeometry().setFromPoints(zPoints);
    const zLine = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 }));
    this.axesGroup.add(zLine);

    // Blue Line: Y axis (0 to 30m, vertical height)
    const yPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 30, 0)];
    const yGeo = new THREE.BufferGeometry().setFromPoints(yPoints);
    const yLine = new THREE.Line(yGeo, new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 }));
    this.axesGroup.add(yLine);

    this.scene.add(this.axesGroup);

    // Selection Bounding Box Indicator
    this.selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x0284c7);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    // Hover Highlight Outline (Cyan 0x38bdf8)
    this.hoverBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0x38bdf8);
    this.hoverBoxHelper.visible = false;
    this.scene.add(this.hoverBoxHelper);
  }

  private setupTransformGizmo(): void {
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.size = 0.75;
    const mode = this.currentGizmoMode();
    if (mode !== 'none') {
      this.transformControls.setMode(mode);
    }

    this.transformControls.addEventListener('dragging-changed', (event: any) => {
      this.orbitControls.enabled = !event.value;
    });

    this.transformControls.addEventListener('change', () => {
      const target = this.transformControls.object;
      if (target) {
        this.selectionBox.setFromObject(target);
        this.bridge.refreshSceneGraph();
      }
    });

    this.scene.add(
      this.transformControls.getHelper
        ? this.transformControls.getHelper()
        : (this.transformControls as any)
    );
  }

  private buildSketchUpEnvironment(): void {
    // Initial Showcase Scene: Modern Architecture Pavillion Slab with Pillars
    const group = new THREE.Group();
    group.name = 'starter_pavillion_slab';
    group.userData['isCustom'] = true;

    // 1. Concrete floor slab (8m x 6m x 0.2m)
    const slabGeo = new THREE.BoxGeometry(8, 0.2, 6);
    const slabMat = this.bridge.createPresetMaterial('concrete');
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.name = 'Pavillion_Slab';
    slab.position.y = 0.1;
    slab.receiveShadow = true;
    slab.userData['isCustom'] = true;
    group.add(slab);
    this.meshes.set('Pavillion_Slab', slab);

    // 2. Four Marble Columns
    const colMat = this.bridge.createPresetMaterial('marble_carrara');
    const colPositions = [
      [-3.5, 1.6, -2.5],
      [3.5, 1.6, -2.5],
      [-3.5, 1.6, 2.5],
      [3.5, 1.6, 2.5],
    ];
    colPositions.forEach(([cx, cy, cz], idx) => {
      const colName = `Column_0${idx + 1}`;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 3.0, 24), colMat);
      col.name = colName;
      col.position.set(cx, cy, cz);
      col.castShadow = true;
      col.receiveShadow = true;
      col.userData['isCustom'] = true;
      group.add(col);
      this.meshes.set(colName, col);
    });

    this.scene.add(group);
    this.meshes.set('starter_pavillion_slab', group);
  }

  private bindToBridge(): void {
    this.bridge.bindScene({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      meshes: this.meshes,
      selectionBox: this.selectionBox,
      gridHelper: this.gridHelper,
      transformControls: this.transformControls,
      orbitControls: this.orbitControls,
      defaultCameraState: {
        position: { x: 7, y: 4.5, z: 9 },
        target: { x: 0, y: 0, z: 0 },
      },
      onViewportChange: (config) => {
        if (config.gizmoMode !== undefined) this.currentGizmoMode.set(config.gizmoMode);
        if (config.shadingMode !== undefined) this.currentShadingMode.set(config.shadingMode);
        if (config.cameraView !== undefined) this.currentCameraPreset.set(config.cameraView);
        if (config.showGrid !== undefined) this.showGrid.set(config.showGrid);
        if (config.showShadows !== undefined) this.showShadows.set(config.showShadows);
      },
    });
  }

  private setupInteractivity(): void {
    const canvas = this.canvasRef.nativeElement;

    // Window & Container Resize Handler
    this.resizeHandler = () => {
      if (!canvas || !this.camera || !this.renderer) return;
      const container = canvas.parentElement || canvas;
      const width = container.clientWidth || canvas.clientWidth;
      const height = container.clientHeight || canvas.clientHeight;
      if (width === 0 || height === 0) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.resizeHandler);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeHandler?.();
      });
      const container = canvas.parentElement || canvas;
      this.resizeObserver.observe(container);
    }
  }

  // =========================================================================
  // Canvas Mouse & CAD Drawing Events
  // =========================================================================

  private resolveRaycastedMesh(): THREE.Object3D | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.meshes.values()), true);
    if (intersects.length > 0) {
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && !this.meshes.has(hitObj.name) && hitObj.parent && hitObj.parent !== this.scene) {
        hitObj = hitObj.parent;
      }
      if (hitObj && this.meshes.has(hitObj.name)) {
        return hitObj;
      }
    }
    return null;
  }

  onCanvasMouseDown(e: MouseEvent): void {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.isPointerDragging = false;
  }

  onCanvasMouseUp(e: MouseEvent): void {
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (dist > 5) {
      this.isPointerDragging = true;
    }
  }

  onCanvasMouseMove(e: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    // 1. Raycast meshes for hover outline highlighting & snapping indicator
    const meshHits = this.raycaster.intersectObjects(Array.from(this.meshes.values()), true);
    if (meshHits.length > 0) {
      const hit = meshHits[0];
      let hitObj: THREE.Object3D | null = hit.object;
      while (hitObj && !this.meshes.has(hitObj.name) && hitObj.parent && hitObj.parent !== this.scene) {
        hitObj = hitObj.parent;
      }
      const selected = this.bridge.getSelectedObject();
      if (hitObj && hitObj !== selected && this.hoverBoxHelper) {
        this.hoverBoxHelper.setFromObject(hitObj);
        this.hoverBoxHelper.visible = true;
      } else if (this.hoverBoxHelper) {
        this.hoverBoxHelper.visible = false;
      }
      this.snapTarget.set(`On Face: ${(hitObj && hitObj.name) || hit.object.name || 'Geometry'}`);
    } else {
      if (this.hoverBoxHelper) {
        this.hoverBoxHelper.visible = false;
      }
      this.snapTarget.set('Ground Plane [XZ]');
    }

    // 2. Raycast ground plane for coordinates and rubber-band drawing preview
    const intersectPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
      this.cursorCoords.set({
        x: Math.round(intersectPoint.x * 100) / 100,
        y: Math.round(intersectPoint.y * 100) / 100,
        z: Math.round(intersectPoint.z * 100) / 100,
      });

      // Update rubber-band drawing preview if currently drawing
      if (this.drawingStartPoint) {
        this.updateDrawingPreview(this.drawingStartPoint, intersectPoint);
      }
    }
  }

  async onCanvasClick(e: MouseEvent): Promise<void> {
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (this.isPointerDragging || dist > 5) {
      this.isPointerDragging = false;
      return;
    }
    if (this.transformControls?.dragging) return;

    if (this.canvasRef?.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: 800, height: 600 };
      if (rect.width > 0 && rect.height > 0) {
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }
    }
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const tool = this.activeCadTool();

    // 1. Select Tool
    if (tool === 'select') {
      const hitObj = this.resolveRaycastedMesh();
      if (hitObj) {
        this.bridge.selectObject(hitObj.name);
      } else {
        this.bridge.selectObject(null);
      }
      return;
    }

    // 2. Transform Tools (Move, Rotate, Scale) - Direct Raycast Selection
    if (tool === 'move' || tool === 'rotate' || tool === 'scale') {
      const hitObj = this.resolveRaycastedMesh();
      if (hitObj) {
        this.bridge.selectObject(hitObj.name);
      }
      return;
    }

    // 3. Paint Bucket Tool
    if (tool === 'paint_bucket') {
      const hitObj = this.resolveRaycastedMesh();
      if (hitObj) {
        await this.bridge.applyMaterial({
          target: hitObj.name,
          materialPreset: this.selectedMaterialPreset(),
        });
      }
      return;
    }

    // 4. Push-Pull Tool
    if (tool === 'push_pull') {
      const hitObj = this.resolveRaycastedMesh();
      if (hitObj) {
        this.bridge.selectObject(hitObj.name);
        await this.bridge.pushPull({
          target: hitObj.name,
          distance: 3.0,
        });
      } else {
        const selected = this.bridge.getSelectedObject();
        if (selected) {
          await this.bridge.pushPull({
            target: selected.name,
            distance: 3.0,
          });
        }
      }
      return;
    }

    // 5. Tape Measure Tool
    if (tool === 'tape_measure') {
      const hitObj = this.resolveRaycastedMesh();
      const target = hitObj || this.bridge.getSelectedObject();
      if (target) {
        if (hitObj) this.bridge.selectObject(hitObj.name);
        const res = await this.bridge.measure({
          targetA: target.name,
          measurementType: 'floor_area',
        });
        if (res.data?.formatted) {
          this.lastCommittedDimension.set(res.data.formatted);
        }
      }
      return;
    }

    // 6. Interactive 2D Drawing (Rectangle, Circle, Line)
    const intersectPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
      if (!this.drawingStartPoint) {
        // First click: record start point and isolate OrbitControls
        this.drawingStartPoint = intersectPoint.clone();
        if (this.orbitControls) {
          this.orbitControls.enabled = false;
        }
      } else {
        // Second click: finish drawing shape and restore OrbitControls
        const start = this.drawingStartPoint;
        const end = intersectPoint;
        const width = Math.abs(end.x - start.x) || 4;
        const length = Math.abs(end.z - start.z) || 4;
        const origin = {
          x: (start.x + end.x) / 2,
          y: 0,
          z: (start.z + end.z) / 2,
        };

        if (tool === 'rectangle') {
          await this.bridge.drawShape({
            shape: 'rectangle',
            origin,
            dimensions: { width, length },
            fill: true,
          });
        } else if (tool === 'circle') {
          const radius = start.distanceTo(end) || 3;
          await this.bridge.drawShape({
            shape: 'circle',
            origin: { x: start.x, y: 0, z: start.z },
            dimensions: { radius },
            fill: true,
          });
        } else if (tool === 'line') {
          await this.bridge.drawShape({
            shape: 'line',
            dimensions: {
              points: [
                { x: start.x, y: 0, z: start.z },
                { x: end.x, y: 0, z: end.z },
              ],
            },
          });
        }

        // Clean up preview and restore orbit controls
        this.clearDrawingPreview();
        this.drawingStartPoint = null;
        if (this.orbitControls) {
          this.orbitControls.enabled = true;
        }
      }
    }
  }

  private disposePreviewMesh(obj: THREE.Object3D): void {
    obj.traverse((child: any) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  private updateDrawingPreview(start: THREE.Vector3, current: THREE.Vector3): void {
    this.clearDrawingPreview();

    const tool = this.activeCadTool();
    if (tool === 'rectangle') {
      const width = Math.max(0.01, Math.abs(current.x - start.x));
      const length = Math.max(0.01, Math.abs(current.z - start.z));
      const geo = new THREE.PlaneGeometry(width, length);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = 'cad_preview_rectangle';
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set((start.x + current.x) / 2, 0.02, (start.z + current.z) / 2);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 })
      );
      mesh.add(edges);

      this.previewMesh = mesh;
      this.scene.add(this.previewMesh);
    } else if (tool === 'circle') {
      const radius = Math.max(0.01, start.distanceTo(current));
      const geo = new THREE.CircleGeometry(radius, 36);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = 'cad_preview_circle';
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(start.x, 0.02, start.z);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 })
      );
      mesh.add(edges);

      this.previewMesh = mesh;
      this.scene.add(this.previewMesh);
    } else if (tool === 'line') {
      const points = [
        new THREE.Vector3(start.x, 0.02, start.z),
        new THREE.Vector3(current.x, 0.02, current.z),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
      const lineMesh = new THREE.Line(geo, mat);
      lineMesh.name = 'cad_preview_line';

      this.previewMesh = lineMesh;
      this.scene.add(this.previewMesh);
    }
  }

  private clearDrawingPreview(): void {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.disposePreviewMesh(this.previewMesh);
      this.previewMesh = null;
    }
  }

  // =========================================================================
  // VCB Measurements Commitment
  // =========================================================================

  private parseUnitToMeters(valStr: string): number {
    const s = valStr.trim().toLowerCase();
    if (!s) return NaN;
    if (s.endsWith('mm')) {
      const num = parseFloat(s.slice(0, -2));
      return isNaN(num) ? NaN : num / 1000;
    }
    if (s.endsWith('cm')) {
      const num = parseFloat(s.slice(0, -2));
      return isNaN(num) ? NaN : num / 100;
    }
    if (s.endsWith('m')) {
      const num = parseFloat(s.slice(0, -1));
      return isNaN(num) ? NaN : num;
    }
    const num = parseFloat(s);
    return isNaN(num) ? NaN : num;
  }

  async commitVcbInput(): Promise<void> {
    const text = this.vcbInputText.trim();
    if (!text) return;

    this.lastCommittedDimension.set(text);

    // Parse coordinates or dimensions with unit support (mm, cm, m)
    const parts = text
      .split(/[,xX\s]+/)
      .map((s) => this.parseUnitToMeters(s))
      .filter((n) => !isNaN(n));
    const tool = this.activeCadTool();

    if (tool === 'rectangle' && parts.length >= 2) {
      const [width, length] = parts;
      const origin = this.drawingStartPoint
        ? { x: this.drawingStartPoint.x, y: this.drawingStartPoint.y, z: this.drawingStartPoint.z }
        : undefined;
      await this.bridge.drawShape({
        shape: 'rectangle',
        origin,
        dimensions: { width, length },
        fill: true,
      });
      this.clearDrawingPreview();
      this.drawingStartPoint = null;
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
      }
    } else if (tool === 'circle' && parts.length >= 1) {
      const radius = parts[0];
      const origin = this.drawingStartPoint
        ? { x: this.drawingStartPoint.x, y: this.drawingStartPoint.y, z: this.drawingStartPoint.z }
        : undefined;
      await this.bridge.drawShape({
        shape: 'circle',
        origin,
        dimensions: { radius },
        fill: true,
      });
      this.clearDrawingPreview();
      this.drawingStartPoint = null;
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
      }
    } else if (tool === 'line' && parts.length >= 1) {
      const start = this.drawingStartPoint || new THREE.Vector3(0, 0, 0);
      const end =
        parts.length >= 2
          ? new THREE.Vector3(start.x + parts[0], start.y, start.z + parts[1])
          : new THREE.Vector3(start.x + parts[0], start.y, start.z);
      await this.bridge.drawShape({
        shape: 'line',
        dimensions: {
          points: [
            { x: start.x, y: start.y, z: start.z },
            { x: end.x, y: end.y, z: end.z },
          ],
        },
      });
      this.clearDrawingPreview();
      this.drawingStartPoint = null;
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
      }
    } else if (tool === 'push_pull' && parts.length >= 1) {
      const selected = this.bridge.getSelectedObject();
      if (selected) {
        await this.bridge.pushPull({
          target: selected.name,
          distance: parts[0],
        });
      }
    }

    this.vcbInputText = '';
  }

  // =========================================================================
  // Tool & Mode Switching
  // =========================================================================

  setActiveCadTool(tool: CadActiveTool): void {
    this.activeCadTool.set(tool);
    this.clearDrawingPreview();
    this.drawingStartPoint = null;
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
    }

    if (tool === 'move') {
      this.setGizmoMode('translate');
    } else if (tool === 'rotate') {
      this.setGizmoMode('rotate');
    } else if (tool === 'scale') {
      this.setGizmoMode('scale');
    } else if (tool === 'select') {
      this.setGizmoMode('none');
    }
  }

  setGizmoMode(mode: StudioTransformGizmoMode): void {
    this.currentGizmoMode.set(mode);
    this.bridge.setViewport({ gizmoMode: mode });
  }

  async setShadingMode(mode: StudioShadingMode): Promise<void> {
    this.currentShadingMode.set(mode);
    await this.bridge.setViewport({ shadingMode: mode });
  }

  async setCameraPreset(preset: StudioCameraViewPreset): Promise<void> {
    this.currentCameraPreset.set(preset);
    await this.bridge.setViewport({ cameraView: preset });
  }

  toggleGrid(): void {
    const next = !this.showGrid();
    this.showGrid.set(next);
    this.bridge.setViewport({ showGrid: next });
  }

  toggleShadows(): void {
    const next = !this.showShadows();
    this.showShadows.set(next);
    this.bridge.setViewport({ showShadows: next });
  }

  toggleAxes(): void {
    const next = !this.showAxes();
    this.showAxes.set(next);
    if (this.axesGroup) {
      this.axesGroup.visible = next;
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen.update((f) => !f);
    setTimeout(() => {
      this.resizeHandler?.();
    }, 50);
  }

  toggleTrayTab(tab: 'entity' | 'materials' | 'components' | 'outliner' | 'styles'): void {
    if (this.activeTrayTab() === tab) {
      this.activeTrayTab.set(null);
    } else {
      this.activeTrayTab.set(tab);
    }
  }

  getTrayTitle(tab: string): string {
    switch (tab) {
      case 'entity':
        return 'Entity Info';
      case 'materials':
        return 'Materials Palette';
      case 'components':
        return 'Component Library';
      case 'outliner':
        return 'Outliner Tree';
      case 'styles':
        return 'Styles & Environment';
      default:
        return 'Tray';
    }
  }

  getNodeIcon(type: string): string {
    switch (type) {
      case 'Group':
        return '📁';
      case 'Mesh':
        return '🧊';
      case 'PointLight':
      case 'DirectionalLight':
        return '💡';
      default:
        return '◻️';
    }
  }

  // =========================================================================
  // Quick Actions (1-Click Tray Operations)
  // =========================================================================

  async applyPresetMaterial(preset: CadMaterialPreset): Promise<void> {
    this.selectedMaterialPreset.set(preset);
    const sel = this.bridge.getSelectedObject();
    if (sel) {
      await this.bridge.applyMaterial({
        target: sel.name,
        materialPreset: preset,
      });
    }
  }

  async placePresetComponent(type: CadComponentType): Promise<void> {
    const coords = this.cursorCoords();
    await this.bridge.placeComponent({
      componentType: type,
      position: { x: coords.x, y: 0, z: coords.z },
    });
  }

  async quickPushPullSelected(distance: number): Promise<void> {
    const sel = this.bridge.getSelectedObject();
    if (sel) {
      await this.bridge.pushPull({
        target: sel.name,
        distance,
      });
    }
  }

  async measureSelected(): Promise<void> {
    const sel = this.bridge.getSelectedObject();
    if (sel) {
      const res = await this.bridge.measure({
        targetA: sel.name,
        measurementType: 'floor_area',
      });
      if (res.data?.formatted) {
        this.lastCommittedDimension.set(res.data.formatted);
      }
    }
  }

  async newScene(): Promise<void> {
    await this.bridge.manageHierarchy({ action: 'clear_custom' });
    this.buildSketchUpEnvironment();
    this.bridge.refreshSceneGraph();
  }

  async clearScene(): Promise<void> {
    await this.bridge.manageHierarchy({ action: 'clear_custom' });
  }

  async undo(): Promise<void> {
    // Undo last custom node
    const nodes = this.bridge.sceneNodes();
    const custom = nodes.filter((n) => n.isCustom);
    if (custom.length > 0) {
      await this.bridge.manageHierarchy({ action: 'delete', target: custom[custom.length - 1].name });
    }
  }

  async redo(): Promise<void> {
    // Re-draw or restore
  }

  async deleteSelected(): Promise<void> {
    const selected = this.bridge.getSelectedObject();
    if (selected) {
      await this.bridge.manageHierarchy({ action: 'delete', target: selected.name });
    }
  }

  async captureSnapshot(): Promise<void> {
    if (this.captureService) {
      await this.captureService.takeScreenshot({ selector: 'canvas' });
    }
  }

  async exportGlb(): Promise<void> {
    await this.bridge.exportGltf({ format: 'glb', target: 'scene' });
  }

  // =========================================================================
  // Keyboard Hotkeys
  // =========================================================================

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    if (
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        (activeEl as HTMLElement).isContentEditable)
    ) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault?.();
        this.undo();
        return;
      }
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault?.();
        this.redo();
        return;
      }
    }

    switch (event.key.toLowerCase()) {
      case 'escape':
        this.clearDrawingPreview();
        this.drawingStartPoint = null;
        if (this.orbitControls) {
          this.orbitControls.enabled = true;
        }
        this.bridge.selectObject(null);
        if (this.isFullscreen()) {
          this.toggleFullscreen();
        }
        break;
      case ' ': {
        // Guard space key to only act when viewport or canvas is focused/active (prevent interfering with buttons/links)
        const docBody = typeof document !== 'undefined' ? document.body : null;
        if (activeEl && activeEl !== docBody && (activeEl.tagName === 'BUTTON' || activeEl.tagName === 'A')) {
          return;
        }
        event.preventDefault?.();
        this.setActiveCadTool('select');
        break;
      }
      case 'l':
        this.setActiveCadTool('line');
        break;
      case 'r':
        this.setActiveCadTool('rectangle');
        break;
      case 'c':
        this.setActiveCadTool('circle');
        break;
      case 'p':
        this.setActiveCadTool('push_pull');
        break;
      case 'm':
      case 'w':
        this.setActiveCadTool('move');
        break;
      case 'q':
      case 'e':
        this.setActiveCadTool('rotate');
        break;
      case 's':
        this.setActiveCadTool('scale');
        break;
      case 't':
        this.setActiveCadTool('tape_measure');
        break;
      case 'b':
        this.setActiveCadTool('paint_bucket');
        break;
      case 'o':
        this.setActiveCadTool('orbit');
        break;
      case 'h':
        this.setActiveCadTool('pan');
        break;
      case 'z':
        this.setActiveCadTool('zoom');
        break;
      case 'delete':
      case 'backspace': {
        // Guard Delete/Backspace to only act when viewport or canvas is focused/active
        const canvas = this.canvasRef?.nativeElement;
        const container = canvas?.parentElement;
        const docBody = typeof document !== 'undefined' ? document.body : null;
        const isViewportActive =
          !activeEl ||
          activeEl === docBody ||
          activeEl === canvas ||
          (container ? container.contains(activeEl) : false);
        if (isViewportActive) {
          this.deleteSelected();
        }
        break;
      }
    }
  }

  // =========================================================================
  // Animation & Render Loop
  // =========================================================================

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);

    // OrbitControls damping update
    this.orbitControls?.update();

    // Live FPS Calculation
    this.frameCount++;
    const now = performance.now();
    if (now - this.fpsUpdateTime >= 500) {
      const currentFps = Math.round((this.frameCount * 1000) / (now - this.fpsUpdateTime));
      this.fps.set(currentFps);
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    this.renderer?.render(this.scene, this.camera);
  };
}
