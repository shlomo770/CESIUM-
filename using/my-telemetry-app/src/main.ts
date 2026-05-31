import { TelemetryFlightViewer } from "@cesium-suite/telemetry-flight-viewer";
import "@cesium-suite/telemetry-flight-viewer/styles.css";
import "./style.css";

const host = document.getElementById("viewer-host");
const status = document.getElementById("status");

if (!host || !status) {
  throw new Error("Missing elements");
}

const MODEL_URL = "/models/stealth_drone_perfect.glb";

status.textContent = `טוען מודל: ${MODEL_URL}...`;

const viewer = new TelemetryFlightViewer(
  {
    container: host,
    displayMode: "embedded",
    model: {
      url: MODEL_URL,
      name: "Stealth-Drone",
      scale: 1.5
    },
    ui: {
      compass: true,
      artificialHorizon: true,
      telemetryBar: true,
      statusLine: true
    },
    environment: {
      backgroundColor: "#0b1220",
      showGrid: true
    },
    camera: {
      chaseDistance: 18,
      chaseHeight: 6,
      lookAhead: 24
    }
  },
  {
    onReady: () => {
      status.textContent = "מחובר — מל״ט + HUD (ללא מפת לווין)";
    },
    onError: (err) => {
      status.textContent = `שגיאה: ${err.message}`;
      console.error(err);
    }
  }
);

await viewer.initialize();

let t = 0;
const interval = window.setInterval(() => {
  t += 0.05;
  viewer.updateTelemetry({
    pitch: Math.sin(t) * 15,
    roll: Math.cos(t * 0.7) * 25,
    yaw: (270 + t * 8) % 360,
    altitude: 1200 + Math.sin(t * 0.5) * 200,
    speed: 55 + Math.abs(Math.sin(t)) * 30,
    latitude: 32.0853,
    longitude: 34.7818
  });
}, 100);

window.addEventListener("beforeunload", () => {
  clearInterval(interval);
  viewer.destroy();
});
