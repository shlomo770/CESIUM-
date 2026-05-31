export declare function movePoint(latDeg: number, lngDeg: number, headingDeg: number, distanceM: number): {
    latitude: number;
    longitude: number;
};
export declare function clamp(value: number, min: number, max: number): number;
export declare function wrap360(value: number): number;
export declare function lerp(a: number, b: number, t: number): number;
