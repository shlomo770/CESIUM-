import { Injectable } from "@angular/core";
import * as i0 from "@angular/core";
import * as i1 from "./flight-state.service";
export class KeyboardInputService {
    constructor(flightState) {
        this.flightState = flightState;
        this.inputs = {
            accelerate: false,
            brake: false,
            yawLeft: false,
            yawRight: false
        };
        this.enabled = false;
        this.boundDown = (e) => this.onKeyDown(e);
        this.boundUp = (e) => this.onKeyUp(e);
    }
    setEnabled(enabled) {
        if (enabled === this.enabled)
            return;
        this.enabled = enabled;
        if (enabled) {
            window.addEventListener("keydown", this.boundDown);
            window.addEventListener("keyup", this.boundUp);
        }
        else {
            window.removeEventListener("keydown", this.boundDown);
            window.removeEventListener("keyup", this.boundUp);
        }
    }
    ngOnDestroy() {
        this.setEnabled(false);
    }
    onKeyDown(e) {
        if (!this.enabled)
            return;
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
                if (!e.repeat)
                    this.flightState.togglePause();
                break;
        }
    }
    onKeyUp(e) {
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
KeyboardInputService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: KeyboardInputService, deps: [{ token: i1.FlightStateService }], target: i0.ɵɵFactoryTarget.Injectable });
KeyboardInputService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: KeyboardInputService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: KeyboardInputService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i1.FlightStateService }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmQtaW5wdXQuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvc2VydmljZXMva2V5Ym9hcmQtaW5wdXQuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFhLE1BQU0sZUFBZSxDQUFDOzs7QUFLdEQsTUFBTSxPQUFPLG9CQUFvQjtJQVkvQixZQUE2QixXQUErQjtRQUEvQixnQkFBVyxHQUFYLFdBQVcsQ0FBb0I7UUFYbkQsV0FBTSxHQUFpQjtZQUM5QixVQUFVLEVBQUUsS0FBSztZQUNqQixLQUFLLEVBQUUsS0FBSztZQUNaLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQztRQUVNLFlBQU8sR0FBRyxLQUFLLENBQUM7UUFDaEIsY0FBUyxHQUFHLENBQUMsQ0FBZ0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxZQUFPLEdBQUcsQ0FBQyxDQUFnQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRU8sQ0FBQztJQUVoRSxVQUFVLENBQUMsT0FBZ0I7UUFDekIsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU87WUFBRSxPQUFPO1FBQ3JDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLElBQUksT0FBTyxFQUFFO1lBQ1gsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDaEQ7YUFBTTtZQUNMLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ25EO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFTyxTQUFTLENBQUMsQ0FBZ0I7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPO1lBQUUsT0FBTztRQUUxQixRQUFRLENBQUMsQ0FBQyxJQUFJLEVBQUU7WUFDZCxLQUFLLFNBQVMsQ0FBQztZQUNmLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMvQixNQUFNO1lBQ1IsS0FBSyxXQUFXLENBQUM7WUFDakIsS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ2pDLE1BQU07WUFDUixLQUFLLFdBQVcsQ0FBQztZQUNqQixLQUFLLE1BQU07Z0JBQ1QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDaEMsTUFBTTtZQUNSLEtBQUssWUFBWSxDQUFDO1lBQ2xCLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNqQyxNQUFNO1lBQ1IsS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDM0IsTUFBTTtZQUNSLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzVCLE1BQU07WUFDUixLQUFLLFdBQVcsQ0FBQztZQUNqQixLQUFLLFlBQVk7Z0JBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUM5QixNQUFNO1lBQ1IsS0FBSyxhQUFhLENBQUM7WUFDbkIsS0FBSyxjQUFjO2dCQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7Z0JBQ3pCLE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDakMsTUFBTTtZQUNSLEtBQUssT0FBTztnQkFDVixJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtvQkFDYixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ25CLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUM7aUJBQ2hDO2dCQUNELE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNO29CQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzlDLE1BQU07U0FDVDtJQUNILENBQUM7SUFFTyxPQUFPLENBQUMsQ0FBZ0I7UUFDOUIsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFO1lBQ2QsS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDNUIsTUFBTTtZQUNSLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQzdCLE1BQU07WUFDUixLQUFLLFdBQVcsQ0FBQztZQUNqQixLQUFLLFlBQVk7Z0JBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO2dCQUMvQixNQUFNO1lBQ1IsS0FBSyxhQUFhLENBQUM7WUFDbkIsS0FBSyxjQUFjO2dCQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7Z0JBQzFCLE1BQU07U0FDVDtJQUNILENBQUM7O2tIQWpHVSxvQkFBb0I7c0hBQXBCLG9CQUFvQjs0RkFBcEIsb0JBQW9CO2tCQURoQyxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgT25EZXN0cm95IH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB0eXBlIHsgRmxpZ2h0SW5wdXRzIH0gZnJvbSBcIi4uL3R5cGVzL2ZsaWdodFwiO1xuaW1wb3J0IHsgRmxpZ2h0U3RhdGVTZXJ2aWNlIH0gZnJvbSBcIi4vZmxpZ2h0LXN0YXRlLnNlcnZpY2VcIjtcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEtleWJvYXJkSW5wdXRTZXJ2aWNlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcmVhZG9ubHkgaW5wdXRzOiBGbGlnaHRJbnB1dHMgPSB7XG4gICAgYWNjZWxlcmF0ZTogZmFsc2UsXG4gICAgYnJha2U6IGZhbHNlLFxuICAgIHlhd0xlZnQ6IGZhbHNlLFxuICAgIHlhd1JpZ2h0OiBmYWxzZVxuICB9O1xuXG4gIHByaXZhdGUgZW5hYmxlZCA9IGZhbHNlO1xuICBwcml2YXRlIGJvdW5kRG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB0aGlzLm9uS2V5RG93bihlKTtcbiAgcHJpdmF0ZSBib3VuZFVwID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHRoaXMub25LZXlVcChlKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGZsaWdodFN0YXRlOiBGbGlnaHRTdGF0ZVNlcnZpY2UpIHt9XG5cbiAgc2V0RW5hYmxlZChlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKGVuYWJsZWQgPT09IHRoaXMuZW5hYmxlZCkgcmV0dXJuO1xuICAgIHRoaXMuZW5hYmxlZCA9IGVuYWJsZWQ7XG5cbiAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuYm91bmREb3duKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5ib3VuZFVwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuYm91bmREb3duKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5ib3VuZFVwKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnNldEVuYWJsZWQoZmFsc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBvbktleURvd24oZTogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5lbmFibGVkKSByZXR1cm47XG5cbiAgICBzd2l0Y2ggKGUuY29kZSkge1xuICAgICAgY2FzZSBcIkFycm93VXBcIjpcbiAgICAgIGNhc2UgXCJLZXlXXCI6XG4gICAgICAgIHRoaXMuZmxpZ2h0U3RhdGUucGl0Y2hVcFN0ZXAoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dEb3duXCI6XG4gICAgICBjYXNlIFwiS2V5U1wiOlxuICAgICAgICB0aGlzLmZsaWdodFN0YXRlLnBpdGNoRG93blN0ZXAoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dMZWZ0XCI6XG4gICAgICBjYXNlIFwiS2V5QVwiOlxuICAgICAgICB0aGlzLmZsaWdodFN0YXRlLnJvbGxMZWZ0U3RlcCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd1JpZ2h0XCI6XG4gICAgICBjYXNlIFwiS2V5RFwiOlxuICAgICAgICB0aGlzLmZsaWdodFN0YXRlLnJvbGxSaWdodFN0ZXAoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiS2V5UVwiOlxuICAgICAgICB0aGlzLmlucHV0cy55YXdMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiS2V5RVwiOlxuICAgICAgICB0aGlzLmlucHV0cy55YXdSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlNoaWZ0TGVmdFwiOlxuICAgICAgY2FzZSBcIlNoaWZ0UmlnaHRcIjpcbiAgICAgICAgdGhpcy5pbnB1dHMuYWNjZWxlcmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkNvbnRyb2xMZWZ0XCI6XG4gICAgICBjYXNlIFwiQ29udHJvbFJpZ2h0XCI6XG4gICAgICAgIHRoaXMuaW5wdXRzLmJyYWtlID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiS2V5WlwiOlxuICAgICAgICB0aGlzLmZsaWdodFN0YXRlLmxldmVsQXR0aXR1ZGUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiU3BhY2VcIjpcbiAgICAgICAgaWYgKCFlLnJlcGVhdCkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLmZsaWdodFN0YXRlLnJlc2V0RmxpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiS2V5UFwiOlxuICAgICAgICBpZiAoIWUucmVwZWF0KSB0aGlzLmZsaWdodFN0YXRlLnRvZ2dsZVBhdXNlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25LZXlVcChlOiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgc3dpdGNoIChlLmNvZGUpIHtcbiAgICAgIGNhc2UgXCJLZXlRXCI6XG4gICAgICAgIHRoaXMuaW5wdXRzLnlhd0xlZnQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiS2V5RVwiOlxuICAgICAgICB0aGlzLmlucHV0cy55YXdSaWdodCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJTaGlmdExlZnRcIjpcbiAgICAgIGNhc2UgXCJTaGlmdFJpZ2h0XCI6XG4gICAgICAgIHRoaXMuaW5wdXRzLmFjY2VsZXJhdGUgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQ29udHJvbExlZnRcIjpcbiAgICAgIGNhc2UgXCJDb250cm9sUmlnaHRcIjpcbiAgICAgICAgdGhpcy5pbnB1dHMuYnJha2UgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG4iXX0=