import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as THREE from 'three';
import { Visualizer3dComponent } from './visualizer-3d.component';
import { WebmcpThreeSceneBridge } from '../../../lib/three/three-scene-bridge';
import { WebMcpService } from '../../../lib/core/webmcp.service';
import { Scene3DActionBus } from '../../../lib/three/scene-action-bus';

describe('Visualizer3dComponent (Interactive 3D DCC Viewport Engine)', () => {
  let webmcp: WebMcpService;
  let actionBus: Scene3DActionBus;
  let bridge: WebmcpThreeSceneBridge;
  let component: Visualizer3dComponent;

  beforeEach(() => {
    webmcp = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
    actionBus = new Scene3DActionBus();
    bridge = new WebmcpThreeSceneBridge(webmcp, actionBus);

    component = new Visualizer3dComponent(bridge);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('Component Initialization', () => {
    it('should create the component instance with default state', () => {
      expect(component).toBeDefined();
      expect(component.currentGizmoMode()).toBe('translate');
      expect(component.currentShadingMode()).toBe('pbr');
      expect(component.showGrid()).toBe(true);
      expect(component.showShadows()).toBe(true);
    });
  });

  describe('Gizmo Mode Switching', () => {
    it('should switch gizmo modes between translate, rotate, scale, and none', () => {
      component.setGizmoMode('rotate');
      expect(component.currentGizmoMode()).toBe('rotate');

      component.setGizmoMode('scale');
      expect(component.currentGizmoMode()).toBe('scale');

      component.setGizmoMode('none');
      expect(component.currentGizmoMode()).toBe('none');

      component.setGizmoMode('translate');
      expect(component.currentGizmoMode()).toBe('translate');
    });
  });

  describe('Shading Mode Switching', () => {
    it('should switch viewport shading modes between pbr, wireframe, solid, and normal', async () => {
      await component.setShadingMode('wireframe');
      expect(component.currentShadingMode()).toBe('wireframe');

      await component.setShadingMode('solid');
      expect(component.currentShadingMode()).toBe('solid');

      await component.setShadingMode('normal');
      expect(component.currentShadingMode()).toBe('normal');

      await component.setShadingMode('pbr');
      expect(component.currentShadingMode()).toBe('pbr');
    });
  });

  describe('Camera Preset Views', () => {
    it('should trigger camera presets (perspective, top, front, side, iso)', async () => {
      await component.setCameraPreset('top');
      expect(component.currentCameraPreset()).toBe('top');

      await component.setCameraPreset('front');
      expect(component.currentCameraPreset()).toBe('front');

      await component.setCameraPreset('side');
      expect(component.currentCameraPreset()).toBe('side');

      await component.setCameraPreset('iso');
      expect(component.currentCameraPreset()).toBe('iso');

      await component.setCameraPreset('perspective');
      expect(component.currentCameraPreset()).toBe('perspective');
    });
  });

  describe('Grid & Shadow Toggles', () => {
    it('should toggle grid and shadow visibility states', () => {
      expect(component.showGrid()).toBe(true);
      component.toggleGrid();
      expect(component.showGrid()).toBe(false);

      expect(component.showShadows()).toBe(true);
      component.toggleShadows();
      expect(component.showShadows()).toBe(false);
    });
  });

  describe('SketchUp CAD Tool Strip & Hotkeys', () => {
    it('should switch active CAD tools (select, line, rectangle, circle, push_pull, tape_measure, paint_bucket)', () => {
      expect(component.activeCadTool()).toBe('select');

      component.setActiveCadTool('line');
      expect(component.activeCadTool()).toBe('line');

      component.setActiveCadTool('rectangle');
      expect(component.activeCadTool()).toBe('rectangle');

      component.setActiveCadTool('circle');
      expect(component.activeCadTool()).toBe('circle');

      component.setActiveCadTool('push_pull');
      expect(component.activeCadTool()).toBe('push_pull');

      component.setActiveCadTool('tape_measure');
      expect(component.activeCadTool()).toBe('tape_measure');

      component.setActiveCadTool('paint_bucket');
      expect(component.activeCadTool()).toBe('paint_bucket');

      component.setActiveCadTool('select');
      expect(component.activeCadTool()).toBe('select');
    });

    it('should provide dynamic guidance hint based on active CAD tool', () => {
      component.setActiveCadTool('line');
      expect(component.activeToolHint()).toContain('Line');

      component.setActiveCadTool('push_pull');
      expect(component.activeToolHint()).toContain('Push-Pull');

      component.setActiveCadTool('tape_measure');
      expect(component.activeToolHint()).toContain('Measure');
    });

    it('should update and commit VCB metric dimensions input', () => {
      component.vcbInputText = '6.0, 4.0';
      component.commitVcbInput();
      expect(component.lastCommittedDimension()).toBe('6.0, 4.0');
    });

    it('should parse VCB inputs with units (mm, cm, m) and support line tool', async () => {
      component.setActiveCadTool('line');
      component.vcbInputText = '500mm, 1000mm';
      await component.commitVcbInput();
      expect(component.lastCommittedDimension()).toBe('500mm, 1000mm');

      component.setActiveCadTool('circle');
      component.vcbInputText = '150cm';
      await component.commitVcbInput();
      expect(component.lastCommittedDimension()).toBe('150cm');
    });

    it('should handle Escape hotkey to deselect entity and exit fullscreen', () => {
      component.isFullscreen.set(true);
      component.handleKeyDown({ key: 'Escape', preventDefault: () => {} } as any);
      expect(component.isFullscreen()).toBe(false);
      expect(bridge.selectedNode()).toBeNull();
    });

    it('should handle Space hotkey to switch to select tool when viewport is active', () => {
      component.setActiveCadTool('line');
      component.handleKeyDown({ key: ' ', preventDefault: () => {} } as any);
      expect(component.activeCadTool()).toBe('select');
    });
  });

  describe('Direct Raycast Selection across Transform & Push-Pull Tools', () => {
    let mockMesh: THREE.Mesh;

    beforeEach(() => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);

      const mockCanvas = {
        clientWidth: 800,
        clientHeight: 600,
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
          right: 800,
          bottom: 600,
          x: 0,
          y: 0,
          toJSON: () => {},
        }),
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => null,
      } as unknown as HTMLCanvasElement;

      const renderer = {
        domElement: mockCanvas,
        shadowMap: { enabled: true, type: 1 },
        setSize: () => {},
        setPixelRatio: () => {},
        render: () => {},
        dispose: () => {},
      } as unknown as THREE.WebGLRenderer;

      const orbitControls = {
        enabled: true,
        update: () => {},
        dispose: () => {},
      } as any;

      const transformControls = {
        size: 0.75,
        object: null as any,
        setMode: (mode: string) => {},
        attach: (obj: any) => {
          transformControls.object = obj;
        },
        detach: () => {
          transformControls.object = null;
        },
        addEventListener: () => {},
        dispose: () => {},
      } as any;

      const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x0284c7);
      selectionBox.visible = false;

      const hoverBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0x38bdf8);
      hoverBoxHelper.visible = false;

      const meshes = new Map<string, THREE.Mesh | THREE.Object3D>();

      mockMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      mockMesh.name = 'target_building_cube';
      mockMesh.position.set(0, 1, 0);
      scene.add(mockMesh);
      meshes.set('target_building_cube', mockMesh);

      camera.updateMatrixWorld(true);
      mockMesh.updateMatrixWorld(true);

      (component as any).canvasRef = { nativeElement: mockCanvas };
      (component as any).scene = scene;
      (component as any).camera = camera;
      (component as any).renderer = renderer;
      (component as any).orbitControls = orbitControls;
      (component as any).transformControls = transformControls;
      (component as any).selectionBox = selectionBox;
      (component as any).hoverBoxHelper = hoverBoxHelper;
      (component as any).meshes = meshes;

      bridge.bindScene({
        scene,
        camera,
        renderer,
        meshes,
        selectionBox,
        orbitControls,
        transformControls,
      });
    });

    it('should directly raycast and select mesh on move tool click', async () => {
      component.setActiveCadTool('move');
      expect(component.currentGizmoMode()).toBe('translate');

      // Click center of screen (0, 0 in NDC -> intersects cube at 0, 1, 0)
      (component as any).pointer = new THREE.Vector2(0, 0);
      (component as any).pointerDownPos = { x: 400, y: 300 };

      await component.onCanvasClick({ clientX: 400, clientY: 300 } as MouseEvent);

      expect(bridge.getSelectedObject()?.name).toBe('target_building_cube');
      expect(bridge.selectedNode()?.name).toBe('target_building_cube');
    });

    it('should directly raycast and select mesh on rotate tool click', async () => {
      component.setActiveCadTool('rotate');
      expect(component.currentGizmoMode()).toBe('rotate');

      (component as any).pointer = new THREE.Vector2(0, 0);
      (component as any).pointerDownPos = { x: 400, y: 300 };

      await component.onCanvasClick({ clientX: 400, clientY: 300 } as MouseEvent);

      expect(bridge.getSelectedObject()?.name).toBe('target_building_cube');
    });

    it('should directly raycast and select mesh on scale tool click', async () => {
      component.setActiveCadTool('scale');
      expect(component.currentGizmoMode()).toBe('scale');

      (component as any).pointer = new THREE.Vector2(0, 0);
      (component as any).pointerDownPos = { x: 400, y: 300 };

      await component.onCanvasClick({ clientX: 400, clientY: 300 } as MouseEvent);

      expect(bridge.getSelectedObject()?.name).toBe('target_building_cube');
    });

    it('should directly select and push-pull mesh on push_pull tool click', async () => {
      component.setActiveCadTool('push_pull');

      (component as any).pointer = new THREE.Vector2(0, 0);
      (component as any).pointerDownPos = { x: 400, y: 300 };

      await component.onCanvasClick({ clientX: 400, clientY: 300 } as MouseEvent);

      expect(bridge.getSelectedObject()?.name).toBe('target_building_cube');
      expect((bridge.getSelectedObject() as THREE.Mesh)?.userData['isCadExtrusion']).toBe(true);
    });

    it('should deselect when select tool clicks on empty space', async () => {
      component.setActiveCadTool('select');
      bridge.selectObject('target_building_cube');
      expect(bridge.getSelectedObject()?.name).toBe('target_building_cube');

      // Click off-screen (NDC 0.9, 0.9 points away from cube)
      (component as any).pointer = new THREE.Vector2(0.9, 0.9);
      (component as any).pointerDownPos = { x: 760, y: 30 };

      await component.onCanvasClick({ clientX: 760, clientY: 30 } as MouseEvent);

      expect(bridge.getSelectedObject()).toBeNull();
      expect(bridge.selectedNode()).toBeNull();
    });
  });

  describe('Dynamic 2D CAD Rubber-Band Drawing & OrbitControls Isolation', () => {
    beforeEach(() => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
      camera.position.set(0, 10, 20);
      camera.lookAt(0, 0, 0);

      const mockCanvas = {
        clientWidth: 800,
        clientHeight: 600,
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
          right: 800,
          bottom: 600,
          x: 0,
          y: 0,
          toJSON: () => {},
        }),
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => null,
      } as unknown as HTMLCanvasElement;

      const renderer = {
        domElement: mockCanvas,
        shadowMap: { enabled: true, type: 1 },
        setSize: () => {},
        setPixelRatio: () => {},
        render: () => {},
        dispose: () => {},
      } as unknown as THREE.WebGLRenderer;

      const orbitControls = {
        enabled: true,
        update: () => {},
        dispose: () => {},
      } as any;

      const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x0284c7);
      selectionBox.visible = false;

      const hoverBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0x38bdf8);
      hoverBoxHelper.visible = false;

      const meshes = new Map<string, THREE.Mesh | THREE.Object3D>();
      camera.updateMatrixWorld(true);

      (component as any).canvasRef = { nativeElement: mockCanvas };
      (component as any).scene = scene;
      (component as any).camera = camera;
      (component as any).renderer = renderer;
      (component as any).orbitControls = orbitControls;
      (component as any).selectionBox = selectionBox;
      (component as any).hoverBoxHelper = hoverBoxHelper;
      (component as any).meshes = meshes;

      bridge.bindScene({
        scene,
        camera,
        renderer,
        meshes,
        selectionBox,
        orbitControls,
      });
    });

    it('should disable orbitControls while drawing rectangle and create rectangle preview on mouse move', async () => {
      component.setActiveCadTool('rectangle');
      const orbitControls = (component as any).orbitControls;
      expect(orbitControls.enabled).toBe(true);

      // 1st Click at (0, 0, 0)
      (component as any).pointer = new THREE.Vector2(0, 0);
      (component as any).pointerDownPos = { x: 400, y: 300 };
      await component.onCanvasClick({ clientX: 400, clientY: 300 } as MouseEvent);

      expect((component as any).drawingStartPoint).not.toBeNull();
      expect(orbitControls.enabled).toBe(false);

      // Move mouse to generate preview
      component.onCanvasMouseMove({ clientX: 500, clientY: 400 } as MouseEvent);
      const previewMesh = (component as any).previewMesh;
      expect(previewMesh).toBeDefined();
      expect(previewMesh.name).toBe('cad_preview_rectangle');

      // 2nd Click to complete drawing
      (component as any).pointerDownPos = { x: 500, y: 400 };
      await component.onCanvasClick({ clientX: 500, clientY: 400 } as MouseEvent);

      expect((component as any).drawingStartPoint).toBeNull();
      expect((component as any).previewMesh).toBeNull();
      expect(orbitControls.enabled).toBe(true);
    });

    it('should generate circle rubber-band preview when drawing circle', async () => {
      component.setActiveCadTool('circle');
      const orbitControls = (component as any).orbitControls;

      // 1st Click
      (component as any).pointer = new THREE.Vector2(0, 0);
      (component as any).pointerDownPos = { x: 400, y: 300 };
      await component.onCanvasClick({ clientX: 400, clientY: 300 } as MouseEvent);

      expect(orbitControls.enabled).toBe(false);

      // Mouse move
      component.onCanvasMouseMove({ clientX: 550, clientY: 350 } as MouseEvent);
      const previewMesh = (component as any).previewMesh;
      expect(previewMesh).toBeDefined();
      expect(previewMesh.name).toBe('cad_preview_circle');

      // Complete drawing with Escape
      component.handleKeyDown({ key: 'Escape' } as KeyboardEvent);
      expect((component as any).drawingStartPoint).toBeNull();
      expect((component as any).previewMesh).toBeNull();
      expect(orbitControls.enabled).toBe(true);
    });

    it('should generate line rubber-band preview when drawing line', async () => {
      component.setActiveCadTool('line');
      const orbitControls = (component as any).orbitControls;

      // 1st Click
      (component as any).pointer = new THREE.Vector2(0, 0);
      (component as any).pointerDownPos = { x: 400, y: 300 };
      await component.onCanvasClick({ clientX: 400, clientY: 300 } as MouseEvent);

      expect(orbitControls.enabled).toBe(false);

      // Mouse move
      component.onCanvasMouseMove({ clientX: 500, clientY: 300 } as MouseEvent);
      const previewMesh = (component as any).previewMesh;
      expect(previewMesh).toBeDefined();
      expect(previewMesh.name).toBe('cad_preview_line');

      // Switching CAD tool restores orbitControls and cleans preview
      component.setActiveCadTool('select');
      expect((component as any).drawingStartPoint).toBeNull();
      expect((component as any).previewMesh).toBeNull();
      expect(orbitControls.enabled).toBe(true);
    });
  });

  describe('Hover Highlight Outline (hoverBoxHelper)', () => {
    let mockMesh: THREE.Mesh;

    beforeEach(() => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);

      const mockCanvas = {
        clientWidth: 800,
        clientHeight: 600,
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
          right: 800,
          bottom: 600,
          x: 0,
          y: 0,
          toJSON: () => {},
        }),
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => null,
      } as unknown as HTMLCanvasElement;

      const renderer = {
        domElement: mockCanvas,
        shadowMap: { enabled: true, type: 1 },
        setSize: () => {},
        setPixelRatio: () => {},
        render: () => {},
        dispose: () => {},
      } as unknown as THREE.WebGLRenderer;

      const hoverBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0x38bdf8);
      hoverBoxHelper.visible = false;
      scene.add(hoverBoxHelper);

      const meshes = new Map<string, THREE.Mesh | THREE.Object3D>();
      mockMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      );
      mockMesh.name = 'hoverable_column';
      mockMesh.position.set(0, 1, 0);
      scene.add(mockMesh);
      meshes.set('hoverable_column', mockMesh);

      camera.updateMatrixWorld(true);
      mockMesh.updateMatrixWorld(true);

      (component as any).canvasRef = { nativeElement: mockCanvas };
      (component as any).scene = scene;
      (component as any).camera = camera;
      (component as any).renderer = renderer;
      (component as any).hoverBoxHelper = hoverBoxHelper;
      (component as any).meshes = meshes;

      bridge.bindScene({
        scene,
        camera,
        renderer,
        meshes,
      });
    });

    it('should update hoverBoxHelper to visible on unselected mesh hover', () => {
      // Hover over center (where cube is located)
      component.onCanvasMouseMove({ clientX: 400, clientY: 300 } as MouseEvent);

      const hoverHelper = (component as any).hoverBoxHelper as THREE.BoxHelper;
      expect(hoverHelper.visible).toBe(true);
    });

    it('should hide hoverBoxHelper when object is already selected or pointer moves off-mesh', () => {
      const hoverHelper = (component as any).hoverBoxHelper as THREE.BoxHelper;

      // Select the mesh
      bridge.selectObject('hoverable_column');

      // Hover over it
      component.onCanvasMouseMove({ clientX: 400, clientY: 300 } as MouseEvent);
      expect(hoverHelper.visible).toBe(false);

      // Move away to empty space
      component.onCanvasMouseMove({ clientX: 780, clientY: 20 } as MouseEvent);
      expect(hoverHelper.visible).toBe(false);
    });
  });
});


