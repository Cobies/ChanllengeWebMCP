# WebMCP Angular Toolkit & 3D Interactive Showcase 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular 22](https://img.shields.io/badge/Angular-22.0-dd0031.svg?logo=angular)](https://angular.dev)
[![Bun Runtime](https://img.shields.io/badge/Runtime-Bun-f472b6.svg?logo=bun)](https://bun.sh)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg?logo=threedotjs)](https://threejs.org)
[![W3C WebMCP Standard](https://img.shields.io/badge/WebMCP-W3C%20Standard-emerald.svg)](https://modelcontextprotocol.io)

An enterprise Angular 22 toolkit and interactive 3D digital twin showcase for the **WebMCP (Model Context Protocol in the Browser)** standard. Seamlessly bridges browser AI agents (Chrome AI, ChatGPT in-app browser, Claude, autonomous copilots) directly with Angular reactive Signals, client-side Three.js WebGL scenes, declarative template directives, form automation, and multimodal viewport snapshots.

---

## 🌟 Key Features

1. **Angular 22 Reactive Signals First**:
   - Seamlessly connect Angular signals (`signal()`, `computed()`, `effect()`) to agent tools using `toWebMcpTool()`.
   - Real-time reactivity with zero change-detection penalty.

2. **Hybrid Context Sensing & Seamless In-Memory Emulator**:
   - Automatically detects browser-native `window.modelContext` / `navigator.modelContext` (when Chrome flags are active).
   - Transparently falls back to an in-memory `WebMcpEmulator` for standard browsers, node test runners, and instant developer evaluation.

3. **Multimodal Viewport Capture (`take_screenshot`)**:
   - 100% client-side WebGL canvas and DOM rasterization producing base64 image data URLs.
   - Enables browser AI agents to visually inspect 3D scenes and UI state in real time.

4. **Interactive 3D WebGL Action Bus (`scene_3d_action`)**:
   - Frame-synchronized Three.js bridge for camera orbit rotation (`rotate`), zoom (`zoom`), material colors (`change_mesh_color`), animations (`play_animation`), part highlighting (`highlight_part`), and camera resets (`reset_camera`).
   - Asynchronous action queue with built-in frame timeout protection.

5. **Form Automation Runner (`form_action_runner`)**:
   - Exposes registered Angular `FormGroup` instances to AI agents for automated field population, validation checking, and action submission.

6. **Live WebMCP Inspector Console**:
   - Real-time audit stream displaying incoming tool invocations, duration latency, parameter payloads, and results with sanitization and XSS protection.

---

## 📐 Architecture Overview

```
                                  ┌────────────────────────────────┐
                                  │   Browser AI Agent / Judge     │
                                  │ (Chrome Canary / ChatGPT / UI) │
                                  └───────────────┬────────────────┘
                                                  │
                       modelContext.executeTool() │  modelContext.getTools()
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
```

---

## ⚡ Quickstart with Bun

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) or Node.js (v20+)

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Showcase Application
```bash
bun start
```
Open [http://localhost:4200](http://localhost:4200) in your browser.

### 3. Run Unit & Threat Matrix Tests
```bash
bun test
```

### 4. Build Library & Showcase
```bash
bun run build
```

---

## 🧪 Devpost Judge Testing Guide

### Option A: Native Browser WebMCP Testing (Chrome Canary / Chromium)
1. Open Google Chrome or Chrome Canary and navigate to:
   ```text
   chrome://flags/#enable-webmcp-testing
   ```
2. Set the flag to **Enabled** and restart Chrome.
3. Open the showcase application at `http://localhost:4200`.
4. The header status badge will display **Native Browser Context** (Green indicator).
5. Attached AI agents or browser devtools can now execute tools directly via `window.modelContext`.

### Option B: Seamless In-Memory Emulator (Any Modern Browser)
- If testing in Chrome without flags, Firefox, Safari, or Edge, the application automatically mounts `WebMcpEmulator`.
- Use the **Agent Simulators** bar in the header or the interactive UI panels to trigger real-time WebMCP tool executions.
- The **Live WebMCP Inspector** will display the exact parameter contracts and execution metrics.

### Sample AI Agent Prompts to Test
- **Visual 3D Inspection**: *"Orbit the vehicle 45 degrees to the right, zoom in by 20%, and take a screenshot to inspect the front intake."*
- **Form Automation**: *"Configure the customizer form with chassis color '#00f0ff', select 'Overdrive' powertrain mode, and transmit the build order."*
- **Multimodal Part Highlighting**: *"Highlight the rear spoiler wing with an emissive pulse and capture the 3D frame."*

---

## 📦 Workspace Package Layout

```
ChanllengeWebMCP/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Continuous integration pipeline
├── projects/
│   ├── ngx-webmcp/                    # Core Angular 22 Library (@webmcp/angular)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── core/              # WebMcpService, Emulator, Types, Schemas
│   │   │   │   ├── directives/        # [webmcpTool], [webmcpAction], toWebMcpTool()
│   │   │   │   ├── multimodal/        # take_screenshot tool & CanvasRasterizer
│   │   │   │   ├── three/             # scene_3d_action tool, Scene3DActionBus, lerp
│   │   │   │   └── forms/             # form_action_runner & FormRegistry
│   │   │   └── public-api.ts          # Public library entrypoint
│   │   ├── ng-package.json
│   │   └── package.json
│   └── showcase/                      # Interactive Demo Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   │   ├── header/        # Connection status & prompt chips
│       │   │   │   ├── visualizer-3d/ # Three.js 3D viewport canvas
│       │   │   │   ├── customizer-form/# Reactive configuration form
│       │   │   │   ├── inspector/     # Real-time WebMCP execution console
│       │   │   │   └── judge-guide/   # In-app Chrome Canary flag testing guide
│       │   │   ├── app.component.ts   # Root container component
│       │   │   ├── app.component.html # Dashboard layout
│       │   │   └── app.config.ts      # Application config with provideWebMcp()
│       │   ├── styles.css             # Tailwind CSS v4 directives & theme
│       │   └── main.ts                # App bootstrap
│       └── tsconfig.app.json
├── angular.json                       # Angular CLI multi-project workspace config
├── package.json                       # Root workspace scripts & dependencies
├── tsconfig.json                      # Path aliases for @webmcp/angular
├── LICENSE                            # MIT License
└── README.md                          # Documentation & Devpost Submission Guide
```

---

## 💻 Library Usage in Your Angular Apps

### 1. Configure Provider in `app.config.ts`
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideWebMcp } from '@webmcp/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWebMcp({
      enableEmulatorFallback: true,
      enableBuiltInScreenshot: true,
      logExecutionToConsole: true
    })
  ]
};
```

### 2. Declarative Template Directive `[webmcpTool]`
```html
<div
  webmcpTool
  toolName="set_ui_theme"
  toolDescription="Switches the active application color palette"
  [toolParameters]="{
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['dark', 'light', 'cyber'] }
    },
    required: ['theme']
  }"
  (toolInvoked)="onThemeChange($event)">
</div>
```

### 3. Reactive Signal Binding `toWebMcpTool()`
```typescript
import { Component, signal } from '@angular/core';
import { toWebMcpTool } from '@webmcp/angular';

@Component({ ... })
export class MyComponent {
  readonly vehicleColor = signal('#00f0ff');

  constructor() {
    toWebMcpTool(this.vehicleColor, {
      name: 'set_vehicle_color',
      description: 'Updates vehicle paint color',
      transform: (p) => String(p['color'])
    });
  }
}
```

---

## 🔒 Security & Threat Analysis

- **Parameter Validation**: Input parameters are strictly validated against JSON Schema / typing contracts before executing handlers.
- **Tainted Canvas Safeguards**: Canvas readbacks catch cross-origin or buffer security violations and return structured error payloads without crashing.
- **XSS Prevention**: Inspector log visualizer truncates large binary payloads and sanitizes JSON outputs.
- **Action Bus Timeout Safeguards**: Frame-based 3D animations have timeout limits (`durationMs + 2000ms`) to avoid blocking agent execution queues.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
