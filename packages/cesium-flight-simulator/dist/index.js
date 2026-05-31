import { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector, Provider } from 'react-redux';
import { createSlice, configureStore } from '@reduxjs/toolkit';
import { Ion, Viewer, EllipsoidTerrainProvider, UrlTemplateImageryProvider, CesiumTerrainProvider, Cartesian3, PolylineGlowMaterialProperty, CallbackProperty, Color, ConstantProperty, Transforms, HeadingPitchRoll, Math as Math$1, HeadingPitchRange, Matrix4 } from 'cesium';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

/* @cesium-suite/cesium-flight-simulator */


// src/config/simulatorConfig.ts
var simulatorConfig = {
  mode: "INTERNAL",
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
    displayMode: "fullscreen",
    width: "100%",
    height: "100%",
    floating: {
      position: "bottom-right",
      draggable: true,
      title: "Cesium Flight Simulator",
      margin: 16,
      zIndex: 1e4
    },
    showViewModeToggle: true
  },
  aircraft: {
    /**
     * המודל שהעלית, מומר ל־GLB מקומי.
     */
    renderMode: "GLTF",
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
    orientationMode: "SWAP_PITCH_ROLL",
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
    maxAltitudeM: 14e3
  },
  camera: {
    enabled: true,
    /**
     * MANUAL_FORWARD_CHASE:
     * לא משתמש ב-Cesium lookAt שמבלבל כיוון.
     * בונה מצלמה ידנית מאחורי הטיל, ומסתכל קדימה לכיוון הטיסה.
     */
    mode: "MANUAL_FORWARD_CHASE",
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
    mode: "ONLINE_ESRI",
    /** Primary URL for LOCAL_XYZ / CUSTOM — `{z}/{x}/{y}`. */
    tileUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg",
    onlineEsriUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    /** @deprecated Use tileUrl. */
    localXyzUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg",
    urlTemplate: "XYZ"
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
    maxPoints: 9e3,
    minDistanceDeg: 2e-6,
    minAltitudeDeltaM: 0.1,
    showPoints: false,
    pointPixelSize: 0
  }
};

// src/config/mergeConfig.ts
function deepMerge(base, override) {
  if (!override) return base;
  const result = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && typeof result[key] === "object" && result[key] !== null) {
      result[key] = deepMerge(result[key], value);
    } else if (value !== void 0) {
      result[key] = value;
    }
  });
  return result;
}

// src/utils/geo.ts
var EARTH_RADIUS_M = 6371e3;
function movePoint(latDeg, lngDeg, headingDeg, distanceM) {
  const lat1 = toRad(latDeg);
  const lon1 = toRad(lngDeg);
  const brng = toRad(headingDeg);
  const angular = distanceM / EARTH_RADIUS_M;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(angular) * Math.cos(lat1),
    Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
  );
  return {
    latitude: toDeg(lat2),
    longitude: (toDeg(lon2) + 540) % 360 - 180
  };
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function wrap360(value) {
  return (value % 360 + 360) % 360;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function toRad(deg) {
  return deg * Math.PI / 180;
}
function toDeg(rad) {
  return rad * 180 / Math.PI;
}

// src/store/flightSlice.ts
var start = simulatorConfig.start;
var cfg = simulatorConfig.flight;
var trailCfg = simulatorConfig.trail;
var initialState = {
  mode: simulatorConfig.mode,
  latitude: start.latitude,
  longitude: start.longitude,
  altitudeM: start.altitudeM,
  speedMps: start.speedMps,
  throttle: 0.55,
  headingDeg: start.headingDeg,
  pitchDeg: 0,
  rollDeg: 0,
  paused: false,
  trail: [[start.longitude, start.latitude, start.altitudeM]]
};
function pushTrail(state) {
  const last = state.trail[state.trail.length - 1];
  const shouldPush = !last || Math.abs(last[0] - state.longitude) > trailCfg.minDistanceDeg || Math.abs(last[1] - state.latitude) > trailCfg.minDistanceDeg || Math.abs(last[2] - state.altitudeM) > trailCfg.minAltitudeDeltaM;
  if (shouldPush) {
    state.trail.push([state.longitude, state.latitude, state.altitudeM]);
    if (state.trail.length > trailCfg.maxPoints) state.trail.shift();
  }
}
var flightSlice = createSlice({
  name: "flight",
  initialState,
  reducers: {
    tickFlight: (state, action) => {
      if (state.paused || state.mode === "EXTERNAL") return;
      const dt = Math.min(action.payload.dtSeconds, 0.05);
      const inputs = action.payload.inputs;
      if (inputs.accelerate) state.speedMps += cfg.throttleAccelerationMps2 * dt;
      if (inputs.brake) state.speedMps -= cfg.brakeAccelerationMps2 * dt;
      state.speedMps = clamp(state.speedMps, cfg.minSpeedMps, cfg.maxSpeedMps);
      state.throttle = (state.speedMps - cfg.minSpeedMps) / (cfg.maxSpeedMps - cfg.minSpeedMps);
      const yawInput = (inputs.yawRight ? 1 : 0) - (inputs.yawLeft ? 1 : 0);
      const yawTrimDegPerSec = yawInput * cfg.yawTrimPowerDegPerSec;
      const speedFactor = clamp(state.speedMps / 145, 0.45, 1.7);
      const turnFromRollDegPerSec = Math.sin(state.rollDeg * Math.PI / 180) * cfg.turnPowerDegPerSec * speedFactor;
      state.headingDeg = wrap360(
        state.headingDeg + (turnFromRollDegPerSec + yawTrimDegPerSec) * dt
      );
      const next = movePoint(state.latitude, state.longitude, state.headingDeg, state.speedMps * dt);
      state.latitude = next.latitude;
      state.longitude = next.longitude;
      const verticalSpeedMps = Math.sin(state.pitchDeg * Math.PI / 180) * state.speedMps * cfg.climbPower;
      state.altitudeM += verticalSpeedMps * dt;
      state.altitudeM = clamp(
        state.altitudeM,
        action.payload.terrainHeightM + cfg.minAltitudeAboveGroundM,
        cfg.maxAltitudeM
      );
      pushTrail(state);
    },
    applyExternalTelemetry: (state, action) => {
      const t = action.payload;
      state.mode = "EXTERNAL";
      state.latitude = t.latitude;
      state.longitude = t.longitude;
      state.altitudeM = t.altitudeM;
      state.headingDeg = t.headingDeg;
      state.pitchDeg = t.pitchDeg;
      state.rollDeg = t.rollDeg;
      if (typeof t.speedMps === "number") {
        state.speedMps = t.speedMps;
      }
      pushTrail(state);
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    pitchUpStep: (state) => {
      if (state.mode === "EXTERNAL") return;
      state.pitchDeg = clamp(state.pitchDeg + cfg.pitchStepDeg, cfg.maxPitchDownDeg, cfg.maxPitchUpDeg);
      pushTrail(state);
    },
    pitchDownStep: (state) => {
      if (state.mode === "EXTERNAL") return;
      state.pitchDeg = clamp(state.pitchDeg - cfg.pitchStepDeg, cfg.maxPitchDownDeg, cfg.maxPitchUpDeg);
      pushTrail(state);
    },
    rollLeftStep: (state) => {
      if (state.mode === "EXTERNAL") return;
      state.rollDeg = clamp(state.rollDeg - cfg.rollStepDeg, -cfg.maxRollDeg, cfg.maxRollDeg);
      pushTrail(state);
    },
    rollRightStep: (state) => {
      if (state.mode === "EXTERNAL") return;
      state.rollDeg = clamp(state.rollDeg + cfg.rollStepDeg, -cfg.maxRollDeg, cfg.maxRollDeg);
      pushTrail(state);
    },
    levelAttitude: (state) => {
      if (state.mode === "EXTERNAL") return;
      state.pitchDeg = lerp(state.pitchDeg, 0, cfg.levelStepFactor);
      state.rollDeg = lerp(state.rollDeg, 0, cfg.levelStepFactor);
      pushTrail(state);
    },
    clearTrail: (state) => {
      state.trail = [[state.longitude, state.latitude, state.altitudeM]];
    },
    resetFlight: () => initialState,
    togglePause: (state) => {
      state.paused = !state.paused;
    }
  }
});
var {
  tickFlight,
  applyExternalTelemetry,
  setMode,
  pitchUpStep,
  pitchDownStep,
  rollLeftStep,
  rollRightStep,
  levelAttitude,
  clearTrail,
  resetFlight,
  togglePause
} = flightSlice.actions;
var flightSlice_default = flightSlice.reducer;
var useAppDispatch = useDispatch.withTypes();

// src/hooks/useKeyboardControls.ts
function useKeyboardControls(enabled) {
  const dispatch = useAppDispatch();
  const inputsRef = useRef({
    accelerate: false,
    brake: false,
    yawLeft: false,
    yawRight: false
  });
  useEffect(() => {
    if (!enabled) return;
    const down = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          dispatch(pitchUpStep());
          break;
        case "ArrowDown":
        case "KeyS":
          dispatch(pitchDownStep());
          break;
        case "ArrowLeft":
        case "KeyA":
          dispatch(rollLeftStep());
          break;
        case "ArrowRight":
        case "KeyD":
          dispatch(rollRightStep());
          break;
        case "KeyQ":
          inputsRef.current.yawLeft = true;
          break;
        case "KeyE":
          inputsRef.current.yawRight = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          inputsRef.current.accelerate = true;
          break;
        case "ControlLeft":
        case "ControlRight":
          inputsRef.current.brake = true;
          break;
        case "KeyZ":
          dispatch(levelAttitude());
          break;
        case "Space":
          if (!e.repeat) {
            e.preventDefault();
            dispatch(resetFlight());
          }
          break;
        case "KeyP":
          if (!e.repeat) dispatch(togglePause());
          break;
      }
    };
    const up = (e) => {
      switch (e.code) {
        case "KeyQ":
          inputsRef.current.yawLeft = false;
          break;
        case "KeyE":
          inputsRef.current.yawRight = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          inputsRef.current.accelerate = false;
          break;
        case "ControlLeft":
        case "ControlRight":
          inputsRef.current.brake = false;
          break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [dispatch, enabled]);
  return inputsRef;
}
var store = configureStore({
  reducer: {
    flight: flightSlice_default
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false
  })
});

// src/config/resolveMapUrl.ts
function resolveMapTileUrl(map) {
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
var useAppSelector = useSelector.withTypes();
function CesiumScene({ inputsRef, config = simulatorConfig, viewMode = "FLIGHT_CAMERA" }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const aircraftRef = useRef(null);
  const trailRef = useRef(null);
  const sideCurrentRef = useRef(null);
  const sideGroundRef = useRef(null);
  const trailPositionsRef = useRef([]);
  const lastTickRef = useRef(performance.now());
  const dispatch = useAppDispatch();
  const flight = useAppSelector((s) => s.flight);
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (ionToken) Ion.defaultAccessToken = ionToken;
    const viewer = new Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: true,
      terrainProvider: new EllipsoidTerrainProvider()
    });
    viewerRef.current = viewer;
    viewer.imageryLayers.removeAll();
    const tileUrl = resolveMapTileUrl(config.map);
    if (tileUrl) {
      viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({ url: tileUrl }));
    }
    viewer.scene.globe.depthTestAgainstTerrain = config.scene.depthTestAgainstTerrain;
    viewer.scene.fog.enabled = config.scene.fogEnabled;
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = config.scene.showSkyAtmosphere;
    if (viewer.scene.sun) viewer.scene.sun.show = config.scene.showSun;
    if (viewer.scene.moon) viewer.scene.moon.show = config.scene.showMoon;
    if (config.terrain.useCesiumWorldTerrain && ionToken) {
      CesiumTerrainProvider.fromIonAssetId(1).then((terrain) => {
        if (!viewer.isDestroyed()) viewer.terrainProvider = terrain;
      }).catch(() => {
        if (!viewer.isDestroyed()) viewer.terrainProvider = new EllipsoidTerrainProvider();
      });
    }
    const start2 = store.getState().flight;
    const startPosition = Cartesian3.fromDegrees(start2.longitude, start2.latitude, start2.altitudeM);
    trailPositionsRef.current = [startPosition];
    if (config.aircraft.renderMode === "GLTF") {
      aircraftRef.current = viewer.entities.add({
        name: "AIM-120D Flight Object",
        position: startPosition,
        orientation: makeGltfOrientation(startPosition, start2, config),
        model: {
          uri: config.aircraft.modelUri,
          scale: config.aircraft.scale,
          minimumPixelSize: config.aircraft.minimumPixelSize,
          maximumScale: config.aircraft.maximumScale,
          runAnimations: false
        }
      });
    }
    trailRef.current = viewer.entities.add({
      name: "Flight Trail Line",
      polyline: {
        positions: new CallbackProperty(() => trailPositionsRef.current, false),
        width: config.trail.width,
        arcType: 0,
        material: new PolylineGlowMaterialProperty({
          glowPower: config.trail.glowPower,
          color: Color.CYAN.withAlpha(1)
        }),
        depthFailMaterial: Color.CYAN.withAlpha(1),
        show: config.annotations.trail
      }
    });
    sideCurrentRef.current = viewer.entities.add({
      name: "Side View Current Position Marker",
      point: {
        pixelSize: 15,
        color: Color.RED,
        outlineColor: Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      show: false
    });
    sideGroundRef.current = viewer.entities.add({
      name: "Side View Ground Reference",
      polyline: {
        positions: new ConstantProperty([]),
        width: 4,
        arcType: 0,
        material: Color.DARKGRAY.withAlpha(0.88),
        depthFailMaterial: Color.DARKGRAY.withAlpha(0.88)
      },
      show: false
    });
    viewer.clock.onTick.addEventListener(() => {
      const now = performance.now();
      const dtSeconds = (now - lastTickRef.current) / 1e3;
      lastTickRef.current = now;
      const current = store.getState().flight;
      const terrainHeightM = getTerrainHeightSafe(viewer, current.longitude, current.latitude);
      dispatch(tickFlight({ dtSeconds, inputs: inputsRef.current, terrainHeightM }));
    });
    updateCamera(viewer, start2, config, viewMode);
    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      aircraftRef.current = null;
      trailRef.current = null;
      sideCurrentRef.current = null;
      sideGroundRef.current = null;
      trailPositionsRef.current = [];
    };
  }, [dispatch, inputsRef, config]);
  useEffect(() => {
    const viewer = viewerRef.current;
    const aircraft = aircraftRef.current;
    const trail = trailRef.current;
    const sideCurrent = sideCurrentRef.current;
    const sideGround = sideGroundRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const position = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
    if (aircraft) {
      aircraft.position = position;
      aircraft.orientation = makeGltfOrientation(position, flight, config);
      aircraft.show = viewMode === "MAP_SIDE_CAMERA" || config.aircraft.renderMode === "GLTF";
    }
    trailPositionsRef.current = flight.trail.map(
      ([lng, lat, alt]) => Cartesian3.fromDegrees(lng, lat, alt)
    );
    if (trail) {
      trail.show = config.annotations.trail;
    }
    if (sideCurrent) {
      sideCurrent.position = position;
      sideCurrent.show = viewMode === "MAP_SIDE_CAMERA";
    }
    if (sideGround?.polyline) {
      const groundPositions = buildGroundReferenceLine(flight);
      sideGround.polyline.positions = new ConstantProperty(groundPositions);
      sideGround.show = viewMode === "MAP_SIDE_CAMERA";
    }
    if (config.camera.enabled) {
      updateCamera(viewer, flight, config, viewMode);
    }
  }, [flight, config, viewMode]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className: "cesium-container" });
}
function makeGltfOrientation(position, flight, config) {
  let visualPitch = flight.pitchDeg;
  let visualRoll = flight.rollDeg;
  if (config.aircraft.orientationMode === "SWAP_PITCH_ROLL") {
    visualPitch = flight.rollDeg;
    visualRoll = flight.pitchDeg;
  }
  return Transforms.headingPitchRollQuaternion(
    position,
    new HeadingPitchRoll(
      Math$1.toRadians(flight.headingDeg + config.aircraft.modelHeadingOffsetDeg),
      Math$1.toRadians(visualPitch + config.aircraft.modelPitchOffsetDeg),
      Math$1.toRadians(visualRoll + config.aircraft.modelRollOffsetDeg)
    )
  );
}
function getTerrainHeightSafe(viewer, longitude, latitude) {
  try {
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
      Cartesian3.fromDegrees(longitude, latitude)
    );
    return viewer.scene.globe.getHeight(cartographic) ?? 0;
  } catch {
    return 0;
  }
}
function buildGroundReferenceLine(flight) {
  if (flight.trail.length < 2) {
    return [
      Cartesian3.fromDegrees(flight.longitude - 0.01, flight.latitude, 0),
      Cartesian3.fromDegrees(flight.longitude + 0.01, flight.latitude, 0)
    ];
  }
  const first = flight.trail[0];
  const last = flight.trail[flight.trail.length - 1];
  return [
    Cartesian3.fromDegrees(first[0], first[1], 0),
    Cartesian3.fromDegrees(last[0], last[1], 0)
  ];
}
function getFlightAxes(center, headingDeg, pitchDeg, rollDeg) {
  const up = Cartesian3.normalize(center, new Cartesian3());
  const worldZ = new Cartesian3(0, 0, 1);
  let east = Cartesian3.cross(worldZ, up, new Cartesian3());
  if (Cartesian3.magnitude(east) < 1e-4) {
    east = new Cartesian3(1, 0, 0);
  } else {
    Cartesian3.normalize(east, east);
  }
  const north = Cartesian3.normalize(Cartesian3.cross(up, east, new Cartesian3()), new Cartesian3());
  const h = Math$1.toRadians(headingDeg);
  const pitch = Math$1.toRadians(pitchDeg);
  const roll = Math$1.toRadians(rollDeg);
  const forwardH = Cartesian3.add(
    Cartesian3.multiplyByScalar(east, Math.sin(h), new Cartesian3()),
    Cartesian3.multiplyByScalar(north, Math.cos(h), new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.normalize(forwardH, forwardH);
  const rightH = Cartesian3.add(
    Cartesian3.multiplyByScalar(east, Math.cos(h), new Cartesian3()),
    Cartesian3.multiplyByScalar(north, -Math.sin(h), new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.normalize(rightH, rightH);
  const forwardP = Cartesian3.add(
    Cartesian3.multiplyByScalar(forwardH, Math.cos(pitch), new Cartesian3()),
    Cartesian3.multiplyByScalar(up, Math.sin(pitch), new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.normalize(forwardP, forwardP);
  const upP = Cartesian3.add(
    Cartesian3.multiplyByScalar(forwardH, -Math.sin(pitch), new Cartesian3()),
    Cartesian3.multiplyByScalar(up, Math.cos(pitch), new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.normalize(upP, upP);
  const rightR = Cartesian3.add(
    Cartesian3.multiplyByScalar(rightH, Math.cos(roll), new Cartesian3()),
    Cartesian3.multiplyByScalar(upP, -Math.sin(roll), new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.normalize(rightR, rightR);
  const upR = Cartesian3.add(
    Cartesian3.multiplyByScalar(rightH, Math.sin(roll), new Cartesian3()),
    Cartesian3.multiplyByScalar(upP, Math.cos(roll), new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.normalize(upR, upR);
  return { forward: forwardP, right: rightR, up: upR };
}
function updateCamera(viewer, flight, config, viewMode) {
  if (viewMode === "MAP_SIDE_CAMERA") {
    updateMapSideCamera(viewer, flight);
    return;
  }
  updateManualForwardCamera(viewer, flight, config);
}
function updateManualForwardCamera(viewer, flight, config) {
  const target = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
  const axes = getFlightAxes(
    target,
    flight.headingDeg + config.camera.headingCameraOffsetDeg,
    flight.pitchDeg,
    flight.rollDeg
  );
  const cameraPosition = Cartesian3.add(
    target,
    Cartesian3.multiplyByScalar(axes.forward, -config.camera.rangeBehindM, new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.add(
    cameraPosition,
    Cartesian3.multiplyByScalar(axes.up, config.camera.heightAboveM, new Cartesian3()),
    cameraPosition
  );
  const lookAt = Cartesian3.add(
    target,
    Cartesian3.multiplyByScalar(axes.forward, config.camera.lookAheadM, new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.add(
    lookAt,
    Cartesian3.multiplyByScalar(axes.up, flight.pitchDeg * 3, new Cartesian3()),
    lookAt
  );
  const direction = Cartesian3.normalize(
    Cartesian3.subtract(lookAt, cameraPosition, new Cartesian3()),
    new Cartesian3()
  );
  viewer.camera.setView({
    destination: cameraPosition,
    orientation: { direction, up: axes.up }
  });
}
function updateMapSideCamera(viewer, flight) {
  const trail = flight.trail;
  const current = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
  if (trail.length < 2) {
    viewer.camera.lookAt(current, new HeadingPitchRange(0, Math$1.toRadians(-18), 2600));
    viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    return;
  }
  const first = trail[0];
  const last = trail[trail.length - 1];
  const firstPos = Cartesian3.fromDegrees(first[0], first[1], first[2]);
  const lastPos = Cartesian3.fromDegrees(last[0], last[1], last[2]);
  const center = Cartesian3.midpoint(firstPos, lastPos, new Cartesian3());
  const pathVector = Cartesian3.subtract(lastPos, firstPos, new Cartesian3());
  const pathLength = Math.max(Cartesian3.magnitude(pathVector), 1e3);
  const pathDir = Cartesian3.normalize(pathVector, new Cartesian3());
  const up = Cartesian3.normalize(center, new Cartesian3());
  let side = Cartesian3.cross(pathDir, up, new Cartesian3());
  if (Cartesian3.magnitude(side) < 1e-3) {
    side = Cartesian3.cross(pathDir, new Cartesian3(0, 0, 1), new Cartesian3());
  }
  Cartesian3.normalize(side, side);
  const maxAlt = Math.max(...trail.map((p) => p[2]), flight.altitudeM);
  const minAlt = Math.min(...trail.map((p) => p[2]), flight.altitudeM);
  const altitudeSpan = Math.max(300, maxAlt - minAlt);
  const sideDistance = Math.max(1700, pathLength * 1.25);
  const upDistance = Math.max(550, altitudeSpan * 0.85);
  const cameraPosition = Cartesian3.add(
    center,
    Cartesian3.multiplyByScalar(side, sideDistance, new Cartesian3()),
    new Cartesian3()
  );
  Cartesian3.add(
    cameraPosition,
    Cartesian3.multiplyByScalar(up, upDistance, new Cartesian3()),
    cameraPosition
  );
  const lookAt = Cartesian3.add(
    center,
    Cartesian3.multiplyByScalar(up, altitudeSpan * 0.18, new Cartesian3()),
    new Cartesian3()
  );
  const direction = Cartesian3.normalize(
    Cartesian3.subtract(lookAt, cameraPosition, new Cartesian3()),
    new Cartesian3()
  );
  viewer.camera.setView({
    destination: cameraPosition,
    orientation: {
      direction,
      up
    }
  });
}
function fmt(value, decimals = 0) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}
function HudOverlay({ config = simulatorConfig, viewMode = "FLIGHT_CAMERA" }) {
  const flight = useAppSelector((s) => s.flight);
  const annotations = config.annotations;
  return /* @__PURE__ */ jsxs("div", { className: "hud", children: [
    annotations.hudTop && /* @__PURE__ */ jsxs("div", { className: "hud-top", children: [
      /* @__PURE__ */ jsxs("div", { className: "hud-card", children: [
        /* @__PURE__ */ jsx("span", { children: "SPD" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          fmt(flight.speedMps * 3.6),
          " km/h"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hud-card", children: [
        /* @__PURE__ */ jsx("span", { children: "ALT" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          fmt(flight.altitudeM),
          " m"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hud-card", children: [
        /* @__PURE__ */ jsx("span", { children: "HDG" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          fmt(flight.headingDeg),
          "\xB0"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hud-card", children: [
        /* @__PURE__ */ jsx("span", { children: "PITCH" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          fmt(flight.pitchDeg, 1),
          "\xB0"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hud-card", children: [
        /* @__PURE__ */ jsx("span", { children: "ROLL" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          fmt(flight.rollDeg, 1),
          "\xB0"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hud-card", children: [
        /* @__PURE__ */ jsx("span", { children: "VIEW" }),
        /* @__PURE__ */ jsx("strong", { children: viewMode === "FLIGHT_CAMERA" ? "FLIGHT" : "SIDE" })
      ] })
    ] }),
    viewMode === "FLIGHT_CAMERA" && (annotations.crosshair || annotations.attitudeIndicator) && /* @__PURE__ */ jsxs("div", { className: "hud-center", children: [
      annotations.crosshair && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "crosshair horizontal" }),
        /* @__PURE__ */ jsx("div", { className: "crosshair vertical" }),
        /* @__PURE__ */ jsx("div", { className: "center-dot" })
      ] }),
      annotations.attitudeIndicator && /* @__PURE__ */ jsx(
        "div",
        {
          className: "attitude-line",
          style: {
            transform: `rotate(${-flight.rollDeg}deg) translateY(${-flight.pitchDeg * 1.25}px)`
          }
        }
      )
    ] }),
    annotations.bottomTelemetry && /* @__PURE__ */ jsxs("div", { className: "hud-bottom", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        "LAT ",
        fmt(flight.latitude, 5)
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        "LNG ",
        fmt(flight.longitude, 5)
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        "ALT ",
        fmt(flight.altitudeM),
        "m"
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        "TRAIL ",
        flight.trail.length
      ] }),
      flight.paused && /* @__PURE__ */ jsx("div", { className: "pause-pill", children: "PAUSED" })
    ] })
  ] });
}
function ScreenAircraftOverlay({ config = simulatorConfig, viewMode = "FLIGHT_CAMERA" }) {
  const flight = useAppSelector((s) => s.flight);
  if (viewMode !== "FLIGHT_CAMERA") return null;
  if (config.aircraft.renderMode !== "SCREEN_OVERLAY") return null;
  const size = config.aircraft.screenSizePx;
  const pitchOffset = -flight.pitchDeg * 1.05;
  const rollDeg = -flight.rollDeg;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "screen-aircraft-layer",
      style: {
        transform: `translate(-50%, calc(-50% + ${config.aircraft.screenOffsetYPx + pitchOffset}px)) rotate(${rollDeg}deg)`,
        width: `${size}px`,
        height: `${size}px`
      },
      children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 200 200", className: "screen-aircraft-svg", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grayBody", x1: "0", x2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#6b7280" }),
          /* @__PURE__ */ jsx("stop", { offset: "50%", stopColor: "#d1d5db" }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#6b7280" })
        ] }) }),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M100 12 C111 42 121 72 122 104 L113 166 L100 190 L87 166 L78 104 C79 72 89 42 100 12 Z",
            fill: "url(#grayBody)",
            stroke: "#111827",
            strokeWidth: "5"
          }
        ),
        /* @__PURE__ */ jsx("path", { d: "M83 128 L43 160 L90 149 Z", fill: "#9ca3af", stroke: "#111827", strokeWidth: "5" }),
        /* @__PURE__ */ jsx("path", { d: "M117 128 L157 160 L110 149 Z", fill: "#9ca3af", stroke: "#111827", strokeWidth: "5" })
      ] })
    }
  );
}
function ViewModeToggle({ value, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "view-mode-toggle", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        className: value === "FLIGHT_CAMERA" ? "active" : "",
        onClick: () => onChange("FLIGHT_CAMERA"),
        children: "\u05DE\u05E6\u05DC\u05DE\u05EA \u05D8\u05D9\u05E1\u05D4"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: value === "MAP_SIDE_CAMERA" ? "active" : "",
        onClick: () => onChange("MAP_SIDE_CAMERA"),
        children: "\u05E6\u05D3 \u05D1\u05EA\u05D5\u05DA \u05D4\u05DE\u05E4\u05D4"
      }
    )
  ] });
}
function useFloatingDrag({ enabled, shellRef, handleRef, margin }) {
  useEffect(() => {
    if (!enabled) return;
    const shell = shellRef.current;
    const handle = handleRef.current;
    if (!shell || !handle) return;
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    const onMouseDown = (event) => {
      if (event.button !== 0) return;
      dragging = true;
      handle.setAttribute("aria-grabbed", "true");
      const rect = shell.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      shell.style.transform = "none";
      shell.style.left = `${rect.left}px`;
      shell.style.top = `${rect.top}px`;
      shell.style.right = "auto";
      shell.style.bottom = "auto";
      event.preventDefault();
    };
    const onMouseMove = (event) => {
      if (!dragging) return;
      const maxLeft = window.innerWidth - shell.offsetWidth - margin;
      const maxTop = window.innerHeight - shell.offsetHeight - margin;
      const left = Math.min(Math.max(margin, event.clientX - offsetX), maxLeft);
      const top = Math.min(Math.max(margin, event.clientY - offsetY), maxTop);
      shell.style.left = `${left}px`;
      shell.style.top = `${top}px`;
    };
    const onMouseUp = () => {
      dragging = false;
      handle.setAttribute("aria-grabbed", "false");
    };
    handle.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [enabled, margin, shellRef, handleRef]);
}
var DEFAULT_FLOATING_WIDTH = 960;
var DEFAULT_FLOATING_HEIGHT = 640;
function sizeToCss(value) {
  if (value === "auto") return "auto";
  if (value === "100%") return "100%";
  return `${value}px`;
}
function resolvePixelSize(value, fallback) {
  return typeof value === "number" ? value : fallback;
}
function anchorStyles(position, margin) {
  const m = `${margin}px`;
  switch (position) {
    case "top-left":
      return { top: m, left: m, right: "auto", bottom: "auto" };
    case "top-right":
      return { top: m, right: m, left: "auto", bottom: "auto" };
    case "bottom-left":
      return { bottom: m, left: m, top: "auto", right: "auto" };
    case "bottom-right":
      return { bottom: m, right: m, top: "auto", left: "auto" };
    case "center":
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        right: "auto",
        bottom: "auto"
      };
    default:
      return { bottom: m, right: m };
  }
}
function WidgetShell({ windowConfig, className, children }) {
  const shellRef = useRef(null);
  const handleRef = useRef(null);
  useFloatingDrag({
    enabled: windowConfig.displayMode === "floating" && windowConfig.floating.draggable,
    shellRef,
    handleRef,
    margin: windowConfig.floating.margin
  });
  const embeddedStyle = useMemo(
    () => ({
      width: sizeToCss(windowConfig.width),
      height: sizeToCss(windowConfig.height)
    }),
    [windowConfig.width, windowConfig.height]
  );
  if (windowConfig.displayMode === "floating") {
    const { floating } = windowConfig;
    const widthPx = resolvePixelSize(windowConfig.width, DEFAULT_FLOATING_WIDTH);
    const heightPx = resolvePixelSize(windowConfig.height, DEFAULT_FLOATING_HEIGHT);
    return /* @__PURE__ */ jsx("div", { className: "cfs-floating-root", style: { zIndex: floating.zIndex }, children: /* @__PURE__ */ jsxs(
      "div",
      {
        ref: shellRef,
        className: "cfs-floating-shell",
        style: {
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          ...anchorStyles(floating.position, floating.margin)
        },
        role: "dialog",
        "aria-label": floating.title,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              ref: handleRef,
              className: `cfs-floating-header${floating.draggable ? " is-draggable" : ""}`,
              "aria-grabbed": "false",
              children: floating.title
            }
          ),
          /* @__PURE__ */ jsx("div", { className: `sim-root sim-root--floating ${className ?? ""}`.trim(), children })
        ]
      }
    ) });
  }
  const rootClass = windowConfig.displayMode === "embedded" ? `sim-root sim-root--embedded ${className ?? ""}`.trim() : className ?? "sim-root";
  return /* @__PURE__ */ jsx("div", { className: rootClass, style: windowConfig.displayMode === "embedded" ? embeddedStyle : void 0, children });
}
function InternalWidget({
  mode,
  externalTelemetry,
  enableKeyboard = true,
  configOverride,
  externalInputsRef,
  initialViewMode = "FLIGHT_CAMERA",
  className
}) {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const dispatch = useAppDispatch();
  const mergedConfig = useMemo(
    () => deepMerge(simulatorConfig, configOverride),
    [configOverride]
  );
  const keyboardInputsRef = useKeyboardControls(enableKeyboard && (mode ?? mergedConfig.mode) === "INTERNAL");
  const inputsRef = externalInputsRef ?? keyboardInputsRef;
  useEffect(() => {
    dispatch(setMode(mode ?? mergedConfig.mode));
  }, [dispatch, mode, mergedConfig.mode]);
  useEffect(() => {
    if ((mode ?? mergedConfig.mode) === "EXTERNAL" && externalTelemetry) {
      dispatch(applyExternalTelemetry(externalTelemetry));
    }
  }, [dispatch, mode, mergedConfig.mode, externalTelemetry]);
  return /* @__PURE__ */ jsxs(WidgetShell, { windowConfig: mergedConfig.window, className, children: [
    /* @__PURE__ */ jsx(CesiumScene, { inputsRef, config: mergedConfig, viewMode }),
    /* @__PURE__ */ jsx(ScreenAircraftOverlay, { config: mergedConfig, viewMode }),
    /* @__PURE__ */ jsx(HudOverlay, { config: mergedConfig, viewMode }),
    mergedConfig.window.showViewModeToggle && /* @__PURE__ */ jsx(ViewModeToggle, { value: viewMode, onChange: setViewMode })
  ] });
}
function FlightSimulatorWidget(props) {
  return /* @__PURE__ */ jsx(Provider, { store, children: /* @__PURE__ */ jsx(InternalWidget, { ...props }) });
}
function CesiumFlightSimulator() {
  return /* @__PURE__ */ jsx(FlightSimulatorWidget, {});
}
function ExternalTelemetryExample() {
  const [telemetry, setTelemetry] = useState({
    latitude: 32.0853,
    longitude: 34.7818,
    altitudeM: 1200,
    speedMps: 160,
    headingDeg: 25,
    pitchDeg: 0,
    rollDeg: 0
  });
  const configOverride = useMemo(
    () => ({
      mode: "EXTERNAL",
      annotations: {
        controlsHelp: false,
        debugPanel: true
      }
    }),
    []
  );
  return /* @__PURE__ */ jsx(
    FlightSimulatorWidget,
    {
      mode: "EXTERNAL",
      externalTelemetry: telemetry,
      enableKeyboard: false,
      configOverride
    }
  );
}

export { CesiumFlightSimulator, ExternalTelemetryExample, FlightSimulatorWidget, deepMerge, resolveMapTileUrl, simulatorConfig };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map