import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from "@angular/core";
import type { DeepPartial } from "../../config/mergeConfig";
import { simulatorConfig } from "../../config/simulatorConfig";
import type { SimulatorConfig } from "../../config/simulatorConfig.types";
import { FlightStateService } from "../../services/flight-state.service";
import { KeyboardInputService } from "../../services/keyboard-input.service";
import type { FlightTelemetry } from "../../types/flight";
import type { FlightViewMode } from "../../types/viewMode";
import { deepMerge } from "../../config/mergeConfig";

@Component({
  selector: "cfs-flight-simulator",
  templateUrl: "./flight-simulator-widget.component.html",
  styleUrls: ["../../styles/flight-simulator.scss"],
  encapsulation: ViewEncapsulation.None,
  providers: [FlightStateService, KeyboardInputService]
})
export class FlightSimulatorWidgetComponent implements OnInit, OnChanges {
  @Input() mode?: "INTERNAL" | "EXTERNAL";
  @Input() externalTelemetry?: FlightTelemetry;
  @Input() enableKeyboard = true;
  @Input() configOverride?: DeepPartial<SimulatorConfig>;
  @Input() initialViewMode: FlightViewMode = "FLIGHT_CAMERA";
  @Input() cesiumIonToken?: string;
  @Input() className?: string;

  mergedConfig: SimulatorConfig = simulatorConfig;
  viewMode: FlightViewMode = "FLIGHT_CAMERA";
  flight$ = this.flightState.flight$;

  floatingDragActive = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  floatingLeft = 0;
  floatingTop = 0;
  floatingPositioned = false;

  constructor(
    private readonly flightState: FlightStateService,
    private readonly keyboardInput: KeyboardInputService
  ) {
    this.viewMode = this.initialViewMode;
  }

  ngOnInit(): void {
    this.applyConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.applyConfig();
  }

  private applyConfig(): void {
    this.mergedConfig = deepMerge(simulatorConfig, this.configOverride);
    this.viewMode = this.initialViewMode;

    const effectiveMode = this.mode ?? this.mergedConfig.mode;
    this.flightState.setMode(effectiveMode);

    if (effectiveMode === "EXTERNAL" && this.externalTelemetry) {
      this.flightState.applyExternalTelemetry(this.externalTelemetry);
    }

    const keyboardEnabled = this.enableKeyboard && effectiveMode === "INTERNAL";
    this.keyboardInput.setEnabled(keyboardEnabled);

    if (this.mergedConfig.window.displayMode === "floating" && !this.floatingPositioned) {
      this.applyFloatingAnchor();
    }
  }

  setViewMode(mode: FlightViewMode): void {
    this.viewMode = mode;
  }

  fmt(value: number, decimals = 0): string {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    });
  }

  get shellClass(): string {
    const base =
      this.mergedConfig.window.displayMode === "embedded"
        ? "sim-root sim-root--embedded"
        : this.mergedConfig.window.displayMode === "floating"
          ? "sim-root sim-root--floating"
          : "sim-root";
    return this.className ? `${base} ${this.className}` : base;
  }

  get embeddedStyle(): { [key: string]: string } | null {
    if (this.mergedConfig.window.displayMode !== "embedded") return null;
    return {
      width: this.sizeToCss(this.mergedConfig.window.width),
      height: this.sizeToCss(this.mergedConfig.window.height)
    };
  }

  get floatingShellStyle(): { [key: string]: string } {
    const w = this.mergedConfig.window;
    const width = typeof w.width === "number" ? w.width : 960;
    const height = typeof w.height === "number" ? w.height : 640;
    const style: { [key: string]: string } = {
      width: `${width}px`,
      height: `${height}px`,
      zIndex: String(w.floating.zIndex)
    };

    if (this.floatingPositioned) {
      style.left = `${this.floatingLeft}px`;
      style.top = `${this.floatingTop}px`;
      style.right = "auto";
      style.bottom = "auto";
    } else {
      Object.assign(style, this.anchorStyle(w.floating.position, w.floating.margin));
    }

    return style;
  }

  onFloatingHeaderMouseDown(event: MouseEvent): void {
    if (!this.mergedConfig.window.floating.draggable) return;
    if (event.button !== 0) return;

    const shell = (event.currentTarget as HTMLElement).parentElement;
    if (!shell) return;

    const rect = shell.getBoundingClientRect();
    this.floatingDragActive = true;
    this.floatingPositioned = true;
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    this.floatingLeft = rect.left;
    this.floatingTop = rect.top;
    event.preventDefault();
  }

  @HostListener("document:mousemove", ["$event"])
  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.floatingDragActive) return;
    const margin = this.mergedConfig.window.floating.margin;
    const width = typeof this.mergedConfig.window.width === "number" ? this.mergedConfig.window.width : 960;
    const height = typeof this.mergedConfig.window.height === "number" ? this.mergedConfig.window.height : 640;
    const maxLeft = window.innerWidth - width - margin;
    const maxTop = window.innerHeight - height - margin;
    this.floatingLeft = Math.min(Math.max(margin, event.clientX - this.dragOffsetX), maxLeft);
    this.floatingTop = Math.min(Math.max(margin, event.clientY - this.dragOffsetY), maxTop);
  }

  @HostListener("document:mouseup")
  onDocumentMouseUp(): void {
    this.floatingDragActive = false;
  }

  private sizeToCss(value: number | "auto" | "100%"): string {
    if (value === "auto") return "auto";
    if (value === "100%") return "100%";
    return `${value}px`;
  }

  private applyFloatingAnchor(): void {
    this.floatingPositioned = false;
  }

  private anchorStyle(position: string, margin: number): { [key: string]: string } {
    const m = `${margin}px`;
    switch (position) {
      case "top-left":
        return { top: m, left: m };
      case "top-right":
        return { top: m, right: m };
      case "bottom-left":
        return { bottom: m, left: m };
      case "center":
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
      case "bottom-right":
      default:
        return { bottom: m, right: m };
    }
  }
}
