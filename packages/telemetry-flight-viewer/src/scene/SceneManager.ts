/**
 * @module scene/SceneManager
 * @description Core Three.js orchestrator: renderer, scene graph, lighting,
 * telemetry-driven aircraft transforms, and chase camera render loop.
 */

import {
  AmbientLight,
  Color,
  DirectionalLight,
  Euler,
  Fog,
  GridHelper,
  Group,
  Quaternion,
  Scene,
  WebGLRenderer
} from "three";
import type { TelemetryState } from "../core/TelemetryState";
import type { LifecycleManager } from "../core/LifecycleManager";
import type { ResolvedTelemetryFlightViewerConfig } from "../types/config";
import type { TelemetrySnapshot } from "../types/telemetry";
import type { TelemetryUnsubscribe } from "../types/telemetry";
import { disposeObject3D, disposeGeometry, disposeMaterialOrArray } from "../utils/dispose";
import { degToRad } from "../utils/math";
import { AircraftLoader, type LoadedAircraft } from "./AircraftLoader";
import { ALTITUDE_WORLD_SCALE, ChaseCamera } from "./ChaseCamera";

/**
 * Construction options for {@link SceneManager}.
 */
export interface SceneManagerOptions {
  /** Canvas element bound to the internal WebGLRenderer. */
  canvas: HTMLCanvasElement;

  /** Fully resolved viewer configuration. */
  config: ResolvedTelemetryFlightViewerConfig;

  /** External telemetry store; the scene subscribes to updates. */
  telemetryState: TelemetryState;

  /**
   * Optional lifecycle registry used by the parent viewer for coordinated teardown.
   * When omitted, only {@link SceneManager.destroy} must be called.
   */
  lifecycle?: LifecycleManager;
}

/**
 * Owns the Three.js scene graph, render loop, and telemetry-driven transforms.
 */
export class SceneManager {
  readonly scene = new Scene();
  readonly aircraftRoot = new Group();
  readonly renderer: WebGLRenderer;
  readonly chaseCamera: ChaseCamera;

  private readonly config: ResolvedTelemetryFlightViewerConfig;
  private readonly telemetryState: TelemetryState;
  private readonly aircraftLoader = new AircraftLoader();

  private readonly targetQuaternion = new Quaternion();
  private readonly smoothedQuaternion = new Quaternion();
  private readonly targetEuler = new Euler(0, 0, 0, "YXZ");

  private loadedAircraft: LoadedAircraft | null = null;
  private telemetryUnsubscribe: TelemetryUnsubscribe | null = null;
  private latestTelemetry: TelemetrySnapshot;

  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private contextLost = false;
  private destroyed = false;

  private grid: GridHelper | null = null;
  private lights: Array<AmbientLight | DirectionalLight> = [];

  /**
   * @param options - Scene dependencies and configuration.
   */
  constructor(options: SceneManagerOptions) {
    this.config = options.config;
    this.telemetryState = options.telemetryState;
    this.latestTelemetry = { ...options.config.initialTelemetry };

    this.chaseCamera = new ChaseCamera(options.config.camera);
    this.scene.add(this.aircraftRoot);
    this.aircraftRoot.name = "aircraft-root";

    this.renderer = new WebGLRenderer({
      canvas: options.canvas,
      antialias: options.config.antialias,
      alpha: this.isTransparentBackground(),
      powerPreference: "high-performance",
      preserveDrawingBuffer: false
    });
    this.renderer.setPixelRatio(options.config.pixelRatio);
    this.renderer.outputColorSpace = "srgb";

    this.applyEnvironment();
    this.setupLights();
    this.bindContextEvents(options.canvas);
    this.bindTelemetry();

    options.lifecycle?.register(() => {
      if (!this.destroyed) {
        this.destroy();
      }
    });
  }

  /**
   * Loads the configured GLTF/GLB asset and attaches it to the scene graph.
   */
  async loadModel(): Promise<void> {
    this.assertNotDestroyed();

    this.loadedAircraft = await this.aircraftLoader.load(this.config.model);
    this.aircraftRoot.clear();
    this.aircraftRoot.add(this.loadedAircraft.pivot);

    this.applyAircraftTransform(this.latestTelemetry, 1);
    this.chaseCamera.resetSmoothing(this.latestTelemetry);
  }

  /**
   * Starts the `requestAnimationFrame` render loop.
   */
  start(): void {
    this.assertNotDestroyed();
    if (this.animationFrameId !== null) return;

    this.lastFrameTime = performance.now();

    const tick = (now: number): void => {
      this.animationFrameId = requestAnimationFrame(tick);

      if (this.contextLost || this.destroyed) {
        return;
      }

      const deltaSeconds = Math.min((now - this.lastFrameTime) / 1000, 0.05);
      this.lastFrameTime = now;

      this.renderFrame(deltaSeconds);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  /**
   * Stops the render loop without releasing GPU resources.
   */
  stop(): void {
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  /**
   * Resizes the drawing buffer and updates the camera aspect ratio.
   *
   * @param width - Drawable width in CSS pixels.
   * @param height - Drawable height in CSS pixels.
   */
  resize(width: number, height: number): void {
    if (this.destroyed) return;

    const safeWidth = Math.max(Math.floor(width), 1);
    const safeHeight = Math.max(Math.floor(height), 1);

    this.renderer.setSize(safeWidth, safeHeight, false);
    this.chaseCamera.resize(safeWidth, safeHeight);
  }

  /**
   * Stops rendering, disposes all GPU resources, detaches listeners,
   * and removes the canvas from the DOM.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.stop();
    this.unbindTelemetry();
    this.unbindContextEvents();

    if (this.loadedAircraft) {
      this.aircraftRoot.remove(this.loadedAircraft.pivot);
      disposeObject3D(this.loadedAircraft.pivot);
      this.loadedAircraft = null;
    }

    this.aircraftLoader.dispose();

    if (this.grid) {
      this.scene.remove(this.grid);
      disposeGeometry(this.grid.geometry);
      disposeMaterialOrArray(this.grid.material);
      this.grid = null;
    }

    for (const light of this.lights) {
      this.scene.remove(light);
    }
    this.lights = [];

    disposeObject3D(this.scene);
    this.renderer.dispose();
    this.chaseCamera.dispose();

    const canvas = this.renderer.domElement;
    canvas.parentElement?.removeChild(canvas);
  }

  /**
   * Manually pushes telemetry into the scene (also handled via subscription).
   *
   * @param telemetry - Latest snapshot.
   */
  setTelemetry(telemetry: TelemetrySnapshot): void {
    if (this.destroyed) return;
    this.latestTelemetry = { ...telemetry };
  }

  /**
   * Returns true when the WebGL context is currently lost.
   */
  isContextLost(): boolean {
    return this.contextLost;
  }

  private bindTelemetry(): void {
    this.telemetryUnsubscribe = this.telemetryState.subscribe((snapshot) => {
      this.latestTelemetry = { ...snapshot };
    });
  }

  private unbindTelemetry(): void {
    this.telemetryUnsubscribe?.();
    this.telemetryUnsubscribe = null;
  }

  private renderFrame(deltaSeconds: number): void {
    const alpha = smoothingAlpha(this.config.camera.smoothing, deltaSeconds);

    this.applyAircraftTransform(this.latestTelemetry, alpha);
    this.chaseCamera.update(this.latestTelemetry, deltaSeconds);
    this.renderer.render(this.scene, this.chaseCamera.camera);
  }

  /**
   * Applies smoothed telemetry rotation to the outer aircraft root and
   * positions the pivot by altitude.
   */
  private applyAircraftTransform(
    telemetry: TelemetrySnapshot,
    alpha: number
  ): void {
    this.aircraftRoot.position.y = telemetry.altitude * ALTITUDE_WORLD_SCALE;

    this.targetEuler.set(
      degToRad(telemetry.pitch),
      degToRad(telemetry.yaw),
      degToRad(telemetry.roll)
    );
    this.targetQuaternion.setFromEuler(this.targetEuler);

    if (this.smoothedQuaternion.lengthSq() < 1e-8) {
      this.smoothedQuaternion.copy(this.targetQuaternion);
    } else {
      this.smoothedQuaternion.slerp(this.targetQuaternion, alpha);
    }

    this.aircraftRoot.quaternion.copy(this.smoothedQuaternion);
  }

  private applyEnvironment(): void {
    const { environment } = this.config;
    const bg = environment.backgroundColor;

    if (bg === null || bg === "transparent") {
      this.renderer.setClearColor(0x000000, 0);
    } else {
      this.renderer.setClearColor(new Color(bg), 1);
    }

    if (environment.fogEnabled) {
      const fogColor = new Color(
        bg && bg !== "transparent" ? bg : "#0b1220"
      );
      this.scene.fog = new Fog(
        fogColor,
        environment.fogNear,
        environment.fogFar
      );
    }
  }

  private setupLights(): void {
    const { environment } = this.config;

    const ambient = new AmbientLight(0xffffff, environment.ambientIntensity);
    const key = new DirectionalLight(
      0xffffff,
      environment.directionalIntensity
    );
    key.position.set(60, 120, 45);

    const fill = new DirectionalLight(
      0x93c5fd,
      environment.directionalIntensity * 0.35
    );
    fill.position.set(-50, 40, -60);

    this.lights = [ambient, key, fill];
    this.scene.add(...this.lights);

    if (environment.showGrid) {
      this.grid = new GridHelper(240, 48, 0x334155, 0x1e293b);
      this.grid.position.y = 0;
      this.scene.add(this.grid);
    }
  }

  private isTransparentBackground(): boolean {
    const bg = this.config.environment.backgroundColor;
    return bg === null || bg === "transparent";
  }

  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;
  private boundCanvas: HTMLCanvasElement | null = null;

  private bindContextEvents(canvas: HTMLCanvasElement): void {
    this.boundCanvas = canvas;

    this.contextLostHandler = (event: Event): void => {
      event.preventDefault();
      this.contextLost = true;
      this.stop();
    };

    this.contextRestoredHandler = (): void => {
      this.contextLost = false;
      this.chaseCamera.resetSmoothing(this.latestTelemetry);
      this.smoothedQuaternion.copy(this.aircraftRoot.quaternion);
      this.start();
    };

    canvas.addEventListener("webglcontextlost", this.contextLostHandler, false);
    canvas.addEventListener(
      "webglcontextrestored",
      this.contextRestoredHandler,
      false
    );
  }

  private unbindContextEvents(): void {
    if (!this.boundCanvas) return;

    if (this.contextLostHandler) {
      this.boundCanvas.removeEventListener(
        "webglcontextlost",
        this.contextLostHandler
      );
    }

    if (this.contextRestoredHandler) {
      this.boundCanvas.removeEventListener(
        "webglcontextrestored",
        this.contextRestoredHandler
      );
    }

    this.boundCanvas = null;
    this.contextLostHandler = null;
    this.contextRestoredHandler = null;
  }

  private assertNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error("SceneManager: instance has been destroyed.");
    }
  }
}

/**
 * Frame-rate independent smoothing factor aligned with camera tuning.
 */
function smoothingAlpha(smoothing: number, deltaSeconds: number): number {
  const rate = Math.max(0, Math.min(1, smoothing)) * 12;
  return 1 - Math.exp(-rate * Math.max(deltaSeconds, 0));
}
