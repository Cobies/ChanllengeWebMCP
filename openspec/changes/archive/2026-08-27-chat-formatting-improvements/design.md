# Design Document: Chat Formatting Improvements & Markdown Typography Rendering

## Architecture & Data Flow

### 1. Markdown Parsing Pipeline (`formatMessageContent`)
The formatting engine in `CopilotChatComponent` executes an 8-stage transformation pipeline:

1. **HTML Escaping Stage**:
   All incoming raw content is sanitized by converting `&`, `<`, `>`, `"` into HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`). This prevents any XSS injection from untrusted model outputs or external data.

2. **Code Block Protection**:
   Multiline fenced code blocks (```...```) are extracted using regex and replaced with unique index placeholders (`%%CODE_BLOCK_N%%`). Their trimmed code contents are stored in a typed array wrapped in `<pre class="my-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto"><code>...</code></pre>`.

3. **Inline Code Protection**:
   Inline code spans (\`...\`) are extracted using regex and replaced with unique placeholders (`%%INLINE_CODE_N%%`). Their contents are stored wrapped in `<code class="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-cyan-800 border border-slate-200">...</code>`.

4. **Heading Normalization & Hash Stripping**:
   Markdown headers (`#`, `##`, `###`, `####`, `#####`, `######`) are matched line-by-line via `/^(#{1,6})\s+(.+)$/gm`. The raw hash prefixes are completely stripped and replaced by `<div class="font-bold text-slate-900 text-xs mt-2 mb-1">...</div>`.

5. **Inline Typography Parsing**:
   Bold syntax (`**...**`, `__...__`) transforms to `<strong class="font-semibold text-slate-900">...</strong>`.
   Italic syntax (`*...*`, `_..._`) transforms to `<em>...</em>`.

6. **List Parsing & State Tracking**:
   A line-by-line state machine processes bullet lists (`-`, `*`) and numbered lists (`1. `). It automatically opens and closes `<ul class="list-disc list-inside my-1 space-y-0.5 text-slate-800">` and `<ol class="list-decimal list-inside my-1 space-y-0.5 text-slate-800">` tags with structured `<li>` elements.

7. **Line Break & Paragraph Spacing**:
   Multiple newlines (`\n\n+`) are converted to spacing divisions (`<div class="my-1.5"></div>`), and single newlines (`\n`) to `<br/>`. Redundant breaks adjacent to block elements are pruned.

8. **Placeholder Restoration**:
   Protected code blocks and inline code elements are rehydrated into the string, ensuring code syntax remains unescaped and undisturbed by markdown transformations.

---

### 2. Conversational System Prompt Engineering
In `CopilotBridgeService.buildDynamicSystemPrompt()`:
- Added directive: *"Tone & Style: Respond in a natural, fluid conversational tone. Avoid robotic formatting, excessive markdown headers (#, ##, ###), or walls of text. Keep responses concise and human-friendly."*

---

### 3. Contextual Quick Prompt Chips
`CopilotChatComponent` computes quick action prompt chips based on active view and route using Angular `computed` signals:
- Showroom 3D: Orbit, screenshot, paint, camera controls
- Enterprise BI: Metrics queries, KPI calculation, anomaly filtering, CSV export
- Judge Guide: Evaluation rubric, scoring criteria, system benchmarks
- Inspector: Hierarchy inspection, material tuning, mesh debugging
