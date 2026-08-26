import { describe, it, expect, beforeEach } from 'bun:test';
import { CameraInterpolator } from './camera-interpolator';
import { Scene3DActionBus } from './scene-action-bus';
import { Scene3DActionParams, Scene3DActionResult } from '../core/webmcp.types';

describe('CameraInterpolator', () => {
  it('should interpolate scalars with lerp', () => {
    expect(CameraInterpolator.lerp(0, 100, 0.5)).toBe(50);
    expect(CameraInterpolator.lerp(10, 20, 0)).toBe(10);
    expect(CameraInterpolator.lerp(10, 20, 1)).toBe(20);
  });

  it('should compute orbit positions accurately around target', () => {
    const startPos = { x: 0, y: 0, z: 5 };
    const target = { x: 0, y: 0, z: 0 };

    // 90 degrees (Math.PI / 2) horizontal orbit
    const newPos = CameraInterpolator.computeOrbitPosition(
      startPos,
      target,
      Math.PI / 2,
      0,
      1.0
    );

    expect(typeof newPos.x).toBe('number');
    expect(typeof newPos.y).toBe('number');
    expect(typeof newPos.z).toBe('number');

    // Radius should be preserved approximately 5
    const computedRadius = Math.sqrt(newPos.x * newPos.x + newPos.y * newPos.y + newPos.z * newPos.z);
    expect(Math.abs(computedRadius - 5)).toBeLessThan(0.01);
  });

  it('should apply zoom factor to camera distance', () => {
    const startPos = { x: 0, y: 0, z: 10 };
    const target = { x: 0, y: 0, z: 0 };

    const zoomedPos = CameraInterpolator.computeOrbitPosition(
      startPos,
      target,
      0,
      0,
      0.5 // Zoom in 50%
    );

    const zoomedRadius = Math.sqrt(
      zoomedPos.x * zoomedPos.x + zoomedPos.y * zoomedPos.y + zoomedPos.z * zoomedPos.z
    );
    expect(Math.abs(zoomedRadius - 5)).toBeLessThan(0.01);
  });
});

describe('Scene3DActionBus', () => {
  let bus: Scene3DActionBus;

  beforeEach(() => {
    bus = new Scene3DActionBus();
  });

  it('should enqueue and execute actions through registered executor', async () => {
    bus.registerExecutor(async (params: Scene3DActionParams): Promise<Scene3DActionResult> => {
      return {
        success: true,
        action: params.action,
        sceneState: {
          camera: { x: 1, y: 2, z: 3, target: [0, 0, 0] },
          activeMeshes: ['cube1'],
        },
        message: 'Action completed',
      };
    });

    const result = await bus.enqueueAction({
      action: 'rotate',
      deltaX: 45,
      durationMs: 10,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('rotate');
    expect(result.sceneState.activeMeshes).toContain('cube1');
  });

  it('should process multiple queued actions sequentially', async () => {
    const executionOrder: string[] = [];

    bus.registerExecutor(async (params: Scene3DActionParams) => {
      executionOrder.push(params.action);
      return {
        success: true,
        action: params.action,
        sceneState: { camera: { x: 0, y: 0, z: 0, target: [0, 0, 0] }, activeMeshes: [] },
        message: 'ok',
      };
    });

    const p1 = bus.enqueueAction({ action: 'rotate', durationMs: 10 });
    const p2 = bus.enqueueAction({ action: 'zoom', durationMs: 10 });
    const p3 = bus.enqueueAction({ action: 'reset_camera', durationMs: 10 });

    await Promise.all([p1, p2, p3]);

    expect(executionOrder).toEqual(['rotate', 'zoom', 'reset_camera']);
  });
});
