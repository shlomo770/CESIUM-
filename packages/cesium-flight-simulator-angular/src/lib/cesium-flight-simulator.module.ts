import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CesiumSceneComponent } from "./components/cesium-scene/cesium-scene.component";
import { FlightSimulatorWidgetComponent } from "./components/flight-simulator-widget/flight-simulator-widget.component";

@NgModule({
  declarations: [FlightSimulatorWidgetComponent, CesiumSceneComponent],
  imports: [CommonModule],
  exports: [FlightSimulatorWidgetComponent]
})
export class CesiumFlightSimulatorModule {}
