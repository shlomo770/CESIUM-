# @cesium-suite/cesium-flight-simulator-angular

**Angular library (v11+) for the full Cesium globe flight simulator.**

Native Angular component — no React required. Same features as `@cesium-suite/cesium-flight-simulator`:

- Cesium globe + custom tile servers  
- GLTF aircraft, HUD, flight trail  
- INTERNAL keyboard mode + EXTERNAL telemetry  
- Full `configOverride` (window, map, annotations, aircraft, camera, …)

---

## Compatibility

| | |
|---|---|
| **Angular** | `>= 11.0.0` (11, 12, 13, 14, 15, 16, 17, …) |
| **RxJS** | `^6.5.3` or `^7.x` |
| **Cesium** | `^1.110.0` |
| **Module format** | `NgModule` (works with Angular 11 — no standalone required) |

Built with Ivy partial compilation for broad Angular version support.

---

## Installation

```bash
npm install @cesium-suite/cesium-flight-simulator-angular cesium
```

**From this repository:**

```bash
cd packages/cesium-flight-simulator-angular
npm install
npm run build
```

Then in your Angular app, install from a **packed tarball** (not a direct `file:.../dist` symlink — that can cause duplicate `@angular/core` at runtime):

```bash
cd packages/cesium-flight-simulator-angular/dist
npm pack --pack-destination /path/to/your-app/vendor
cd /path/to/your-app
npm install "file:vendor/cesium-suite-cesium-flight-simulator-angular-1.0.0.tgz" cesium
```

Or publish to a private registry and `npm install @cesium-suite/cesium-flight-simulator-angular`.

---

## Angular `angular.json` — Cesium assets

Add Cesium static files to `assets`:

```json
{
  "glob": "**/*",
  "input": "node_modules/cesium/Build/Cesium/Workers",
  "output": "/cesium/Workers"
},
{
  "glob": "**/*",
  "input": "node_modules/cesium/Build/Cesium/ThirdParty",
  "output": "/cesium/ThirdParty"
},
{
  "glob": "**/*",
  "input": "node_modules/cesium/Build/Cesium/Assets",
  "output": "/cesium/Assets"
},
{
  "glob": "**/*",
  "input": "node_modules/cesium/Build/Cesium/Widgets",
  "output": "/cesium/Widgets"
}
```

In `projects/<app>/architect/build/options` add:

```json
"styles": [
  "node_modules/cesium/Build/Cesium/Widgets/widgets.css",
  "src/styles.scss"
]
```

Set Cesium base URL in `src/index.html` or polyfills:

```html
<script>
  window.CESIUM_BASE_URL = '/cesium';
</script>
```

Or in Angular 15+ `angular.json` → `scripts` array, or use `@angular-builders/custom-webpack` with `CESIUM_BASE_URL`.

**Simple approach** — add to `src/index.html` before app bootstrap:

```html
<script>window.CESIUM_BASE_URL = '/cesium';</script>
```

And in `main.ts` / `polyfills.ts` ensure Cesium can read it (Cesium uses `CESIUM_BASE_URL` global at build time — for Angular CLI you may need `@angular-builders/custom-webpack` define plugin, or copy the Vite pattern from the React README).

For **Angular CLI** without custom webpack, add to `tsconfig.app.json`:

```json
"compilerOptions": {
  "paths": {}
}
```

And use **environment** + script tag above — most teams use `angular.json` `scripts`:

```json
"scripts": [
  { "input": "src/cesium-base-url.js", "inject": true }
]
```

`src/cesium-base-url.js`:

```js
window.CESIUM_BASE_URL = '/cesium';
```

---

## Module import (Angular 11+)

**app.module.ts:**

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CesiumFlightSimulatorModule } from '@cesium-suite/cesium-flight-simulator-angular';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CesiumFlightSimulatorModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

**app.component.html:**

```html
<div style="width: 100%; height: 100vh;">
  <cfs-flight-simulator
    [configOverride]="simulatorConfig"
    [cesiumIonToken]="ionToken"
  ></cfs-flight-simulator>
</div>
```

**app.component.ts:**

```typescript
import { Component } from '@angular/core';
import { DeepPartial, SimulatorConfig } from '@cesium-suite/cesium-flight-simulator-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  ionToken = ''; // optional

  simulatorConfig: DeepPartial<SimulatorConfig> = {
    window: {
      displayMode: 'fullscreen',
      showViewModeToggle: true
    },
    map: {
      mode: 'LOCAL_XYZ',
      tileUrl: 'http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg'
    },
    aircraft: {
      modelUri: '/assets/models/stealth_drone_perfect.glb',
      scale: 90
    },
    annotations: {
      hudTop: true,
      crosshair: true,
      trail: true
    }
  };
}
```

Place GLB models in `src/assets/models/` and reference as `/assets/models/...`.

---

## Component API — `cfs-flight-simulator`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `'INTERNAL' \| 'EXTERNAL'` | from config | Flight control mode |
| `externalTelemetry` | `FlightTelemetry` | — | Live telemetry (EXTERNAL) |
| `enableKeyboard` | `boolean` | `true` | Keyboard controls |
| `configOverride` | `DeepPartial<SimulatorConfig>` | — | Merged onto defaults |
| `initialViewMode` | `'FLIGHT_CAMERA' \| 'MAP_SIDE_CAMERA'` | `'FLIGHT_CAMERA'` | Starting view |
| `cesiumIonToken` | `string` | — | Cesium Ion token |
| `className` | `string` | — | Extra CSS class |

Full config reference: see [@cesium-suite/cesium-flight-simulator README](../cesium-flight-simulator/README.md#complete-configuration-reference).

---

## External telemetry example

```html
<cfs-flight-simulator
  mode="EXTERNAL"
  [enableKeyboard]="false"
  [externalTelemetry]="telemetry"
  [configOverride]="{ map: { mode: 'LOCAL_XYZ', tileUrl: tileUrl } }"
></cfs-flight-simulator>
```

Update `telemetry` from WebSocket/MQTT in your Angular service; Angular change detection passes new `@Input` values automatically.

---

## Floating draggable panel

```typescript
configOverride = {
  window: {
    displayMode: 'floating',
    width: 960,
    height: 640,
    floating: {
      position: 'bottom-left',
      draggable: true,
      title: 'Flight View',
      margin: 20
    }
  }
};
```

---

## Build the library

```bash
cd packages/cesium-flight-simulator-angular
npm install
npm run build
# Output: dist/
```

---

## React vs Angular packages

| Package | Framework |
|---------|-----------|
| `@cesium-suite/cesium-flight-simulator` | React |
| `@cesium-suite/cesium-flight-simulator-angular` | **Angular 11+** |

Same `simulatorConfig` / `configOverride` shape.

---

## License

MIT
