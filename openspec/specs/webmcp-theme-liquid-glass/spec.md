# Specification: Light Liquid-Glass Theme & Warm Matte Visual Identity

## Purpose
Define the visual design tokens, liquid-glass frosted utilities, Three.js 3D atmospheric parameters, component styling requirements, and verification criteria for the WebMCP light liquid-glass theme.

## Requirements & Scenarios

### Requirement: REQ-01 Warm Matte Cream Base Palette
The showcase application MUST use a warm matte cream foundation (#f6f4ee / #f7f5f0) with high-contrast slate-800 typography.

#### Scenario: Base canvas rendering
- **GIVEN** the showcase application loads
- **WHEN** the body and root container render
- **THEN** background is `#f6f4ee` and typography defaults to `text-slate-800`.

### Requirement: REQ-02 Liquid-Glass Specular Utility Classes
The stylesheet MUST provide `.glass-panel` and `.glass-panel-glow` frosted glass utilities with backdrop filter blur, specular top-edge highlights, and translucent borders.

#### Scenario: Frosted specular relief
- **GIVEN** an element with class `.glass-panel`
- **WHEN** rendered on top of the warm cream background
- **THEN** it displays multi-layered backdrop blur, semi-transparent white surface (`rgba(255, 255, 255, 0.75)`), and 1px translucent border (`rgba(255, 255, 255, 0.8)`).

### Requirement: REQ-03 Frosted Sticky Header Navigation
The top navigation header MUST render with a translucent glassmorphic backdrop, ocean blue active pills, and route-aware simulation action bars.

#### Scenario: Header navigation styling
- **GIVEN** the sticky navbar
- **WHEN** navigating between routes
- **THEN** active route tabs highlight with cyan/ocean blue pills and simulation triggers adapt to active route.

### Requirement: REQ-04 Three.js 3D Warm Environment
The 3D WebGL viewport MUST initialize with warm cream scene background (`#f4f0e6`), matching linear fog (`#f4f0e6`), two-tone grid helper (`#0284c7` / `#d6cfc2`), and tuned ambient lighting.

#### Scenario: Three.js warm scene setup
- **GIVEN** the 3D visualizer initializes
- **WHEN** Three.js Scene, Fog, and GridHelper are instantiated
- **THEN** background color is set to `0xf4f0e6` and fog blends seamlessly with the viewport background.

### Requirement: REQ-05 High-Contrast Customizer Form
The vehicle customizer form MUST present translucent glass cards with high-contrast slate typography, vibrant color swatches, and active state pills.

#### Scenario: Customizer form interactions
- **GIVEN** the customizer form
- **WHEN** selecting vehicle color, powertrain, or aero modes
- **THEN** options update reactively with clear active indicator outlines and high-contrast labels.

### Requirement: REQ-06 Translucent Inspector Log Viewer
The live WebMCP tool execution log MUST display white translucent invocation cards with high-contrast parameter blocks, emerald success cards, and rose error cards.

#### Scenario: Real-time tool log display
- **GIVEN** a WebMCP tool execution
- **WHEN** log entries are captured by the inspector
- **THEN** payload cards display sanitized base64 previews, latency badges, and emerald status badges.

### Requirement: REQ-07 Floating Alabaster AI Copilot Drawer
The Copilot AI drawer MUST render in liquid glass alabaster (`#fbf9f5`), cyan-600 user message bubbles, clean white assistant response cards, and quick prompt chips.

#### Scenario: Copilot drawer interaction
- **GIVEN** the floating Copilot trigger is clicked
- **WHEN** the slide-over drawer opens
- **THEN** the drawer renders with `#fbf9f5` background, quick prompt chips, and markdown-formatted agent messages.

### Requirement: REQ-08 Light Liquid-Glass Enterprise BI Dashboard
The Enterprise BI view MUST provide KPI cards with ocean blue (`#0284c7`) sparklines, 24h interactive SVG latency curve with SLA line, department breakdown bars, and tabular transaction log.

#### Scenario: BI dashboard data visualization
- **GIVEN** the Enterprise BI route is active
- **WHEN** KPI metrics and transactions are displayed
- **THEN** KPI cards render sparklines, latency chart displays SVG polyline with SLA threshold, and transaction table supports status filtering.

### Requirement: REQ-09 Liquid-Glass Judge Guide
The Devpost judge guide MUST render comprehensive rubrics, architecture diagrams, and testing steps inside liquid-glass tabbed cards.

#### Scenario: Judge guide rubric navigation
- **GIVEN** the judge guide route is active
- **WHEN** switching between rubric tabs
- **THEN** structured evaluator criteria and architecture cards display with liquid-glass styling.

### Requirement: REQ-10 Zero-Warning Production Build Integrity
The workspace MUST pass all 67 unit tests and produce valid Angular partial compilation and application bundles.

#### Scenario: Test suite and build execution
- **GIVEN** the workspace codebase
- **WHEN** running `bun test` and `bun run build`
- **THEN** 67/67 unit tests pass and build exits with status 0.
