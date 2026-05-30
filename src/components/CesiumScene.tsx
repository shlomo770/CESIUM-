import { MutableRefObject, useEffect, useRef } from "react";
import {
  CallbackProperty,
  Cartesian3,
  CesiumTerrainProvider,
  Color,
  EllipsoidTerrainProvider,
  Entity,
  HeadingPitchRange,
  HeadingPitchRoll,
  Ion,
  Math as CesiumMath,
  Matrix4,
  PolylineGlowMaterialProperty,
  Transforms,
  UrlTemplateImageryProvider,
  Viewer
} from "cesium";
import { simulatorConfig } from "../config/simulatorConfig";
import { tickFlight } from "../store/flightSlice";
import type { FlightInputs, FlightState } from "../types/flight";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { store } from "../store/store";

interface Props {
  inputsRef: MutableRefObject<FlightInputs>;
  config?: typeof simulatorConfig;
}

export default function CesiumScene({ inputsRef, config = simulatorConfig }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const aircraftRef = useRef<Entity | null>(null);
  const trailRef = useRef<Entity | null>(null);
  const trailPositionsRef = useRef<Cartesian3[]>([]);
  const lastTickRef = useRef<number>(performance.now());
  const dispatch = useAppDispatch();
  const flight = useAppSelector((s) => s.flight);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined;
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

    if (config.map.mode === "ONLINE_ESRI") {
      viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({ url: config.map.onlineEsriUrl }));
    }

    if (config.map.mode === "LOCAL_XYZ") {
      viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({ url: config.map.localXyzUrl }));
    }

    viewer.scene.globe.depthTestAgainstTerrain = config.scene.depthTestAgainstTerrain;
    viewer.scene.fog.enabled = config.scene.fogEnabled;
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = config.scene.showSkyAtmosphere;
    if (viewer.scene.sun) viewer.scene.sun.show = config.scene.showSun;
    if (viewer.scene.moon) viewer.scene.moon.show = config.scene.showMoon;

    if (config.terrain.useCesiumWorldTerrain && ionToken) {
      CesiumTerrainProvider.fromIonAssetId(1)
        .then((terrain) => {
          if (!viewer.isDestroyed()) viewer.terrainProvider = terrain;
        })
        .catch(() => {
          if (!viewer.isDestroyed()) viewer.terrainProvider = new EllipsoidTerrainProvider();
        });
    }

    const start = store.getState().flight;
    const startPosition = Cartesian3.fromDegrees(start.longitude, start.latitude, start.altitudeM);
    trailPositionsRef.current = [startPosition];

    if (config.aircraft.renderMode === "GLTF") {
      aircraftRef.current = viewer.entities.add({
        name: "AIM-120D Flight Object",
        position: startPosition,
        orientation: makeGltfOrientation(startPosition, start, config),
        model: {
          uri: config.aircraft.modelUri,
          scale: config.aircraft.scale,
          minimumPixelSize: config.aircraft.minimumPixelSize,
          maximumScale: config.aircraft.maximumScale,
          runAnimations: false
        }
      });
    }

    const trail = viewer.entities.add({
      name: "Always Visible Flight Trail Line",
      polyline: {
        positions: new CallbackProperty(() => trailPositionsRef.current, false) as unknown as any,
        width: config.trail.width,
        arcType: 0 as any,
        material: new PolylineGlowMaterialProperty({
          glowPower: config.trail.glowPower,
          color: Color.CYAN.withAlpha(1)
        }),
        depthFailMaterial: Color.CYAN.withAlpha(1),
        show: config.annotations.trail
      }
    });

    trailRef.current = trail;

    viewer.clock.onTick.addEventListener(() => {
      const now = performance.now();
      const dtSeconds = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const current = store.getState().flight;
      const terrainHeightM = getTerrainHeightSafe(viewer, current.longitude, current.latitude);

      dispatch(tickFlight({ dtSeconds, inputs: inputsRef.current, terrainHeightM }));
    });

    updateManualForwardCamera(viewer, start, config);

    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      aircraftRef.current = null;
      trailRef.current = null;
      trailPositionsRef.current = [];
    };
  }, [dispatch, inputsRef, config]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const aircraft = aircraftRef.current;
    const trail = trailRef.current;

    if (!viewer || viewer.isDestroyed()) return;

    const position = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);

    if (aircraft) {
      aircraft.position = position as unknown as any;
      aircraft.orientation = makeGltfOrientation(position, flight, config) as unknown as any;
    }

    trailPositionsRef.current = flight.trail.map(([lng, lat, alt]) =>
      Cartesian3.fromDegrees(lng, lat, alt)
    );

    if (trail) {
      trail.show = config.annotations.trail;
    }

    if (config.camera.enabled) {
      updateManualForwardCamera(viewer, flight, config);
    }
  }, [flight, config]);

  return <div ref={containerRef} className="cesium-container" />;
}

function makeGltfOrientation(position: Cartesian3, flight: FlightState, config: typeof simulatorConfig) {
  let visualPitch = flight.pitchDeg;
  let visualRoll = flight.rollDeg;

  if (config.aircraft.orientationMode === "SWAP_PITCH_ROLL") {
    /**
     * תיקון למודל AIM-120D:
     * בקונבנציה של המודל/Cesium, Pitch/Roll נראו מוחלפים.
     * לכן רק התצוגה מוחלפת.
     */
    visualPitch = flight.rollDeg;
    visualRoll = flight.pitchDeg;
  }

  return Transforms.headingPitchRollQuaternion(
    position,
    new HeadingPitchRoll(
      CesiumMath.toRadians(flight.headingDeg + config.aircraft.modelHeadingOffsetDeg),
      CesiumMath.toRadians(visualPitch + config.aircraft.modelPitchOffsetDeg),
      CesiumMath.toRadians(visualRoll + config.aircraft.modelRollOffsetDeg)
    )
  );
}

function getTerrainHeightSafe(viewer: Viewer, longitude: number, latitude: number): number {
  try {
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
      Cartesian3.fromDegrees(longitude, latitude)
    );
    return viewer.scene.globe.getHeight(cartographic) ?? 0;
  } catch {
    return 0;
  }
}

function getFlightAxes(center: Cartesian3, headingDeg: number, pitchDeg: number, rollDeg: number) {
  const up = Cartesian3.normalize(center, new Cartesian3());

  const worldZ = new Cartesian3(0, 0, 1);
  let east = Cartesian3.cross(worldZ, up, new Cartesian3());

  if (Cartesian3.magnitude(east) < 0.0001) {
    east = new Cartesian3(1, 0, 0);
  } else {
    Cartesian3.normalize(east, east);
  }

  const north = Cartesian3.normalize(Cartesian3.cross(up, east, new Cartesian3()), new Cartesian3());

  const h = CesiumMath.toRadians(headingDeg);
  const pitch = CesiumMath.toRadians(pitchDeg);
  const roll = CesiumMath.toRadians(rollDeg);

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

  return {
    forward: forwardP,
    right: rightR,
    up: upR
  };
}

function updateManualForwardCamera(viewer: Viewer, flight: FlightState, config: typeof simulatorConfig) {
  if (config.camera.mode === "TOP") {
    const target = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
    viewer.camera.lookAt(target, new HeadingPitchRange(0, CesiumMath.toRadians(-90), config.camera.maxRangeM));
    viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    return;
  }

  const target = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
  const axes = getFlightAxes(
    target,
    flight.headingDeg + config.camera.headingCameraOffsetDeg,
    flight.pitchDeg,
    flight.rollDeg
  );

  const cameraOffsetBehind = Cartesian3.multiplyByScalar(
    axes.forward,
    -config.camera.rangeBehindM,
    new Cartesian3()
  );

  const cameraOffsetUp = Cartesian3.multiplyByScalar(
    axes.up,
    config.camera.heightAboveM,
    new Cartesian3()
  );

  const cameraPosition = Cartesian3.add(target, cameraOffsetBehind, new Cartesian3());
  Cartesian3.add(cameraPosition, cameraOffsetUp, cameraPosition);

  const lookAheadOffset = Cartesian3.multiplyByScalar(
    axes.forward,
    config.camera.lookAheadM,
    new Cartesian3()
  );

  const lookAt = Cartesian3.add(target, lookAheadOffset, new Cartesian3());
  Cartesian3.add(lookAt, Cartesian3.multiplyByScalar(axes.up, flight.pitchDeg * 3, new Cartesian3()), lookAt);

  const direction = Cartesian3.normalize(
    Cartesian3.subtract(lookAt, cameraPosition, new Cartesian3()),
    new Cartesian3()
  );

  viewer.camera.setView({
    destination: cameraPosition,
    orientation: {
      direction,
      up: axes.up
    }
  });
}
