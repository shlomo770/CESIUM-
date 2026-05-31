import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { simulatorConfig } from "../config/simulatorConfig";
import { deepMerge, type DeepPartial } from "../config/mergeConfig";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { applyExternalTelemetry, setMode } from "../store/flightSlice";
import { store } from "../store/store";
import type { FlightInputs, FlightTelemetry } from "../types/flight";
import type { FlightViewMode } from "../types/viewMode";
import CesiumScene from "./CesiumScene";
import HudOverlay from "./HudOverlay";
import ScreenAircraftOverlay from "./ScreenAircraftOverlay";
import ViewModeToggle from "./ViewModeToggle";
import WidgetShell from "./WidgetShell";

export type SimulatorConfig = typeof simulatorConfig;

export interface FlightSimulatorWidgetProps {
  mode?: "INTERNAL" | "EXTERNAL";
  externalTelemetry?: FlightTelemetry;
  enableKeyboard?: boolean;
  /** Partial config merged onto {@link simulatorConfig} defaults. */
  configOverride?: DeepPartial<SimulatorConfig>;
  externalInputsRef?: MutableRefObject<FlightInputs>;
  initialViewMode?: FlightViewMode;
  className?: string;
}

function InternalWidget({
  mode,
  externalTelemetry,
  enableKeyboard = true,
  configOverride,
  externalInputsRef,
  initialViewMode = "FLIGHT_CAMERA",
  className
}: FlightSimulatorWidgetProps) {
  const [viewMode, setViewMode] = useState<FlightViewMode>(initialViewMode);

  const dispatch = useAppDispatch();
  const mergedConfig = useMemo(
    () => deepMerge(simulatorConfig, configOverride),
    [configOverride]
  );

  const keyboardInputsRef = useKeyboardControls(enableKeyboard && (mode ?? mergedConfig.mode) === "INTERNAL");
  const inputsRef = externalInputsRef ?? keyboardInputsRef;

  useEffect(() => {
    dispatch(setMode(mode ?? mergedConfig.mode));
  }, [dispatch, mode, mergedConfig.mode]);

  useEffect(() => {
    if ((mode ?? mergedConfig.mode) === "EXTERNAL" && externalTelemetry) {
      dispatch(applyExternalTelemetry(externalTelemetry));
    }
  }, [dispatch, mode, mergedConfig.mode, externalTelemetry]);

  return (
    <WidgetShell windowConfig={mergedConfig.window} className={className}>
      <CesiumScene inputsRef={inputsRef} config={mergedConfig} viewMode={viewMode} />
      <ScreenAircraftOverlay config={mergedConfig} viewMode={viewMode} />
      <HudOverlay config={mergedConfig} viewMode={viewMode} />
      {mergedConfig.window.showViewModeToggle && (
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      )}
    </WidgetShell>
  );
}

export default function FlightSimulatorWidget(props: FlightSimulatorWidgetProps) {
  return (
    <Provider store={store}>
      <InternalWidget {...props} />
    </Provider>
  );
}
