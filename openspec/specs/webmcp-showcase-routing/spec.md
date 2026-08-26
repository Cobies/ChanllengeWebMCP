# WebMCP Showcase Routing Specification

## Purpose
Multi-route declarative Angular routing hierarchy and Cyber Glow navigation with route-aware prompt chips.

## Requirements

### Requirement: Multi-Route Declarative Routing Hierarchy
The system MUST provide declarative Angular route configurations in `projects/showcase/src/app/app.routes.ts` mapping navigation paths to dedicated standalone view components, configured with route redirect defaults, wildcard fallbacks, and page title metadata.

#### Route Table Specification
| Path | Target Component | Title / Metadata | Behavior |
|------|------------------|-------------------|----------|
| `''` | Redirect (`/3d-showroom`) | N/A | `pathMatch: 'full'`, redirects to primary 3D visualizer |
| `'3d-showroom'` | `Showroom3dComponent` | `'3D Digital Twin Showroom | WebMCP Angular'` | Mounts Three.js WebGL viewport, customizer form, and screenshot tools |
| `'enterprise-bi'` | `EnterpriseBiComponent` | `'Enterprise BI Dashboard | WebMCP Angular'` | Mounts enterprise telemetry, KPI trend charts, data tables, and BI tools |
| `'judge-guide'` | `JudgeGuideComponent` | `'Devpost Judge Guide & Rubric | WebMCP Angular'` | Mounts interactive evaluation rubric, architecture deep-dive, and prompt harness |
| `'**'` | Redirect (`/3d-showroom`) | N/A | Wildcard fallback redirecting unknown URLs to 3D showroom |

#### Scenario: Default URL navigation redirects to 3D showroom
- **GIVEN** an application loaded at base URL `/`
- **WHEN** the Angular Router initializes
- **THEN** it MUST automatically redirect the user to `/3d-showroom`
- **AND** render `Showroom3dComponent` inside `<router-outlet>`.

#### Scenario: Direct deep-link navigation to Enterprise BI
- **GIVEN** a browser navigating directly to `/enterprise-bi`
- **WHEN** the route resolution finishes
- **THEN** the application MUST render `EnterpriseBiComponent`
- **AND** update the document title to `'Enterprise BI Dashboard | WebMCP Angular'`.

#### Scenario: Wildcard fallback on unknown route
- **GIVEN** a user or agent navigates to `/unknown-path/telemetry`
- **WHEN** router pattern matching fails
- **THEN** the router MUST trigger the wildcard route `**`
- **AND** redirect to `/3d-showroom`.

---

### Requirement: Cyber Glow Header Navigation & Context-Aware Prompt Chips
The `HeaderComponent` MUST display active navigation tabs with cyber glow visual styling (`bg-cyan-500/10 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20`) using `routerLink` and `routerLinkActive`, and SHALL display context-aware Quick Prompt chips corresponding to the active route.

#### Context-Aware Prompt Chips Matrix
| Route | Chip Label | Dispatched Copilot Prompt |
|-------|------------|---------------------------|
| `/3d-showroom` | 🔄 Orbit 45° | `"Rotate 3D model camera by 45 degrees around Y axis"` |
| `/3d-showroom` | 🎨 Neon Cyan | `"Update vehicle paint color to #00f0ff and rims to titanium"` |
| `/3d-showroom` | 📸 Screenshot | `"Take a high-resolution screenshot of the 3D canvas and verify"` |
| `/3d-showroom` | 📝 Auto-Fill | `"Configure customizer form: Cyber Cruiser, Carbon, Sport Aero, Submit"` |
| `/enterprise-bi` | 📊 Q3 Metrics | `"Query enterprise metrics for Finance and Operations over 24h"` |
| `/enterprise-bi` | 🚩 Flagged Audit | `"Filter business data for flagged transactions with amount > 500"` |
| `/enterprise-bi` | 📈 KPI Summary | `"Calculate executive KPI summary across revenue, latency, and anomalies"` |
| `/enterprise-bi` | 📥 Export PDF | `"Generate compliance audit analytics export in PDF format"` |
| `/judge-guide` | 🏆 Devpost Audit | `"Review WebMCP architectural compliance and run all autonomous tests"` |

#### Scenario: Active route tab highlight
- **GIVEN** the current URL is `/enterprise-bi`
- **WHEN** the header renders
- **THEN** the "Enterprise BI" tab MUST have the active cyber glow CSS classes
- **AND** the Quick Prompt bar MUST display the 4 enterprise telemetry prompt chips.
