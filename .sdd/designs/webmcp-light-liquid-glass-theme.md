# Design: Light Liquid-Glass Theme & Warm Matte Visual Identity

## Overview
This design specifies the architectural styling approach for the light liquid-glass theme in the WebMCP Angular showcase application, replacing dark cyberpunk aesthetics with a bright, warm matte cream foundation and translucent frosted glass specular relief.

## Design Decisions

### 1. Color Palette & Tokens
- **Background Root**: `#f6f4ee` (warm matte cream)
- **Background Surface / Cards**: `rgba(255, 255, 255, 0.75)` with `backdrop-filter: blur(16px)`
- **Drawer Background**: `#fbf9f5` (alabaster glass)
- **Typography Primary**: `text-slate-800` (`#1e293b`) / `text-slate-900` (`#0f172a`)
- **Typography Muted**: `text-slate-500` (`#64748b`) / `text-slate-600` (`#475569`)
- **Primary Accent / Interactive**: Ocean Blue `#0284c7` / Cyan-600 `#0891b2`
- **Success / Badge**: Emerald-600 `#059669` / Emerald-50 `#ecfdf5`
- **Error / Badge**: Rose-600 `#e11d48` / Rose-50 `#fff1f2`

### 2. Frosted Specular Glass Layers (`styles.css`)
- `.glass-panel`: `background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);`
- `.glass-panel-glow`: Adds top-edge specular relief line `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 10px 30px -10px rgba(0, 0, 0, 0.05);`

### 3. Three.js 3D Viewport Adaptation (`visualizer-3d.component.ts`)
- **Scene Background**: `scene.background = new THREE.Color(0xf4f0e6)`
- **Fog**: `scene.fog = new THREE.Fog(0xf4f0e6, 8, 25)`
- **Grid Helper**: `new THREE.GridHelper(20, 20, 0x0284c7, 0xd6cfc2)`
- **Lighting**: Ambient light set to `0xffffff` intensity `1.2`, Directional light `0xfffaed` intensity `1.8`

### 4. Component Structure
- `app.component.html`: Container set to `bg-[#f6f4ee] text-slate-800`.
- `header.component.ts`: Translucent white glass navbar with slate branding and ocean blue active pills.
- `customizer-form.component.ts`: Translucent glass cards with slate text and clear color swatches.
- `inspector.component.ts`: White translucent tool log cards with emerald/rose execution badges.
- `copilot-chat.component.ts`: Slide-over drawer in `#fbf9f5` with cyan bubbles and sanitized previews.
- `enterprise-bi.component.ts`: KPI cards with ocean blue mini sparklines, 24h interactive SVG latency curve, and data table.
- `judge-guide.component.ts`: Liquid-glass rubric tabs with structured evaluation criteria.
