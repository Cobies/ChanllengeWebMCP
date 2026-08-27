import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { WebmcpThreeSceneBridge } from '@webmcp/angular';

@Component({
  selector: 'app-visualizer-3d',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-[460px] lg:h-[540px] rounded-2xl overflow-hidden glass-panel-glow border border-cyan-500/30 bg-[#f0ebe1]/70 shadow-xl">
      <!-- 3D Canvas Container -->
      <canvas #viewportCanvas class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>

      <!-- Viewport Overlay HUD -->
      <div class="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          <span class="text-xs font-bold tracking-wider uppercase text-cyan-800">
            WebGL 3D Digital Twin
          </span>
        </div>
        <p class="text-[11px] text-slate-500 font-mono">
          Apex Cyber-Cruiser MK-IV • Three.js WebGL
        </p>
      </div>

      <!-- Quick View Controls HUD -->
      <div class="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/80 p-1.5 rounded-xl border border-slate-200/80 backdrop-blur-md shadow-sm">
        <button
          (click)="orbitLeft()"
          title="Orbit Left"
          class="p-2 rounded-lg bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200/80 hover:border-cyan-500/30 transition-all text-xs shadow-xs">
          ◀
        </button>
        <button
          (click)="orbitRight()"
          title="Orbit Right"
          class="p-2 rounded-lg bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200/80 hover:border-cyan-500/30 transition-all text-xs shadow-xs">
          ▶
        </button>
        <button
          (click)="zoomIn()"
          title="Zoom In"
          class="p-2 rounded-lg bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200/80 hover:border-cyan-500/30 transition-all text-xs font-bold shadow-xs">
          +
        </button>
        <button
          (click)="zoomOut()"
          title="Zoom Out"
          class="p-2 rounded-lg bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200/80 hover:border-cyan-500/30 transition-all text-xs font-bold shadow-xs">
          -
        </button>
        <button
          (click)="resetView()"
          title="Reset Camera"
          class="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-all text-xs shadow-xs">
          Reset
        </button>
      </div>

      <!-- Agent Target Identification Chips -->
      <div class="absolute bottom-4 left-4 hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/80 backdrop-blur-md shadow-xs">
        <span>Meshes:</span>
        <span class="text-cyan-700">#vehicle_chassis</span>
        <span>•</span>
        <span class="text-purple-700">#cabin_glass</span>
        <span>•</span>
        <span class="text-emerald-700">#neon_underglow</span>
      </div>
    </div>
  `,
})
export class Visualizer3dComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewportCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly bridge: WebmcpThreeSceneBridge;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private meshes = new Map<string, THREE.Mesh | THREE.Object3D>();
  private animFrameId: number | null = null;
  private wheels: THREE.Mesh[] = [];

  constructor(bridge?: WebmcpThreeSceneBridge) {
    this.bridge = bridge || inject(WebmcpThreeSceneBridge);
  }

  // Interaction State
  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initThree();
    this.buildSceneModel();
    this.bindToBridge();
    this.setupInteractivity();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.bridge.unbindScene();
    this.renderer?.dispose();
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf4f0e6);
    this.scene.fog = new THREE.FogExp2(0xf4f0e6, 0.03);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4.5, 2.5, 5.5);
    this.camera.lookAt(0, 0, 0);

    // Renderer (with preserveDrawingBuffer for screenshot captures)
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x0284c7, 1.5, 15);
    pointLight.position.set(-4, 3, -3);
    this.scene.add(pointLight);

    // Grid Floor
    const grid = new THREE.GridHelper(20, 20, 0x0284c7, 0xd6cfc2);
    grid.position.y = -0.01;
    this.scene.add(grid);
  }

  private buildSceneModel(): void {
    const vehicleGroup = new THREE.Group();
    vehicleGroup.name = 'cyber_vehicle_root';

    // 1. Main Chassis
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.6, 4.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.85,
      roughness: 0.2,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.6;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    vehicleGroup.add(chassis);
    this.meshes.set('vehicle_chassis', chassis);

    // 2. Aerodynamic Cabin / Glass Cockpit
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 2.0);
    const cabinMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.1, -0.2);
    cabin.castShadow = true;
    vehicleGroup.add(cabin);
    this.meshes.set('cabin_glass', cabin);

    // 3. Neon Underglow Strip
    const underglowGeo = new THREE.PlaneGeometry(2.2, 3.8);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const underglow = new THREE.Mesh(underglowGeo, underglowMat);
    underglow.rotation.x = Math.PI / 2;
    underglow.position.y = 0.1;
    vehicleGroup.add(underglow);
    this.meshes.set('neon_underglow', underglow);

    // 4. Rear Spoiler Wing
    const spoilerGeo = new THREE.BoxGeometry(2.2, 0.08, 0.4);
    const spoilerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
    });
    const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
    spoiler.position.set(0, 1.3, -1.8);
    vehicleGroup.add(spoiler);
    this.meshes.set('spoiler_wing', spoiler);

    // 5. Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 24);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.5,
      roughness: 0.8,
    });

    const wheelPositions = [
      { x: 1.25, y: 0.4, z: 1.3 },
      { x: -1.25, y: 0.4, z: 1.3 },
      { x: 1.25, y: 0.4, z: -1.3 },
      { x: -1.25, y: 0.4, z: -1.3 },
    ];

    wheelPositions.forEach((pos, idx) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      vehicleGroup.add(wheel);
      this.wheels.push(wheel);
      this.meshes.set(`wheel_${idx + 1}`, wheel);
    });

    this.scene.add(vehicleGroup);
    this.meshes.set('vehicle_root', vehicleGroup);
  }

  private bindToBridge(): void {
    this.bridge.bindScene({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      meshes: this.meshes,
      defaultCameraState: {
        position: { x: 4.5, y: 2.5, z: 5.5 },
        target: { x: 0, y: 0, z: 0 },
      },
    });
  }

  private setupInteractivity(): void {
    const canvas = this.canvasRef.nativeElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.prevMouseX;
      const deltaY = e.clientY - this.prevMouseY;

      // Orbit camera on manual drag
      const spherical = new THREE.Spherical().setFromVector3(this.camera.position);
      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.008));
      this.camera.position.setFromSpherical(spherical);
      this.camera.lookAt(0, 0, 0);

      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    // Handle Resize
    window.addEventListener('resize', () => {
      if (!canvas) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);

    // Rotate wheels slightly
    this.wheels.forEach((w) => {
      w.rotation.x += 0.01;
    });

    this.renderer.render(this.scene, this.camera);
  };

  // Manual Controls
  orbitLeft(): void {
    this.bridge.executeSceneAction({ action: 'rotate', deltaX: -30, durationMs: 400 });
  }

  orbitRight(): void {
    this.bridge.executeSceneAction({ action: 'rotate', deltaX: 30, durationMs: 400 });
  }

  zoomIn(): void {
    this.bridge.executeSceneAction({ action: 'zoom', zoomFactor: 0.8, durationMs: 400 });
  }

  zoomOut(): void {
    this.bridge.executeSceneAction({ action: 'zoom', zoomFactor: 1.25, durationMs: 400 });
  }

  resetView(): void {
    this.bridge.executeSceneAction({ action: 'reset_camera', durationMs: 500 });
  }
}
