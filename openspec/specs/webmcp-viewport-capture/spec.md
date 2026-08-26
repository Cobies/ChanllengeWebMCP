# WebMCP Viewport Capture Specification

## Purpose
Provides multimodal visual perception capabilities for WebMCP agents via canvas and DOM rasterization.

## Requirements

### Requirement: `take_screenshot` Tool
The system MUST provide a `take_screenshot` tool returning base64 encoded images of the active viewport, DOM selectors, or WebGL canvases.

#### Scenario: Element screenshot capture
- **GIVEN** an element with selector `#product-3d-canvas`
- **WHEN** `take_screenshot({ selector: "#product-3d-canvas" })` is executed
- **THEN** returns base64 image data URL and dimensions
- **AND** `success` is `true`.

#### Scenario: Missing selector error recovery
- **GIVEN** a non-existent selector
- **WHEN** `take_screenshot` is executed
- **THEN** returns `{ success: false, error: "Element matching selector was not found" }`.
