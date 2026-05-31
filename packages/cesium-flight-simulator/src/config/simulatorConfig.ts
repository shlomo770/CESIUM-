export const simulatorConfig = {
  mode: "INTERNAL" as "INTERNAL" | "EXTERNAL",

  start: {
    latitude: 32.0853,
    longitude: 34.7818,
    altitudeM: 1200,
    headingDeg: 25,
    speedMps: 145
  },

  /**
   * Layout of the simulator widget in the host page.
   */
  window: {
    /** `fullscreen` | `embedded` (fixed box) | `floating` (draggable panel). */
    displayMode: "fullscreen" as "embedded" | "floating" | "fullscreen",
    width: "100%" as number | "auto" | "100%",
    height: "100%" as number | "auto" | "100%",
    floating: {
      position: "bottom-right" as
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
        | "center",
      draggable: true,
      title: "Cesium Flight Simulator",
      margin: 16,
      zIndex: 10000
    },
    showViewModeToggle: true
  },

  aircraft: {
    /**
     * המודל שהעלית, מומר ל־GLB מקומי.
     */
    renderMode: "GLTF" as "SCREEN_OVERLAY" | "SIMPLE_ENTITY" | "GLTF",
    modelUri: "/models/stealth_drone_perfect.glb",

    /**
     * גדול מספיק כדי לראות ברור.
     */
    scale: 90,
    minimumPixelSize: 130,
    maximumScale: 900,

    /**
     * תיקון חשוב:
     * במודל הזה Pitch/Roll נראו מוחלפים ב-Cesium.
     * לכן ברירת המחדל מחליפה ביניהם בתצוגה בלבד.
     *
     * הטיסה עצמה נשארת נכונה:
     * W/Up = pitch
     * A/D = roll
     */
    orientationMode: "SWAP_PITCH_ROLL" as "NORMAL" | "SWAP_PITCH_ROLL",

    modelHeadingOffsetDeg: 0,
    modelPitchOffsetDeg: 0,
    modelRollOffsetDeg: 0,

    screenSizePx: 150,
    screenOffsetYPx: 28,
    lengthM: 220,
    widthM: 150,
    heightM: 60
  },

  flight: {
    minSpeedMps: 55,
    maxSpeedMps: 310,
    throttleAccelerationMps2: 42,
    brakeAccelerationMps2: 55,
    pitchStepDeg: 2.5,
    rollStepDeg: 3.5,
    maxPitchUpDeg: 38,
    maxPitchDownDeg: -42,
    maxRollDeg: 75,
    levelStepFactor: 0.35,
    turnPowerDegPerSec: 34,
    yawTrimPowerDegPerSec: 9,
    climbPower: 0.92,
    minAltitudeAboveGroundM: 20,
    maxAltitudeM: 14000
  },

  camera: {
    enabled: true,

    /**
     * MANUAL_FORWARD_CHASE:
     * לא משתמש ב-Cesium lookAt שמבלבל כיוון.
     * בונה מצלמה ידנית מאחורי הטיל, ומסתכל קדימה לכיוון הטיסה.
     */
    mode: "MANUAL_FORWARD_CHASE" as "MANUAL_FORWARD_CHASE" | "TOP",

    rangeBehindM: 700,
    heightAboveM: 170,
    lookAheadM: 1400,

    minRangeM: 220,
    maxRangeM: 3800,

    /**
     * אם פעם מרגיש הפוך, שנה ל-180.
     * כרגע 0 = קדימה לפי כיוון הטיסה.
     */
    headingCameraOffsetDeg: 0
  },

  map: {
    mode: "ONLINE_ESRI" as "ONLINE_ESRI" | "LOCAL_XYZ" | "CUSTOM" | "NONE",
    /** Primary URL for LOCAL_XYZ / CUSTOM — `{z}/{x}/{y}`. */
    tileUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg",
    onlineEsriUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    /** @deprecated Use tileUrl. */
    localXyzUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg",
    urlTemplate: "XYZ" as "XYZ" | "ESRI_YX"
  },

  terrain: {
    useCesiumWorldTerrain: false
  },

  scene: {
    showSkyAtmosphere: false,
    showMoon: false,
    showSun: false,
    fogEnabled: false,
    depthTestAgainstTerrain: false
  },

  annotations: {
    /** Top strip: speed, altitude, heading, pitch, roll. */
    hudTop: true,
    crosshair: true,
    attitudeIndicator: true,
    /** Bottom strip: lat, lng, altitude, trail length. */
    bottomTelemetry: true,
    controlsHelp: false,
    /** Cesium polyline trail behind aircraft. */
    trail: true,
    debugPanel: false
  },

  trail: {
    /**
     * שובל קו בלבד.
     * משתמש ב-CallbackProperty כדי שהקו יתעדכן תמיד ולא ייעלם.
     */
    width: 12,
    glowPower: 0.38,
    maxPoints: 9000,
    minDistanceDeg: 0.000002,
    minAltitudeDeltaM: 0.1,
    showPoints: false,
    pointPixelSize: 0
  }
};
