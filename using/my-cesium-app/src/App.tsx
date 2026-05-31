import { FlightSimulatorWidget } from "@cesium-suite/cesium-flight-simulator";

/**
 * Full widget configuration example.
 * Everything is optional — merged onto library defaults via configOverride.
 */
export default function App() {
  return (
    <FlightSimulatorWidget
      configOverride={{
        window: {
          displayMode: "fullscreen",
          // displayMode: "floating",
          // width: 960,
          // height: 640,
          // floating: {
          //   position: "bottom-left",
          //   draggable: true,
          //   title: "סימולטור טיסה",
          //   margin: 20,
          //   zIndex: 10000
          // },
          showViewModeToggle: true
        },

        map: {
          mode: "ONLINE_ESRI"
          // Your tile server:
          // mode: "LOCAL_XYZ",
          // tileUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg"
        },

        start: {
          latitude: 32.0853,
          longitude: 34.7818,
          altitudeM: 1200
        },

        aircraft: {
          modelUri: "/models/stealth_drone_perfect.glb",
          scale: 90
        },

        annotations: {
          hudTop: true,
          crosshair: true,
          attitudeIndicator: true,
          bottomTelemetry: true,
          trail: true,
          debugPanel: false,
          controlsHelp: false
        }
      }}
    />
  );
}
