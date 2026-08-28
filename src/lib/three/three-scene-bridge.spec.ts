import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as THREE from 'three';
import { WebMcpService } from '../core/webmcp.service';
import { Scene3DActionBus } from './scene-action-bus';
import { WebmcpThreeSceneBridge, SceneContextRef } from './three-scene-bridge';
import {
  StudioCreateObjectParams,
  StudioTransformParams,
  StudioMaterialParams,
  StudioHierarchyParams,
  StudioViewportParams,
  StudioExportParams,
  CadDrawShapeParams,
  CadPushPullParams,
  CadPlaceComponentParams,
  CadApplyMaterialParams,
  CadMeasureParams,
  CadShapeType,
  CadComponentType,
  CadMaterialPreset,
} from '../core/webmcp.types';

describe('WebmcpThreeSceneBridge (DCC 3D Studio & WebMCP CAD Suite)', () => {
  let webmcp: WebMcpService;
  let actionBus: Scene3DActionBus;
  let bridge: WebmcpThreeSceneBridge;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let meshes: Map<string, THREE.Mesh | THREE.Object3D>;

  beforeEach(() => {
    webmcp = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
    actionBus = new Scene3DActionBus();
    bridge = new WebmcpThreeSceneBridge(webmcp, actionBus);

    // Setup mock Three.js scene context
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
    camera.position.set(4, 3, 6);

    // Create a mock canvas/renderer
    const mockCanvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 800,
      height: 600,
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => null,
    } as unknown as HTMLCanvasElement;

    renderer = {
      domElement: mockCanvas,
      shadowMap: { enabled: true, type: 1 },
      setSize: () => {},
      setPixelRatio: () => {},
      render: () => {},
      dispose: () => {},
    } as unknown as THREE.WebGLRenderer;

    meshes = new Map<string, THREE.Mesh | THREE.Object3D>();

    // Add a base vehicle chassis mesh
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 4),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 })
    );
    baseMesh.name = 'vehicle_chassis';
    scene.add(baseMesh);
    meshes.set('vehicle_chassis', baseMesh);

    const ref: SceneContextRef = {
      scene,
      camera,
      renderer,
      meshes,
      defaultCameraState: {
        position: { x: 4, y: 3, z: 6 },
        target: { x: 0, y: 0, z: 0 },
      },
    };

    bridge.bindScene(ref);
  });

  afterEach(() => {
    bridge.unbindScene();
  });

  describe('Tool Suite Registration', () => {
    it('should register all 12 WebMCP DCC & CAD tools', () => {
      const tools = webmcp.registeredTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('scene_3d_action');
      expect(toolNames).toContain('studio_create_object');
      expect(toolNames).toContain('studio_transform_object');
      expect(toolNames).toContain('studio_update_material');
      expect(toolNames).toContain('studio_manage_hierarchy');
      expect(toolNames).toContain('studio_set_viewport');
      expect(toolNames).toContain('studio_export_gltf');
      // 5 New CAD tools
      expect(toolNames).toContain('cad_draw_shape');
      expect(toolNames).toContain('cad_push_pull');
      expect(toolNames).toContain('cad_place_component');
      expect(toolNames).toContain('cad_apply_material');
      expect(toolNames).toContain('cad_measure');
      expect(tools.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('studio_create_object', () => {
    it('should create a primitive Box with custom PBR material', async () => {
      const params: StudioCreateObjectParams = {
        type: 'box',
        name: 'test_gold_cube',
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 0, y: 45, z: 0 },
        scale: { x: 1.5, y: 1.5, z: 1.5 },
        material: {
          color: '#ffd700',
          metalness: 0.95,
          roughness: 0.1,
        },
      };

      const result = await bridge.createObject(params);
      expect(result.success).toBe(true);
      expect(result.node).toBeDefined();
      expect(result.node?.name).toBe('test_gold_cube');
      expect(result.node?.position).toEqual({ x: 1, y: 2, z: 3 });
      expect(result.node?.isCustom).toBe(true);

      const created = meshes.get('test_gold_cube') as THREE.Mesh;
      expect(created).toBeDefined();
      expect(created.position.x).toBe(1);
      expect(created.position.y).toBe(2);
      expect(created.position.z).toBe(3);

      const mat = created.material as THREE.MeshStandardMaterial;
      expect(mat.metalness).toBe(0.95);
      expect(mat.roughness).toBe(0.1);
    });

    it('should create Sphere, Cylinder, Cone, Torus, TorusKnot, Plane, Pedestal, Light, and Text', async () => {
      const types: StudioCreateObjectParams['type'][] = [
        'sphere',
        'cylinder',
        'cone',
        'torus',
        'torus_knot',
        'plane',
        'pedestal',
        'light',
        'text',
      ];

      for (const type of types) {
        const res = await bridge.createObject({
          type,
          name: `auto_${type}`,
          position: { x: 0, y: 1, z: 0 },
        });
        expect(res.success).toBe(true);
        expect(meshes.has(`auto_${type}`)).toBe(true);
      }
    });

    it('should auto-generate unique name when name is omitted', async () => {
      const res1 = await bridge.createObject({ type: 'sphere' });
      const res2 = await bridge.createObject({ type: 'sphere' });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res1.node?.name).not.toBe(res2.node?.name);
      expect(meshes.has(res1.node!.name)).toBe(true);
      expect(meshes.has(res2.node!.name)).toBe(true);
    });
  });

  describe('studio_transform_object', () => {
    it('should perform absolute transform on target mesh', async () => {
      const params: StudioTransformParams = {
        target: 'vehicle_chassis',
        position: { x: 5, y: 10, z: -2 },
        rotation: { x: 0, y: 90, z: 0 },
        scale: 2.0,
        relative: false,
      };

      const result = await bridge.transformObject(params);
      expect(result.success).toBe(true);
      expect(result.node?.position).toEqual({ x: 5, y: 10, z: -2 });

      const mesh = meshes.get('vehicle_chassis')!;
      expect(mesh.position.x).toBe(5);
      expect(mesh.position.y).toBe(10);
      expect(mesh.position.z).toBe(-2);
      expect(mesh.scale.x).toBe(2.0);
    });

    it('should perform relative transform on selected mesh', async () => {
      bridge.selectObject('vehicle_chassis');

      const params: StudioTransformParams = {
        target: 'selected',
        position: { x: 2, y: 1, z: 0 },
        relative: true,
      };

      const result = await bridge.transformObject(params);
      expect(result.success).toBe(true);

      const mesh = meshes.get('vehicle_chassis')!;
      expect(mesh.position.x).toBe(2);
      expect(mesh.position.y).toBe(1);
    });

    it('should return error if target mesh not found', async () => {
      const result = await bridge.transformObject({
        target: 'non_existent_mesh',
        position: { x: 0, y: 0, z: 0 },
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('studio_update_material', () => {
    it('should update PBR physical properties on mesh', async () => {
      const params: StudioMaterialParams = {
        target: 'vehicle_chassis',
        material: {
          color: '#ff0055',
          metalness: 0.9,
          roughness: 0.05,
          transmission: 0.8,
          wireframe: false,
          emissive: '#330011',
          emissiveIntensity: 0.5,
        },
      };

      const result = await bridge.updateMaterial(params);
      expect(result.success).toBe(true);

      const mesh = meshes.get('vehicle_chassis') as THREE.Mesh;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      expect(mat.metalness).toBe(0.9);
      expect(mat.roughness).toBe(0.05);
      expect(mat.wireframe).toBe(false);
    });
  });

  describe('studio_manage_hierarchy', () => {
    it('should select, duplicate, toggle visibility, lock, and delete objects', async () => {
      // 1. Select
      const selectRes = await bridge.manageHierarchy({ action: 'select', target: 'vehicle_chassis' });
      expect(selectRes.success).toBe(true);
      expect(bridge.getSelectedObject()?.name).toBe('vehicle_chassis');

      // 2. Duplicate
      const dupRes = await bridge.manageHierarchy({
        action: 'duplicate',
        target: 'vehicle_chassis',
        offset: { x: 2, y: 0, z: 2 },
      });
      expect(dupRes.success).toBe(true);
      expect(dupRes.node).toBeDefined();
      const dupName = dupRes.node!.name;
      expect(meshes.has(dupName)).toBe(true);

      // 3. Toggle Visibility
      const visRes = await bridge.manageHierarchy({
        action: 'toggle_visibility',
        target: dupName,
        visible: false,
      });
      expect(visRes.success).toBe(true);
      expect(meshes.get(dupName)!.visible).toBe(false);

      // 4. Lock
      const lockRes = await bridge.manageHierarchy({
        action: 'lock',
        target: dupName,
        locked: true,
      });
      expect(lockRes.success).toBe(true);
      expect(dupRes.node?.locked || meshes.get(dupName)!.userData.locked).toBe(true);

      // 5. Delete
      const delRes = await bridge.manageHierarchy({ action: 'delete', target: dupName });
      expect(delRes.success).toBe(true);
      expect(meshes.has(dupName)).toBe(false);
    });

    it('should clear custom created objects with clear_custom and dispose resources', async () => {
      await bridge.createObject({ type: 'box', name: 'custom_1' });
      await bridge.createObject({ type: 'sphere', name: 'custom_2' });
      expect(meshes.has('custom_1')).toBe(true);
      expect(meshes.has('custom_2')).toBe(true);

      const clearRes = await bridge.manageHierarchy({ action: 'clear_custom' });
      expect(clearRes.success).toBe(true);
      expect(meshes.has('custom_1')).toBe(false);
      expect(meshes.has('custom_2')).toBe(false);
      expect(meshes.has('vehicle_chassis')).toBe(true); // Built-in preserved
    });
  });

  describe('Gizmo Mode Guard & Unique Metrics', () => {
    it('should not attach transformControls if gizmoMode is none', () => {
      const mockTransformControls = {
        attached: false,
        attach: function () {
          this.attached = true;
        },
        detach: function () {
          this.attached = false;
        },
      };
      (bridge as any).contextRef.transformControls = mockTransformControls;
      bridge.viewportConfig.update((c) => ({ ...c, gizmoMode: 'none' }));

      bridge.selectObject('vehicle_chassis');
      expect(mockTransformControls.attached).toBe(false);

      bridge.viewportConfig.update((c) => ({ ...c, gizmoMode: 'translate' }));
      bridge.selectObject('vehicle_chassis');
      expect(mockTransformControls.attached).toBe(true);
    });

    it('should accurately calculate scene metrics without double-counting nested meshes', () => {
      const parentGroup = new THREE.Group();
      parentGroup.name = 'compound_group';
      const childMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
      childMesh.name = 'child_mesh';
      parentGroup.add(childMesh);
      scene.add(parentGroup);

      meshes.set('compound_group', parentGroup);
      meshes.set('child_mesh', childMesh);

      bridge.refreshSceneGraph();
      const metrics = bridge.sceneMetrics();
      // Total unique meshes: vehicle_chassis + child_mesh = 2
      expect(metrics.meshesCount).toBe(2);
    });

    it('should only set material.transparent = true when transmission > 0 or opacity < 1.0', async () => {
      await bridge.updateMaterial({
        target: 'vehicle_chassis',
        material: { transmission: 0, opacity: 1.0 },
      });
      const chassisMesh = meshes.get('vehicle_chassis') as THREE.Mesh;
      const mat = chassisMesh.material as THREE.Material;
      expect(mat.transparent).toBe(false);

      await bridge.updateMaterial({
        target: 'vehicle_chassis',
        material: { transmission: 0.5 },
      });
      expect(mat.transparent).toBe(true);
    });
  });

  describe('studio_set_viewport', () => {
    it('should update shading mode and camera presets', async () => {
      const resWireframe = await bridge.setViewport({
        shadingMode: 'wireframe',
        cameraView: 'top',
        showGrid: false,
      });
      expect(resWireframe.success).toBe(true);

      const resPbr = await bridge.setViewport({
        shadingMode: 'pbr',
        cameraView: 'perspective',
        showGrid: true,
      });
      expect(resPbr.success).toBe(true);
    });
  });

  describe('studio_export_gltf', () => {
    it('should export scene without throwing errors', async () => {
      const res = await bridge.exportGltf({ format: 'gltf', target: 'scene' });
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
    });
  });

  /* =========================================================================
     WebMCP CAD Co-Design Tool Suites
     ========================================================================= */

  describe('cad_draw_shape (2D Planar CAD Profiles & Footprints)', () => {
    it('should draw a 2D rectangle footprint on ground with metric dimensions', async () => {
      const res = await bridge.drawShape({
        shape: 'rectangle',
        name: 'Room_Footprint_01',
        origin: { x: 0, y: 0, z: 0 },
        dimensions: { width: 10, length: 8 },
        fill: true,
      });

      expect(res.success).toBe(true);
      expect(res.node).toBeDefined();
      expect(res.node?.name).toBe('Room_Footprint_01');
      expect(meshes.has('Room_Footprint_01')).toBe(true);

      const obj = meshes.get('Room_Footprint_01') as THREE.Mesh;
      expect(obj).toBeDefined();
      expect(obj.userData['isCadShape']).toBe(true);
      expect(obj.userData['shapeType']).toBe('rectangle');
      expect(obj.userData['dimensions']).toEqual({ width: 10, length: 8 });
    });

    it('should draw a 2D circle profile with radius', async () => {
      const res = await bridge.drawShape({
        shape: 'circle',
        name: 'Platform_Circle_01',
        dimensions: { radius: 6 },
      });

      expect(res.success).toBe(true);
      expect(meshes.has('Platform_Circle_01')).toBe(true);
      const obj = meshes.get('Platform_Circle_01') as THREE.Mesh;
      expect(obj.userData['shapeType']).toBe('circle');
    });

    it('should draw 2D polygon with custom points', async () => {
      const res = await bridge.drawShape({
        shape: 'polygon',
        name: 'Polygon_01',
        dimensions: {
          points: [
            { x: 0, y: 0, z: 0 },
            { x: 4, y: 0, z: 0 },
            { x: 3, y: 0, z: 3 },
            { x: 0, y: 0, z: 2 },
          ],
        },
      });

      expect(res.success).toBe(true);
      expect(meshes.has('Polygon_01')).toBe(true);
      const poly = meshes.get('Polygon_01') as THREE.Mesh;
      expect(poly.userData['shapeType']).toBe('polygon');
    });
  });

  describe('cad_push_pull (3D Volume Extrusion)', () => {
    it('should extrude a 2D rectangle footprint into a 3D solid architectural volume', async () => {
      // First draw 2D shape
      await bridge.drawShape({
        shape: 'rectangle',
        name: 'Slab_01',
        dimensions: { width: 6, length: 4 },
      });

      // Push-pull extrude upward by 3.5m
      const res = await bridge.pushPull({
        target: 'Slab_01',
        distance: 3.5,
        direction: 'up',
      });

      expect(res.success).toBe(true);
      expect(res.node).toBeDefined();
      expect(res.node?.name).toBe('Slab_01');

      const extruded = meshes.get('Slab_01') as THREE.Mesh;
      expect(extruded).toBeDefined();
      expect(extruded.userData['isCadExtrusion']).toBe(true);
      expect(extruded.userData['height']).toBe(3.5);

      // Verify bounding box height is approx 3.5m
      const bbox = new THREE.Box3().setFromObject(extruded);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      expect(size.y).toBeCloseTo(3.5, 1);
    });

    it('should extrude circular 2D footprint with cylinder base resting at oldPos.y', async () => {
      await bridge.drawShape({
        shape: 'circle',
        name: 'Circle_Slab',
        dimensions: { radius: 3 },
      });

      const circleObj = meshes.get('Circle_Slab');
      expect(circleObj).toBeDefined();
      const initialY = circleObj!.position.y;

      const res = await bridge.pushPull({
        target: 'Circle_Slab',
        distance: 4.0,
      });

      expect(res.success).toBe(true);
      const cylinder = meshes.get('Circle_Slab') as THREE.Mesh;
      expect(cylinder).toBeDefined();
      expect(cylinder.position.y).toBeCloseTo(initialY + 2.0, 1);
    });

    it('should support direction and bevel parameters', async () => {
      await bridge.drawShape({
        shape: 'rectangle',
        name: 'Box_Beveled',
        dimensions: { width: 2, length: 2 },
      });

      const res = await bridge.pushPull({
        target: 'Box_Beveled',
        distance: 2.0,
        direction: 'down',
        bevel: true,
      });

      expect(res.success).toBe(true);
      const mesh = meshes.get('Box_Beveled');
      expect(mesh?.userData['direction']).toBe('down');
      expect(mesh?.userData['bevel']).toBe(true);
    });

    it('should extrude hollow room enclosure when hollow is true', async () => {
      await bridge.drawShape({
        shape: 'rectangle',
        name: 'Room_Walls',
        dimensions: { width: 8, length: 6 },
      });

      const res = await bridge.pushPull({
        target: 'Room_Walls',
        distance: 3.0,
        hollow: true,
      });

      expect(res.success).toBe(true);
      const room = meshes.get('Room_Walls');
      expect(room).toBeDefined();
      expect(room?.userData['hollow']).toBe(true);
    });
  });

  describe('cad_place_component (Architectural & Interior Assets)', () => {
    it('should place desk, chair, sofa, door, window, column, pedestal, cyber_car, and lamp', async () => {
      const components: CadComponentType[] = [
        'desk',
        'chair',
        'sofa',
        'door',
        'window',
        'column',
        'pedestal',
        'lamp',
        'staircase',
        'tree',
        'cyber_car',
      ];

      for (const comp of components) {
        const res = await bridge.placeComponent({
          componentType: comp,
          name: `Asset_${comp}`,
          position: { x: 2, y: 0, z: -2 },
          rotationY: 45,
          scale: 1,
        });

        expect(res.success).toBe(true);
        expect(res.node?.name).toBe(`Asset_${comp}`);
        expect(meshes.has(`Asset_${comp}`)).toBe(true);

        const asset = meshes.get(`Asset_${comp}`);
        expect(asset?.userData['isComponent']).toBe(true);
        expect(asset?.userData['componentType']).toBe(comp);
      }
    });

    it('should place component with preset material and custom scale vector', async () => {
      const res = await bridge.placeComponent({
        componentType: 'column',
        name: 'Marble_Column_01',
        position: { x: 4, y: 0, z: 4 },
        scale: { x: 1.2, y: 1.5, z: 1.2 },
        materialPreset: 'marble_carrara',
      });

      expect(res.success).toBe(true);
      const col = meshes.get('Marble_Column_01');
      expect(col).toBeDefined();
      expect(col?.scale.y).toBe(1.5);
    });
  });

  describe('cad_apply_material (Architectural PBR Presets)', () => {
    it('should apply architectural materials (concrete, wood_oak, brick_red, glass_frosted, marble_carrara, steel_brushed, tile_subway)', async () => {
      const presets: CadMaterialPreset[] = [
        'concrete',
        'wood_oak',
        'brick_red',
        'glass_frosted',
        'marble_carrara',
        'steel_brushed',
        'tile_subway',
        'gold',
        'neon_cyan',
        'matte_dark',
        'plaster_white',
      ];

      for (const preset of presets) {
        const res = await bridge.applyMaterial({
          target: 'vehicle_chassis',
          materialPreset: preset,
        });

        expect(res.success).toBe(true);
        const chassis = meshes.get('vehicle_chassis') as THREE.Mesh;
        const mat = chassis.material as THREE.MeshStandardMaterial;
        expect(mat).toBeDefined();
      }
    });

    it('should override preset roughness and metalness when specified', async () => {
      const res = await bridge.applyMaterial({
        target: 'vehicle_chassis',
        materialPreset: 'concrete',
        roughness: 0.2,
        metalness: 0.8,
      });

      expect(res.success).toBe(true);
      const chassis = meshes.get('vehicle_chassis') as THREE.Mesh;
      const mat = chassis.material as THREE.MeshStandardMaterial;
      expect(mat.roughness).toBe(0.2);
      expect(mat.metalness).toBe(0.8);
    });
  });

  describe('cad_measure (Spatial Telemetry & Area Computation)', () => {
    beforeEach(async () => {
      // Create two reference objects
      await bridge.createObject({
        type: 'box',
        name: 'Desk_01',
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 2, height: 1, depth: 1 },
      });

      await bridge.createObject({
        type: 'box',
        name: 'Chair_01',
        position: { x: 3, y: 0, z: 4 }, // Distance = sqrt(3^2 + 4^2) = 5.0
        dimensions: { width: 1, height: 1, depth: 1 },
      });
    });

    it('should compute exact Euclidean distance between two objects', async () => {
      const res = await bridge.measure({
        targetA: 'Desk_01',
        targetB: 'Chair_01',
        measurementType: 'distance',
      });

      expect(res.success).toBe(true);
      expect(res.data?.distance).toBeCloseTo(5.0, 1);
      expect(res.data?.formatted).toContain('5.00 m');
    });

    it('should measure whole scene bounding box safely with targetA === "scene" or null', async () => {
      const res = await bridge.measure({
        targetA: 'scene',
        measurementType: 'bounding_box',
      });

      expect(res.success).toBe(true);
      expect(res.data?.boundingBox).toBeDefined();
      expect(res.data?.boundingBox?.width).toBeGreaterThan(0);
    });

    it('should compute circular floor area with radius as Math.PI * r^2', async () => {
      await bridge.drawShape({
        shape: 'circle',
        name: 'Round_Fountain',
        dimensions: { radius: 2 },
      });

      const res = await bridge.measure({
        targetA: 'Round_Fountain',
        measurementType: 'floor_area',
      });

      expect(res.success).toBe(true);
      // Math.PI * 2 * 2 = 12.57 m²
      expect(res.data?.floorArea).toBeCloseTo(Math.PI * 4, 1);
    });

    it('should compute bounding box dimensions and surface floor area', async () => {
      const boxRes = await bridge.measure({
        targetA: 'Desk_01',
        measurementType: 'bounding_box',
      });

      expect(boxRes.success).toBe(true);
      expect(boxRes.data?.boundingBox?.width).toBeCloseTo(2.0, 1);
      expect(boxRes.data?.boundingBox?.depth).toBeCloseTo(1.0, 1);

      const areaRes = await bridge.measure({
        targetA: 'Desk_01',
        measurementType: 'floor_area',
      });

      expect(areaRes.success).toBe(true);
      expect(areaRes.data?.floorArea).toBeCloseTo(2.0, 1); // 2m x 1m = 2 m²
      expect(areaRes.data?.unit).toBe('m²');
    });

    it('should compute volume and clearance distance', async () => {
      const volRes = await bridge.measure({
        targetA: 'Desk_01',
        measurementType: 'volume',
      });
      expect(volRes.success).toBe(true);
      expect(volRes.data?.volume).toBeCloseTo(2.0, 1); // 2 * 1 * 1 = 2 m³

      const clearRes = await bridge.measure({
        targetA: 'Desk_01',
        targetB: 'Chair_01',
        measurementType: 'clearance',
      });
      expect(clearRes.success).toBe(true);
      expect(clearRes.data?.clearance).toBeGreaterThan(0);
    });
  });

  describe('Backward compatibility with scene_3d_action', () => {
    it('should execute rotate and change_mesh_color legacy actions', async () => {
      const colorRes = await bridge.executeSceneAction({
        action: 'change_mesh_color',
        meshName: 'vehicle_chassis',
        hexColor: '#123456',
      });
      expect(colorRes.success).toBe(true);

      const orbitRes = await bridge.executeSceneAction({
        action: 'rotate',
        deltaX: 45,
        durationMs: 10,
      });
      expect(orbitRes.success).toBe(true);
    });
  });

  describe('Procedural Spawn Pop-In Scale Animation (animateSpawnPopIn)', () => {
    it('should pop-in animate scale on createObject, drawShape, and placeComponent', async () => {
      // 1. Primitive creation
      const boxRes = await bridge.createObject({
        type: 'box',
        name: 'popin_box',
        scale: 2.0,
      });
      expect(boxRes.success).toBe(true);
      const boxMesh = meshes.get('popin_box')!;
      expect(boxMesh.scale.x).toBe(2.0);
      expect(boxMesh.scale.y).toBe(2.0);
      expect(boxMesh.scale.z).toBe(2.0);

      // 2. CAD shape drawing
      const shapeRes = await bridge.drawShape({
        shape: 'rectangle',
        name: 'popin_rect',
        dimensions: { width: 5, length: 5 },
      });
      expect(shapeRes.success).toBe(true);
      const rectMesh = meshes.get('popin_rect')!;
      expect(rectMesh.scale.x).toBe(1.0);
      expect(rectMesh.scale.y).toBe(1.0);
      expect(rectMesh.scale.z).toBe(1.0);

      // 3. Component placement
      const compRes = await bridge.placeComponent({
        componentType: 'chair',
        name: 'popin_chair',
        scale: 1.5,
      });
      expect(compRes.success).toBe(true);
      const chairObj = meshes.get('popin_chair')!;
      expect(chairObj.scale.x).toBe(1.5);
      expect(chairObj.scale.y).toBe(1.5);
      expect(chairObj.scale.z).toBe(1.5);
    });

    it('should calculate cubic-out easing correctly for animateSpawnPopIn helper', async () => {
      const testObj = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
      testObj.scale.set(0.001, 0.001, 0.001);

      // Direct call to helper method
      await bridge.animateSpawnPopIn(testObj, new THREE.Vector3(3, 4, 5), 0);
      expect(testObj.scale.x).toBe(3);
      expect(testObj.scale.y).toBe(4);
      expect(testObj.scale.z).toBe(5);
    });
  });

  describe('cad_push_pull Solid Geometry Conversion & Memory Management', () => {
    it('should seamlessly convert 2D planar profile into 3D architectural solid volume', async () => {
      // 1. Draw 2D profile
      await bridge.drawShape({
        shape: 'rectangle',
        name: 'floor_plan_profile',
        dimensions: { width: 6, length: 4 },
        materialPreset: 'brick_red',
      });

      const profileMesh = meshes.get('floor_plan_profile') as THREE.Mesh;
      expect(profileMesh).toBeDefined();
      const profileGeo = profileMesh.geometry;
      let geoDisposed = false;
      profileGeo.addEventListener('dispose', () => {
        geoDisposed = true;
      });

      // 2. Push-pull into 3D solid
      const pushRes = await bridge.pushPull({
        target: 'floor_plan_profile',
        distance: 3.5,
        direction: 'up',
      });

      expect(pushRes.success).toBe(true);
      expect(geoDisposed).toBe(true);

      const solidObj = meshes.get('floor_plan_profile') as THREE.Mesh;
      expect(solidObj).toBeDefined();
      expect(solidObj.userData['isCadExtrusion']).toBe(true);
      expect(solidObj.userData['height']).toBe(3.5);
      expect(solidObj.geometry).toBeInstanceOf(THREE.BoxGeometry);

      // 3. Node metadata verification
      const node = bridge.selectedNode();
      expect(node?.name).toBe('floor_plan_profile');
      expect(node?.position.y).toBe(1.75); // (0 + 3.5/2)
    });

    it('should convert circle profile into 3D cylinder solid', async () => {
      await bridge.drawShape({
        shape: 'circle',
        name: 'column_profile',
        dimensions: { radius: 1.5 },
      });

      const pushRes = await bridge.pushPull({
        target: 'column_profile',
        distance: 4.0,
      });

      expect(pushRes.success).toBe(true);
      const solidObj = meshes.get('column_profile') as THREE.Mesh;
      expect(solidObj.geometry).toBeInstanceOf(THREE.CylinderGeometry);
      expect(solidObj.userData['shapeType']).toBe('circle');
    });
  });

  describe('Systematic Resource Disposal (Zero-Leak Geometries, Materials, Textures)', () => {
    it('should systematically dispose geometry, materials, and textures when deleting hierarchy nodes', async () => {
      const texture = new THREE.Texture();
      let textureDisposed = false;
      texture.dispose = () => {
        textureDisposed = true;
      };

      const geo = new THREE.BoxGeometry();
      let geoDisposed = false;
      geo.addEventListener('dispose', () => {
        geoDisposed = true;
      });

      const mat = new THREE.MeshStandardMaterial({ map: texture });
      let matDisposed = false;
      mat.addEventListener('dispose', () => {
        matDisposed = true;
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = 'disposable_mesh';
      scene.add(mesh);
      meshes.set('disposable_mesh', mesh);

      // Delete node
      const delRes = await bridge.manageHierarchy({
        action: 'delete',
        target: 'disposable_mesh',
      });

      expect(delRes.success).toBe(true);
      expect(meshes.has('disposable_mesh')).toBe(false);
      expect(geoDisposed).toBe(true);
      expect(matDisposed).toBe(true);
      expect(textureDisposed).toBe(true);
    });

    it('should clear all custom nodes and dispose resources with clear_custom action', async () => {
      await bridge.createObject({ type: 'cone', name: 'custom_cone_1' });
      await bridge.createObject({ type: 'sphere', name: 'custom_sphere_2' });

      expect(meshes.has('custom_cone_1')).toBe(true);
      expect(meshes.has('custom_sphere_2')).toBe(true);

      const clearRes = await bridge.manageHierarchy({ action: 'clear_custom' });
      expect(clearRes.success).toBe(true);
      expect(meshes.has('custom_cone_1')).toBe(false);
      expect(meshes.has('custom_sphere_2')).toBe(false);
    });
  });
});


