import { CSSProperties, ReactNode, useMemo, useRef } from "react";
import type { WindowConfig, WindowSize } from "../types/simulatorConfigTypes";
import { useFloatingDrag } from "../hooks/useFloatingDrag";

const DEFAULT_FLOATING_WIDTH = 960;
const DEFAULT_FLOATING_HEIGHT = 640;

interface Props {
  windowConfig: WindowConfig;
  className?: string;
  children: ReactNode;
}

function sizeToCss(value: WindowSize): string {
  if (value === "auto") return "auto";
  if (value === "100%") return "100%";
  return `${value}px`;
}

function resolvePixelSize(value: WindowSize, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function anchorStyles(
  position: WindowConfig["floating"]["position"],
  margin: number
): CSSProperties {
  const m = `${margin}px`;
  switch (position) {
    case "top-left":
      return { top: m, left: m, right: "auto", bottom: "auto" };
    case "top-right":
      return { top: m, right: m, left: "auto", bottom: "auto" };
    case "bottom-left":
      return { bottom: m, left: m, top: "auto", right: "auto" };
    case "bottom-right":
      return { bottom: m, right: m, top: "auto", left: "auto" };
    case "center":
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        right: "auto",
        bottom: "auto"
      };
    default:
      return { bottom: m, right: m };
  }
}

export default function WidgetShell({ windowConfig, className, children }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useFloatingDrag({
    enabled: windowConfig.displayMode === "floating" && windowConfig.floating.draggable,
    shellRef,
    handleRef,
    margin: windowConfig.floating.margin
  });

  const embeddedStyle = useMemo<CSSProperties>(
    () => ({
      width: sizeToCss(windowConfig.width),
      height: sizeToCss(windowConfig.height)
    }),
    [windowConfig.width, windowConfig.height]
  );

  if (windowConfig.displayMode === "floating") {
    const { floating } = windowConfig;
    const widthPx = resolvePixelSize(windowConfig.width, DEFAULT_FLOATING_WIDTH);
    const heightPx = resolvePixelSize(windowConfig.height, DEFAULT_FLOATING_HEIGHT);

    return (
      <div className="cfs-floating-root" style={{ zIndex: floating.zIndex }}>
        <div
          ref={shellRef}
          className="cfs-floating-shell"
          style={{
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            ...anchorStyles(floating.position, floating.margin)
          }}
          role="dialog"
          aria-label={floating.title}
        >
          <div
            ref={handleRef}
            className={`cfs-floating-header${floating.draggable ? " is-draggable" : ""}`}
            aria-grabbed="false"
          >
            {floating.title}
          </div>
          <div className={`sim-root sim-root--floating ${className ?? ""}`.trim()}>{children}</div>
        </div>
      </div>
    );
  }

  const rootClass =
    windowConfig.displayMode === "embedded"
      ? `sim-root sim-root--embedded ${className ?? ""}`.trim()
      : className ?? "sim-root";

  return (
    <div className={rootClass} style={windowConfig.displayMode === "embedded" ? embeddedStyle : undefined}>
      {children}
    </div>
  );
}
