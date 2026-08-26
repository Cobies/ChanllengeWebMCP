# Specification: WebMCP Angular Toolkit & 3D Interactive Showcase

**Change**: `webmcp-angular-toolkit`  
**Status**: Approved / Complete Spec  
**Target Environment**: Angular 22, Bun runtime, Tailwind CSS v4, Three.js WebGL, W3C WebMCP (`window.modelContext` / `navigator.modelContext`)

---

## 1. Domain: WebMCP Core Service & Registry (`webmcp-core-service`)

### Requirement: Native Context Sensing & Polyfill Negotiation
The system SHALL detect browser native WebMCP APIs (`window.modelContext` or `navigator.modelContext`) upon Angular application bootstrap and provide a full in-memory fallback emulator when running in standard browsers without flags.

#### Scenario: Native WebMCP environment detected
- **GIVEN** an active browser session with `window.modelContext` or `navigator.modelContext` present (e.g. Chrome Canary with `#enable-webmcp-testing`)
- **WHEN** `WebMcpService` initializes in the root injector
- **THEN** `WebMcpService.isNativeContext()` returns `true`
- **AND** all tool registrations delegate directly to the underlying browser `modelContext.registerTool()` API.

#### Scenario: Fallback emulator activation
- **GIVEN** a standard browser environment where `window.modelContext` is `undefined`
- **WHEN** `WebMcpService` initializes
- **THEN** `WebMcpService.isNativeContext()` returns `false`
- **AND** the system mounts `WebMcpEmulator` on `window.modelContext` to enable tool execution via console, agent shims, and testing harness.

---

### Requirement: Reactive Tool Registration & Schema Contracts
The `WebMcpService` MUST maintain a reactive registry of tools exposed to AI agents, validating tool metadata against JSON Schema / Zod definitions and emitting real-time signals when tools are registered, invoked, or removed.

#### Schema: `WebMcpToolDefinition`
```typescript
export interface WebMcpToolDefinition<TParams = unknown, TResult = unknown> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (params: TParams) => Promise<TResult> | TResult;
}
```

#### Scenario: Tool registration and signal reactivity
- **GIVEN** an active `WebMcpService` instance
- **WHEN** a component invokes `registerTool(definition)` with a valid name, description, parameters schema, and handler
- **THEN** the tool is registered in the active modelContext
- **AND** the `registeredTools` signal emits an updated array including the new tool.

#### Scenario: Duplicate tool registration handling
- **GIVEN** an existing tool with name `"take_screenshot"`
- **WHEN** another caller invokes `registerTool` with the name `"take_screenshot"`
- **THEN** `WebMcpService` SHALL overwrite or update the existing registration cleanly and emit a warning in `WebMcpLogSignal`.

---

## 2. Domain: Declarative Angular Primitives (`webmcp-declarative-directives`)

### Requirement: Declarative Tool Directive `[webmcpTool]`
The system SHALL provide an Angular directive `[webmcpTool]` allowing developers to expose component methods as agent tools declaratively in Angular templates or component classes.

#### Scenario: Component lifecycle automatic registration and cleanup
- **GIVEN** an Angular component hosting a `[webmcpTool]` directive or using `toMcpTool()`
- **WHEN** the component is mounted into the DOM (`ngOnInit`)
- **THEN** the directive registers the tool with `WebMcpService`
- **AND** WHEN the component is destroyed (`ngOnDestroy`), the tool is automatically unregistered from `WebMcpService`.

---

## 3. Domain: Multimodal Viewport Capture (`webmcp-viewport-capture`)

### Requirement: Built-in `take_screenshot` Tool
The system MUST provide a built-in `take_screenshot` tool compliant with WebMCP multimodal schemas, capturing full viewports, specific DOM elements, or WebGL HTML5 canvas frames as base64 data URLs.

#### Schema: `take_screenshot` Parameters & Response
```typescript
export interface TakeScreenshotParams {
  selector?: string; // CSS selector of element or canvas to capture (default: "body")
  format?: 'image/png' | 'image/jpeg' | 'image/webp'; // Default: 'image/png'
  quality?: number; // 0.1 to 1.0 (default: 0.92)
  fullPage?: boolean; // Full document scroll capture (default: false)
}

export interface TakeScreenshotResult {
  success: boolean;
  image: string; // Base64 Data URL ("data:image/png;base64,...")
  mimeType: string;
  dimensions: { width: number; height: number };
  timestamp: number;
}
```

#### Scenario: Full canvas / DOM screenshot capture
- **GIVEN** an active WebGL canvas or HTML container matching selector `"#product-3d-canvas"`
- **WHEN** the AI agent invokes `take_screenshot({ selector: "#product-3d-canvas", format: "image/png" })`
- **THEN** the tool returns a base64 encoded PNG data URL with width and height metadata
- **AND** `success` is `true`.

#### Scenario: Invalid element selector error handling
- **GIVEN** a selector `"#non-existent-canvas"` that does not exist in the DOM
- **WHEN** `take_screenshot` is executed
- **THEN** the tool returns `{ success: false, error: "Element matching selector '#non-existent-canvas' was not found" }` without throwing unhandled exceptions.

---

## 4. Domain: 3D Scene Controller & WebGL Action Bus (`webmcp-3d-scene-controller`)

### Requirement: Three.js `scene_3d_action` Tool
The system MUST expose a high-level 3D scene manipulation tool `scene_3d_action` allowing AI agents to interactively control 3D models, camera angles, color palettes, and animations.

#### Schema: `scene_3d_action` Actions & Parameters
```typescript
export type Scene3DActionType = 
  | 'rotate'
  | 'zoom'
  | 'change_mesh_color'
  | 'play_animation'
  | 'reset_camera'
  | 'highlight_part';

export interface Scene3DActionParams {
  action: Scene3DActionType;
  deltaX?: number; // For rotate (degrees / radians)
  deltaY?: number;
  zoomFactor?: number; // For zoom (e.g. 0.8 for zoom in, 1.2 for zoom out)
  meshName?: string; // Target mesh / part identifier
  hexColor?: string; // Hex color string (e.g. "#FF5733")
  clipName?: string; // Animation clip name (e.g. "explode_view", "idle")
  loop?: boolean;
  durationMs?: number; // Animation transition duration in ms (default: 600)
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
```

#### Scenario: Orbit camera rotation
- **GIVEN** a 3D Three.js scene initialized with a product model
- **WHEN** the AI agent executes `scene_3d_action({ action: "rotate", deltaX: 45, deltaY: 0, durationMs: 400 })`
- **THEN** the camera smoothly rotates 45 degrees along the horizontal orbit
- **AND** returns the updated camera position coordinates and `success: true`.

#### Scenario: Dynamic mesh color change
- **GIVEN** a 3D product with mesh named `"Chassis_Body"`
- **WHEN** the agent executes `scene_3d_action({ action: "change_mesh_color", meshName: "Chassis_Body", hexColor: "#00E5FF" })`
- **THEN** the material of `"Chassis_Body"` updates to `#00E5FF`
- **AND** returns confirmation message `"Updated color of Chassis_Body to #00E5FF"`.

#### Scenario: Unknown mesh name error recovery
- **GIVEN** the scene does not contain mesh `"Wings"`
- **WHEN** the agent executes `scene_3d_action({ action: "change_mesh_color", meshName: "Wings", hexColor: "#FF0000" })`
- **THEN** the tool returns `{ success: false, message: "Mesh 'Wings' not found in active scene. Available meshes: [Chassis_Body, Wheels, Windshield]" }`.

---

## 5. Domain: Form Automation Runner & Showcase UI (`webmcp-showcase-app`)

### Requirement: `form_action_runner` Tool
The system MUST provide a `form_action_runner` tool enabling AI agents to fill reactive form fields, trigger validation, and submit actions in the showcase application.

#### Schema: `form_action_runner`
```typescript
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
}
```

#### Scenario: Automated form fill and submission
- **GIVEN** a showcase configuration form with ID `"customizer-form"`
- **WHEN** the agent calls `form_action_runner({ formId: "customizer-form", fields: { customerName: "Devpost Judge", email: "judge@example.com", tier: "pro" }, submit: true })`
- **THEN** the Angular reactive form updates its signal values, validates constraints, submits the form, and returns `{ success: true, submitted: true }`.

---

## 6. Challenge Compliance & Workspace Requirements

### Requirement: Devpost WebMCP Challenge Submission Deliverables
The project repository SHALL satisfy all official WebMCP Challenge requirements:
1. **MIT License**: Root `LICENSE` file present.
2. **Comprehensive English Documentation**: Architecture diagrams, setup instructions, and testing guide.
3. **Judge Testing Harness**: Quickstart guide for Chrome Canary with `#enable-webmcp-testing` and interactive built-in agent console.
4. **Clean Workspace**: Bun package manager, Tailwind CSS v4, Angular 22 standalone architecture.
