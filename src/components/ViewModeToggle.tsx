import type { FlightViewMode } from "../types/viewMode";

interface Props {
  value: FlightViewMode;
  onChange: (value: FlightViewMode) => void;
}

export default function ViewModeToggle({ value, onChange }: Props) {
  return (
    <div className="view-mode-toggle">
      <button
        className={value === "FLIGHT_CAMERA" ? "active" : ""}
        onClick={() => onChange("FLIGHT_CAMERA")}
      >
        מצלמת טיסה
      </button>

      <button
        className={value === "MAP_SIDE_CAMERA" ? "active" : ""}
        onClick={() => onChange("MAP_SIDE_CAMERA")}
      >
        צד בתוך המפה
      </button>
    </div>
  );
}
