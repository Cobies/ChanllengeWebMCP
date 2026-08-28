import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpService } from '@webmcp/angular';
import { WebmcpThreeSceneBridge } from '../../../lib/three/three-scene-bridge';
import { Scene3DActionBus } from '../../../lib/three/scene-action-bus';
import { WebmcpViewportCaptureService } from '../../../lib/multimodal/viewport-capture.service';
import { WebmcpFormRunnerService } from '../../../lib/forms/form-runner.service';
import { FormRegistry } from '../../../lib/forms/form-registry';
import { ShowroomComponent } from './showroom.component';

describe('ShowroomComponent (WebMCP CAD Studio & Lifecycle Isolation)', () => {
  let webmcp: WebMcpService;
  let actionBus: Scene3DActionBus;
  let sceneBridge: WebmcpThreeSceneBridge;
  let viewportCapture: WebmcpViewportCaptureService;
  let formRunner: WebmcpFormRunnerService;
  let showroom: ShowroomComponent;

  beforeEach(() => {
    webmcp = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });
    actionBus = new Scene3DActionBus();
    sceneBridge = new WebmcpThreeSceneBridge(webmcp, actionBus);
    viewportCapture = new WebmcpViewportCaptureService(webmcp);
    formRunner = new WebmcpFormRunnerService(webmcp, new FormRegistry());

    showroom = new ShowroomComponent(viewportCapture, sceneBridge, formRunner);
  });

  it('should initialize in cad_fullscreen mode by default', () => {
    expect(showroom.viewMode()).toBe('cad_fullscreen');
  });

  it('should toggle between cad_fullscreen and multi_panel modes', () => {
    showroom.viewMode.set('multi_panel');
    expect(showroom.viewMode()).toBe('multi_panel');

    showroom.viewMode.set('cad_fullscreen');
    expect(showroom.viewMode()).toBe('cad_fullscreen');
  });

  describe('Route-Scoped Tool Lifecycle Isolation', () => {
    it('should register 3D DCC tools and screenshot tool upon ngOnInit', () => {
      showroom.ngOnInit();

      expect(webmcp.getTool('studio_create_object')).toBeDefined();
      expect(webmcp.getTool('studio_transform_object')).toBeDefined();
      expect(webmcp.getTool('studio_update_material')).toBeDefined();
      expect(webmcp.getTool('cad_push_pull')).toBeDefined();
      expect(webmcp.getTool('cad_draw_shape')).toBeDefined();
      expect(webmcp.getTool('cad_measure')).toBeDefined();
      expect(webmcp.getTool('scene_3d_action')).toBeDefined();
      expect(webmcp.getTool('take_screenshot')).toBeDefined();
    });

    it('should cleanly unregister all 3D tools and screenshot tool upon ngOnDestroy (Threat Matrix)', () => {
      showroom.ngOnInit();
      expect(webmcp.getTools().length).toBeGreaterThanOrEqual(12);

      showroom.ngOnDestroy();

      expect(webmcp.getTool('studio_create_object')).toBeUndefined();
      expect(webmcp.getTool('studio_transform_object')).toBeUndefined();
      expect(webmcp.getTool('studio_update_material')).toBeUndefined();
      expect(webmcp.getTool('cad_push_pull')).toBeUndefined();
      expect(webmcp.getTool('cad_draw_shape')).toBeUndefined();
      expect(webmcp.getTool('cad_measure')).toBeUndefined();
      expect(webmcp.getTool('scene_3d_action')).toBeUndefined();
      expect(webmcp.getTool('take_screenshot')).toBeUndefined();
    });

    it('should not leak or accumulate duplicate tools on mount -> unmount -> mount cycle', () => {
      showroom.ngOnInit();
      const count1 = webmcp.getTools().length;

      showroom.ngOnDestroy();
      expect(webmcp.getTool('studio_create_object')).toBeUndefined();
      expect(webmcp.getTool('take_screenshot')).toBeUndefined();

      showroom.ngOnInit();
      const count2 = webmcp.getTools().length;
      expect(count2).toBe(count1);
    });
  });
});

