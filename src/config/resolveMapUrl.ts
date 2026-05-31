import type { MapConfig } from "../types/simulatorConfigTypes";

/**
 * Resolves the imagery URL passed to Cesium `UrlTemplateImageryProvider`.
 */
export function resolveMapTileUrl(map: MapConfig): string | null {
  switch (map.mode) {
    case "NONE":
      return null;
    case "ONLINE_ESRI":
      return map.onlineEsriUrl;
    case "LOCAL_XYZ":
      return map.tileUrl || map.localXyzUrl;
    case "CUSTOM":
      return map.tileUrl || map.localXyzUrl;
    default:
      return null;
  }
}
