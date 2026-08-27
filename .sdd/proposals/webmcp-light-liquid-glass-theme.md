# Proposal: Light Liquid-Glass Theme & Warm Matte Visual Identity

## Intent
Transform the WebMCP showcase application and digital twin experience from a dark cyberpunk palette to an ultra-refined, modern light liquid-glass aesthetic with warm matte cream foundation (#f6f4ee / #f7f5f0), multi-layered specular relief, high-contrast slate typography, and ocean blue accents.

## Scope
### In Scope
- **Warm Matte Cream Palette**: Body background (#f6f4ee), surface cards (rgba(255, 255, 255, 0.75)), slate-800 primary typography, slate-500 metadata.
- **Liquid-Glass Specular Styling**: Frosted glass utility classes (`.glass-panel`, `.glass-panel-glow`, `.glass-relief`) with backdrop blur, specular highlights, and crisp translucent borders.
- **Three.js Warm Atmosphere**: Warm scene background (#f4f0e6), matching depth fog, ocean blue & beige grid helper, tuned ambient/directional lighting.
- **Translucent UI Components**: Sticky glassmorphic header, high-contrast customizer form swatches, white translucent inspector logs, alabaster Copilot AI drawer (#fbf9f5), Enterprise BI dashboard with ocean blue sparklines & interactive SVG latency curve, and liquid-glass judge guide.
- **Zero Regressions & Clean Build**: 100% test coverage (67/67 tests passing) and Ivy partial compilation for `@webmcp/angular` and application build.

### Out of Scope
- Architectural changes to `@webmcp/angular` core library.
- Breaking modifications to existing WebMCP tool contracts.

## Capabilities
### Modified Capabilities
- `webmcp-showcase-app`: Complete theme overhaul to light liquid-glass aesthetic across all routed views and 3D visualizer.

## Success Criteria
- [ ] Root styling and all 10 showcase components render with warm matte cream & liquid-glass styling.
- [ ] Three.js 3D canvas integrates seamlessly with warm cream scene lighting and matching fog.
- [ ] All 67 unit tests across 10 test suites pass cleanly with zero errors.
- [ ] Production build passes with 0 warnings/errors.
