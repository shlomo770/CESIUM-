/**
 * @module types/config
 * @description Configuration contracts for {@link TelemetryFlightViewer}.
 */

import type { TelemetrySnapshot } from "./telemetry";

// ---------------------------------------------------------------------------
// Display & layout
// ---------------------------------------------------------------------------

/**
 * Determines how the viewer mounts into the host application DOM.
 *
 * - `embedded`: Fills the supplied container element.
 * - `floating`: Renders a draggable overlay anchored to the viewport.
 */
export type DisplayMode = "embedded" | "floating";

/**
 * Preset anchor positions for floating overlay mode before the user drags.
 */
export type FloatingPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

/**
 * Width or height may be an explicit pixel value or `'auto'` to inherit
 * from the parent container (embedded mode).
 */
export type DimensionValue = number | "auto";

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

/**
 * Static orientation correction applied after telemetry rotation.
 * Useful when the authored GLTF forward axis differs from the simulation frame.
 */
export interface ModelOrientationOffset {
  /** Pitch correction in degrees. */
  pitch?: number;
  /** Roll correction in degrees. */
  roll?: number;
  /** Yaw correction in degrees. */
  yaw?: number;
}

/**
 * Runtime 3D asset descriptor. Models are never hardcoded inside the library.
 */
export interface ModelConfig {
  /**
   * Absolute or relative URL to a GLTF or GLB asset.
   * Must be non-empty; validated by {@link resolveConfig}.
   */
  url: string;

  /**
   * Logical identifier for logging, debugging, and telemetry correlation.
   */
  name?: string;

  /**
   * Uniform scale multiplier applied after the asset loads.
   * @defaultValue 1
   */
  scale?: number;

  /**
   * Static rotation offsets in degrees applied in YXZ order after load.
   */
  orientationOffset?: ModelOrientationOffset;
}

// ---------------------------------------------------------------------------
// Nested configuration sections
// ---------------------------------------------------------------------------

/**
 * Viewer viewport dimensions (primarily used in embedded mode).
 */
export interface DimensionsConfig {
  /** CSS pixel width or `'auto'`. @defaultValue `'auto'` */
  width?: DimensionValue;
  /** CSS pixel height or `'auto'`. @defaultValue `'auto'` */
  height?: DimensionValue;
}

/**
 * Feature flags for read-only HUD overlays.
 * No control surfaces are exposed through these flags.
 */
export interface UiElementsConfig {
  /** Heading compass rose. @defaultValue true */
  compass?: boolean;
  /** Artificial horizon instrument. @defaultValue true */
  artificialHorizon?: boolean;
  /** Top telemetry strip (speed, altitude, heading). @defaultValue true */
  telemetryBar?: boolean;
  /** Center crosshair reticle. @defaultValue true */
  crosshair?: boolean;
  /** Numeric pitch/roll readout near instruments. @defaultValue true */
  pitchRollReadout?: boolean;
  /** Bottom status line (lat/lng when provided). @defaultValue true */
  statusLine?: boolean;
}

/**
 * Scene environment and rendering atmosphere settings.
 */
export interface EnvironmentConfig {
  /**
   * Renderer clear color as a CSS color string.
   * Use `null` or `'transparent'` for alpha compositing over the host page.
   * @defaultValue `'#0b1220'`
   */
  backgroundColor?: string | null;

  /** Enable distance fog. @defaultValue false */
  fogEnabled?: boolean;

  /** Fog start distance in world units. @defaultValue 80 */
  fogNear?: number;

  /** Fog end distance in world units. @defaultValue 450 */
  fogFar?: number;

  /** Ambient light intensity. @defaultValue 0.55 */
  ambientIntensity?: number;

  /** Key directional light intensity. @defaultValue 1.15 */
  directionalIntensity?: number;

  /** Render a subtle ground grid for spatial reference. @defaultValue true */
  showGrid?: boolean;
}

/**
 * Options for floating overlay display mode.
 */
export interface FloatingWindowConfig {
  /** Corner anchor before user drag. @defaultValue `'bottom-right'` */
  position?: FloatingPosition;

  /** Panel width in CSS pixels. @defaultValue 420 */
  width?: number;

  /** Panel height in CSS pixels. @defaultValue 320 */
  height?: number;

  /** CSS `z-index` of the overlay root. @defaultValue 10000 */
  zIndex?: number;

  /** Allow dragging via the panel header. @defaultValue true */
  draggable?: boolean;

  /** Title text rendered in the drag handle bar. @defaultValue `'Flight Telemetry'` */
  title?: string;

  /** Viewport margin in pixels when anchored. @defaultValue 16 */
  margin?: number;
}

/**
 * Externally driven chase camera parameters (no user orbit controls).
 */
export interface CameraConfig {
  /** Distance behind the aircraft in world units. @defaultValue 14 */
  chaseDistance?: number;

  /** Height above the aircraft centerline. @defaultValue 4 */
  chaseHeight?: number;

  /** Look-ahead offset along the forward axis. @defaultValue 20 */
  lookAhead?: number;

  /** Vertical field of view in degrees. @defaultValue 55 */
  fov?: number;

  /**
   * Interpolation factor applied per frame in `[0, 1]`.
   * Higher values produce snappier camera motion.
   * @defaultValue 0.12
   */
  smoothing?: number;
}

// ---------------------------------------------------------------------------
// Root config
// ---------------------------------------------------------------------------

/**
 * Consumer-facing configuration object passed to the viewer constructor.
 */
export interface TelemetryFlightViewerConfig {
  /**
   * Host element supplied by the consumer application.
   *
   * - **embedded**: Cleared and filled by the viewer root.
   * - **floating**: Receives an overlay child; may be `document.body`.
   */
  container: HTMLElement;

  /** @defaultValue `'embedded'` */
  displayMode?: DisplayMode;

  /** Viewport sizing; primarily affects embedded mode. */
  dimensions?: DimensionsConfig;

  /**
   * Required runtime model descriptor.
   * The asset is fetched from {@link ModelConfig.url} after initialization.
   */
  model: ModelConfig;

  /** HUD overlay feature flags. */
  ui?: UiElementsConfig;

  /** Scene environment settings. */
  environment?: EnvironmentConfig;

  /** Floating overlay settings (ignored when `displayMode` is `'embedded'`). */
  floating?: FloatingWindowConfig;

  /** Chase camera behavior. */
  camera?: CameraConfig;

  /**
   * Initial telemetry snapshot before the first `updateTelemetry` call.
   */
  initialTelemetry?: Partial<TelemetrySnapshot>;

  /** Enable MSAA on the WebGL context. @defaultValue true */
  antialias?: boolean;

  /**
   * Device pixel ratio cap for the renderer.
   * @defaultValue `Math.min(window.devicePixelRatio, 2)`
   */
  pixelRatio?: number;

  /** Observe viewport size and resize the renderer. @defaultValue true */
  autoResize?: boolean;

  /** Optional CSS class applied to the viewer root element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Resolved (fully defaulted) config
// ---------------------------------------------------------------------------

/** {@link ModelConfig} with all optional fields populated. */
export interface ResolvedModelConfig {
  url: string;
  name: string;
  scale: number;
  orientationOffset: Required<ModelOrientationOffset>;
}

/**
 * Fully resolved configuration used internally after {@link resolveConfig}.
 * Every nested section contains explicit defaults; no optional fields remain
 * at the leaf level.
 */
export interface ResolvedTelemetryFlightViewerConfig {
  container: HTMLElement;
  displayMode: DisplayMode;
  model: ResolvedModelConfig;
  antialias: boolean;
  autoResize: boolean;
  pixelRatio: number;
  className?: string;
  dimensions: Required<DimensionsConfig>;
  ui: Required<UiElementsConfig>;
  environment: Required<EnvironmentConfig>;
  floating: Required<FloatingWindowConfig>;
  camera: Required<CameraConfig>;
  initialTelemetry: TelemetrySnapshot;
}
