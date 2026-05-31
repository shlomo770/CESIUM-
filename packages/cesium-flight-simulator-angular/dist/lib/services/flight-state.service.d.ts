import type { FlightInputs, FlightState, FlightTelemetry } from "../types/flight";
import * as i0 from "@angular/core";
export declare class FlightStateService {
    private readonly subject;
    readonly flight$: import("rxjs").Observable<FlightState>;
    get snapshot(): FlightState;
    setMode(mode: "INTERNAL" | "EXTERNAL"): void;
    applyExternalTelemetry(telemetry: FlightTelemetry): void;
    tickFlight(dtSeconds: number, inputs: FlightInputs, terrainHeightM: number): void;
    pitchUpStep(): void;
    pitchDownStep(): void;
    rollLeftStep(): void;
    rollRightStep(): void;
    levelAttitude(): void;
    resetFlight(): void;
    togglePause(): void;
    private patchAttitude;
    private patch;
    private pushTrail;
    static ɵfac: i0.ɵɵFactoryDeclaration<FlightStateService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<FlightStateService>;
}
