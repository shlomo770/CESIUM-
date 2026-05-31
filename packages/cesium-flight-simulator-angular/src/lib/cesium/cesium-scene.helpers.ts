import {
  Cartesian3,
  HeadingPitchRange,
  HeadingPitchRoll,
  Math as CesiumMath,
  Matrix4,
  Transforms,
  Viewer
} from "cesium";
import { simulatorConfig } from "../config/simulatorConfig";
import type { FlightState } from "../types/flight";
import type { FlightViewMode } from "../types/viewMode";

export type ResolvedSimulatorConfig = typeof simulatorConfig;

export function makeGltfOrientation(
  position: Cartesian3,
  flight: FlightState,
  config: ResolvedSimulatorConfig
) {
  let visualPitch = flight.pitchDeg;
  let visualRoll = flight.rollDeg;

  if (config.aircraft.orientationMode === "SWAP_PITCH_ROLL") {
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

export function getTerrainHeightSafe(viewer: Viewer, longitude: number, latitude: number): number {
  try {
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
      Cartesian3.fromDegrees(longitude, latitude)
    );
    return viewer.scene.globe.getHeight(cartographic) ?? 0;
  } catch {
    return 0;
  }
}

export function buildGroundReferenceLine(flight: FlightState) {
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

  return { forward: forwardP, right: rightR, up: upR };
}

export function updateCamera(
  viewer: Viewer,
  flight: FlightState,
  config: ResolvedSimulatorConfig,
  viewMode: FlightViewMode
) {
  if (viewMode === "MAP_SIDE_CAMERA") {
    updateMapSideCamera(viewer, flight);
    return;
  }
  updateManualForwardCamera(viewer, flight, config);
}

function updateManualForwardCamera(
  viewer: Viewer,
  flight: FlightState,
  config: ResolvedSimulatorConfig
) {
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

function updateMapSideCamera(viewer: Viewer, flight: FlightState) {
  const trail = flight.trail;
  const current = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);

  if (trail.length < 2) {
    viewer.camera.lookAt(current, new HeadingPitchRange(0, CesiumMath.toRadians(-18), 2600));
    viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    return;
  }

  const first = trail[0];
  const last = trail[trail.length - 1];
  const firstPos = Cartesian3.fromDegrees(first[0], first[1], first[2]);
  const lastPos = Cartesian3.fromDegrees(last[0], last[1], last[2]);
  const center = Cartesian3.midpoint(firstPos, lastPos, new Cartesian3());
  const pathVector = Cartesian3.subtract(lastPos, firstPos, new Cartesian3());
  const pathLength = Math.max(Cartesian3.magnitude(pathVector), 1000);
  const pathDir = Cartesian3.normalize(pathVector, new Cartesian3());
  const up = Cartesian3.normalize(center, new Cartesian3());
  let side = Cartesian3.cross(pathDir, up, new Cartesian3());

  if (Cartesian3.magnitude(side) < 0.001) {
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
    orientation: { direction, up }
  });
}
