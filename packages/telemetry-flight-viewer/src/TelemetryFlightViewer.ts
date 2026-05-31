/**
 * @module TelemetryFlightViewer
 * @description Primary facade for the telemetry-flight-viewer NPM package.
 */

import { resolveConfig } from "./config/resolveConfig";
import { LifecycleManager } from "./core/LifecycleManager";
import { TelemetryState } from "./core/TelemetryState";
import { EmbeddedHost } from "./display/EmbeddedHost";
import type { DisplayHost } from "./display/DisplayHost";
import { FloatingHost } from "./display/FloatingHost";
import { SceneManager } from "./scene/SceneManager";
import type {
  ResolvedTelemetryFlightViewerConfig,
  TelemetryFlightViewerConfig
} from "./types/config";
import type {
  TelemetrySnapshot,
  TelemetryUnsubscribe,
  TelemetryUpdatePayload
} from "./types/telemetry";
import { OverlayManager } from "./ui/OverlayManager";
import { ElementResizeWatcher } from "./utils/resizeObserver";

/**
 * Lifecycle state of a {@link TelemetryFlightViewer} instance.
 */
export type ViewerState = "idle" | "loading" | "ready" | "destroyed";

/**
 * Optional callbacks for viewer lifecycle and telemetry events.
 */
export interface TelemetryFlightViewerEvents {
  /** Fired after {@link TelemetryFlightViewer.initialize} completes successfully. */
  onReady?: () => void;

  /** Fired when initialization fails or the WebGL pipeline throws. */
  onError?: (error: Error) => void;

  /**
   * Fired after each successful {@link TelemetryFlightViewer.updateTelemetry} call.
   * Receives the merged snapshot currently held by the internal store.
   */
  onTelemetryUpdate?: (snapshot: Readonly<TelemetrySnapshot>) => void;
}

/**
 * Default public-domain sample model (Khronos glTF Sample Models).
 * Suitable for demos and smoke tests.
 */
export const DEFAULT_DEMO_MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb";

/**
 * Framework-agnostic, telemetry-driven 3D flight viewer.
 *
 * The viewer never accepts onboard flight controls. Stream attitude and
 * kinematics through {@link updateTelemetry}.
 *
 * @example
 * ```ts
 * import { TelemetryFlightViewer } from '@cesium-suite/telemetry-flight-viewer';
 *
 * const viewer = new TelemetryFlightViewer({
 *   container: document.getElementById('flight-view')!,
 *   displayMode: 'embedded',
 *   model: { url: '/assets/aircraft.glb', name: 'UAV-01' },
 * });
 *
 * await viewer.initialize();
 *
 * viewer.updateTelemetry({
 *   pitch: 4,
 *   roll: -8,
 *   yaw: 120,
 *   altitude: 1500,
 *   speed: 72,
 * });
 *
 * // Later:
 * viewer.destroy();
 * ```
 */
export class TelemetryFlightViewer {
  private readonly resolvedConfig: ResolvedTelemetryFlightViewerConfig;
  private readonly lifecycle = new LifecycleManager();
  private readonly telemetryState: TelemetryState;
  private readonly events: TelemetryFlightViewerEvents;

  private displayHost: DisplayHost | null = null;
  private sceneManager: SceneManager | null = null;
  private overlayManager: OverlayManager | null = null;
  private resizeWatcher: ElementResizeWatcher | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private telemetryBridgeUnsubscribe: TelemetryUnsubscribe | null = null;

  private _state: ViewerState = "idle";

  /**
   * @param config - Consumer configuration (merged with library defaults).
   * @param events - Optional lifecycle callbacks.
   */
  constructor(
    config: TelemetryFlightViewerConfig,
    events: TelemetryFlightViewerEvents = {}
  ) {
    validateConstructorConfig(config);

    this.resolvedConfig = resolveConfig(config);
    this.telemetryState = new TelemetryState({
      initial: this.resolvedConfig.initialTelemetry
    });
    this.events = events;

    this.telemetryBridgeUnsubscribe = this.telemetryState.subscribe(
      (snapshot) => {
        this.sceneManager?.setTelemetry(snapshot);
        this.events.onTelemetryUpdate?.(snapshot);
      }
    );
  }

  /**
   * Current viewer lifecycle state.
   */
  get state(): ViewerState {
    return this._state;
  }

  /**
   * Resolved configuration after defaults are applied (read-only).
   */
  get config(): Readonly<ResolvedTelemetryFlightViewerConfig> {
    return this.resolvedConfig;
  }

  /**
   * Returns true when the viewer has finished {@link initialize}.
   */
  get isReady(): boolean {
    return this._state === "ready";
  }

  /**
   * Returns the latest telemetry snapshot from the internal store.
   */
  getTelemetry(): Readonly<TelemetrySnapshot> {
    return this.telemetryState.getSnapshot();
  }

  /**
   * Streams external telemetry into the viewer. This is the sole control API.
   *
   * @param data - Partial telemetry update; omitted fields are preserved.
   * @returns The merged snapshot after the update is applied.
   */
  updateTelemetry(data: TelemetryUpdatePayload): TelemetrySnapshot {
    if (this._state === "destroyed") {
      throw new Error(
        "TelemetryFlightViewer: cannot update telemetry after destroy()."
      );
    }
    return this.telemetryState.applyUpdate(data);
  }

  /**
   * Mounts the DOM, loads the GLTF/GLB model, and starts the render loop.
   *
   * @returns A promise that resolves when the viewer is ready.
   */
  async initialize(): Promise<void> {
    if (this._state === "ready") return;

    if (this._state === "loading") {
      throw new Error(
        "TelemetryFlightViewer: initialize() is already in progress."
      );
    }

    if (this._state === "destroyed") {
      throw new Error(
        "TelemetryFlightViewer: cannot initialize after destroy()."
      );
    }

    this._state = "loading";

    try {
      this.mountDisplay();
      this.mountCanvas();
      this.mountScene();
      this.mountOverlay();

      await this.sceneManager!.loadModel();
      this.sceneManager!.start();
      this.bindResize();

      this._state = "ready";
      this.events.onReady?.();
    } catch (error) {
      this.teardownSubsystems();
      this._state = "idle";

      const err = error instanceof Error ? error : new Error(String(error));
      this.events.onError?.(err);
      throw err;
    }
  }

  /**
   * Manually resizes the WebGL drawing buffer and camera.
   * No-op unless the viewer is {@link ViewerState.ready}.
   *
   * @param width - Width in CSS pixels.
   * @param height - Height in CSS pixels.
   */
  resize(width: number, height: number): void {
    if (this._state !== "ready" || !this.sceneManager) return;
    this.sceneManager.resize(width, height);
  }

  /**
   * Stops rendering and disposes all subsystems (DOM, WebGL, listeners).
   */
  destroy(): void {
    if (this._state === "destroyed") return;

    this._state = "destroyed";

    this.teardownSubsystems();

    this.telemetryBridgeUnsubscribe?.();
    this.telemetryBridgeUnsubscribe = null;

    this.telemetryState.dispose();
    this.lifecycle.destroy();
  }

  // ---------------------------------------------------------------------------
  // Mount helpers
  // ---------------------------------------------------------------------------

  private mountDisplay(): void {
    this.displayHost = this.createDisplayHost();
    this.displayHost.mount();
  }

  private mountCanvas(): void {
    if (!this.displayHost) return;

    this.canvas = document.createElement("canvas");
    this.canvas.className = "tfv-canvas";
    this.displayHost.viewport.appendChild(this.canvas);
  }

  private mountScene(): void {
    if (!this.canvas) {
      throw new Error("TelemetryFlightViewer: canvas was not created.");
    }

    this.sceneManager = new SceneManager({
      canvas: this.canvas,
      config: this.resolvedConfig,
      telemetryState: this.telemetryState,
      lifecycle: this.lifecycle
    });
  }

  private mountOverlay(): void {
    if (!this.displayHost) return;

    this.overlayManager = new OverlayManager({
      parent: this.displayHost.viewport,
      config: this.resolvedConfig,
      telemetryState: this.telemetryState
    });

    this.lifecycle.register(() => {
      this.overlayManager?.dispose();
      this.overlayManager = null;
    });
  }

  private bindResize(): void {
    if (!this.displayHost || !this.sceneManager) return;

    if (this.resolvedConfig.autoResize) {
      this.resizeWatcher = new ElementResizeWatcher(
        this.displayHost.viewport,
        (width, height) => this.sceneManager?.resize(width, height)
      );
      this.resizeWatcher.start();
      this.lifecycle.register(() => {
        this.resizeWatcher?.stop();
        this.resizeWatcher = null;
      });
      return;
    }

    const rect = this.displayHost.viewport.getBoundingClientRect();
    this.sceneManager.resize(rect.width || 320, rect.height || 240);
  }

  private createDisplayHost(): DisplayHost {
    if (this.resolvedConfig.displayMode === "floating") {
      return new FloatingHost(this.resolvedConfig);
    }
    return new EmbeddedHost(this.resolvedConfig);
  }

  /**
   * Disposes scene, overlay, display, and canvas in a safe order.
   */
  private teardownSubsystems(): void {
    this.resizeWatcher?.stop();
    this.resizeWatcher = null;

    this.overlayManager?.dispose();
    this.overlayManager = null;

    this.sceneManager?.destroy();
    this.sceneManager = null;

    this.displayHost?.dispose();
    this.displayHost = null;

    this.canvas = null;
  }
}

/**
 * Validates required constructor fields before resolving defaults.
 */
function validateConstructorConfig(config: TelemetryFlightViewerConfig): void {
  if (!config) {
    throw new Error("TelemetryFlightViewer: config is required.");
  }

  if (!(config.container instanceof HTMLElement)) {
    throw new Error(
      "TelemetryFlightViewer: `container` must be a valid HTMLElement."
    );
  }

  if (!config.model?.url || typeof config.model.url !== "string") {
    throw new Error(
      "TelemetryFlightViewer: `model.url` must be a non-empty string."
    );
  }
}
