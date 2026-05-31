/**
 * @module ui/OverlayManager
 * @description Read-only 2D HUD rendered over the WebGL viewport.
 */

import type { TelemetryState } from "../core/TelemetryState";
import type { ResolvedTelemetryFlightViewerConfig } from "../types/config";
import type { TelemetrySnapshot } from "../types/telemetry";
import type { TelemetryUnsubscribe } from "../types/telemetry";
import { normalizeHeadingDegrees } from "../types/telemetry";
import overlayStyles from "./overlay.css";

const STYLE_ELEMENT_ID = "telemetry-flight-viewer-styles";

/**
 * Cached references to HUD value nodes for high-frequency updates.
 */
interface HudValueRefs {
  speed?: HTMLElement;
  altitude?: HTMLElement;
  pitch?: HTMLElement;
  roll?: HTMLElement;
  yaw?: HTMLElement;
  compassRose?: HTMLDivElement;
  compassLabel?: HTMLElement;
  horizonBank?: HTMLDivElement;
  horizonPitch?: HTMLDivElement;
  attitudeBlock?: HTMLElement;
  statusLine?: HTMLElement;
}

/**
 * Options for constructing {@link OverlayManager}.
 */
export interface OverlayManagerOptions {
  /** Parent element (typically the viewer viewport). */
  parent: HTMLElement;

  /** Resolved viewer configuration controlling HUD features. */
  config: ResolvedTelemetryFlightViewerConfig;

  /** Telemetry store; updates are batched via `requestAnimationFrame`. */
  telemetryState: TelemetryState;
}

/**
 * Renders aviation-style telemetry overlays and subscribes to {@link TelemetryState}.
 */
export class OverlayManager {
  private readonly hud: HTMLDivElement;
  private readonly refs: HudValueRefs = {};
  private readonly config: ResolvedTelemetryFlightViewerConfig;

  private telemetryUnsubscribe: TelemetryUnsubscribe | null = null;
  private pendingSnapshot: TelemetrySnapshot | null = null;
  private rafId: number | null = null;
  private disposed = false;

  /**
   * @param options - Parent mount point, config, and telemetry source.
   */
  constructor(options: OverlayManagerOptions) {
    this.config = options.config;

    injectOverlayStylesOnce();

    this.hud = document.createElement("div");
    this.hud.className = "tfv-hud";
    this.hud.setAttribute("data-tfv-hud", "true");

    this.buildHud(this.config.ui);
    options.parent.appendChild(this.hud);

    this.telemetryUnsubscribe = options.telemetryState.subscribe((snapshot) => {
      this.scheduleUpdate(snapshot);
    });

    this.scheduleUpdate(options.telemetryState.getSnapshot());
  }

  /**
   * Queues a HUD refresh on the next animation frame (coalesces rapid telemetry).
   *
   * @param snapshot - Latest telemetry snapshot.
   */
  scheduleUpdate(snapshot: TelemetrySnapshot): void {
    if (this.disposed) return;

    this.pendingSnapshot = snapshot;

    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      const data = this.pendingSnapshot;
      this.pendingSnapshot = null;
      if (data && !this.disposed) {
        this.applySnapshotToDom(data);
      }
    });
  }

  /**
   * Synchronously applies a snapshot (used for initial paint).
   *
   * @param snapshot - Telemetry snapshot to render.
   */
  update(snapshot: TelemetrySnapshot): void {
    if (this.disposed) return;
    this.applySnapshotToDom(snapshot);
  }

  /**
   * Cancels pending frames, unsubscribes, and removes HUD nodes.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.pendingSnapshot = null;
    this.telemetryUnsubscribe?.();
    this.telemetryUnsubscribe = null;
    this.hud.remove();
  }

  private applySnapshotToDom(snapshot: TelemetrySnapshot): void {
    const heading = Math.round(normalizeHeadingDegrees(snapshot.yaw));
    const speedKmh = Math.round(snapshot.speed * 3.6);

    if (this.refs.speed) {
      this.refs.speed.textContent = String(speedKmh);
    }
    if (this.refs.altitude) {
      this.refs.altitude.textContent = String(Math.round(snapshot.altitude));
    }
    if (this.refs.pitch) {
      this.refs.pitch.textContent = snapshot.pitch.toFixed(1);
    }
    if (this.refs.roll) {
      this.refs.roll.textContent = snapshot.roll.toFixed(1);
    }
    if (this.refs.yaw) {
      this.refs.yaw.textContent = String(heading);
    }

    if (this.refs.compassRose) {
      this.refs.compassRose.style.transform = `rotate(${-snapshot.yaw}deg)`;
    }
    if (this.refs.compassLabel) {
      this.refs.compassLabel.textContent = `${heading}°`;
    }

    if (this.refs.horizonBank) {
      this.refs.horizonBank.style.transform = `rotate(${-snapshot.roll}deg)`;
    }
    if (this.refs.horizonPitch) {
      const pitchPx = clamp(snapshot.pitch, -45, 45) * 1.15;
      this.refs.horizonPitch.style.transform = `translate3d(0, ${pitchPx}px, 0)`;
    }

    if (this.refs.attitudeBlock) {
      this.refs.attitudeBlock.textContent = [
        `PITCH ${snapshot.pitch.toFixed(1)}°`,
        `ROLL  ${snapshot.roll.toFixed(1)}°`,
        `HDG   ${heading}°`
      ].join("\n");
    }

    if (this.refs.statusLine) {
      const lat =
        snapshot.latitude !== undefined
          ? snapshot.latitude.toFixed(5)
          : "------";
      const lng =
        snapshot.longitude !== undefined
          ? snapshot.longitude.toFixed(5)
          : "------";
      this.refs.statusLine.textContent = `LAT ${lat}  LNG ${lng}`;
    }
  }

  private buildHud(ui: ResolvedTelemetryFlightViewerConfig["ui"]): void {
    if (ui.telemetryBar) {
      const bar = document.createElement("div");
      bar.className = "tfv-hud__bar";
      this.refs.speed = this.appendMetricCard(bar, "SPD", "KM/H");
      this.refs.altitude = this.appendMetricCard(bar, "ALT", "M");
      this.refs.pitch = this.appendMetricCard(bar, "PIT", "°");
      this.refs.roll = this.appendMetricCard(bar, "ROL", "°");
      this.refs.yaw = this.appendMetricCard(bar, "HDG", "°");
      this.hud.appendChild(bar);
    }

    if (ui.crosshair) {
      const cross = document.createElement("div");
      cross.className = "tfv-hud__crosshair";
      cross.innerHTML = [
        '<div class="tfv-hud__crosshair-h"></div>',
        '<div class="tfv-hud__crosshair-v"></div>',
        '<div class="tfv-hud__crosshair-dot"></div>'
      ].join("");
      this.hud.appendChild(cross);
    }

    if (ui.compass || ui.artificialHorizon) {
      const instruments = document.createElement("div");
      instruments.className = "tfv-hud__instruments";

      if (ui.compass) {
        instruments.appendChild(this.createCompass());
      }

      if (ui.artificialHorizon) {
        instruments.appendChild(this.createArtificialHorizon());
      }

      this.hud.appendChild(instruments);
    }

    if (ui.pitchRollReadout) {
      const attitude = document.createElement("div");
      attitude.className = "tfv-hud__attitude";
      this.refs.attitudeBlock = attitude;
      this.hud.appendChild(attitude);
    }

    if (ui.statusLine) {
      const status = document.createElement("div");
      status.className = "tfv-hud__status";
      this.refs.statusLine = status;
      this.hud.appendChild(status);
    }
  }

  private createCompass(): HTMLDivElement {
    const compass = document.createElement("div");
    compass.className = "tfv-compass";

    this.refs.compassRose = document.createElement("div");
    this.refs.compassRose.className = "tfv-compass__rose";
    this.refs.compassRose.innerHTML = [
      '<span class="tfv-compass__tick-n">N</span>',
      '<span class="tfv-compass__tick-e">E</span>',
      '<span class="tfv-compass__tick-s">S</span>',
      '<span class="tfv-compass__tick-w">W</span>'
    ].join("");

    const needle = document.createElement("div");
    needle.className = "tfv-compass__needle";

    this.refs.compassLabel = document.createElement("div");
    this.refs.compassLabel.className = "tfv-compass__label";

    compass.append(this.refs.compassRose, needle, this.refs.compassLabel);
    return compass;
  }

  private createArtificialHorizon(): HTMLDivElement {
    const horizon = document.createElement("div");
    horizon.className = "tfv-horizon";

    this.refs.horizonBank = document.createElement("div");
    this.refs.horizonBank.className = "tfv-horizon__bank";

    this.refs.horizonPitch = document.createElement("div");
    this.refs.horizonPitch.className = "tfv-horizon__pitch";

    const sky = document.createElement("div");
    sky.className = "tfv-horizon__sky";
    const ground = document.createElement("div");
    ground.className = "tfv-horizon__ground";
    this.refs.horizonPitch.append(sky, ground);

    this.refs.horizonBank.appendChild(this.refs.horizonPitch);

    const ring = document.createElement("div");
    ring.className = "tfv-horizon__ring";
    const aircraft = document.createElement("div");
    aircraft.className = "tfv-horizon__aircraft";

    horizon.append(this.refs.horizonBank, ring, aircraft);
    return horizon;
  }

  private appendMetricCard(
    parent: HTMLElement,
    label: string,
    unit: string
  ): HTMLElement {
    const card = document.createElement("div");
    card.className = "tfv-hud__card";

    const labelEl = document.createElement("span");
    labelEl.className = "tfv-hud__card-label";
    labelEl.textContent = `${label} ${unit}`;

    const valueEl = document.createElement("strong");
    valueEl.className = "tfv-hud__card-value";
    valueEl.textContent = "0";

    card.append(labelEl, valueEl);
    parent.appendChild(card);
    return valueEl;
  }
}

function injectOverlayStylesOnce(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = overlayStyles;
  document.head.appendChild(style);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
