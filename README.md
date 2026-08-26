# WebMCP Angular Toolkit & 3D Interactive Showcase 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular 22](https://img.shields.io/badge/Angular-22.0-dd0031.svg?logo=angular)](https://angular.dev)
[![Bun Runtime](https://img.shields.io/badge/Runtime-Bun-f472b6.svg?logo=bun)](https://bun.sh)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg?logo=threedotjs)](https://threejs.org)
[![Gemini 3.7 Flash High](https://img.shields.io/badge/AI%20Copilot-Gemini%203.7%20Flash%20High-purple.svg)](https://deepmind.google/technologies/gemini/)
[![W3C WebMCP Standard](https://img.shields.io/badge/WebMCP-W3C%20Standard-emerald.svg)](https://modelcontextprotocol.io)

An enterprise Angular 22 toolkit and interactive 3D digital twin showcase for the **WebMCP (Model Context Protocol in the Browser)** standard. Seamlessly bridges browser AI agents (Chrome AI, ChatGPT in-app browser, Claude, and **built-in Gemini 3.7 Flash High Copilot**) directly with Angular reactive Signals, client-side Three.js WebGL scenes, declarative template directives, form automation, and multimodal viewport snapshots.

---

## 🌟 Key Features

1. **🤖 Live In-App AI Copilot (Gemini 3.7 Flash High via CPAMC Bridge)**:
   - Built-in conversational chat drawer powered by Gemini 3.7 Flash High through the CPAMC Secure Bridge Proxy (`https://bridge.cobiesscooby.com/v1`).
   - Dynamic WebMCP-to-OpenAI function schema conversion with autonomous multi-turn recursive execution loop (up to 5 turns).
   - Real-time tool execution pills (duration latency, status badges) and multimodal WebGL canvas screenshot cards with expand lightbox.

2. **Angular 22 Reactive Signals First**:
   - Seamlessly connect Angular signals (`signal()`, `computed()`, `effect()`) to agent tools using `toWebMcpTool()`.
   - Real-time reactivity with zero change-detection penalty.

3. **Hybrid Context Sensing & Seamless In-Memory Emulator**:
   - Automatically detects browser-native `window.modelContext` / `navigator.modelContext` (when Chrome flags are active).
   - Transparently falls back to an in-memory `WebMcpEmulator` for standard browsers, node test runners, and instant developer evaluation.

4. **Multimodal Viewport Capture (`take_screenshot`)**:
   - 100% client-side WebGL canvas and DOM rasterization producing base64 image data URLs.
   - Enables browser AI agents to visually inspect 3D scenes and UI state in real time with token-saving LLM payload sanitization.

5. **Interactive 3D WebGL Action Bus (`scene_3d_action`)**:
   - Frame-synchronized Three.js bridge for camera orbit rotation (`rotate`), zoom (`zoom`), material colors (`change_mesh_color`), animations (`play_animation`), part highlighting (`highlight_part`), and camera resets (`reset_camera`).
   - Asynchronous action queue with built-in frame timeout protection.

6. **Form Automation Runner (`form_action_runner`)**:
   - Exposes registered Angular `FormGroup` instances to AI agents for automated field population, validation checking, and action submission.

7. **Live WebMCP Inspector Console**:
   - Real-time audit stream displaying incoming tool invocations, duration latency, parameter payloads, and results with sanitization and XSS protection.

---

## 📐 Architecture: Gemini 3.7 Flash High Copilot & WebMCP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CopilotChatComponent (UI)                          │
│  - Cyberpunk Slide-over Floating Drawer   - Model Selector Dropdown         │
│  - Quick Prompt Chips                     - Multimodal Image Lightbox       │
│  - Real-time Tool Execution Status Pills  - Angular 22 Signals State        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CopilotBridgeService                             │
│  - GET /v1/models (Discovery & Fallback)                                    │
│  - POST /v1/chat/completions (OpenAI Compatible Bridge API)                 │
│  - WebMCP Tool-to-OpenAI Schema Converter                                   │
│  - Autonomous Recursive Execution Loop (Max 5 Turns Guard)                  │
│  - Payload Sanitization & Context Token Optimization                        │
└──────────────────────┬──────────────────────────────▲───────────────────────┘
                       │                              │
     Execute Tool Call │                              │ Tool Result Payload
                       ▼                              │
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
       │                      │                      │                 │
       ▼                      ▼                      ▼                 ▼
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

### Option A: In-App AI Copilot (Gemini 3.7 Flash High) 🤖 [Recommended]
1. Click the glowing **"🤖 AI Copilot (Gemini 3.7)"** button in the top navigation header or the bottom-right launcher.
2. The Cyberpunk slide-over drawer will expand.
3. Select any quick action prompt chip or type a custom natural language request:
   - **📸 Take 3D Screenshot**: *"Take a screenshot of the 3D car viewport and describe the current view."*
   - **🏎️ Orbit 90° & Neon Cyan**: *"Orbit camera 90 degrees and set vehicle paint to Neon Cyan (#00f0ff)."*
   - **⚡ Boost Turbo & Sport Rims**: *"Boost turbo, switch to sport rims, autofill pro customizer, and build report."*
   - **🔄 Reset Camera & Specs**: *"Reset camera to origin and show current vehicle specifications."*
4. Watch Gemini 3.7 Flash High reason in real time, invoke browser WebMCP tools autonomously, update the 3D scene / form, and render inline screenshot cards!

### Option B: Native Browser WebMCP Testing (Chrome Canary / Chromium)
1. Open Google Chrome or Chrome Canary and navigate to:
   ```text
   chrome://flags/#enable-webmcp-testing
   ```
2. Set the flag to **Enabled** and restart Chrome.
3. Open the showcase application at `http://localhost:4200`.
4. The header status badge will display **Native Browser Context** (Green indicator).
5. Attached AI agents or browser devtools can now execute tools directly via `window.modelContext`.

### Option C: Seamless In-Memory Emulator (Any Modern Browser)
- If testing in standard Chrome without flags, Firefox, Safari, or Edge, the application automatically mounts `WebMcpEmulator`.
- Use the **Agent Simulators** bar in the header or the interactive UI panels to trigger real-time WebMCP tool executions.
- The **Live WebMCP Inspector** will display the exact parameter contracts and execution metrics.

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
│       │   │   │   ├── copilot-chat/  # Cyberpunk Gemini 3.7 Copilot Chat Drawer
│       │   │   │   ├── header/        # Connection status & Copilot trigger button
│       │   │   │   ├── visualizer-3d/ # Three.js 3D viewport canvas
│       │   │   │   ├── customizer-form/# Reactive configuration form
│       │   │   │   ├── inspector/     # Real-time WebMCP execution console
│       │   │   │   └── judge-guide/   # In-app judge guide & tabbed prompts
│       │   │   ├── services/
│       │   │   │   ├── copilot-bridge.service.ts # CPAMC Bridge & Autonomous Loop
│       │   │   │   └── copilot-bridge.types.ts   # OpenAI & Model data contracts
│       │   │   ├── app.component.ts   # Root container component
│       │   │   ├── app.component.html # Dashboard layout with drawer mount
│       │   │   └── app.config.ts      # Application config with provideHttpClient() & provideWebMcp()
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
import { provideHttpClient } from '@angular/common/http';
import { provideWebMcp } from '@webmcp/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
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

- **Autonomous Loop Recursion Guard**: Prevents infinite tool-calling loops by enforcing a strict 5-turn hard cap with clear user notification.
- **Malformed JSON Recovery**: Catches syntax errors in LLM function arguments and feeds structured error diagnostics back to the model for self-correction.
- **Context Window Token Optimization**: Automatically sanitizes large Base64 PNGs (~500KB) from `take_screenshot` when sending context back to the LLM while preserving rich previews in the UI.
- **Parameter Validation**: Input parameters are strictly validated against JSON Schema / typing contracts before executing handlers.
- **Tainted Canvas Safeguards**: Canvas readbacks catch cross-origin or buffer security violations and return structured error payloads without crashing.
- **XSS Prevention**: Inspector log visualizer truncates large binary payloads and sanitizes JSON outputs.
- **Action Bus Timeout Safeguards**: Frame-based 3D animations have timeout limits (`durationMs + 2000ms`) to avoid blocking agent execution queues.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
