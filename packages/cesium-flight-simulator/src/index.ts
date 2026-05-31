/**
 * @cesium-suite/cesium-flight-simulator
 * Full Cesium globe flight simulator — map tiles, GLTF aircraft, HUD, telemetry modes.
 */

export { default as FlightSimulatorWidget } from "./components/FlightSimulatorWidget";
export type { FlightSimulatorWidgetProps } from "./components/FlightSimulatorWidget";

export { default as CesiumFlightSimulator } from "./components/CesiumFlightSimulator";

export { default as ExternalTelemetryExample } from "./examples/ExternalTelemetryExample";

export { simulatorConfig } from "./config/simulatorConfig";
export type SimulatorConfig = typeof import("./config/simulatorConfig").simulatorConfig;
export { resolveMapTileUrl } from "./config/resolveMapUrl";
export { deepMerge, type DeepPartial } from "./config/mergeConfig";

export type {
  WindowConfig,
  MapConfig,
  AnnotationsConfig,
  AircraftConfig,
  FlightSimulatorDisplayMode,
  FloatingAnchor,
  MapMode
} from "./types/simulatorConfigTypes";

export type { FlightTelemetry, FlightInputs, FlightState, FlightMode } from "./types/flight";
export type { FlightViewMode } from "./types/viewMode";
