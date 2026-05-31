export type FlightMode = "INTERNAL" | "EXTERNAL";

export interface FlightTelemetry {
  latitude: number;
  longitude: number;
  altitudeM: number;
  speedMps?: number;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
  timestamp?: number;
}

export interface FlightState {
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

export interface FlightInputs {
  accelerate: boolean;
  brake: boolean;
  yawLeft: boolean;
  yawRight: boolean;
}
