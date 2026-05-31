# @cesium-suite/cesium-flight-simulator

**Embeddable Cesium globe flight simulator for React applications.**

Drop a production-ready 3D flight experience into any React app: satellite map tiles, GLTF aircraft on the globe, chase camera, HUD overlays, flight trail, keyboard simulation, and external telemetry streaming — all driven by a single declarative configuration object.

---

## Table of contents

- [Why this package](#why-this-package)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Vite setup (required)](#vite-setup-required)
- [Quick start](#quick-start)
- [How configuration works](#how-configuration-works)
- [Widget props](#widget-props)
- [Complete configuration reference](#complete-configuration-reference)
  - [Top-level `mode`](#top-level-mode)
  - [`start`](#start)
  - [`window`](#window)
  - [`map`](#map)
  - [`aircraft`](#aircraft)
  - [`annotations`](#annotations)
  - [`camera`](#camera)
  - [`flight`](#flight)
  - [`trail`](#trail)
  - [`scene`](#scene)
  - [`terrain`](#terrain)
- [Configuration examples](#configuration-examples)
- [Flight modes](#flight-modes)
- [Map tile servers](#map-tile-servers)
- [Public API](#public-api)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Related packages](#related-packages)
- [License](#license)

---

## Why this package

This library packages the full **Cesium-based simulator** from the reference application. It is **not** the lightweight Three.js HUD viewer (`@cesium-suite/telemetry-flight-viewer`), which renders a 3D model on a dark background **without a map**.

Use **`@cesium-suite/cesium-flight-simulator`** when you need:

- A real **globe** and **imagery tiles**
- Aircraft positioned in **geographic coordinates**
- A **configurable HUD** and **flight trail** on the map
- **INTERNAL** (keyboard) or **EXTERNAL** (telemetry-only) operation

---

## Features

| Capability | Description |
|------------|-------------|
| **Cesium globe** | Full 3D Earth with custom or online imagery |
| **Tile servers** | ESRI World Imagery, local XYZ tiles, or custom URL templates |
| **GLTF / GLB aircraft** | Runtime model loading from your `public/` assets |
| **Chase camera** | Manual forward chase — stable, flight-direction aligned |
| **HUD overlays** | Speed, altitude, heading, pitch, roll, crosshair, attitude line |
| **Flight trail** | Glowing polyline following the aircraft on the globe |
| **View modes** | Flight camera and in-map side profile |
| **Layout modes** | Fullscreen, embedded fixed size, or draggable floating panel |
| **Telemetry API** | Stream lat/lng/altitude/attitude from WebSocket, MQTT, or simulation |
| **Deep config merge** | Override any subset of defaults via `configOverride` |

---

## Requirements

| Dependency | Version |
|------------|---------|
| Node.js | ≥ 18 |
| React | ≥ 18 |
| Cesium | ≥ 1.110 |
| Redux Toolkit + React-Redux | ≥ 2 / ≥ 9 |

The host app must serve Cesium Workers, Assets, ThirdParty, and Widgets (see [Vite setup](#vite-setup-required)).

---

## Installation

```bash
npm install @cesium-suite/cesium-flight-simulator cesium react react-dom react-redux @reduxjs/toolkit
npm install -D @vitejs/plugin-react vite-plugin-static-copy
```

**Install from this repository (local path):**

```bash
npm install "file:../path/to/packages/cesium-flight-simulator"
cd packages/cesium-flight-simulator && npm install && npm run build
```

---

## Vite setup (required)

Cesium loads Web Workers and static assets at runtime. Your bundler must copy them and define `CESIUM_BASE_URL`.

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify("/cesium")
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "node_modules/cesium/Build/Cesium/Workers", dest: "cesium" },
        { src: "node_modules/cesium/Build/Cesium/ThirdParty", dest: "cesium" },
        { src: "node_modules/cesium/Build/Cesium/Assets", dest: "cesium" },
        { src: "node_modules/cesium/Build/Cesium/Widgets", dest: "cesium" }
      ]
    })
  ],
  optimizeDeps: { include: ["cesium"] }
});
```

**Stylesheets** (app entry, e.g. `main.tsx`):

```tsx
import "cesium/Build/Cesium/Widgets/widgets.css";
import "@cesium-suite/cesium-flight-simulator/styles.css";
```

**Optional — Cesium Ion terrain** (`.env`):

```env
VITE_CESIUM_ION_TOKEN=your_token_here
```

---

## Quick start

```tsx
import { FlightSimulatorWidget } from "@cesium-suite/cesium-flight-simulator";

export default function App() {
  return (
    <FlightSimulatorWidget
      configOverride={{
        map: { mode: "ONLINE_ESRI" },
        aircraft: { modelUri: "/models/stealth_drone_perfect.glb" }
      }}
    />
  );
}
```

Place GLB/GLTF files in `public/models/`. Reference app: `using/my-cesium-app`.

---

## How configuration works

### Defaults

All defaults live in the exported object **`simulatorConfig`**:

```tsx
import { simulatorConfig } from "@cesium-suite/cesium-flight-simulator";
console.log(simulatorConfig.map.tileUrl);
```

### Overrides

Pass a **partial** object to **`configOverride`**. It is **deep-merged** onto `simulatorConfig`:

```tsx
<FlightSimulatorWidget
  configOverride={{
    window: { displayMode: "floating", width: 960, height: 640 },
    map: { mode: "LOCAL_XYZ", tileUrl: "http://server/tiles/{z}/{x}/{y}.jpg" },
    annotations: { crosshair: false }
  }}
/>
```

You only specify what you want to change — everything else keeps library defaults.

### TypeScript

```tsx
import type { SimulatorConfig, DeepPartial } from "@cesium-suite/cesium-flight-simulator";

const myConfig: DeepPartial<SimulatorConfig> = {
  map: { mode: "LOCAL_XYZ", tileUrl: "..." }
};
```

### What `configOverride` affects at runtime

| Section | Applied via `configOverride`? | Notes |
|---------|------------------------------|-------|
| `window` | ✅ Yes | Layout shell |
| `map` | ✅ Yes | Imagery layer |
| `aircraft` | ✅ Yes | Model, scale, orientation |
| `annotations` | ✅ Yes | HUD + trail visibility |
| `camera` | ✅ Yes | Chase camera |
| `scene` | ✅ Yes | Fog, sun, moon, atmosphere |
| `terrain` | ✅ Yes | Cesium Ion terrain |
| `trail` | ✅ Yes | Trail width, glow, point limits (rendering) |
| `mode` | ⚠️ Partial | Use widget prop `mode` (recommended) |
| `start` | ⚠️ Partial | Initial Redux state uses package defaults at load time |
| `flight` | ⚠️ Partial | Physics constants are read from defaults at Redux init |

> **Tip:** For `start` and `flight`, prefer changing defaults in `simulatorConfig` before build, or set initial position via `externalTelemetry` in EXTERNAL mode.

---

## Widget props

These are **React component props** on `FlightSimulatorWidget` — not part of `simulatorConfig`:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `"INTERNAL"` \| `"EXTERNAL"` | from config | Flight control source |
| `externalTelemetry` | `FlightTelemetry` | — | Live telemetry snapshot (EXTERNAL mode) |
| `enableKeyboard` | `boolean` | `true` | Keyboard flight controls (INTERNAL only) |
| `configOverride` | `DeepPartial<SimulatorConfig>` | — | Merged onto `simulatorConfig` |
| `externalInputsRef` | `MutableRefObject<FlightInputs>` | — | Inject custom input source |
| `initialViewMode` | `"FLIGHT_CAMERA"` \| `"MAP_SIDE_CAMERA"` | `"FLIGHT_CAMERA"` | Starting camera view |
| `className` | `string` | — | Extra CSS class on widget root |

### `FlightTelemetry` shape

| Field | Type | Required | Unit / notes |
|-------|------|----------|--------------|
| `latitude` | `number` | ✅ | WGS-84 degrees |
| `longitude` | `number` | ✅ | WGS-84 degrees |
| `altitudeM` | `number` | ✅ | meters MSL |
| `headingDeg` | `number` | ✅ | 0–360° |
| `pitchDeg` | `number` | ✅ | degrees, nose-up positive |
| `rollDeg` | `number` | ✅ | degrees, right-wing-down positive |
| `speedMps` | `number` | optional | meters per second |
| `timestamp` | `number` | optional | ms, for future use |

---

## Complete configuration reference

Below is **every field** in `simulatorConfig`, with type, default, and behaviour.

---

### Top-level `mode`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `"INTERNAL"` \| `"EXTERNAL"` | `"INTERNAL"` | **INTERNAL:** keyboard simulates flight. **EXTERNAL:** position/attitude come from telemetry only; no onboard controls. |

Prefer overriding via the widget prop `mode={...}` rather than `configOverride.mode`.

---

### `start`

Initial spawn point when the simulator loads (INTERNAL mode).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `latitude` | `number` | `32.0853` | WGS-84 latitude (degrees). Must be inside your tile coverage. |
| `longitude` | `number` | `34.7818` | WGS-84 longitude (degrees). |
| `altitudeM` | `number` | `1200` | Starting altitude in meters. |
| `headingDeg` | `number` | `25` | Initial heading 0–360° (clockwise from north). |
| `speedMps` | `number` | `145` | Initial ground speed in m/s (~522 km/h at default). |

```tsx
start: {
  latitude: 31.7683,
  longitude: 35.2137,
  altitudeM: 800,
  headingDeg: 90,
  speedMps: 120
}
```

---

### `window`

Controls **how the widget appears** in your page: fullscreen, fixed box, or draggable floating panel.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `displayMode` | `"fullscreen"` \| `"embedded"` \| `"floating"` | `"fullscreen"` | See [display modes](#window-displaymode) |
| `width` | `number` \| `"auto"` \| `"100%"` | `"100%"` | Panel width (embedded / floating) |
| `height` | `number` \| `"auto"` \| `"100%"` | `"100%"` | Panel height (embedded / floating) |
| `showViewModeToggle` | `boolean` | `true` | Show buttons to switch flight camera ↔ side map view |

#### `window.floating`

Used when `displayMode === "floating"`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `position` | See anchors below | `"bottom-right"` | Corner anchor **before** user drags |
| `draggable` | `boolean` | `true` | Drag panel by the header bar |
| `title` | `string` | `"Cesium Flight Simulator"` | Header text |
| `margin` | `number` | `16` | Minimum distance from viewport edges (px) |
| `zIndex` | `number` | `10000` | CSS stacking order |

**Anchor values for `floating.position`:**

| Value | Panel appears at |
|-------|------------------|
| `"top-left"` | Upper-left corner |
| `"top-right"` | Upper-right corner |
| `"bottom-left"` | Lower-left corner |
| `"bottom-right"` | Lower-right corner |
| `"center"` | Viewport center |

#### `window.displayMode` behaviour

| Mode | Behaviour |
|------|-----------|
| `"fullscreen"` | Widget fills parent container (`100%` × `100%` by default). Best for dedicated simulator pages. |
| `"embedded"` | Fixed-size box using `width` / `height`. Embed inside dashboards or split layouts. |
| `"floating"` | Overlay panel anchored to viewport; optionally draggable. Best for monitoring UIs. |

```tsx
window: {
  displayMode: "floating",
  width: 960,
  height: 640,
  floating: {
    position: "bottom-left",
    draggable: true,
    title: "Live Flight View",
    margin: 20,
    zIndex: 10000
  },
  showViewModeToggle: true
}
```

---

### `map`

Controls the **satellite / imagery layer** on the Cesium globe.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `"ONLINE_ESRI"` \| `"LOCAL_XYZ"` \| `"CUSTOM"` \| `"NONE"` | `"ONLINE_ESRI"` | Imagery source selector |
| `tileUrl` | `string` | `http://localhost:3001/tiles/...` | **Your tile server URL** for `LOCAL_XYZ` / `CUSTOM` |
| `onlineEsriUrl` | `string` | ESRI World Imagery URL | Used when `mode: "ONLINE_ESRI"` |
| `localXyzUrl` | `string` | same as `tileUrl` | **Deprecated** — use `tileUrl` |
| `urlTemplate` | `"XYZ"` \| `"ESRI_YX"` | `"XYZ"` | Reserved for future custom template handling |

#### `map.mode` values

| Mode | URL field used | Placeholder order | When to use |
|------|----------------|-------------------|-------------|
| `ONLINE_ESRI` | `onlineEsriUrl` | `{z}/{y}/{x}` | Quick start, global satellite imagery |
| `LOCAL_XYZ` | `tileUrl` | `{z}/{x}/{y}` | Private / local tile servers |
| `CUSTOM` | `tileUrl` | `{z}/{x}/{y}` | Same as LOCAL_XYZ (explicit intent) |
| `NONE` | — | — | Globe without imagery (blue ellipsoid) |

```tsx
map: {
  mode: "LOCAL_XYZ",
  tileUrl: "http://192.168.1.50:8080/satellite/{z}/{x}/{y}.png"
}
```

**Tile URL placeholders:**

| Placeholder | Meaning |
|-------------|---------|
| `{z}` | Zoom level |
| `{x}` | Tile column |
| `{y}` | Tile row |

Match the order to your server's layout. ESRI REST uses `{z}/{y}/{x}`; most local servers use `{z}/{x}/{y}`.

---

### `aircraft`

Controls the **3D aircraft** rendered on the globe (or as a 2D overlay).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `renderMode` | `"GLTF"` \| `"SCREEN_OVERLAY"` \| `"SIMPLE_ENTITY"` | `"GLTF"` | Rendering strategy (see below) |
| `modelUri` | `string` | `"/models/stealth_drone_perfect.glb"` | Path to GLB/GLTF under your app's `public/` folder |
| `scale` | `number` | `90` | Cesium model scale multiplier |
| `minimumPixelSize` | `number` | `130` | Minimum on-screen size in pixels (model stays visible when zoomed out) |
| `maximumScale` | `number` | `900` | Upper clamp for model scale at close range |
| `orientationMode` | `"NORMAL"` \| `"SWAP_PITCH_ROLL"` | `"SWAP_PITCH_ROLL"` | Fixes pitch/roll axis swap for some GLTF exports |
| `modelHeadingOffsetDeg` | `number` | `0` | Static heading correction applied to model mesh |
| `modelPitchOffsetDeg` | `number` | `0` | Static pitch correction (degrees) |
| `modelRollOffsetDeg` | `number` | `0` | Static roll correction (degrees) |
| `screenSizePx` | `number` | `150` | SVG overlay size when `renderMode: "SCREEN_OVERLAY"` |
| `screenOffsetYPx` | `number` | `28` | Vertical offset for screen overlay (pixels) |
| `lengthM` | `number` | `220` | Simple entity length (meters) for `SIMPLE_ENTITY` mode |
| `widthM` | `number` | `150` | Simple entity width (meters) |
| `heightM` | `number` | `60` | Simple entity height (meters) |

#### `aircraft.renderMode`

| Value | Description |
|-------|-------------|
| `"GLTF"` | Loads `modelUri` as a Cesium 3D model on the globe (**recommended**) |
| `"SCREEN_OVERLAY"` | 2D SVG-style aircraft drawn on screen center (no GLTF on globe) |
| `"SIMPLE_ENTITY"` | Basic Cesium box/entity placeholder (legacy) |

```tsx
aircraft: {
  renderMode: "GLTF",
  modelUri: "/models/my-uav.glb",
  scale: 75,
  orientationMode: "SWAP_PITCH_ROLL",
  modelHeadingOffsetDeg: 0
}
```

**Model file location:** place files in `public/models/` and reference as `/models/filename.glb`.

---

### `annotations`

Toggle **HUD overlays** and the **flight trail** independently.

| Field | Type | Default | What appears when `true` |
|-------|------|---------|--------------------------|
| `hudTop` | `boolean` | `true` | Top card strip: SPD (km/h), ALT (m), HDG, PITCH, ROLL, VIEW mode |
| `crosshair` | `boolean` | `true` | Center horizontal/vertical reticle + dot (flight camera only) |
| `attitudeIndicator` | `boolean` | `true` | Artificial horizon line that rolls/pitches with aircraft |
| `bottomTelemetry` | `boolean` | `true` | Bottom pill: LAT, LNG, ALT, trail point count, PAUSED badge |
| `trail` | `boolean` | `true` | Glowing cyan polyline on the globe behind the aircraft |
| `controlsHelp` | `boolean` | `false` | Keyboard help overlay (reserved; not yet rendered) |
| `debugPanel` | `boolean` | `false` | Debug panel (reserved; enable in examples for future use) |

```tsx
annotations: {
  hudTop: true,
  crosshair: true,
  attitudeIndicator: true,
  bottomTelemetry: true,
  trail: true,
  controlsHelp: false,
  debugPanel: false
}
```

Minimal HUD (map + aircraft only):

```tsx
annotations: {
  hudTop: false,
  crosshair: false,
  attitudeIndicator: false,
  bottomTelemetry: false,
  trail: false
}
```

---

### `camera`

Chase camera behaviour in **flight camera** view mode.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable automatic chase camera updates |
| `mode` | `"MANUAL_FORWARD_CHASE"` \| `"TOP"` | `"MANUAL_FORWARD_CHASE"` | Camera algorithm (see below) |
| `rangeBehindM` | `number` | `700` | Distance behind aircraft along flight path (meters) |
| `heightAboveM` | `number` | `170` | Camera height above aircraft (meters) |
| `lookAheadM` | `number` | `1400` | Point ahead of aircraft the camera looks toward (meters) |
| `minRangeM` | `number` | `220` | Minimum chase distance (reserved for zoom limits) |
| `maxRangeM` | `number` | `3800` | Maximum chase distance (reserved for zoom limits) |
| `headingCameraOffsetDeg` | `number` | `0` | Rotate chase direction; use `180` if camera feels reversed |

#### `camera.mode`

| Value | Description |
|-------|-------------|
| `"MANUAL_FORWARD_CHASE"` | Builds camera manually behind aircraft, looking forward along flight vector. Stable, no Cesium `lookAt` confusion. **Recommended.** |
| `"TOP"` | Top-down style (legacy alternative) |

```tsx
camera: {
  enabled: true,
  mode: "MANUAL_FORWARD_CHASE",
  rangeBehindM: 500,
  heightAboveM: 120,
  lookAheadM: 1000,
  headingCameraOffsetDeg: 0
}
```

---

### `flight`

Flight **physics tuning** for INTERNAL (keyboard) mode. Values control acceleration, turn rates, and attitude limits.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `minSpeedMps` | `number` | `55` | Minimum speed floor (m/s) |
| `maxSpeedMps` | `number` | `310` | Maximum speed ceiling (m/s) |
| `throttleAccelerationMps2` | `number` | `42` | Acceleration when holding throttle (Shift) |
| `brakeAccelerationMps2` | `number` | `55` | Deceleration when braking (Ctrl) |
| `pitchStepDeg` | `number` | `2.5` | Pitch change per key press (degrees) |
| `rollStepDeg` | `number` | `3.5` | Roll change per key press (degrees) |
| `maxPitchUpDeg` | `number` | `38` | Maximum nose-up pitch |
| `maxPitchDownDeg` | `number` | `-42` | Maximum nose-down pitch (negative) |
| `maxRollDeg` | `number` | `75` | Maximum bank angle either direction |
| `levelStepFactor` | `number` | `0.35` | Auto-level lerp factor toward 0° pitch/roll |
| `turnPowerDegPerSec` | `number` | `34` | Heading change rate from bank angle |
| `yawTrimPowerDegPerSec` | `number` | `9` | Direct yaw trim rate (Q/E keys) |
| `climbPower` | `number` | `0.92` | Vertical climb factor from pitch × speed |
| `minAltitudeAboveGroundM` | `number` | `20` | Minimum clearance above terrain (meters) |
| `maxAltitudeM` | `number` | `14000` | Altitude ceiling (meters) |

> **Note:** These constants are loaded when the Redux store initializes. Changing them via `configOverride` may require rebuilding the library or editing `simulatorConfig` defaults directly.

---

### `trail`

Visual and sampling settings for the **flight path polyline** on the globe.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `width` | `number` | `12` | Polyline width in pixels |
| `glowPower` | `number` | `0.38` | Glow intensity for `PolylineGlowMaterial` (0–1) |
| `maxPoints` | `number` | `9000` | Maximum stored trail vertices (oldest dropped) |
| `minDistanceDeg` | `number` | `0.000002` | Minimum lon/lat change before adding a trail point |
| `minAltitudeDeltaM` | `number` | `0.1` | Minimum altitude change before adding a trail point |
| `showPoints` | `boolean` | `false` | Draw point markers along trail (disabled by default) |
| `pointPixelSize` | `number` | `0` | Point marker size when `showPoints: true` |

Trail visibility is controlled by **`annotations.trail`**. These fields control appearance and density.

```tsx
trail: {
  width: 8,
  glowPower: 0.5,
  maxPoints: 5000
},
annotations: {
  trail: true
}
```

---

### `scene`

Cesium **globe atmosphere and rendering** flags.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showSkyAtmosphere` | `boolean` | `false` | Blue atmospheric halo at horizon |
| `showSun` | `boolean` | `false` | Render the sun |
| `showMoon` | `boolean` | `false` | Render the moon |
| `fogEnabled` | `boolean` | `false` | Distance fog on the globe |
| `depthTestAgainstTerrain` | `boolean` | `false` | Occlude geometry against terrain surface |

```tsx
scene: {
  showSkyAtmosphere: true,
  fogEnabled: false,
  depthTestAgainstTerrain: true
}
```

---

### `terrain`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `useCesiumWorldTerrain` | `boolean` | `false` | Load Cesium World Terrain from Ion (requires `VITE_CESIUM_ION_TOKEN`) |

When `false`, a smooth WGS-84 ellipsoid is used (no elevation data).

---

## Configuration examples

### Private tile server + floating panel

```tsx
<FlightSimulatorWidget
  configOverride={{
    window: {
      displayMode: "floating",
      width: 1024,
      height: 720,
      floating: { position: "bottom-right", draggable: true, title: "UAV Tracker" }
    },
    map: {
      mode: "LOCAL_XYZ",
      tileUrl: "http://10.0.0.5:8080/tiles/{z}/{x}/{y}.jpg"
    },
    start: { latitude: 32.08, longitude: 34.78, altitudeM: 500 },
    aircraft: { modelUri: "/models/drone.glb", scale: 60 },
    annotations: { hudTop: true, trail: true, crosshair: true }
  }}
/>
```

### Embedded dashboard tile (fixed 800×450)

```tsx
<FlightSimulatorWidget
  configOverride={{
    window: { displayMode: "embedded", width: 800, height: 450, showViewModeToggle: false },
    map: { mode: "ONLINE_ESRI" },
    annotations: { hudTop: true, bottomTelemetry: true, crosshair: false }
  }}
/>
```

### External telemetry only (no keyboard)

```tsx
<FlightSimulatorWidget
  mode="EXTERNAL"
  enableKeyboard={false}
  externalTelemetry={{
    latitude: 32.0853,
    longitude: 34.7818,
    altitudeM: 1200,
    speedMps: 85,
    headingDeg: 270,
    pitchDeg: 5,
    rollDeg: -10
  }}
  configOverride={{
    map: { mode: "LOCAL_XYZ", tileUrl: "http://localhost:3001/tiles/{z}/{x}/{y}.jpg" },
    annotations: { controlsHelp: false, debugPanel: true }
  }}
/>
```

---

## Flight modes

### INTERNAL (default)

| Key | Action |
|-----|--------|
| W / ↑ | Pitch up |
| S / ↓ | Pitch down |
| A / ← | Roll left |
| D / → | Roll right |
| Q / E | Yaw trim |
| Shift | Accelerate |
| Ctrl | Brake |
| Space | Pause |

### EXTERNAL

Telemetry-only. Pass `externalTelemetry` on each update. The widget never accepts flight-control input from the user.

---

## Map tile servers

### CORS

Cross-origin tile servers must send:

```http
Access-Control-Allow-Origin: *
```

### Debugging

1. DevTools → **Network** → filter by tile extension
2. Confirm **HTTP 200**
3. Verify `{z}/{x}/{y}` order matches your server

---

## Public API

| Export | Description |
|--------|-------------|
| `FlightSimulatorWidget` | Main embeddable component |
| `CesiumFlightSimulator` | Full-screen wrapper |
| `ExternalTelemetryExample` | Reference external telemetry setup |
| `simulatorConfig` | Default configuration object |
| `deepMerge` | Deep-merge utility |
| `resolveMapTileUrl` | Resolve imagery URL from `map` config |
| `styles.css` | Widget + HUD + floating panel styles |
| Types | `SimulatorConfig`, `DeepPartial`, `FlightTelemetry`, … |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank blue globe | Start position outside tile coverage | Adjust `start.latitude` / `start.longitude` |
| No tile requests | Wrong `map.mode` or URL | Use `LOCAL_XYZ` + valid `tileUrl` |
| CORS errors | Tile server blocks browser | Add CORS headers |
| Black screen | Missing Cesium assets | Check Vite static copy + `CESIUM_BASE_URL` |
| Model 404 | GLB missing from `public/` | Add file under `public/models/` |
| Wrong model orientation | GLTF axis mismatch | Try `orientationMode: "SWAP_PITCH_ROLL"` |
| Floating panel too small | `width` / `height` not set | Set numeric pixel values |
| HUD element still visible | Flag not overridden | Set annotation flag explicitly to `false` |

---

## Development

```bash
cd packages/cesium-flight-simulator
npm install
npm run build
npm run typecheck

cd ../../using/my-cesium-app
npm install
npm run dev
```

Rebuild the library after source changes before testing in linked consumer apps.

---

## Related packages

| Package | Engine | Map |
|---------|--------|-----|
| **`@cesium-suite/cesium-flight-simulator`** | Cesium + React | ✅ |
| `@cesium-suite/telemetry-flight-viewer` | Three.js | ❌ |

---

## License

MIT
