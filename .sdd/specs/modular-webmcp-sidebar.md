# Specs: Modular WebMCP Sidebar Workspace

**Change**: `modular-webmcp-sidebar`  
**Status**: Approved / Ready for Design  
**Target Environment**: Angular 22, Tailwind CSS v4, Bun runtime, `@webmcp/angular`, Three.js, W3C WebMCP Standard  

---

## 1. Domain Overview & Purpose

The Modular WebMCP Sidebar transforms monolithic and fragmented tool controls into a centralized, config-driven sidebar workspace. It categorizes tools, simulation triggers, and navigation into 5 core module sections:
1. **Enterprise BI**: Real-time analytics, transactional anomaly filtering, KPI summaries, and export capabilities.
2. **Judge Guide**: Live evaluation scorecard, rubric compliance verification, and test harness navigation.
3. **3D Digital Twin**: WebGL scene manipulation, orbit controls, color customization, and canvas capture.
4. **Inspector**: Live tool invocation logs, latency telemetry, payload inspection, and audit stream controls.
5. **Copilot AI**: Multimodal agent drawer trigger, status indicators, quick prompts, and model routing.

---

## 2. Core Contracts & Types Specification

### 2.1 Interface: `SidebarSection` & Module Identifiers
```typescript
export type SidebarSection =
  | 'enterprise-bi'
  | 'judge-guide'
  | '3d-twin'
  | 'inspector'
  | 'copilot';

export type SidebarDockMode = 'expanded' | 'rail' | 'collapsed' | 'drawer';

export type SidebarActionVariant = 'cyan' | 'purple' | 'rose' | 'emerald' | 'slate' | 'amber';
```

### 2.2 Interface: `SidebarActionItem`
```typescript
export interface SidebarActionItem {
  id: string;
  label: string;
  icon?: string;
  toolName?: string;
  defaultParams?: Record<string, unknown>;
  colorVariant?: SidebarActionVariant;
  badge?: string | (() => string | number | null);
  handler?: (injector: import('@angular/core').Injector) => Promise<void> | void;
  disabled?: boolean | (() => boolean);
}
```

### 2.3 Interface: `SidebarModuleConfig`
```typescript
export interface SidebarModuleConfig {
  id: string;
  title: string;
  icon: string;
  description?: string;
  section: SidebarSection;
  order: number;
  route?: string;
  tools?: string[];
  actions?: SidebarActionItem[];
  badge?: string | (() => string | number | null);
  enabled?: boolean;
}
```

### 2.4 Service Contract: `SidebarModuleRegistryService`
```typescript
export const SIDEBAR_MODULE_CONFIGS = new InjectionToken<SidebarModuleConfig[]>('SIDEBAR_MODULE_CONFIGS');

export interface ISidebarModuleRegistryService {
  // Signals
  readonly modules: Signal<SidebarModuleConfig[]>;
  readonly activeSection: Signal<SidebarSection | null>;
  readonly dockMode: Signal<SidebarDockMode>;
  readonly isMobileDrawerOpen: Signal<boolean>;
  readonly sectionModulesMap: Signal<Map<SidebarSection, SidebarModuleConfig[]>>;
  readonly registeredToolsMap: Signal<Map<SidebarSection, WebMcpToolDefinition[]>>;

  // Operations
  registerModule(config: SidebarModuleConfig): void;
  unregisterModule(moduleId: string): void;
  getModule(moduleId: string): SidebarModuleConfig | undefined;
  getModulesForSection(section: SidebarSection): SidebarModuleConfig[];
  setActiveSection(section: SidebarSection | null): void;
  setDockMode(mode: SidebarDockMode): void;
  toggleDockMode(): void;
  toggleMobileDrawer(force?: boolean): void;
  executeAction(action: SidebarActionItem): Promise<unknown>;
}
```

---

## 3. ADDED Requirements

### Requirement: Config-Driven Module Registry & DI Provider
The system MUST provide a `SidebarModuleRegistryService` that dynamically resolves module configurations provided via `SIDEBAR_MODULE_CONFIGS` multi-providers and runtime `registerModule()` registrations.

#### Scenario: Multi-provider module initialization
- **GIVEN** an application configuring `provideSidebarModules([...])` with 5 default sections
- **WHEN** the application bootstraps and `SidebarModuleRegistryService` initializes
- **THEN** all registered modules SHALL be sorted by `order` and exposed via the `modules()` signal.

#### Scenario: Runtime dynamic tool and module registration
- **GIVEN** a dynamically loaded feature component registering an auxiliary WebMCP tool
- **WHEN** the feature calls `registry.registerModule(customModule)`
- **THEN** `modules()` and `sectionModulesMap()` signals update immediately without page refresh.

---

### Requirement: 5-Section Categorization and Dynamic Badge Telemetry
The system MUST organize sidebar modules into 5 distinct sections: `Enterprise BI`, `Judge Guide`, `3D Digital Twin`, `Inspector`, and `Copilot AI`. Each section MUST display real-time tool counts or telemetry status derived from `WebMcpService`.

#### Scenario: Dynamic tool count per section
- **GIVEN** `WebMcpService.registeredTools()` contains 8 active tools
- **WHEN** the sidebar evaluates section tool badges
- **THEN** the badge reflects the exact count of registered tools matching that module's `tools` array
- **AND** updates reactively whenever a tool is dynamically registered or unregistered.

#### Scenario: Live execution indicator on Inspector and Copilot modules
- **GIVEN** an autonomous agent or user executes a tool call
- **WHEN** `WebMcpService.executionLogs()` updates or `CopilotBridgeService.isGenerating()` is true
- **THEN** the Inspector section displays an animated pulsing badge indicating active execution.

---

### Requirement: Unified Tool Execution Dispatcher
The `SidebarModuleRegistryService` and `SidebarComponent` MUST provide action execution handlers that trigger `WebMcpService.executeTool()` with appropriate payload parameters and execution logging.

#### Scenario: Triggering 3D scene action from sidebar
- **GIVEN** the 3D Digital Twin section in the sidebar
- **WHEN** the user clicks "Orbit 3D (+45°)"
- **THEN** the registry dispatches `WebMcpService.executeTool('scene_3d_action', { action: 'rotate', deltaX: 45, durationMs: 600 }, 'ui')`
- **AND** logs the result in `WebMcpService.executionLogs()`.

#### Scenario: Action failure handling with toast/badge feedback
- **GIVEN** an action attempting to execute an unregistered tool
- **WHEN** `WebMcpService.executeTool()` throws an error
- **THEN** the error SHALL be captured gracefully, logged to the execution stream, and prevent UI disruption.

---

### Requirement: Responsive Multi-Mode Docking & Keyboard Navigation
The `SidebarComponent` MUST support 4 view modes: `expanded` (desktop default 280px), `rail` (compact 64px icon bar), `collapsed` (hidden), and `drawer` (mobile overlay with glassmorphic backdrop).

#### Scenario: Toggling between expanded and rail modes
- **GIVEN** desktop viewport (>= 1024px)
- **WHEN** the user triggers the sidebar collapse/expand toggle button
- **THEN** `dockMode` alternates between `'expanded'` and `'rail'` with smooth transition animations
- **AND** tooltips appear for rail mode icons.

#### Scenario: Mobile viewport drawer overlay
- **GIVEN** mobile viewport (< 1024px)
- **WHEN** the user opens the sidebar via the mobile menu hamburger button
- **THEN** the sidebar slides in from the left as an overlay drawer with backdrop blur
- **AND** closes automatically upon selecting a navigation route or clicking outside.

---

## 4. MODIFIED Requirements

### Requirement: `webmcp-showcase-app` Responsive Shell Integration
The system MUST update the root application shell layout to integrate `<app-sidebar>` alongside `<router-outlet>` while retaining `<app-header>` and `<app-copilot-chat>`.
(Previously: Application layout only included `<app-header>`, `<main>`, and `<app-copilot-chat>` without a persistent sidebar workspace.)

#### Scenario: Sidebar alongside routed dashboard views
- **GIVEN** an active application instance on desktop
- **WHEN** the user navigates between `/3d-showroom`, `/enterprise-bi`, and `/judge-guide`
- **THEN** the sidebar remains permanently accessible in the layout docked on the left
- **AND** adjusts main viewport margins according to `dockMode` (`pl-72` for expanded, `pl-16` for rail).

---

## 5. Specifications & Edge Cases Matrix

| Category | Edge Case | Expected Behavior |
|----------|-----------|-------------------|
| **SSR / Hydration** | SSR rendering without `window.matchMedia` | Defaults `dockMode` to `'expanded'` or safe SSR state without layout shifts |
| **Tool Unregistration** | Tool unregistered during active UI render | Reactive signal updates; disabled action button with warning tooltip |
| **Simultaneous Executions** | User clicks multiple quick actions rapidly | Debounced / queued via `WebMcpService` async dispatch without state race conditions |
| **Mobile Back Navigation** | User hits back button with mobile drawer open | Drawer closes gracefully without breaking navigation stack |
| **Accessibility** | Screen reader navigation across sections | `aria-expanded`, `aria-label`, and `role="navigation"` on sidebar panels |
