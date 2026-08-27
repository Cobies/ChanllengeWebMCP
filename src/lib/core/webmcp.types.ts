/**
 * WebMCP Core Type Definitions and Protocol Contracts.
 * Conforms to W3C Model Context Protocol in the Browser specifications.
 */

export interface WebMcpPropertySchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: (string | number)[];
  default?: unknown;
  items?: WebMcpPropertySchema;
  properties?: Record<string, WebMcpPropertySchema>;
  required?: string[];
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
