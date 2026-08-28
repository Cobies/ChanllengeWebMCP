# Implementation Tasks: Chat Formatting Improvements

- [x] Task 1: Implement pure `formatMessageContent` helper function in `copilot-chat.component.ts` with XSS escaping, code block protection, hashtag stripping for headings, bold/italics, and list parsing.
- [x] Task 2: Bind `formatMessageContent(msg.content)` to message rendering template in `copilot-chat.component.html` / component template.
- [x] Task 3: Update `CopilotBridgeService.buildDynamicSystemPrompt()` to include conversational tone and formatting directives.
- [x] Task 4: Implement reactive `promptChips` computed signal based on active workspace view (`SidebarModuleRegistryService`).
- [x] Task 5: Add comprehensive unit tests in `copilot-chat.component.spec.ts` and `copilot-bridge.service.spec.ts` covering markdown formatting, XSS sanitization, code blocks, lists, and system prompt directives.
