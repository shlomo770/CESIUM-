import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { simulatorConfig } from "../config/simulatorConfig";
import type { FlightInputs, FlightState, FlightTelemetry } from "../types/flight";
import { clamp, lerp, movePoint, wrap360 } from "../utils/geo";

const start = simulatorConfig.start;
const cfg = simulatorConfig.flight;
const trailCfg = simulatorConfig.trail;

const initialState: FlightState = {
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

function pushTrail(state: FlightState) {
  const last = state.trail[state.trail.length - 1];

  const shouldPush =
    !last ||
    Math.abs(last[0] - state.longitude) > trailCfg.minDistanceDeg ||
    Math.abs(last[1] - state.latitude) > trailCfg.minDistanceDeg ||
    Math.abs(last[2] - state.altitudeM) > trailCfg.minAltitudeDeltaM;

  if (shouldPush) {
    state.trail.push([state.longitude, state.latitude, state.altitudeM]);
    if (state.trail.length > trailCfg.maxPoints) state.trail.shift();
  }
}

const flightSlice = createSlice({
  name: "flight",
  initialState,
  reducers: {
    tickFlight: (
      state,
      action: PayloadAction<{
        dtSeconds: number;
        inputs: FlightInputs;
        terrainHeightM: number;
      }>
    ) => {
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
      const turnFromRollDegPerSec =
        Math.sin((state.rollDeg * Math.PI) / 180) * cfg.turnPowerDegPerSec * speedFactor;

      state.headingDeg = wrap360(
        state.headingDeg + (turnFromRollDegPerSec + yawTrimDegPerSec) * dt
      );

      const next = movePoint(state.latitude, state.longitude, state.headingDeg, state.speedMps * dt);

      state.latitude = next.latitude;
      state.longitude = next.longitude;

      const verticalSpeedMps =
        Math.sin((state.pitchDeg * Math.PI) / 180) * state.speedMps * cfg.climbPower;

      state.altitudeM += verticalSpeedMps * dt;
      state.altitudeM = clamp(
        state.altitudeM,
        action.payload.terrainHeightM + cfg.minAltitudeAboveGroundM,
        cfg.maxAltitudeM
      );

      pushTrail(state);
    },

    applyExternalTelemetry: (state, action: PayloadAction<FlightTelemetry>) => {
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

    setMode: (state, action: PayloadAction<"INTERNAL" | "EXTERNAL">) => {
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

export const {
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

export default flightSlice.reducer;
