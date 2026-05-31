# Telemetry Flight Viewer

Production-ready, framework-agnostic **3D telemetry flight viewer** built with **TypeScript** and **Three.js**. Stream aircraft attitude and kinematics from your backend, simulation, or hardware — the library never accepts flight-control input from the user.

## Features

- **Injectable** — mount into any existing `HTMLElement`
- **Telemetry-only API** — `updateTelemetry({ pitch, roll, yaw, altitude, speed })`
- **Dynamic GLTF/GLB loading** — model URL and name via config (nothing hardcoded)
- **Rich configuration** — dimensions, HUD toggles, environment, camera chase
- **Display modes** — `embedded` (fill container) or `floating` (draggable overlay)
- **Lifecycle safety** — WebGL context loss handling, `destroy()` for full teardown
- **Modular architecture** — scene, state, UI, and drag logic in separate modules

## Installation

```bash
npm install @cesium-suite/telemetry-flight-viewer three
```

`three` is a **peer dependency** (>= 0.160).

## Quick Start

```html
<div id="viewer-host" style="width: 800px; height: 500px;"></div>
```

```typescript
import { TelemetryFlightViewer } from "@cesium-suite/telemetry-flight-viewer";

const viewer = new TelemetryFlightViewer(
  {
    container: document.getElementById("viewer-host")!,
    displayMode: "embedded",
    model: {
      url: "/assets/aircraft.glb",
      name: "UAV-01",
      scale: 1.2
    },
    ui: {
      compass: true,
      artificialHorizon: true,
      telemetryBar: true
    },
    environment: {
      backgroundColor: "#0b1220"
    }
  },
  {
    onReady: () => console.log("Viewer ready"),
    onError: (err) => console.error(err)
  }
);

await viewer.initialize();

// Stream telemetry (e.g. WebSocket, MQTT, simulation tick)
viewer.updateTelemetry({
  pitch: 4.2,
  roll: -12.5,
  yaw: 275,
  altitude: 1840,
  speed: 62,
  latitude: 32.0853,
  longitude: 34.7818
});
```

## Floating Overlay

```typescript
const viewer = new TelemetryFlightViewer({
  container: document.body,
  displayMode: "floating",
  floating: {
    position: "bottom-right",
    width: 420,
    height: 320,
    draggable: true,
    title: "Live Telemetry"
  },
  model: { url: "/models/drone.glb", name: "Drone" }
});

await viewer.initialize();
```

The user can drag the panel by its header. Programmatic position anchors apply before the first drag.

## Public API

| Method | Description |
|--------|-------------|
| `initialize()` | Mount DOM, load model, start render loop |
| `updateTelemetry(payload)` | Apply external telemetry (partial updates supported) |
| `getTelemetry()` | Read current snapshot |
| `resize(w, h)` | Force renderer dimensions |
| `destroy()` | Dispose GPU resources, observers, and DOM |

`heading` is accepted as an alias for `yaw` in `updateTelemetry`.

## Configuration Reference

### `TelemetryFlightViewerConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `HTMLElement` | — | **Required.** Mount target |
| `displayMode` | `'embedded' \| 'floating'` | `'embedded'` | Layout mode |
| `model` | `ModelConfig` | — | **Required.** Runtime GLTF URL |
| `dimensions` | `{ width?, height? }` | `'auto'` | Pixel size (embedded) |
| `ui` | `UiElementsConfig` | all `true` | HUD feature flags |
| `environment` | `EnvironmentConfig` | see source | Background, fog, lights |
| `floating` | `FloatingWindowConfig` | bottom-right | Floating panel options |
| `camera` | `CameraConfig` | chase defaults | External chase camera |
| `initialTelemetry` | `Partial<TelemetrySnapshot>` | zeros | Starting attitude |
| `antialias` | `boolean` | `true` | WebGL MSAA |
| `pixelRatio` | `number` | `min(dpr, 2)` | Performance cap |
| `autoResize` | `boolean` | `true` | `ResizeObserver` on viewport |

### `TelemetrySnapshot`

```typescript
interface TelemetrySnapshot {
  pitch: number;    // degrees, nose up positive
  roll: number;     // degrees
  yaw: number;      // heading 0–360°
  altitude: number; // meters
  speed: number;    // m/s
  latitude?: number;
  longitude?: number;
  timestamp?: number;
}
```

## Architecture

```
TelemetryFlightViewer (facade)
├── TelemetryState          # external data only
├── DisplayHost             # EmbeddedHost | FloatingHost
├── SceneManager            # Three.js renderer + loop
│   ├── AircraftLoader      # GLTF from config URL
│   └── ChaseCamera         # telemetry-driven camera
├── OverlayManager          # compass, horizon, tapes
└── DragController          # floating panel (optional)
```

## Interactive demo

```bash
cd packages/telemetry-flight-viewer
npm install
npm run demo
```

Opens `examples/basic.html` with **Embedded** and **Floating** modes and a sinusoidal mock telemetry stream.

## Development

```bash
cd packages/telemetry-flight-viewer
npm install
npm run build
npm run typecheck
```

## License

MIT
