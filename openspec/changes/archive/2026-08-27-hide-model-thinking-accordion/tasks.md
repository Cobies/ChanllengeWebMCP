# Tasks: Hide AI Model Names & Accordions for Thinking / Tool Execution

**Change**: `hide-model-thinking-accordion`  
**Status**: All Tasks Complete (4/4 complete)  
**Mode**: Strict TDD  

---

## Task Completion List

- [x] Task 1: Replace model branding with generic "AI Copilot" UI strings and remove header dropdown from `CopilotChatComponent` (`src/app/components/copilot-chat/copilot-chat.component.ts`).
- [x] Task 2: Extend `ChatMessage` interface with `thinking?: string;` property in `src/app/services/copilot-bridge.types.ts`.
- [x] Task 3: Implement `extractThinkingAndCleanContent` in `CopilotBridgeService` (`src/app/services/copilot-bridge.service.ts`) with unit tests in `src/app/services/copilot-bridge.service.spec.ts`.
- [x] Task 4: Implement collapsible `<details>` accordions for thinking processes and tool execution outputs in `CopilotChatComponent` with unit tests in `src/app/components/copilot-chat/copilot-chat.component.spec.ts`.
