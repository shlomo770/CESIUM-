import { Component, Input, ViewChild } from "@angular/core";
import { CallbackProperty, Cartesian3, CesiumTerrainProvider, Color, ConstantProperty, EllipsoidTerrainProvider, Ion, PolylineGlowMaterialProperty, UrlTemplateImageryProvider, Viewer } from "cesium";
import { resolveMapTileUrl } from "../../config/resolveMapUrl";
import { simulatorConfig } from "../../config/simulatorConfig";
import { buildGroundReferenceLine, getTerrainHeightSafe, makeGltfOrientation, updateCamera } from "../../cesium/cesium-scene.helpers";
import * as i0 from "@angular/core";
import * as i1 from "../../services/flight-state.service";
import * as i2 from "../../services/keyboard-input.service";
export class CesiumSceneComponent {
    constructor(flightState, keyboardInput) {
        this.flightState = flightState;
        this.keyboardInput = keyboardInput;
        this.config = simulatorConfig;
        this.viewMode = "FLIGHT_CAMERA";
        this.viewer = null;
        this.aircraft = null;
        this.trail = null;
        this.sideCurrent = null;
        this.sideGround = null;
        this.trailPositions = [];
        this.lastTick = performance.now();
    }
    ngAfterViewInit() {
        if (this.cesiumIonToken) {
            Ion.defaultAccessToken = this.cesiumIonToken;
        }
        const viewer = new Viewer(this.containerRef.nativeElement, {
            animation: false,
            timeline: false,
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            fullscreenButton: false,
            infoBox: false,
            selectionIndicator: false,
            shouldAnimate: true,
            terrainProvider: new EllipsoidTerrainProvider()
        });
        this.viewer = viewer;
        this.applySceneSettings(viewer);
        this.setupEntities(viewer);
        viewer.clock.onTick.addEventListener(() => {
            const now = performance.now();
            const dtSeconds = (now - this.lastTick) / 1000;
            this.lastTick = now;
            const current = this.flightState.snapshot;
            const terrainHeightM = getTerrainHeightSafe(viewer, current.longitude, current.latitude);
            this.flightState.tickFlight(dtSeconds, this.keyboardInput.inputs, terrainHeightM);
        });
        this.flightSub = this.flightState.flight$.subscribe((flight) => {
            this.syncFlightToScene(flight);
        });
        this.syncFlightToScene(this.flightState.snapshot);
    }
    ngOnChanges(changes) {
        if (this.viewer && !this.viewer.isDestroyed() && (changes.config || changes.viewMode)) {
            this.syncFlightToScene(this.flightState.snapshot);
        }
    }
    ngOnDestroy() {
        this.flightSub?.unsubscribe();
        if (this.viewer && !this.viewer.isDestroyed()) {
            this.viewer.destroy();
        }
        this.viewer = null;
    }
    applySceneSettings(viewer) {
        viewer.imageryLayers.removeAll();
        const tileUrl = resolveMapTileUrl(this.config.map);
        if (tileUrl) {
            viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({ url: tileUrl }));
        }
        viewer.scene.globe.depthTestAgainstTerrain = this.config.scene.depthTestAgainstTerrain;
        viewer.scene.fog.enabled = this.config.scene.fogEnabled;
        if (viewer.scene.skyAtmosphere)
            viewer.scene.skyAtmosphere.show = this.config.scene.showSkyAtmosphere;
        if (viewer.scene.sun)
            viewer.scene.sun.show = this.config.scene.showSun;
        if (viewer.scene.moon)
            viewer.scene.moon.show = this.config.scene.showMoon;
        if (this.config.terrain.useCesiumWorldTerrain && this.cesiumIonToken) {
            CesiumTerrainProvider.fromIonAssetId(1)
                .then((terrain) => {
                if (viewer && !viewer.isDestroyed())
                    viewer.terrainProvider = terrain;
            })
                .catch(() => {
                if (viewer && !viewer.isDestroyed())
                    viewer.terrainProvider = new EllipsoidTerrainProvider();
            });
        }
    }
    setupEntities(viewer) {
        const start = this.flightState.snapshot;
        const startPosition = Cartesian3.fromDegrees(start.longitude, start.latitude, start.altitudeM);
        this.trailPositions = [startPosition];
        if (this.config.aircraft.renderMode === "GLTF") {
            this.aircraft = viewer.entities.add({
                name: "Flight Object",
                position: startPosition,
                orientation: makeGltfOrientation(startPosition, start, this.config),
                model: {
                    uri: this.config.aircraft.modelUri,
                    scale: this.config.aircraft.scale,
                    minimumPixelSize: this.config.aircraft.minimumPixelSize,
                    maximumScale: this.config.aircraft.maximumScale,
                    runAnimations: false
                }
            });
        }
        this.trail = viewer.entities.add({
            name: "Flight Trail Line",
            polyline: {
                positions: new CallbackProperty(() => this.trailPositions, false),
                width: this.config.trail.width,
                arcType: 0,
                material: new PolylineGlowMaterialProperty({
                    glowPower: this.config.trail.glowPower,
                    color: Color.CYAN.withAlpha(1)
                }),
                depthFailMaterial: Color.CYAN.withAlpha(1),
                show: this.config.annotations.trail
            }
        });
        this.sideCurrent = viewer.entities.add({
            name: "Side View Current Position Marker",
            point: {
                pixelSize: 15,
                color: Color.RED,
                outlineColor: Color.WHITE,
                outlineWidth: 3,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            show: false
        });
        this.sideGround = viewer.entities.add({
            name: "Side View Ground Reference",
            polyline: {
                positions: new ConstantProperty([]),
                width: 4,
                arcType: 0,
                material: Color.DARKGRAY.withAlpha(0.88),
                depthFailMaterial: Color.DARKGRAY.withAlpha(0.88)
            },
            show: false
        });
        updateCamera(viewer, start, this.config, this.viewMode);
    }
    syncFlightToScene(flight) {
        const viewer = this.viewer;
        if (!viewer || viewer.isDestroyed())
            return;
        const position = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
        if (this.aircraft) {
            this.aircraft.position = position;
            this.aircraft.orientation = makeGltfOrientation(position, flight, this.config);
            this.aircraft.show =
                this.viewMode === "MAP_SIDE_CAMERA" || this.config.aircraft.renderMode === "GLTF";
        }
        this.trailPositions = flight.trail.map(([lng, lat, alt]) => Cartesian3.fromDegrees(lng, lat, alt));
        if (this.trail) {
            this.trail.show = this.config.annotations.trail;
        }
        if (this.sideCurrent) {
            this.sideCurrent.position = position;
            this.sideCurrent.show = this.viewMode === "MAP_SIDE_CAMERA";
        }
        if (this.sideGround?.polyline) {
            this.sideGround.polyline.positions = new ConstantProperty(buildGroundReferenceLine(flight));
            this.sideGround.show = this.viewMode === "MAP_SIDE_CAMERA";
        }
        if (this.config.camera.enabled) {
            updateCamera(viewer, flight, this.config, this.viewMode);
        }
    }
}
CesiumSceneComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CesiumSceneComponent, deps: [{ token: i1.FlightStateService }, { token: i2.KeyboardInputService }], target: i0.ɵɵFactoryTarget.Component });
CesiumSceneComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: CesiumSceneComponent, selector: "cfs-cesium-scene", inputs: { config: "config", viewMode: "viewMode", cesiumIonToken: "cesiumIonToken" }, viewQueries: [{ propertyName: "containerRef", first: true, predicate: ["container"], descendants: true, static: true }], usesOnChanges: true, ngImport: i0, template: `<div class="cesium-container" #container></div>`, isInline: true, styles: [":host{display:block;position:absolute;inset:0;z-index:1}.cesium-container{position:absolute;inset:0}\n"] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CesiumSceneComponent, decorators: [{
            type: Component,
            args: [{ selector: "cfs-cesium-scene", template: `<div class="cesium-container" #container></div>`, styles: [":host{display:block;position:absolute;inset:0;z-index:1}.cesium-container{position:absolute;inset:0}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.FlightStateService }, { type: i2.KeyboardInputService }]; }, propDecorators: { containerRef: [{
                type: ViewChild,
                args: ["container", { static: true }]
            }], config: [{
                type: Input
            }], viewMode: [{
                type: Input
            }], cesiumIonToken: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VzaXVtLXNjZW5lLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9saWIvY29tcG9uZW50cy9jZXNpdW0tc2NlbmUvY2VzaXVtLXNjZW5lLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsU0FBUyxFQUVULEtBQUssRUFJTCxTQUFTLEVBQ1YsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUNMLGdCQUFnQixFQUNoQixVQUFVLEVBQ1YscUJBQXFCLEVBQ3JCLEtBQUssRUFDTCxnQkFBZ0IsRUFDaEIsd0JBQXdCLEVBRXhCLEdBQUcsRUFDSCw0QkFBNEIsRUFDNUIsMEJBQTBCLEVBQzFCLE1BQU0sRUFDUCxNQUFNLFFBQVEsQ0FBQztBQUNoQixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUMvRCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDL0QsT0FBTyxFQUNMLHdCQUF3QixFQUN4QixvQkFBb0IsRUFDcEIsbUJBQW1CLEVBRW5CLFlBQVksRUFDYixNQUFNLG1DQUFtQyxDQUFDOzs7O0FBd0IzQyxNQUFNLE9BQU8sb0JBQW9CO0lBZ0IvQixZQUNtQixXQUErQixFQUMvQixhQUFtQztRQURuQyxnQkFBVyxHQUFYLFdBQVcsQ0FBb0I7UUFDL0Isa0JBQWEsR0FBYixhQUFhLENBQXNCO1FBZjdDLFdBQU0sR0FBNEIsZUFBZSxDQUFDO1FBQ2xELGFBQVEsR0FBbUIsZUFBZSxDQUFDO1FBRzVDLFdBQU0sR0FBa0IsSUFBSSxDQUFDO1FBQzdCLGFBQVEsR0FBa0IsSUFBSSxDQUFDO1FBQy9CLFVBQUssR0FBa0IsSUFBSSxDQUFDO1FBQzVCLGdCQUFXLEdBQWtCLElBQUksQ0FBQztRQUNsQyxlQUFVLEdBQWtCLElBQUksQ0FBQztRQUNqQyxtQkFBYyxHQUFpQixFQUFFLENBQUM7UUFDbEMsYUFBUSxHQUFH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O3NCQUFyRCxTQUFTO3VCQUFDLFdBQVcsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7Z0JBRS9CLE1BQU07c0JBQWQsS0FBSztnQkFDRyxRQUFRO3NCQUFoQixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVmlld0NoaWxkXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtcbiAgQ2FsbGJhY2tQcm9wZXJ0eSxcbiAgQ2FydGVzaWFuMyxcbiAgQ2VzaXVtVGVycmFpblByb3ZpZGVyLFxuICBDb2xvcixcbiAgQ29uc3RhbnRQcm9wZXJ0eSxcbiAgRWxsaXBzb2lkVGVycmFpblByb3ZpZGVyLFxuICBFbnRpdHksXG4gIElvbixcbiAgUG9seWxpbmVHbG93TWF0ZXJpYWxQcm9wZXJ0eSxcbiAgVXJsVGVtcGxhdGVJbWFnZXJ5UHJvdmlkZXIsXG4gIFZpZXdlclxufSBmcm9tIFwiY2VzaXVtXCI7XG5pbXBvcnQgeyByZXNvbHZlTWFwVGlsZVVybCB9IGZyb20gXCIuLi8uLi9jb25maWcvcmVzb2x2ZU1hcFVybFwiO1xuaW1wb3J0IHsgc2ltdWxhdG9yQ29uZmlnIH0gZnJvbSBcIi4uLy4uL2NvbmZpZy9zaW11bGF0b3JDb25maWdcIjtcbmltcG9ydCB7XG4gIGJ1aWxkR3JvdW5kUmVmZXJlbmNlTGluZSxcbiAgZ2V0VGVycmFpbkhlaWdodFNhZmUsXG4gIG1ha2VHbHRmT3JpZW50YXRpb24sXG4gIFJlc29sdmVkU2ltdWxhdG9yQ29uZmlnLFxuICB1cGRhdGVDYW1lcmFcbn0gZnJvbSBcIi4uLy4uL2Nlc2l1bS9jZXNpdW0tc2NlbmUuaGVscGVyc1wiO1xuaW1wb3J0IHsgRmxpZ2h0U3RhdGVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL3NlcnZpY2VzL2ZsaWdodC1zdGF0ZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBLZXlib2FyZElucHV0U2VydmljZSB9IGZyb20gXCIuLi8uLi9zZXJ2aWNlcy9rZXlib2FyZC1pbnB1dC5zZXJ2aWNlXCI7XG5pbXBvcnQgdHlwZSB7IEZsaWdodFN0YXRlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2ZsaWdodFwiO1xuaW1wb3J0IHR5cGUgeyBGbGlnaHRWaWV3TW9kZSB9IGZyb20gXCIuLi8uLi90eXBlcy92aWV3TW9kZVwiO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY2ZzLWNlc2l1bS1zY2VuZVwiLFxuICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJjZXNpdW0tY29udGFpbmVyXCIgI2NvbnRhaW5lcj48L2Rpdj5gLFxuICBzdHlsZXM6IFtcbiAgICBgXG4gICAgICA6aG9zdCB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIGluc2V0OiAwO1xuICAgICAgICB6LWluZGV4OiAxO1xuICAgICAgfVxuICAgICAgLmNlc2l1bS1jb250YWluZXIge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIGluc2V0OiAwO1xuICAgICAgfVxuICAgIGBcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBDZXNpdW1TY2VuZUNvbXBvbmVudCBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgQFZpZXdDaGlsZChcImNvbnRhaW5lclwiLCB7IHN0YXRpYzogdHJ1ZSB9KSBjb250YWluZXJSZWYhOiBFbGVtZW50UmVmPEhUTUxEaXZFbGVtZW50PjtcblxuICBASW5wdXQoKSBjb25maWc6IFJlc29sdmVkU2ltdWxhdG9yQ29uZmlnID0gc2ltdWxhdG9yQ29uZmlnO1xuICBASW5wdXQoKSB2aWV3TW9kZTogRmxpZ2h0Vmlld01vZGUgPSBcIkZMSUdIVF9DQU1FUkFcIjtcbiAgQElucHV0KCkgY2VzaXVtSW9uVG9rZW4/OiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSB2aWV3ZXI6IFZpZXdlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFpcmNyYWZ0OiBFbnRpdHkgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0cmFpbDogRW50aXR5IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2lkZUN1cnJlbnQ6IEVudGl0eSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHNpZGVHcm91bmQ6IEVudGl0eSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHRyYWlsUG9zaXRpb25zOiBDYXJ0ZXNpYW4zW10gPSBbXTtcbiAgcHJpdmF0ZSBsYXN0VGljayA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICBwcml2YXRlIGZsaWdodFN1Yj86IFN1YnNjcmlwdGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZsaWdodFN0YXRlOiBGbGlnaHRTdGF0ZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBrZXlib2FyZElucHV0OiBLZXlib2FyZElucHV0U2VydmljZVxuICApIHt9XG5cbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNlc2l1bUlvblRva2VuKSB7XG4gICAgICBJb24uZGVmYXVsdEFjY2Vzc1Rva2VuID0gdGhpcy5jZXNpdW1Jb25Ub2tlbjtcbiAgICB9XG5cbiAgICBjb25zdCB2aWV3ZXIgPSBuZXcgVmlld2VyKHRoaXMuY29udGFpbmVyUmVmLm5hdGl2ZUVsZW1lbnQsIHtcbiAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICB0aW1lbGluZTogZmFsc2UsXG4gICAgICBiYXNlTGF5ZXJQaWNrZXI6IGZhbHNlLFxuICAgICAgZ2VvY29kZXI6IGZhbHNlLFxuICAgICAgaG9tZUJ1dHRvbjogZmFsc2UsXG4gICAgICBzY2VuZU1vZGVQaWNrZXI6IGZhbHNlLFxuICAgICAgbmF2aWdhdGlvbkhlbHBCdXR0b246IGZhbHNlLFxuICAgICAgZnVsbHNjcmVlbkJ1dHRvbjogZmFsc2UsXG4gICAgICBpbmZvQm94OiBmYWxzZSxcbiAgICAgIHNlbGVjdGlvbkluZGljYXRvcjogZmFsc2UsXG4gICAgICBzaG91bGRBbmltYXRlOiB0cnVlLFxuICAgICAgdGVycmFpblByb3ZpZGVyOiBuZXcgRWxsaXBzb2lkVGVycmFpblByb3ZpZGVyKClcbiAgICB9KTtcblxuICAgIHRoaXMudmlld2VyID0gdmlld2VyO1xuICAgIHRoaXMuYXBwbHlTY2VuZVNldHRpbmdzKHZpZXdlcik7XG4gICAgdGhpcy5zZXR1cEVudGl0aWVzKHZpZXdlcik7XG5cbiAgICB2aWV3ZXIuY2xvY2sub25UaWNrLmFkZEV2ZW50TGlzdGVuZXIoKCkgPT4ge1xuICAgICAgY29uc3Qgbm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICBjb25zdCBkdFNlY29uZHMgPSAobm93IC0gdGhpcy5sYXN0VGljaykgLyAxMDAwO1xuICAgICAgdGhpcy5sYXN0VGljayA9IG5vdztcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLmZsaWdodFN0YXRlLnNuYXBzaG90O1xuICAgICAgY29uc3QgdGVycmFpbkhlaWdodE0gPSBnZXRUZXJyYWluSGVpZ2h0U2FmZSh2aWV3ZXIsIGN1cnJlbnQubG9uZ2l0dWRlLCBjdXJyZW50LmxhdGl0dWRlKTtcbiAgICAgIHRoaXMuZmxpZ2h0U3RhdGUudGlja0ZsaWdodChkdFNlY29uZHMsIHRoaXMua2V5Ym9hcmRJbnB1dC5pbnB1dHMsIHRlcnJhaW5IZWlnaHRNKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZmxpZ2h0U3ViID0gdGhpcy5mbGlnaHRTdGF0ZS5mbGlnaHQkLnN1YnNjcmliZSgoZmxpZ2h0OiBGbGlnaHRTdGF0ZSkgPT4ge1xuICAgICAgdGhpcy5zeW5jRmxpZ2h0VG9TY2VuZShmbGlnaHQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zeW5jRmxpZ2h0VG9TY2VuZSh0aGlzLmZsaWdodFN0YXRlLnNuYXBzaG90KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAodGhpcy52aWV3ZXIgJiYgIXRoaXMudmlld2VyLmlzRGVzdHJveWVkKCkgJiYgKGNoYW5nZXMuY29uZmlnIHx8IGNoYW5nZXMudmlld01vZGUpKSB7XG4gICAgICB0aGlzLnN5bmNGbGlnaHRUb1NjZW5lKHRoaXMuZmxpZ2h0U3RhdGUuc25hcHNob3QpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuZmxpZ2h0U3ViPy51bnN1YnNjcmliZSgpO1xuICAgIGlmICh0aGlzLnZpZXdlciAmJiAhdGhpcy52aWV3ZXIuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgdGhpcy52aWV3ZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICB0aGlzLnZpZXdlciA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5U2NlbmVTZXR0aW5ncyh2aWV3ZXI6IFZpZXdlcik6IHZvaWQge1xuICAgIHZpZXdlci5pbWFnZXJ5TGF5ZXJzLnJlbW92ZUFsbCgpO1xuICAgIGNvbnN0IHRpbGVVcmwgPSByZXNvbHZlTWFwVGlsZVVybCh0aGlzLmNvbmZpZy5tYXApO1xuICAgIGlmICh0aWxlVXJsKSB7XG4gICAgICB2aWV3ZXIuaW1hZ2VyeUxheWVycy5hZGRJbWFnZXJ5UHJvdmlkZXIobmV3IFVybFRlbXBsYXRlSW1hZ2VyeVByb3ZpZGVyKHsgdXJsOiB0aWxlVXJsIH0pKTtcbiAgICB9XG5cbiAgICB2aWV3ZXIuc2NlbmUuZ2xvYmUuZGVwdGhUZXN0QWdhaW5zdFRlcnJhaW4gPSB0aGlzLmNvbmZpZy5zY2VuZS5kZXB0aFRlc3RBZ2FpbnN0VGVycmFpbjtcbiAgICB2aWV3ZXIuc2NlbmUuZm9nLmVuYWJsZWQgPSB0aGlzLmNvbmZpZy5zY2VuZS5mb2dFbmFibGVkO1xuICAgIGlmICh2aWV3ZXIuc2NlbmUuc2t5QXRtb3NwaGVyZSkgdmlld2VyLnNjZW5lLnNreUF0bW9zcGhlcmUuc2hvdyA9IHRoaXMuY29uZmlnLnNjZW5lLnNob3dTa3lBdG1vc3BoZXJlO1xuICAgIGlmICh2aWV3ZXIuc2NlbmUuc3VuKSB2aWV3ZXIuc2NlbmUuc3VuLnNob3cgPSB0aGlzLmNvbmZpZy5zY2VuZS5zaG93U3VuO1xuICAgIGlmICh2aWV3ZXIuc2NlbmUubW9vbikgdmlld2VyLnNjZW5lLm1vb24uc2hvdyA9IHRoaXMuY29uZmlnLnNjZW5lLnNob3dNb29uO1xuXG4gICAgaWYgKHRoaXMuY29uZmlnLnRlcnJhaW4udXNlQ2VzaXVtV29ybGRUZXJyYWluICYmIHRoaXMuY2VzaXVtSW9uVG9rZW4pIHtcbiAgICAgIENlc2l1bVRlcnJhaW5Qcm92aWRlci5mcm9tSW9uQXNzZXRJZCgxKVxuICAgICAgICAudGhlbigodGVycmFpbikgPT4ge1xuICAgICAgICAgIGlmICh2aWV3ZXIgJiYgIXZpZXdlci5pc0Rlc3Ryb3llZCgpKSB2aWV3ZXIudGVycmFpblByb3ZpZGVyID0gdGVycmFpbjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICBpZiAodmlld2VyICYmICF2aWV3ZXIuaXNEZXN0cm95ZWQoKSkgdmlld2VyLnRlcnJhaW5Qcm92aWRlciA9IG5ldyBFbGxpcHNvaWRUZXJyYWluUHJvdmlkZXIoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cEVudGl0aWVzKHZpZXdlcjogVmlld2VyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmZsaWdodFN0YXRlLnNuYXBzaG90O1xuICAgIGNvbnN0IHN0YXJ0UG9zaXRpb24gPSBDYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKHN0YXJ0LmxvbmdpdHVkZSwgc3RhcnQubGF0aXR1ZGUsIHN0YXJ0LmFsdGl0dWRlTSk7XG4gICAgdGhpcy50cmFpbFBvc2l0aW9ucyA9IFtzdGFydFBvc2l0aW9uXTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5haXJjcmFmdC5yZW5kZXJNb2RlID09PSBcIkdMVEZcIikge1xuICAgICAgdGhpcy5haXJjcmFmdCA9IHZpZXdlci5lbnRpdGllcy5hZGQoe1xuICAgICAgICBuYW1lOiBcIkZsaWdodCBPYmplY3RcIixcbiAgICAgICAgcG9zaXRpb246IHN0YXJ0UG9zaXRpb24sXG4gICAgICAgIG9yaWVudGF0aW9uOiBtYWtlR2x0Zk9yaWVudGF0aW9uKHN0YXJ0UG9zaXRpb24sIHN0YXJ0LCB0aGlzLmNvbmZpZyksXG4gICAgICAgIG1vZGVsOiB7XG4gICAgICAgICAgdXJpOiB0aGlzLmNvbmZpZy5haXJjcmFmdC5tb2RlbFVyaSxcbiAgICAgICAgICBzY2FsZTogdGhpcy5jb25maWcuYWlyY3JhZnQuc2NhbGUsXG4gICAgICAgICAgbWluaW11bVBpeGVsU2l6ZTogdGhpcy5jb25maWcuYWlyY3JhZnQubWluaW11bVBpeGVsU2l6ZSxcbiAgICAgICAgICBtYXhpbXVtU2NhbGU6IHRoaXMuY29uZmlnLmFpcmNyYWZ0Lm1heGltdW1TY2FsZSxcbiAgICAgICAgICBydW5BbmltYXRpb25zOiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLnRyYWlsID0gdmlld2VyLmVudGl0aWVzLmFkZCh7XG4gICAgICBuYW1lOiBcIkZsaWdodCBUcmFpbCBMaW5lXCIsXG4gICAgICBwb2x5bGluZToge1xuICAgICAgICBwb3NpdGlvbnM6IG5ldyBDYWxsYmFja1Byb3BlcnR5KCgpID0+IHRoaXMudHJhaWxQb3NpdGlvbnMsIGZhbHNlKSBhcyBhbnksXG4gICAgICAgIHdpZHRoOiB0aGlzLmNvbmZpZy50cmFpbC53aWR0aCxcbiAgICAgICAgYXJjVHlwZTogMCBhcyBhbnksXG4gICAgICAgIG1hdGVyaWFsOiBuZXcgUG9seWxpbmVHbG93TWF0ZXJpYWxQcm9wZXJ0eSh7XG4gICAgICAgICAgZ2xvd1Bvd2VyOiB0aGlzLmNvbmZpZy50cmFpbC5nbG93UG93ZXIsXG4gICAgICAgICAgY29sb3I6IENvbG9yLkNZQU4ud2l0aEFscGhhKDEpXG4gICAgICAgIH0pLFxuICAgICAgICBkZXB0aEZhaWxNYXRlcmlhbDogQ29sb3IuQ1lBTi53aXRoQWxwaGEoMSksXG4gICAgICAgIHNob3c6IHRoaXMuY29uZmlnLmFubm90YXRpb25zLnRyYWlsXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnNpZGVDdXJyZW50ID0gdmlld2VyLmVudGl0aWVzLmFkZCh7XG4gICAgICBuYW1lOiBcIlNpZGUgVmlldyBDdXJyZW50IFBvc2l0aW9uIE1hcmtlclwiLFxuICAgICAgcG9pbnQ6IHtcbiAgICAgICAgcGl4ZWxTaXplOiAxNSxcbiAgICAgICAgY29sb3I6IENvbG9yLlJFRCxcbiAgICAgICAgb3V0bGluZUNvbG9yOiBDb2xvci5XSElURSxcbiAgICAgICAgb3V0bGluZVdpZHRoOiAzLFxuICAgICAgICBkaXNhYmxlRGVwdGhUZXN0RGlzdGFuY2U6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWVxuICAgICAgfSxcbiAgICAgIHNob3c6IGZhbHNlXG4gICAgfSk7XG5cbiAgICB0aGlzLnNpZGVHcm91bmQgPSB2aWV3ZXIuZW50aXRpZXMuYWRkKHtcbiAgICAgIG5hbWU6IFwiU2lkZSBWaWV3IEdyb3VuZCBSZWZlcmVuY2VcIixcbiAgICAgIHBvbHlsaW5lOiB7XG4gICAgICAgIHBvc2l0aW9uczogbmV3IENvbnN0YW50UHJvcGVydHkoW10pIGFzIGFueSxcbiAgICAgICAgd2lkdGg6IDQsXG4gICAgICAgIGFyY1R5cGU6IDAgYXMgYW55LFxuICAgICAgICBtYXRlcmlhbDogQ29sb3IuREFSS0dSQVkud2l0aEFscGhhKDAuODgpLFxuICAgICAgICBkZXB0aEZhaWxNYXRlcmlhbDogQ29sb3IuREFSS0dSQVkud2l0aEFscGhhKDAuODgpXG4gICAgICB9LFxuICAgICAgc2hvdzogZmFsc2VcbiAgICB9KTtcblxuICAgIHVwZGF0ZUNhbWVyYSh2aWV3ZXIsIHN0YXJ0LCB0aGlzLmNvbmZpZywgdGhpcy52aWV3TW9kZSk7XG4gIH1cblxuICBwcml2YXRlIHN5bmNGbGlnaHRUb1NjZW5lKGZsaWdodDogRmxpZ2h0U3RhdGUpOiB2b2lkIHtcbiAgICBjb25zdCB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgICBpZiAoIXZpZXdlciB8fCB2aWV3ZXIuaXNEZXN0cm95ZWQoKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgcG9zaXRpb24gPSBDYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKGZsaWdodC5sb25naXR1ZGUsIGZsaWdodC5sYXRpdHVkZSwgZmxpZ2h0LmFsdGl0dWRlTSk7XG5cbiAgICBpZiAodGhpcy5haXJjcmFmdCkge1xuICAgICAgdGhpcy5haXJjcmFmdC5wb3NpdGlvbiA9IHBvc2l0aW9uIGFzIGFueTtcbiAgICAgIHRoaXMuYWlyY3JhZnQub3JpZW50YXRpb24gPSBtYWtlR2x0Zk9yaWVudGF0aW9uKHBvc2l0aW9uLCBmbGlnaHQsIHRoaXMuY29uZmlnKSBhcyBhbnk7XG4gICAgICB0aGlzLmFpcmNyYWZ0LnNob3cgPVxuICAgICAgICB0aGlzLnZpZXdNb2RlID09PSBcIk1BUF9TSURFX0NBTUVSQVwiIHx8IHRoaXMuY29uZmlnLmFpcmNyYWZ0LnJlbmRlck1vZGUgPT09IFwiR0xURlwiO1xuICAgIH1cblxuICAgIHRoaXMudHJhaWxQb3NpdGlvbnMgPSBmbGlnaHQudHJhaWwubWFwKChbbG5nLCBsYXQsIGFsdF0pID0+IENhcnRlc2lhbjMuZnJvbURlZ3JlZXMobG5nLCBsYXQsIGFsdCkpO1xuXG4gICAgaWYgKHRoaXMudHJhaWwpIHtcbiAgICAgIHRoaXMudHJhaWwuc2hvdyA9IHRoaXMuY29uZmlnLmFubm90YXRpb25zLnRyYWlsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNpZGVDdXJyZW50KSB7XG4gICAgICB0aGlzLnNpZGVDdXJyZW50LnBvc2l0aW9uID0gcG9zaXRpb24gYXMgYW55O1xuICAgICAgdGhpcy5zaWRlQ3VycmVudC5zaG93ID0gdGhpcy52aWV3TW9kZSA9PT0gXCJNQVBfU0lERV9DQU1FUkFcIjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zaWRlR3JvdW5kPy5wb2x5bGluZSkge1xuICAgICAgdGhpcy5zaWRlR3JvdW5kLnBvbHlsaW5lLnBvc2l0aW9ucyA9IG5ldyBDb25zdGFudFByb3BlcnR5KFxuICAgICAgICBidWlsZEdyb3VuZFJlZmVyZW5jZUxpbmUoZmxpZ2h0KVxuICAgICAgKSBhcyBhbnk7XG4gICAgICB0aGlzLnNpZGVHcm91bmQuc2hvdyA9IHRoaXMudmlld01vZGUgPT09IFwiTUFQX1NJREVfQ0FNRVJBXCI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29uZmlnLmNhbWVyYS5lbmFibGVkKSB7XG4gICAgICB1cGRhdGVDYW1lcmEodmlld2VyLCBmbGlnaHQsIHRoaXMuY29uZmlnLCB0aGlzLnZpZXdNb2RlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==