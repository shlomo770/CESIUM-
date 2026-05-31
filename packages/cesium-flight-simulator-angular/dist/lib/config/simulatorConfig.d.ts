export declare const simulatorConfig: {
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
