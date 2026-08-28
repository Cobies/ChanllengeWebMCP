# Specification: View-Isolated WebMCP Tools & AI View Navigation

**Change**: `view-isolated-tools-and-ai-navigation`  
**Status**: Approved Specification  
**Target Architecture**: Angular 22, Bun Runtime, `@webmcp/angular`, `@angular/router`, CPAMC Copilot Bridge (`gemini-3.7-flash-high`)

---

## 1. Domain: Global AI View Navigation Tool (`webmcp-ai-navigation`)

### Requirement: Global `navigate_to_view` WebMCP Tool Contract
The application MUST register a global WebMCP tool named `navigate_to_view` at application bootstrap that allows AI agents to programmatically inspect and switch active Angular workspace views via `Router.navigateByUrl`.

#### Tool Schema Definition
```json
{
  "name": "navigate_to_view",
  "description": "Navigates the application to a specific workspace view or route, switching the active UI context and mounting view-specific WebMCP tools.",
  "parameters": {
    "type": "object",
    "properties": {
      "targetView": {
        "type": "string",
        "enum": ["3d-showroom", "enterprise-bi", "inspector", "judge-guide"],
        "description": "Target workspace view identifier or route path to navigate to"
      },
      "reason": {
        "type": "string",
        "description": "Clear explanation of why navigation is required to fulfill the user's intent"
      }
    },
    "required": ["targetView", "reason"],
    "additionalProperties": false
  }
}
```

#### Return Type Contract (`NavigateToViewResult`)
```typescript
export interface NavigateToViewResult {
  success: boolean;
  targetView: string;
  route: string;
  previousRoute: string;
  toolsAvailable: string[];
  message: string;
}
```

#### Scenario: AI autonomous navigation to Enterprise BI
- **GIVEN** the application is currently on `/3d-showroom`
- **WHEN** the AI agent executes `navigate_to_view` with `{ "targetView": "enterprise-bi", "reason": "Query Q3 financial metrics" }`
- **THEN** the tool MUST call `Router.navigateByUrl('/enterprise-bi')`
- **AND** return `success: true` with `targetView: "enterprise-bi"`, `route: "/enterprise-bi"`, and `toolsAvailable` containing the registered enterprise tools.

#### Scenario: Navigation error on unknown target view
- **GIVEN** the `navigate_to_view` tool is active
- **WHEN** the agent provides an unregistered `targetView: "unknown-view"`
- **THEN** the tool MUST NOT throw an unhandled exception
- **AND** return `success: false` with a descriptive error message listing valid workspace views.

---

## 2. Domain: Dynamic Contextual System Prompt (`copilot-dynamic-system-prompt`)

### Requirement: Dynamic Contextual System Prompt Construction
The `CopilotBridgeService` MUST dynamically construct and prepend a `system` message before dispatching chat completion requests to the CPAMC Bridge Proxy (`gemini-3.7-flash-high`), injecting active view metadata, registered WebMCP tools, available views catalog, and cross-view navigation directives.

#### Dynamic Prompt Variables Matrix
| Variable | Source | Injected Format |
|----------|--------|-----------------|
| `currentView` | `SidebarModuleRegistryService.activeView()` | View ID, title, and active route path |
| `activeTools` | `WebMcpService.getTools()` | Array of currently callable tool names |
| `availableViewsCatalog` | `SidebarModuleRegistryService.views()` | Structured Markdown table with view IDs, routes, descriptions, and scoped tools |
| `crossViewRules` | Static System Directives | Mandatory instructions to invoke `navigate_to_view` when cross-view tools are needed |

#### System Prompt Template Specification
```markdown
You are Gemini 3.7 Copilot, an autonomous multimodal AI assistant embedded in the WebMCP Angular Showcase.

### CURRENT WORKSPACE CONTEXT:
- Active View: {{currentView.title}} (ID: {{currentView.id}}, Route: {{currentView.route}})
- Currently Available WebMCP Tools: {{activeToolsList}}

### AVAILABLE WORKSPACE VIEWS CATALOG:
| View ID | Title | Route | Description | View-Scoped Tools |
|---------|-------|-------|-------------|-------------------|
{{#each availableViews}}
| {{id}} | {{title}} | {{route}} | {{description}} | {{tools}} |
{{/each}}

### OPERATIONAL DIRECTIVES:
1. You can directly execute ANY tool listed under 'Currently Available WebMCP Tools'.
2. CRITICAL - CROSS-VIEW ACTIONS: If the user requests an action, analysis, or query that requires tools belonging to ANOTHER workspace view (not currently mounted), you MUST FIRST call the `navigate_to_view` tool with the appropriate `targetView` and explanation `reason`.
3. Once navigated, the system will mount that view's tools for subsequent execution turns.
```

#### Scenario: Dynamic prompt generation with active view context
- **GIVEN** the user is on route `/enterprise-bi` with 4 enterprise tools and 1 global tool active
- **WHEN** `CopilotBridgeService.sendMessage(...)` initiates a chat completion request
- **THEN** `messages[0]` MUST have `role: 'system'`
- **AND** the content MUST explicitly identify `/enterprise-bi` as the active view and list only active tools.

#### Scenario: Cross-view directive guidance when 3D tool requested from BI view
- **GIVEN** the user is on `/enterprise-bi`
- **WHEN** the user asks: "Rotate the 3D car by 90 degrees and take a screenshot"
- **THEN** the LLM system prompt MUST instruct the model to execute `navigate_to_view({ targetView: "3d-showroom", reason: "Access 3D scene visualizer" })` first.

---

## 3. Domain: Router Navigation Synchronization (`webmcp-router-sync`)

### Requirement: Reactive Route & Active View Synchronization
The `SidebarModuleRegistryService` MUST subscribe to Angular `Router.events` filtered by `NavigationEnd` (using `takeUntilDestroyed`) to maintain synchronized reactive signals for `activeRoute` and `activeView`.

#### Service State & Signals Contract
```typescript
@Injectable({ providedIn: 'root' })
export class SidebarModuleRegistryService {
  // Readonly Signals
  readonly activeRoute: Signal<string>;
  readonly activeView: Signal<SidebarViewConfig | undefined>;
  readonly views: Signal<SidebarViewConfig[]>;
  readonly viewToolCountsMap: Signal<Map<string, { active: number; total: number }>>;

  // Route Synchronization Methods
  setActiveRoute(route: string): void;
  getViewByRoute(route: string): SidebarViewConfig | undefined;
}
```

#### Route Matching Resolution Rules
1. Match normalized URL path (stripping query parameters and trailing slashes) against `view.route`.
2. If URL is `'/'` or empty, resolve to default view (`'view-3d-showroom'`).
3. Update `_activeRoute` signal with normalized path (e.g. `'/enterprise-bi'`).
4. Compute `activeView` signal matching the corresponding `SidebarViewConfig`.

#### Scenario: Automatic signal update on NavigationEnd event
- **GIVEN** `SidebarModuleRegistryService` is initialized
- **WHEN** the router emits a `NavigationEnd` event for URL `'/enterprise-bi'`
- **THEN** `activeRoute()` MUST equal `'/enterprise-bi'`
- **AND** `activeView()` MUST resolve to the `view-enterprise-bi` configuration object.

---

## 4. Domain: View-Adaptive Prompt Suggestion Chips (`context-prompt-chips`)

### Requirement: Context-Adaptive Prompt Chips in Copilot Drawer
`CopilotChatComponent` MUST expose view-adaptive Quick Action prompt chips computed reactively from `SidebarModuleRegistryService.activeView()`, providing relevant one-click prompt templates for the current workspace.

#### Prompt Chips Catalog Matrix by View
| View ID | Route | Chip Label | Icon | Prompt Text |
|---------|-------|------------|------|-------------|
| `view-3d-showroom` | `/3d-showroom` | 🏛️ Modern Pavilion | 🏛️ | `"Draw an 8m x 6m floor slab, push-pull 3.2m glass walls, and add 4 marble columns."` |
| `view-3d-showroom` | `/3d-showroom` | 🏎️ Orbit 90° & Cyan | 🏎️ | `"Orbit camera 90 degrees and set vehicle paint to Neon Cyan (#00f0ff)."` |
| `view-3d-showroom` | `/3d-showroom` | 📸 Take 3D Snapshot | 📸 | `"Take a high-resolution screenshot of the 3D car viewport and describe it."` |
| `view-3d-showroom` | `/3d-showroom` | 📐 Measure Clearances | 📐 | `"Measure the total floor area and bounding box of all objects in the scene."` |
| `view-enterprise-bi` | `/enterprise-bi` | 📊 Q3 Telemetry | 📊 | `"Query enterprise metrics for Finance and Operations over the last 24 hours."` |
| `view-enterprise-bi` | `/enterprise-bi` | 🚩 Flagged Audit | 🚩 | `"Filter business data for flagged transactions with amount > 500."` |
| `view-enterprise-bi` | `/enterprise-bi` | 📈 Executive KPI | 📈 | `"Calculate executive KPI summary across revenue, latency, and anomaly index."` |
| `view-enterprise-bi` | `/enterprise-bi` | 📦 Reorder Stock | 📦 | `"Reorder inventory SKU-AUTO-901 with quantity 25 and critical priority."` |
| `view-judge-guide` | `/judge-guide` | 🏆 Devpost Audit | 🏆 | `"Evaluate WebMCP architectural compliance and run all autonomous verification tests."` |
| `view-inspector` | `/inspector` | 🔍 Tool Telemetry | 🔍 | `"Inspect live WebMCP tool invocation logs and analyze round-trip latencies."` |

#### Scenario: Prompt chips adapt on route transition
- **GIVEN** the Copilot drawer is open displaying 3D Showroom prompt chips
- **WHEN** the application navigates to `/enterprise-bi`
- **THEN** `CopilotChatComponent.promptChips()` MUST immediately update to display Enterprise BI chips
- **AND** clicking a prompt chip MUST submit that prompt into the active BI context.

---

## 5. Domain: Route-Scoped Dynamic Tool Lifecycle (`webmcp-tool-lifecycle`)

### Requirement: Strict View Tool Isolation
Views MUST register their specific WebMCP tools during component initialization (`ngOnInit`) and unregister them during teardown (`ngOnDestroy`). Global tools (`navigate_to_view`) SHALL remain registered across all routes.

#### Tool Lifecycle Distribution
| Scope | Registration Point | Tools Included | Cleanup Point |
|-------|-------------------|----------------|---------------|
| **Global** | App Bootstrap (`appConfig` / Provider) | `navigate_to_view` | Application Shutdown |
| **Showroom / 3D** | `ShowroomComponent` / `Visualizer3dComponent` | `studio_create_object`, `studio_transform_object`, `studio_update_material`, `cad_push_pull`, `cad_place_component`, `cad_apply_material`, `cad_measure`, `scene_3d_action`, `take_screenshot` | `ngOnDestroy` |
| **Enterprise BI** | `EnterpriseBiComponent` | `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export`, `query_inventory`, `update_inventory_stock`, `reorder_inventory_item`, `filter_inventory_by_domain`, `get_business_domain_summary` | `ngOnDestroy` |
| **Judge Guide** | `JudgeGuideComponent` | None (Read-only view) | N/A |

#### Scenario: Tool isolation upon route transition
- **GIVEN** user is on `/3d-showroom` with 3D tools and `navigate_to_view` registered
- **WHEN** user or AI navigates to `/enterprise-bi`
- **THEN** all 3D tools MUST be unregistered from `WebMcpService`
- **AND** all 9 Enterprise BI tools MUST be registered
- **AND** `navigate_to_view` MUST remain registered
- **AND** `CopilotBridgeService.getOpenAiTools()` MUST contain exactly 10 tools (9 enterprise + 1 global).

---

## 6. Test Suite & Verification Matrix (TDD)

| Test Target | Test Case / Scenario | Expected Verification |
|-------------|----------------------|-----------------------|
| `navigate_to_view` | Valid view navigation | `Router.navigateByUrl` called with target route, returns success |
| `navigate_to_view` | Invalid view navigation | Returns `success: false` with validation message, does not crash |
| `CopilotBridgeService` | Dynamic System Prompt | Contains active view, available views table, and cross-view rules |
| `SidebarModuleRegistryService` | `NavigationEnd` Sync | `activeRoute()` and `activeView()` signals update on route events |
| `CopilotChatComponent` | Reactive Prompt Chips | Computed signal reflects active route prompt chips |
| Lifecycle Isolation | View unmount/mount | Inactive tools are unregistered; active tools match view scope |

---

## 7. Next Recommended Phase
Ready for technical architecture and design: `sdd-design`.
