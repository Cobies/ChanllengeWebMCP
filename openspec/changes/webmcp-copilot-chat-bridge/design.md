# Design: CPAMC Copilot Chat Bridge & Autonomous Agent Loop

**Change**: `webmcp-copilot-chat-bridge`  
**Status**: Ready for Implementation  
**Target Environment**: Angular 22, Bun runtime, Tailwind CSS v4, `@webmcp/angular`, CPAMC Bridge Proxy (`https://api.your-proxy.com/v1`)

---

## 1. Technical Approach

The `webmcp-copilot-chat-bridge` introduces an in-app multimodal AI conversational copilot powered by Gemini 3.7 Flash High via the CPAMC Secure Bridge Proxy. The system dynamically transforms browser-registered `@webmcp/angular` tools (`scene_3d_action`, `take_screenshot`, `form_action_runner`) into OpenAI-compatible function calling schemas, establishes an autonomous multi-turn client-side execution loop with recursion protection, and renders an interactive cyberpunk glassmorphic chat drawer (`CopilotChatComponent`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CopilotChatComponent                            │
│  - Floating Drawer & Status Bar  - Model Selector (gemini-3.7-flash-high)    │
│  - Quick Prompt Chips            - Multimodal Base64 Image Previews         │
│  - Markdown & Tool Pills         - Angular Signals UI State                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CopilotBridgeService                             │
│  - GET /v1/models (Model Discovery & Fallback)                              │
│  - POST /v1/chat/completions (OpenAI Compatible Bridge API)                 │
│  - WebMCP Tool-to-OpenAI Schema Converter                                   │
│  - Autonomous Recursive Execution Loop (Max 5 Turns Guard)                  │
│  - Payload Sanitization & Token Optimization                                │
└──────────────────────┬──────────────────────────────▲───────────────────────┘
                       │                              │
     Execute Tool Call │                              │ Tool Execution Result
                       ▼                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                                WebMcpService                                │
│  - scene_3d_action (Three.js WebGL orbit, recolor, animations)              │
│  - take_screenshot (Client-side WebGL canvas readback & Base64 PNG)         │
│  - form_action_runner (Reactive form autofill, validation & submit)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Decisions

| Area | Option Chosen | Alternatives Considered | Tradeoff & Rationale |
|------|---------------|-------------------------|----------------------|
| **API Protocol Adapter** | OpenAI Function Calling Format over HTTPS (`POST /v1/chat/completions`) | Custom WebSocket protocol or proprietary Gemini SDK | **Chosen**: The CPAMC proxy standardizes Gemini 3.7 Flash High behind OpenAI-compatible `/v1` endpoints, enabling native `tools` and `tool_calls` payloads without heavy SDK dependencies. |
| **Tool Execution Runtime** | Client-side autonomous recursion runner in Angular service (`CopilotBridgeService`) | Backend server orchestration / LangChain server | **Chosen**: WebMCP tools execute directly inside the browser DOM, Three.js WebGL canvas, and Angular reactive forms. In-browser orchestration eliminates server roundtrips for client tool execution. |
| **Recursion Guard Strategy** | Iterative recursion counter capped at 5 turns (`MAX_TOOL_TURNS = 5`) | Uncapped recursion or single-turn only | **Chosen**: Multi-turn allows compound reasoning (e.g. rotate -> screenshot -> analyze), while a strict 5-turn hard cap prevents runaway loops and token drain. |
| **Multimodal Image Transport** | Separate UI rendering from LLM context payload | Forwarding raw Base64 data URLs back to LLM context | **Chosen**: Full Base64 PNGs (~500KB) are rendered in the client chat stream as visual cards, while a lightweight structural summary (`{ success: true, dimensions, timestamp }`) is sent back in the `role: tool` message to avoid context exhaustion. |
| **UI Presentation** | Floating Slide-over Glassmorphism Drawer with Minimize/Maximize | Static sidebar or modal dialog | **Chosen**: Floating drawer maintains persistent view of the 3D scene and vehicle customizer while interacting with the copilot. |
| **State Management** | Angular 22 Signals (`signal()`, `computed()`, `WritableSignal`) | RxJS Subject streams only | **Chosen**: Signal-first architecture provides fine-grained reactivity, seamless two-way binding with template controls, and zero change-detection overhead. |

---

## 3. Data Flow & Autonomous Execution Loop

```
User Prompt ("Orbit 45° & capture view")
   │
   ▼
[CopilotBridgeService.sendMessage()]
   │
   ├─► 1. Append User Message to messages Signal
   ├─► 2. Set isGenerating = true, turnCount = 0
   │
   ▼
┌─► [HTTP POST /v1/chat/completions]
│      Payload: { model, messages: sanitizedHistory, tools: openAiTools }
│      │
│      ▼
│   [Bridge Proxy Response]
│      │
│      ├─► Finish Reason: 'stop' (Text Response)
│      │      │
│      │      ├─► Append Assistant Message to messages
│      │      └─► Reset isGenerating = false (Complete)
│      │
│      └─► Finish Reason: 'tool_calls'
│             │
│             ├─► Append Assistant Tool Request Message to messages
│             ├─► For each tool_call in tool_calls:
│             │      1. Parse function.arguments JSON (safe try/catch)
│             │      2. Set activeToolExecution signal (status: 'running')
│             │      3. Invoke WebMcpService.executeTool(name, args, 'ui')
│             │      4. If screenshot tool, extract image URL for UI card
│             │      5. Format tool response message:
│             │         { role: 'tool', tool_call_id: id, name, content: compactResultJson }
│             │      6. Update activeToolExecution signal (status: 'success', durationMs)
│             │
│             ├─► Increment turnCount
│             │      │
│             │      ├─► If turnCount >= 5:
│             │      │      Append System Guard Warning to messages & Finish
│             │      │
│             │      └─► Else: Loop back to [HTTP POST /v1/chat/completions] with updated history
```

---

## 4. File Changes

| File | Action | Description |
|------|--------|-------------|
| `projects/showcase/src/app/services/copilot-bridge.service.ts` | Create | Core HTTP bridge, WebMCP tool-to-OpenAI schema converter, and recursive multi-turn execution runner. |
| `projects/showcase/src/app/services/copilot-bridge.service.spec.ts` | Create | Unit tests verifying model discovery, schema conversion, single-turn, multi-turn loop, recursion cap, and error resilience. |
| `projects/showcase/src/app/components/copilot-chat/copilot-chat.component.ts` | Create | Cyberpunk floating chat drawer with model selector, message stream, tool pills, prompt chips, and multimodal cards. |
| `projects/showcase/src/app/components/copilot-chat/copilot-chat.component.spec.ts` | Create | Unit tests verifying drawer toggle, prompt chip dispatch, message rendering, and image preview interaction. |
| `projects/showcase/src/app/app.config.ts` | Modify | Register `provideHttpClient()` in showcase application providers. |
| `projects/showcase/src/app/components/header/header.component.ts` | Modify | Add glowing "AI Copilot" trigger button connected to drawer open state. |
| `projects/showcase/src/app/app.component.ts` | Modify | Import and mount `CopilotChatComponent` in root showcase template. |
| `projects/showcase/src/app/app.component.html` | Modify | Embed `<app-copilot-chat></app-copilot-chat>` markup. |

---

## 5. Interfaces & Contracts

### 5.1 Bridge Models & OpenAI Schema Contracts

```typescript
export interface BridgeModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  data: BridgeModel[];
}

export interface OpenAiFunctionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
}

export interface ToolCallPayload {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCallPayload[];
  imageUrl?: string;
  toolExecution?: ToolExecutionMeta;
  timestamp: number;
}

export interface ToolExecutionMeta {
  toolName: string;
  params: Record<string, unknown>;
  result?: unknown;
  durationMs?: number;
  status: 'running' | 'success' | 'error';
  errorMessage?: string;
}
```

### 5.2 Chat Completion Request & Response Contracts

```typescript
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content?: string | null;
    name?: string;
    tool_call_id?: string;
    tool_calls?: ToolCallPayload[];
  }>;
  tools?: OpenAiFunctionTool[];
  temperature?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content?: string | null;
      tool_calls?: ToolCallPayload[];
    };
    finish_reason: 'stop' | 'tool_calls' | 'length' | string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## 6. Threat Matrix & Security Considerations

| Threat Category | Applicable? | Safe / Failure Behavior | Verification Approach |
|-----------------|-------------|-------------------------|-----------------------|
| **Runaway Autonomous Tool Loops** | **Applicable** | When an LLM triggers repetitive tool calls, loop MUST terminate at turn 5, emit a system warning, and restore UI controls. | Unit test verifying loop halts on turn 5 with mock recursive tool calls. |
| **Malformed Tool Arguments Injection** | **Applicable** | If LLM generates malformed JSON in `function.arguments`, parser catches error and feeds `{ error: "Invalid JSON" }` back to LLM. | Unit test passing invalid JSON strings to argument parser. |
| **Context Window Token Exhaustion** | **Applicable** | Base64 PNGs (~500KB) from `take_screenshot` must NOT be reflected into LLM messages array; replace with compact `{ success: true, dimensions }`. | Unit test verifying sanitized message payload excludes data URLs. |
| **XSS via LLM Markdown / Content** | **Applicable** | Untrusted HTML/scripts in assistant responses are sanitized via safe text escaping or standard Angular template interpolation. | Unit test verifying script tags are not rendered as executable DOM. |
| **Network & Bridge Proxy Outages** | **Applicable** | HTTP 5xx/4xx or CORS failures gracefully trigger fallback model list and emit friendly assistant error message without crashing app. | Unit test simulating HTTP error on `/v1/models` and `/v1/chat/completions`. |
| **Subprocess / Shell / Routing / VCS** | **N/A** | No shell commands, process spawning, or server-side file writes exist in client-side Angular runtime. | N/A |

---

## 7. Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit** | `CopilotBridgeService.fetchModels()` | Mock `HttpClient.get`, verify fallback to `['gemini-3.7-flash-high', ...]` on failure. |
| **Unit** | `CopilotBridgeService.getOpenAiTools()` | Register mock WebMCP tools, verify conversion to OpenAI function schema format with parameters. |
| **Unit** | `CopilotBridgeService.sendMessage()` (Single Turn) | Mock text response from `/v1/chat/completions`, verify message appended and `isGenerating` reset. |
| **Unit** | `CopilotBridgeService` (Multi-Turn Autonomous Loop) | Mock sequence: user prompt -> `tool_calls` (`scene_3d_action`) -> execution -> assistant completion. Verify `WebMcpService.executeTool` called. |
| **Unit** | `CopilotBridgeService` (Recursion Guard) | Mock 6 consecutive `tool_calls`, verify execution stops at turn 5 with system warning. |
| **Unit** | `CopilotChatComponent` (Drawer State & Interaction) | Verify `isOpen`, `isMinimized`, prompt chip selection, and clear history actions. |
| **Integration** | Header Trigger -> Copilot Drawer Open | Verify clicking header button updates drawer state and focuses input. |

---

## 8. Migration / Rollout

No database or breaking API migrations required.
1. Add `provideHttpClient()` to `projects/showcase/src/app/app.config.ts`.
2. Add `CopilotBridgeService` and `CopilotChatComponent`.
3. Update `HeaderComponent` and `AppComponent` templates.
4. Verify complete suite with `bun test`.
