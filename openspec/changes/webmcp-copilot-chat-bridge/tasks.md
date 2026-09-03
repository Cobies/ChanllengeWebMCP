# Tasks: CPAMC Copilot Chat Bridge & Autonomous Agent Loop

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650 - 900 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Types & Bridge Service) → PR 2 (Chat Drawer Component) → PR 3 (Showcase Integration & Docs) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Types & CopilotBridgeService | PR 1 | `bun test projects/showcase/src/app/services/copilot-bridge.service.spec.ts` | Node / Angular TestBed | `projects/showcase/src/app/services/copilot-bridge*`, `app.config.ts` |
| 2 | CopilotChatComponent UI & Chips | PR 2 | `bun test projects/showcase/src/app/components/copilot-chat/copilot-chat.component.spec.ts` | Browser DOM TestBed | `projects/showcase/src/app/components/copilot-chat/` |
| 3 | Showcase Wiring, Docs & Verify | PR 3 | `bun test && bun run build` | Full browser showcase | `projects/showcase/src/app/components/header`, `app.component*`, `README.md` |

## Phase 1: Foundation & Data Contracts

- [ ] 1.1 Create TypeScript data models and bridge interfaces in `projects/showcase/src/app/services/copilot-bridge.types.ts` (`ChatMessage`, `BridgeModel`, `ToolCallPayload`, `ToolExecutionMeta`, `OpenAiFunctionTool`).
- [ ] 1.2 Register `provideHttpClient()` in `projects/showcase/src/app/app.config.ts` for bridge communication.

## Phase 2: Copilot Bridge Service & Autonomous Loop

- [ ] 2.1 [RED] Write unit tests in `copilot-bridge.service.spec.ts` for fallback models on HTTP error, malformed JSON recovery, recursion cap at 5 turns, and token-saving screenshot payload sanitization.
- [ ] 2.2 Implement model discovery and fallback recovery in `projects/showcase/src/app/services/copilot-bridge.service.ts` querying `GET https://api.your-proxy.com/v1/models`.
- [ ] 2.3 Implement `getOpenAiTools()` schema converter mapping `WebMcpService.getTools()` to OpenAI function schemas.
- [ ] 2.4 Implement `sendMessage()` with autonomous recursive loop executing `WebMcpService.executeTool()`, recursion counter guard (turn <= 5), and base64 preview extraction.

## Phase 3: Cyberpunk Copilot Chat Drawer UI

- [ ] 3.1 [RED] Write unit tests in `copilot-chat.component.spec.ts` for drawer toggle animations, model selector changes, prompt chip clicks, and image preview card rendering.
- [ ] 3.2 Implement `CopilotChatComponent` template and styling with cyberpunk glassmorphism, slide-over drawer, and model dropdown in `projects/showcase/src/app/components/copilot-chat/copilot-chat.component.ts`.
- [ ] 3.3 Implement interactive message stream with role badges, tool execution pills (duration & status), quick-action prompt chips, and modal lightbox for base64 screenshots.

## Phase 4: Showcase Integration & Navigation

- [ ] 4.1 Update `projects/showcase/src/app/components/header/header.component.ts` with glowing "AI Copilot" action button triggering drawer visibility.
- [ ] 4.2 Import and embed `<app-copilot-chat>` in `projects/showcase/src/app/app.component.ts` and `projects/showcase/src/app/app.component.html`.
- [ ] 4.3 Verify bidirectional tool event synchronization between Copilot chat, Three.js Visualizer, and WebMCP Inspector.

## Phase 5: Documentation & Verification

- [ ] 5.1 Update English `README.md` with Gemini 3.7 Flash High Copilot architecture, tool calling flow, quick prompt guide, and judge demo instructions.
- [ ] 5.2 Execute complete test suite and production build verification via `bun test` and `bun run build`.
