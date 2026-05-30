import { simulatorConfig } from "../config/simulatorConfig";
import { useAppSelector } from "../hooks/useAppSelector";

interface Props {
  config?: typeof simulatorConfig;
}

function fmt(value: number, decimals = 0) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}

export default function HudOverlay({ config = simulatorConfig }: Props) {
  const flight = useAppSelector((s) => s.flight);
  const annotations = config.annotations;

  return (
    <div className="hud">
      {annotations.hudTop && (
        <div className="hud-top">
          <div className="hud-card"><span>SPD</span><strong>{fmt(flight.speedMps * 3.6)} km/h</strong></div>
          <div className="hud-card"><span>ALT</span><strong>{fmt(flight.altitudeM)} m</strong></div>
          <div className="hud-card"><span>HDG</span><strong>{fmt(flight.headingDeg)}°</strong></div>
          <div className="hud-card"><span>PITCH</span><strong>{fmt(flight.pitchDeg, 1)}°</strong></div>
          <div className="hud-card"><span>ROLL</span><strong>{fmt(flight.rollDeg, 1)}°</strong></div>
          <div className="hud-card"><span>TRAIL</span><strong>{flight.trail.length}</strong></div>
        </div>
      )}

      {(annotations.crosshair || annotations.attitudeIndicator) && (
        <div className="hud-center">
          {annotations.crosshair && (
            <>
              <div className="crosshair horizontal" />
              <div className="crosshair vertical" />
              <div className="center-dot" />
            </>
          )}
          {annotations.attitudeIndicator && (
            <div
              className="attitude-line"
              style={{
                transform: `rotate(${-flight.rollDeg}deg) translateY(${-flight.pitchDeg * 1.25}px)`
              }}
            />
          )}
        </div>
      )}

      {annotations.bottomTelemetry && (
        <div className="hud-bottom">
          <div>LAT {fmt(flight.latitude, 5)}</div>
          <div>LNG {fmt(flight.longitude, 5)}</div>
          <div>ALT {fmt(flight.altitudeM)}m</div>
          <div>TRAIL {flight.trail.length}</div>
          {flight.paused && <div className="pause-pill">PAUSED</div>}
        </div>
      )}
    </div>
  );
}
