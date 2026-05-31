import * as three from 'three';
import { PerspectiveCamera, Scene, Group, WebGLRenderer, Object3D, Box3, Material, BufferGeometry, Texture } from 'three';

/**
 * @module types/telemetry
 * @description Type definitions for externally streamed flight telemetry.
 * The viewer is driven exclusively by these values; no onboard flight controls exist.
 */
/**
 * Complete telemetry snapshot consumed by the scene, camera, and HUD layers.
 * All angular values are expressed in degrees unless stated otherwise.
 */
interface TelemetrySnapshot {
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
type TelemetryUpdatePayload = Partial<Omit<TelemetrySnapshot, "yaw">> & {
    /** Alias for {@link TelemetrySnapshot.yaw}. */
    heading?: number;
    yaw?: number;
};
/**
 * Callback invoked when the telemetry store publishes a new snapshot.
 */
type TelemetryListener = (snapshot: Readonly<TelemetrySnapshot>) => void;
/**
 * Unsubscribe function returned by {@link TelemetryState.subscribe}.
 */
type TelemetryUnsubscribe = () => void;
/**
 * Default snapshot used when the consumer does not provide `initialTelemetry`.
 */
declare const DEFAULT_TELEMETRY: Readonly<TelemetrySnapshot>;
/**
 * Normalizes a heading/yaw angle to the half-open interval [0, 360).
 *
 * @param degrees - Raw heading in degrees.
 * @returns Normalized heading in degrees.
 */
declare function normalizeHeadingDegrees(degrees: number): number;
/**
 * Creates a defensive copy of a telemetry snapshot with normalized yaw.
 *
 * @param source - Input snapshot or partial snapshot.
 * @returns Fully populated {@link TelemetrySnapshot}.
 */
declare function createTelemetrySnapshot(source?: Partial<TelemetrySnapshot>): TelemetrySnapshot;
/**
 * Returns true when every required kinematic field is a finite number.
 *
 * @param payload - Candidate update payload.
 */
declare function isValidTelemetryUpdate(payload: TelemetryUpdatePayload): boolean;

/**
 * @module types/config
 * @description Configuration contracts for {@link TelemetryFlightViewer}.
 */

/**
 * Determines how the viewer mounts into the host application DOM.
 *
 * - `embedded`: Fills the supplied container element.
 * - `floating`: Renders a draggable overlay anchored to the viewport.
 */
type DisplayMode = "embedded" | "floating";
/**
 * Preset anchor positions for floating overlay mode before the user drags.
 */
type FloatingPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
/**
 * Width or height may be an explicit pixel value or `'auto'` to inherit
 * from the parent container (embedded mode).
 */
type DimensionValue = number | "auto";
/**
 * Static orientation correction applied after telemetry rotation.
 * Useful when the authored GLTF forward axis differs from the simulation frame.
 */
interface ModelOrientationOffset {
    /** Pitch correction in degrees. */
    pitch?: number;
    /** Roll correction in degrees. */
    roll?: number;
    /** Yaw correction in degrees. */
    yaw?: number;
}
/**
 * Runtime 3D asset descriptor. Models are never hardcoded inside the library.
 */
interface ModelConfig {
    /**
     * Absolute or relative URL to a GLTF or GLB asset.
     * Must be non-empty; validated by {@link resolveConfig}.
     */
    url: string;
    /**
     * Logical identifier for logging, debugging, and telemetry correlation.
     */
    name?: string;
    /**
     * Uniform scale multiplier applied after the asset loads.
     * @defaultValue 1
     */
    scale?: number;
    /**
     * Static rotation offsets in degrees applied in YXZ order after load.
     */
    orientationOffset?: ModelOrientationOffset;
}
/**
 * Viewer viewport dimensions (primarily used in embedded mode).
 */
interface DimensionsConfig {
    /** CSS pixel width or `'auto'`. @defaultValue `'auto'` */
    width?: DimensionValue;
    /** CSS pixel height or `'auto'`. @defaultValue `'auto'` */
    height?: DimensionValue;
}
/**
 * Feature flags for read-only HUD overlays.
 * No control surfaces are exposed through these flags.
 */
interface UiElementsConfig {
    /** Heading compass rose. @defaultValue true */
    compass?: boolean;
    /** Artificial horizon instrument. @defaultValue true */
    artificialHorizon?: boolean;
    /** Top telemetry strip (speed, altitude, heading). @defaultValue true */
    telemetryBar?: boolean;
    /** Center crosshair reticle. @defaultValue true */
    crosshair?: boolean;
    /** Numeric pitch/roll readout near instruments. @defaultValue true */
    pitchRollReadout?: boolean;
    /** Bottom status line (lat/lng when provided). @defaultValue true */
    statusLine?: boolean;
}
/**
 * Scene environment and rendering atmosphere settings.
 */
interface EnvironmentConfig {
    /**
     * Renderer clear color as a CSS color string.
     * Use `null` or `'transparent'` for alpha compositing over the host page.
     * @defaultValue `'#0b1220'`
     */
    backgroundColor?: string | null;
    /** Enable distance fog. @defaultValue false */
    fogEnabled?: boolean;
    /** Fog start distance in world units. @defaultValue 80 */
    fogNear?: number;
    /** Fog end distance in world units. @defaultValue 450 */
    fogFar?: number;
    /** Ambient light intensity. @defaultValue 0.55 */
    ambientIntensity?: number;
    /** Key directional light intensity. @defaultValue 1.15 */
    directionalIntensity?: number;
    /** Render a subtle ground grid for spatial reference. @defaultValue true */
    showGrid?: boolean;
}
/**
 * Options for floating overlay display mode.
 */
interface FloatingWindowConfig {
    /** Corner anchor before user drag. @defaultValue `'bottom-right'` */
    position?: FloatingPosition;
    /** Panel width in CSS pixels. @defaultValue 420 */
    width?: number;
    /** Panel height in CSS pixels. @defaultValue 320 */
    height?: number;
    /** CSS `z-index` of the overlay root. @defaultValue 10000 */
    zIndex?: number;
    /** Allow dragging via the panel header. @defaultValue true */
    draggable?: boolean;
    /** Title text rendered in the drag handle bar. @defaultValue `'Flight Telemetry'` */
    title?: string;
    /** Viewport margin in pixels when anchored. @defaultValue 16 */
    margin?: number;
}
/**
 * Externally driven chase camera parameters (no user orbit controls).
 */
interface CameraConfig {
    /** Distance behind the aircraft in world units. @defaultValue 14 */
    chaseDistance?: number;
    /** Height above the aircraft centerline. @defaultValue 4 */
    chaseHeight?: number;
    /** Look-ahead offset along the forward axis. @defaultValue 20 */
    lookAhead?: number;
    /** Vertical field of view in degrees. @defaultValue 55 */
    fov?: number;
    /**
     * Interpolation factor applied per frame in `[0, 1]`.
     * Higher values produce snappier camera motion.
     * @defaultValue 0.12
     */
    smoothing?: number;
}
/**
 * Consumer-facing configuration object passed to the viewer constructor.
 */
interface TelemetryFlightViewerConfig {
    /**
     * Host element supplied by the consumer application.
     *
     * - **embedded**: Cleared and filled by the viewer root.
     * - **floating**: Receives an overlay child; may be `document.body`.
     */
    container: HTMLElement;
    /** @defaultValue `'embedded'` */
    displayMode?: DisplayMode;
    /** Viewport sizing; primarily affects embedded mode. */
    dimensions?: DimensionsConfig;
    /**
     * Required runtime model descriptor.
     * The asset is fetched from {@link ModelConfig.url} after initialization.
     */
    model: ModelConfig;
    /** HUD overlay feature flags. */
    ui?: UiElementsConfig;
    /** Scene environment settings. */
    environment?: EnvironmentConfig;
    /** Floating overlay settings (ignored when `displayMode` is `'embedded'`). */
    floating?: FloatingWindowConfig;
    /** Chase camera behavior. */
    camera?: CameraConfig;
    /**
     * Initial telemetry snapshot before the first `updateTelemetry` call.
     */
    initialTelemetry?: Partial<TelemetrySnapshot>;
    /** Enable MSAA on the WebGL context. @defaultValue true */
    antialias?: boolean;
    /**
     * Device pixel ratio cap for the renderer.
     * @defaultValue `Math.min(window.devicePixelRatio, 2)`
     */
    pixelRatio?: number;
    /** Observe viewport size and resize the renderer. @defaultValue true */
    autoResize?: boolean;
    /** Optional CSS class applied to the viewer root element. */
    className?: string;
}
/** {@link ModelConfig} with all optional fields populated. */
interface ResolvedModelConfig {
    url: string;
    name: string;
    scale: number;
    orientationOffset: Required<ModelOrientationOffset>;
}
/**
 * Fully resolved configuration used internally after {@link resolveConfig}.
 * Every nested section contains explicit defaults; no optional fields remain
 * at the leaf level.
 */
interface ResolvedTelemetryFlightViewerConfig {
    container: HTMLElement;
    displayMode: DisplayMode;
    model: ResolvedModelConfig;
    antialias: boolean;
    autoResize: boolean;
    pixelRatio: number;
    className?: string;
    dimensions: Required<DimensionsConfig>;
    ui: Required<UiElementsConfig>;
    environment: Required<EnvironmentConfig>;
    floating: Required<FloatingWindowConfig>;
    camera: Required<CameraConfig>;
    initialTelemetry: TelemetrySnapshot;
}

/**
 * @module TelemetryFlightViewer
 * @description Primary facade for the telemetry-flight-viewer NPM package.
 */

/**
 * Lifecycle state of a {@link TelemetryFlightViewer} instance.
 */
type ViewerState = "idle" | "loading" | "ready" | "destroyed";
/**
 * Optional callbacks for viewer lifecycle and telemetry events.
 */
interface TelemetryFlightViewerEvents {
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
declare const DEFAULT_DEMO_MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb";
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
declare class TelemetryFlightViewer {
    private readonly resolvedConfig;
    private readonly lifecycle;
    private readonly telemetryState;
    private readonly events;
    private displayHost;
    private sceneManager;
    private overlayManager;
    private resizeWatcher;
    private canvas;
    private telemetryBridgeUnsubscribe;
    private _state;
    /**
     * @param config - Consumer configuration (merged with library defaults).
     * @param events - Optional lifecycle callbacks.
     */
    constructor(config: TelemetryFlightViewerConfig, events?: TelemetryFlightViewerEvents);
    /**
     * Current viewer lifecycle state.
     */
    get state(): ViewerState;
    /**
     * Resolved configuration after defaults are applied (read-only).
     */
    get config(): Readonly<ResolvedTelemetryFlightViewerConfig>;
    /**
     * Returns true when the viewer has finished {@link initialize}.
     */
    get isReady(): boolean;
    /**
     * Returns the latest telemetry snapshot from the internal store.
     */
    getTelemetry(): Readonly<TelemetrySnapshot>;
    /**
     * Streams external telemetry into the viewer. This is the sole control API.
     *
     * @param data - Partial telemetry update; omitted fields are preserved.
     * @returns The merged snapshot after the update is applied.
     */
    updateTelemetry(data: TelemetryUpdatePayload): TelemetrySnapshot;
    /**
     * Mounts the DOM, loads the GLTF/GLB model, and starts the render loop.
     *
     * @returns A promise that resolves when the viewer is ready.
     */
    initialize(): Promise<void>;
    /**
     * Manually resizes the WebGL drawing buffer and camera.
     * No-op unless the viewer is {@link ViewerState.ready}.
     *
     * @param width - Width in CSS pixels.
     * @param height - Height in CSS pixels.
     */
    resize(width: number, height: number): void;
    /**
     * Stops rendering and disposes all subsystems (DOM, WebGL, listeners).
     */
    destroy(): void;
    private mountDisplay;
    private mountCanvas;
    private mountScene;
    private mountOverlay;
    private bindResize;
    private createDisplayHost;
    /**
     * Disposes scene, overlay, display, and canvas in a safe order.
     */
    private teardownSubsystems;
}

/**
 * @module config/resolveConfig
 * @description Merges consumer configuration with library defaults and validates input.
 */

/**
 * Resolves a partial consumer configuration into a fully populated,
 * immutable-ready configuration object used by the viewer internals.
 *
 * @param config - Raw consumer configuration.
 * @returns Resolved configuration with all defaults applied.
 * @throws {TypeError} When required fields are missing or invalid.
 *
 * @example
 * ```ts
 * const resolved = resolveConfig({
 *   container: document.getElementById('viewer')!,
 *   model: { url: '/assets/drone.glb', name: 'UAV-1' },
 * });
 * ```
 */
declare function resolveConfig(config: TelemetryFlightViewerConfig): ResolvedTelemetryFlightViewerConfig;
/**
 * Returns a shallow copy of the default resolved sub-config for UI elements.
 * Useful for documentation generators and unit tests.
 */
declare function getDefaultUiConfig(): Readonly<Required<UiElementsConfig>>;

/**
 * @module core/TelemetryState
 * @description Single source of truth for externally driven flight telemetry.
 *
 * This store never accepts keyboard, pointer, or other onboard flight inputs.
 * Only {@link TelemetryState.applyUpdate} and {@link TelemetryState.replace}
 * mutate internal state.
 */

/**
 * Options for constructing a {@link TelemetryState} instance.
 */
interface TelemetryStateOptions {
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
declare class TelemetryState {
    private snapshot;
    private readonly listeners;
    private readonly strictValidation;
    private updateCount;
    /**
     * @param options - Construction options.
     */
    constructor(options?: TelemetryStateOptions | Partial<TelemetrySnapshot>);
    /**
     * Returns the current telemetry snapshot.
     * The returned object must be treated as read-only by consumers.
     */
    getSnapshot(): Readonly<TelemetrySnapshot>;
    /**
     * Returns the number of successful updates applied since construction.
     */
    getUpdateCount(): number;
    /**
     * Returns the number of active subscribers.
     */
    getListenerCount(): number;
    /**
     * Applies a partial telemetry update and notifies subscribers.
     *
     * @param payload - Partial update; omitted fields are preserved.
     * @returns The new snapshot after merging.
     * @throws {TypeError} When `strictValidation` is enabled and values are non-finite.
     */
    applyUpdate(payload: TelemetryUpdatePayload): TelemetrySnapshot;
    /**
     * Replaces the entire snapshot in one operation.
     *
     * @param next - Full or partial snapshot; missing fields fall back to defaults.
     * @returns The stored snapshot after replacement.
     */
    replace(next: Partial<TelemetrySnapshot>): TelemetrySnapshot;
    /**
     * Resets the store to the library default snapshot.
     *
     * @returns The default snapshot after reset.
     */
    reset(): TelemetrySnapshot;
    /**
     * Registers a listener invoked after every state mutation.
     *
     * @param listener - Callback receiving the latest snapshot.
     * @returns Unsubscribe function.
     */
    subscribe(listener: TelemetryListener): TelemetryUnsubscribe;
    /**
     * Removes all registered listeners.
     */
    clearListeners(): void;
    /**
     * Removes all listeners and resets internal counters.
     * The latest snapshot is preserved.
     */
    dispose(): void;
    /**
     * Notifies all subscribers with the current snapshot.
     */
    private notifyListeners;
}

type Disposer = () => void;
/**
 * Central registry for teardown callbacks (RAII-style).
 */
declare class LifecycleManager {
    private readonly disposers;
    private destroyed;
    register(disposer: Disposer): void;
    destroy(): void;
    get isDestroyed(): boolean;
}

/**
 * @module scene/ChaseCamera
 * @description Telemetry-driven chase camera with frame-rate independent smoothing.
 * No user orbit or pointer controls are attached.
 */

/** Converts telemetry altitude (meters) to scene vertical units. */
declare const ALTITUDE_WORLD_SCALE = 0.01;
/**
 * Externally driven chase camera that follows aircraft attitude from telemetry.
 */
declare class ChaseCamera {
    readonly camera: PerspectiveCamera;
    private readonly config;
    private readonly smoothedPosition;
    private readonly smoothedQuaternion;
    private readonly targetPosition;
    private readonly targetQuaternion;
    private readonly lookAtMatrix;
    private readonly forward;
    private readonly right;
    private readonly up;
    private readonly worldUp;
    private readonly lookAtTarget;
    private readonly aircraftPosition;
    private smoothedPitch;
    private smoothedRoll;
    private smoothedYaw;
    private smoothedAltitude;
    private initialized;
    /**
     * @param config - Resolved camera parameters from {@link resolveConfig}.
     */
    constructor(config: ResolvedTelemetryFlightViewerConfig["camera"]);
    /**
     * Updates aspect ratio after a viewport resize.
     *
     * @param width - Drawable width in pixels.
     * @param height - Drawable height in pixels.
     */
    resize(width: number, height: number): void;
    /**
     * Advances the chase camera toward the telemetry-driven target transform.
     *
     * @param telemetry - Latest external telemetry snapshot.
     * @param deltaSeconds - Frame delta time in seconds.
     */
    update(telemetry: TelemetrySnapshot, deltaSeconds: number): void;
    /**
     * Resets smoothing state (e.g. after a hard telemetry snap).
     */
    resetSmoothing(telemetry?: TelemetrySnapshot): void;
    /**
     * Releases camera resources (symmetry hook; PerspectiveCamera has no GPU data).
     */
    dispose(): void;
    /**
     * Builds the desired camera position and orientation for the smoothed attitude.
     */
    private computeTargetTransform;
}

/**
 * Construction options for {@link SceneManager}.
 */
interface SceneManagerOptions {
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
declare class SceneManager {
    readonly scene: Scene;
    readonly aircraftRoot: Group<three.Object3DEventMap>;
    readonly renderer: WebGLRenderer;
    readonly chaseCamera: ChaseCamera;
    private readonly config;
    private readonly telemetryState;
    private readonly aircraftLoader;
    private readonly targetQuaternion;
    private readonly smoothedQuaternion;
    private readonly targetEuler;
    private loadedAircraft;
    private telemetryUnsubscribe;
    private latestTelemetry;
    private animationFrameId;
    private lastFrameTime;
    private contextLost;
    private destroyed;
    private grid;
    private lights;
    /**
     * @param options - Scene dependencies and configuration.
     */
    constructor(options: SceneManagerOptions);
    /**
     * Loads the configured GLTF/GLB asset and attaches it to the scene graph.
     */
    loadModel(): Promise<void>;
    /**
     * Starts the `requestAnimationFrame` render loop.
     */
    start(): void;
    /**
     * Stops the render loop without releasing GPU resources.
     */
    stop(): void;
    /**
     * Resizes the drawing buffer and updates the camera aspect ratio.
     *
     * @param width - Drawable width in CSS pixels.
     * @param height - Drawable height in CSS pixels.
     */
    resize(width: number, height: number): void;
    /**
     * Stops rendering, disposes all GPU resources, detaches listeners,
     * and removes the canvas from the DOM.
     */
    destroy(): void;
    /**
     * Manually pushes telemetry into the scene (also handled via subscription).
     *
     * @param telemetry - Latest snapshot.
     */
    setTelemetry(telemetry: TelemetrySnapshot): void;
    /**
     * Returns true when the WebGL context is currently lost.
     */
    isContextLost(): boolean;
    private bindTelemetry;
    private unbindTelemetry;
    private renderFrame;
    /**
     * Applies smoothed telemetry rotation to the outer aircraft root and
     * positions the pivot by altitude.
     */
    private applyAircraftTransform;
    private applyEnvironment;
    private setupLights;
    private isTransparentBackground;
    private contextLostHandler;
    private contextRestoredHandler;
    private boundCanvas;
    private bindContextEvents;
    private unbindContextEvents;
    private assertNotDestroyed;
}

/**
 * @module scene/AircraftLoader
 * @description Loads GLTF/GLB assets and wraps them in a pivot hierarchy for
 * uniform telemetry-driven transforms regardless of the source file orientation.
 */

/**
 * Result of a successful model load.
 */
interface LoadedAircraft {
    /**
     * Outer pivot group. Attach telemetry rotation and translation to this node.
     */
    pivot: Group;
    /**
     * Inner mount node containing the oriented GLTF scene.
     */
    modelMount: Group;
    /** Root object returned by the GLTF loader. */
    model: Object3D;
    /** Axis-aligned bounds of the full pivot hierarchy after scaling. */
    bounds: Box3;
}
/**
 * Dynamically loads GLTF/GLB assets and applies configuration-driven orientation
 * offsets on an inner mount while preserving a clean outer pivot for telemetry.
 */
declare class AircraftLoader {
    private readonly gltfLoader;
    private activePivot;
    /**
     * Loads a model from the resolved configuration URL.
     *
     * @param config - Resolved model descriptor including offsets and scale.
     * @returns Loaded pivot hierarchy and bounds.
     */
    load(config: ResolvedModelConfig): Promise<LoadedAircraft>;
    /**
     * Disposes GPU resources for the currently loaded aircraft, if any.
     */
    dispose(): void;
    /**
     * Returns true when a model is currently loaded in memory.
     */
    hasLoadedModel(): boolean;
}

/**
 * @module ui/OverlayManager
 * @description Read-only 2D HUD rendered over the WebGL viewport.
 */

/**
 * Options for constructing {@link OverlayManager}.
 */
interface OverlayManagerOptions {
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
declare class OverlayManager {
    private readonly hud;
    private readonly refs;
    private readonly config;
    private telemetryUnsubscribe;
    private pendingSnapshot;
    private rafId;
    private disposed;
    /**
     * @param options - Parent mount point, config, and telemetry source.
     */
    constructor(options: OverlayManagerOptions);
    /**
     * Queues a HUD refresh on the next animation frame (coalesces rapid telemetry).
     *
     * @param snapshot - Latest telemetry snapshot.
     */
    scheduleUpdate(snapshot: TelemetrySnapshot): void;
    /**
     * Synchronously applies a snapshot (used for initial paint).
     *
     * @param snapshot - Telemetry snapshot to render.
     */
    update(snapshot: TelemetrySnapshot): void;
    /**
     * Cancels pending frames, unsubscribes, and removes HUD nodes.
     */
    dispose(): void;
    private applySnapshotToDom;
    private buildHud;
    private createCompass;
    private createArtificialHorizon;
    private appendMetricCard;
}

/**
 * @module display/DisplayHost
 * @description Contract for mounting the viewer into the consumer DOM.
 */

/**
 * Abstraction for embedded vs. floating viewer placement.
 */
interface DisplayHost {
    /** Root wrapper containing the viewport (and floating chrome, if any). */
    readonly root: HTMLElement;
    /**
     * Region where the WebGL canvas and HUD are mounted.
     * Resize observers should target this element.
     */
    readonly viewport: HTMLElement;
    /**
     * Drag handle for floating mode; `undefined` in embedded mode.
     */
    readonly dragHandle?: HTMLElement;
    /** Attaches the viewer structure to the configured container. */
    mount(): void;
    /**
     * Applies explicit or automatic dimensions.
     *
     * @param width - Pixel width or `'auto'`.
     * @param height - Pixel height or `'auto'`.
     */
    applyDimensions(width: DimensionValue, height: DimensionValue): void;
    /** Removes DOM nodes and detaches interaction handlers. */
    dispose(): void;
}
/**
 * Creates the shared viewport element used by all display modes.
 */
declare function createViewerViewport(): HTMLDivElement;
/**
 * Builds the viewer root shell with optional extra CSS classes.
 */
declare function createViewerRoot(modeClass: string, className?: string): HTMLDivElement;

/**
 * @module display/EmbeddedHost
 * @description Mounts the viewer inside the consumer container at 100% width/height.
 */

/**
 * Fills the supplied container with the viewer viewport and canvas stack.
 */
declare class EmbeddedHost implements DisplayHost {
    private readonly config;
    readonly root: HTMLDivElement;
    readonly viewport: HTMLDivElement;
    readonly dragHandle: undefined;
    private mounted;
    /**
     * @param config - Resolved viewer configuration.
     */
    constructor(config: ResolvedTelemetryFlightViewerConfig);
    /**
     * Clears the container and appends the viewer root so it fills the parent.
     */
    mount(): void;
    /**
     * Applies width/height to the root; viewport always stretches to 100%.
     */
    applyDimensions(width: DimensionValue, height: DimensionValue): void;
    /**
     * Removes the viewer root from the DOM.
     */
    dispose(): void;
}

/**
 * @module display/FloatingHost
 * @description Renders the viewer inside a draggable floating overlay panel.
 */

/**
 * Appends a fixed-position floating window with a drag header and sized viewport.
 */
declare class FloatingHost implements DisplayHost {
    private readonly config;
    readonly root: HTMLDivElement;
    readonly viewport: HTMLDivElement;
    readonly dragHandle: HTMLDivElement;
    private readonly shell;
    private readonly header;
    private dragController;
    private mounted;
    /**
     * @param config - Resolved viewer configuration.
     */
    constructor(config: ResolvedTelemetryFlightViewerConfig);
    /**
     * Appends the overlay to the configured container (often `document.body`).
     */
    mount(): void;
    /**
     * Updates floating panel dimensions.
     */
    applyDimensions(width?: DimensionValue, height?: DimensionValue): void;
    /**
     * Disposes drag handlers and removes the overlay from the DOM.
     */
    dispose(): void;
    private applyShellDimensions;
    private applyAnchor;
}

/**
 * @module interaction/DragController
 * @description Zero-dependency pointer dragging for floating viewer panels.
 */
/**
 * Options for {@link DragController}.
 */
interface DragControllerOptions {
    /** Element that initiates a drag (typically the panel header). */
    handle: HTMLElement;
    /** Element whose `left`/`top` position is updated while dragging. */
    target: HTMLElement;
    /** Minimum distance from viewport edges in pixels. @defaultValue 8 */
    margin?: number;
    /** Whether dragging is active. @defaultValue true */
    enabled?: boolean;
}
/**
 * Pointer-driven drag controller that keeps a panel within the viewport.
 */
declare class DragController {
    private readonly options;
    private readonly margin;
    private enabled;
    private disposed;
    private dragging;
    private pointerId;
    private offsetX;
    private offsetY;
    private readonly onPointerDown;
    private readonly onPointerMove;
    private readonly onPointerUp;
    /**
     * @param options - Handle, target, and boundary settings.
     */
    constructor(options: DragControllerOptions);
    /**
     * Enables or disables drag initiation without removing listeners.
     */
    setEnabled(enabled: boolean): void;
    /**
     * Returns true while the user is actively dragging.
     */
    isDragging(): boolean;
    /**
     * Removes all pointer listeners and ends an active drag session.
     */
    dispose(): void;
    private handlePointerDown;
    private handlePointerMove;
    private handlePointerUp;
    private endDrag;
    /**
     * Converts anchored positioning (top/right/bottom/left) into absolute coordinates.
     */
    private clearAnchorStyles;
}

/**
 * @module utils/dispose
 * @description Recursive disposal utilities for Three.js GPU resources.
 *
 * Prevents WebGL memory leaks when tearing down scenes, loaders, or individual
 * meshes. Safe to call multiple times on the same object graph if nodes were
 * already removed from the scene.
 */

/**
 * Object3D-like node that may carry renderable GPU resources.
 */
interface DisposableObject3D extends Object3D {
    geometry?: BufferGeometry;
    material?: Material | Material[];
}
/**
 * Disposes all GPU resources attached to an {@link Object3D} subtree.
 *
 * @param root - Root object to traverse (typically a Scene or Group).
 */
declare function disposeObject3D(root: Object3D): void;
/**
 * Disposes geometries, materials, and textures for a single object node.
 *
 * @param node - Object3D that may own a geometry and/or material(s).
 */
declare function disposeNodeResources(node: DisposableObject3D): void;
/**
 * Disposes a single material and all texture properties attached to it.
 *
 * @param material - Three.js material instance.
 */
declare function disposeMaterial(material: Material): void;
/**
 * Disposes a standalone texture if it has not already been destroyed.
 *
 * @param texture - Three.js texture instance.
 */
declare function disposeTexture(texture: Texture | null | undefined): void;

export { ALTITUDE_WORLD_SCALE, AircraftLoader, type CameraConfig, ChaseCamera, DEFAULT_DEMO_MODEL_URL, DEFAULT_TELEMETRY, type DimensionValue, type DimensionsConfig, type DisplayHost, type DisplayMode, DragController, type DragControllerOptions, EmbeddedHost, type EnvironmentConfig, FloatingHost, type FloatingPosition, type FloatingWindowConfig, LifecycleManager, type LoadedAircraft, type ModelConfig, type ModelOrientationOffset, OverlayManager, type OverlayManagerOptions, type ResolvedModelConfig, type ResolvedTelemetryFlightViewerConfig, SceneManager, type SceneManagerOptions, TelemetryFlightViewer, type TelemetryFlightViewerConfig, type TelemetryFlightViewerEvents, type TelemetryListener, type TelemetrySnapshot, TelemetryState, type TelemetryStateOptions, type TelemetryUnsubscribe, type TelemetryUpdatePayload, type UiElementsConfig, type ViewerState, createTelemetrySnapshot, createViewerRoot, createViewerViewport, disposeMaterial, disposeNodeResources, disposeObject3D, disposeTexture, getDefaultUiConfig, isValidTelemetryUpdate, normalizeHeadingDegrees, resolveConfig };
