import { Injectable, OnDestroy } from "@angular/core";
import type { FlightInputs } from "../types/flight";
import { FlightStateService } from "./flight-state.service";

@Injectable()
export class KeyboardInputService implements OnDestroy {
  readonly inputs: FlightInputs = {
    accelerate: false,
    brake: false,
    yawLeft: false,
    yawRight: false
  };

  private enabled = false;
  private boundDown = (e: KeyboardEvent) => this.onKeyDown(e);
  private boundUp = (e: KeyboardEvent) => this.onKeyUp(e);

  constructor(private readonly flightState: FlightStateService) {}

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;

    if (enabled) {
      window.addEventListener("keydown", this.boundDown);
      window.addEventListener("keyup", this.boundUp);
    } else {
      window.removeEventListener("keydown", this.boundDown);
      window.removeEventListener("keyup", this.boundUp);
    }
  }

  ngOnDestroy(): void {
    this.setEnabled(false);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        this.flightState.pitchUpStep();
        break;
      case "ArrowDown":
      case "KeyS":
        this.flightState.pitchDownStep();
        break;
      case "ArrowLeft":
      case "KeyA":
        this.flightState.rollLeftStep();
        break;
      case "ArrowRight":
      case "KeyD":
        this.flightState.rollRightStep();
        break;
      case "KeyQ":
        this.inputs.yawLeft = true;
        break;
      case "KeyE":
        this.inputs.yawRight = true;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.inputs.accelerate = true;
        break;
      case "ControlLeft":
      case "ControlRight":
        this.inputs.brake = true;
        break;
      case "KeyZ":
        this.flightState.levelAttitude();
        break;
      case "Space":
        if (!e.repeat) {
          e.preventDefault();
          this.flightState.resetFlight();
        }
        break;
      case "KeyP":
        if (!e.repeat) this.flightState.togglePause();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case "KeyQ":
        this.inputs.yawLeft = false;
        break;
      case "KeyE":
        this.inputs.yawRight = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.inputs.accelerate = false;
        break;
      case "ControlLeft":
      case "ControlRight":
        this.inputs.brake = false;
        break;
    }
  }
}
