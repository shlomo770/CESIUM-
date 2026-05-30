import { simulatorConfig } from "../config/simulatorConfig";
import { useAppSelector } from "../hooks/useAppSelector";

interface Props {
  config?: typeof simulatorConfig;
}

/**
 * משמש רק אם בוחרים renderMode: "SCREEN_OVERLAY".
 * בברירת המחדל של הפרויקט הזה משתמשים במודל GLB אמיתי.
 */
export default function ScreenAircraftOverlay({ config = simulatorConfig }: Props) {
  const flight = useAppSelector((s) => s.flight);

  if (config.aircraft.renderMode !== "SCREEN_OVERLAY") return null;

  const size = config.aircraft.screenSizePx;
  const pitchOffset = -flight.pitchDeg * 1.05;
  const rollDeg = -flight.rollDeg;

  return (
    <div
      className="screen-aircraft-layer"
      style={{
        transform: `translate(-50%, calc(-50% + ${config.aircraft.screenOffsetYPx + pitchOffset}px)) rotate(${rollDeg}deg)`,
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      <svg viewBox="0 0 200 200" className="screen-aircraft-svg" aria-hidden="true">
        <path
          d="M100 12 C111 42 121 72 122 104 L113 166 L100 190 L87 166 L78 104 C79 72 89 42 100 12 Z"
          fill="#9ca3af"
          stroke="#111827"
          strokeWidth="5"
        />
        <path d="M83 128 L43 160 L90 149 Z" fill="#9ca3af" stroke="#111827" strokeWidth="5" />
        <path d="M117 128 L157 160 L110 149 Z" fill="#9ca3af" stroke="#111827" strokeWidth="5" />
      </svg>
    </div>
  );
}
