export type FlightSimulatorDisplayMode = "embedded" | "floating" | "fullscreen";

export type FloatingAnchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export type MapMode = "ONLINE_ESRI" | "LOCAL_XYZ" | "CUSTOM" | "NONE";

/** Tile URL order: `{z}/{x}/{y}` (local XYZ) or `{z}/{y}/{x}` (ArcGIS REST). */
export type MapUrlTemplate = "XYZ" | "ESRI_YX";

export type WindowSize = number | "auto" | "100%";

export interface WindowFloatingConfig {
  /** Anchor before the user drags the panel. */
  position: FloatingAnchor;
  draggable: boolean;
  title: string;
  margin: number;
  zIndex: number;
}

export interface WindowConfig {
  /**
   * - `fullscreen`: fills the parent / viewport (default demo app).
   * - `embedded`: fixed size inside your layout.
   * - `floating`: draggable overlay panel.
   */
  displayMode: FlightSimulatorDisplayMode;
  width: WindowSize;
  height: WindowSize;
  floating: WindowFloatingConfig;
  /** Show flight / side-view toggle buttons. */
  showViewModeToggle: boolean;
}

export interface MapConfig {
  mode: MapMode;
  /** Primary tile URL for `LOCAL_XYZ` and `CUSTOM` (alias: localXyzUrl). */
  tileUrl: string;
  /** ArcGIS / ESRI template `{z}/{y}/{x}`. */
  onlineEsriUrl: string;
  /** @deprecated Use tileUrl. Kept for backward compatibility. */
  localXyzUrl: string;
  /** Used when mode is `CUSTOM`. */
  urlTemplate: MapUrlTemplate;
}

export interface AnnotationsConfig {
  hudTop: boolean;
  crosshair: boolean;
  attitudeIndicator: boolean;
  bottomTelemetry: boolean;
  controlsHelp: boolean;
  trail: boolean;
  debugPanel: boolean;
}

export interface AircraftConfig {
  renderMode: "SCREEN_OVERLAY" | "SIMPLE_ENTITY" | "GLTF";
  /** Public URL or path under `public/` — e.g. `/models/drone.glb`. */
  modelUri: string;
  scale: number;
  minimumPixelSize: number;
  maximumScale: number;
  orientationMode: "NORMAL" | "SWAP_PITCH_ROLL";
  modelHeadingOffsetDeg: number;
  modelPitchOffsetDeg: number;
  modelRollOffsetDeg: number;
  screenSizePx: number;
  screenOffsetYPx: number;
  lengthM: number;
  widthM: number;
  heightM: number;
}

export interface SimulatorConfig {
  mode: "INTERNAL" | "EXTERNAL";
  start: {
    latitude: number;
    longitude: number;
    altitudeM: number;
    headingDeg: number;
    speedMps: number;
  };
  window: WindowConfig;
  aircraft: AircraftConfig;
  flight: Record<string, number>;
  camera: Record<string, number | boolean | string>;
  map: MapConfig;
  terrain: { useCesiumWorldTerrain: boolean };
  scene: Record<string, boolean>;
  annotations: AnnotationsConfig;
  trail: Record<string, number | boolean>;
}
