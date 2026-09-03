# Specification: CPAMC Copilot Chat Bridge, Thinking Accordions & Dynamic Context

**Domain**: `webmcp-copilot-chat-bridge`  
**Status**: Active / Source of Truth  
**Target Environment**: Angular 22, Bun runtime, Tailwind CSS v4, `@webmcp/angular`, CPAMC Bridge Proxy  

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
  id?: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  thinking?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCallPayload[];
  imageUrl?: string;
  toolExecution?: ToolExecutionMeta;
  timestamp?: number;
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

---

## 2. Domain: Reasoning Extraction & XML Tag Stripping

### Requirement: Thinking Extraction & Tag Sanitization
`CopilotBridgeService` MUST parse and extract reasoning tokens from response fields (`reasoning_content`, `reasoning`) and embedded XML tags (`<think>...</think>`, `<thought>...</thought>`). The extracted reasoning SHALL populate the `thinking?: string` property of `ChatMessage`, and XML tags MUST be stripped from `content`.

#### Scenario: Extract reasoning from API reasoning_content
- **GIVEN** a chat completion response containing `reasoning_content: "Analyzing scene mesh..."`
- **WHEN** `extractThinkingAndCleanContent(message)` is executed
- **THEN** `thinking` is returned as `"Analyzing scene mesh..."` and clean content is preserved.

#### Scenario: Extract and strip <think> XML tags
- **GIVEN** an assistant message containing `<think>Calculating matrix transform</think>Transformed successfully`
- **WHEN** `extractThinkingAndCleanContent(message)` is executed
- **THEN** `thinking` contains `"Calculating matrix transform"` and `cleanContent` equals `"Transformed successfully"`.

---

## 3. Domain: UI Anonymization & Accordion Encapsulation

### Requirement: Model Branding Anonymization & Streamlined Header
The chat drawer UI MUST present generic "AI Copilot" and "Copilot" branding. Specific vendor model names SHALL NOT be shown in the launcher button, empty state banner, assistant header, generating indicator, or status bar. The header SHALL omit the model picker dropdown.

#### Scenario: Clean UI branding
- **GIVEN** the chat drawer is open
- **WHEN** user views drawer headers and active generating indicators
- **THEN** UI displays "AI Copilot" and "Thinking & executing..." without vendor model names.

### Requirement: Collapsible Details Accordion Encapsulation
Assistant reasoning and intermediate tool executions MUST be encapsulated in styled `<details>`/`<summary>` accordion blocks.

#### Scenario: Thinking and tool result accordions
- **GIVEN** assistant messages with `thinking` or tool executions
- **WHEN** rendered in `CopilotChatComponent`
- **THEN** thinking is rendered in a `💭 Thought Process` accordion and tool metadata/payloads are housed in collapsible accordions.
