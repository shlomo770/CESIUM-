import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from "@angular/core";
import { Subscription } from "rxjs";
import {
  CallbackProperty,
  Cartesian3,
  CesiumTerrainProvider,
  Color,
  ConstantProperty,
  EllipsoidTerrainProvider,
  Entity,
  Ion,
  PolylineGlowMaterialProperty,
  UrlTemplateImageryProvider,
  Viewer
} from "cesium";
import { resolveMapTileUrl } from "../../config/resolveMapUrl";
import { simulatorConfig } from "../../config/simulatorConfig";
import {
  buildGroundReferenceLine,
  getTerrainHeightSafe,
  makeGltfOrientation,
  ResolvedSimulatorConfig,
  updateCamera
} from "../../cesium/cesium-scene.helpers";
import { FlightStateService } from "../../services/flight-state.service";
import { KeyboardInputService } from "../../services/keyboard-input.service";
import type { FlightState } from "../../types/flight";
import type { FlightViewMode } from "../../types/viewMode";

@Component({
  selector: "cfs-cesium-scene",
  template: `<div class="cesium-container" #container></div>`,
  styles: [
    `
      :host {
        display: block;
        position: absolute;
        inset: 0;
        z-index: 1;
      }
      .cesium-container {
        position: absolute;
        inset: 0;
      }
    `
  ]
})
export class CesiumSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild("container", { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() config: ResolvedSimulatorConfig = simulatorConfig;
  @Input() viewMode: FlightViewMode = "FLIGHT_CAMERA";
  @Input() cesiumIonToken?: string;

  private viewer: Viewer | null = null;
  private aircraft: Entity | null = null;
  private trail: Entity | null = null;
  private sideCurrent: Entity | null = null;
  private sideGround: Entity | null = null;
  private trailPositions: Cartesian3[] = [];
  private lastTick = performance.now();
  private flightSub?: Subscription;

  constructor(
    private readonly flightState: FlightStateService,
    private readonly keyboardInput: KeyboardInputService
  ) {}

  ngAfterViewInit(): void {
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

    this.flightSub = this.flightState.flight$.subscribe((flight: FlightState) => {
      this.syncFlightToScene(flight);
    });

    this.syncFlightToScene(this.flightState.snapshot);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewer && !this.viewer.isDestroyed() && (changes.config || changes.viewMode)) {
      this.syncFlightToScene(this.flightState.snapshot);
    }
  }

  ngOnDestroy(): void {
    this.flightSub?.unsubscribe();
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
    this.viewer = null;
  }

  private applySceneSettings(viewer: Viewer): void {
    viewer.imageryLayers.removeAll();
    const tileUrl = resolveMapTileUrl(this.config.map);
    if (tileUrl) {
      viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({ url: tileUrl }));
    }

    viewer.scene.globe.depthTestAgainstTerrain = this.config.scene.depthTestAgainstTerrain;
    viewer.scene.fog.enabled = this.config.scene.fogEnabled;
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = this.config.scene.showSkyAtmosphere;
    if (viewer.scene.sun) viewer.scene.sun.show = this.config.scene.showSun;
    if (viewer.scene.moon) viewer.scene.moon.show = this.config.scene.showMoon;

    if (this.config.terrain.useCesiumWorldTerrain && this.cesiumIonToken) {
      CesiumTerrainProvider.fromIonAssetId(1)
        .then((terrain) => {
          if (viewer && !viewer.isDestroyed()) viewer.terrainProvider = terrain;
        })
        .catch(() => {
          if (viewer && !viewer.isDestroyed()) viewer.terrainProvider = new EllipsoidTerrainProvider();
        });
    }
  }

  private setupEntities(viewer: Viewer): void {
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
        positions: new CallbackProperty(() => this.trailPositions, false) as any,
        width: this.config.trail.width,
        arcType: 0 as any,
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
        positions: new ConstantProperty([]) as any,
        width: 4,
        arcType: 0 as any,
        material: Color.DARKGRAY.withAlpha(0.88),
        depthFailMaterial: Color.DARKGRAY.withAlpha(0.88)
      },
      show: false
    });

    updateCamera(viewer, start, this.config, this.viewMode);
  }

  private syncFlightToScene(flight: FlightState): void {
    const viewer = this.viewer;
    if (!viewer || viewer.isDestroyed()) return;

    const position = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);

    if (this.aircraft) {
      this.aircraft.position = position as any;
      this.aircraft.orientation = makeGltfOrientation(position, flight, this.config) as any;
      this.aircraft.show =
        this.viewMode === "MAP_SIDE_CAMERA" || this.config.aircraft.renderMode === "GLTF";
    }

    this.trailPositions = flight.trail.map(([lng, lat, alt]) => Cartesian3.fromDegrees(lng, lat, alt));

    if (this.trail) {
      this.trail.show = this.config.annotations.trail;
    }

    if (this.sideCurrent) {
      this.sideCurrent.position = position as any;
      this.sideCurrent.show = this.viewMode === "MAP_SIDE_CAMERA";
    }

    if (this.sideGround?.polyline) {
      this.sideGround.polyline.positions = new ConstantProperty(
        buildGroundReferenceLine(flight)
      ) as any;
      this.sideGround.show = this.viewMode === "MAP_SIDE_CAMERA";
    }

    if (this.config.camera.enabled) {
      updateCamera(viewer, flight, this.config, this.viewMode);
    }
  }
}
