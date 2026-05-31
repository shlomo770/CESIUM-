/**
 * @module config/resolveConfig
 * @description Merges consumer configuration with library defaults and validates input.
 */

import type {
  CameraConfig,
  DimensionsConfig,
  EnvironmentConfig,
  FloatingWindowConfig,
  ModelConfig,
  ModelOrientationOffset,
  ResolvedModelConfig,
  ResolvedTelemetryFlightViewerConfig,
  TelemetryFlightViewerConfig,
  UiElementsConfig
} from "../types/config";
import { createTelemetrySnapshot } from "../types/telemetry";

// ---------------------------------------------------------------------------
// Default constants (exported for tests and documentation)
// ---------------------------------------------------------------------------

/** @internal */
export const DEFAULT_DISPLAY_MODE = "embedded" as const;

/** @internal */
export const DEFAULT_DIMENSIONS: Required<DimensionsConfig> = {
  width: "auto",
  height: "auto"
};

/** @internal */
export const DEFAULT_UI: Required<UiElementsConfig> = {
  compass: true,
  artificialHorizon: true,
  telemetryBar: true,
  crosshair: true,
  pitchRollReadout: true,
  statusLine: true
};

/** @internal */
export const DEFAULT_ENVIRONMENT: Required<EnvironmentConfig> = {
  backgroundColor: "#0b1220",
  fogEnabled: false,
  fogNear: 80,
  fogFar: 450,
  ambientIntensity: 0.55,
  directionalIntensity: 1.15,
  showGrid: true
};

/** @internal */
export const DEFAULT_FLOATING: Required<FloatingWindowConfig> = {
  position: "bottom-right",
  width: 420,
  height: 320,
  zIndex: 10000,
  draggable: true,
  title: "Flight Telemetry",
  margin: 16
};

/** @internal */
export const DEFAULT_CAMERA: Required<CameraConfig> = {
  chaseDistance: 14,
  chaseHeight: 4,
  lookAhead: 20,
  fov: 55,
  smoothing: 0.12
};

/** @internal */
export const DEFAULT_MODEL_ORIENTATION: Required<ModelOrientationOffset> = {
  pitch: 0,
  roll: 0,
  yaw: 0
};

/** @internal */
export const DEFAULT_MODEL: ResolvedModelConfig = {
  url: "",
  name: "aircraft",
  scale: 1,
  orientationOffset: { ...DEFAULT_MODEL_ORIENTATION }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves a partial consumer configuration into a fully populated,
 * immutable-ready configuration object used by the viewer internals.
 *
 * @param config - Raw consumer configuration.
 * @returns Resolved configuration with all defaults applied.
 * @throws {TypeError} When required fields are missing or invalid.
 *
 * @example
 * ```ts
 * const resolved = resolveConfig({
 *   container: document.getElementById('viewer')!,
 *   model: { url: '/assets/drone.glb', name: 'UAV-1' },
 * });
 * ```
 */
export function resolveConfig(
  config: TelemetryFlightViewerConfig
): ResolvedTelemetryFlightViewerConfig {
  validateRootConfig(config);

  const initialTelemetry = createTelemetrySnapshot(config.initialTelemetry);

  return {
    container: config.container,
    displayMode: config.displayMode ?? DEFAULT_DISPLAY_MODE,
    model: resolveModelConfig(config.model),
    antialias: config.antialias ?? true,
    autoResize: config.autoResize ?? true,
    pixelRatio: resolvePixelRatio(config.pixelRatio),
    className: config.className,
    dimensions: resolveDimensions(config.dimensions),
    ui: resolveUi(config.ui),
    environment: resolveEnvironment(config.environment),
    floating: resolveFloating(config.floating),
    camera: resolveCamera(config.camera),
    initialTelemetry
  };
}

/**
 * Returns a shallow copy of the default resolved sub-config for UI elements.
 * Useful for documentation generators and unit tests.
 */
export function getDefaultUiConfig(): Readonly<Required<UiElementsConfig>> {
  return { ...DEFAULT_UI };
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

function resolveModelConfig(model: ModelConfig): ResolvedModelConfig {
  const url = model.url.trim();

  if (!url) {
    throw new TypeError(
      "resolveConfig: `model.url` must be a non-empty string."
    );
  }

  const scale = model.scale ?? 1;
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new TypeError(
      "resolveConfig: `model.scale` must be a positive finite number."
    );
  }

  return {
    url,
    name: resolveModelName(model.name),
    scale,
    orientationOffset: resolveOrientationOffset(model.orientationOffset)
  };
}

/**
 * Coerces model labels to a non-empty string (handles numeric IDs from external apps).
 */
function resolveModelName(name: unknown): string {
  if (typeof name === "string") {
    const trimmed = name.trim();
    return trimmed || "aircraft";
  }
  if (name != null && name !== "") {
    return String(name).trim() || "aircraft";
  }
  return "aircraft";
}

function resolveOrientationOffset(
  offset?: ModelOrientationOffset
): Required<ModelOrientationOffset> {
  return {
    pitch: offset?.pitch ?? DEFAULT_MODEL_ORIENTATION.pitch,
    roll: offset?.roll ?? DEFAULT_MODEL_ORIENTATION.roll,
    yaw: offset?.yaw ?? DEFAULT_MODEL_ORIENTATION.yaw
  };
}

function resolveDimensions(
  dimensions?: DimensionsConfig
): Required<DimensionsConfig> {
  return {
    width: dimensions?.width ?? DEFAULT_DIMENSIONS.width,
    height: dimensions?.height ?? DEFAULT_DIMENSIONS.height
  };
}

function resolveUi(ui?: UiElementsConfig): Required<UiElementsConfig> {
  return {
    compass: ui?.compass ?? DEFAULT_UI.compass,
    artificialHorizon: ui?.artificialHorizon ?? DEFAULT_UI.artificialHorizon,
    telemetryBar: ui?.telemetryBar ?? DEFAULT_UI.telemetryBar,
    crosshair: ui?.crosshair ?? DEFAULT_UI.crosshair,
    pitchRollReadout: ui?.pitchRollReadout ?? DEFAULT_UI.pitchRollReadout,
    statusLine: ui?.statusLine ?? DEFAULT_UI.statusLine
  };
}

function resolveEnvironment(
  environment?: EnvironmentConfig
): Required<EnvironmentConfig> {
  return {
    backgroundColor:
      environment?.backgroundColor ?? DEFAULT_ENVIRONMENT.backgroundColor,
    fogEnabled: environment?.fogEnabled ?? DEFAULT_ENVIRONMENT.fogEnabled,
    fogNear: environment?.fogNear ?? DEFAULT_ENVIRONMENT.fogNear,
    fogFar: environment?.fogFar ?? DEFAULT_ENVIRONMENT.fogFar,
    ambientIntensity:
      environment?.ambientIntensity ?? DEFAULT_ENVIRONMENT.ambientIntensity,
    directionalIntensity:
      environment?.directionalIntensity ??
      DEFAULT_ENVIRONMENT.directionalIntensity,
    showGrid: environment?.showGrid ?? DEFAULT_ENVIRONMENT.showGrid
  };
}

function resolveFloating(
  floating?: FloatingWindowConfig
): Required<FloatingWindowConfig> {
  const width = floating?.width ?? DEFAULT_FLOATING.width;
  const height = floating?.height ?? DEFAULT_FLOATING.height;

  if (!Number.isFinite(width) || width <= 0) {
    throw new TypeError(
      "resolveConfig: `floating.width` must be a positive finite number."
    );
  }

  if (!Number.isFinite(height) || height <= 0) {
    throw new TypeError(
      "resolveConfig: `floating.height` must be a positive finite number."
    );
  }

  return {
    position: floating?.position ?? DEFAULT_FLOATING.position,
    width,
    height,
    zIndex: floating?.zIndex ?? DEFAULT_FLOATING.zIndex,
    draggable: floating?.draggable ?? DEFAULT_FLOATING.draggable,
    title: floating?.title?.trim() || DEFAULT_FLOATING.title,
    margin: floating?.margin ?? DEFAULT_FLOATING.margin
  };
}

function resolveCamera(camera?: CameraConfig): Required<CameraConfig> {
  const resolved: Required<CameraConfig> = {
    chaseDistance: camera?.chaseDistance ?? DEFAULT_CAMERA.chaseDistance,
    chaseHeight: camera?.chaseHeight ?? DEFAULT_CAMERA.chaseHeight,
    lookAhead: camera?.lookAhead ?? DEFAULT_CAMERA.lookAhead,
    fov: camera?.fov ?? DEFAULT_CAMERA.fov,
    smoothing: camera?.smoothing ?? DEFAULT_CAMERA.smoothing
  };

  if (resolved.smoothing < 0 || resolved.smoothing > 1) {
    throw new TypeError(
      "resolveConfig: `camera.smoothing` must be within [0, 1]."
    );
  }

  if (resolved.fov <= 0 || resolved.fov >= 180) {
    throw new TypeError(
      "resolveConfig: `camera.fov` must be between 0 and 180 degrees."
    );
  }

  return resolved;
}

function resolvePixelRatio(explicit?: number): number {
  if (explicit !== undefined) {
    if (!Number.isFinite(explicit) || explicit <= 0) {
      throw new TypeError(
        "resolveConfig: `pixelRatio` must be a positive finite number."
      );
    }
    return explicit;
  }

  if (typeof window !== "undefined" && Number.isFinite(window.devicePixelRatio)) {
    return Math.min(window.devicePixelRatio, 2);
  }

  return 1;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateRootConfig(config: TelemetryFlightViewerConfig): void {
  if (!config || typeof config !== "object") {
    throw new TypeError("resolveConfig: config must be a non-null object.");
  }

  if (!(config.container instanceof HTMLElement)) {
    throw new TypeError(
      "resolveConfig: `container` must be a valid HTMLElement."
    );
  }

  if (!config.model || typeof config.model !== "object") {
    throw new TypeError("resolveConfig: `model` is required.");
  }

  if (typeof config.model.url !== "string") {
    throw new TypeError("resolveConfig: `model.url` must be a string.");
  }

  if (
    config.displayMode !== undefined &&
    config.displayMode !== "embedded" &&
    config.displayMode !== "floating"
  ) {
    throw new TypeError(
      "resolveConfig: `displayMode` must be 'embedded' or 'floating'."
    );
  }
}

/**
 * Type guard confirming that a value is a fully resolved configuration.
 *
 * @param value - Candidate value.
 */
export function isResolvedConfig(
  value: unknown
): value is ResolvedTelemetryFlightViewerConfig {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ResolvedTelemetryFlightViewerConfig;
  return (
    candidate.container instanceof HTMLElement &&
    typeof candidate.model?.url === "string" &&
    candidate.model.url.length > 0
  );
}
