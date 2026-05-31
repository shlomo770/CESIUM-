import { Group, Box3, Vector3, Quaternion, Matrix4, PerspectiveCamera, Scene, Euler, WebGLRenderer, Color, Fog, AmbientLight, DirectionalLight, GridHelper } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* @cesium-suite/telemetry-flight-viewer */

// src/types/telemetry.ts
var DEFAULT_TELEMETRY = Object.freeze({
  pitch: 0,
  roll: 0,
  yaw: 0,
  altitude: 1e3,
  speed: 0
});
function normalizeHeadingDegrees(degrees) {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  return (degrees % 360 + 360) % 360;
}
function createTelemetrySnapshot(source = {}) {
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
function isValidTelemetryUpdate(payload) {
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
  ];
  for (const key of numericKeys) {
    const value = payload[key];
    if (value !== void 0 && !Number.isFinite(value)) {
      return false;
    }
  }
  return true;
}

// src/config/resolveConfig.ts
var DEFAULT_DISPLAY_MODE = "embedded";
var DEFAULT_DIMENSIONS = {
  width: "auto",
  height: "auto"
};
var DEFAULT_UI = {
  compass: true,
  artificialHorizon: true,
  telemetryBar: true,
  crosshair: true,
  pitchRollReadout: true,
  statusLine: true
};
var DEFAULT_ENVIRONMENT = {
  backgroundColor: "#0b1220",
  fogEnabled: false,
  fogNear: 80,
  fogFar: 450,
  ambientIntensity: 0.55,
  directionalIntensity: 1.15,
  showGrid: true
};
var DEFAULT_FLOATING = {
  position: "bottom-right",
  width: 420,
  height: 320,
  zIndex: 1e4,
  draggable: true,
  title: "Flight Telemetry",
  margin: 16
};
var DEFAULT_CAMERA = {
  chaseDistance: 14,
  chaseHeight: 4,
  lookAhead: 20,
  fov: 55,
  smoothing: 0.12
};
var DEFAULT_MODEL_ORIENTATION = {
  pitch: 0,
  roll: 0,
  yaw: 0
};
function resolveConfig(config) {
  validateRootConfig(config);
  const initialTelemetry = createTelemetrySnapshot(config.initialTelemetry);
  return {
    container: config.container,
    displayMode: config.displayMode ?? DEFAULT_DISPLAY_MODE,
    model: resolveModelConfig(config.model),
    antialias: config.antialias ?? true,
    autoResize: config.autoResize ?? true,
    pixelRatio: resolvePixelRatio(config.pixelRatio),
    className: config.className,
    dimensions: resolveDimensions(config.dimensions),
    ui: resolveUi(config.ui),
    environment: resolveEnvironment(config.environment),
    floating: resolveFloating(config.floating),
    camera: resolveCamera(config.camera),
    initialTelemetry
  };
}
function getDefaultUiConfig() {
  return { ...DEFAULT_UI };
}
function resolveModelConfig(model) {
  const url = model.url.trim();
  if (!url) {
    throw new TypeError(
      "resolveConfig: `model.url` must be a non-empty string."
    );
  }
  const scale = model.scale ?? 1;
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new TypeError(
      "resolveConfig: `model.scale` must be a positive finite number."
    );
  }
  return {
    url,
    name: resolveModelName(model.name),
    scale,
    orientationOffset: resolveOrientationOffset(model.orientationOffset)
  };
}
function resolveModelName(name) {
  if (typeof name === "string") {
    const trimmed = name.trim();
    return trimmed || "aircraft";
  }
  if (name != null && name !== "") {
    return String(name).trim() || "aircraft";
  }
  return "aircraft";
}
function resolveOrientationOffset(offset) {
  return {
    pitch: offset?.pitch ?? DEFAULT_MODEL_ORIENTATION.pitch,
    roll: offset?.roll ?? DEFAULT_MODEL_ORIENTATION.roll,
    yaw: offset?.yaw ?? DEFAULT_MODEL_ORIENTATION.yaw
  };
}
function resolveDimensions(dimensions) {
  return {
    width: dimensions?.width ?? DEFAULT_DIMENSIONS.width,
    height: dimensions?.height ?? DEFAULT_DIMENSIONS.height
  };
}
function resolveUi(ui) {
  return {
    compass: ui?.compass ?? DEFAULT_UI.compass,
    artificialHorizon: ui?.artificialHorizon ?? DEFAULT_UI.artificialHorizon,
    telemetryBar: ui?.telemetryBar ?? DEFAULT_UI.telemetryBar,
    crosshair: ui?.crosshair ?? DEFAULT_UI.crosshair,
    pitchRollReadout: ui?.pitchRollReadout ?? DEFAULT_UI.pitchRollReadout,
    statusLine: ui?.statusLine ?? DEFAULT_UI.statusLine
  };
}
function resolveEnvironment(environment) {
  return {
    backgroundColor: environment?.backgroundColor ?? DEFAULT_ENVIRONMENT.backgroundColor,
    fogEnabled: environment?.fogEnabled ?? DEFAULT_ENVIRONMENT.fogEnabled,
    fogNear: environment?.fogNear ?? DEFAULT_ENVIRONMENT.fogNear,
    fogFar: environment?.fogFar ?? DEFAULT_ENVIRONMENT.fogFar,
    ambientIntensity: environment?.ambientIntensity ?? DEFAULT_ENVIRONMENT.ambientIntensity,
    directionalIntensity: environment?.directionalIntensity ?? DEFAULT_ENVIRONMENT.directionalIntensity,
    showGrid: environment?.showGrid ?? DEFAULT_ENVIRONMENT.showGrid
  };
}
function resolveFloating(floating) {
  const width = floating?.width ?? DEFAULT_FLOATING.width;
  const height = floating?.height ?? DEFAULT_FLOATING.height;
  if (!Number.isFinite(width) || width <= 0) {
    throw new TypeError(
      "resolveConfig: `floating.width` must be a positive finite number."
    );
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new TypeError(
      "resolveConfig: `floating.height` must be a positive finite number."
    );
  }
  return {
    position: floating?.position ?? DEFAULT_FLOATING.position,
    width,
    height,
    zIndex: floating?.zIndex ?? DEFAULT_FLOATING.zIndex,
    draggable: floating?.draggable ?? DEFAULT_FLOATING.draggable,
    title: floating?.title?.trim() || DEFAULT_FLOATING.title,
    margin: floating?.margin ?? DEFAULT_FLOATING.margin
  };
}
function resolveCamera(camera) {
  const resolved = {
    chaseDistance: camera?.chaseDistance ?? DEFAULT_CAMERA.chaseDistance,
    chaseHeight: camera?.chaseHeight ?? DEFAULT_CAMERA.chaseHeight,
    lookAhead: camera?.lookAhead ?? DEFAULT_CAMERA.lookAhead,
    fov: camera?.fov ?? DEFAULT_CAMERA.fov,
    smoothing: camera?.smoothing ?? DEFAULT_CAMERA.smoothing
  };
  if (resolved.smoothing < 0 || resolved.smoothing > 1) {
    throw new TypeError(
      "resolveConfig: `camera.smoothing` must be within [0, 1]."
    );
  }
  if (resolved.fov <= 0 || resolved.fov >= 180) {
    throw new TypeError(
      "resolveConfig: `camera.fov` must be between 0 and 180 degrees."
    );
  }
  return resolved;
}
function resolvePixelRatio(explicit) {
  if (explicit !== void 0) {
    if (!Number.isFinite(explicit) || explicit <= 0) {
      throw new TypeError(
        "resolveConfig: `pixelRatio` must be a positive finite number."
      );
    }
    return explicit;
  }
  if (typeof window !== "undefined" && Number.isFinite(window.devicePixelRatio)) {
    return Math.min(window.devicePixelRatio, 2);
  }
  return 1;
}
function validateRootConfig(config) {
  if (!config || typeof config !== "object") {
    throw new TypeError("resolveConfig: config must be a non-null object.");
  }
  if (!(config.container instanceof HTMLElement)) {
    throw new TypeError(
      "resolveConfig: `container` must be a valid HTMLElement."
    );
  }
  if (!config.model || typeof config.model !== "object") {
    throw new TypeError("resolveConfig: `model` is required.");
  }
  if (typeof config.model.url !== "string") {
    throw new TypeError("resolveConfig: `model.url` must be a string.");
  }
  if (config.displayMode !== void 0 && config.displayMode !== "embedded" && config.displayMode !== "floating") {
    throw new TypeError(
      "resolveConfig: `displayMode` must be 'embedded' or 'floating'."
    );
  }
}

// src/core/LifecycleManager.ts
var LifecycleManager = class {
  constructor() {
    this.disposers = [];
    this.destroyed = false;
  }
  register(disposer) {
    if (this.destroyed) {
      disposer();
      return;
    }
    this.disposers.push(disposer);
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    while (this.disposers.length > 0) {
      const disposer = this.disposers.pop();
      try {
        disposer?.();
      } catch (error) {
        console.error("[TelemetryFlightViewer] dispose error:", error);
      }
    }
  }
  get isDestroyed() {
    return this.destroyed;
  }
};

// src/core/TelemetryState.ts
var TelemetryState = class {
  /**
   * @param options - Construction options.
   */
  constructor(options) {
    this.listeners = /* @__PURE__ */ new Set();
    this.updateCount = 0;
    const resolved = normalizeConstructorArg(options);
    this.strictValidation = resolved.strictValidation ?? true;
    this.snapshot = createTelemetrySnapshot(resolved.initial);
  }
  /**
   * Returns the current telemetry snapshot.
   * The returned object must be treated as read-only by consumers.
   */
  getSnapshot() {
    return this.snapshot;
  }
  /**
   * Returns the number of successful updates applied since construction.
   */
  getUpdateCount() {
    return this.updateCount;
  }
  /**
   * Returns the number of active subscribers.
   */
  getListenerCount() {
    return this.listeners.size;
  }
  /**
   * Applies a partial telemetry update and notifies subscribers.
   *
   * @param payload - Partial update; omitted fields are preserved.
   * @returns The new snapshot after merging.
   * @throws {TypeError} When `strictValidation` is enabled and values are non-finite.
   */
  applyUpdate(payload) {
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
  replace(next) {
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
  reset() {
    return this.replace({});
  }
  /**
   * Registers a listener invoked after every state mutation.
   *
   * @param listener - Callback receiving the latest snapshot.
   * @returns Unsubscribe function.
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  /**
   * Removes all registered listeners.
   */
  clearListeners() {
    this.listeners.clear();
  }
  /**
   * Removes all listeners and resets internal counters.
   * The latest snapshot is preserved.
   */
  dispose() {
    this.clearListeners();
    this.updateCount = 0;
  }
  /**
   * Notifies all subscribers with the current snapshot.
   */
  notifyListeners() {
    const current = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(current);
    }
  }
};
function normalizeConstructorArg(arg) {
  if (!arg) {
    return {};
  }
  if ("strictValidation" in arg || "initial" in arg) {
    return arg;
  }
  return { initial: arg };
}
function resolveYaw(payload, previousYaw) {
  if (payload.yaw !== void 0) {
    return normalizeHeadingDegrees(payload.yaw);
  }
  if (payload.heading !== void 0) {
    return normalizeHeadingDegrees(payload.heading);
  }
  return previousYaw;
}

// src/display/DisplayHost.ts
function createViewerViewport() {
  const viewport = document.createElement("div");
  viewport.className = "tfv-viewport";
  viewport.setAttribute("data-tfv-viewport", "true");
  return viewport;
}
function createViewerRoot(modeClass, className) {
  const root = document.createElement("div");
  root.className = ["tfv-root", modeClass, className].filter(Boolean).join(" ");
  return root;
}

// src/display/EmbeddedHost.ts
var MODE_CLASS = "tfv-root--embedded";
var EmbeddedHost = class {
  /**
   * @param config - Resolved viewer configuration.
   */
  constructor(config) {
    this.config = config;
    this.dragHandle = void 0;
    this.mounted = false;
    this.root = createViewerRoot(MODE_CLASS, config.className);
    this.viewport = createViewerViewport();
    this.root.appendChild(this.viewport);
  }
  /**
   * Clears the container and appends the viewer root so it fills the parent.
   */
  mount() {
    if (this.mounted) return;
    const { container } = this.config;
    container.innerHTML = "";
    container.style.position = container.style.position || "relative";
    container.style.overflow = container.style.overflow || "hidden";
    container.appendChild(this.root);
    this.applyDimensions(
      this.config.dimensions.width,
      this.config.dimensions.height
    );
    this.mounted = true;
  }
  /**
   * Applies width/height to the root; viewport always stretches to 100%.
   */
  applyDimensions(width, height) {
    const widthCss = width === "auto" ? "100%" : `${width}px`;
    const heightCss = height === "auto" ? "100%" : `${height}px`;
    this.root.style.width = widthCss;
    this.root.style.height = heightCss;
    this.root.style.minWidth = "0";
    this.root.style.minHeight = "0";
    this.viewport.style.width = "100%";
    this.viewport.style.height = "100%";
    this.viewport.style.minHeight = "0";
    if (width !== "auto" && height !== "auto") {
      this.config.container.style.width = widthCss;
      this.config.container.style.height = heightCss;
    } else {
      this.config.container.style.width = "100%";
      this.config.container.style.height = "100%";
    }
  }
  /**
   * Removes the viewer root from the DOM.
   */
  dispose() {
    this.root.remove();
    this.mounted = false;
  }
};

// src/interaction/DragController.ts
var DragController = class {
  /**
   * @param options - Handle, target, and boundary settings.
   */
  constructor(options) {
    this.options = options;
    this.disposed = false;
    this.dragging = false;
    this.pointerId = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.margin = options.margin ?? 8;
    this.enabled = options.enabled ?? true;
    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);
    const { handle } = options;
    handle.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }
  /**
   * Enables or disables drag initiation without removing listeners.
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.dragging) {
      this.endDrag();
    }
  }
  /**
   * Returns true while the user is actively dragging.
   */
  isDragging() {
    return this.dragging;
  }
  /**
   * Removes all pointer listeners and ends an active drag session.
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.endDrag();
    const { handle } = this.options;
    handle.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }
  handlePointerDown(event) {
    if (this.disposed || !this.enabled || event.button !== 0) return;
    const { handle, target } = this.options;
    const rect = target.getBoundingClientRect();
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;
    this.clearAnchorStyles(target);
    handle.setPointerCapture(event.pointerId);
    target.classList.add("tfv-floating--dragging");
    handle.classList.add("tfv-floating__header--active");
    event.preventDefault();
  }
  handlePointerMove(event) {
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    const { target } = this.options;
    const width = target.offsetWidth;
    const height = target.offsetHeight;
    const maxLeft = Math.max(this.margin, window.innerWidth - width - this.margin);
    const maxTop = Math.max(this.margin, window.innerHeight - height - this.margin);
    const left = clamp(event.clientX - this.offsetX, this.margin, maxLeft);
    const top = clamp(event.clientY - this.offsetY, this.margin, maxTop);
    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
    target.style.right = "auto";
    target.style.bottom = "auto";
    target.style.transform = "none";
  }
  handlePointerUp(event) {
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    this.endDrag();
  }
  endDrag() {
    if (!this.dragging) return;
    const { handle, target } = this.options;
    if (this.pointerId !== null) {
      try {
        handle.releasePointerCapture(this.pointerId);
      } catch {
      }
    }
    this.dragging = false;
    this.pointerId = null;
    target.classList.remove("tfv-floating--dragging");
    handle.classList.remove("tfv-floating__header--active");
  }
  /**
   * Converts anchored positioning (top/right/bottom/left) into absolute coordinates.
   */
  clearAnchorStyles(target) {
    const rect = target.getBoundingClientRect();
    target.style.position = "fixed";
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;
    target.style.right = "auto";
    target.style.bottom = "auto";
    target.style.transform = "none";
  }
};
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// src/display/FloatingHost.ts
var MODE_CLASS2 = "tfv-root--floating";
var FloatingHost = class {
  /**
   * @param config - Resolved viewer configuration.
   */
  constructor(config) {
    this.config = config;
    this.dragController = null;
    this.mounted = false;
    const { floating } = config;
    this.root = createViewerRoot(MODE_CLASS2, config.className);
    this.root.style.zIndex = String(floating.zIndex);
    this.shell = document.createElement("div");
    this.shell.className = "tfv-floating";
    this.shell.setAttribute("role", "dialog");
    this.shell.setAttribute("aria-label", floating.title);
    this.header = document.createElement("div");
    this.header.className = "tfv-floating__header";
    this.header.textContent = floating.title;
    this.header.setAttribute("aria-grabbed", "false");
    this.viewport = createViewerViewport();
    this.shell.append(this.header, this.viewport);
    this.root.appendChild(this.shell);
    this.dragHandle = this.header;
    this.applyShellDimensions(floating.width, floating.height);
    this.applyAnchor(floating.position, floating.margin);
  }
  /**
   * Appends the overlay to the configured container (often `document.body`).
   */
  mount() {
    if (this.mounted) return;
    this.config.container.appendChild(this.root);
    if (this.config.floating.draggable) {
      this.dragController = new DragController({
        handle: this.header,
        target: this.shell,
        margin: this.config.floating.margin,
        enabled: true
      });
    }
    this.mounted = true;
  }
  /**
   * Updates floating panel dimensions.
   */
  applyDimensions(width = this.config.floating.width, height = this.config.floating.height) {
    const w = width === "auto" ? this.config.floating.width : width;
    const h = height === "auto" ? this.config.floating.height : height;
    this.applyShellDimensions(w, h);
  }
  /**
   * Disposes drag handlers and removes the overlay from the DOM.
   */
  dispose() {
    this.dragController?.dispose();
    this.dragController = null;
    this.root.remove();
    this.mounted = false;
  }
  applyShellDimensions(width, height) {
    this.shell.style.width = `${width}px`;
    this.shell.style.height = `${height}px`;
  }
  applyAnchor(position, margin) {
    this.shell.style.position = "fixed";
    const m = `${margin}px`;
    this.shell.style.top = "";
    this.shell.style.left = "";
    this.shell.style.right = "";
    this.shell.style.bottom = "";
    this.shell.style.transform = "";
    switch (position) {
      case "top-left":
        this.shell.style.top = m;
        this.shell.style.left = m;
        break;
      case "top-right":
        this.shell.style.top = m;
        this.shell.style.right = m;
        break;
      case "bottom-left":
        this.shell.style.bottom = m;
        this.shell.style.left = m;
        break;
      case "center":
        this.shell.style.top = "50%";
        this.shell.style.left = "50%";
        this.shell.style.transform = "translate(-50%, -50%)";
        break;
      case "bottom-right":
      default:
        this.shell.style.bottom = m;
        this.shell.style.right = m;
        break;
    }
  }
};

// src/utils/dispose.ts
var MATERIAL_TEXTURE_KEYS = [
  "map",
  "alphaMap",
  "aoMap",
  "bumpMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "specularMap",
  "gradientMap",
  "matcap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
  "iridescenceMap",
  "iridescenceThicknessMap",
  "sheenColorMap",
  "sheenRoughnessMap",
  "specularColorMap",
  "specularIntensityMap",
  "thicknessMap",
  "transmissionMap"
];
function disposeObject3D(root) {
  if (!root) return;
  root.traverse((node) => {
    disposeNodeResources(node);
  });
}
function disposeNodeResources(node) {
  disposeGeometry(node.geometry);
  disposeMaterialOrArray(node.material);
}
function disposeMaterial(material) {
  if (!material) return;
  disposeMaterialTextures(material);
  if (typeof material.dispose === "function") {
    material.dispose();
  }
}
function disposeTexture(texture) {
  if (!texture) return;
  if (typeof texture.dispose === "function") {
    texture.dispose();
  }
}
function disposeMaterialOrArray(material) {
  if (!material) return;
  if (Array.isArray(material)) {
    for (const entry of material) {
      disposeMaterial(entry);
    }
    return;
  }
  disposeMaterial(material);
}
function disposeGeometry(geometry) {
  if (!geometry) return;
  if (typeof geometry.dispose === "function") {
    geometry.dispose();
  }
}
function disposeMaterialTextures(material) {
  const record = material;
  for (const key of MATERIAL_TEXTURE_KEYS) {
    const value = record[key];
    if (isTexture(value)) {
      disposeTexture(value);
    }
  }
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (isTexture(value)) {
      disposeTexture(value);
    }
  }
}
function isTexture(value) {
  return value !== null && typeof value === "object" && "isTexture" in value && value.isTexture === true;
}

// src/utils/math.ts
var DEG2RAD = Math.PI / 180;
function degToRad(degrees) {
  return degrees * DEG2RAD;
}
function clamp2(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
var MIN_NORMALIZE_EXTENT = 0.5;
var TARGET_NORMALIZE_EXTENT = 2;
var AircraftLoader = class {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.activePivot = null;
  }
  /**
   * Loads a model from the resolved configuration URL.
   *
   * @param config - Resolved model descriptor including offsets and scale.
   * @returns Loaded pivot hierarchy and bounds.
   */
  async load(config) {
    this.dispose();
    const gltf = await this.gltfLoader.loadAsync(config.url);
    const model = gltf.scene;
    model.name = config.name;
    const pivot = new Group();
    pivot.name = `${config.name}-pivot`;
    const modelMount = new Group();
    modelMount.name = `${config.name}-mount`;
    modelMount.add(model);
    pivot.add(modelMount);
    applyOrientationOffset(modelMount, config.orientationOffset);
    applyUniformScale(pivot, config.scale);
    autoNormalizeScale(pivot);
    this.activePivot = pivot;
    const bounds = new Box3().setFromObject(pivot);
    return {
      pivot,
      modelMount,
      model,
      bounds
    };
  }
  /**
   * Disposes GPU resources for the currently loaded aircraft, if any.
   */
  dispose() {
    if (!this.activePivot) return;
    disposeObject3D(this.activePivot);
    this.activePivot = null;
  }
  /**
   * Returns true when a model is currently loaded in memory.
   */
  hasLoadedModel() {
    return this.activePivot !== null;
  }
};
function applyOrientationOffset(modelMount, offset) {
  modelMount.rotation.order = "YXZ";
  modelMount.rotation.set(
    degToRad(offset.pitch),
    degToRad(offset.yaw),
    degToRad(offset.roll)
  );
}
function applyUniformScale(pivot, scale) {
  pivot.scale.setScalar(scale);
}
function autoNormalizeScale(pivot) {
  const bounds = new Box3().setFromObject(pivot);
  const size = bounds.getSize(new Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 1e-3);
  if (maxAxis >= MIN_NORMALIZE_EXTENT) {
    return;
  }
  const multiplier = TARGET_NORMALIZE_EXTENT / maxAxis;
  pivot.scale.multiplyScalar(multiplier);
}
var ALTITUDE_WORLD_SCALE = 0.01;
var ChaseCamera = class {
  /**
   * @param config - Resolved camera parameters from {@link resolveConfig}.
   */
  constructor(config) {
    this.smoothedPosition = new Vector3();
    this.smoothedQuaternion = new Quaternion();
    this.targetPosition = new Vector3();
    this.targetQuaternion = new Quaternion();
    this.lookAtMatrix = new Matrix4();
    this.forward = new Vector3();
    this.right = new Vector3();
    this.up = new Vector3();
    this.worldUp = new Vector3(0, 1, 0);
    this.lookAtTarget = new Vector3();
    this.aircraftPosition = new Vector3();
    this.smoothedPitch = 0;
    this.smoothedRoll = 0;
    this.smoothedYaw = 0;
    this.smoothedAltitude = 0;
    this.initialized = false;
    this.config = config;
    this.camera = new PerspectiveCamera(config.fov, 1, 0.1, 8e3);
    this.camera.position.set(0, config.chaseHeight, -config.chaseDistance);
  }
  /**
   * Updates aspect ratio after a viewport resize.
   *
   * @param width - Drawable width in pixels.
   * @param height - Drawable height in pixels.
   */
  resize(width, height) {
    const safeHeight = Math.max(height, 1);
    this.camera.aspect = width / safeHeight;
    this.camera.updateProjectionMatrix();
  }
  /**
   * Advances the chase camera toward the telemetry-driven target transform.
   *
   * @param telemetry - Latest external telemetry snapshot.
   * @param deltaSeconds - Frame delta time in seconds.
   */
  update(telemetry, deltaSeconds) {
    const alpha = smoothingAlpha(this.config.smoothing, deltaSeconds);
    this.smoothedPitch = lerpAngleDegrees(
      this.smoothedPitch,
      telemetry.pitch,
      alpha
    );
    this.smoothedRoll = lerpAngleDegrees(
      this.smoothedRoll,
      telemetry.roll,
      alpha
    );
    this.smoothedYaw = lerpAngleDegrees(
      this.smoothedYaw,
      telemetry.yaw,
      alpha
    );
    this.smoothedAltitude = lerp(
      this.smoothedAltitude,
      telemetry.altitude,
      alpha
    );
    this.computeTargetTransform(
      this.smoothedPitch,
      this.smoothedYaw,
      this.smoothedAltitude
    );
    if (!this.initialized) {
      this.smoothedPosition.copy(this.targetPosition);
      this.smoothedQuaternion.copy(this.targetQuaternion);
      this.initialized = true;
    } else {
      this.smoothedPosition.lerp(this.targetPosition, alpha);
      this.smoothedQuaternion.slerp(this.targetQuaternion, alpha);
    }
    this.camera.position.copy(this.smoothedPosition);
    this.camera.quaternion.copy(this.smoothedQuaternion);
  }
  /**
   * Resets smoothing state (e.g. after a hard telemetry snap).
   */
  resetSmoothing(telemetry) {
    this.initialized = false;
    if (!telemetry) return;
    this.smoothedPitch = telemetry.pitch;
    this.smoothedRoll = telemetry.roll;
    this.smoothedYaw = telemetry.yaw;
    this.smoothedAltitude = telemetry.altitude;
  }
  /**
   * Releases camera resources (symmetry hook; PerspectiveCamera has no GPU data).
   */
  dispose() {
    this.initialized = false;
  }
  /**
   * Builds the desired camera position and orientation for the smoothed attitude.
   */
  computeTargetTransform(pitchDeg, yawDeg, altitudeM) {
    const yawRad = degToRad(yawDeg);
    const pitchRad = degToRad(pitchDeg);
    this.aircraftPosition.set(0, altitudeM * ALTITUDE_WORLD_SCALE, 0);
    this.forward.set(
      Math.sin(yawRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      Math.cos(yawRad) * Math.cos(pitchRad)
    );
    if (this.forward.lengthSq() < 1e-8) {
      this.forward.set(0, 0, 1);
    }
    this.forward.normalize();
    this.right.set(Math.cos(yawRad), 0, -Math.sin(yawRad)).normalize();
    this.up.crossVectors(this.right, this.forward).normalize();
    if (this.up.lengthSq() < 1e-8) {
      this.up.copy(this.worldUp);
    }
    this.targetPosition.copy(this.aircraftPosition).addScaledVector(this.forward, -this.config.chaseDistance).addScaledVector(this.up, this.config.chaseHeight);
    this.lookAtTarget.copy(this.aircraftPosition).addScaledVector(this.forward, this.config.lookAhead);
    this.lookAtMatrix.lookAt(
      this.targetPosition,
      this.lookAtTarget,
      this.worldUp
    );
    this.targetQuaternion.setFromRotationMatrix(this.lookAtMatrix);
  }
};
function smoothingAlpha(smoothing, deltaSeconds) {
  const rate = clamp2(smoothing, 0, 1) * 12;
  return 1 - Math.exp(-rate * Math.max(deltaSeconds, 0));
}
function lerpAngleDegrees(from, to, t) {
  const delta = ((to - from) % 360 + 540) % 360 - 180;
  return from + delta * clamp2(t, 0, 1);
}

// src/scene/SceneManager.ts
var SceneManager = class {
  /**
   * @param options - Scene dependencies and configuration.
   */
  constructor(options) {
    this.scene = new Scene();
    this.aircraftRoot = new Group();
    this.aircraftLoader = new AircraftLoader();
    this.targetQuaternion = new Quaternion();
    this.smoothedQuaternion = new Quaternion();
    this.targetEuler = new Euler(0, 0, 0, "YXZ");
    this.loadedAircraft = null;
    this.telemetryUnsubscribe = null;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.contextLost = false;
    this.destroyed = false;
    this.grid = null;
    this.lights = [];
    this.contextLostHandler = null;
    this.contextRestoredHandler = null;
    this.boundCanvas = null;
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
  async loadModel() {
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
  start() {
    this.assertNotDestroyed();
    if (this.animationFrameId !== null) return;
    this.lastFrameTime = performance.now();
    const tick = (now) => {
      this.animationFrameId = requestAnimationFrame(tick);
      if (this.contextLost || this.destroyed) {
        return;
      }
      const deltaSeconds = Math.min((now - this.lastFrameTime) / 1e3, 0.05);
      this.lastFrameTime = now;
      this.renderFrame(deltaSeconds);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }
  /**
   * Stops the render loop without releasing GPU resources.
   */
  stop() {
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
  resize(width, height) {
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
  destroy() {
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
  setTelemetry(telemetry) {
    if (this.destroyed) return;
    this.latestTelemetry = { ...telemetry };
  }
  /**
   * Returns true when the WebGL context is currently lost.
   */
  isContextLost() {
    return this.contextLost;
  }
  bindTelemetry() {
    this.telemetryUnsubscribe = this.telemetryState.subscribe((snapshot) => {
      this.latestTelemetry = { ...snapshot };
    });
  }
  unbindTelemetry() {
    this.telemetryUnsubscribe?.();
    this.telemetryUnsubscribe = null;
  }
  renderFrame(deltaSeconds) {
    const alpha = smoothingAlpha2(this.config.camera.smoothing, deltaSeconds);
    this.applyAircraftTransform(this.latestTelemetry, alpha);
    this.chaseCamera.update(this.latestTelemetry, deltaSeconds);
    this.renderer.render(this.scene, this.chaseCamera.camera);
  }
  /**
   * Applies smoothed telemetry rotation to the outer aircraft root and
   * positions the pivot by altitude.
   */
  applyAircraftTransform(telemetry, alpha) {
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
  applyEnvironment() {
    const { environment } = this.config;
    const bg = environment.backgroundColor;
    if (bg === null || bg === "transparent") {
      this.renderer.setClearColor(0, 0);
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
  setupLights() {
    const { environment } = this.config;
    const ambient = new AmbientLight(16777215, environment.ambientIntensity);
    const key = new DirectionalLight(
      16777215,
      environment.directionalIntensity
    );
    key.position.set(60, 120, 45);
    const fill = new DirectionalLight(
      9684477,
      environment.directionalIntensity * 0.35
    );
    fill.position.set(-50, 40, -60);
    this.lights = [ambient, key, fill];
    this.scene.add(...this.lights);
    if (environment.showGrid) {
      this.grid = new GridHelper(240, 48, 3359061, 1976635);
      this.grid.position.y = 0;
      this.scene.add(this.grid);
    }
  }
  isTransparentBackground() {
    const bg = this.config.environment.backgroundColor;
    return bg === null || bg === "transparent";
  }
  bindContextEvents(canvas) {
    this.boundCanvas = canvas;
    this.contextLostHandler = (event) => {
      event.preventDefault();
      this.contextLost = true;
      this.stop();
    };
    this.contextRestoredHandler = () => {
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
  unbindContextEvents() {
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
  assertNotDestroyed() {
    if (this.destroyed) {
      throw new Error("SceneManager: instance has been destroyed.");
    }
  }
};
function smoothingAlpha2(smoothing, deltaSeconds) {
  const rate = Math.max(0, Math.min(1, smoothing)) * 12;
  return 1 - Math.exp(-rate * Math.max(deltaSeconds, 0));
}

// src/ui/overlay.css
var overlay_default = {};

// src/ui/OverlayManager.ts
var STYLE_ELEMENT_ID = "telemetry-flight-viewer-styles";
var OverlayManager = class {
  /**
   * @param options - Parent mount point, config, and telemetry source.
   */
  constructor(options) {
    this.refs = {};
    this.telemetryUnsubscribe = null;
    this.pendingSnapshot = null;
    this.rafId = null;
    this.disposed = false;
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
  scheduleUpdate(snapshot) {
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
  update(snapshot) {
    if (this.disposed) return;
    this.applySnapshotToDom(snapshot);
  }
  /**
   * Cancels pending frames, unsubscribes, and removes HUD nodes.
   */
  dispose() {
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
  applySnapshotToDom(snapshot) {
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
      this.refs.compassLabel.textContent = `${heading}\xB0`;
    }
    if (this.refs.horizonBank) {
      this.refs.horizonBank.style.transform = `rotate(${-snapshot.roll}deg)`;
    }
    if (this.refs.horizonPitch) {
      const pitchPx = clamp3(snapshot.pitch, -45, 45) * 1.15;
      this.refs.horizonPitch.style.transform = `translate3d(0, ${pitchPx}px, 0)`;
    }
    if (this.refs.attitudeBlock) {
      this.refs.attitudeBlock.textContent = [
        `PITCH ${snapshot.pitch.toFixed(1)}\xB0`,
        `ROLL  ${snapshot.roll.toFixed(1)}\xB0`,
        `HDG   ${heading}\xB0`
      ].join("\n");
    }
    if (this.refs.statusLine) {
      const lat = snapshot.latitude !== void 0 ? snapshot.latitude.toFixed(5) : "------";
      const lng = snapshot.longitude !== void 0 ? snapshot.longitude.toFixed(5) : "------";
      this.refs.statusLine.textContent = `LAT ${lat}  LNG ${lng}`;
    }
  }
  buildHud(ui) {
    if (ui.telemetryBar) {
      const bar = document.createElement("div");
      bar.className = "tfv-hud__bar";
      this.refs.speed = this.appendMetricCard(bar, "SPD", "KM/H");
      this.refs.altitude = this.appendMetricCard(bar, "ALT", "M");
      this.refs.pitch = this.appendMetricCard(bar, "PIT", "\xB0");
      this.refs.roll = this.appendMetricCard(bar, "ROL", "\xB0");
      this.refs.yaw = this.appendMetricCard(bar, "HDG", "\xB0");
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
  createCompass() {
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
  createArtificialHorizon() {
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
  appendMetricCard(parent, label, unit) {
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
};
function injectOverlayStylesOnce() {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = overlay_default;
  document.head.appendChild(style);
}
function clamp3(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// src/utils/resizeObserver.ts
var ElementResizeWatcher = class {
  constructor(element, onResize) {
    this.element = element;
    this.onResize = onResize;
    this.observer = null;
    this.onWindowResize = () => {
      this.emitCurrent();
    };
  }
  start() {
    if (typeof ResizeObserver === "undefined") {
      this.emitCurrent();
      window.addEventListener("resize", this.onWindowResize);
      return;
    }
    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        this.onResize(width, height);
      }
    });
    this.observer.observe(this.element);
    this.emitCurrent();
  }
  stop() {
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener("resize", this.onWindowResize);
  }
  emitCurrent() {
    const rect = this.element.getBoundingClientRect();
    const width = rect.width || this.element.clientWidth;
    const height = rect.height || this.element.clientHeight;
    if (width > 0 && height > 0) {
      this.onResize(width, height);
    }
  }
};

// src/TelemetryFlightViewer.ts
var DEFAULT_DEMO_MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb";
var TelemetryFlightViewer = class {
  /**
   * @param config - Consumer configuration (merged with library defaults).
   * @param events - Optional lifecycle callbacks.
   */
  constructor(config, events = {}) {
    this.lifecycle = new LifecycleManager();
    this.displayHost = null;
    this.sceneManager = null;
    this.overlayManager = null;
    this.resizeWatcher = null;
    this.canvas = null;
    this.telemetryBridgeUnsubscribe = null;
    this._state = "idle";
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
  get state() {
    return this._state;
  }
  /**
   * Resolved configuration after defaults are applied (read-only).
   */
  get config() {
    return this.resolvedConfig;
  }
  /**
   * Returns true when the viewer has finished {@link initialize}.
   */
  get isReady() {
    return this._state === "ready";
  }
  /**
   * Returns the latest telemetry snapshot from the internal store.
   */
  getTelemetry() {
    return this.telemetryState.getSnapshot();
  }
  /**
   * Streams external telemetry into the viewer. This is the sole control API.
   *
   * @param data - Partial telemetry update; omitted fields are preserved.
   * @returns The merged snapshot after the update is applied.
   */
  updateTelemetry(data) {
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
  async initialize() {
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
      await this.sceneManager.loadModel();
      this.sceneManager.start();
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
  resize(width, height) {
    if (this._state !== "ready" || !this.sceneManager) return;
    this.sceneManager.resize(width, height);
  }
  /**
   * Stops rendering and disposes all subsystems (DOM, WebGL, listeners).
   */
  destroy() {
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
  mountDisplay() {
    this.displayHost = this.createDisplayHost();
    this.displayHost.mount();
  }
  mountCanvas() {
    if (!this.displayHost) return;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "tfv-canvas";
    this.displayHost.viewport.appendChild(this.canvas);
  }
  mountScene() {
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
  mountOverlay() {
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
  bindResize() {
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
  createDisplayHost() {
    if (this.resolvedConfig.displayMode === "floating") {
      return new FloatingHost(this.resolvedConfig);
    }
    return new EmbeddedHost(this.resolvedConfig);
  }
  /**
   * Disposes scene, overlay, display, and canvas in a safe order.
   */
  teardownSubsystems() {
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
};
function validateConstructorConfig(config) {
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

export { ALTITUDE_WORLD_SCALE, AircraftLoader, ChaseCamera, DEFAULT_DEMO_MODEL_URL, DEFAULT_TELEMETRY, DragController, EmbeddedHost, FloatingHost, LifecycleManager, OverlayManager, SceneManager, TelemetryFlightViewer, TelemetryState, createTelemetrySnapshot, createViewerRoot, createViewerViewport, disposeMaterial, disposeNodeResources, disposeObject3D, disposeTexture, getDefaultUiConfig, isValidTelemetryUpdate, normalizeHeadingDegrees, resolveConfig };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map