import { useMemo, useState } from "react";
import FlightSimulatorWidget from "../components/FlightSimulatorWidget";
import type { FlightTelemetry } from "../types/flight";

export default function ExternalTelemetryExample() {
  const [telemetry, setTelemetry] = useState<FlightTelemetry>({
    latitude: 32.0853,
    longitude: 34.7818,
    altitudeM: 1200,
    speedMps: 160,
    headingDeg: 25,
    pitchDeg: 0,
    rollDeg: 0
  });

  const configOverride = useMemo(
    () => ({
      mode: "EXTERNAL" as const,
      annotations: {
        controlsHelp: false,
        debugPanel: true
      }
    }),
    []
  );

  return (
    <FlightSimulatorWidget
      mode="EXTERNAL"
      externalTelemetry={telemetry}
      enableKeyboard={false}
      configOverride={configOverride}
    />
  );
}
