import { OnDestroy } from "@angular/core";
import type { FlightInputs } from "../types/flight";
import { FlightStateService } from "./flight-state.service";
import * as i0 from "@angular/core";
export declare class KeyboardInputService implements OnDestroy {
    private readonly flightState;
    readonly inputs: FlightInputs;
    private enabled;
    private boundDown;
    private boundUp;
    constructor(flightState: FlightStateService);
    setEnabled(enabled: boolean): void;
    ngOnDestroy(): void;
    private onKeyDown;
    private onKeyUp;
    static ɵfac: i0.ɵɵFactoryDeclaration<KeyboardInputService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<KeyboardInputService>;
}
