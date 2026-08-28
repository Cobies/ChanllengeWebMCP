# Specification: Chat Formatting Improvements & Markdown Typography Rendering

**Domain**: `webmcp-copilot-chat-bridge`  
**Status**: Completed  
**Target Environment**: Angular 22, Bun runtime, Tailwind CSS v4, `@webmcp/angular`, CPAMC Bridge Proxy  

---

## 1. Domain: Safe Markdown Parsing & Typography Rendering

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

## 2. Domain: Dynamic Prompt Directives & Contextual Quick Chips

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
