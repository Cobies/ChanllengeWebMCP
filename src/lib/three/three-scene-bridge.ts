import { Injectable, inject, signal } from '@angular/core';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { WebMcpService } from '../core/webmcp.service';
import {
  Scene3DActionParams,
  Scene3DActionResult,
  Scene3DActionType,
  StudioCreateObjectParams,
  StudioExportParams,
  StudioHierarchyParams,
  StudioMaterialConfig,
  StudioMaterialParams,
  StudioPrimitiveType,
  StudioSceneNode,
  StudioToolResult,
  StudioTransformParams,
  StudioViewportParams,
  WebMcpToolDefinition,
  CadDrawShapeParams,
  CadPushPullParams,
  CadPlaceComponentParams,
  CadApplyMaterialParams,
  CadMeasureParams,
  CadMeasureResultData,
  CadShapeType,
  CadComponentType,
  CadMaterialPreset,
} from '../core/webmcp.types';
import { Scene3DActionBus } from './scene-action-bus';
import { CameraInterpolator, CameraState } from './camera-interpolator';

export interface SceneContextRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  meshes: Map<string, THREE.Mesh | THREE.Object3D>;
  defaultCameraState?: CameraState;
  selectionBox?: THREE.BoxHelper;
  gridHelper?: THREE.GridHelper;
  dirLight?: THREE.DirectionalLight;
  pointLight?: THREE.PointLight;
  transformControls?: any;
  orbitControls?: any;
  onSelectionChange?: (mesh: THREE.Object3D | null) => void;
  onHierarchyChange?: () => void;
  onViewportChange?: (config: StudioViewportParams) => void;
}

@Injectable({
  providedIn: 'root',
})
export class WebmcpThreeSceneBridge {
  private readonly webmcp: WebMcpService;
  private readonly actionBus: Scene3DActionBus;

  private contextRef: SceneContextRef | null = null;
  private defaultCameraState: CameraState = {
    position: { x: 4.5, y: 2.5, z: 5.5 },
    target: { x: 0, y: 0, z: 0 },
  };

  private selectedObject: THREE.Object3D | null = null;
  private customObjectCounter = 1;

  // Reactive State Signals for Direct UI Binding
  readonly selectedNode = signal<StudioSceneNode | null>(null);
  readonly sceneNodes = signal<StudioSceneNode[]>([]);
  readonly viewportConfig = signal<StudioViewportParams>({
    shadingMode: 'pbr',
    cameraView: 'perspective',
    showGrid: true,
    showShadows: true,
    gizmoMode: 'translate',
  });
  readonly sceneMetrics = signal<{
    triangles: number;
    vertices: number;
    fps: number;
    meshesCount: number;
  }>({
    triangles: 0,
    vertices: 0,
    fps: 60,
    meshesCount: 0,
  });

  constructor(webmcp?: WebMcpService, actionBus?: Scene3DActionBus) {
    this.webmcp = webmcp || inject(WebMcpService);
    this.actionBus = actionBus || inject(Scene3DActionBus);
    this.actionBus.registerExecutor((params) => this.executeSceneAction(params));
    this.registerAllTools();
  }

  /**
   * Bind the active Three.js scene references.
   */
  bindScene(ref: SceneContextRef): void {
    this.contextRef = ref;
    if (ref.defaultCameraState) {
      this.defaultCameraState = ref.defaultCameraState;
    } else if (ref.camera) {
      this.defaultCameraState = {
        position: {
          x: ref.camera.position.x,
          y: ref.camera.position.y,
          z: ref.camera.position.z,
        },
        target: { x: 0, y: 0, z: 0 },
      };
    }
    this.refreshSceneGraph();
  }

  /**
   * Unbind scene references upon component destruction.
   */
  unbindScene(): void {
    this.selectedObject = null;
    this.selectedNode.set(null);
    this.contextRef = null;
  }

  /**
   * Get currently selected Object3D.
   */
  getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }

  /**
   * Set active selection by object name, Object3D, or null.
   */
  selectObject(target: string | THREE.Object3D | null): StudioSceneNode | null {
    if (!this.contextRef) {
      this.selectedObject = null;
      this.selectedNode.set(null);
      return null;
    }

    if (!target || target === 'none') {
      this.selectedObject = null;
      this.selectedNode.set(null);
      if (this.contextRef.selectionBox) {
        this.contextRef.selectionBox.visible = false;
      }
      if (this.contextRef.transformControls) {
        this.contextRef.transformControls.detach();
      }
      this.contextRef.onSelectionChange?.(null);
      return null;
    }

    let obj: THREE.Object3D | undefined;
    if (typeof target === 'string') {
      obj = this.contextRef.meshes.get(target);
    } else {
      obj = target;
    }

    if (!obj) {
      this.selectedObject = null;
      this.selectedNode.set(null);
      if (this.contextRef.selectionBox) {
        this.contextRef.selectionBox.visible = false;
      }
      if (this.contextRef.transformControls) {
        this.contextRef.transformControls.detach();
      }
      this.contextRef.onSelectionChange?.(null);
      return null;
    }

    this.selectedObject = obj;
    const node = this.extractNodeMetadata(obj);
    this.selectedNode.set(node);

    // Update selection box
    if (this.contextRef.selectionBox) {
      this.contextRef.selectionBox.setFromObject(obj);
      this.contextRef.selectionBox.visible = true;
    }

    // Attach transform controls
    if (
      this.contextRef.transformControls &&
      !obj.userData['locked'] &&
      this.viewportConfig().gizmoMode !== 'none'
    ) {
      this.contextRef.transformControls.attach(obj);
    }

    this.contextRef.onSelectionChange?.(obj);
    return node;
  }

  /**
   * Recalculate scene graph tree and polygon count metrics.
   */
  refreshSceneGraph(): void {
    if (!this.contextRef) {
      this.sceneNodes.set([]);
      this.sceneMetrics.set({ triangles: 0, vertices: 0, fps: 60, meshesCount: 0 });
      return;
    }

    const nodes: StudioSceneNode[] = [];
    let totalTriangles = 0;
    let totalVertices = 0;
    let meshesCount = 0;
    const uniqueMeshes = new Set<THREE.Mesh>();

    this.contextRef.meshes.forEach((obj) => {
      const node = this.extractNodeMetadata(obj);
      nodes.push(node);

      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          uniqueMeshes.add(child);
        }
      });
    });

    uniqueMeshes.forEach((mesh) => {
      meshesCount++;
      const geo = mesh.geometry;
      if (geo.index) {
        totalTriangles += geo.index.count / 3;
      } else if (geo.attributes['position']) {
        totalTriangles += geo.attributes['position'].count / 3;
      }
      if (geo.attributes['position']) {
        totalVertices += geo.attributes['position'].count;
      }
    });

    this.sceneNodes.set(nodes);
    this.sceneMetrics.update((current) => ({
      ...current,
      triangles: Math.round(totalTriangles),
      vertices: Math.round(totalVertices),
      meshesCount,
    }));

    this.contextRef.onHierarchyChange?.();
  }

  // =========================================================================
  // WebMCP DCC Tool Registration
  // =========================================================================

  public registerAllTools(): void {
    // 1. studio_create_object
    this.webmcp.registerTool({
      name: 'studio_create_object',
      description:
        'Instantiates a procedural 3D primitive (box, sphere, cylinder, cone, torus, torus_knot, plane, pedestal, light, text) with customized PBR physical materials into the active 3D scene.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of 3D primitive or light to spawn',
            enum: [
              'box',
              'sphere',
              'cylinder',
              'cone',
              'torus',
              'torus_knot',
              'plane',
              'pedestal',
              'light',
              'text',
            ],
          },
          name: {
            type: 'string',
            description: 'Unique name identifier for the scene graph node',
          },
          position: {
            type: 'object',
            description: 'Position coordinates {x, y, z}',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          rotation: {
            type: 'object',
            description: 'Euler rotation angles in degrees {x, y, z}',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          scale: {
            description: 'Uniform scale multiplier (number) or scale dimensions {x, y, z}',
            oneOf: [
              { type: 'number' },
              {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            ],
          },
          dimensions: {
            type: 'object',
            description:
              'Procedural primitive dimensions (width, height, depth, radius, tube, radialSegments, tubularSegments, text, fontSize)',
            properties: {
              width: { type: 'number' },
              height: { type: 'number' },
              depth: { type: 'number' },
              radius: { type: 'number' },
              tube: { type: 'number' },
              radialSegments: { type: 'number' },
              tubularSegments: { type: 'number' },
              text: { type: 'string' },
              fontSize: { type: 'number' },
            },
          },
          lightType: {
            type: 'string',
            description: 'Type of light when spawning a light source',
            enum: ['point', 'directional', 'spot', 'ambient'],
          },
          lightColor: {
            type: 'string',
            description: 'Light color hex or CSS string (e.g. "#ffffff")',
          },
          lightIntensity: {
            type: 'number',
            description: 'Light intensity scalar multiplier',
          },
          material: {
            type: 'object',
            description: 'PBR physical material properties (color, metalness, roughness, transmission, emissive, opacity, wireframe)',
            properties: {
              color: { type: 'string' },
              metalness: { type: 'number' },
              roughness: { type: 'number' },
              transmission: { type: 'number' },
              emissive: { type: 'string' },
              emissiveIntensity: { type: 'number' },
              opacity: { type: 'number' },
              wireframe: { type: 'boolean' },
            },
          },
        },
        required: ['type'],
      },
      handler: async (params: StudioCreateObjectParams) => this.createObject(params),
    });

    // 2. studio_transform_object
    this.webmcp.registerTool({
      name: 'studio_transform_object',
      description:
        'Modifies the position, rotation, and scale transforms of a target 3D object or the currently selected object.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target mesh identifier in scene, or "selected" for active object',
          },
          position: {
            type: 'object',
            description: 'Target position {x, y, z}',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          rotation: {
            type: 'object',
            description: 'Target rotation angles in degrees {x, y, z}',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          scale: {
            description: 'Uniform scale factor (number) or scale vector {x, y, z}',
            oneOf: [
              { type: 'number' },
              {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            ],
          },
          relative: {
            type: 'boolean',
            description: 'If true, adds delta values relative to current transform instead of absolute set',
          },
        },
      },
      handler: async (params: StudioTransformParams) => this.transformObject(params),
    });

    // 3. studio_update_material
    this.webmcp.registerTool({
      name: 'studio_update_material',
      description:
        'Updates the PBR physical material properties (color, metalness, roughness, transmission glass, emissive glow, wireframe) of a target object.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target mesh identifier or "selected"',
          },
          material: {
            type: 'object',
            description: 'PBR material parameters',
            properties: {
              color: { type: 'string' },
              metalness: { type: 'number' },
              roughness: { type: 'number' },
              transmission: { type: 'number' },
              emissive: { type: 'string' },
              emissiveIntensity: { type: 'number' },
              opacity: { type: 'number' },
              wireframe: { type: 'boolean' },
            },
            required: [],
          },
        },
        required: ['material'],
      },
      handler: async (params: StudioMaterialParams) => this.updateMaterial(params),
    });

    // 4. studio_manage_hierarchy
    this.webmcp.registerTool({
      name: 'studio_manage_hierarchy',
      description:
        'Performs scene graph hierarchy management: select, duplicate, delete, toggle_visibility, lock, clear_custom, or reset_scene.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Hierarchy action command',
            enum: [
              'select',
              'duplicate',
              'delete',
              'toggle_visibility',
              'lock',
              'clear_custom',
              'reset_scene',
            ],
          },
          target: {
            type: 'string',
            description: 'Identifier of the target mesh or node',
          },
          visible: {
            type: 'boolean',
            description: 'Explicit visibility flag for toggle_visibility',
          },
          locked: {
            type: 'boolean',
            description: 'Explicit lock state for lock action',
          },
        },
        required: ['action'],
      },
      handler: async (params: StudioHierarchyParams) => this.manageHierarchy(params),
    });

    // 5. studio_set_viewport
    this.webmcp.registerTool({
      name: 'studio_set_viewport',
      description:
        'Configures viewport rendering styles (pbr, wireframe, solid, normal), camera view presets (perspective, top, front, side, iso), and gizmo modes.',
      parameters: {
        type: 'object',
        properties: {
          shadingMode: {
            type: 'string',
            enum: ['pbr', 'wireframe', 'solid', 'normal'],
            description: 'WebGL shader pass rendering mode',
          },
          cameraView: {
            type: 'string',
            enum: ['perspective', 'top', 'front', 'side', 'iso'],
            description: 'Standard CAD / DCC camera angle preset',
          },
          showGrid: {
            type: 'boolean',
            description: 'Toggle floor reference grid visibility',
          },
          showShadows: {
            type: 'boolean',
            description: 'Toggle shadow mapping pass',
          },
          gizmoMode: {
            type: 'string',
            enum: ['translate', 'rotate', 'scale', 'none'],
            description: 'Transform gizmo interaction mode',
          },
        },
      },
      handler: async (params: StudioViewportParams) => this.setViewport(params),
    });

    // 6. studio_export_gltf
    this.webmcp.registerTool({
      name: 'studio_export_gltf',
      description:
        'Exports the current 3D scene or selected mesh as an industry-standard GLTF or binary GLB file.',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['gltf', 'glb'],
            description: 'Export file format (default: glb)',
          },
          target: {
            type: 'string',
            enum: ['scene', 'selected'],
            description: 'Target export scope',
          },
        },
      },
      handler: async (params: StudioExportParams) => this.exportGltf(params),
    });

    // 7. scene_3d_action (Legacy Backward Compatibility)
    const legacyTool: WebMcpToolDefinition<Scene3DActionParams, Scene3DActionResult> = {
      name: 'scene_3d_action',
      description:
        'Manipulates the interactive 3D WebGL viewport: orbit rotation, camera zoom, mesh material colors, animations, part highlighting, and camera resets.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'rotate',
              'zoom',
              'change_mesh_color',
              'play_animation',
              'reset_camera',
              'highlight_part',
            ],
          },
          deltaX: { type: 'number' },
          deltaY: { type: 'number' },
          zoomFactor: { type: 'number' },
          meshName: { type: 'string' },
          hexColor: { type: 'string' },
          clipName: { type: 'string' },
          durationMs: { type: 'number', default: 600 },
        },
        required: ['action'],
      },
      handler: async (params: Scene3DActionParams) => {
        return await this.actionBus.enqueueAction(params);
      },
    };
    this.webmcp.registerTool(legacyTool);

    // 8. cad_draw_shape
    this.webmcp.registerTool({
      name: 'cad_draw_shape',
      description:
        'Draws 2D planar profiles, architectural floor plan footprints, walls, rectangles, circles, or polylines on ground or entity faces.',
      parameters: {
        type: 'object',
        properties: {
          shape: {
            type: 'string',
            description: '2D shape geometry type to generate',
            enum: ['rectangle', 'circle', 'line', 'polyline', 'wall', 'polygon'],
          },
          name: {
            type: 'string',
            description: 'Unique identifier name for the 2D CAD profile node',
          },
          plane: {
            type: 'string',
            description: 'Projection plane (default: ground/xz)',
            enum: ['xz', 'xy', 'yz', 'ground'],
          },
          origin: {
            type: 'object',
            description: 'Start origin coordinates {x, y, z}',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          dimensions: {
            type: 'object',
            description: 'Metric dimensions for the 2D shape (width, length, radius, wallThickness, points)',
            properties: {
              width: { type: 'number' },
              length: { type: 'number' },
              radius: { type: 'number' },
              wallThickness: { type: 'number' },
              height: { type: 'number' },
              points: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                    z: { type: 'number' },
                  },
                },
              },
            },
          },
          fill: {
            type: 'boolean',
            description: 'Whether to fill the 2D shape face with solid surface (default: true)',
          },
          materialPreset: {
            type: 'string',
            description: 'Architectural PBR material preset',
            enum: [
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
            ],
          },
        },
        required: ['shape'],
      },
      handler: async (params: CadDrawShapeParams) => this.drawShape(params),
    });

    // 9. cad_push_pull
    this.webmcp.registerTool({
      name: 'cad_push_pull',
      description:
        'Extrudes a 2D planar profile or target face into a 3D architectural solid volume (slab, wall, room, column).',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target 2D shape or mesh name in scene (or "selected")',
          },
          distance: {
            type: 'number',
            description: 'Metric extrusion distance in meters (e.g. 3.2)',
          },
          direction: {
            type: 'string',
            description: 'Extrusion vector direction (default: up)',
            enum: ['up', 'down', 'normal', 'x', 'y', 'z'],
          },
          hollow: {
            type: 'boolean',
            description: 'If true, extrudes hollow perimeter room walls with open ceiling',
          },
          bevel: {
            type: 'boolean',
            description: 'If true, adds subtle architectural edge beveling',
          },
          materialPreset: {
            type: 'string',
            description: 'Architectural PBR material preset to assign to extruded volume',
            enum: [
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
            ],
          },
        },
        required: ['target', 'distance'],
      },
      handler: async (params: CadPushPullParams) => this.pushPull(params),
    });

    // 10. cad_place_component
    this.webmcp.registerTool({
      name: 'cad_place_component',
      description:
        'Instantiates pre-built architectural and interior design assets (desk, chair, sofa, door, window, column, pedestal, staircase, tree, car, lamp) into the CAD scene.',
      parameters: {
        type: 'object',
        properties: {
          componentType: {
            type: 'string',
            description: 'Architectural asset archetype to place',
            enum: [
              'desk',
              'chair',
              'sofa',
              'door',
              'window',
              'column',
              'pedestal',
              'staircase',
              'tree',
              'car',
              'cyber_car',
              'lamp',
            ],
          },
          name: {
            type: 'string',
            description: 'Unique name identifier for the component node',
          },
          position: {
            type: 'object',
            description: 'World position {x, y, z} in meters',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          rotationY: {
            type: 'number',
            description: 'Rotation around vertical Y axis in degrees',
          },
          scale: {
            description: 'Uniform scale factor (number) or dimension scale vector {x, y, z}',
            oneOf: [
              { type: 'number' },
              {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            ],
          },
          materialPreset: {
            type: 'string',
            description: 'Material preset to override asset surfaces',
            enum: [
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
            ],
          },
        },
        required: ['componentType'],
      },
      handler: async (params: CadPlaceComponentParams) => this.placeComponent(params),
    });

    // 11. cad_apply_material
    this.webmcp.registerTool({
      name: 'cad_apply_material',
      description:
        'Applies architectural PBR materials (concrete, oak wood, red brick, frosted glass, marble, brushed metal, ceramic tile) to entities or individual faces.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target mesh identifier or "selected"',
          },
          materialPreset: {
            type: 'string',
            description: 'Architectural PBR preset type',
            enum: [
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
            ],
          },
          color: { type: 'string', description: 'Hex color override (e.g. "#94a3b8")' },
          roughness: { type: 'number', description: 'Roughness override (0.0 to 1.0)' },
          metalness: { type: 'number', description: 'Metalness override (0.0 to 1.0)' },
          opacity: { type: 'number', description: 'Opacity override (0.0 to 1.0)' },
          transmission: { type: 'number', description: 'Optical transmission for glass' },
          clearcoat: { type: 'number', description: 'Clearcoat shine (0.0 to 1.0)' },
          wireframe: { type: 'boolean', description: 'Wireframe display flag' },
        },
        required: ['target', 'materialPreset'],
      },
      handler: async (params: CadApplyMaterialParams) => this.applyMaterial(params),
    });

    // 12. cad_measure
    this.webmcp.registerTool({
      name: 'cad_measure',
      description:
        'Inspects geometric entities to calculate 3D distances, bounding box dimensions, surface floor areas (m²), volume, and spatial clearances.',
      parameters: {
        type: 'object',
        properties: {
          targetA: {
            type: 'string',
            description: 'First target entity name (or "scene" for entire environment)',
          },
          targetB: {
            type: 'string',
            description: 'Second target entity name (for distance and clearance measurements)',
          },
          measurementType: {
            type: 'string',
            description: 'Type of spatial measurement to perform',
            enum: ['distance', 'bounding_box', 'floor_area', 'volume', 'clearance'],
          },
        },
        required: ['targetA', 'measurementType'],
      },
      handler: async (params: CadMeasureParams) => this.measure(params),
    });
  }

  /**
   * Cleanly unregister all 3D DCC and CAD tools from WebMcpService.
   */
  public unregisterAllTools(): void {
    const tools = [
      'studio_create_object',
      'studio_transform_object',
      'studio_update_material',
      'studio_manage_hierarchy',
      'studio_set_viewport',
      'studio_export_gltf',
      'scene_3d_action',
      'cad_draw_shape',
      'cad_push_pull',
      'cad_place_component',
      'cad_apply_material',
      'cad_measure',
    ];
    for (const tool of tools) {
      this.webmcp.unregisterTool(tool);
    }
  }

  // =========================================================================
  // Tool Implementation Handlers
  // =========================================================================

  /**
   * Create procedural primitive object with PBR material.
   */
  async createObject(params: StudioCreateObjectParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene is currently bound' };
    }

    const { scene, meshes } = this.contextRef;
    const name = params.name || `${params.type}_${this.customObjectCounter++}`;

    // 1. Build Geometry / Light
    let object3D: THREE.Object3D;
    const matConfig: StudioMaterialConfig = {
      color: params.material?.color || '#00f0ff',
      metalness: params.material?.metalness ?? 0.8,
      roughness: params.material?.roughness ?? 0.2,
      transmission: params.material?.transmission ?? 0.0,
      emissive: params.material?.emissive || '#000000',
      emissiveIntensity: params.material?.emissiveIntensity ?? 0.2,
      opacity: params.material?.opacity ?? 1.0,
      transparent: params.material?.transparent,
      wireframe: params.material?.wireframe ?? false,
    };

    const isTransparent =
      matConfig.transparent ??
      ((matConfig.transmission ?? 0) > 0 ||
        (matConfig.opacity !== undefined && matConfig.opacity < 1.0));

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(matConfig.color),
      metalness: matConfig.metalness,
      roughness: matConfig.roughness,
      transmission: matConfig.transmission,
      emissive: new THREE.Color(matConfig.emissive),
      emissiveIntensity: matConfig.emissiveIntensity,
      opacity: matConfig.opacity,
      transparent: isTransparent,
      wireframe: matConfig.wireframe,
    });

    const dim = params.dimensions || {};

    switch (params.type) {
      case 'box': {
        const geo = new THREE.BoxGeometry(dim.width || 1.2, dim.height || 1.2, dim.depth || 1.2);
        object3D = new THREE.Mesh(geo, material);
        break;
      }
      case 'sphere': {
        const geo = new THREE.SphereGeometry(dim.radius || 0.8, 32, 16);
        object3D = new THREE.Mesh(geo, material);
        break;
      }
      case 'cylinder': {
        const geo = new THREE.CylinderGeometry(dim.radius || 0.6, dim.radius || 0.6, dim.height || 1.4, 32);
        object3D = new THREE.Mesh(geo, material);
        break;
      }
      case 'cone': {
        const geo = new THREE.ConeGeometry(dim.radius || 0.8, dim.height || 1.5, 32);
        object3D = new THREE.Mesh(geo, material);
        break;
      }
      case 'torus': {
        const geo = new THREE.TorusGeometry(dim.radius || 0.8, dim.tube || 0.25, 16, 64);
        object3D = new THREE.Mesh(geo, material);
        break;
      }
      case 'torus_knot': {
        const geo = new THREE.TorusKnotGeometry(dim.radius || 0.7, dim.tube || 0.2, 64, 16);
        object3D = new THREE.Mesh(geo, material);
        break;
      }
      case 'plane': {
        const geo = new THREE.PlaneGeometry(dim.width || 2.5, dim.height || 2.5);
        object3D = new THREE.Mesh(geo, material);
        object3D.rotation.x = -Math.PI / 2;
        break;
      }
      case 'pedestal': {
        const group = new THREE.Group();
        const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32);
        const baseMesh = new THREE.Mesh(baseGeo, material);
        baseMesh.position.y = 0.1;
        group.add(baseMesh);

        const ringGeo = new THREE.TorusGeometry(1.5, 0.05, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.21;
        group.add(ring);

        object3D = group;
        break;
      }
      case 'light': {
        const lightGroup = new THREE.Group();
        const lightColor = params.lightColor ? new THREE.Color(params.lightColor) : new THREE.Color(0x00f0ff);
        const intensity = params.lightIntensity ?? 2.0;

        let light: THREE.Light;
        if (params.lightType === 'directional') {
          light = new THREE.DirectionalLight(lightColor, intensity);
        } else if (params.lightType === 'spot') {
          light = new THREE.SpotLight(lightColor, intensity);
        } else {
          light = new THREE.PointLight(lightColor, intensity, 25);
        }

        const bulbGeo = new THREE.SphereGeometry(0.18, 16, 8);
        const bulbMat = new THREE.MeshBasicMaterial({ color: lightColor });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);

        lightGroup.add(light);
        lightGroup.add(bulb);
        object3D = lightGroup;
        break;
      }
      case 'text': {
        // High-resolution canvas texture billboard for procedural 3D Typography
        const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
        let textTexture: THREE.CanvasTexture | null = null;
        if (canvas) {
          canvas.width = 512;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 8;
            ctx.strokeRect(8, 8, 496, 240);
            ctx.font = 'bold 44px sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dim.text || 'WebMCP 3D', 256, 128);
          }
          textTexture = new THREE.CanvasTexture(canvas);
        }

        const textPlateMat = new THREE.MeshStandardMaterial({
          map: textTexture,
          color: 0xffffff,
          metalness: 0.5,
          roughness: 0.2,
        });
        const plateGeo = new THREE.BoxGeometry(2.4, 1.2, 0.1);
        object3D = new THREE.Mesh(plateGeo, textPlateMat);
        break;
      }
      default: {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        object3D = new THREE.Mesh(geo, material);
        break;
      }
    }

    object3D.name = name;
    object3D.castShadow = true;
    object3D.receiveShadow = true;
    object3D.userData = {
      isCustom: true,
      locked: false,
      primitiveType: params.type,
      materialConfig: matConfig,
    };

    // Apply Position
    if (params.position) {
      object3D.position.set(
        params.position.x ?? 0,
        params.position.y ?? 0,
        params.position.z ?? 0
      );
    } else {
      object3D.position.set(0, 1, 0);
    }

    // Apply Rotation
    if (params.rotation) {
      object3D.rotation.set(
        ((params.rotation.x ?? 0) * Math.PI) / 180,
        ((params.rotation.y ?? 0) * Math.PI) / 180,
        ((params.rotation.z ?? 0) * Math.PI) / 180
      );
    }

    // Apply Scale
    if (params.scale !== undefined) {
      if (typeof params.scale === 'number') {
        object3D.scale.set(params.scale, params.scale, params.scale);
      } else {
        object3D.scale.set(
          params.scale.x ?? 1,
          params.scale.y ?? 1,
          params.scale.z ?? 1
        );
      }
    }

    scene.add(object3D);
    meshes.set(name, object3D);

    const targetScale = object3D.scale.clone();
    await this.animateSpawnPopIn(object3D, targetScale);

    this.selectObject(object3D);
    this.refreshSceneGraph();

    const node = this.extractNodeMetadata(object3D);
    return {
      success: true,
      action: 'studio_create_object',
      target: name,
      node,
      message: `Created procedural 3D object '${name}' of type '${params.type}'`,
    };
  }

  /**
   * Apply position, rotation, or scale transformation.
   */
  async transformObject(params: StudioTransformParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene bound' };
    }

    let targetObj: THREE.Object3D | undefined;
    if (!params.target || params.target === 'selected') {
      targetObj = this.selectedObject || undefined;
    } else {
      targetObj = this.contextRef.meshes.get(params.target);
    }

    if (!targetObj) {
      return {
        success: false,
        message: `Target mesh '${params.target || 'selected'}' not found in active scene`,
      };
    }

    if (targetObj.userData['locked']) {
      return {
        success: false,
        message: `Target mesh '${targetObj.name}' is locked and cannot be transformed`,
      };
    }

    const isRelative = params.relative ?? false;

    // Position
    if (params.position) {
      if (isRelative) {
        targetObj.position.x += params.position.x ?? 0;
        targetObj.position.y += params.position.y ?? 0;
        targetObj.position.z += params.position.z ?? 0;
      } else {
        if (params.position.x !== undefined) targetObj.position.x = params.position.x;
        if (params.position.y !== undefined) targetObj.position.y = params.position.y;
        if (params.position.z !== undefined) targetObj.position.z = params.position.z;
      }
    }

    // Rotation (degrees to radians)
    if (params.rotation) {
      if (isRelative) {
        targetObj.rotation.x += ((params.rotation.x ?? 0) * Math.PI) / 180;
        targetObj.rotation.y += ((params.rotation.y ?? 0) * Math.PI) / 180;
        targetObj.rotation.z += ((params.rotation.z ?? 0) * Math.PI) / 180;
      } else {
        if (params.rotation.x !== undefined)
          targetObj.rotation.x = (params.rotation.x * Math.PI) / 180;
        if (params.rotation.y !== undefined)
          targetObj.rotation.y = (params.rotation.y * Math.PI) / 180;
        if (params.rotation.z !== undefined)
          targetObj.rotation.z = (params.rotation.z * Math.PI) / 180;
      }
    }

    // Scale
    if (params.scale !== undefined) {
      if (typeof params.scale === 'number') {
        if (isRelative) {
          targetObj.scale.multiplyScalar(params.scale);
        } else {
          targetObj.scale.set(params.scale, params.scale, params.scale);
        }
      } else {
        if (isRelative) {
          targetObj.scale.x *= params.scale.x ?? 1;
          targetObj.scale.y *= params.scale.y ?? 1;
          targetObj.scale.z *= params.scale.z ?? 1;
        } else {
          if (params.scale.x !== undefined) targetObj.scale.x = params.scale.x;
          if (params.scale.y !== undefined) targetObj.scale.y = params.scale.y;
          if (params.scale.z !== undefined) targetObj.scale.z = params.scale.z;
        }
      }
    }

    // Update selection box if active
    if (this.contextRef.selectionBox && this.selectedObject === targetObj) {
      this.contextRef.selectionBox.update();
    }

    const node = this.extractNodeMetadata(targetObj);
    this.selectedNode.set(node);
    this.refreshSceneGraph();

    return {
      success: true,
      action: 'studio_transform_object',
      target: targetObj.name,
      node,
      message: `Transformed '${targetObj.name}' (${isRelative ? 'relative' : 'absolute'})`,
    };
  }

  /**
   * Update PBR Physical Material properties.
   */
  async updateMaterial(params: StudioMaterialParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene bound' };
    }

    let targetObj: THREE.Object3D | undefined;
    if (!params.target || params.target === 'selected') {
      targetObj = this.selectedObject || undefined;
    } else {
      targetObj = this.contextRef.meshes.get(params.target);
    }

    if (!targetObj) {
      return {
        success: false,
        message: `Target mesh '${params.target || 'selected'}' not found`,
      };
    }

    const matConfig = params.material;
    targetObj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (matConfig.color && 'color' in m) {
            m.color = new THREE.Color(matConfig.color);
          }
          if (matConfig.metalness !== undefined && 'metalness' in m) {
            m.metalness = matConfig.metalness;
          }
          if (matConfig.roughness !== undefined && 'roughness' in m) {
            m.roughness = matConfig.roughness;
          }
          if (matConfig.transmission !== undefined && 'transmission' in m) {
            (m as any).transmission = matConfig.transmission;
          }
          if (matConfig.emissive && 'emissive' in m) {
            m.emissive = new THREE.Color(matConfig.emissive);
          }
          if (matConfig.emissiveIntensity !== undefined && 'emissiveIntensity' in m) {
            m.emissiveIntensity = matConfig.emissiveIntensity;
          }
          if (matConfig.opacity !== undefined) {
            m.opacity = matConfig.opacity;
          }
          if (matConfig.wireframe !== undefined && 'wireframe' in m) {
            m.wireframe = matConfig.wireframe;
          }

          const hasTransmission =
            matConfig.transmission !== undefined
              ? matConfig.transmission > 0
              : Boolean('transmission' in m && (m as any).transmission > 0);
          const currentOpacity = matConfig.opacity !== undefined ? matConfig.opacity : m.opacity;
          m.transparent =
            matConfig.transparent ?? (hasTransmission || (currentOpacity !== undefined && currentOpacity < 1.0));
          m.needsUpdate = true;
        });
      }
    });

    if (!targetObj.userData) targetObj.userData = {};
    targetObj.userData['materialConfig'] = {
      ...((targetObj.userData['materialConfig'] as StudioMaterialConfig) || {}),
      ...matConfig,
    };

    const node = this.extractNodeMetadata(targetObj);
    this.selectedNode.set(node);

    return {
      success: true,
      action: 'studio_update_material',
      target: targetObj.name,
      node,
      message: `Updated PBR material for '${targetObj.name}'`,
    };
  }

  /**
   * Scene Hierarchy Actions (Select, Duplicate, Delete, Visibility, Lock, Clear, Reset).
   */
  async manageHierarchy(params: StudioHierarchyParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene bound' };
    }

    const { scene, meshes } = this.contextRef;

    switch (params.action) {
      case 'select': {
        const node = this.selectObject(params.target || null);
        return {
          success: true,
          action: 'select',
          target: params.target,
          node: node || undefined,
          message: node ? `Selected node '${node.name}'` : 'Cleared selection',
        };
      }

      case 'duplicate': {
        let sourceObj: THREE.Object3D | undefined;
        if (!params.target || params.target === 'selected') {
          sourceObj = this.selectedObject || undefined;
        } else {
          sourceObj = meshes.get(params.target);
        }

        if (!sourceObj) {
          return { success: false, message: `Cannot duplicate: source object not found` };
        }

        const clone = sourceObj.clone(true);
        const newName = `${sourceObj.name}_copy_${this.customObjectCounter++}`;
        clone.name = newName;
        clone.userData = {
          ...sourceObj.userData,
          isCustom: true,
          locked: false,
        };

        const offset = params.offset || { x: 1.5, y: 0, z: 1.5 };
        clone.position.x += offset.x ?? 1.5;
        clone.position.y += offset.y ?? 0;
        clone.position.z += offset.z ?? 1.5;

        scene.add(clone);
        meshes.set(newName, clone);
        this.selectObject(clone);
        this.refreshSceneGraph();

        return {
          success: true,
          action: 'duplicate',
          target: newName,
          node: this.extractNodeMetadata(clone),
          message: `Duplicated '${sourceObj.name}' to '${newName}'`,
        };
      }

      case 'delete': {
        let targetObj: THREE.Object3D | undefined;
        if (!params.target || params.target === 'selected') {
          targetObj = this.selectedObject || undefined;
        } else {
          targetObj = meshes.get(params.target);
        }

        if (!targetObj) {
          return { success: false, message: `Cannot delete: object not found` };
        }

        const objName = targetObj.name;
        if (
          this.selectedObject === targetObj ||
          (this.selectedObject && this.isAncestorOrSelf(targetObj, this.selectedObject))
        ) {
          this.selectObject(null);
        }

        if (targetObj.parent) {
          targetObj.parent.remove(targetObj);
        } else {
          scene.remove(targetObj);
        }
        this.disposeObject(targetObj);
        meshes.delete(objName);
        this.refreshSceneGraph();

        return {
          success: true,
          action: 'delete',
          target: objName,
          message: `Deleted object '${objName}' from 3D scene`,
        };
      }

      case 'toggle_visibility': {
        let targetObj: THREE.Object3D | undefined;
        if (!params.target || params.target === 'selected') {
          targetObj = this.selectedObject || undefined;
        } else {
          targetObj = meshes.get(params.target);
        }

        if (!targetObj) {
          return { success: false, message: `Object not found` };
        }

        targetObj.visible = params.visible !== undefined ? params.visible : !targetObj.visible;
        this.refreshSceneGraph();

        return {
          success: true,
          action: 'toggle_visibility',
          target: targetObj.name,
          node: this.extractNodeMetadata(targetObj),
          message: `Set visibility of '${targetObj.name}' to ${targetObj.visible}`,
        };
      }

      case 'lock': {
        let targetObj: THREE.Object3D | undefined;
        if (!params.target || params.target === 'selected') {
          targetObj = this.selectedObject || undefined;
        } else {
          targetObj = meshes.get(params.target);
        }

        if (!targetObj) {
          return { success: false, message: `Object not found` };
        }

        if (!targetObj.userData) targetObj.userData = {};
        targetObj.userData['locked'] =
          params.locked !== undefined ? params.locked : !targetObj.userData['locked'];

        if (targetObj.userData['locked'] && this.contextRef.transformControls) {
          this.contextRef.transformControls.detach();
        }

        this.refreshSceneGraph();

        return {
          success: true,
          action: 'lock',
          target: targetObj.name,
          node: this.extractNodeMetadata(targetObj),
          message: `Set lock state of '${targetObj.name}' to ${targetObj.userData['locked']}`,
        };
      }

      case 'clear_custom': {
        const toRemove: string[] = [];
        meshes.forEach((obj, key) => {
          if (obj.userData['isCustom']) {
            toRemove.push(key);
          }
        });

        toRemove.forEach((key) => {
          const obj = meshes.get(key);
          if (obj) {
            if (
              this.selectedObject === obj ||
              (this.selectedObject && this.isAncestorOrSelf(obj, this.selectedObject))
            ) {
              this.selectObject(null);
            }
            if (obj.parent) obj.parent.remove(obj);
            else scene.remove(obj);
            this.disposeObject(obj);
            meshes.delete(key);
          }
        });

        this.refreshSceneGraph();
        return {
          success: true,
          action: 'clear_custom',
          message: `Cleared ${toRemove.length} custom objects from scene`,
        };
      }

      case 'reset_scene': {
        await this.manageHierarchy({ action: 'clear_custom' });
        await this.setViewport({ shadingMode: 'pbr', cameraView: 'perspective', showGrid: true, showShadows: true });
        await this.executeSceneAction({ action: 'reset_camera', durationMs: 400 });
        return {
          success: true,
          action: 'reset_scene',
          message: 'Scene and viewport reset to default digital twin state',
        };
      }

      default:
        return { success: false, message: `Unknown hierarchy action '${(params as any).action}'` };
    }
  }

  /**
   * Set Viewport shading mode, camera view preset, grid, and shadows.
   */
  async setViewport(params: StudioViewportParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene bound' };
    }

    const { camera, meshes, gridHelper, renderer } = this.contextRef;

    // 1. Shading Mode
    if (params.shadingMode) {
      const mode = params.shadingMode;
      meshes.forEach((obj) => {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (mode === 'wireframe') {
                mat.wireframe = true;
              } else {
                mat.wireframe = false;
              }
            });
          }
        });
      });
    }

    // 2. Camera Preset
    if (params.cameraView) {
      const view = params.cameraView;
      const target = { x: 0, y: 0, z: 0 };
      let newPos = { x: 4.5, y: 2.5, z: 5.5 };

      switch (view) {
        case 'top':
          newPos = { x: 0.001, y: 8, z: 0.001 };
          break;
        case 'front':
          newPos = { x: 0, y: 1.5, z: 6 };
          break;
        case 'side':
          newPos = { x: 6, y: 1.5, z: 0 };
          break;
        case 'iso':
          newPos = { x: 5, y: 5, z: 5 };
          break;
        case 'perspective':
        default:
          newPos = { x: 4.5, y: 2.5, z: 5.5 };
          break;
      }

      const currentPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      await new Promise<void>((resolve) => {
        CameraInterpolator.interpolateCamera(
          { position: currentPos, target },
          { position: newPos, target },
          350,
          (state) => {
            camera.position.set(state.position.x, state.position.y, state.position.z);
            camera.lookAt(state.target.x, state.target.y, state.target.z);
            if (this.contextRef?.orbitControls?.target) {
              this.contextRef.orbitControls.target.set(state.target.x, state.target.y, state.target.z);
              this.contextRef.orbitControls.update?.();
            }
          },
          () => {
            if (this.contextRef?.orbitControls?.target) {
              this.contextRef.orbitControls.target.set(target.x, target.y, target.z);
              this.contextRef.orbitControls.update?.();
            }
            resolve();
          }
        );
      });
    }

    // 3. Grid Helper
    if (params.showGrid !== undefined && gridHelper) {
      gridHelper.visible = params.showGrid;
    }

    // 4. Shadows
    if (params.showShadows !== undefined && renderer) {
      renderer.shadowMap.enabled = params.showShadows;
    }

    // 5. Gizmo Mode
    if (params.gizmoMode && this.contextRef.transformControls) {
      if (params.gizmoMode === 'none') {
        this.contextRef.transformControls.detach();
      } else {
        this.contextRef.transformControls.setMode(params.gizmoMode);
        if (this.selectedObject && !this.selectedObject.userData['locked']) {
          this.contextRef.transformControls.attach(this.selectedObject);
        }
      }
    }

    this.viewportConfig.update((c) => ({ ...c, ...params }));
    this.contextRef.onViewportChange?.(this.viewportConfig());

    return {
      success: true,
      action: 'studio_set_viewport',
      data: this.viewportConfig(),
      message: `Viewport updated: shading=${params.shadingMode || 'unchanged'}, camera=${params.cameraView || 'unchanged'}`,
    };
  }

  /**
   * Export Scene or Selected Object to GLTF/GLB.
   */
  async exportGltf(params: StudioExportParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene bound' };
    }

    const { scene } = this.contextRef;
    const isBinary = params.format === 'glb' || params.binary === true;
    let targetInput: THREE.Object3D | THREE.Object3D[];
    if (params.target === 'selected' && this.selectedObject) {
      targetInput = this.selectedObject;
    } else {
      // Filter out editor helpers so only model objects are exported
      targetInput = scene.children.filter((child) => !this.isEditorHelper(child));
    }

    // Ensure FileReader polyfill exists in SSR / test environments
    if (typeof (globalThis as any).FileReader === 'undefined') {
      (globalThis as any).FileReader = class FileReader {
        result: any = null;
        onloadend: (() => void) | null = null;
        onload: (() => void) | null = null;
        onerror: ((err: any) => void) | null = null;

        readAsArrayBuffer(blob: Blob) {
          blob.arrayBuffer().then((buf) => {
            this.result = buf;
            setTimeout(() => {
              this.onload?.();
              this.onloadend?.();
            }, 0);
          }).catch((err) => this.onerror?.(err));
        }

        readAsDataURL(blob: Blob) {
          blob.arrayBuffer().then((buf) => {
            const base64 = typeof Buffer !== 'undefined' ? Buffer.from(buf).toString('base64') : '';
            this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
            setTimeout(() => {
              this.onload?.();
              this.onloadend?.();
            }, 0);
          }).catch((err) => this.onerror?.(err));
        }
      };
    }

    const exporter = new GLTFExporter();
    return new Promise((resolve) => {
      try {
        exporter.parse(
          targetInput,
          (result) => {
            const filename =
              params.filename || `studio_model_${Date.now()}.${isBinary ? 'glb' : 'gltf'}`;

            // If running in browser environment, auto trigger download
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
              const blob =
                result instanceof ArrayBuffer
                  ? new Blob([result], { type: 'application/octet-stream' })
                  : new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });

              const link = document.createElement('a');
              const blobUrl = URL.createObjectURL(blob);
              link.href = blobUrl;
              link.download = filename;
              link.click();
              setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
            }

            resolve({
              success: true,
              action: 'studio_export_gltf',
              data: {
                filename,
                format: isBinary ? 'glb' : 'gltf',
                sizeBytes: result instanceof ArrayBuffer ? result.byteLength : JSON.stringify(result).length,
              },
              message: `Successfully exported ${params.target || 'scene'} as ${filename}`,
            });
          },
          (error) => {
            resolve({
              success: false,
              action: 'studio_export_gltf',
              message: `GLTF Export error: ${error}`,
            });
          },
          { binary: isBinary }
        );
      } catch (err: any) {
        resolve({
          success: false,
          action: 'studio_export_gltf',
          message: `GLTF Exporter runtime exception: ${err?.message || err}`,
        });
      }
    });
  }

  /**
   * Legacy Scene Action Execution Handler for `scene_3d_action`.
   */
  async executeSceneAction(params: Scene3DActionParams): Promise<Scene3DActionResult> {
    if (!this.contextRef) {
      return {
        success: false,
        action: params.action,
        sceneState: {
          camera: { x: 0, y: 0, z: 0, target: [0, 0, 0] },
          activeMeshes: [],
        },
        message: 'No active 3D scene is currently bound to WebMCP bridge',
      };
    }

    const { camera, meshes } = this.contextRef;
    const durationMs = params.durationMs || 600;

    switch (params.action) {
      case 'rotate':
      case 'zoom': {
        const deltaThetaRad = ((params.deltaX || 0) * Math.PI) / 180;
        const deltaPhiRad = -((params.deltaY || 0) * Math.PI) / 180;
        const zoom = params.zoomFactor || 1.0;

        const currentPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        const targetPos = { x: 0, y: 0, z: 0 };
        const newPos = CameraInterpolator.computeOrbitPosition(
          currentPos,
          targetPos,
          deltaThetaRad,
          deltaPhiRad,
          zoom
        );

        await new Promise<void>((resolve) => {
          CameraInterpolator.interpolateCamera(
            { position: currentPos, target: targetPos },
            { position: newPos, target: targetPos },
            durationMs,
            (state) => {
              camera.position.set(state.position.x, state.position.y, state.position.z);
              camera.lookAt(state.target.x, state.target.y, state.target.z);
              if (this.contextRef?.orbitControls?.target) {
                this.contextRef.orbitControls.target.set(state.target.x, state.target.y, state.target.z);
                this.contextRef.orbitControls.update?.();
              }
            },
            () => {
              if (this.contextRef?.orbitControls?.target) {
                this.contextRef.orbitControls.target.set(targetPos.x, targetPos.y, targetPos.z);
                this.contextRef.orbitControls.update?.();
              }
              resolve();
            }
          );
        });

        return this.buildLegacyResult(
          params.action,
          `Camera orbit updated: deltaX=${params.deltaX ?? 0}°, deltaY=${params.deltaY ?? 0}°, zoom=${zoom}`
        );
      }

      case 'reset_camera': {
        const currentPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        const startTarget = { x: 0, y: 0, z: 0 };

        await new Promise<void>((resolve) => {
          CameraInterpolator.interpolateCamera(
            { position: currentPos, target: startTarget },
            this.defaultCameraState,
            durationMs,
            (state) => {
              camera.position.set(state.position.x, state.position.y, state.position.z);
              camera.lookAt(state.target.x, state.target.y, state.target.z);
              if (this.contextRef?.orbitControls?.target) {
                this.contextRef.orbitControls.target.set(state.target.x, state.target.y, state.target.z);
                this.contextRef.orbitControls.update?.();
              }
            },
            () => {
              if (this.contextRef?.orbitControls?.target) {
                this.contextRef.orbitControls.target.set(
                  this.defaultCameraState.target.x,
                  this.defaultCameraState.target.y,
                  this.defaultCameraState.target.z
                );
                this.contextRef.orbitControls.update?.();
              }
              resolve();
            }
          );
        });

        return this.buildLegacyResult(
          'reset_camera',
          'Camera position and orientation smoothly reset to default'
        );
      }

      case 'change_mesh_color': {
        if (!params.meshName) {
          throw new Error("Missing required 'meshName' parameter for change_mesh_color");
        }
        if (!params.hexColor) {
          throw new Error("Missing required 'hexColor' parameter for change_mesh_color");
        }

        const targetMesh = meshes.get(params.meshName);
        if (!targetMesh) {
          throw new Error(`Target mesh '${params.meshName}' not found in active 3D scene`);
        }

        const color = new THREE.Color(params.hexColor);
        targetMesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if ('color' in mat) (mat as any).color = color;
              });
            } else if ('color' in child.material) {
              (child.material as any).color = color;
            }
          }
        });

        return this.buildLegacyResult(
          'change_mesh_color',
          `Material color for mesh '${params.meshName}' updated to ${params.hexColor}`
        );
      }

      case 'highlight_part': {
        if (!params.meshName) {
          throw new Error("Missing required 'meshName' for highlight_part");
        }
        const targetMesh = meshes.get(params.meshName);
        if (!targetMesh) {
          throw new Error(`Mesh '${params.meshName}' not found`);
        }

        const highlightColor = new THREE.Color(params.hexColor || '#00ffff');
        targetMesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
            (child.material as any).emissive = highlightColor;
            (child.material as any).emissiveIntensity = 0.8;
          }
        });

        setTimeout(() => {
          if (this.contextRef && targetMesh) {
            targetMesh.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
                (child.material as any).emissiveIntensity = 0.1;
              }
            });
          }
        }, durationMs * 2);

        return this.buildLegacyResult(
          'highlight_part',
          `Emphasized part '${params.meshName}' with emissive highlight`
        );
      }

      case 'play_animation': {
        return this.buildLegacyResult(
          'play_animation',
          `Animation '${params.clipName || 'default'}' triggered`
        );
      }

      default:
        throw new Error(`Unsupported 3D action type: '${(params as any).action}'`);
    }
  }

  // =========================================================================
  // Internal Helpers
  // =========================================================================

  private extractNodeMetadata(obj: THREE.Object3D): StudioSceneNode {
    let type = (obj.userData['primitiveType'] as string) || obj.type;
    let matConfig: StudioMaterialConfig | undefined = obj.userData['materialConfig'] as StudioMaterialConfig | undefined;

    if (!matConfig && obj instanceof THREE.Mesh && obj.material) {
      const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (mat) {
        matConfig = {
          color: mat.color ? '#' + mat.color.getHexString() : undefined,
          metalness: (mat as any).metalness,
          roughness: (mat as any).roughness,
          transmission: (mat as any).transmission,
          wireframe: (mat as any).wireframe,
          emissive: (mat as any).emissive ? '#' + (mat as any).emissive.getHexString() : undefined,
        };
      }
    }

    return {
      id: obj.uuid,
      name: obj.name || 'unnamed_node',
      type,
      visible: obj.visible,
      locked: (obj.userData['locked'] as boolean) ?? false,
      isCustom: (obj.userData['isCustom'] as boolean) ?? false,
      childrenCount: obj.children.length,
      position: {
        x: Math.round(obj.position.x * 100) / 100,
        y: Math.round(obj.position.y * 100) / 100,
        z: Math.round(obj.position.z * 100) / 100,
      },
      rotation: {
        x: Math.round(((obj.rotation.x * 180) / Math.PI) * 10) / 10,
        y: Math.round(((obj.rotation.y * 180) / Math.PI) * 10) / 10,
        z: Math.round(((obj.rotation.z * 180) / Math.PI) * 10) / 10,
      },
      scale: {
        x: Math.round(obj.scale.x * 100) / 100,
        y: Math.round(obj.scale.y * 100) / 100,
        z: Math.round(obj.scale.z * 100) / 100,
      },
      material: matConfig,
    };
  }

  private isAncestorOrSelf(parent: THREE.Object3D, node: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = node;
    while (current) {
      if (current === parent) return true;
      current = current.parent;
    }
    return false;
  }

  private isEditorHelper(obj: THREE.Object3D): boolean {
    if (!obj) return false;
    if (obj instanceof THREE.GridHelper || obj instanceof THREE.BoxHelper) return true;
    if ((obj as any).isTransformControls || (obj as any).isHelper || (obj as any).isLightHelper) return true;
    const type = obj.type || '';
    const name = obj.name || '';
    if (
      name.startsWith('sketchup_') ||
      name.startsWith('cad_preview_') ||
      name === 'sketchup_3axis_guides' ||
      type.includes('Helper') ||
      type.includes('TransformControls') ||
      name.includes('TransformControls') ||
      name.includes('Helper')
    ) {
      return true;
    }
    if (this.contextRef) {
      if (
        obj === this.contextRef.gridHelper ||
        obj === this.contextRef.selectionBox ||
        obj === this.contextRef.transformControls
      ) {
        return true;
      }
      if (
        this.contextRef.transformControls &&
        typeof this.contextRef.transformControls.getHelper === 'function' &&
        obj === this.contextRef.transformControls.getHelper()
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Procedural spawn pop-in animation (scale 0.001 -> 1.0 cubic-out easing).
   * Automatically falls back to synchronous completion in SSR/headless test environments.
   */
  public animateSpawnPopIn(
    object3D: THREE.Object3D,
    targetScale?: THREE.Vector3 | number,
    durationMs = 250
  ): Promise<void> {
    const finalScale = new THREE.Vector3(
      typeof targetScale === 'number' ? targetScale : (targetScale?.x ?? object3D.scale.x ?? 1),
      typeof targetScale === 'number' ? targetScale : (targetScale?.y ?? object3D.scale.y ?? 1),
      typeof targetScale === 'number' ? targetScale : (targetScale?.z ?? object3D.scale.z ?? 1)
    );

    const isHeadless =
      typeof window === 'undefined' ||
      typeof requestAnimationFrame === 'undefined' ||
      (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'test') ||
      (typeof globalThis !== 'undefined' && (globalThis as any).Bun);

    if (isHeadless || durationMs <= 0) {
      object3D.scale.copy(finalScale);
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const startTime = performance.now();
      object3D.scale.set(0.001 * finalScale.x, 0.001 * finalScale.y, 0.001 * finalScale.z);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic-out easing

        object3D.scale.set(
          finalScale.x * Math.max(0.001, ease),
          finalScale.y * Math.max(0.001, ease),
          finalScale.z * Math.max(0.001, ease)
        );

        if (progress < 1.0) {
          requestAnimationFrame(step);
        } else {
          object3D.scale.copy(finalScale);
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  public disposeObject(obj: THREE.Object3D): void {
    if (!obj) return;
    obj.traverse((child: THREE.Object3D) => {
      if (this.contextRef?.meshes && child.name) {
        this.contextRef.meshes.delete(child.name);
      }
      const childAny = child as any;
      if (childAny.geometry && typeof childAny.geometry.dispose === 'function') {
        childAny.geometry.dispose();
      }
      if (childAny.material) {
        if (Array.isArray(childAny.material)) {
          childAny.material.forEach((mat: THREE.Material) => this.disposeMaterial(mat));
        } else {
          this.disposeMaterial(childAny.material);
        }
      }
    });
  }

  public disposeMaterial(material: THREE.Material): void {
    if (!material) return;
    for (const key of Object.keys(material)) {
      const value = (material as any)[key];
      if (
        value &&
        typeof value === 'object' &&
        typeof value.dispose === 'function'
      ) {
        value.dispose();
      }
    }
    material.dispose();
  }

  private buildLegacyResult(
    action: Scene3DActionType,
    message: string
  ): Scene3DActionResult {
    const cam = this.contextRef?.camera;
    return {
      success: true,
      action,
      sceneState: {
        camera: {
          x: cam ? Math.round(cam.position.x * 100) / 100 : 0,
          y: cam ? Math.round(cam.position.y * 100) / 100 : 0,
          z: cam ? Math.round(cam.position.z * 100) / 100 : 0,
          target: [0, 0, 0],
        },
        activeMeshes: Array.from(this.contextRef?.meshes.keys() || []),
      },
      message,
    };
  }

  // =========================================================================
  // WebMCP CAD Co-Design Methods Implementation
  // =========================================================================

  public resolveTargetObject(target?: string | THREE.Object3D | null): THREE.Object3D | null {
    if (!this.contextRef) return null;
    if (!target || target === 'selected') {
      return this.selectedObject;
    }
    if (typeof target === 'string') {
      return this.contextRef.meshes.get(target) || null;
    }
    return target;
  }

  public getPresetMaterialConfig(preset: CadMaterialPreset): StudioMaterialConfig {
    switch (preset) {
      case 'concrete':
        return { color: '#94a3b8', roughness: 0.9, metalness: 0.05 };
      case 'wood_oak':
        return { color: '#a2703f', roughness: 0.65, metalness: 0.0 };
      case 'brick_red':
        return { color: '#b91c1c', roughness: 0.92, metalness: 0.0 };
      case 'glass_frosted':
        return {
          color: '#e0f2fe',
          roughness: 0.15,
          metalness: 0.05,
          transmission: 0.9,
          transparent: true,
          opacity: 0.75,
          ior: 1.5,
        };
      case 'marble_carrara':
        return { color: '#f8fafc', roughness: 0.12, metalness: 0.05, clearcoat: 0.9 };
      case 'steel_brushed':
        return { color: '#64748b', roughness: 0.28, metalness: 0.92 };
      case 'tile_subway':
        return { color: '#ffffff', roughness: 0.18, metalness: 0.08, clearcoat: 0.6 };
      case 'gold':
        return { color: '#ffd700', roughness: 0.1, metalness: 0.95 };
      case 'neon_cyan':
        return {
          color: '#00f0ff',
          roughness: 0.1,
          metalness: 0.5,
          emissive: '#00f0ff',
          emissiveIntensity: 0.8,
        };
      case 'matte_dark':
        return { color: '#1e293b', roughness: 0.9, metalness: 0.1 };
      case 'plaster_white':
        return { color: '#f1f5f9', roughness: 0.95, metalness: 0.0 };
      default:
        return { color: '#cbd5e1', roughness: 0.5, metalness: 0.1 };
    }
  }

  public createPresetMaterial(
    preset: CadMaterialPreset,
    custom?: Partial<StudioMaterialConfig>
  ): THREE.Material {
    const base = this.getPresetMaterialConfig(preset);
    const cfg = { ...base, ...custom };
    const isTransparent =
      cfg.transparent ??
      ((cfg.transmission ?? 0) > 0 || (cfg.opacity !== undefined && cfg.opacity < 1.0));

    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(cfg.color || '#cbd5e1'),
      roughness: cfg.roughness ?? 0.5,
      metalness: cfg.metalness ?? 0.1,
      transmission: cfg.transmission ?? 0.0,
      opacity: cfg.opacity ?? 1.0,
      transparent: isTransparent,
      clearcoat: cfg.clearcoat ?? 0.0,
      emissive: cfg.emissive ? new THREE.Color(cfg.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: cfg.emissiveIntensity ?? 0.0,
      wireframe: cfg.wireframe ?? false,
      side: THREE.DoubleSide,
    });
  }

  /**
   * 8. cad_draw_shape: Draws 2D planar profiles, architectural floor plans, or walls.
   */
  async drawShape(params: CadDrawShapeParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene is currently bound' };
    }
    const { scene, meshes } = this.contextRef;
    const name = params.name || `shape_${params.shape}_${this.customObjectCounter++}`;
    const origin = params.origin || { x: 0, y: 0, z: 0 };
    const dim = params.dimensions || {};
    const fill = params.fill !== false;
    const preset = params.materialPreset || 'concrete';
    const mat = this.createPresetMaterial(preset);

    let object3D: THREE.Object3D;

    switch (params.shape) {
      case 'rectangle': {
        const width = dim.width ?? 4;
        const length = dim.length ?? 4;
        const geo = new THREE.PlaneGeometry(width, length);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2; // Flat on ground (XZ)
        mesh.position.set(origin.x ?? 0, (origin.y ?? 0) + 0.005, origin.z ?? 0);
        mesh.castShadow = false;
        mesh.receiveShadow = true;

        // Border line outline
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 })
        );
        mesh.add(line);

        object3D = mesh;
        break;
      }
      case 'circle': {
        const radius = dim.radius ?? 2;
        const geo = new THREE.CircleGeometry(radius, 36);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(origin.x ?? 0, (origin.y ?? 0) + 0.005, origin.z ?? 0);
        mesh.receiveShadow = true;

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x0284c7 })
        );
        mesh.add(line);

        object3D = mesh;
        break;
      }
      case 'line':
      case 'polyline': {
        const pts = dim.points || [
          { x: 0, y: 0, z: 0 },
          { x: 5, y: 0, z: 0 },
        ];
        const v3s = pts.map((p) => new THREE.Vector3(p.x, (p.y ?? 0) + 0.01, p.z ?? 0));
        const geo = new THREE.BufferGeometry().setFromPoints(v3s);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 3 });
        object3D = new THREE.Line(geo, lineMat);
        object3D.position.set(origin.x ?? 0, origin.y ?? 0, origin.z ?? 0);
        break;
      }
      case 'wall': {
        const wallThickness = dim.wallThickness ?? 0.25;
        const wallHeight = dim.height ?? 0.05; // 2D footprint height
        const pts = dim.points || [
          { x: 0, y: 0, z: 0 },
          { x: 5, y: 0, z: 0 },
          { x: 5, y: 0, z: 5 },
          { x: 0, y: 0, z: 5 },
        ];
        const group = new THREE.Group();
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];
          const dx = (p2.x ?? 0) - (p1.x ?? 0);
          const dz = (p2.z ?? 0) - (p1.z ?? 0);
          const len = Math.hypot(dx, dz);
          if (len > 0.001) {
            const segGeo = new THREE.BoxGeometry(len, wallHeight, wallThickness);
            const segMesh = new THREE.Mesh(segGeo, mat);
            segMesh.position.set(
              ((p1.x ?? 0) + (p2.x ?? 0)) / 2,
              wallHeight / 2,
              ((p1.z ?? 0) + (p2.z ?? 0)) / 2
            );
            segMesh.rotation.y = -Math.atan2(dz, dx);
            segMesh.castShadow = true;
            segMesh.receiveShadow = true;
            group.add(segMesh);
          }
        }
        object3D = group;
        object3D.position.set(origin.x ?? 0, origin.y ?? 0, origin.z ?? 0);
        break;
      }
      case 'polygon': {
        const pts = (dim.points && dim.points.length >= 3) ? dim.points : [
          { x: -2, z: -2 },
          { x: 2, z: -2 },
          { x: 3, z: 1 },
          { x: 0, z: 3 },
          { x: -3, z: 1 },
        ];
        const shape = new THREE.Shape();
        shape.moveTo(pts[0].x, -(pts[0].z ?? pts[0].y ?? 0));
        for (let i = 1; i < pts.length; i++) {
          shape.lineTo(pts[i].x, -(pts[i].z ?? pts[i].y ?? 0));
        }
        shape.closePath();
        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(origin.x ?? 0, (origin.y ?? 0) + 0.005, origin.z ?? 0);
        mesh.receiveShadow = true;

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 })
        );
        mesh.add(line);

        object3D = mesh;
        break;
      }
      default: {
        const geo = new THREE.PlaneGeometry(dim.width || 3, dim.length || 3);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(origin.x ?? 0, (origin.y ?? 0) + 0.005, origin.z ?? 0);
        object3D = mesh;
        break;
      }
    }

    object3D.name = name;
    object3D.userData = {
      isCustom: true,
      isCadShape: true,
      shapeType: params.shape,
      plane: params.plane || 'ground',
      dimensions: params.dimensions,
      fill,
      materialPreset: preset,
    };

    scene.add(object3D);
    meshes.set(name, object3D);

    const targetScale = object3D.scale.clone();
    await this.animateSpawnPopIn(object3D, targetScale);

    const node = this.selectObject(object3D);
    this.refreshSceneGraph();
    this.contextRef.onHierarchyChange?.();

    return {
      success: true,
      action: 'cad_draw_shape',
      target: name,
      node: node || undefined,
      message: `2D CAD profile "${name}" (${params.shape}) drawn successfully on ground plane.`,
    };
  }

  /**
   * 9. cad_push_pull: Extrudes a 2D planar profile into a 3D architectural solid volume.
   */
  async pushPull(params: CadPushPullParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene is currently bound' };
    }
    const { scene, meshes } = this.contextRef;
    const targetObj = this.resolveTargetObject(params.target);
    if (!targetObj) {
      return { success: false, message: `Target object "${params.target}" not found in scene.` };
    }

    const distance = Math.abs(params.distance || 3.0);
    const isHollow = !!params.hollow;
    const direction = params.direction || 'up';
    const isDown = direction === 'down';
    const isX = direction === 'x';
    const isZ = direction === 'z';
    const shapeType = targetObj.userData['shapeType'] || 'rectangle';
    const dim = targetObj.userData['dimensions'] || {};
    const name = targetObj.name;
    const oldPos = targetObj.position.clone();
    const oldRot = targetObj.rotation.clone();

    const preset = params.materialPreset || targetObj.userData['materialPreset'] || 'concrete';
    const mat = this.createPresetMaterial(preset);

    let solidObj: THREE.Object3D;

    if (isHollow) {
      const width = dim.width ?? 6;
      const length = dim.length ?? 6;
      const wallThick = dim.wallThickness ?? 0.2;
      const roomGroup = new THREE.Group();

      // Floor slab
      const floorGeo = new THREE.BoxGeometry(width, 0.1, length);
      const floor = new THREE.Mesh(floorGeo, mat);
      floor.position.y = 0.05;
      floor.receiveShadow = true;
      roomGroup.add(floor);

      // North & South walls
      const nsWallGeo = new THREE.BoxGeometry(width, distance, wallThick);
      const nWall = new THREE.Mesh(nsWallGeo, mat);
      nWall.position.set(0, distance / 2, -length / 2 + wallThick / 2);
      nWall.castShadow = true;
      nWall.receiveShadow = true;
      roomGroup.add(nWall);

      const sWall = new THREE.Mesh(nsWallGeo, mat);
      sWall.position.set(0, distance / 2, length / 2 - wallThick / 2);
      sWall.castShadow = true;
      sWall.receiveShadow = true;
      roomGroup.add(sWall);

      // East & West walls
      const ewWallGeo = new THREE.BoxGeometry(wallThick, distance, Math.max(0.1, length - 2 * wallThick));
      const eWall = new THREE.Mesh(ewWallGeo, mat);
      eWall.position.set(width / 2 - wallThick / 2, distance / 2, 0);
      eWall.castShadow = true;
      eWall.receiveShadow = true;
      roomGroup.add(eWall);

      const wWall = new THREE.Mesh(ewWallGeo, mat);
      wWall.position.set(-width / 2 + wallThick / 2, distance / 2, 0);
      wWall.castShadow = true;
      wWall.receiveShadow = true;
      roomGroup.add(wWall);

      solidObj = roomGroup;
    } else if (shapeType === 'circle') {
      const radius = dim.radius ?? 2;
      const geo = new THREE.CylinderGeometry(radius, radius, distance, 36);
      const solidMesh = new THREE.Mesh(geo, mat);
      solidMesh.castShadow = true;
      solidMesh.receiveShadow = true;
      solidObj = solidMesh;
    } else if (shapeType === 'polygon' && dim.points && dim.points.length >= 3) {
      const pts = dim.points;
      const shape = new THREE.Shape();
      shape.moveTo(pts[0].x, -(pts[0].z ?? pts[0].y ?? 0));
      for (let i = 1; i < pts.length; i++) {
        shape.lineTo(pts[i].x, -(pts[i].z ?? pts[i].y ?? 0));
      }
      shape.closePath();
      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: distance,
        bevelEnabled: params.bevel === true,
        bevelThickness: params.bevel ? Math.min(0.08, distance * 0.05) : 0,
        bevelSize: params.bevel ? Math.min(0.08, distance * 0.05) : 0,
        bevelSegments: params.bevel ? 3 : 1,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const solidMesh = new THREE.Mesh(geo, mat);
      solidMesh.castShadow = true;
      solidMesh.receiveShadow = true;
      solidObj = solidMesh;
    } else {
      // Standard rectangle / box solid
      const bbox = new THREE.Box3().setFromObject(targetObj);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const width = dim.width ?? (size.x > 0.01 ? size.x : 4);
      const length = dim.length ?? (size.z > 0.01 ? size.z : 4);

      const geo = new THREE.BoxGeometry(width, distance, length);
      const solidMesh = new THREE.Mesh(geo, mat);
      solidMesh.castShadow = true;
      solidMesh.receiveShadow = true;
      solidObj = solidMesh;
    }

    solidObj.name = name;
    solidObj.position.copy(oldPos);

    const baseY = oldPos.y > 0 && oldPos.y <= 0.01 ? 0 : oldPos.y;

    if (solidObj instanceof THREE.Mesh) {
      if (shapeType === 'polygon' && dim.points && dim.points.length >= 3) {
        if (isDown) {
          solidObj.rotation.x = Math.PI / 2;
          solidObj.position.y = baseY;
        } else {
          solidObj.rotation.x = -Math.PI / 2;
          solidObj.position.y = baseY;
        }
      } else {
        // Box / Cylinder: geometry is centered at origin
        if (isDown) {
          solidObj.position.y = baseY - distance / 2;
        } else if (isX) {
          solidObj.position.x = oldPos.x + distance / 2;
        } else if (isZ) {
          solidObj.position.z = oldPos.z + distance / 2;
        } else {
          // 'up', 'y', 'normal', or default: base rests at baseY
          solidObj.position.y = baseY + distance / 2;
        }
        solidObj.rotation.set(0, oldRot.y, 0);
      }
    } else {
      // Hollow group
      if (isDown) {
        solidObj.position.y = baseY - distance;
      } else {
        solidObj.position.y = baseY;
      }
      solidObj.rotation.set(0, oldRot.y, 0);
    }

    solidObj.userData = {
      ...targetObj.userData,
      isCustom: true,
      isCadExtrusion: true,
      height: distance,
      direction,
      bevel: params.bevel ?? false,
      hollow: isHollow,
      shapeType,
      dimensions: dim,
      materialPreset: preset,
    };

    // Remove old 2D mesh
    scene.remove(targetObj);
    this.disposeObject(targetObj);

    // Add new 3D Solid
    scene.add(solidObj);
    meshes.set(name, solidObj);

    const node = this.selectObject(solidObj);
    this.refreshSceneGraph();
    this.contextRef.onHierarchyChange?.();

    return {
      success: true,
      action: 'cad_push_pull',
      target: name,
      node: node || undefined,
      message: `Push-pulled "${name}" ${direction} by ${distance.toFixed(2)}m into a 3D solid architectural volume.`,
    };
  }

  /**
   * 10. cad_place_component: Instantiates pre-built architectural assets.
   */
  async placeComponent(params: CadPlaceComponentParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene is currently bound' };
    }
    const { scene, meshes } = this.contextRef;
    const type = params.componentType;
    const name = params.name || `component_${type}_${this.customObjectCounter++}`;
    const pos = params.position || { x: 0, y: 0, z: 0 };
    const rotY = THREE.MathUtils.degToRad(params.rotationY || 0);

    const preset = params.materialPreset;
    const defaultMat = preset ? this.createPresetMaterial(preset) : null;

    let compObj: THREE.Object3D;

    switch (type) {
      case 'desk': {
        const g = new THREE.Group();
        const topMat = defaultMat || this.createPresetMaterial('wood_oak');
        const legMat = this.createPresetMaterial('steel_brushed');
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.0), topMat);
        top.position.y = 0.74;
        top.castShadow = true;
        top.receiveShadow = true;
        g.add(top);

        const legPositions = [
          [-0.9, 0.35, -0.4],
          [0.9, 0.35, -0.4],
          [-0.9, 0.35, 0.4],
          [0.9, 0.35, 0.4],
        ];
        for (const [lx, ly, lz] of legPositions) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 16), legMat);
          leg.position.set(lx, ly, lz);
          leg.castShadow = true;
          g.add(leg);
        }
        compObj = g;
        break;
      }
      case 'chair': {
        const g = new THREE.Group();
        const seatMat = defaultMat || this.createPresetMaterial('matte_dark');
        const metalMat = this.createPresetMaterial('steel_brushed');

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), seatMat);
        seat.position.y = 0.48;
        seat.castShadow = true;
        g.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.06), seatMat);
        back.position.set(0, 0.75, -0.24);
        back.castShadow = true;
        g.add(back);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.44, 16), metalMat);
        stem.position.y = 0.22;
        stem.castShadow = true;
        g.add(stem);
        compObj = g;
        break;
      }
      case 'sofa': {
        const g = new THREE.Group();
        const sofaMat = defaultMat || this.createPresetMaterial('matte_dark');
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.9), sofaMat);
        base.position.y = 0.2;
        base.castShadow = true;
        base.receiveShadow = true;
        g.add(base);

        const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.25), sofaMat);
        back.position.set(0, 0.55, -0.32);
        back.castShadow = true;
        g.add(back);

        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.9), sofaMat);
        armL.position.set(-1.0, 0.35, 0);
        armL.castShadow = true;
        g.add(armL);

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.9), sofaMat);
        armR.position.set(1.0, 0.35, 0);
        armR.castShadow = true;
        g.add(armR);

        compObj = g;
        break;
      }
      case 'door': {
        const g = new THREE.Group();
        const frameMat = this.createPresetMaterial('plaster_white');
        const doorMat = defaultMat || this.createPresetMaterial('wood_oak');
        const knobMat = this.createPresetMaterial('gold');

        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.1), frameMat);
        frame.position.y = 1.1;
        frame.castShadow = true;
        g.add(frame);

        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.1, 0.05), doorMat);
        panel.position.set(0, 1.1, 0.01);
        panel.castShadow = true;
        g.add(panel);

        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), knobMat);
        knob.position.set(0.38, 1.05, 0.05);
        knob.castShadow = true;
        g.add(knob);

        compObj = g;
        break;
      }
      case 'window': {
        const g = new THREE.Group();
        const frameMat = this.createPresetMaterial('plaster_white');
        const glassMat = defaultMat || this.createPresetMaterial('glass_frosted');

        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.08), frameMat);
        frame.position.y = 1.2;
        frame.castShadow = true;
        g.add(frame);

        const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.02), glassMat);
        glass.position.y = 1.2;
        g.add(glass);

        compObj = g;
        break;
      }
      case 'column': {
        const g = new THREE.Group();
        const colMat = defaultMat || this.createPresetMaterial('marble_carrara');

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), colMat);
        base.position.y = 0.1;
        base.castShadow = true;
        g.add(base);

        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 3.2, 24), colMat);
        shaft.position.y = 1.8;
        shaft.castShadow = true;
        g.add(shaft);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), colMat);
        cap.position.y = 3.5;
        cap.castShadow = true;
        g.add(cap);

        compObj = g;
        break;
      }
      case 'pedestal': {
        const g = new THREE.Group();
        const pedMat = defaultMat || this.createPresetMaterial('steel_brushed');
        const ringMat = this.createPresetMaterial('neon_cyan');

        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32), pedMat);
        base.position.y = 0.1;
        base.receiveShadow = true;
        g.add(base);

        const top = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 32), ringMat);
        top.position.y = 0.35;
        top.castShadow = true;
        g.add(top);

        compObj = g;
        break;
      }
      case 'staircase': {
        const g = new THREE.Group();
        const stepMat = defaultMat || this.createPresetMaterial('concrete');
        const stepCount = 6;
        for (let i = 0; i < stepCount; i++) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.35), stepMat);
          step.position.set(0, i * 0.2 + 0.1, i * 0.35);
          step.castShadow = true;
          step.receiveShadow = true;
          g.add(step);
        }
        compObj = g;
        break;
      }
      case 'tree': {
        const g = new THREE.Group();
        const trunkMat = this.createPresetMaterial('wood_oak');
        const foliageMat =
          defaultMat || new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.8, 16), trunkMat);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        g.add(trunk);

        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), foliageMat);
        foliage.position.y = 2.4;
        foliage.castShadow = true;
        g.add(foliage);

        compObj = g;
        break;
      }
      case 'car':
      case 'cyber_car': {
        const g = new THREE.Group();
        const bodyMat = defaultMat || this.createPresetMaterial('neon_cyan');
        const glassMat = this.createPresetMaterial('glass_frosted');
        const wheelMat = this.createPresetMaterial('matte_dark');

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 4.0), bodyMat);
        chassis.position.y = 0.55;
        chassis.castShadow = true;
        g.add(chassis);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.8), glassMat);
        cabin.position.set(0, 0.95, -0.2);
        cabin.castShadow = true;
        g.add(cabin);

        const wheelPositions = [
          [-1.15, 0.35, -1.2],
          [1.15, 0.35, -1.2],
          [-1.15, 0.35, 1.2],
          [1.15, 0.35, 1.2],
        ];
        for (const [wx, wy, wz] of wheelPositions) {
          const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.25, 24),
            wheelMat
          );
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, wy, wz);
          wheel.castShadow = true;
          g.add(wheel);
        }
        compObj = g;
        break;
      }
      case 'lamp': {
        const g = new THREE.Group();
        const metalMat = defaultMat || this.createPresetMaterial('steel_brushed');
        const shadeMat = this.createPresetMaterial('plaster_white');

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24), metalMat);
        base.position.y = 0.02;
        base.castShadow = true;
        g.add(base);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 16), metalMat);
        pole.position.y = 0.87;
        pole.castShadow = true;
        g.add(pole);

        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.35, 24, 1, true), shadeMat);
        shade.position.y = 1.65;
        shade.castShadow = true;
        g.add(shade);

        const light = new THREE.PointLight(0xffedd5, 1.8, 10);
        light.position.y = 1.6;
        g.add(light);

        compObj = g;
        break;
      }
      default: {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geo, defaultMat || this.createPresetMaterial('concrete'));
        mesh.position.y = 0.5;
        compObj = mesh;
        break;
      }
    }

    compObj.name = name;
    compObj.position.set(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
    compObj.rotation.y = rotY;

    if (typeof params.scale === 'number') {
      compObj.scale.set(params.scale, params.scale, params.scale);
    } else if (params.scale) {
      compObj.scale.set(params.scale.x ?? 1, params.scale.y ?? 1, params.scale.z ?? 1);
    }

    compObj.userData = {
      isCustom: true,
      isComponent: true,
      componentType: type,
      materialPreset: preset,
    };

    scene.add(compObj);
    meshes.set(name, compObj);

    const targetScale = compObj.scale.clone();
    await this.animateSpawnPopIn(compObj, targetScale);

    const node = this.selectObject(compObj);
    this.refreshSceneGraph();
    this.contextRef.onHierarchyChange?.();

    return {
      success: true,
      action: 'cad_place_component',
      target: name,
      node: node || undefined,
      message: `Architectural component "${name}" (${type}) placed at (${pos.x ?? 0}, ${pos.y ?? 0}, ${pos.z ?? 0}).`,
    };
  }

  /**
   * 11. cad_apply_material: Applies architectural PBR materials.
   */
  async applyMaterial(params: CadApplyMaterialParams): Promise<StudioToolResult> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene is currently bound' };
    }
    const targetObj = this.resolveTargetObject(params.target);
    if (!targetObj) {
      return { success: false, message: `Target object "${params.target}" not found in scene.` };
    }

    const mat = this.createPresetMaterial(params.materialPreset, {
      color: params.color,
      roughness: params.roughness,
      metalness: params.metalness,
      opacity: params.opacity,
      transmission: params.transmission,
      clearcoat: params.clearcoat,
      wireframe: params.wireframe,
    });

    if (targetObj instanceof THREE.Mesh) {
      targetObj.material = mat;
    } else {
      targetObj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = mat;
        }
      });
    }

    targetObj.userData['materialPreset'] = params.materialPreset;
    const node = this.extractNodeMetadata(targetObj);
    this.refreshSceneGraph();
    this.contextRef.onHierarchyChange?.();

    return {
      success: true,
      action: 'cad_apply_material',
      target: targetObj.name,
      node,
      message: `Applied architectural material preset "${params.materialPreset}" to "${targetObj.name}".`,
    };
  }

  /**
   * 12. cad_measure: Inspects distances, bounding boxes, floor areas, volume, and clearances.
   */
  async measure(params: CadMeasureParams): Promise<StudioToolResult<CadMeasureResultData>> {
    if (!this.contextRef) {
      return { success: false, message: 'No active 3D scene is currently bound' };
    }

    const isScene = !params.targetA || params.targetA === 'scene';
    const objA = !isScene ? this.resolveTargetObject(params.targetA) : null;
    if (!objA && !isScene) {
      return { success: false, message: `Target A "${params.targetA}" not found in scene.` };
    }

    const targetObjA = objA || this.contextRef.scene;

    const data: CadMeasureResultData = {
      measurementType: params.measurementType,
      targetA: params.targetA || 'scene',
      targetB: params.targetB,
    };

    switch (params.measurementType) {
      case 'distance': {
        const objB = this.resolveTargetObject(params.targetB);
        if (!objB) {
          return {
            success: false,
            message: `Target B "${params.targetB}" not found for distance measurement.`,
          };
        }
        const boxA = new THREE.Box3().setFromObject(targetObjA);
        const boxB = new THREE.Box3().setFromObject(objB);
        const centerA = new THREE.Vector3();
        const centerB = new THREE.Vector3();
        boxA.getCenter(centerA);
        boxB.getCenter(centerB);

        const distance = centerA.distanceTo(centerB);
        data.distance = Math.round(distance * 100) / 100;
        data.value = data.distance;
        data.unit = 'm';
        data.formatted = `${data.distance.toFixed(2)} m`;
        data.message = `Distance between "${data.targetA}" and "${params.targetB}" is ${data.formatted}.`;
        break;
      }
      case 'bounding_box': {
        const box = new THREE.Box3().setFromObject(targetObjA);
        const size = new THREE.Vector3();
        box.getSize(size);

        data.boundingBox = {
          width: Math.round(size.x * 100) / 100,
          height: Math.round(size.y * 100) / 100,
          depth: Math.round(size.z * 100) / 100,
          min: {
            x: Math.round(box.min.x * 100) / 100,
            y: Math.round(box.min.y * 100) / 100,
            z: Math.round(box.min.z * 100) / 100,
          },
          max: {
            x: Math.round(box.max.x * 100) / 100,
            y: Math.round(box.max.y * 100) / 100,
            z: Math.round(box.max.z * 100) / 100,
          },
        };
        data.formatted = `${data.boundingBox.width.toFixed(2)}m (W) × ${data.boundingBox.height.toFixed(2)}m (H) × ${data.boundingBox.depth.toFixed(2)}m (D)`;
        data.message = `Bounding box of "${data.targetA}": ${data.formatted}.`;
        break;
      }
      case 'floor_area': {
        const box = new THREE.Box3().setFromObject(targetObjA);
        const size = new THREE.Vector3();
        box.getSize(size);
        let area = size.x * size.z;
        const dims = objA?.userData?.['dimensions'];
        if (dims?.radius !== undefined && typeof dims.radius === 'number') {
          area = Math.PI * dims.radius * dims.radius;
        } else if (dims?.width && dims?.length) {
          area = dims.width * dims.length;
        }
        data.floorArea = Math.round(area * 100) / 100;
        data.value = data.floorArea;
        data.unit = 'm²';
        data.formatted = `${data.floorArea.toFixed(2)} m²`;
        data.message = `Surface floor footprint area of "${data.targetA}" is ${data.formatted}.`;
        break;
      }
      case 'volume': {
        const box = new THREE.Box3().setFromObject(targetObjA);
        const size = new THREE.Vector3();
        box.getSize(size);
        let volume = size.x * size.y * size.z;
        const dims = objA?.userData?.['dimensions'];
        if (dims?.radius !== undefined && typeof dims.radius === 'number') {
          volume = Math.PI * dims.radius * dims.radius * size.y;
        }
        data.volume = Math.round(volume * 100) / 100;
        data.value = data.volume;
        data.unit = 'm³';
        data.formatted = `${data.volume.toFixed(2)} m³`;
        data.message = `Volume of "${data.targetA}" is ${data.formatted}.`;
        break;
      }
      case 'clearance': {
        const objB = this.resolveTargetObject(params.targetB);
        if (!objB) {
          return {
            success: false,
            message: `Target B "${params.targetB}" not found for clearance measurement.`,
          };
        }
        const boxA = new THREE.Box3().setFromObject(targetObjA);
        const boxB = new THREE.Box3().setFromObject(objB);

        const dx = Math.max(0, boxB.min.x - boxA.max.x, boxA.min.x - boxB.max.x);
        const dy = Math.max(0, boxB.min.y - boxA.max.y, boxA.min.y - boxB.max.y);
        const dz = Math.max(0, boxB.min.z - boxA.max.z, boxA.min.z - boxB.max.z);
        const clearance = Math.hypot(dx, dy, dz);

        data.clearance = Math.round(clearance * 100) / 100;
        data.value = data.clearance;
        data.unit = 'm';
        data.formatted = `${data.clearance.toFixed(2)} m`;
        data.message = `Clearance distance between "${data.targetA}" and "${params.targetB}" is ${data.formatted}.`;
        break;
      }
    }

    return {
      success: true,
      action: 'cad_measure',
      target: data.targetA,
      data,
      message: data.message || `Measurement (${params.measurementType}) completed.`,
    };
  }
}

