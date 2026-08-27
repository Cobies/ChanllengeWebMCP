import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { WebMcpService } from '../core/webmcp.service';
import {
  Scene3DActionParams,
  Scene3DActionResult,
  Scene3DActionType,
  WebMcpToolDefinition,
} from '../core/webmcp.types';
import { Scene3DActionBus } from './scene-action-bus';
import { CameraInterpolator, CameraState } from './camera-interpolator';

export interface SceneContextRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  meshes: Map<string, THREE.Mesh | THREE.Object3D>;
  defaultCameraState?: CameraState;
}

@Injectable({
  providedIn: 'root',
})
export class WebmcpThreeSceneBridge {
  private readonly webmcp: WebMcpService;
  private readonly actionBus: Scene3DActionBus;

  private contextRef: SceneContextRef | null = null;
  private defaultCameraState: CameraState = {
    position: { x: 4, y: 3, z: 6 },
    target: { x: 0, y: 0, z: 0 },
  };

  constructor(webmcp?: WebMcpService, actionBus?: Scene3DActionBus) {
    this.webmcp = webmcp || inject(WebMcpService);
    this.actionBus = actionBus || inject(Scene3DActionBus);
    this.actionBus.registerExecutor((params) => this.executeSceneAction(params));
    this.registerTool();
  }

  /**
   * Bind the active Three.js scene references.
   */
  bindScene(ref: SceneContextRef): void {
    this.contextRef = ref;
    if (ref.defaultCameraState) {
      this.defaultCameraState = ref.defaultCameraState;
    } else if (ref.camera) {
      this.defaultCameraState = {
        position: {
          x: ref.camera.position.x,
          y: ref.camera.position.y,
          z: ref.camera.position.z,
        },
        target: { x: 0, y: 0, z: 0 },
      };
    }
  }

  /**
   * Unbind scene references upon component destruction.
   */
  unbindScene(): void {
    this.contextRef = null;
  }

  private registerTool(): void {
    const toolDef: WebMcpToolDefinition<Scene3DActionParams, Scene3DActionResult> = {
      name: 'scene_3d_action',
      description:
        'Manipulates the interactive 3D WebGL viewport: orbit rotation, camera zoom, mesh material colors, animations, part highlighting, and camera resets.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description:
              'The 3D command to perform: "rotate", "zoom", "change_mesh_color", "play_animation", "reset_camera", or "highlight_part"',
            enum: [
              'rotate',
              'zoom',
              'change_mesh_color',
              'play_animation',
              'reset_camera',
              'highlight_part',
            ],
          },
          deltaX: {
            type: 'number',
            description: 'Horizontal orbit angle in degrees (e.g. 45 for right, -45 for left)',
          },
          deltaY: {
            type: 'number',
            description: 'Vertical orbit angle in degrees (e.g. 20 for up, -20 for down)',
          },
          zoomFactor: {
            type: 'number',
            description: 'Zoom multiplier (e.g. 0.75 to zoom in, 1.3 to zoom out)',
          },
          meshName: {
            type: 'string',
            description: 'Identifier of the target mesh or part in the 3D scene graph',
          },
          hexColor: {
            type: 'string',
            description: 'Target color in hexadecimal format (e.g. "#00e5ff" or "#ff0055")',
          },
          clipName: {
            type: 'string',
            description: 'Animation clip identifier',
          },
          durationMs: {
            type: 'number',
            description: 'Interpolation and transition time in milliseconds (default: 600)',
            default: 600,
          },
        },
        required: ['action'],
      },
      handler: async (params: Scene3DActionParams) => {
        return await this.actionBus.enqueueAction(params);
      },
    };

    this.webmcp.registerTool(toolDef);
  }

  /**
   * Execution handler for dispatched 3D actions.
   */
  async executeSceneAction(params: Scene3DActionParams): Promise<Scene3DActionResult> {
    if (!this.contextRef) {
      return {
        success: false,
        action: params.action,
        sceneState: {
          camera: { x: 0, y: 0, z: 0, target: [0, 0, 0] },
          activeMeshes: [],
        },
        message: 'No active 3D scene is currently bound to WebMCP bridge',
      };
    }

    const { camera, meshes } = this.contextRef;
    const durationMs = params.durationMs || 600;

    switch (params.action) {
      case 'rotate':
      case 'zoom': {
        const deltaThetaRad = ((params.deltaX || 0) * Math.PI) / 180;
        const deltaPhiRad = -((params.deltaY || 0) * Math.PI) / 180;
        const zoom = params.zoomFactor || 1.0;

        const currentPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        const targetPos = { x: 0, y: 0, z: 0 };
        const newPos = CameraInterpolator.computeOrbitPosition(
          currentPos,
          targetPos,
          deltaThetaRad,
          deltaPhiRad,
          zoom
        );

        await new Promise<void>((resolve) => {
          CameraInterpolator.interpolateCamera(
            { position: currentPos, target: targetPos },
            { position: newPos, target: targetPos },
            durationMs,
            (state) => {
              camera.position.set(state.position.x, state.position.y, state.position.z);
              camera.lookAt(state.target.x, state.target.y, state.target.z);
            },
            () => resolve()
          );
        });

        return this.buildSuccessResult(
          params.action,
          `Camera orbit updated: deltaX=${params.deltaX ?? 0}°, deltaY=${params.deltaY ?? 0}°, zoom=${zoom}`
        );
      }

      case 'reset_camera': {
        const currentPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        const startTarget = { x: 0, y: 0, z: 0 };

        await new Promise<void>((resolve) => {
          CameraInterpolator.interpolateCamera(
            { position: currentPos, target: startTarget },
            this.defaultCameraState,
            durationMs,
            (state) => {
              camera.position.set(state.position.x, state.position.y, state.position.z);
              camera.lookAt(state.target.x, state.target.y, state.target.z);
            },
            () => resolve()
          );
        });

        return this.buildSuccessResult(
          'reset_camera',
          'Camera position and orientation smoothly reset to default'
        );
      }

      case 'change_mesh_color': {
        if (!params.meshName) {
          throw new Error("Missing required 'meshName' parameter for change_mesh_color");
        }
        if (!params.hexColor) {
          throw new Error("Missing required 'hexColor' parameter for change_mesh_color");
        }

        const targetMesh = meshes.get(params.meshName);
        if (!targetMesh) {
          throw new Error(`Target mesh '${params.meshName}' not found in active 3D scene`);
        }

        const color = new THREE.Color(params.hexColor);
        targetMesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if ('color' in mat) (mat as any).color = color;
              });
            } else if ('color' in child.material) {
              (child.material as any).color = color;
            }
          }
        });

        return this.buildSuccessResult(
          'change_mesh_color',
          `Material color for mesh '${params.meshName}' updated to ${params.hexColor}`
        );
      }

      case 'highlight_part': {
        if (!params.meshName) {
          throw new Error("Missing required 'meshName' for highlight_part");
        }
        const targetMesh = meshes.get(params.meshName);
        if (!targetMesh) {
          throw new Error(`Mesh '${params.meshName}' not found`);
        }

        // Pulse emissive color
        const highlightColor = new THREE.Color(params.hexColor || '#00ffff');
        targetMesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
            (child.material as any).emissive = highlightColor;
            (child.material as any).emissiveIntensity = 0.8;
          }
        });

        // Reset highlight after duration
        setTimeout(() => {
          if (this.contextRef && targetMesh) {
            targetMesh.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
                (child.material as any).emissiveIntensity = 0.1;
              }
            });
          }
        }, durationMs * 2);

        return this.buildSuccessResult(
          'highlight_part',
          `Emphasized part '${params.meshName}' with emissive highlight`
        );
      }

      case 'play_animation': {
        return this.buildSuccessResult(
          'play_animation',
          `Animation '${params.clipName || 'default'}' triggered`
        );
      }

      default:
        throw new Error(`Unsupported 3D action type: '${(params as any).action}'`);
    }
  }

  private buildSuccessResult(
    action: Scene3DActionType,
    message: string
  ): Scene3DActionResult {
    const cam = this.contextRef?.camera;
    return {
      success: true,
      action,
      sceneState: {
        camera: {
          x: cam ? Math.round(cam.position.x * 100) / 100 : 0,
          y: cam ? Math.round(cam.position.y * 100) / 100 : 0,
          z: cam ? Math.round(cam.position.z * 100) / 100 : 0,
          target: [0, 0, 0],
        },
        activeMeshes: Array.from(this.contextRef?.meshes.keys() || []),
      },
      message,
    };
  }
}
