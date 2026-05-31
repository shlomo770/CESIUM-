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
- [Configuration](#configuration)
- [Flight modes](#flight-modes)
- [Map tile servers](#map-tile-servers)
- [Window layout modes](#window-layout-modes)
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
```

Then build the package:

```bash
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

**Stylesheets** (in your app entry, e.g. `main.tsx`):

```tsx
import "cesium/Build/Cesium/Widgets/widgets.css";
import "@cesium-suite/cesium-flight-simulator/styles.css";
```

**Optional — Cesium Ion terrain** (`.env`):

```env
VITE_CESIUM_ION_TOKEN=your_token_here
```

Set `terrain.useCesiumWorldTerrain: true` in config when using Ion.

---

## Quick start

```tsx
import { FlightSimulatorWidget } from "@cesium-suite/cesium-flight-simulator";

export default function App() {
  return (
    <FlightSimulatorWidget
      configOverride={{
        map: {
          mode: "ONLINE_ESRI"
        },
        aircraft: {
          modelUri: "/models/stealth_drone_perfect.glb"
        },
        start: {
          latitude: 32.0853,
          longitude: 34.7818,
          altitudeM: 1200
        }
      }}
    />
  );
}
```

Place GLB/GLTF files in your app's `public/models/` directory.

**Reference integration app:** `using/my-cesium-app` in this repository.

---

## Configuration

All options are passed through **`configOverride`**, which is deep-merged onto the exported defaults in **`simulatorConfig`**.

```tsx
<FlightSimulatorWidget configOverride={{ /* partial config */ }} />
```

### Complete example

```tsx
<FlightSimulatorWidget
  mode="EXTERNAL"
  enableKeyboard={false}
  externalTelemetry={{
    latitude: 32.0853,
    longitude: 34.7818,
    altitudeM: 1200,
    speedMps: 160,
    headingDeg: 25,
    pitchDeg: 0,
    rollDeg: 0
  }}
  configOverride={{
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
    },
    map: {
      mode: "LOCAL_XYZ",
      tileUrl: "http://192.168.1.10:8080/tiles/{z}/{x}/{y}.jpg"
    },
    start: {
      latitude: 32.0853,
      longitude: 34.7818,
      altitudeM: 1200,
      headingDeg: 25,
      speedMps: 145
    },
    aircraft: {
      renderMode: "GLTF",
      modelUri: "/models/stealth_drone_perfect.glb",
      scale: 90,
      orientationMode: "SWAP_PITCH_ROLL"
    },
    annotations: {
      hudTop: true,
      crosshair: true,
      attitudeIndicator: true,
      bottomTelemetry: true,
      trail: true,
      debugPanel: false,
      controlsHelp: false
    },
    camera: {
      mode: "MANUAL_FORWARD_CHASE",
      rangeBehindM: 700,
      heightAboveM: 170,
      lookAheadM: 1400
    }
  }}
/>
```

---

### `window` — panel layout

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `displayMode` | `"fullscreen"` \| `"embedded"` \| `"floating"` | `"fullscreen"` | Mounting strategy |
| `width` | `number` \| `"auto"` \| `"100%"` | `"100%"` | Width for embedded / floating |
| `height` | `number` \| `"auto"` \| `"100%"` | `"100%"` | Height for embedded / floating |
| `showViewModeToggle` | `boolean` | `true` | Show flight / side-view toggle |
| `floating.position` | See [anchors](#window-layout-modes) | `"bottom-right"` | Initial anchor before drag |
| `floating.draggable` | `boolean` | `true` | Drag panel by header bar |
| `floating.title` | `string` | `"Cesium Flight Simulator"` | Header label |
| `floating.margin` | `number` | `16` | Viewport margin (px) |
| `floating.zIndex` | `number` | `10000` | CSS stacking order |

---

### `map` — imagery / tile server

| Field | Type | Description |
|-------|------|-------------|
| `mode` | `"ONLINE_ESRI"` \| `"LOCAL_XYZ"` \| `"CUSTOM"` \| `"NONE"` | Imagery source selector |
| `tileUrl` | `string` | **Primary URL** for local/custom servers |
| `onlineEsriUrl` | `string` | ESRI World Imagery template `{z}/{y}/{x}` |
| `localXyzUrl` | `string` | Deprecated alias of `tileUrl` |
| `urlTemplate` | `"XYZ"` \| `"ESRI_YX"` | Reserved for custom template handling |

| `mode` | URL used | Tile order |
|--------|----------|------------|
| `ONLINE_ESRI` | `onlineEsriUrl` | `{z}/{y}/{x}` |
| `LOCAL_XYZ` | `tileUrl` | `{z}/{x}/{y}` |
| `CUSTOM` | `tileUrl` | `{z}/{x}/{y}` |
| `NONE` | — | No imagery layer |

Ensure `start.latitude` / `start.longitude` fall inside your tile coverage, or the globe will appear empty over that area.

---

### `aircraft` — 3D model

| Field | Description |
|-------|-------------|
| `modelUri` | Public path to GLB/GLTF, e.g. `/models/drone.glb` |
| `renderMode` | `"GLTF"` (recommended), `"SCREEN_OVERLAY"`, or `"SIMPLE_ENTITY"` |
| `scale` | Cesium model scale multiplier |
| `minimumPixelSize` | Minimum on-screen size in pixels |
| `maximumScale` | Upper scale clamp |
| `orientationMode` | `"NORMAL"` or `"SWAP_PITCH_ROLL"` (fixes axis mismatch for some models) |
| `modelHeadingOffsetDeg` | Static heading correction |
| `modelPitchOffsetDeg` | Static pitch correction |
| `modelRollOffsetDeg` | Static roll correction |

---

### `annotations` — HUD visibility

| Flag | When `true` |
|------|-------------|
| `hudTop` | Top strip: speed, altitude, heading, pitch, roll |
| `crosshair` | Center reticle and dot |
| `attitudeIndicator` | Artificial horizon line (flight camera) |
| `bottomTelemetry` | Bottom strip: lat, lng, altitude, trail count |
| `trail` | Glowing flight path on the globe |
| `controlsHelp` | Keyboard control overlay |
| `debugPanel` | Debug information panel |

---

### `start` — initial position

| Field | Unit | Description |
|-------|------|-------------|
| `latitude` | degrees | WGS-84 latitude |
| `longitude` | degrees | WGS-84 longitude |
| `altitudeM` | meters | Altitude MSL |
| `headingDeg` | degrees | Initial heading |
| `speedMps` | m/s | Initial ground speed |

---

### `camera`, `flight`, `scene`, `terrain`, `trail`

Advanced tuning for chase camera offsets, flight dynamics limits, atmosphere/fog, Ion terrain, and trail appearance. See the exported **`simulatorConfig`** object for all defaults and inline documentation.

---

## Flight modes

### INTERNAL (default)

Keyboard-controlled simulation inside the widget.

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

Set `enableKeyboard={false}` to disable.

### EXTERNAL

Telemetry-only — the widget **never** accepts flight-control input from the user.

```tsx
<FlightSimulatorWidget
  mode="EXTERNAL"
  enableKeyboard={false}
  externalTelemetry={telemetrySnapshot}
/>
```

`externalTelemetry` updates whenever the parent re-renders with new props. Partial updates are merged in Redux.

| Field | Alias | Unit |
|-------|-------|------|
| `latitude` | — | degrees |
| `longitude` | — | degrees |
| `altitudeM` | — | meters |
| `speedMps` | — | m/s |
| `headingDeg` | — | degrees |
| `pitchDeg` | — | degrees |
| `rollDeg` | — | degrees |

---

## Map tile servers

### Local / private XYZ server

```tsx
configOverride={{
  map: {
    mode: "LOCAL_XYZ",
    tileUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg"
  }
}}
```

### CORS

If tiles are served from a different origin than your Vite dev server, the tile server must respond with:

```http
Access-Control-Allow-Origin: *
```

(or your app's specific origin)

### Debugging tile loads

1. Open DevTools → **Network**
2. Filter by `.jpg`, `.png`, or your tile extension
3. Confirm requests return **HTTP 200**
4. Verify zoom / column / row order matches your server layout

---

## Window layout modes

| Mode | Behavior |
|------|----------|
| `fullscreen` | Fills the parent container (default demo layout) |
| `embedded` | Fixed `width` / `height` box inside your page |
| `floating` | Fixed-position panel; optional drag via header |

**Floating anchor positions:** `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center`

When `floating.draggable` is `true`, the user can reposition the panel after the initial anchor is applied.

---

## Public API

| Export | Kind | Description |
|--------|------|-------------|
| `FlightSimulatorWidget` | Component | Main embeddable widget |
| `CesiumFlightSimulator` | Component | Full-screen convenience wrapper |
| `ExternalTelemetryExample` | Component | Reference external-telemetry setup |
| `simulatorConfig` | Object | Default configuration (read or extend) |
| `deepMerge` | Function | Deep-merge utility |
| `resolveMapTileUrl` | Function | Resolve imagery URL from `map` config |
| `styles.css` | Stylesheet | HUD, layout, floating panel styles |
| Types | TypeScript | `SimulatorConfig`, `FlightTelemetry`, `FlightSimulatorWidgetProps`, … |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank blue globe | Start position outside tile coverage | Move `start` lat/lng into tiled area |
| No tiles in Network tab | Wrong `map.mode` or URL | Set `LOCAL_XYZ` + correct `tileUrl` |
| CORS errors | Tile server blocks browser | Add CORS headers on tile server |
| Black screen | Missing Cesium static assets | Check `vite-plugin-static-copy` + `CESIUM_BASE_URL` |
| Model 404 | GLB not in `public/` | Place file under `public/models/` |
| Wrong model orientation | GLTF axis mismatch | Try `orientationMode: "SWAP_PITCH_ROLL"` |
| Widget too small | Embedded without height | Give parent / `#root` explicit height |

---

## Development

```bash
# Build the library
cd packages/cesium-flight-simulator
npm install
npm run build
npm run typecheck

# Run the reference consumer app
cd ../../using/my-cesium-app
npm install
npm run dev
```

After changing library source, always **`npm run build`** in `packages/cesium-flight-simulator` before testing in a linked consumer app.

---

## Related packages

| Package | Engine | Map | Use case |
|---------|--------|-----|----------|
| **`@cesium-suite/cesium-flight-simulator`** | Cesium + React | ✅ Yes | Full globe simulator (this package) |
| `@cesium-suite/telemetry-flight-viewer` | Three.js | ❌ No | Lightweight HUD + 3D model only |

---

## License

MIT
