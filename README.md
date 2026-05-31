# Cesium Flight Simulator — Monorepo

An **integrable 3D flight simulation suite** built around CesiumJS and React. Embed a globe-based flight experience — satellite maps, GLTF aircraft, HUD, chase camera, and live telemetry — into any React application through a single configurable widget.

---

## Packages

| Package | Description | Framework | Map |
|---------|-------------|-----------|-----|
| [`@cesium-suite/cesium-flight-simulator`](./packages/cesium-flight-simulator) | Full Cesium globe simulator | **React 18** | ✅ |
| [`@cesium-suite/cesium-flight-simulator-angular`](./packages/cesium-flight-simulator-angular) | Same simulator, native Angular | **Angular 11+** | ✅ |
| [`@cesium-suite/telemetry-flight-viewer`](./packages/telemetry-flight-viewer) | Lightweight Three.js HUD (no globe) | Any (Vanilla) | ❌ |

> **Important:** If you need satellite imagery and a geographic globe, use **`cesium-flight-simulator`**. The telemetry viewer is a separate, map-free instrument panel.

---

## Repository layout

```
├── src/                          Reference application (same code as the library)
├── packages/
│   ├── cesium-flight-simulator/  Publishable Cesium + React library  ← start here
│   └── telemetry-flight-viewer/  Optional Three.js HUD library
├── using/
│   └── my-cesium-app/            Example consumer app (Cesium + map)
└── integration-demo/             Legacy Three.js integration demo
```

---

## Quick start — run the reference app

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

Configure map tiles, aircraft model, HUD, and window layout in:

```
src/config/simulatorConfig.ts
```

---

## Quick start — consume the library

See the full documentation:

**[packages/cesium-flight-simulator/README.md](./packages/cesium-flight-simulator/README.md)**

Minimal example:

```tsx
import "cesium/Build/Cesium/Widgets/widgets.css";
import "@cesium-suite/cesium-flight-simulator/styles.css";
import { FlightSimulatorWidget } from "@cesium-suite/cesium-flight-simulator";

export default function App() {
  return (
    <FlightSimulatorWidget
      configOverride={{
        map: { mode: "LOCAL_XYZ", tileUrl: "http://YOUR-SERVER/tiles/{z}/{x}/{y}.jpg" },
        aircraft: { modelUri: "/models/stealth_drone_perfect.glb" }
      }}
    />
  );
}
```

Example consumer project: [`using/my-cesium-app`](./using/my-cesium-app).

---

## Configuration highlights

All widget behaviour is controlled through **`configOverride`**, deep-merged onto **`simulatorConfig`**.

**Full field-by-field documentation:**

→ **[packages/cesium-flight-simulator/README.md](./packages/cesium-flight-simulator/README.md#complete-configuration-reference)**

| Section | Controls |
|---------|----------|
| `window` | Fullscreen / embedded / floating panel, size, drag, anchor position, view toggle |
| `map` | Tile server URL, ESRI online imagery, or no map |
| `aircraft` | GLB path, scale, render mode, orientation offsets |
| `annotations` | Every HUD element + trail visibility |
| `start` | Initial lat/lng/altitude/heading/speed |
| `camera` | Chase distance, height, look-ahead, heading offset |
| `flight` | Speed limits, turn rates, pitch/roll limits (INTERNAL mode) |
| `trail` | Trail width, glow, point density |
| `scene` | Sun, moon, atmosphere, fog |
| `terrain` | Cesium Ion world terrain |

---

## Build the library

```bash
cd packages/cesium-flight-simulator
npm install
npm run build
```

---

## Requirements

- Node.js ≥ 18
- React ≥ 18
- Cesium ≥ 1.110
- Vite (recommended) with `vite-plugin-static-copy` for Cesium assets

---

## License

MIT
