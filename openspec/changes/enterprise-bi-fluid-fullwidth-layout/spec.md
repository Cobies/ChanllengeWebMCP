# Specification: Enterprise BI Fluid Full-Width Layout & High-Density Display Optimization

**Change**: `enterprise-bi-fluid-fullwidth-layout`  
**Status**: Draft Specification  
**Target Architecture**: Angular 22 standalone, Tailwind CSS v4, WebMCP Angular Framework, Three.js WebGL  

---

## Purpose

Define the formal technical requirements, layout contracts, component behaviors, and validation scenarios for transitioning the application shell, header, footer, and Enterprise BI dashboard from fixed-width centered boxes (`max-w-7xl` / 1280px) to a responsive, fluid edge-to-edge architecture (`w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`) optimized for high-density monitors (1080p, 1440p, 4K, ultra-wide) while strictly preserving zero-margin full-bleed viewport routing for CAD / 3D Showroom.

---

## 1. Domain: Fluid Application Shell & Navigation (`fullbleed-cad-layout`)

### Requirement: Fluid Application Shell `<main>` Container

The application root shell in `src/app/app.html` MUST dynamically compute container classes based on route detection (`isFullBleedRoute()`), applying fluid full-width horizontal padding across all standard non-full-bleed dashboard views.

| Route Type | `isFullBleedRoute()` | `<main>` Container Classes | Layout Behavior |
|---|---|---|---|
| **CAD / 3D Showroom** | `true` | `flex-1 w-full h-full p-0 m-0 max-w-none flex flex-col min-h-0 overflow-hidden` | 100% viewport, zero margin/padding, no scrollbars |
| **Standard Dashboard** | `false` | `flex-1 w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 overflow-y-auto` | 100% fluid width, progressive responsive padding, vertical scroll |

#### Scenario: Standard dashboard fluid container rendering
- **GIVEN** the user navigates to `/enterprise-bi`, `/judge-guide`, or `/inspector`
- **WHEN** the application template renders
- **THEN** `isFullBleedRoute()` MUST evaluate to `false`
- **AND** `<main>` MUST apply `w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12` without any `max-w-7xl` or `mx-auto` constraint.

#### Scenario: Full-bleed showroom edge-to-edge isolation
- **GIVEN** the user navigates to `/3d-showroom`, `/`, or an empty route `""`
- **WHEN** the application template renders
- **THEN** `isFullBleedRoute()` MUST evaluate to `true`
- **AND** `<main>` MUST apply zero padding and zero margin (`p-0 m-0 max-w-none`) with no global footer rendered.

---

### Requirement: Fluid Navigation Header Container

The top navigation header in `src/app/components/header/header.component.ts` MUST replace its centered fixed-width inner container with fluid edge-to-edge padding matching the application shell.

#### Layout Specification
```html
<header class="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
  <div class="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <!-- Left Branding & Drawer Trigger -->
    <!-- Center Navigation Tabs -->
    <!-- Right Status Badges & Copilot Trigger -->
  </div>
</header>
```

#### Scenario: Header fluid layout on wide displays
- **GIVEN** a viewport width of 1920px (1080p) or 2560px (1440p)
- **WHEN** `HeaderComponent` renders
- **THEN** branding MUST align to the left edge with `px-8` / `xl:px-10` padding
- **AND** status badges and Copilot trigger MUST align to the right edge with `px-8` / `xl:px-10` padding
- **AND** the container MUST NOT be constrained to 1280px.

---

### Requirement: Fluid Global Footer Presentation

The global application footer in `src/app/app.html` MUST span 100% width and align its contents using the standardized progressive padding contract when visible on standard routes.

#### Layout Specification
```html
@if (!isFullBleedRoute()) {
  <footer class="border-t border-slate-200/80 bg-white/50 py-6 text-center text-xs text-slate-500 mt-auto shrink-0">
    <div class="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p class="text-slate-600">Built with Angular 22, Bun, Tailwind CSS v4, Three.js, and W3C WebMCP Standard.</p>
      <p class="font-mono text-[11px] text-slate-500">MIT Licensed • Open Source</p>
    </div>
  </footer>
}
```

#### Scenario: Footer alignment on standard routes
- **GIVEN** `isFullBleedRoute()` is `false`
- **WHEN** the footer renders
- **THEN** the inner container MUST apply `w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`
- **AND** align credits to the left and license info to the right matching the header boundary lines.

---

## 2. Domain: High-Density Enterprise BI Dashboard (`webmcp-enterprise-bi`)

### Requirement: 100% Viewport Elasticity & Hero Panel Scaling

The `EnterpriseBiComponent` (`src/app/components/enterprise-bi/enterprise-bi.component.ts`) root container and hero panel MUST expand to 100% of the available horizontal space without internal max-width restrictions.

#### Component Layout Rules
1. **Root Container**: MUST apply `space-y-6 w-full` with no horizontal overflow clipping on parent wrappers.
2. **Hero Header**: MUST scale seamlessly across all display widths, positioning the headline on the left and live aggregation stat cards (`Total Volume`, `Inventory Valuation`) on the right.
3. **Action Feedback Banner**: MUST stretch 100% width across the top of the dashboard when WebMCP tool executions report feedback.

#### Scenario: Hero panel scaling across display widths
- **GIVEN** the Enterprise BI view is active
- **WHEN** the viewport width scales from 1280px to 3840px (4K)
- **THEN** the hero panel background glow and content boundaries MUST fluidly fill the available width
- **AND** maintain proportional typographic hierarchy without layout breakage.

---

### Requirement: High-Density Responsive Metric & Scorecard Grids

Metric cards across all Enterprise BI tabs MUST utilize responsive CSS grid classes that scale density on ultra-wide viewports up to 4 columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4`).

#### Grid Specifications Matrix
| View / Tab | Element | Grid Breakpoints | Density Target |
|---|---|---|---|
| **Analytics** | Top KPI Metric Cards | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` | 4 metric cards filling full row |
| **Analytics** | Timeline & Dept Breakdown | `grid-cols-1 lg:grid-cols-12 gap-6` (7 cols / 5 cols) | Balanced 58% / 42% visual weight |
| **Inventory** | Domain Scorecards | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` | 4 domain scorecards filling full row |
| **Transactions / Inventory** | Audit Logs & PO Receipts | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3` | 4 cards per row on 2xl displays |

#### Scenario: 4-column KPI grid scaling
- **GIVEN** `activeTab()` is `'analytics'` or `'inventory'`
- **WHEN** rendered on an ultra-wide display (>= 1536px)
- **THEN** all 4 KPI cards / domain scorecards MUST expand horizontally to equally distribute 100% of the row width
- **AND** mini sparkline charts MUST stretch horizontally to match the expanded card width.

---

### Requirement: Dense Fluid Data Tables with Zero Truncation

The transaction table (`activeTab === 'transactions'`) and inventory catalog table (`activeTab === 'inventory'`) MUST occupy 100% container width with horizontal scroll safety (`overflow-x-auto`) and dense data padding (`py-2.5 px-4`).

#### Table Layout Contract
1. **Container**: `overflow-x-auto rounded-xl border border-slate-200/80 bg-white/60 shadow-xs w-full`
2. **Table Element**: `w-full text-left text-xs`
3. **Column Distribution**:
   - Primary Identifiers (ID / SKU): `font-mono font-bold text-cyan-700`
   - Numeric Metrics (Amount / Latency / Price): `font-mono text-right`
   - Progress Indicators (Stock level bar): `min-w-44`
   - Status Badges: `text-center` with full pill backgrounds
4. **Zero Unintended Truncation**: Text cells MUST display full operational descriptions and service names without artificial CSS clipping or ellipsis unless explicitly defined for long hashes.

#### Scenario: Transaction table rendering on high-resolution monitor
- **GIVEN** `activeTab()` is `'transactions'` on a 2560px wide display
- **WHEN** 25 transaction rows are rendered
- **THEN** the table MUST fill the entire 2560px layout area
- **AND** columns MUST evenly expand with readable spacing between ID, Timestamp, Department, Service, Amount, Latency, Status, and Anomaly Index.

---

### Requirement: Fluid SVG Vector Chart Scaling with Aspect Ratio Preservation

Interactive vector charts in `EnterpriseBiComponent` MUST scale horizontally to fill 100% of their parent card width without distortion by setting `preserveAspectRatio="none"` on dynamic curves and sparklines.

#### SVG Specifications
1. **Latency & Throughput Timeline**:
   - `viewBox="0 0 500 150"`
   - `preserveAspectRatio="none"`
   - `class="w-full h-44 overflow-visible"`
   - Gridlines and threshold marker at `y=45` (SLA Limit 50ms) spanning `x1="0"` to `x2="500"`.
2. **Metric Mini Sparklines**:
   - `viewBox="0 0 100 24"`
   - `preserveAspectRatio="none"`
   - `class="w-full h-full overflow-visible"`
   - Area fill gradient with cubic bezier smoothing.

#### Scenario: Vector timeline chart resize
- **GIVEN** `activeTab()` is `'analytics'`
- **WHEN** the browser window is resized from 1024px to 3440px (ultra-wide)
- **THEN** the SVG timeline chart MUST smoothly expand its horizontal width to 100% of the 7-column grid cell
- **AND** maintain crisp vector strokes, gradient fill, and correctly aligned X-axis timestamps.

---

## 3. Layout Scenarios & Responsive Breakpoint Validation

### 3.1 Breakpoint Padding Matrix

| Breakpoint | Viewport Width | Shell & Header Padding (`px`) | Main Container Width |
|---|---|---|---|
| **Mobile (`< 640px`)** | `< 640px` | `px-4` (16px) | `w-full` (100%) |
| **Tablet (`sm`)** | `640px - 767px` | `sm:px-6` (24px) | `w-full` (100%) |
| **Laptop (`md` / `lg`)** | `768px - 1279px` | `lg:px-8` (32px) | `w-full` (100%) |
| **Desktop (`xl`)** | `1280px - 1535px` | `xl:px-10` (40px) | `w-full` (100%) |
| **Ultra-Wide / 4K (`2xl`)** | `≥ 1536px` | `2xl:px-12` (48px) | `w-full` (100%) |

---

### 3.2 Automated Test & Validation Scenarios

#### Scenario: Route layout class contract verification in unit tests
- **GIVEN** `App` component is instantiated in `src/app/app.spec.ts`
- **WHEN** route is `/enterprise-bi`
- **THEN** `isFullBleedRoute()` MUST return `false`
- **AND** the shell container class string MUST include `w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`.

#### Scenario: Full-bleed CAD route protection verification
- **GIVEN** `App` component is instantiated in `src/app/app.spec.ts`
- **WHEN** route is `/3d-showroom` or `/`
- **THEN** `isFullBleedRoute()` MUST return `true`
- **AND** the shell container class string MUST include `w-full h-full p-0 m-0 max-w-none`.

#### Scenario: Mobile drawer navigation compatibility
- **GIVEN** viewport is `< 1024px`
- **WHEN** mobile drawer trigger button is clicked in header
- **THEN** `SidebarModuleRegistryService.toggleMobileDrawer()` MUST be triggered
- **AND** the fluid container padding MUST NOT cause horizontal viewport scrollbars.
