# Proposal: Hide AI Model Names & Accordions for Thinking / Tool Execution

**Change**: `hide-model-thinking-accordion`  
**Author**: Gentle AI SDD Framework  
**Status**: Completed & Verified  
**Date**: 2026-08-27  

---

## 1. Problem Statement
In the interactive Copilot Chat drawer, specific backend LLM branding (e.g. "Gemini 3.7 Flash High") was explicitly displayed across UI controls, headers, indicators, and model dropdowns. Furthermore:
1. Deep-thinking reasoning tokens and `<think>...</think>` XML tags from reasoning models were either displayed as raw text or cluttered the chat stream.
2. Tool execution results and diagnostic payloads produced long, visually intrusive blocks that disrupted conversational readability.
3. The UI lacked a clean encapsulation mechanism for internal model thoughts and multi-step tool call metadata.

---

## 2. Proposed Solution
1. **Model Anonymization**: Replace all vendor and specific LLM brand names in the user interface with generic, professional "AI Copilot" / "Copilot" branding.
2. **Streamlined Header**: Remove the model selection dropdown from the chat drawer header to simplify user experience while retaining programmatic model switching in `CopilotBridgeService`.
3. **Reasoning & Thinking Extraction**: Extract reasoning from `reasoning_content` API responses and parse/strip `<think>` / `<thought>` tags into a dedicated `thinking?: string` field on `ChatMessage`.
4. **Collapsible Accordions**: Encapsulate assistant thinking processes within a clean `💭 Thought Process` `<details>` accordion, and encapsulate intermediate tool execution parameters/results in a collapsible `<details>` accordion.

---

## 3. Impact & Scope
- **Files Modified**:
  - `src/app/services/copilot-bridge.types.ts`
  - `src/app/services/copilot-bridge.service.ts`
  - `src/app/components/copilot-chat/copilot-chat.component.ts`
  - `src/app/services/copilot-bridge.service.spec.ts`
  - `src/app/components/copilot-chat/copilot-chat.component.spec.ts`
- **Dependencies**: No new external dependencies. Utilizes native HTML5 `<details>`/`<summary>` elements styled with Tailwind CSS v4.

---

## 4. Verification Plan
- Unit tests for reasoning extraction and XML tag stripping in `CopilotBridgeService`.
- Unit tests for accordion rendering and model branding anonymization in `CopilotChatComponent`.
- Full regression testing with `bun test` and production build with `bun run build`.
