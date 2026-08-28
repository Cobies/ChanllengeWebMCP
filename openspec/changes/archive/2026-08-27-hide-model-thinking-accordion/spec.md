# Specification: Hide AI Model Names & Accordions for Thinking / Tool Execution

**Change**: `hide-model-thinking-accordion`  
**Status**: Approved & Verified  
**Target Environment**: Angular 22, Bun runtime, Tailwind CSS v4, `@webmcp/angular`, CPAMC Bridge Proxy  

---

## 1. Domain: Model Branding Anonymization (`copilot-branding-anonymization`)

### Requirement: REQ-01 Model Branding Anonymization
The user interface MUST present clean, generic "AI Copilot" and "Copilot" branding across all chat drawer views, buttons, status indicators, and headers. Vendor-specific model strings (such as "Gemini 3.7 Flash High") SHALL NOT be rendered in public user-facing copy.

#### Scenario: Generic AI Copilot UI branding
- **GIVEN** the Copilot chat drawer is opened
- **WHEN** the launcher button, empty state banner, assistant header, generating indicator, and status bar are rendered
- **THEN** the text displays "AI Copilot" or "Copilot" and "Thinking & executing..." without hardcoded vendor model names.

#### Scenario: Dynamic System Prompt Branding
- **GIVEN** `CopilotBridgeService.buildDynamicSystemPrompt()` is invoked
- **WHEN** the dynamic system message is prepended to the chat history
- **THEN** it identifies the assistant as "AI Copilot" and embeds active workspace view context without leaking raw backend model vendor designations.

---

## 2. Domain: Chat Header Streamlining (`copilot-header-streamlining`)

### Requirement: REQ-02 Header Dropdown Removal
The chat drawer header MUST NOT expose an interactive model selector dropdown to regular users. Model selection state in `CopilotBridgeService` SHALL remain accessible programmatically for developer configuration and fallback orchestration.

#### Scenario: Streamlined header controls
- **GIVEN** the chat drawer header is rendered
- **WHEN** the user inspects the header
- **THEN** only the title, active status badge, minimize button, and close button are present.

#### Scenario: Model state management
- **GIVEN** `CopilotBridgeService.selectedModel` signal
- **WHEN** programmatic updates occur
- **THEN** the underlying model parameter is passed to bridge requests while header UI remains clean and uncluttered.

---

## 3. Domain: Thinking Extraction & Sanitization (`copilot-thinking-extraction`)

### Requirement: REQ-03 Thinking Extraction & XML Tag Stripping
`CopilotBridgeService` MUST parse and extract reasoning from API response structures (`reasoning_content`, `reasoning`) and embedded XML tags (`<think>...</think>`, `<thought>...</thought>`). The extracted reasoning content SHALL populate the `thinking?: string` property of `ChatMessage`, and the XML tags MUST be completely stripped from `content`.

#### Data Contract: ChatMessage
```typescript
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
```

#### Scenario: Parse reasoning from API fields
- **GIVEN** an OpenAI-compatible completion response containing `reasoning_content: "Calculating inventory..."`
- **WHEN** `extractThinkingAndCleanContent(message)` is executed
- **THEN** `thinking` is returned as `"Calculating inventory..."` and `cleanContent` contains the stripped body text.

#### Scenario: Strip thinking XML tags from content
- **GIVEN** assistant text containing `<think>Analyzing 3D scene</think>Here is the result`
- **WHEN** `extractThinkingAndCleanContent(message)` is executed
- **THEN** `thinking` is populated with `"Analyzing 3D scene"` and `cleanContent` equals `"Here is the result"`.

---

## 4. Domain: Collapsible Accordion Encapsulation (`copilot-accordion-encapsulation`)

### Requirement: REQ-04 Collapsible Accordion Encapsulation
Assistant reasoning thoughts and intermediate tool execution results MUST be encapsulated in native `<details>`/`<summary>` accordion blocks styled with Tailwind CSS liquid-glass styling.

#### Scenario: Thinking process details accordion
- **GIVEN** an assistant message with a non-empty `thinking` property
- **WHEN** `CopilotChatComponent` renders the message
- **THEN** a collapsible `<details>` element with summary `"💭 Thought Process"` is rendered above the message content.

#### Scenario: Tool execution result details accordion
- **GIVEN** a tool message or tool execution metadata in the conversation stream
- **WHEN** `CopilotChatComponent` renders the tool result
- **THEN** tool name, status pill, execution duration, image preview (if screenshot), and JSON payload are housed inside a collapsible `<details>` accordion with animated chevron.
