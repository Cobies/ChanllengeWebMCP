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

---

## 4. Domain: Chat Formatting & Markdown Typography Rendering

### Requirement: Markdown Formatting & XSS Sanitization
The chat component MUST parse assistant markdown safely through `formatMessageContent(content)` to eliminate raw `#` symbols from section headings, render code blocks with syntax styling, format lists and typography (bold/italics), and escape raw HTML for XSS prevention.

#### Scenario: Strip hashtag symbols and format headings
- **GIVEN** assistant text containing `### Step 1: Initialize Scene`
- **WHEN** `formatMessageContent` is executed
- **THEN** output contains `<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Step 1: Initialize Scene</div>` with zero `#` characters.

#### Scenario: Escape raw HTML while preserving formatting
- **GIVEN** assistant text containing `<script>alert('xss')</script>**Important**`
- **WHEN** `formatMessageContent` is executed
- **THEN** script tags are escaped as `&lt;script&gt;alert('xss')&lt;/script&gt;` and bold is rendered as `<strong class="font-semibold text-slate-900">Important</strong>`.

#### Scenario: Code block and inline code protection
- **GIVEN** assistant text containing fenced code blocks (```typescript ... ```) or inline code (`const x = 1;`)
- **WHEN** formatted for display
- **THEN** code blocks are rendered in styled `<pre><code>` containers and inline code in styled `<code>` badges without escaping internal backticks incorrectly.

---

## 5. Domain: Dynamic Prompt Directives & Contextual Quick Chips

### Requirement: Conversational Directives in Dynamic System Prompt
The `buildDynamicSystemPrompt()` in `CopilotBridgeService` MUST instruct the model to adopt a natural conversational tone, avoiding robotic formatting, excessive markdown headers, or walls of text.

#### Scenario: System prompt includes tone and formatting directives
- **GIVEN** `CopilotBridgeService.buildDynamicSystemPrompt()` is called
- **WHEN** inspecting the prompt text
- **THEN** it contains explicit directives instructing the assistant to respond in a natural, fluid conversational tone and avoid excessive markdown headers.

### Requirement: View-Specific Contextual Prompt Chips
The `CopilotChatComponent` MUST reactively compute prompt chips based on the active view (Showroom 3D, Enterprise BI, Judge Guide, Inspector).

#### Scenario: Active view drives quick chips
- **GIVEN** the active workspace view is `view-enterprise-bi`
- **WHEN** the chat drawer is rendered
- **THEN** enterprise BI quick chips (e.g. query metrics, calculate KPI) are displayed.
