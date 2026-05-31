/**
 * @module scene/ChaseCamera
 * @description Telemetry-driven chase camera with frame-rate independent smoothing.
 * No user orbit or pointer controls are attached.
 */

import {
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Vector3
} from "three";
import type { ResolvedTelemetryFlightViewerConfig } from "../types/config";
import type { TelemetrySnapshot } from "../types/telemetry";
import { clamp, degToRad, lerp } from "../utils/math";

/** Converts telemetry altitude (meters) to scene vertical units. */
export const ALTITUDE_WORLD_SCALE = 0.01;

/**
 * Externally driven chase camera that follows aircraft attitude from telemetry.
 */
export class ChaseCamera {
  readonly camera: PerspectiveCamera;

  private readonly config: ResolvedTelemetryFlightViewerConfig["camera"];

  private readonly smoothedPosition = new Vector3();
  private readonly smoothedQuaternion = new Quaternion();
  private readonly targetPosition = new Vector3();
  private readonly targetQuaternion = new Quaternion();
  private readonly lookAtMatrix = new Matrix4();
  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  private readonly up = new Vector3();
  private readonly worldUp = new Vector3(0, 1, 0);
  private readonly lookAtTarget = new Vector3();
  private readonly aircraftPosition = new Vector3();

  private smoothedPitch = 0;
  private smoothedRoll = 0;
  private smoothedYaw = 0;
  private smoothedAltitude = 0;
  private initialized = false;

  /**
   * @param config - Resolved camera parameters from {@link resolveConfig}.
   */
  constructor(config: ResolvedTelemetryFlightViewerConfig["camera"]) {
    this.config = config;
    this.camera = new PerspectiveCamera(config.fov, 1, 0.1, 8000);
    this.camera.position.set(0, config.chaseHeight, -config.chaseDistance);
  }

  /**
   * Updates aspect ratio after a viewport resize.
   *
   * @param width - Drawable width in pixels.
   * @param height - Drawable height in pixels.
   */
  resize(width: number, height: number): void {
    const safeHeight = Math.max(height, 1);
    this.camera.aspect = width / safeHeight;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Advances the chase camera toward the telemetry-driven target transform.
   *
   * @param telemetry - Latest external telemetry snapshot.
   * @param deltaSeconds - Frame delta time in seconds.
   */
  update(telemetry: TelemetrySnapshot, deltaSeconds: number): void {
    const alpha = smoothingAlpha(this.config.smoothing, deltaSeconds);

    this.smoothedPitch = lerpAngleDegrees(
      this.smoothedPitch,
      telemetry.pitch,
      alpha
    );
    this.smoothedRoll = lerpAngleDegrees(
      this.smoothedRoll,
      telemetry.roll,
      alpha
    );
    this.smoothedYaw = lerpAngleDegrees(
      this.smoothedYaw,
      telemetry.yaw,
      alpha
    );
    this.smoothedAltitude = lerp(
      this.smoothedAltitude,
      telemetry.altitude,
      alpha
    );

    this.computeTargetTransform(
      this.smoothedPitch,
      this.smoothedYaw,
      this.smoothedAltitude
    );

    if (!this.initialized) {
      this.smoothedPosition.copy(this.targetPosition);
      this.smoothedQuaternion.copy(this.targetQuaternion);
      this.initialized = true;
    } else {
      this.smoothedPosition.lerp(this.targetPosition, alpha);
      this.smoothedQuaternion.slerp(this.targetQuaternion, alpha);
    }

    this.camera.position.copy(this.smoothedPosition);
    this.camera.quaternion.copy(this.smoothedQuaternion);
  }

  /**
   * Resets smoothing state (e.g. after a hard telemetry snap).
   */
  resetSmoothing(telemetry?: TelemetrySnapshot): void {
    this.initialized = false;
    if (!telemetry) return;

    this.smoothedPitch = telemetry.pitch;
    this.smoothedRoll = telemetry.roll;
    this.smoothedYaw = telemetry.yaw;
    this.smoothedAltitude = telemetry.altitude;
  }

  /**
   * Releases camera resources (symmetry hook; PerspectiveCamera has no GPU data).
   */
  dispose(): void {
    this.initialized = false;
  }

  /**
   * Builds the desired camera position and orientation for the smoothed attitude.
   */
  private computeTargetTransform(
    pitchDeg: number,
    yawDeg: number,
    altitudeM: number
  ): void {
    const yawRad = degToRad(yawDeg);
    const pitchRad = degToRad(pitchDeg);

    this.aircraftPosition.set(0, altitudeM * ALTITUDE_WORLD_SCALE, 0);

    this.forward.set(
      Math.sin(yawRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      Math.cos(yawRad) * Math.cos(pitchRad)
    );

    if (this.forward.lengthSq() < 1e-8) {
      this.forward.set(0, 0, 1);
    }
    this.forward.normalize();

    this.right.set(Math.cos(yawRad), 0, -Math.sin(yawRad)).normalize();

    this.up.crossVectors(this.right, this.forward).normalize();
    if (this.up.lengthSq() < 1e-8) {
      this.up.copy(this.worldUp);
    }

    this.targetPosition
      .copy(this.aircraftPosition)
      .addScaledVector(this.forward, -this.config.chaseDistance)
      .addScaledVector(this.up, this.config.chaseHeight);

    this.lookAtTarget
      .copy(this.aircraftPosition)
      .addScaledVector(this.forward, this.config.lookAhead);

    this.lookAtMatrix.lookAt(
      this.targetPosition,
      this.lookAtTarget,
      this.worldUp
    );
    this.targetQuaternion.setFromRotationMatrix(this.lookAtMatrix);
  }
}

/**
 * Converts config smoothing [0, 1] into a frame-rate independent interpolation factor.
 */
function smoothingAlpha(smoothing: number, deltaSeconds: number): number {
  const rate = clamp(smoothing, 0, 1) * 12;
  return 1 - Math.exp(-rate * Math.max(deltaSeconds, 0));
}

/**
 * Interpolates angles in degrees along the shortest arc.
 */
function lerpAngleDegrees(from: number, to: number, t: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return from + delta * clamp(t, 0, 1);
}
