# Tasks: WebMCP Angular Toolkit & 3D Interactive Showcase

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1800 - 2400 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Core Lib) → PR 2 (3D & Multimodal) → PR 3 (Showcase & Docs) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Core library & directives | PR 1 | `bun test projects/ngx-webmcp/src/lib/core` | Node/JSDOM context | `projects/ngx-webmcp/src/lib/core`, `directives` |
| 2 | Multimodal & 3D action bus | PR 2 | `bun test projects/ngx-webmcp/src/lib/three` | WebGL canvas context | `projects/ngx-webmcp/src/lib/three`, `multimodal` |
| 3 | Showcase UI & documentation | PR 3 | `bun test && bun run build` | Browser showcase app | `projects/showcase`, `README.md`, `.github` |

## Phase 1: Workspace Foundation & Core Types

- [x] 1.1 Configure Angular 22 multi-project workspace in `package.json`, `angular.json`, and `tsconfig.json`.
- [x] 1.2 Configure library packaging in `projects/ngx-webmcp/package.json`, `ng-package.json`, and `tsconfig.lib.json`.
- [x] 1.3 Create core TypeScript interfaces and tool schemas in `projects/ngx-webmcp/src/lib/core/webmcp.types.ts`.
- [x] 1.4 Create official MIT open-source license in `LICENSE`.

## Phase 2: Core WebMCP Engine & Directives

- [x] 2.1 [RED] Write unit tests in `projects/ngx-webmcp/src/lib/core/webmcp.service.spec.ts` for tool schema validation and invalid parameter rejection.
- [x] 2.2 Implement browser `modelContext` in-memory fallback polyfill in `projects/ngx-webmcp/src/lib/core/webmcp.emulator.ts`.
- [x] 2.3 Implement `WebMcpService` reactive tool registry and `provideWebMcp()` provider in `webmcp.service.ts` and `webmcp.provider.ts`.
- [x] 2.4 Implement `[webmcpTool]`, `[webmcpAction]` directives and `toWebMcpTool()` helper in `projects/ngx-webmcp/src/lib/directives/`.
- [x] 2.5 Write directive lifecycle unit tests in `projects/ngx-webmcp/src/lib/directives/webmcp-tool.directive.spec.ts`.

## Phase 3: Multimodal Capture & 3D WebGL Bridge

- [x] 3.1 [RED] Write unit tests in `projects/ngx-webmcp/src/lib/multimodal/viewport-capture.service.spec.ts` for tainted canvas error handling.
- [x] 3.2 Implement canvas rasterizer and `take_screenshot` tool in `projects/ngx-webmcp/src/lib/multimodal/viewport-capture.service.ts`.
- [x] 3.3 [RED] Write unit tests in `projects/ngx-webmcp/src/lib/three/scene-action-bus.spec.ts` for action queue timeout recovery.
- [x] 3.4 Implement camera interpolator and asynchronous command queue in `projects/ngx-webmcp/src/lib/three/camera-interpolator.ts` and `scene-action-bus.ts`.
- [x] 3.5 Implement Three.js bridge and `scene_3d_action` tool in `projects/ngx-webmcp/src/lib/three/three-scene-bridge.ts`.

## Phase 4: Form Runner & Public API

- [x] 4.1 Implement `form_action_runner` service and form registry in `projects/ngx-webmcp/src/lib/forms/form-runner.service.ts`.
- [x] 4.2 Write form runner unit tests in `projects/ngx-webmcp/src/lib/forms/form-runner.service.spec.ts`.
- [x] 4.3 Export public library surface in `projects/ngx-webmcp/src/public-api.ts`.

## Phase 5: Showcase Application & Tailwind UI

- [x] 5.1 Setup showcase app shell with Tailwind CSS v4 styling in `projects/showcase/src/styles.css` and `app.config.ts`.
- [x] 5.2 Implement header component with status badge and prompt chips in `projects/showcase/src/app/components/header/header.component.ts`.
- [x] 5.3 Implement Three.js 3D viewport canvas component in `projects/showcase/src/app/components/visualizer-3d/visualizer-3d.component.ts`.
- [x] 5.4 Implement reactive vehicle customizer form in `projects/showcase/src/app/components/customizer-form/customizer-form.component.ts`.
- [x] 5.5 [RED] Write XSS prevention tests and implement sanitized WebMCP Inspector log console in `projects/showcase/src/app/components/inspector/`.
- [x] 5.6 Implement interactive Devpost judge guide and root layout in `judge-guide.component.ts`, `app.component.ts`, and `app.component.html`.

## Phase 6: Packaging, Documentation & CI

- [x] 6.1 Create GitHub Actions CI workflow in `.github/workflows/ci.yml` running build and test suites.
- [x] 6.2 Write English `README.md` with architecture diagrams, Devpost narrative, and Chrome Canary flag setup guide.
- [x] 6.3 Execute full workspace build and test verification via `bun test` and `bun run build`.
