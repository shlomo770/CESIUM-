import { Cartesian3, Viewer } from "cesium";
import { simulatorConfig } from "../config/simulatorConfig";
import type { FlightState } from "../types/flight";
import type { FlightViewMode } from "../types/viewMode";
export type ResolvedSimulatorConfig = typeof simulatorConfig;
export declare function makeGltfOrientation(position: Cartesian3, flight: FlightState, config: ResolvedSimulatorConfig): import("cesium").Quaternion;
export declare function getTerrainHeightSafe(viewer: Viewer, longitude: number, latitude: number): number;
export declare function buildGroundReferenceLine(flight: FlightState): Cartesian3[];
export declare function updateCamera(viewer: Viewer, flight: FlightState, config: ResolvedSimulatorConfig, viewMode: FlightViewMode): void;
