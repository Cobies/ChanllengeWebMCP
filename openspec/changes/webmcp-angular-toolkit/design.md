# Design: WebMCP Angular 22 Toolkit & 3D Interactive Showcase

**Change**: `webmcp-angular-toolkit`  
**Status**: Ready for Implementation  
**Target Environment**: Angular 22, Bun runtime, Tailwind CSS v4, Three.js WebGL, W3C WebMCP Standard (`window.modelContext` / `navigator.modelContext`)

---

## 1. Technical Approach

The WebMCP Angular Toolkit (`@webmcp/angular` / `ngx-webmcp`) bridges browser AI agents with Angular 22 applications through reactive Signals, declarative template directives, a multimodal viewport rasterizer (`take_screenshot`), and a Three.js 3D WebGL action bus (`scene_3d_action`).

The architecture consists of an Angular 22 multi-project workspace:
1. **`projects/ngx-webmcp`**: The standalone core library exporting `provideWebMcp()`, `WebMcpService`, directives (`[webmcpTool]`, `[webmcpAction]`), `toWebMcpTool()`, `WebmcpViewportCaptureService`, `WebmcpThreeSceneBridge`, and `WebmcpFormRunnerService`.
2. **`projects/showcase`**: A modern showcase app featuring an interactive 3D digital twin (cyber-vehicle/drone), reactive form workflows, and a real-time WebMCP inspector console.

---

## 2. Architecture Decisions

| Area | Option Chosen | Alternatives Considered | Tradeoff & Rationale |
|------|---------------|-------------------------|----------------------|
| **Workspace Layout** | Angular 22 Multi-Project Monorepo (`projects/ngx-webmcp` + `projects/showcase`) | Separate git repos or single monolith app | **Chosen**: Single workspace allows simultaneous library development, live showcase testing, and clean `@webmcp/angular` packaging without symlink fragility. |
| **WebMCP Context Handling** | Hybrid Sensing with Seamless Local Emulator | Strict native-only reliance or mocked mock-only stub | **Chosen**: Native `modelContext` is used when Chrome flags are enabled (`#enable-webmcp-testing`), while `WebMcpEmulator` automatically polyfills standard browsers and testing harnesses. |
| **Reactivity Primitives** | Angular 22 Signals (`signal()`, `computed()`, `effect()`) | RxJS Subject streams only | **Chosen**: Modern Angular 22 signal-first API offers fine-grained change detection, simpler template integration, and clean signal-to-tool bindings (`toWebMcpTool`). |
| **3D Rendering Bridge** | Event-driven `Scene3DActionBus` with frame interpolation | Direct synchronous Three.js scene object mutations | **Chosen**: Asynchronous command queue interpolates camera vectors and material tweens over `requestAnimationFrame`, preventing UI stutter during agent calls. |
| **Multimodal Capture** | Native WebGL frame buffer readback + SVG `<foreignObject>` DOM rasterizer | Heavy external Puppeteer / backend screenshot services | **Chosen**: 100% client-side zero-dependency capture executes instantly in-browser and returns base64 image data URLs directly to AI agents. |
| **Styling & Theme** | Tailwind CSS v4 + Cyberpunk/Dark Modern theme | Angular Material or plain CSS | **Chosen**: Tailwind v4 delivers zero-runtime CSS, modern CSS variables, fast build times, and high visual polish for Devpost judges. |

---

## 3. Data Flow & Signal Architecture

```
                                  ┌────────────────────────────────┐
                                  │   Browser AI Agent / Judge     │
                                  │ (Chrome Canary / ChatGPT / UI) │
                                  └───────────────┬────────────────┘
                                                  │
                      modelContext.executeTool()  │  modelContext.getTools()
                                                  ▼
     ┌─────────────────────────────────────────────────────────────────────────────┐
     │                       Browser / Emulated Model Context                      │
     │                 (window.modelContext / navigator.modelContext)              │
     └────────────────────────────────────┬────────────────────────────────────────┘
                                          │
                                          ▼
     ┌─────────────────────────────────────────────────────────────────────────────┐
     │                       WebMcpService (Angular Core)                          │
     │  - registeredTools: Signal<WebMcpToolDefinition[]>                          │
     │  - executionLogs: Signal<WebMcpExecutionLog[]>                              │
     │  - isNativeContext: Signal<boolean>                                         │
     └──────┬──────────────────────┬──────────────────────┬─────────────────┬──────┘
            │                      │                      │                 │
            ▼                      ▼                      ▼                 ▼
   ┌─────────────────┐   ┌───────────────────┐  ┌──────────────────┐  ┌─────────────┐
   │ Declarative     │   │ 3D Scene Action   │  │ Viewport Capture │  │ Form Runner │
   │ Directives      │   │ Bus (Three.js)    │  │ (take_screenshot)│  │ Service     │
   │ [webmcpTool]    │   │ scene_3d_action   │  │                  │  │             │
   └────────┬────────┘   └─────────┬─────────┘  └─────────┬────────┘  └──────┬──────┘
            │                      │                      │                  │
            ▼                      ▼                      ▼                  ▼
   ┌─────────────────┐   ┌───────────────────┐  ┌──────────────────┐  ┌─────────────┐
   │ Angular DOM     │   │ WebGL Canvas      │  │ Canvas Rasterizer│  │ Reactive    │
   │ Components      │   │ Three.js Scene    │  │ Base64 PNG/JPEG  │  │ Form State  │
   └─────────────────┘   └───────────────────┘  └──────────────────┘  └─────────────┘
            │                      │                      │                  │
            └──────────────────────┴──────────┬───────────┴──────────────────┘
                                              ▼
                             ┌──────────────────────────────────┐
                             │ Live WebMCP Inspector Console UI │
                             │ (Real-time Execution & Log Panel)│
                             └──────────────────────────────────┘
```

---

## 4. Directory & Module Layout

```
ChanllengeWebMCP/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI for build & test
├── projects/
│   ├── ngx-webmcp/                    # Core Angular 22 Library
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── core/
│   │   │   │   │   ├── webmcp.service.ts        # Primary registry & context wrapper
│   │   │   │   │   ├── webmcp.provider.ts       # provideWebMcp() factory
│   │   │   │   │   ├── webmcp.emulator.ts       # In-memory browser context polyfill
│   │   │   │   │   ├── webmcp.types.ts          # Core TypeScript interfaces & schemas
│   │   │   │   │   └── schema-generator.ts      # JSON schema generator helpers
│   │   │   │   ├── directives/
│   │   │   │   │   ├── webmcp-tool.directive.ts # [webmcpTool] directive
│   │   │   │   │   ├── webmcp-action.directive.ts# [webmcpAction] directive
│   │   │   │   │   └── webmcp-signal.ts         # toWebMcpTool() signal helper
│   │   │   │   ├── multimodal/
│   │   │   │   │   ├── viewport-capture.service.ts # take_screenshot provider
│   │   │   │   │   └── canvas-rasterizer.ts    # WebGL & DOM rasterization logic
│   │   │   │   ├── three/
│   │   │   │   │   ├── three-scene-bridge.ts    # Three.js WebMCP bridge
│   │   │   │   │   ├── scene-action-bus.ts      # Asynchronous 3D command queue
│   │   │   │   │   └── camera-interpolator.ts   # Smooth orbit camera lerper
│   │   │   │   └── forms/
│   │   │   │       ├── form-runner.service.ts   # form_action_runner provider
│   │   │   │       └── form-registry.ts         # Dynamic Angular FormGroup binder
│   │   │   └── public-api.ts          # Public library exports
│   │   ├── ng-package.json
│   │   ├── package.json
│   │   └── tsconfig.lib.json
│   └── showcase/                      # Interactive Demo Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   │   ├── header/        # Header with connection badge & quick prompts
│       │   │   │   ├── visualizer-3d/ # Three.js 3D canvas viewport & controls
│       │   │   │   ├── customizer-form/# Dynamic reactive vehicle customizer
│       │   │   │   ├── inspector/     # Real-time WebMCP tool execution log
│       │   │   │   └── judge-guide/   # In-app Chrome Canary flag testing guide
│       │   │   ├── app.component.ts   # Main container component
│       │   │   ├── app.component.html # Clean responsive grid layout
│       │   │   └── app.config.ts      # Application config & provideWebMcp()
│       │   ├── styles.css             # Tailwind CSS v4 directives & theme
│       │   └── index.html             # Shell index page
│       └── tsconfig.app.json
├── angular.json                       # Angular CLI multi-project workspace config
├── package.json                       # Root scripts and workspace dependencies
├── tsconfig.json                      # Path aliases for @webmcp/angular
├── LICENSE                            # MIT License
└── README.md                          # Comprehensive English documentation & testing guide
```

---

## 5. Interfaces & Contracts

### 5.1 Core Tool Definition & Context Interfaces

```typescript
export interface WebMcpToolParameterSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
    default?: unknown;
  }>;
  required?: string[];
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
  enableEmulatorFallback?: boolean; // Default: true
  enableBuiltInScreenshot?: boolean; // Default: true
  logExecutionToConsole?: boolean;   // Default: true
}
```

### 5.2 3D Scene Controller Contracts (`scene_3d_action`)

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
  deltaX?: number;      // Degrees for horizontal orbit
  deltaY?: number;      // Degrees for vertical orbit
  zoomFactor?: number;  // Multiplier (0.8 = zoom in, 1.2 = zoom out)
  meshName?: string;    // Target mesh identifier in scene graph
  hexColor?: string;    // Hex color format "#RRGGBB"
  clipName?: string;    // Animation clip name
  durationMs?: number;  // Animation / interpolation time in ms
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

### 5.3 Multimodal Capture Contracts (`take_screenshot`)

```typescript
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
```

### 5.4 Form Runner Contracts (`form_action_runner`)

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
  message?: string;
}
```

---

## 6. Planned File Changes

| File Path | Action | Description |
|-----------|--------|-------------|
| `package.json` | Create | Root workspace dependencies (Angular 22, Three.js, Tailwind CSS v4, Bun) |
| `angular.json` | Create | Angular CLI multi-project workspace configuration |
| `tsconfig.json` | Create | Base TypeScript configuration with `@webmcp/angular` path mapping |
| `projects/ngx-webmcp/package.json` | Create | Library packaging metadata |
| `projects/ngx-webmcp/ng-package.json` | Create | ng-packagr configuration |
| `projects/ngx-webmcp/tsconfig.lib.json` | Create | Library TypeScript compiler configuration |
| `projects/ngx-webmcp/src/public-api.ts` | Create | Public entrypoint exporting all services, directives, and types |
| `projects/ngx-webmcp/src/lib/core/webmcp.types.ts` | Create | TypeScript definitions, tool schemas, and log interfaces |
| `projects/ngx-webmcp/src/lib/core/webmcp.emulator.ts` | Create | Standard browser `modelContext` in-memory fallback polyfill |
| `projects/ngx-webmcp/src/lib/core/webmcp.service.ts` | Create | Root Angular service managing tool lifecycles and reactive signals |
| `projects/ngx-webmcp/src/lib/core/webmcp.provider.ts` | Create | `provideWebMcp()` application config provider |
| `projects/ngx-webmcp/src/lib/directives/webmcp-tool.directive.ts` | Create | `[webmcpTool]` declarative tool binding directive |
| `projects/ngx-webmcp/src/lib/directives/webmcp-action.directive.ts` | Create | `[webmcpAction]` directive for UI event bindings |
| `projects/ngx-webmcp/src/lib/directives/webmcp-signal.ts` | Create | `toWebMcpTool()` reactive signal utility |
| `projects/ngx-webmcp/src/lib/multimodal/canvas-rasterizer.ts` | Create | WebGL and DOM canvas rasterization helper |
| `projects/ngx-webmcp/src/lib/multimodal/viewport-capture.service.ts` | Create | `take_screenshot` tool registration and capture service |
| `projects/ngx-webmcp/src/lib/three/camera-interpolator.ts` | Create | Spherical orbit camera lerp and tweening engine |
| `projects/ngx-webmcp/src/lib/three/scene-action-bus.ts` | Create | Asynchronous frame-synchronized 3D command queue |
| `projects/ngx-webmcp/src/lib/three/three-scene-bridge.ts` | Create | Three.js scene controller and `scene_3d_action` tool provider |
| `projects/ngx-webmcp/src/lib/forms/form-registry.ts` | Create | Angular `FormGroup` registration hub |
| `projects/ngx-webmcp/src/lib/forms/form-runner.service.ts` | Create | `form_action_runner` tool provider |
| `projects/showcase/tsconfig.app.json` | Create | Showcase application TypeScript configuration |
| `projects/showcase/src/styles.css` | Create | Tailwind CSS v4 styling, custom scrollbars, and neon glow effects |
| `projects/showcase/src/index.html` | Create | Application HTML shell with dark theme defaults |
| `projects/showcase/src/app/app.config.ts` | Create | Showcase application configuration with `provideWebMcp()` |
| `projects/showcase/src/app/app.component.ts` | Create | Showcase root component coordinating 3D scene, form, and inspector |
| `projects/showcase/src/app/app.component.html` | Create | Main showcase layout template |
| `projects/showcase/src/app/components/header/header.component.ts` | Create | Status banner, mode indicators, and suggested agent prompt chips |
| `projects/showcase/src/app/components/visualizer-3d/visualizer-3d.component.ts` | Create | Three.js 3D canvas viewport, lighting, and model setup |
| `projects/showcase/src/app/components/customizer-form/customizer-form.component.ts` | Create | Reactive configuration form with agent bindings |
| `projects/showcase/src/app/components/inspector/inspector.component.ts` | Create | Real-time WebMCP execution console with payload visualizer |
| `projects/showcase/src/app/components/judge-guide/judge-guide.component.ts` | Create | Interactive testing instructions for Devpost judges |
| `.github/workflows/ci.yml` | Create | CI pipeline running build and unit test verification |
| `LICENSE` | Create | Official MIT Open Source License |
| `README.md` | Create | Comprehensive English documentation and judge setup instructions |

---

## 7. Testing Strategy

| Layer | Component / Area | Verification Approach |
|-------|------------------|-----------------------|
| **Unit** | `WebMcpService` & `WebMcpEmulator` | Verify tool registration, deregistration, duplicate handling, parameter validation, and execution signals. |
| **Unit** | `WebmcpToolDirective` & `toWebMcpTool` | Test component lifecycle auto-registration on `ngOnInit` and deregistration on `ngOnDestroy`. |
| **Unit** | `WebmcpViewportCaptureService` | Validate base64 image generation for canvas elements and graceful error reporting for missing selectors. |
| **Unit** | `WebmcpThreeSceneBridge` | Test `rotate`, `zoom`, `change_mesh_color`, and `reset_camera` commands on mock Three.js scene graph. |
| **Unit** | `WebmcpFormRunnerService` | Verify dynamic form field patching, validation error reporting, and submission handling. |
| **Integration** | Showcase End-to-End Flow | Verify that agent commands dispatched through `modelContext.executeTool` mutate 3D visualizer, update forms, and populate the live inspector log. |

---

## 8. Threat Matrix & Security Analysis

| Threat / Boundary | Applicable? | Safe / Failure Behavior | Planned Verification |
|-------------------|-------------|-------------------------|----------------------|
| **Arbitrary Code Execution via Tool Handlers** | Applicable | Tool handlers are strictly typed TypeScript functions defined at build time. Parameter payloads are validated against schemas before handler invocation. | Unit test passing invalid/malformed parameters and asserting schema rejection without execution. |
| **Tainted Canvas / CORS Violation during Capture** | Applicable | Canvas rasterizer checks for same-origin assets. If WebGL readback fails, returns `{ success: false, error: "Canvas capture tainted" }` rather than crashing the thread. | Unit test verifying error payload handling when canvas read fails. |
| **DOM Injection via Log Visualizer** | Applicable | Inspector component renders tool parameters and results safely using Angular text interpolation and sanitized JSON trees, preventing XSS injection. | Component test ensuring raw HTML strings in tool parameters are escaped. |
| **Action Bus Queue Starvation / Deadlocks** | Applicable | 3D Action Bus employs timeout safeguards (`durationMs + 200ms`) ensuring promises resolve even if render frame drops. | Test simulating frame timeout recovery. |

---

## 9. Migration & Rollout

- **New Greenfield Toolkit**: This change introduces a self-contained Angular workspace. No legacy migration or data conversion is required.
- **Rollout Strategy**:
  1. Build and verify library package (`@webmcp/angular`).
  2. Build and verify showcase application with Tailwind CSS v4.
  3. Validate Chrome Canary WebMCP flag integration and local fallback emulator.

---

## 10. Open Questions

- None. All architectural boundaries, schemas, and Devpost deliverables are fully specified and aligned with the proposal and specification.
