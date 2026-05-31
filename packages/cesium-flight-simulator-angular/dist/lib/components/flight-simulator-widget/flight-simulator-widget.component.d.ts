import { OnChanges, OnInit, SimpleChanges } from "@angular/core";
import type { DeepPartial } from "../../config/mergeConfig";
import type { SimulatorConfig } from "../../config/simulatorConfig.types";
import { FlightStateService } from "../../services/flight-state.service";
import { KeyboardInputService } from "../../services/keyboard-input.service";
import type { FlightTelemetry } from "../../types/flight";
import type { FlightViewMode } from "../../types/viewMode";
import * as i0 from "@angular/core";
export declare class FlightSimulatorWidgetComponent implements OnInit, OnChanges {
    private readonly flightState;
    private readonly keyboardInput;
    mode?: "INTERNAL" | "EXTERNAL";
    externalTelemetry?: FlightTelemetry;
    enableKeyboard: boolean;
    configOverride?: DeepPartial<SimulatorConfig>;
    initialViewMode: FlightViewMode;
    cesiumIonToken?: string;
    className?: string;
    mergedConfig: SimulatorConfig;
    viewMode: FlightViewMode;
    flight$: import("rxjs").Observable<import("../../types/flight").FlightState>;
    floatingDragActive: boolean;
    private dragOffsetX;
    private dragOffsetY;
    floatingLeft: number;
    floatingTop: number;
    floatingPositioned: boolean;
    constructor(flightState: FlightStateService, keyboardInput: KeyboardInputService);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    private applyConfig;
    setViewMode(mode: FlightViewMode): void;
    fmt(value: number, decimals?: number): string;
    get shellClass(): string;
    get embeddedStyle(): {
        [key: string]: string;
    } | null;
    get floatingShellStyle(): {
        [key: string]: string;
    };
    onFloatingHeaderMouseDown(event: MouseEvent): void;
    onDocumentMouseMove(event: MouseEvent): void;
    onDocumentMouseUp(): void;
    private sizeToCss;
    private applyFloatingAnchor;
    private anchorStyle;
    static ɵfac: i0.ɵɵFactoryDeclaration<FlightSimulatorWidgetComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FlightSimulatorWidgetComponent, "cfs-flight-simulator", never, { "mode": "mode"; "externalTelemetry": "externalTelemetry"; "enableKeyboard": "enableKeyboard"; "configOverride": "configOverride"; "initialViewMode": "initialViewMode"; "cesiumIonToken": "cesiumIonToken"; "className": "className"; }, {}, never, never, false, never>;
}
