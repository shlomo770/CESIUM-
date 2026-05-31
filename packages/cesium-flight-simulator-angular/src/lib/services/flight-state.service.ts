import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { simulatorConfig } from "../config/simulatorConfig";
import type { FlightInputs, FlightState, FlightTelemetry } from "../types/flight";
import { clamp, lerp, movePoint, wrap360 } from "../utils/geo";

const start = simulatorConfig.start;
const cfg = simulatorConfig.flight;
const trailCfg = simulatorConfig.trail;

function createInitialState(): FlightState {
  return {
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
}

@Injectable()
export class FlightStateService {
  private readonly subject = new BehaviorSubject<FlightState>(createInitialState());
  readonly flight$ = this.subject.asObservable();

  get snapshot(): FlightState {
    return this.subject.value;
  }

  setMode(mode: "INTERNAL" | "EXTERNAL"): void {
    this.patch({ mode });
  }

  applyExternalTelemetry(telemetry: FlightTelemetry): void {
    const state = this.snapshot;
    const next: FlightState = {
      ...state,
      mode: "EXTERNAL",
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      altitudeM: telemetry.altitudeM,
      headingDeg: telemetry.headingDeg,
      pitchDeg: telemetry.pitchDeg,
      rollDeg: telemetry.rollDeg,
      speedMps: typeof telemetry.speedMps === "number" ? telemetry.speedMps : state.speedMps
    };
    this.pushTrail(next);
    this.subject.next(next);
  }

  tickFlight(dtSeconds: number, inputs: FlightInputs, terrainHeightM: number): void {
    const state = this.snapshot;
    if (state.paused || state.mode === "EXTERNAL") return;

    const dt = Math.min(dtSeconds, 0.05);

    let speedMps = state.speedMps;
    if (inputs.accelerate) speedMps += cfg.throttleAccelerationMps2 * dt;
    if (inputs.brake) speedMps -= cfg.brakeAccelerationMps2 * dt;
    speedMps = clamp(speedMps, cfg.minSpeedMps, cfg.maxSpeedMps);

    const yawInput = (inputs.yawRight ? 1 : 0) - (inputs.yawLeft ? 1 : 0);
    const yawTrimDegPerSec = yawInput * cfg.yawTrimPowerDegPerSec;
    const speedFactor = clamp(speedMps / 145, 0.45, 1.7);
    const turnFromRollDegPerSec =
      Math.sin((state.rollDeg * Math.PI) / 180) * cfg.turnPowerDegPerSec * speedFactor;

    const headingDeg = wrap360(state.headingDeg + (turnFromRollDegPerSec + yawTrimDegPerSec) * dt);
    const nextPoint = movePoint(state.latitude, state.longitude, headingDeg, speedMps * dt);

    const verticalSpeedMps =
      Math.sin((state.pitchDeg * Math.PI) / 180) * speedMps * cfg.climbPower;

    let altitudeM = state.altitudeM + verticalSpeedMps * dt;
    altitudeM = clamp(
      altitudeM,
      terrainHeightM + cfg.minAltitudeAboveGroundM,
      cfg.maxAltitudeM
    );

    const next: FlightState = {
      ...state,
      speedMps,
      throttle: (speedMps - cfg.minSpeedMps) / (cfg.maxSpeedMps - cfg.minSpeedMps),
      headingDeg,
      latitude: nextPoint.latitude,
      longitude: nextPoint.longitude,
      altitudeM
    };

    this.pushTrail(next);
    this.subject.next(next);
  }

  pitchUpStep(): void {
    if (this.snapshot.mode === "EXTERNAL") return;
    this.patchAttitude({ pitchDeg: clamp(this.snapshot.pitchDeg + cfg.pitchStepDeg, cfg.maxPitchDownDeg, cfg.maxPitchUpDeg) });
  }

  pitchDownStep(): void {
    if (this.snapshot.mode === "EXTERNAL") return;
    this.patchAttitude({ pitchDeg: clamp(this.snapshot.pitchDeg - cfg.pitchStepDeg, cfg.maxPitchDownDeg, cfg.maxPitchUpDeg) });
  }

  rollLeftStep(): void {
    if (this.snapshot.mode === "EXTERNAL") return;
    this.patchAttitude({ rollDeg: clamp(this.snapshot.rollDeg - cfg.rollStepDeg, -cfg.maxRollDeg, cfg.maxRollDeg) });
  }

  rollRightStep(): void {
    if (this.snapshot.mode === "EXTERNAL") return;
    this.patchAttitude({ rollDeg: clamp(this.snapshot.rollDeg + cfg.rollStepDeg, -cfg.maxRollDeg, cfg.maxRollDeg) });
  }

  levelAttitude(): void {
    if (this.snapshot.mode === "EXTERNAL") return;
    const state = this.snapshot;
    this.patchAttitude({
      pitchDeg: lerp(state.pitchDeg, 0, cfg.levelStepFactor),
      rollDeg: lerp(state.rollDeg, 0, cfg.levelStepFactor)
    });
  }

  resetFlight(): void {
    this.subject.next(createInitialState());
  }

  togglePause(): void {
    this.patch({ paused: !this.snapshot.paused });
  }

  private patchAttitude(partial: Partial<Pick<FlightState, "pitchDeg" | "rollDeg">>): void {
    const next = { ...this.snapshot, ...partial };
    this.pushTrail(next);
    this.subject.next(next);
  }

  private patch(partial: Partial<FlightState>): void {
    this.subject.next({ ...this.snapshot, ...partial });
  }

  private pushTrail(state: FlightState): void {
    const trail = state.trail.slice();
    const last = trail[trail.length - 1];
    const shouldPush =
      !last ||
      Math.abs(last[0] - state.longitude) > trailCfg.minDistanceDeg ||
      Math.abs(last[1] - state.latitude) > trailCfg.minDistanceDeg ||
      Math.abs(last[2] - state.altitudeM) > trailCfg.minAltitudeDeltaM;

    if (shouldPush) {
      trail.push([state.longitude, state.latitude, state.altitudeM]);
      if (trail.length > trailCfg.maxPoints) trail.shift();
    }

    state.trail = trail;
  }
}
