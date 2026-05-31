import { useMemo } from "react";
import { useAppSelector } from "../hooks/useAppSelector";

function distanceMeters(a: [number, number, number], b: [number, number, number]) {
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function fmt(value: number, digits = 0) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}

export default function SideProfileView() {
  const flight = useAppSelector((s) => s.flight);

  const data = useMemo(() => {
    const trail = flight.trail.length > 1
      ? flight.trail
      : [[flight.longitude, flight.latitude, flight.altitudeM] as [number, number, number]];

    let total = 0;
    const points = trail.map((p, index) => {
      if (index > 0) total += distanceMeters(trail[index - 1], p);
      return {
        distanceM: total,
        altitudeM: p[2]
      };
    });

    const current = {
      distanceM: total,
      altitudeM: flight.altitudeM
    };

    const allAltitudes = [...points.map((p) => p.altitudeM), current.altitudeM];
    const minAlt = Math.min(...allAltitudes, flight.altitudeM) - 150;
    const maxAlt = Math.max(...allAltitudes, flight.altitudeM) + 350;

    const safeTotal = Math.max(total, 1000);
    const safeAltRange = Math.max(maxAlt - minAlt, 500);

    const width = 1000;
    const height = 520;
    const padL = 70;
    const padR = 50;
    const padT = 45;
    const padB = 88;

    const x = (d: number) => padL + (d / safeTotal) * (width - padL - padR);
    const y = (alt: number) => padT + (1 - (alt - minAlt) / safeAltRange) * (height - padT - padB);

    const trailPath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.distanceM).toFixed(1)} ${y(p.altitudeM).toFixed(1)}`)
      .join(" ");

    const terrainBaseY = height - padB + 10;
    const terrainPath = [
      `M ${padL} ${terrainBaseY}`,
      `C ${width * 0.22} ${terrainBaseY - 18}, ${width * 0.38} ${terrainBaseY - 80}, ${width * 0.52} ${terrainBaseY - 66}`,
      `C ${width * 0.68} ${terrainBaseY - 48}, ${width * 0.78} ${terrainBaseY - 95}, ${width - padR} ${terrainBaseY - 78}`,
      `L ${width - padR} ${height}`,
      `L ${padL} ${height}`,
      "Z"
    ].join(" ");

    return {
      width,
      height,
      trailPath,
      terrainPath,
      currentX: x(current.distanceM),
      currentY: y(current.altitudeM),
      minAlt,
      maxAlt,
      total,
      current
    };
  }, [flight.trail, flight.longitude, flight.latitude, flight.altitudeM]);

  const pitch = Math.max(-35, Math.min(35, flight.pitchDeg));
  const roll = Math.max(-65, Math.min(65, flight.rollDeg));

  return (
    <div className="side-profile-root">
      <div className="side-profile-panel">
        <div className="side-profile-title">
          <span>תצוגת פרופיל צד</span>
          <small>מסלול טיסה · גובה · שובל</small>
        </div>

        <svg viewBox={`0 0 ${data.width} ${data.height}`} className="side-profile-svg">
          <defs>
            <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#dbeafe" />
            </linearGradient>

            <linearGradient id="groundGradientProfile" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>

            <filter id="profileGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.95" />
            </filter>
          </defs>

          <rect x="0" y="0" width={data.width} height={data.height} fill="url(#skyGradient)" />

          <path
            d={data.terrainPath}
            fill="url(#groundGradientProfile)"
            stroke="#020617"
            strokeWidth="3"
          />

          <g opacity="0.42">
            {[0, 1, 2, 3].map((i) => {
              const y = 70 + i * 82;
              return (
                <line
                  key={i}
                  x1="70"
                  x2={data.width - 50}
                  y1={y}
                  y2={y}
                  stroke="#64748b"
                  strokeDasharray="7 8"
                  strokeWidth="1.5"
                />
              );
            })}
          </g>

          <text x="24" y="78" className="profile-axis-text">
            {fmt(data.maxAlt)}m
          </text>
          <text x="24" y={data.height - 95} className="profile-axis-text">
            {fmt(data.minAlt)}m
          </text>

          <path
            d={data.trailPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 8"
            filter="url(#profileGlow)"
          />

          <g transform={`translate(${data.currentX}, ${data.currentY}) rotate(${pitch})`}>
            <path
              d="M 44 0 L -26 -12 L -14 0 L -26 12 Z"
              fill="#64748b"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <path
              d="M 44 0 L 25 -8 L 25 8 Z"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <path
              d="M -8 -4 L -45 -22 L -20 0 L -45 22 L -8 4 Z"
              fill="#94a3b8"
              stroke="#0f172a"
              strokeWidth="2"
              opacity="0.88"
              transform={`rotate(${roll * 0.18})`}
            />
          </g>

          <line
            x1={data.currentX}
            y1={data.currentY}
            x2={data.currentX}
            y2={data.height - 80}
            stroke="#0f172a"
            strokeDasharray="5 7"
            strokeWidth="2"
            opacity="0.55"
          />

          <rect
            x={Math.max(90, Math.min(data.width - 220, data.currentX - 80))}
            y={Math.max(36, data.currentY - 72)}
            width="166"
            height="48"
            rx="8"
            fill="rgba(15,23,42,0.84)"
          />
          <text
            x={Math.max(106, Math.min(data.width - 204, data.currentX - 64))}
            y={Math.max(59, data.currentY - 49)}
            className="profile-label"
          >
            ALT {fmt(flight.altitudeM)}m
          </text>
          <text
            x={Math.max(106, Math.min(data.width - 204, data.currentX - 64))}
            y={Math.max(78, data.currentY - 30)}
            className="profile-label small"
          >
            PITCH {fmt(flight.pitchDeg, 1)}° · ROLL {fmt(flight.rollDeg, 1)}°
          </text>
        </svg>

        <div className="side-profile-stats">
          <div>
            <span>מרחק</span>
            <strong>{fmt(data.total / 1000, 2)} km</strong>
          </div>
          <div>
            <span>גובה</span>
            <strong>{fmt(flight.altitudeM)} m</strong>
          </div>
          <div>
            <span>Pitch</span>
            <strong>{fmt(flight.pitchDeg, 1)}°</strong>
          </div>
          <div>
            <span>Roll</span>
            <strong>{fmt(flight.rollDeg, 1)}°</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
