import { InjectionToken, DestroyRef } from '@angular/core';

/**
 * WebMCP Core Type Definitions and Protocol Contracts.
 * Conforms to W3C Model Context Protocol in the Browser specifications.
 */

export interface WebMcpPropertySchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | ('string' | 'number' | 'integer' | 'boolean' | 'array' | 'object')[];
  description?: string;
  enum?: (string | number)[];
  default?: unknown;
  items?: WebMcpPropertySchema;
  properties?: Record<string, WebMcpPropertySchema>;
  required?: string[];
  oneOf?: WebMcpPropertySchema[];
  anyOf?: WebMcpPropertySchema[];
}

export interface WebMcpToolParameterSchema {
  type: 'object';
  properties: Record<string, WebMcpPropertySchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface WebMcpToolDefinition<TParams = Record<string, unknown>, TResult = unknown> {
  name: string;
  description: string;
  parameters: WebMcpToolParameterSchema;
  handler: (params: TParams) => Promise<TResult> | TResult;
}

export interface WebMcpExecutionLog {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  timestamp: number;
  durationMs: number;
  source: 'native' | 'emulator' | 'ui';
}

export interface WebMcpConfig {
  /**
   * If true, mounts an in-memory ModelContext polyfill when window.modelContext is not detected.
   * Default: true
   */
  enableEmulatorFallback?: boolean;
  /**
   * Automatically registers the built-in `take_screenshot` tool.
   * Default: true
   */
  enableBuiltInScreenshot?: boolean;
  /**
   * Prints real-time agent invocations to console with styled formatting.
   * Default: true
   */
  logExecutionToConsole?: boolean;
}

/**
 * Standard W3C WebMCP Browser ModelContext Contract.
 * Available on window.modelContext or navigator.modelContext when browser AI is enabled.
 */
export interface BrowserModelContext {
  getTools(): Promise<WebMcpToolDefinition[]> | WebMcpToolDefinition[];
  registerTool(tool: WebMcpToolDefinition): Promise<void> | void;
  unregisterTool(name: string): Promise<boolean> | boolean;
  executeTool(name: string, parameters?: Record<string, unknown>): Promise<unknown>;
  addEventListener?(type: string, listener: (event: CustomEvent) => void): void;
  removeEventListener?(type: string, listener: (event: CustomEvent) => void): void;
}

/* ==========================================================================
   Interceptor Pipeline & Middleware Types
   ========================================================================== */

export interface WebMcpExecutionContext {
  toolName: string;
  parameters: Record<string, unknown>;
  source: 'native' | 'emulator' | 'ui';
  metadata?: Record<string, unknown>;
}

export type WebMcpHandler = (context: WebMcpExecutionContext) => Promise<unknown>;

export interface WebMcpInterceptor {
  intercept(context: WebMcpExecutionContext, next: WebMcpHandler): Promise<unknown>;
}

export type WebMcpInterceptorFn = (
  context: WebMcpExecutionContext,
  next: WebMcpHandler
) => Promise<unknown>;

export const WEBMCP_INTERCEPTORS = new InjectionToken<WebMcpInterceptor[]>('WEBMCP_INTERCEPTORS');

/* ==========================================================================
   Reactive Signal Tool Options
   ========================================================================== */

export interface SignalToolOptions<T> {
  name: string;
  description: string;
  parameters?: WebMcpToolParameterSchema;
  /**
   * Value transformer for converting agent parameters to signal value.
   */
  transform?: (params: Record<string, unknown>) => T;
  /**
   * Explicit DestroyRef to bind lifecycle teardown.
   * If omitted, DestroyRef is resolved via inject(DestroyRef, { optional: true }).
   */
  destroyRef?: DestroyRef;
}

/* ==========================================================================
   3D Scene Action Types
   ========================================================================== */

export type Scene3DActionType =
  | 'rotate'
  | 'zoom'
  | 'change_mesh_color'
  | 'play_animation'
  | 'reset_camera'
  | 'highlight_part';

export interface Scene3DActionParams {
  action: Scene3DActionType;
  deltaX?: number;      // Degrees horizontal orbit
  deltaY?: number;      // Degrees vertical orbit
  zoomFactor?: number;  // Multiplier (e.g. 0.8 to zoom in, 1.25 to zoom out)
  meshName?: string;    // Target mesh name in 3D scene graph
  hexColor?: string;    // Target hex color "#RRGGBB"
  clipName?: string;    // Animation clip identifier
  durationMs?: number;  // Lerp / transition time in ms
}

export interface Scene3DActionResult {
  success: boolean;
  action: Scene3DActionType;
  sceneState: {
    camera: { x: number; y: number; z: number; target: [number, number, number] };
    activeMeshes: string[];
    currentAnimation?: string;
  };
  message: string;
}

/* ==========================================================================
   Multimodal Viewport Capture Types
   ========================================================================== */

export interface TakeScreenshotParams {
  selector?: string; // CSS selector of target canvas/element (default: "body")
  format?: 'image/png' | 'image/jpeg' | 'image/webp'; // Default: 'image/png'
  quality?: number; // 0.1 to 1.0 (default: 0.92)
}

export interface TakeScreenshotResult {
  success: boolean;
  image: string; // Base64 Data URL ("data:image/png;base64,...")
  mimeType: string;
  dimensions: { width: number; height: number };
  timestamp: number;
  error?: string;
}

/* ==========================================================================
   Form Automation Runner Types
   ========================================================================== */

export interface FormActionRunnerParams {
  formId: string;
  fields: Record<string, string | number | boolean>;
  submit?: boolean;
}

export interface FormActionRunnerResult {
  success: boolean;
  formId: string;
  validationErrors?: Record<string, string>;
  submitted: boolean;
  resultPayload?: unknown;
  message?: string;
}

/* ==========================================================================
   3D Creation Studio & WebMCP DCC Co-Pilot Types
   ========================================================================== */

export type StudioPrimitiveType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'torus_knot'
  | 'plane'
  | 'pedestal'
  | 'text'
  | 'light';

export type StudioShadingMode = 'pbr' | 'wireframe' | 'solid' | 'normal';

export type StudioCameraViewPreset = 'perspective' | 'top' | 'front' | 'side' | 'iso';

export type StudioTransformGizmoMode = 'translate' | 'rotate' | 'scale' | 'none';

export interface StudioMaterialConfig {
  color?: string;
  metalness?: number;
  roughness?: number;
  transmission?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  clearcoat?: number;
  ior?: number;
}

export interface StudioTransformParams {
  target?: string; // mesh name or 'selected'
  position?: { x?: number; y?: number; z?: number };
  rotation?: { x?: number; y?: number; z?: number }; // degrees
  scale?: { x?: number; y?: number; z?: number } | number;
  relative?: boolean;
  durationMs?: number;
}

export interface StudioCreateObjectParams {
  type: StudioPrimitiveType;
  name?: string;
  position?: { x?: number; y?: number; z?: number };
  rotation?: { x?: number; y?: number; z?: number }; // degrees
  scale?: { x?: number; y?: number; z?: number } | number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    tube?: number;
    radialSegments?: number;
    tubularSegments?: number;
    text?: string;
    fontSize?: number;
  };
  material?: StudioMaterialConfig;
  lightType?: 'point' | 'directional' | 'spot' | 'ambient';
  lightIntensity?: number;
  lightColor?: string;
}

export interface StudioMaterialParams {
  target?: string; // mesh name or 'selected'
  material: StudioMaterialConfig;
}

export interface StudioHierarchyParams {
  action: 'select' | 'duplicate' | 'delete' | 'toggle_visibility' | 'lock' | 'clear_custom' | 'reset_scene';
  target?: string;
  visible?: boolean;
  locked?: boolean;
  offset?: { x?: number; y?: number; z?: number };
}

export interface StudioViewportParams {
  shadingMode?: StudioShadingMode;
  cameraView?: StudioCameraViewPreset;
  showGrid?: boolean;
  showShadows?: boolean;
  gizmoMode?: StudioTransformGizmoMode;
}

export interface StudioExportParams {
  format?: 'gltf' | 'glb';
  target?: 'scene' | 'selected';
  binary?: boolean;
  filename?: string;
}

export interface StudioSceneNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  isCustom: boolean;
  childrenCount?: number;
  triangleCount?: number;
  vertexCount?: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  material?: StudioMaterialConfig;
}

export interface StudioToolResult<T = unknown> {
  success: boolean;
  action?: string;
  target?: string;
  node?: StudioSceneNode;
  nodes?: StudioSceneNode[];
  sceneMetrics?: {
    triangles: number;
    vertices: number;
    meshesCount: number;
  };
  data?: T;
  message: string;
}

/* ==========================================================================
   SketchUp-Style Web CAD & WebMCP Co-Design Studio Types
   ========================================================================== */

export type CadShapeType =
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'polyline'
  | 'wall'
  | 'polygon';

export type CadPlane = 'xz' | 'xy' | 'yz' | 'ground';

export type CadMaterialPreset =
  | 'concrete'
  | 'wood_oak'
  | 'brick_red'
  | 'glass_frosted'
  | 'marble_carrara'
  | 'steel_brushed'
  | 'tile_subway'
  | 'gold'
  | 'neon_cyan'
  | 'matte_dark'
  | 'plaster_white';

export type CadComponentType =
  | 'desk'
  | 'chair'
  | 'sofa'
  | 'door'
  | 'window'
  | 'column'
  | 'pedestal'
  | 'staircase'
  | 'tree'
  | 'car'
  | 'cyber_car'
  | 'lamp';

export type CadActiveTool =
  | 'select'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'push_pull'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'tape_measure'
  | 'paint_bucket'
  | 'orbit'
  | 'pan'
  | 'zoom';

export type CadMeasurementType =
  | 'distance'
  | 'bounding_box'
  | 'floor_area'
  | 'volume'
  | 'clearance';

export interface CadDrawShapeParams {
  shape: CadShapeType;
  name?: string;
  plane?: CadPlane;
  origin?: { x?: number; y?: number; z?: number };
  dimensions?: {
    width?: number;
    length?: number;
    radius?: number;
    wallThickness?: number;
    height?: number;
    points?: { x: number; y?: number; z?: number }[];
  };
  fill?: boolean;
  materialPreset?: CadMaterialPreset;
}

export interface CadPushPullParams {
  target: string;
  distance: number;
  direction?: 'up' | 'down' | 'normal' | 'x' | 'y' | 'z';
  hollow?: boolean;
  bevel?: boolean;
  materialPreset?: CadMaterialPreset;
}

export interface CadPlaceComponentParams {
  componentType: CadComponentType;
  name?: string;
  position?: { x?: number; y?: number; z?: number };
  rotationY?: number; // degrees
  scale?: number | { x?: number; y?: number; z?: number };
  materialPreset?: CadMaterialPreset;
}

export interface CadApplyMaterialParams {
  target: string;
  materialPreset: CadMaterialPreset;
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transmission?: number;
  clearcoat?: number;
  wireframe?: boolean;
  repeat?: number;
}

export interface CadMeasureParams {
  targetA: string;
  targetB?: string;
  measurementType: CadMeasurementType;
}

export interface CadMeasureResultData {
  measurementType: CadMeasurementType;
  value?: number;
  unit?: string;
  formatted?: string;
  distance?: number;
  floorArea?: number;
  volume?: number;
  clearance?: number;
  boundingBox?: {
    width: number;
    height: number;
    depth: number;
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  targetA: string;
  targetB?: string;
  message?: string;
}


