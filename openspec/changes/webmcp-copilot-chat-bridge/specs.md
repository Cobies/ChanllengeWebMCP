# Specs: CPAMC Copilot Chat Bridge & Autonomous Agent Loop

**Change**: `webmcp-copilot-chat-bridge`  
**Status**: Approved / Complete Spec  
**Target Environment**: Angular 22, Bun runtime, Tailwind CSS v4, `@webmcp/angular`, CPAMC Bridge Proxy (`https://api.your-proxy.com/v1`)

---

## 1. Domain: Copilot Bridge Service (`webmcp-copilot-bridge-service`)

### Requirement: CPAMC Proxy Integration & Dynamic Model Discovery
The `CopilotBridgeService` MUST integrate with the CPAMC Secure Bridge Proxy endpoints (`GET /v1/models` and `POST /v1/chat/completions`). It SHALL default to `gemini-3.7-flash-high` while allowing dynamic selection from available models returned by the proxy.

#### Data Contracts: Models & Completions
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

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCallPayload[];
  imageUrl?: string;
  toolExecution?: ToolExecutionMeta;
}

export interface ToolCallPayload {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
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

#### Scenario: Query available models from bridge
- **GIVEN** an active internet connection to `https://api.your-proxy.com/v1`
- **WHEN** `CopilotBridgeService.fetchModels()` is called on service initialization
- **THEN** the service sends a `GET` request to `https://api.your-proxy.com/v1/models`
- **AND** updates the `availableModels` signal with the retrieved model IDs (including `gemini-3.7-flash-high`).

#### Scenario: Fallback model list on network degradation
- **GIVEN** `https://api.your-proxy.com/v1/models` returns an HTTP error or times out
- **WHEN** `fetchModels()` fails
- **THEN** `CopilotBridgeService` SHALL populate `availableModels` with default static fallback models `['gemini-3.7-flash-high', 'gemini-2.5-flash', 'gemini-2.5-pro']` without crashing.

---

### Requirement: WebMCP Tool-to-OpenAI Schema Adapter
The `CopilotBridgeService` MUST convert `@webmcp/angular` `WebMcpToolDefinition` instances into OpenAI-compatible function calling tool schemas.

#### Schema: OpenAI Function Tool Definition
```typescript
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
```

#### Scenario: Convert active WebMCP tools to OpenAI format
- **GIVEN** `WebMcpService.getTools()` contains `scene_3d_action`, `take_screenshot`, and `form_action_runner`
- **WHEN** `CopilotBridgeService.getOpenAiTools()` is invoked
- **THEN** it transforms every `WebMcpToolDefinition` into `{ type: "function", function: { name, description, parameters } }`
- **AND** preserves parameter names, types, descriptions, and required arrays.

---

### Requirement: Autonomous Multi-Turn Execution Loop with Recursion Guard
The `CopilotBridgeService` MUST implement an autonomous client-side agent execution loop. When the language model requests one or more `tool_calls`, the service SHALL execute them against `WebMcpService.executeTool()`, format `tool` role response messages with results, and reinvoke completions up to a maximum iteration limit of 5 turns.

#### Execution Loop Flow
```
User Prompt -> POST /v1/chat/completions (with tools)
   │
   ├─► Finish: 'stop' (Text Answer) -> Append to messages & complete
   │
   └─► Finish: 'tool_calls'
         │
         ├─► For each tool_call:
         │     1. Parse arguments JSON
         │     2. Execute WebMcpService.executeTool(name, args)
         │     3. If screenshot base64, attach preview to UI state & compact payload for LLM
         │     4. Create { role: "tool", tool_call_id, content: JSON.stringify(result) }
         │
         ├─► Increment turn iteration counter
         │     └─► If iteration > 5: Abort loop and emit recursion guard warning
         │
         └─► Re-invoke POST /v1/chat/completions with updated message history
```

#### Scenario: Single-turn direct text response
- **GIVEN** a user asks a general question (e.g. "What tools can you run?")
- **WHEN** `CopilotBridgeService.sendMessage("What tools can you run?")` is called
- **THEN** the bridge sends the prompt with tools list to `/v1/chat/completions`
- **AND** when the model responds with `content` and no `tool_calls`, the assistant text is added to `messages` and `isGenerating` is set to `false`.

#### Scenario: Multi-turn autonomous tool execution
- **GIVEN** a user asks "Rotate the cybercar 45 degrees and change the color to neon green"
- **WHEN** `CopilotBridgeService.sendMessage(...)` executes
- **THEN** the model returns `tool_calls` for `scene_3d_action`
- **AND** `CopilotBridgeService` invokes `WebMcpService.executeTool("scene_3d_action", { action: "rotate", deltaX: 45, ... })`
- **AND** sends the tool execution result back as a `tool` role message in the next turn
- **AND** the model synthesizes a final confirmation message once actions finish.

#### Scenario: Recursion guard cap at 5 iterations
- **GIVEN** a tool execution loop enters a repetitive cycle exceeding 5 turns
- **WHEN** iteration count reaches turn 5
- **THEN** `CopilotBridgeService` MUST terminate further HTTP calls
- **AND** append a system/assistant notification stating `"Maximum autonomous tool recursion limit (5) reached."`
- **AND** reset `isGenerating` to `false`.

---

### Requirement: Resilient Error Handling & Payload Validation
The service MUST gracefully handle network failures, invalid JSON tool arguments from the LLM, and tool execution exceptions without corrupting the chat session.

#### Scenario: Invalid JSON in tool arguments
- **GIVEN** the model generates malformed JSON in `tool_call.function.arguments`
- **WHEN** `CopilotBridgeService` parses the arguments
- **THEN** it catches the syntax error and generates a tool response `{ error: "Malformed JSON payload in arguments" }`
- **AND** feeds it back to the model allowing self-correction.

#### Scenario: Tool execution error in browser
- **GIVEN** `WebMcpService.executeTool()` throws an error (e.g. invalid mesh name)
- **WHEN** the tool execution fails
- **THEN** `CopilotBridgeService` captures the error message and creates a `tool` role message with `{ success: false, error: errorMessage }`
- **AND** continues the conversation loop to let the LLM inform the user.

---

## 2. Domain: Cyberpunk Copilot Chat Drawer (`webmcp-copilot-chat-drawer`)

### Requirement: Floating Glassmorphism Interface & State Management
The system MUST provide a floating slide-over chat drawer (`CopilotChatComponent`) with Cyberpunk glassmorphism styling, minimizing/maximizing capabilities, and Angular Signals state management.

#### Component State Signals
```typescript
export interface CopilotChatState {
  isOpen: WritableSignal<boolean>;
  isMinimized: WritableSignal<boolean>;
  isGenerating: Signal<boolean>;
  messages: Signal<ChatMessage[]>;
  selectedModel: WritableSignal<string>;
  availableModels: Signal<string[]>;
}
```

#### Scenario: Drawer toggle and minimize/maximize
- **GIVEN** the Copilot chat drawer is mounted in the showcase application
- **WHEN** the user clicks the header Copilot button or the drawer toggle
- **THEN** `isOpen` transitions to `true` with smooth slide-over animation
- **AND** clicking minimize shrinks the drawer to a compact status bar without clearing message history.

---

### Requirement: Message Bubbles, Tool Execution Indicators & Multimodal Rendering
The drawer MUST render user messages, assistant responses with markdown/code formatting, tool execution pills showing real-time status and duration, and embedded Base64 image previews.

#### Scenario: Render tool execution pill and latency
- **GIVEN** an active tool call is executing
- **WHEN** the tool starts and finishes
- **THEN** the chat displays a tool pill with the tool name (e.g., `⚡ scene_3d_action`), status badge (`running` -> `success`), and execution duration in milliseconds.

#### Scenario: Multimodal screenshot rendering
- **GIVEN** `take_screenshot` tool returns a Base64 PNG data URL
- **WHEN** the tool completes
- **THEN** the chat stream renders an inline visual image card with thumbnail preview and click-to-expand modal.

---

### Requirement: Quick-Action Judge Prompt Chips
The drawer MUST provide predefined interactive prompt chips enabling judges and users to test capabilities with a single click.

#### Predefined Prompt Chips
| Chip Label | Target Action | Expected Tools Invoked |
|------------|---------------|------------------------|
| **Orbit 45° & Neon Cyan** | Rotates camera 45° and recolors body | `scene_3d_action` |
| **Autofill Pro Customizer** | Fills customer name, email, pro tier, submits | `form_action_runner` |
| **Capture & Inspect View** | Captures 3D canvas viewport and analyzes scene | `take_screenshot` |
| **Reset & Explode Anim** | Resets camera to origin and triggers explode animation | `scene_3d_action` |

#### Scenario: Trigger prompt chip
- **GIVEN** the Copilot drawer is open and idle
- **WHEN** the user clicks `"Orbit 45° & Neon Cyan"` chip
- **THEN** the text is populated into the input, sent to `CopilotBridgeService`, and executes the 3D scene actions.

---

## 3. Domain: Showcase App Integration (`webmcp-showcase-app`)

### Requirement: Header Copilot Trigger & Root Component Mounting
The system MUST mount `app-copilot-drawer` at the root layout of `projects/showcase` and provide a glow-accented toggle button in `header.component.ts`.

#### Scenario: Header button opens Copilot drawer
- **GIVEN** the showcase application is loaded in the browser
- **WHEN** the user clicks `"AI Copilot (Gemini 3.7)"` in the top header
- **THEN** the Copilot chat drawer opens and focuses the message input field.
