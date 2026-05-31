import * as react_jsx_runtime from 'react/jsx-runtime';
import { MutableRefObject } from 'react';

declare const simulatorConfig: {
    mode: "INTERNAL" | "EXTERNAL";
    start: {
        latitude: number;
        longitude: number;
        altitudeM: number;
        headingDeg: number;
        speedMps: number;
    };
    /**
     * Layout of the simulator widget in the host page.
     */
    window: {
        /** `fullscreen` | `embedded` (fixed box) | `floating` (draggable panel). */
        displayMode: "embedded" | "floating" | "fullscreen";
        width: number | "auto" | "100%";
        height: number | "auto" | "100%";
        floating: {
            position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
            draggable: boolean;
            title: string;
            margin: number;
            zIndex: number;
        };
        showViewModeToggle: boolean;
    };
    aircraft: {
        /**
         * המודל שהעלית, מומר ל־GLB מקומי.
         */
        renderMode: "SCREEN_OVERLAY" | "SIMPLE_ENTITY" | "GLTF";
        modelUri: string;
        /**
         * גדול מספיק כדי לראות ברור.
         */
        scale: number;
        minimumPixelSize: number;
        maximumScale: number;
        /**
         * תיקון חשוב:
         * במודל הזה Pitch/Roll נראו מוחלפים ב-Cesium.
         * לכן ברירת המחדל מחליפה ביניהם בתצוגה בלבד.
         *
         * הטיסה עצמה נשארת נכונה:
         * W/Up = pitch
         * A/D = roll
         */
        orientationMode: "NORMAL" | "SWAP_PITCH_ROLL";
        modelHeadingOffsetDeg: number;
        modelPitchOffsetDeg: number;
        modelRollOffsetDeg: number;
        screenSizePx: number;
        screenOffsetYPx: number;
        lengthM: number;
        widthM: number;
        heightM: number;
    };
    flight: {
        minSpeedMps: number;
        maxSpeedMps: number;
        throttleAccelerationMps2: number;
        brakeAccelerationMps2: number;
        pitchStepDeg: number;
        rollStepDeg: number;
        maxPitchUpDeg: number;
        maxPitchDownDeg: number;
        maxRollDeg: number;
        levelStepFactor: number;
        turnPowerDegPerSec: number;
        yawTrimPowerDegPerSec: number;
        climbPower: number;
        minAltitudeAboveGroundM: number;
        maxAltitudeM: number;
    };
    camera: {
        enabled: boolean;
        /**
         * MANUAL_FORWARD_CHASE:
         * לא משתמש ב-Cesium lookAt שמבלבל כיוון.
         * בונה מצלמה ידנית מאחורי הטיל, ומסתכל קדימה לכיוון הטיסה.
         */
        mode: "MANUAL_FORWARD_CHASE" | "TOP";
        rangeBehindM: number;
        heightAboveM: number;
        lookAheadM: number;
        minRangeM: number;
        maxRangeM: number;
        /**
         * אם פעם מרגיש הפוך, שנה ל-180.
         * כרגע 0 = קדימה לפי כיוון הטיסה.
         */
        headingCameraOffsetDeg: number;
    };
    map: {
        mode: "ONLINE_ESRI" | "LOCAL_XYZ" | "CUSTOM" | "NONE";
        /** Primary URL for LOCAL_XYZ / CUSTOM — `{z}/{x}/{y}`. */
        tileUrl: string;
        onlineEsriUrl: string;
        /** @deprecated Use tileUrl. */
        localXyzUrl: string;
        urlTemplate: "XYZ" | "ESRI_YX";
    };
    terrain: {
        useCesiumWorldTerrain: boolean;
    };
    scene: {
        showSkyAtmosphere: boolean;
        showMoon: boolean;
        showSun: boolean;
        fogEnabled: boolean;
        depthTestAgainstTerrain: boolean;
    };
    annotations: {
        /** Top strip: speed, altitude, heading, pitch, roll. */
        hudTop: boolean;
        crosshair: boolean;
        attitudeIndicator: boolean;
        /** Bottom strip: lat, lng, altitude, trail length. */
        bottomTelemetry: boolean;
        controlsHelp: boolean;
        /** Cesium polyline trail behind aircraft. */
        trail: boolean;
        debugPanel: boolean;
    };
    trail: {
        /**
         * שובל קו בלבד.
         * משתמש ב-CallbackProperty כדי שהקו יתעדכן תמיד ולא ייעלם.
         */
        width: number;
        glowPower: number;
        maxPoints: number;
        minDistanceDeg: number;
        minAltitudeDeltaM: number;
        showPoints: boolean;
        pointPixelSize: number;
    };
};

type AnyObject = Record<string, any>;
type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends AnyObject ? DeepPartial<T[K]> : T[K];
};
declare function deepMerge<T extends AnyObject>(base: T, override?: DeepPartial<T>): T;

type FlightMode = "INTERNAL" | "EXTERNAL";
interface FlightTelemetry {
    latitude: number;
    longitude: number;
    altitudeM: number;
    speedMps?: number;
    headingDeg: number;
    pitchDeg: number;
    rollDeg: number;
    timestamp?: number;
}
interface FlightState {
    mode: FlightMode;
    latitude: number;
    longitude: number;
    altitudeM: number;
    speedMps: number;
    throttle: number;
    headingDeg: number;
    pitchDeg: number;
    rollDeg: number;
    paused: boolean;
    trail: [number, number, number][];
}
interface FlightInputs {
    accelerate: boolean;
    brake: boolean;
    yawLeft: boolean;
    yawRight: boolean;
}

type FlightViewMode = "FLIGHT_CAMERA" | "MAP_SIDE_CAMERA";

type SimulatorConfig$1 = typeof simulatorConfig;
interface FlightSimulatorWidgetProps {
    mode?: "INTERNAL" | "EXTERNAL";
    externalTelemetry?: FlightTelemetry;
    enableKeyboard?: boolean;
    /** Partial config merged onto {@link simulatorConfig} defaults. */
    configOverride?: DeepPartial<SimulatorConfig$1>;
    externalInputsRef?: MutableRefObject<FlightInputs>;
    initialViewMode?: FlightViewMode;
    className?: string;
}
declare function FlightSimulatorWidget(props: FlightSimulatorWidgetProps): react_jsx_runtime.JSX.Element;

declare function CesiumFlightSimulator(): react_jsx_runtime.JSX.Element;

declare function ExternalTelemetryExample(): react_jsx_runtime.JSX.Element;

type FlightSimulatorDisplayMode = "embedded" | "floating" | "fullscreen";
type FloatingAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
type MapMode = "ONLINE_ESRI" | "LOCAL_XYZ" | "CUSTOM" | "NONE";
/** Tile URL order: `{z}/{x}/{y}` (local XYZ) or `{z}/{y}/{x}` (ArcGIS REST). */
type MapUrlTemplate = "XYZ" | "ESRI_YX";
type WindowSize = number | "auto" | "100%";
interface WindowFloatingConfig {
    /** Anchor before the user drags the panel. */
    position: FloatingAnchor;
    draggable: boolean;
    title: string;
    margin: number;
    zIndex: number;
}
interface WindowConfig {
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
interface MapConfig {
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
interface AnnotationsConfig {
    hudTop: boolean;
    crosshair: boolean;
    attitudeIndicator: boolean;
    bottomTelemetry: boolean;
    controlsHelp: boolean;
    trail: boolean;
    debugPanel: boolean;
}
interface AircraftConfig {
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

/**
 * Resolves the imagery URL passed to Cesium `UrlTemplateImageryProvider`.
 */
declare function resolveMapTileUrl(map: MapConfig): string | null;

type SimulatorConfig = typeof simulatorConfig;

export { type AircraftConfig, type AnnotationsConfig, CesiumFlightSimulator, type DeepPartial, ExternalTelemetryExample, type FlightInputs, type FlightMode, type FlightSimulatorDisplayMode, FlightSimulatorWidget, type FlightSimulatorWidgetProps, type FlightState, type FlightTelemetry, type FlightViewMode, type FloatingAnchor, type MapConfig, type MapMode, type SimulatorConfig, type WindowConfig, deepMerge, resolveMapTileUrl, simulatorConfig };
