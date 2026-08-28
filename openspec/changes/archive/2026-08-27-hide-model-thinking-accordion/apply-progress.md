# Apply Progress: Hide AI Model Names & Accordions for Thinking / Tool Execution

**Change**: `hide-model-thinking-accordion`  
**Status**: All Tasks Complete (4/4 tasks complete)  
**Mode**: Strict TDD  

---

## Executive Summary
- Implemented `thinking?: string;` property on `ChatMessage` in `src/app/services/copilot-bridge.types.ts`.
- Added reasoning content extraction and `<think>` / `<thought>` tag stripping in `src/app/services/copilot-bridge.service.ts` (`extractThinkingAndCleanContent`).
- Updated `CopilotChatComponent` UI:
  - Replaced vendor model references with "AI Copilot" / "Copilot" across launcher, minimized bar, drawer header, empty state banner, assistant header, generating indicator, and status bar.
  - Removed model selector dropdown from drawer header.
  - Encapsulated assistant thinking in collapsible `<details>` accordion (`💭 Thought Process`).
  - Encapsulated tool execution details (status pill, execution time, image preview, error, and json payload) in collapsible `<details>` accordion.
- Verified test suite with `bun test` (all 212 tests passing).

## Modified Files
- `src/app/services/copilot-bridge.types.ts`
- `src/app/services/copilot-bridge.service.ts`
- `src/app/components/copilot-chat/copilot-chat.component.ts`
- `src/app/services/copilot-bridge.service.spec.ts`
- `src/app/components/copilot-chat/copilot-chat.component.spec.ts`
