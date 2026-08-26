# Proposal: WebMCP Angular 22 Toolkit & 3D Interactive Showcase

## Intent

Provide a first-class Angular 22 + Tailwind CSS ecosystem library (`@webmcp/angular` / `ngx-webmcp`) and an interactive showcase application for the emerging W3C / Chrome WebMCP standard (`navigator.modelContext` / `window.modelContext`). It bridges browser AI agents (e.g. Chrome `#enable-webmcp-testing`, ChatGPT agent in-app browser) with reactive Angular UIs, declarative tool binding directives and signals, visual canvas rasterizers (`take_screenshot`), and real-time Three.js 3D WebGL scene controllers.

## Scope

### In Scope
- **Angular 22 + Bun + Tailwind CSS Workspace**: Monorepo/multi-project setup with `@webmcp/angular` core library and `showcase-app`.
- **Core Library (`@webmcp/angular`)**:
  - `WebMcpService` and registry managing tool lifecycles with `document.modelContext` / `window.modelContext` integration and local polyfill emulator.
  - Angular Signals & Directives (`webmcpTool`, `webmcpAction`, `webmcpState`) for declarative tool exposure and two-way UI reactivity.
  - Dynamic JSON-schema generation using TypeScript type metadata and Zod schema validators.
- **Built-in Visual & Multimodal Inspector**:
  - `take_screenshot` tool rasterizing active viewports / HTML5 Canvas / DOM overlays for multimodal agent feedback.
- **3D Scene Controller & WebGL Action Bus**:
  - Three.js integration exposing camera transforms, animation playback, object selection/inspection, and material/shader controls as agent tools.
- **Form Automation & Report Generator**:
  - Interactive business UI scenarios (forms, data grid, export actions) automated via MCP tools.
- **Devpost WebMCP Challenge Compliance**:
  - MIT Open Source License, comprehensive documentation, architecture diagrams, and testing guide for judges (Chrome flags and web agent testing).

### Out of Scope
- Backend MCP server transports (Stdio/SSE backend daemons) — focus is strictly client-side WebMCP browser standard.
- Proprietary LLM provider SDK lock-ins (designed to work agnostically with any WebMCP-compliant client agent).

## Capabilities

### New Capabilities
- `webmcp-core-service`: Reactive Angular service wrapping browser `modelContext` API with tool registration, deregistration, and lifecycle signals.
- `webmcp-declarative-directives`: Directives and signal helpers (`[webmcpTool]`, `toMcpTool()`) to expose component methods and state effortlessly.
- `webmcp-viewport-capture`: Multimodal screenshot and DOM snapshot tool for visual agent reasoning.
- `webmcp-3d-scene-controller`: Three.js action bus exposing 3D orbit camera, object manipulation, and animation triggers to WebMCP.
- `webmcp-showcase-app`: Production-ready showcase featuring interactive 3D digital twin, form workflows, live tool execution inspector, and testing playground.

### Modified Capabilities
- None

## Approach

1. **Tool Bridge Architecture**: Implement `WebMcpService` as an Angular Injectable root service that senses `window.modelContext` / `navigator.modelContext`, provides an in-memory fallback emulator when running outside Chrome Canary / WebMCP flags, and tracks registered tools in Angular Signals.
2. **Declarative Angular Primitives**: Build directives `[webmcpTool]` and functional signal utilities (`createWebMcpTool`) that automatically register/unregister tools with Angular component lifecycle hooks (`ngOnInit`, `ngOnDestroy`, `effect()`).
3. **Three.js Action Bus**: Decouple 3D rendering loop from agent calls using an event-driven action queue, allowing smooth camera interpolation, GLTF mesh highlight, and physics triggers.
4. **Multimodal Feedback**: Implement canvas rasterization via native WebGL frame buffer capture (`gl.readPixels` / `canvas.toDataURL`) and DOM snapshotting.
5. **Showcase UI**: Build a responsive Tailwind CSS dashboard with a live MCP inspector console showing real-time tool calls, parameters, and returned payloads.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `projects/ngx-webmcp/src/lib/core` | New | `WebMcpService`, context wrapper, tool registry |
| `projects/ngx-webmcp/src/lib/directives` | New | `[webmcpTool]`, `[webmcpState]` declarative directives |
| `projects/ngx-webmcp/src/lib/multimodal` | New | `take_screenshot` & canvas DOM capture provider |
| `projects/ngx-webmcp/src/lib/three` | New | Three.js scene controller, camera controller, 3D action bus |
| `projects/showcase/src/app` | New | Interactive showcase app with 3D product visualizer, form automation, and agent tool log |
| `docs/` & `README.md` | New | Devpost documentation, judge testing guide, MIT license |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Browser `modelContext` spec variations or flag differences | Medium | Provide standard shim/polyfill and seamless local emulator for non-flagged browsers |
| Three.js render loop blocking during agent execution | Low | Async tool execution queue with promise resolution on animation frame completion |
| Canvas capture CORS/tainted canvas issues | Low | Clean asset handling with same-origin asset loaders and WebGL framebuffer readback |

## Rollback Plan

Revert Git commit revisions or delete scaffolded library and showcase directories (`projects/ngx-webmcp`, `projects/showcase`). No existing production code is modified.

## Dependencies

- `@angular/core` ^22.0.0
- `three` & `@types/three`
- `tailwindcss` ^4.0.0
- `zod` for declarative schema validation
- `bun` as package manager and runtime

## Success Criteria

- [ ] `@webmcp/angular` builds and exports typed services, directives, and Three.js bridges without errors.
- [ ] Agents can discover and invoke registered tools via `modelContext.getTools()` and `modelContext.executeTool()`.
- [ ] 3D showcase responds to agent instructions (`rotate_camera`, `highlight_part`, `trigger_animation`).
- [ ] Multimodal `take_screenshot` returns base64 image data suitable for LLM vision input.
- [ ] Devpost submission deliverables (MIT License, English README, Chrome Canary testing guide) complete and verified.
