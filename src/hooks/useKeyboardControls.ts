import { useEffect, useRef } from "react";
import {
  levelAttitude,
  pitchDownStep,
  pitchUpStep,
  resetFlight,
  rollLeftStep,
  rollRightStep,
  togglePause
} from "../store/flightSlice";
import type { FlightInputs } from "../types/flight";
import { useAppDispatch } from "./useAppDispatch";

export function useKeyboardControls(enabled: boolean) {
  const dispatch = useAppDispatch();
  const inputsRef = useRef<FlightInputs>({
    accelerate: false,
    brake: false,
    yawLeft: false,
    yawRight: false
  });

  useEffect(() => {
    if (!enabled) return;

    const down = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          dispatch(pitchUpStep());
          break;
        case "ArrowDown":
        case "KeyS":
          dispatch(pitchDownStep());
          break;
        case "ArrowLeft":
        case "KeyA":
          dispatch(rollLeftStep());
          break;
        case "ArrowRight":
        case "KeyD":
          dispatch(rollRightStep());
          break;
        case "KeyQ":
          inputsRef.current.yawLeft = true;
          break;
        case "KeyE":
          inputsRef.current.yawRight = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          inputsRef.current.accelerate = true;
          break;
        case "ControlLeft":
        case "ControlRight":
          inputsRef.current.brake = true;
          break;
        case "KeyZ":
          dispatch(levelAttitude());
          break;
        case "Space":
          if (!e.repeat) {
            e.preventDefault();
            dispatch(resetFlight());
          }
          break;
        case "KeyP":
          if (!e.repeat) dispatch(togglePause());
          break;
      }
    };

    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyQ":
          inputsRef.current.yawLeft = false;
          break;
        case "KeyE":
          inputsRef.current.yawRight = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          inputsRef.current.accelerate = false;
          break;
        case "ControlLeft":
        case "ControlRight":
          inputsRef.current.brake = false;
          break;
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [dispatch, enabled]);

  return inputsRef;
}
