export interface CameraVector3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraState {
  position: CameraVector3;
  target: CameraVector3;
}

/**
 * Utility for smooth lerp transitions of 3D cameras.
 */
export class CameraInterpolator {
  /**
   * Linear interpolation between two scalar numbers.
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.min(Math.max(t, 0), 1);
  }

  /**
   * Smooth cosine easing factor.
   */
  static easeInOut(t: number): number {
    return 0.5 * (1 - Math.cos(Math.PI * Math.min(Math.max(t, 0), 1)));
  }

  /**
   * Interpolate camera position and lookAt target over time.
   */
  static interpolateCamera(
    start: CameraState,
    end: CameraState,
    durationMs: number,
    onUpdate: (state: CameraState) => void,
    onComplete: () => void
  ): { cancel: () => void } {
    if (durationMs <= 0 || typeof requestAnimationFrame === 'undefined') {
      onUpdate(end);
      onComplete();
      return { cancel: () => {} };
    }

    const startTime = performance.now();
    let animFrameId: number | null = null;
    let isCancelled = false;

    const tick = (currentTime: number) => {
      if (isCancelled) return;

      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / durationMs, 1);
      const easedProgress = this.easeInOut(rawProgress);

      const currentState: CameraState = {
        position: {
          x: this.lerp(start.position.x, end.position.x, easedProgress),
          y: this.lerp(start.position.y, end.position.y, easedProgress),
          z: this.lerp(start.position.z, end.position.z, easedProgress),
        },
        target: {
          x: this.lerp(start.target.x, end.target.x, easedProgress),
          y: this.lerp(start.target.y, end.target.y, easedProgress),
          z: this.lerp(start.target.z, end.target.z, easedProgress),
        },
      };

      onUpdate(currentState);

      if (rawProgress < 1) {
        animFrameId = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    animFrameId = requestAnimationFrame(tick);

    return {
      cancel: () => {
        isCancelled = true;
        if (animFrameId !== null) {
          cancelAnimationFrame(animFrameId);
        }
      },
    };
  }

  /**
   * Calculate new camera position when orbiting around a target center.
   */
  static computeOrbitPosition(
    currentPos: CameraVector3,
    target: CameraVector3,
    deltaThetaRad: number,
    deltaPhiRad: number,
    zoomFactor: number = 1.0
  ): CameraVector3 {
    // Relative vector from target
    const dx = currentPos.x - target.x;
    const dy = currentPos.y - target.y;
    const dz = currentPos.z - target.z;

    // Convert to spherical
    let radius = Math.sqrt(dx * dx + dy * dy + dz * dz) * zoomFactor;
    radius = Math.max(radius, 0.5); // Prevent clipping through target

    let theta = Math.atan2(dx, dz) + deltaThetaRad;
    let phi = Math.acos(Math.max(-1, Math.min(1, dy / (radius / zoomFactor)))) + deltaPhiRad;

    // Clamp phi to prevent gimbal flipping (10 degrees to 170 degrees)
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

    return {
      x: target.x + radius * Math.sin(phi) * Math.sin(theta),
      y: target.y + radius * Math.cos(phi),
      z: target.z + radius * Math.sin(phi) * Math.cos(theta),
    };
  }
}
