/**
 * @module core/TelemetryState
 * @description Single source of truth for externally driven flight telemetry.
 *
 * This store never accepts keyboard, pointer, or other onboard flight inputs.
 * Only {@link TelemetryState.applyUpdate} and {@link TelemetryState.replace}
 * mutate internal state.
 */

import type {
  TelemetryListener,
  TelemetrySnapshot,
  TelemetryUnsubscribe,
  TelemetryUpdatePayload
} from "../types/telemetry";
import {
  createTelemetrySnapshot,
  isValidTelemetryUpdate,
  normalizeHeadingDegrees
} from "../types/telemetry";

/**
 * Options for constructing a {@link TelemetryState} instance.
 */
export interface TelemetryStateOptions {
  /**
   * Initial snapshot. When omitted, library defaults are used.
   */
  initial?: Partial<TelemetrySnapshot>;

  /**
   * When `true`, {@link applyUpdate} throws on non-finite numeric values.
   * @defaultValue true
   */
  strictValidation?: boolean;
}

/**
 * Read-only store and pub/sub hub for telemetry snapshots.
 *
 * @example
 * ```ts
 * const state = new TelemetryState({ initial: { altitude: 1200, speed: 60 } });
 *
 * const unsubscribe = state.subscribe((snapshot) => {
 *   console.log(snapshot.pitch, snapshot.roll);
 * });
 *
 * state.applyUpdate({ pitch: 5, roll: -10, heading: 270 });
 *
 * unsubscribe();
 * ```
 */
export class TelemetryState {
  private snapshot: TelemetrySnapshot;
  private readonly listeners = new Set<TelemetryListener>();
  private readonly strictValidation: boolean;
  private updateCount = 0;

  /**
   * @param options - Construction options.
   */
  constructor(options?: TelemetryStateOptions | Partial<TelemetrySnapshot>) {
    const resolved = normalizeConstructorArg(options);
    this.strictValidation = resolved.strictValidation ?? true;
    this.snapshot = createTelemetrySnapshot(resolved.initial);
  }

  /**
   * Returns the current telemetry snapshot.
   * The returned object must be treated as read-only by consumers.
   */
  getSnapshot(): Readonly<TelemetrySnapshot> {
    return this.snapshot;
  }

  /**
   * Returns the number of successful updates applied since construction.
   */
  getUpdateCount(): number {
    return this.updateCount;
  }

  /**
   * Returns the number of active subscribers.
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Applies a partial telemetry update and notifies subscribers.
   *
   * @param payload - Partial update; omitted fields are preserved.
   * @returns The new snapshot after merging.
   * @throws {TypeError} When `strictValidation` is enabled and values are non-finite.
   */
  applyUpdate(payload: TelemetryUpdatePayload): TelemetrySnapshot {
    if (this.strictValidation && !isValidTelemetryUpdate(payload)) {
      throw new TypeError(
        "TelemetryState.applyUpdate: payload contains non-finite numeric values."
      );
    }

    const nextYaw = resolveYaw(payload, this.snapshot.yaw);

    this.snapshot = createTelemetrySnapshot({
      pitch: payload.pitch ?? this.snapshot.pitch,
      roll: payload.roll ?? this.snapshot.roll,
      yaw: nextYaw,
      altitude: payload.altitude ?? this.snapshot.altitude,
      speed: payload.speed ?? this.snapshot.speed,
      latitude: payload.latitude ?? this.snapshot.latitude,
      longitude: payload.longitude ?? this.snapshot.longitude,
      timestamp: payload.timestamp ?? this.snapshot.timestamp
    });

    this.updateCount += 1;
    this.notifyListeners();
    return this.snapshot;
  }

  /**
   * Replaces the entire snapshot in one operation.
   *
   * @param next - Full or partial snapshot; missing fields fall back to defaults.
   * @returns The stored snapshot after replacement.
   */
  replace(next: Partial<TelemetrySnapshot>): TelemetrySnapshot {
    this.snapshot = createTelemetrySnapshot(next);
    this.updateCount += 1;
    this.notifyListeners();
    return this.snapshot;
  }

  /**
   * Resets the store to the library default snapshot.
   *
   * @returns The default snapshot after reset.
   */
  reset(): TelemetrySnapshot {
    return this.replace({});
  }

  /**
   * Registers a listener invoked after every state mutation.
   *
   * @param listener - Callback receiving the latest snapshot.
   * @returns Unsubscribe function.
   */
  subscribe(listener: TelemetryListener): TelemetryUnsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Removes all registered listeners.
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Removes all listeners and resets internal counters.
   * The latest snapshot is preserved.
   */
  dispose(): void {
    this.clearListeners();
    this.updateCount = 0;
  }

  /**
   * Notifies all subscribers with the current snapshot.
   */
  private notifyListeners(): void {
    const current = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(current);
    }
  }
}

/**
 * Normalizes constructor overloads into {@link TelemetryStateOptions}.
 */
function normalizeConstructorArg(
  arg?: TelemetryStateOptions | Partial<TelemetrySnapshot>
): TelemetryStateOptions {
  if (!arg) {
    return {};
  }

  if ("strictValidation" in arg || "initial" in arg) {
    return arg as TelemetryStateOptions;
  }

  return { initial: arg as Partial<TelemetrySnapshot> };
}

/**
 * Resolves yaw from explicit `yaw`, `heading` alias, or the previous value.
 */
function resolveYaw(
  payload: TelemetryUpdatePayload,
  previousYaw: number
): number {
  if (payload.yaw !== undefined) {
    return normalizeHeadingDegrees(payload.yaw);
  }

  if (payload.heading !== undefined) {
    return normalizeHeadingDegrees(payload.heading);
  }

  return previousYaw;
}
