/*
 * Public API Surface of @webmcp/angular (ngx-webmcp)
 */

// Core Services & Provider
export * from './core/webmcp.types';
export * from './core/webmcp.service';
export * from './core/webmcp.provider';
export * from './core/webmcp.emulator';
export * from './core/schema-generator';

// Declarative Directives & Helpers
export * from './directives/webmcp-tool.directive';
export * from './directives/webmcp-action.directive';
export * from './directives/webmcp-signal';

// Multimodal Capture
export * from './multimodal/viewport-capture.service';
export * from './multimodal/canvas-rasterizer';
export { WebmcpViewportCaptureService as WebMcpViewportCaptureService } from './multimodal/viewport-capture.service';

// 3D Scene Controller
export * from './three/three-scene-bridge';
export * from './three/scene-action-bus';
export * from './three/camera-interpolator';
export { WebmcpThreeSceneBridge as WebMcpThreeSceneBridge } from './three/three-scene-bridge';

// Form Automation
export * from './forms/form-runner.service';
export * from './forms/form-registry';
export { WebmcpFormRunnerService as WebMcpFormRunnerService } from './forms/form-runner.service';
