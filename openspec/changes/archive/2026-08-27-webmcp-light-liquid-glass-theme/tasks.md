# Tasks: Light Liquid-Glass Theme & Warm Matte Visual Identity

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single cohesive PR |
| Delivery strategy | single-pr |
| Chain strategy | none |

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Medium

## Phase 1: Core Design Tokens & Global Styles
- [x] 1.1 Update `projects/showcase/src/styles.css` with CSS variables (`--color-bg-primary: #f6f4ee`, `--color-bg-card`), body styling, `.glass-panel`, `.glass-panel-glow`, and scrollbars.
- [x] 1.2 Update `projects/showcase/src/app/app.component.html` root layout container to `bg-[#f6f4ee] text-slate-800` and footer styling.

## Phase 2: Navigation & 3D Viewport Styling
- [x] 2.1 Refactor `projects/showcase/src/app/components/header/header.component.ts` with translucent white frosted background, slate typography, and ocean blue active indicators.
- [x] 2.2 Refactor `projects/showcase/src/app/components/showroom/showroom.component.ts` banner styling with warm cream highlights.
- [x] 2.3 Refactor `projects/showcase/src/app/components/visualizer-3d/visualizer-3d.component.ts` Three.js scene background (`0xf4f0e6`), fog, grid helper, ambient lights, and HUD overlays.

## Phase 3: Interactive Components & Drawers
- [x] 3.1 Refactor `projects/showcase/src/app/components/customizer-form/customizer-form.component.ts` with liquid-glass card styling and high-contrast controls.
- [x] 3.2 Refactor `projects/showcase/src/app/components/inspector/inspector.component.ts` with white translucent tool log cards and emerald/rose badges.
- [x] 3.3 Refactor `projects/showcase/src/app/components/copilot-chat/copilot-chat.component.ts` with alabaster `#fbf9f5` drawer shell, cyan user bubbles, and quick prompt chips.

## Phase 4: Enterprise BI & Judge Guide Views
- [x] 4.1 Refactor `projects/showcase/src/app/components/enterprise-bi/enterprise-bi.component.ts` with liquid-glass KPI cards, ocean blue sparklines, 24h SVG curve, and filtered data table.
- [x] 4.2 Refactor `projects/showcase/src/app/components/judge-guide/judge-guide.component.ts` with liquid-glass multi-tab rubric cards and code blocks.

## Phase 5: Verification & Quality Gate
- [x] 5.1 Run `bun test` ensuring all 67 unit tests pass across 10 spec suites.
- [x] 5.2 Run `bun run build` ensuring `@webmcp/angular` and `showcase` build cleanly with zero errors.
