import type { MapConfig } from "../types/simulatorConfigTypes";
/**
 * Resolves the imagery URL passed to Cesium `UrlTemplateImageryProvider`.
 */
export declare function resolveMapTileUrl(map: MapConfig): string | null;
