/**
 * @module types/telemetry
 * @description Type definitions for externally streamed flight telemetry.
 * The viewer is driven exclusively by these values; no onboard flight controls exist.
 */

/**
 * Complete telemetry snapshot consumed by the scene, camera, and HUD layers.
 * All angular values are expressed in degrees unless stated otherwise.
 */
export interface TelemetrySnapshot {
  /**
   * Pitch angle in degrees.
   * Positive values indicate nose-up attitude.
   */
  pitch: number;

  /**
   * Roll angle in degrees.
   * Positive values indicate right-wing-down attitude.
   */
  roll: number;

  /**
   * Yaw / magnetic heading in degrees, normalized to [0, 360).
   * Aviation convention: clockwise from north.
   */
  yaw: number;

  /**
   * Altitude above the reference datum in meters.
   * The reference (e.g. MSL, AGL) is defined by the telemetry source.
   */
  altitude: number;

  /**
   * Scalar speed in meters per second.
   * May represent ground speed or airspeed depending on the source.
   */
  speed: number;

  /** Optional WGS-84 latitude in decimal degrees. */
  latitude?: number;

  /** Optional WGS-84 longitude in decimal degrees. */
  longitude?: number;

  /**
   * Optional monotonic timestamp from the telemetry source in milliseconds.
   * Used for diagnostics and future interpolation strategies.
   */
  timestamp?: number;
}

/**
 * Partial telemetry update accepted by the public `updateTelemetry` API.
 * Omitted fields retain their previous values.
 *
 * `heading` is supported as an alias for `yaw`.
 */
export type TelemetryUpdatePayload = Partial<
  Omit<TelemetrySnapshot, "yaw">
> & {
  /** Alias for {@link TelemetrySnapshot.yaw}. */
  heading?: number;
  yaw?: number;
};

/**
 * Callback invoked when the telemetry store publishes a new snapshot.
 */
export type TelemetryListener = (snapshot: Readonly<TelemetrySnapshot>) => void;

/**
 * Unsubscribe function returned by {@link TelemetryState.subscribe}.
 */
export type TelemetryUnsubscribe = () => void;

/**
 * Default snapshot used when the consumer does not provide `initialTelemetry`.
 */
export const DEFAULT_TELEMETRY: Readonly<TelemetrySnapshot> = Object.freeze({
  pitch: 0,
  roll: 0,
  yaw: 0,
  altitude: 1000,
  speed: 0
});

/**
 * Normalizes a heading/yaw angle to the half-open interval [0, 360).
 *
 * @param degrees - Raw heading in degrees.
 * @returns Normalized heading in degrees.
 */
export function normalizeHeadingDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  return ((degrees % 360) + 360) % 360;
}

/**
 * Creates a defensive copy of a telemetry snapshot with normalized yaw.
 *
 * @param source - Input snapshot or partial snapshot.
 * @returns Fully populated {@link TelemetrySnapshot}.
 */
export function createTelemetrySnapshot(
  source: Partial<TelemetrySnapshot> = {}
): TelemetrySnapshot {
  return {
    pitch: source.pitch ?? DEFAULT_TELEMETRY.pitch,
    roll: source.roll ?? DEFAULT_TELEMETRY.roll,
    yaw: normalizeHeadingDegrees(source.yaw ?? DEFAULT_TELEMETRY.yaw),
    altitude: source.altitude ?? DEFAULT_TELEMETRY.altitude,
    speed: source.speed ?? DEFAULT_TELEMETRY.speed,
    latitude: source.latitude,
    longitude: source.longitude,
    timestamp: source.timestamp
  };
}

/**
 * Returns true when every required kinematic field is a finite number.
 *
 * @param payload - Candidate update payload.
 */
export function isValidTelemetryUpdate(
  payload: TelemetryUpdatePayload
): boolean {
  const numericKeys = [
    "pitch",
    "roll",
    "yaw",
    "heading",
    "altitude",
    "speed",
    "latitude",
    "longitude",
    "timestamp"
  ] as const;

  for (const key of numericKeys) {
    const value = payload[key];
    if (value !== undefined && !Number.isFinite(value)) {
      return false;
    }
  }

  return true;
}
