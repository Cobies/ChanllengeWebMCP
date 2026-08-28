# Proposal: Modular WebMCP Sidebar Navigation Hub

## Intent

Establish an extensible Sidebar Workspace Navigation Hub as the primary view switcher across WebMCP domains (3D Digital Twin, Enterprise BI, Judge Guide, Inspector, Copilot) with active route tracking, tool badges, and docking controls, while keeping domain-specific interactive controls inside their respective main view areas.

## Scope

### In Scope
- Config-driven view navigation registry (`SidebarModuleRegistryService` / `provideSidebarViews`) supporting pluggable workspace routes.
- Standalone `SidebarComponent` listing 5 primary views: 3D Digital Twin Showroom, Enterprise BI Analytics, Judge & Evaluation Guide, WebMCP Inspector, and Copilot Assistant.
- Active route highlighting, tool count badges per view (from `WebMcpService`), and global WebMCP status.
- Responsive docking modes: expanded, compact icon-rail, and mobile drawer.
- Clean encapsulation: domain tools, interactive controls, and visualizers remain strictly in Main View Content.

### Out of Scope
- Hosting domain-specific controls/buttons inside sidebar accordions.
- Core `@webmcp/angular` protocol engine modifications.
- Multi-window or detached popup windows.

## Capabilities

### New Capabilities
- `webmcp-modular-sidebar`: Extensible, config-driven sidebar workspace navigation hub with reactive tool count badges, docking modes, and global WebMCP status.

### Modified Capabilities
- `webmcp-showcase-app`: Shell layout integration with sidebar navigation hub and routed main viewports.

## Approach

- Define `SidebarViewConfig` with route paths, icons, titles, and associated tool keys.
- Refactor `SidebarModuleRegistryService` to manage view routes and compute tool counts from `WebMcpService`.
- Refactor `SidebarComponent` to render clean navigation links, tool count badges, and docking toggles without inline domain controls.
- Maintain domain controls exclusively within `ShowroomComponent`, `EnterpriseBiComponent`, `JudgeGuideComponent`, and `InspectorComponent`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/models/sidebar.models.ts` | Modified | Streamline interfaces for view routes, tool badges, and docking |
| `src/app/services/sidebar-module-registry.service.ts` | Modified | Manage workspace view registration and reactive tool counting |
| `src/app/config/sidebar-modules.config.ts` | Modified | Configure 5 workspace navigation views without inline domain actions |
| `src/app/components/sidebar/sidebar.component.ts` | Modified | Render route links, tool badges, docking modes, and status |
| `src/app/app.routes.ts` | Modified | Ensure all registered workspace views have valid route paths |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mobile screen space | Medium | Collapsible drawer with overlay backdrop below `lg` breakpoint |
| Route sync lag | Low | React directly to Angular `Router` active URL signals |
| View config errors | Low | Strict TypeScript interfaces and fallback routes |

## Rollback Plan

Revert changes to `src/app/components/sidebar/`, `src/app/services/sidebar-module-registry.service.ts`, `src/app/models/sidebar.models.ts`, and `src/app/config/sidebar-modules.config.ts` via `git checkout`.

## Dependencies

- `@webmcp/angular` v1.0.0
- Angular 22 (`@angular/core`, `@angular/common`, `@angular/router`)
- Tailwind CSS v4

## Success Criteria

- [ ] Sidebar renders 5 workspace views as navigation routes with active route highlight.
- [ ] Tool count badges reflect active tools registered for each view via `WebMcpService`.
- [ ] Domain-specific controls stay strictly inside Main View Content areas.
- [ ] Docking modes (expanded, compact rail, mobile drawer) transition smoothly.
- [ ] View registry allows adding new workspace routes with simple configuration providers.
