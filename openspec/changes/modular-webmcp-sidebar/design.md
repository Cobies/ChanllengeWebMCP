# Design: Modular WebMCP Sidebar Workspace Navigation Hub

## Technical Approach

A clean, config-driven Workspace View Navigation Hub for Angular 22 and Tailwind CSS v4 that centralizes routing, view switching, and live WebMCP tool telemetry into a responsive sidebar (`expanded`, `rail`, `drawer`). All view-specific forms, parameters, and simulation buttons remain strictly encapsulated inside each view component (`ShowroomComponent`, `EnterpriseBiComponent`, `JudgeGuideComponent`, `InspectorComponent`), while the sidebar provides unified navigation, reactive tool count badges from `WebMcpService`, and multi-mode docking.

---

## Architecture Decisions

| Decision | Alternatives Considered | Tradeoffs & Rationale |
|---|---|---|
| **Clean View Navigation Hub** | Embedding domain action buttons in sidebar | Encapsulating interactive forms, vehicle customizers, and rubric tools within view components avoids sidebar clutter, preserves single responsibility, and scales cleanly for new views. |
| **Reactive Telemetry Badges** | Static tool numbers or polling intervals | Deriving tool counts via Angular 22 Signals from `WebMcpService.registeredTools()` ensures real-time updates as route views dynamically register/unregister their domain tools. |
| **Config-Driven Extensibility (`SIDEBAR_MODULE_CONFIGS`)** | Hardcoded navigation markup | Multi-provider DI token and runtime registry service allow external feature modules to register new views with route, category, tools, and badges without modifying core sidebar code. |
| **Multi-Mode Responsive Docking** | Fixed width or binary collapse | Supporting Expanded (280px), Rail (64px), and Mobile Drawer accommodates dense 3D visualizer canvases and multi-screen workflows while maintaining mobile accessibility. |

---

## Data Flow

```
┌────────────────────────────────┐       ┌─────────────────────────────────────────┐
│ WebMcpService (Signals)        │◄──────┤ SidebarModuleRegistryService            │
│  - registeredTools()           │       │  - views() : Signal<ViewConfig[]>       │
│  - executionLogs()             │──────►│  - viewToolCountsMap() : Signal<Map>    │
└────────────────────────────────┘       │  - dockMode() : Signal<SidebarDockMode> │
                                         └───────────────────▲─────────────────────┘
                                                             │
                                         ┌───────────────────┴─────────────────────┐
                                         │ SidebarComponent (Navigation Hub)       │
                                         │  - Config-driven route list             │
                                         │  - Active route indicator & tool badge  │
                                         │  - WebMCP status footer & dock toggle   │
                                         └───────────────────┬─────────────────────┘
                                                             │ RouterLink / onSelect
                ┌────────────────────────────────────────────┼────────────────────────────────────────┐
                ▼                                            ▼                                        ▼
┌───────────────────────────────┐            ┌───────────────────────────────┐        ┌───────────────────────────────┐
│ 3D Showroom View              │            │ Enterprise BI View            │        │ Copilot Assistant Drawer      │
│  - Orbit, Paint, Screenshot   │            │  - Query, Filter, KPI, Export │        │  - Autonomous agent chat      │
│  - Three.js Digital Twin      │            │  - Anomaly detection table    │        │  - Tool execution history     │
└───────────────────────────────┘            └───────────────────────────────┘        └───────────────────────────────┘
```

---

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/models/sidebar.models.ts` | Modify | Update type definitions for `SidebarViewCategory`, `SidebarDockMode`, `SidebarViewConfig`, and `SIDEBAR_MODULE_CONFIGS`. |
| `src/app/config/sidebar-modules.config.ts` | Modify | Define clean workspace view configurations (`/3d-showroom`, `/enterprise-bi`, `/judge-guide`, `/inspector`, Copilot) without embedded domain actions. |
| `src/app/services/sidebar-module-registry.service.ts` | Modify | Reactive service managing view registration, route sync, tool telemetry counts, and docking state. |
| `src/app/components/sidebar/sidebar.component.ts` | Modify | Navigation Hub component rendering route items, active indicators, live tool badges, and docking footer. |
| `src/app/components/sidebar/sidebar.component.spec.ts` | Modify | Unit tests verifying route navigation, badge telemetry calculation, and docking mode toggles. |
| `src/app/services/sidebar-module-registry.service.spec.ts` | Modify | Unit tests verifying view registration, category mapping, and tool count reactivity. |

---

## Interfaces / Contracts

```typescript
export type SidebarViewCategory = 'workspace' | 'telemetry' | 'assistant';
export type SidebarDockMode = 'expanded' | 'rail' | 'collapsed' | 'drawer';

export interface SidebarViewConfig {
  id: string;
  title: string;
  icon: string;
  description?: string;
  category: SidebarViewCategory;
  order: number;
  route?: string;
  tools?: string[];
  badge?: string | (() => string | number | null);
  onSelect?: (injector: import('@angular/core').Injector) => void;
  enabled?: boolean;
}

export const SIDEBAR_MODULE_CONFIGS = new InjectionToken<SidebarViewConfig[]>('SIDEBAR_MODULE_CONFIGS');

export function provideSidebarModules(configs: SidebarViewConfig[]): Provider[] {
  return [{ provide: SIDEBAR_MODULE_CONFIGS, useValue: configs, multi: true }];
}
```

---

## Workspace Navigation Hub Specification

1. **3D Showroom (`route: '/3d-showroom'`, category: `'workspace'`)**:
   - Navigation: Route link to 3D Digital Twin visualizer.
   - Badge: Active tool count for `scene_3d_action`, `take_screenshot`.
   - Domain UI: Canvas, orbit controls, customizer forms remain in `ShowroomComponent`.
2. **Enterprise BI (`route: '/enterprise-bi'`, category: `'workspace'`)**:
   - Navigation: Route link to enterprise analytics dashboard.
   - Badge: Active tool count for `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export`.
   - Domain UI: Metric charts, anomaly filters, export buttons remain in `EnterpriseBiComponent`.
3. **Judge Guide (`route: '/judge-guide'`, category: `'workspace'`)**:
   - Navigation: Route link to contest evaluation guide.
   - Badge: Active tool count for `judge_rubric_evaluation`, `verify_harness`.
   - Domain UI: Evaluation cards, scoring criteria remain in `JudgeGuideComponent`.
4. **WebMCP Inspector (`route: '/inspector'` or dialog, category: `'telemetry'`)**:
   - Navigation: View link or telemetry trigger.
   - Badge: Dynamic execution logs counter.
   - Domain UI: Payload viewer, tool latency metrics remain in `InspectorComponent`.
5. **Copilot AI (`onSelect: launchCopilot`, category: `'assistant'`)**:
   - Navigation: Trigger opening floating Copilot drawer.
   - Badge: Live agent status (`idle`, `thinking`, `executing`).

---

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| **Unit** | `SidebarModuleRegistryService` | Test view registration, category grouping, active tool map calculation, and dock mode switching. |
| **Unit** | `SidebarComponent` | Test expanded (280px) and rail (64px) rendering, active route highlighting, tool count badges, and drawer backdrop. |
| **Integration** | `WebMcpService` ↔ Sidebar | Validate reactive tool count updates when view components register/unregister tools dynamically. |
| **Layout** | App Shell Docking | Validate responsive content margin transition (`pl-72`, `pl-16`, `pl-0`) based on `dockMode()`. |

---

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

---

## Migration / Rollout

No data migration required. Existing domain components (`ShowroomComponent`, `EnterpriseBiComponent`, etc.) retain their internal tool implementations. The sidebar purely acts as a navigation hub and telemetry mirror.

---

## Open Questions

None. Architecture and contracts align with Angular 22 Signals, Tailwind CSS v4, and `@webmcp/angular` specifications.
