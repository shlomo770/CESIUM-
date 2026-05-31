/**
 * @module scene/AircraftLoader
 * @description Loads GLTF/GLB assets and wraps them in a pivot hierarchy for
 * uniform telemetry-driven transforms regardless of the source file orientation.
 */

import { Box3, Group, Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ResolvedModelConfig } from "../types/config";
import { disposeObject3D } from "../utils/dispose";
import { degToRad } from "../utils/math";

/** Minimum bounding extent before auto-normalization is applied (world units). */
const MIN_NORMALIZE_EXTENT = 0.5;

/** Target maximum axis length after auto-normalization (world units). */
const TARGET_NORMALIZE_EXTENT = 2;

/**
 * Result of a successful model load.
 */
export interface LoadedAircraft {
  /**
   * Outer pivot group. Attach telemetry rotation and translation to this node.
   */
  pivot: Group;

  /**
   * Inner mount node containing the oriented GLTF scene.
   */
  modelMount: Group;

  /** Root object returned by the GLTF loader. */
  model: Object3D;

  /** Axis-aligned bounds of the full pivot hierarchy after scaling. */
  bounds: Box3;
}

/**
 * Dynamically loads GLTF/GLB assets and applies configuration-driven orientation
 * offsets on an inner mount while preserving a clean outer pivot for telemetry.
 */
export class AircraftLoader {
  private readonly gltfLoader = new GLTFLoader();
  private activePivot: Group | null = null;

  /**
   * Loads a model from the resolved configuration URL.
   *
   * @param config - Resolved model descriptor including offsets and scale.
   * @returns Loaded pivot hierarchy and bounds.
   */
  async load(config: ResolvedModelConfig): Promise<LoadedAircraft> {
    this.dispose();

    const gltf = await this.gltfLoader.loadAsync(config.url);
    const model = gltf.scene;
    model.name = config.name;

    const pivot = new Group();
    pivot.name = `${config.name}-pivot`;

    const modelMount = new Group();
    modelMount.name = `${config.name}-mount`;

    modelMount.add(model);
    pivot.add(modelMount);

    applyOrientationOffset(modelMount, config.orientationOffset);
    applyUniformScale(pivot, config.scale);
    autoNormalizeScale(pivot);

    this.activePivot = pivot;

    const bounds = new Box3().setFromObject(pivot);

    return {
      pivot,
      modelMount,
      model,
      bounds
    };
  }

  /**
   * Disposes GPU resources for the currently loaded aircraft, if any.
   */
  dispose(): void {
    if (!this.activePivot) return;
    disposeObject3D(this.activePivot);
    this.activePivot = null;
  }

  /**
   * Returns true when a model is currently loaded in memory.
   */
  hasLoadedModel(): boolean {
    return this.activePivot !== null;
  }
}

/**
 * Applies static orientation correction to the inner mount (not the outer pivot).
 */
function applyOrientationOffset(
  modelMount: Group,
  offset: ResolvedModelConfig["orientationOffset"]
): void {
  modelMount.rotation.order = "YXZ";
  modelMount.rotation.set(
    degToRad(offset.pitch),
    degToRad(offset.yaw),
    degToRad(offset.roll)
  );
}

/**
 * Applies uniform scale at the pivot root so child offsets remain consistent.
 */
function applyUniformScale(pivot: Group, scale: number): void {
  pivot.scale.setScalar(scale);
}

/**
 * Scales undersized authored models to a readable default extent.
 */
function autoNormalizeScale(pivot: Group): void {
  const bounds = new Box3().setFromObject(pivot);
  const size = bounds.getSize(new Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);

  if (maxAxis >= MIN_NORMALIZE_EXTENT) {
    return;
  }

  const multiplier = TARGET_NORMALIZE_EXTENT / maxAxis;
  pivot.scale.multiplyScalar(multiplier);
}
