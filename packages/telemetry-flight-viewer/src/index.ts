/**
 * @packageDocumentation
 * Telemetry-driven 3D flight viewer for browser applications.
 *
 * @example
 * ```ts
 * import { TelemetryFlightViewer } from '@cesium-suite/telemetry-flight-viewer';
 * import 'three'; // peer dependency
 *
 * const viewer = new TelemetryFlightViewer({ ... });
 * await viewer.initialize();
 * ```
 */

// ---------------------------------------------------------------------------
// Primary facade
// ---------------------------------------------------------------------------

export {
  TelemetryFlightViewer,
  DEFAULT_DEMO_MODEL_URL
} from "./TelemetryFlightViewer";

export type {
  TelemetryFlightViewerEvents,
  ViewerState
} from "./TelemetryFlightViewer";

// ---------------------------------------------------------------------------
// Configuration & telemetry types
// ---------------------------------------------------------------------------

export type {
  CameraConfig,
  DimensionValue,
  DimensionsConfig,
  DisplayMode,
  EnvironmentConfig,
  FloatingPosition,
  FloatingWindowConfig,
  ModelConfig,
  ModelOrientationOffset,
  ResolvedModelConfig,
  ResolvedTelemetryFlightViewerConfig,
  TelemetryFlightViewerConfig,
  UiElementsConfig
} from "./types/config";

export type {
  TelemetrySnapshot,
  TelemetryUpdatePayload,
  TelemetryListener,
  TelemetryUnsubscribe
} from "./types/telemetry";

export {
  DEFAULT_TELEMETRY,
  createTelemetrySnapshot,
  normalizeHeadingDegrees,
  isValidTelemetryUpdate
} from "./types/telemetry";

export { resolveConfig, getDefaultUiConfig } from "./config/resolveConfig";

// ---------------------------------------------------------------------------
// Advanced / composable exports
// ---------------------------------------------------------------------------

export { TelemetryState } from "./core/TelemetryState";
export type { TelemetryStateOptions } from "./core/TelemetryState";

export { LifecycleManager } from "./core/LifecycleManager";

export { SceneManager } from "./scene/SceneManager";
export type { SceneManagerOptions } from "./scene/SceneManager";

export { AircraftLoader } from "./scene/AircraftLoader";
export type { LoadedAircraft } from "./scene/AircraftLoader";

export { ChaseCamera, ALTITUDE_WORLD_SCALE } from "./scene/ChaseCamera";

export { OverlayManager } from "./ui/OverlayManager";
export type { OverlayManagerOptions } from "./ui/OverlayManager";

export {
  createViewerRoot,
  createViewerViewport
} from "./display/DisplayHost";
export type { DisplayHost } from "./display/DisplayHost";

export { EmbeddedHost } from "./display/EmbeddedHost";
export { FloatingHost } from "./display/FloatingHost";

export { DragController } from "./interaction/DragController";
export type { DragControllerOptions } from "./interaction/DragController";

export {
  disposeObject3D,
  disposeMaterial,
  disposeTexture,
  disposeNodeResources
} from "./utils/dispose";
