/*
 * Public API Surface of @webmcp/angular (ngx-webmcp)
 */

// Core Services & Provider
export * from './lib/core/webmcp.types';
export * from './lib/core/webmcp.service';
export * from './lib/core/webmcp.provider';
export * from './lib/core/webmcp.emulator';
export * from './lib/core/schema-generator';

// Declarative Directives & Helpers
export * from './lib/directives/webmcp-tool.directive';
export * from './lib/directives/webmcp-action.directive';
export * from './lib/directives/webmcp-signal';

// Multimodal Capture
export * from './lib/multimodal/viewport-capture.service';
export * from './lib/multimodal/canvas-rasterizer';
export { WebmcpViewportCaptureService as WebMcpViewportCaptureService } from './lib/multimodal/viewport-capture.service';

// 3D Scene Controller
export * from './lib/three/three-scene-bridge';
export * from './lib/three/scene-action-bus';
export * from './lib/three/camera-interpolator';
export { WebmcpThreeSceneBridge as WebMcpThreeSceneBridge } from './lib/three/three-scene-bridge';

// Form Automation
export * from './lib/forms/form-runner.service';
export * from './lib/forms/form-registry';
export { WebmcpFormRunnerService as WebMcpFormRunnerService } from './lib/forms/form-runner.service';
