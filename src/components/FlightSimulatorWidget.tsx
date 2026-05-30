import { MutableRefObject, useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { simulatorConfig } from "../config/simulatorConfig";
import { deepMerge } from "../config/mergeConfig";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { applyExternalTelemetry, setMode } from "../store/flightSlice";
import { store } from "../store/store";
import type { FlightInputs, FlightTelemetry } from "../types/flight";
import CesiumScene from "./CesiumScene";
import HudOverlay from "./HudOverlay";
import ScreenAircraftOverlay from "./ScreenAircraftOverlay";

type SimulatorConfig = typeof simulatorConfig;

export interface FlightSimulatorWidgetProps {
  mode?: "INTERNAL" | "EXTERNAL";
  externalTelemetry?: FlightTelemetry;
  enableKeyboard?: boolean;
  configOverride?: Partial<SimulatorConfig>;
  externalInputsRef?: MutableRefObject<FlightInputs>;
  className?: string;
}

function InternalWidget({
  mode,
  externalTelemetry,
  enableKeyboard = true,
  configOverride,
  externalInputsRef,
  className
}: FlightSimulatorWidgetProps) {
  const dispatch = useAppDispatch();
  const mergedConfig = useMemo(
    () => deepMerge(simulatorConfig, configOverride as Partial<SimulatorConfig> | undefined),
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
    <div className={className ?? "sim-root"}>
      <CesiumScene inputsRef={inputsRef} config={mergedConfig} />
      <ScreenAircraftOverlay config={mergedConfig} />
      <HudOverlay config={mergedConfig} />
    </div>
  );
}

export default function FlightSimulatorWidget(props: FlightSimulatorWidgetProps) {
  return (
    <Provider store={store}>
      <InternalWidget {...props} />
    </Provider>
  );
}
