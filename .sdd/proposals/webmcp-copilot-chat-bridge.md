# Proposal: CPAMC Bridge Copilot Chat & Autonomous Agent Loop

## Intent

Provide an interactive AI Copilot chat drawer in the showcase app connected to the CPAMC Secure Bridge Proxy (`https://api.your-proxy.com/v1`). It allows users and judges to converse with Gemini 3.7 Flash High, which autonomously discovers and executes `@webmcp/angular` tools (`scene_3d_action`, `take_screenshot`, `form_action_runner`) in real time, inspects visual outputs, and updates UI state.

## Scope

### In Scope
- **Bridge Client Service**: Angular service integrating with `/v1/chat/completions` and `/v1/models` endpoints, defaulting to `gemini-3.7-flash-high` with dynamic model selection.
- **Dynamic Schema Converter**: Automatic mapping of `WebMcpService.getTools()` schemas into OpenAI-compatible tool/function call definitions.
- **Cyberpunk Copilot Chat Drawer**: Tailwind CSS glassmorphism UI with real-time streaming chat, quick action prompt chips, and tool execution status badges.
- **Autonomous Multi-Turn Execution Loop**: Client-side recursion handling LLM `tool_calls`, executing browser WebMCP handlers, and feeding results back until completion.
- **Multimodal Visual Feed**: In-chat rendering of base64 screenshots returned by `take_screenshot`.
- **Documentation**: Updated `README.md` and Devpost guide with Copilot usage and bridge architecture.

### Out of Scope
- Server-side tool execution (tools run strictly inside user browser via WebMCP).
- Custom backend proxy development (relies on active CPAMC Secure Bridge).

## Capabilities

### New Capabilities
- `webmcp-copilot-bridge-service`: Bridge client connecting to CPAMC proxy with schema translation and model query.
- `webmcp-copilot-chat-drawer`: Conversational glassmorphism chat widget with autonomous agent function calling and vision rendering.

### Modified Capabilities
- `webmcp-showcase-app`: Embeds Copilot drawer toggle and wires active showcase tools to the AI assistant.

## Approach

1. **Proxy Service (`CopilotBridgeService`)**: Implement HTTP client connecting to `https://api.your-proxy.com/v1/chat/completions` and `/v1/models`. Transform `WebMcpToolDefinition` into OpenAI function calling format (`{ type: "function", function: { name, description, parameters } }`).
2. **Autonomous Tool Loop**: When the model returns `tool_calls`, invoke `WebMcpService.executeTool()`, log execution, append `tool` role messages with results, and reinvoke chat completion until final textual answer.
3. **Multimodal Feedback**: Parse `take_screenshot` tool results and render data URLs directly in the chat timeline alongside assistant commentary.
4. **Cyberpunk UI Widget**: Build a floating slide-over drawer with glassmorphism backdrop, reactive signals for conversation state, model selector dropdown, and quick prompt chips.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `projects/showcase/src/app/services/copilot-bridge.service.ts` | New | CPAMC proxy client and WebMCP schema mapper |
| `projects/showcase/src/app/components/copilot-drawer/` | New | Copilot chat UI, prompt chips, and message stream |
| `projects/showcase/src/app/components/header/header.component.ts` | Modified | Add Copilot drawer open/toggle button |
| `projects/showcase/src/app/app.component.html` | Modified | Mount Copilot drawer component |
| `README.md` | Modified | Document Copilot chat feature and CPAMC bridge setup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tool call loop runaway / infinite cycle | Low | Cap autonomous function loop at max 5 recursive iterations |
| Bridge network latency or rate limiting | Low | Non-blocking UI signals, loading spinners, and graceful error alerts |
| Model payload size with large Base64 screenshots | Low | Send structured summary to model while rendering full image in chat UI |

## Rollback Plan

Revert changes to `projects/showcase` and delete `copilot-bridge.service.ts` and `copilot-drawer` component directory.

## Dependencies

- `@angular/common/http` / `provideHttpClient()`
- Existing `@webmcp/angular` library services
- CPAMC Secure Bridge endpoint (`https://api.your-proxy.com/v1`)

## Success Criteria

- [ ] Copilot successfully queries models list from `https://api.your-proxy.com/v1/models`.
- [ ] Users can chat with `gemini-3.7-flash-high` and trigger 3D actions, form fills, and screenshots via natural language.
- [ ] Tool calls execute autonomously in the browser and return results to the conversation.
- [ ] Base64 screenshot outputs display visually inside the chat stream.
- [ ] README and Devpost submission guide document Copilot capabilities.
