# Specs: Modular WebMCP Sidebar Workspace Navigation Hub

**Change**: `modular-webmcp-sidebar`  
**Status**: Ready for Design  
**Target Environment**: Angular 22, Tailwind CSS v4, `@webmcp/angular`, TypeScript 5.9  

---

## 1. Domain Overview & Purpose

The Modular WebMCP Sidebar functions as the primary **Workspace View Navigation Hub** across WebMCP domains (`/3d-showroom`, `/enterprise-bi`, `/judge-guide`, `/inspector`, and Copilot AI trigger). It decouples navigation, routing, and live tool telemetry badges from domain-specific tool execution controls, ensuring interactive forms, simulators, and execution buttons remain strictly encapsulated within each view's content area.

---

## 2. Core Interfaces & Contracts

### 2.1 Interface: `SidebarViewCategory` & `SidebarDockMode`
```typescript
export type SidebarViewCategory = 'workspace' | 'telemetry' | 'assistant';

export type SidebarDockMode = 'expanded' | 'rail' | 'collapsed' | 'drawer';
```

### 2.2 Interface: `SidebarViewConfig`
```typescript
export interface SidebarViewConfig {
  id: string;
  title: string;
  icon: string;
  category: SidebarViewCategory;
  order: number;
  route?: string;
  tools?: string[];
  badge?: string | (() => string | number | null);
  onSelect?: (injector: import('@angular/core').Injector) => void;
  enabled?: boolean;
}
```

### 2.3 Service Contract: `SidebarModuleRegistryService`
```typescript
export const SIDEBAR_VIEW_CONFIGS = new InjectionToken<SidebarViewConfig[]>('SIDEBAR_VIEW_CONFIGS');

export interface ISidebarModuleRegistryService {
  // Reactive Signals
  readonly views: Signal<SidebarViewConfig[]>;
  readonly activeRoute: Signal<string>;
  readonly dockMode: Signal<SidebarDockMode>;
  readonly isMobileDrawerOpen: Signal<boolean>;
  readonly categoryViewsMap: Signal<Map<SidebarViewCategory, SidebarViewConfig[]>>;
  readonly viewToolCountsMap: Signal<Map<string, { active: number; total: number }>>;

  // Operations
  registerView(config: SidebarViewConfig): void;
  unregisterView(viewId: string): void;
  getView(viewId: string): SidebarViewConfig | undefined;
  getViewsForCategory(category: SidebarViewCategory): SidebarViewConfig[];
  setDockMode(mode: SidebarDockMode): void;
  toggleDockMode(): void;
  toggleMobileDrawer(force?: boolean): void;
  selectView(view: SidebarViewConfig): void;
}
```

---

## 3. Requirements

### Requirement: Workspace View Navigation Hub
The `SidebarComponent` MUST function as the primary navigation hub displaying 5 workspace items: 3D Digital Twin (`/3d-showroom`), Enterprise BI (`/enterprise-bi`), Judge Guide (`/judge-guide`), WebMCP Inspector (`/inspector`), and Gemini Copilot AI launcher.

#### Scenario: Navigating between workspace views
- **GIVEN** the sidebar in expanded or rail dock mode
- **WHEN** the user clicks a workspace navigation item (e.g., `/enterprise-bi`)
- **THEN** the router SHALL activate the target view route
- **AND** the sidebar item SHALL reflect active route state styling.

#### Scenario: Triggering Copilot drawer from navigation hub
- **GIVEN** the Copilot assistant item in the sidebar
- **WHEN** the user activates the Copilot item
- **THEN** `SidebarModuleRegistryService` executes the `onSelect` handler to open the Copilot drawer.

---

### Requirement: Reactive Tool Count Badges & Telemetry
The system MUST dynamically compute tool count badges for each registered view by cross-referencing `view.tools` with `WebMcpService.registeredTools()`.

#### Scenario: Dynamic tool registration updates badge
- **GIVEN** the Enterprise BI view registers 4 tools upon route activation
- **WHEN** `WebMcpService.registeredTools()` emits updated tool definitions
- **THEN** `viewToolCountsMap` SHALL update reactively to display `4/4` active tools
- **AND** update to `0/4` when the component unmounts and unregisters tools.

#### Scenario: Global connectivity and log telemetry status
- **GIVEN** WebMCP runtime processing agent tool calls
- **WHEN** `WebMcpService.executionLogs()` updates
- **THEN** the sidebar footer SHALL display live execution count and active status pulse.

---

### Requirement: Strict Domain Control Encapsulation
The sidebar MUST NOT contain interactive domain tool execution controls, parameter forms, or vehicle customizer buttons. All domain forms, action buttons, and simulators MUST reside exclusively within their respective routed view component templates.

#### Scenario: Clean sidebar without domain controls
- **GIVEN** an active view rendered in the viewport
- **WHEN** inspecting the sidebar DOM structure
- **THEN** the sidebar SHALL only contain view routes, category headers, tool count badges, and dock toggles
- **AND** domain action buttons (e.g., Orbit 3D, Reset Filters, Rubric Eval) SHALL render solely in the main view area.

---

### Requirement: Extensible View Registration Provider
The system MUST support extensible workspace registration via `SIDEBAR_VIEW_CONFIGS` injection tokens and runtime `registerView()` calls.

#### Scenario: Adding a custom extension workspace
- **GIVEN** a plugin module defining a new workspace view config
- **WHEN** registered via `provideSidebarViews([customConfig])` or runtime `registerView()`
- **THEN** the sidebar SHALL automatically integrate the new workspace sorted by category and order.

---

### Requirement: Responsive Multi-Mode Docking
The `SidebarComponent` MUST support `expanded` (280px), `rail` (64px), `collapsed`, and mobile overlay `drawer` modes.

#### Scenario: Responsive drawer on mobile viewports
- **GIVEN** viewport width < 1024px
- **WHEN** mobile menu button is toggled
- **THEN** the sidebar SHALL slide in as an overlay drawer with glassmorphism backdrop
- **AND** automatically close upon selecting any navigation route.

---

## 4. Edge Cases Matrix

| Category | Edge Case | Expected Behavior |
|----------|-----------|-------------------|
| **Route Sync** | Direct URL entry or browser back/forward | Sidebar active state synchronizes immediately via Router event signals |
| **Tool Deregistration** | View unmounts and unregisters tools | Badge count decrements reactively to 0 without stale references |
| **Mobile Navigation** | Route selected inside mobile drawer | Drawer closes automatically and transitions backdrop smoothly |
| **Missing Tools** | View config specifies tools not yet registered | Badge displays `0/N` without throwing runtime errors |

