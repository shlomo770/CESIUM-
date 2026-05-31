import * as i3 from '@angular/common';
import { CommonModule } from '@angular/common';
import * as i0 from '@angular/core';
import { Injectable, Component, ViewChild, Input, ViewEncapsulation, HostListener, NgModule } from '@angular/core';
import { Transforms, HeadingPitchRoll, Math as Math$1, Cartesian3, HeadingPitchRange, Matrix4, Ion, Viewer, EllipsoidTerrainProvider, UrlTemplateImageryProvider, CesiumTerrainProvider, CallbackProperty, PolylineGlowMaterialProperty, Color, ConstantProperty } from 'cesium';
import { BehaviorSubject } from 'rxjs';

/**
 * Resolves the imagery URL passed to Cesium `UrlTemplateImageryProvider`.
 */
function resolveMapTileUrl(map) {
    switch (map.mode) {
        case "NONE":
            return null;
        case "ONLINE_ESRI":
            return map.onlineEsriUrl;
        case "LOCAL_XYZ":
            return map.tileUrl || map.localXyzUrl;
        case "CUSTOM":
            return map.tileUrl || map.localXyzUrl;
        default:
            return null;
    }
}

const simulatorConfig = {
    mode: "INTERNAL",
    start: {
        latitude: 32.0853,
        longitude: 34.7818,
        altitudeM: 1200,
        headingDeg: 25,
        speedMps: 145
    },
    /**
     * Layout of the simulator widget in the host page.
     */
    window: {
        /** `fullscreen` | `embedded` (fixed box) | `floating` (draggable panel). */
        displayMode: "fullscreen",
        width: "100%",
        height: "100%",
        floating: {
            position: "bottom-right",
            draggable: true,
            title: "Cesium Flight Simulator",
            margin: 16,
            zIndex: 10000
        },
        showViewModeToggle: true
    },
    aircraft: {
        /**
         * המודל שהעלית, מומר ל־GLB מקומי.
         */
        renderMode: "GLTF",
        modelUri: "/models/stealth_drone_perfect.glb",
        /**
         * גדול מספיק כדי לראות ברור.
         */
        scale: 90,
        minimumPixelSize: 130,
        maximumScale: 900,
        /**
         * תיקון חשוב:
         * במודל הזה Pitch/Roll נראו מוחלפים ב-Cesium.
         * לכן ברירת המחדל מחליפה ביניהם בתצוגה בלבד.
         *
         * הטיסה עצמה נשארת נכונה:
         * W/Up = pitch
         * A/D = roll
         */
        orientationMode: "SWAP_PITCH_ROLL",
        modelHeadingOffsetDeg: 0,
        modelPitchOffsetDeg: 0,
        modelRollOffsetDeg: 0,
        screenSizePx: 150,
        screenOffsetYPx: 28,
        lengthM: 220,
        widthM: 150,
        heightM: 60
    },
    flight: {
        minSpeedMps: 55,
        maxSpeedMps: 310,
        throttleAccelerationMps2: 42,
        brakeAccelerationMps2: 55,
        pitchStepDeg: 2.5,
        rollStepDeg: 3.5,
        maxPitchUpDeg: 38,
        maxPitchDownDeg: -42,
        maxRollDeg: 75,
        levelStepFactor: 0.35,
        turnPowerDegPerSec: 34,
        yawTrimPowerDegPerSec: 9,
        climbPower: 0.92,
        minAltitudeAboveGroundM: 20,
        maxAltitudeM: 14000
    },
    camera: {
        enabled: true,
        /**
         * MANUAL_FORWARD_CHASE:
         * לא משתמש ב-Cesium lookAt שמבלבל כיוון.
         * בונה מצלמה ידנית מאחורי הטיל, ומסתכל קדימה לכיוון הטיסה.
         */
        mode: "MANUAL_FORWARD_CHASE",
        rangeBehindM: 700,
        heightAboveM: 170,
        lookAheadM: 1400,
        minRangeM: 220,
        maxRangeM: 3800,
        /**
         * אם פעם מרגיש הפוך, שנה ל-180.
         * כרגע 0 = קדימה לפי כיוון הטיסה.
         */
        headingCameraOffsetDeg: 0
    },
    map: {
        mode: "ONLINE_ESRI",
        /** Primary URL for LOCAL_XYZ / CUSTOM — `{z}/{x}/{y}`. */
        tileUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg",
        onlineEsriUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        /** @deprecated Use tileUrl. */
        localXyzUrl: "http://localhost:3001/tiles/satellite/{z}/{x}/{y}.jpg",
        urlTemplate: "XYZ"
    },
    terrain: {
        useCesiumWorldTerrain: false
    },
    scene: {
        showSkyAtmosphere: false,
        showMoon: false,
        showSun: false,
        fogEnabled: false,
        depthTestAgainstTerrain: false
    },
    annotations: {
        /** Top strip: speed, altitude, heading, pitch, roll. */
        hudTop: true,
        crosshair: true,
        attitudeIndicator: true,
        /** Bottom strip: lat, lng, altitude, trail length. */
        bottomTelemetry: true,
        controlsHelp: false,
        /** Cesium polyline trail behind aircraft. */
        trail: true,
        debugPanel: false
    },
    trail: {
        /**
         * שובל קו בלבד.
         * משתמש ב-CallbackProperty כדי שהקו יתעדכן תמיד ולא ייעלם.
         */
        width: 12,
        glowPower: 0.38,
        maxPoints: 9000,
        minDistanceDeg: 0.000002,
        minAltitudeDeltaM: 0.1,
        showPoints: false,
        pointPixelSize: 0
    }
};

function makeGltfOrientation(position, flight, config) {
    let visualPitch = flight.pitchDeg;
    let visualRoll = flight.rollDeg;
    if (config.aircraft.orientationMode === "SWAP_PITCH_ROLL") {
        visualPitch = flight.rollDeg;
        visualRoll = flight.pitchDeg;
    }
    return Transforms.headingPitchRollQuaternion(position, new HeadingPitchRoll(Math$1.toRadians(flight.headingDeg + config.aircraft.modelHeadingOffsetDeg), Math$1.toRadians(visualPitch + config.aircraft.modelPitchOffsetDeg), Math$1.toRadians(visualRoll + config.aircraft.modelRollOffsetDeg)));
}
function getTerrainHeightSafe(viewer, longitude, latitude) {
    try {
        const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(Cartesian3.fromDegrees(longitude, latitude));
        return viewer.scene.globe.getHeight(cartographic) ?? 0;
    }
    catch {
        return 0;
    }
}
function buildGroundReferenceLine(flight) {
    if (flight.trail.length < 2) {
        return [
            Cartesian3.fromDegrees(flight.longitude - 0.01, flight.latitude, 0),
            Cartesian3.fromDegrees(flight.longitude + 0.01, flight.latitude, 0)
        ];
    }
    const first = flight.trail[0];
    const last = flight.trail[flight.trail.length - 1];
    return [
        Cartesian3.fromDegrees(first[0], first[1], 0),
        Cartesian3.fromDegrees(last[0], last[1], 0)
    ];
}
function getFlightAxes(center, headingDeg, pitchDeg, rollDeg) {
    const up = Cartesian3.normalize(center, new Cartesian3());
    const worldZ = new Cartesian3(0, 0, 1);
    let east = Cartesian3.cross(worldZ, up, new Cartesian3());
    if (Cartesian3.magnitude(east) < 0.0001) {
        east = new Cartesian3(1, 0, 0);
    }
    else {
        Cartesian3.normalize(east, east);
    }
    const north = Cartesian3.normalize(Cartesian3.cross(up, east, new Cartesian3()), new Cartesian3());
    const h = Math$1.toRadians(headingDeg);
    const pitch = Math$1.toRadians(pitchDeg);
    const roll = Math$1.toRadians(rollDeg);
    const forwardH = Cartesian3.add(Cartesian3.multiplyByScalar(east, Math.sin(h), new Cartesian3()), Cartesian3.multiplyByScalar(north, Math.cos(h), new Cartesian3()), new Cartesian3());
    Cartesian3.normalize(forwardH, forwardH);
    const rightH = Cartesian3.add(Cartesian3.multiplyByScalar(east, Math.cos(h), new Cartesian3()), Cartesian3.multiplyByScalar(north, -Math.sin(h), new Cartesian3()), new Cartesian3());
    Cartesian3.normalize(rightH, rightH);
    const forwardP = Cartesian3.add(Cartesian3.multiplyByScalar(forwardH, Math.cos(pitch), new Cartesian3()), Cartesian3.multiplyByScalar(up, Math.sin(pitch), new Cartesian3()), new Cartesian3());
    Cartesian3.normalize(forwardP, forwardP);
    const upP = Cartesian3.add(Cartesian3.multiplyByScalar(forwardH, -Math.sin(pitch), new Cartesian3()), Cartesian3.multiplyByScalar(up, Math.cos(pitch), new Cartesian3()), new Cartesian3());
    Cartesian3.normalize(upP, upP);
    const rightR = Cartesian3.add(Cartesian3.multiplyByScalar(rightH, Math.cos(roll), new Cartesian3()), Cartesian3.multiplyByScalar(upP, -Math.sin(roll), new Cartesian3()), new Cartesian3());
    Cartesian3.normalize(rightR, rightR);
    const upR = Cartesian3.add(Cartesian3.multiplyByScalar(rightH, Math.sin(roll), new Cartesian3()), Cartesian3.multiplyByScalar(upP, Math.cos(roll), new Cartesian3()), new Cartesian3());
    Cartesian3.normalize(upR, upR);
    return { forward: forwardP, right: rightR, up: upR };
}
function updateCamera(viewer, flight, config, viewMode) {
    if (viewMode === "MAP_SIDE_CAMERA") {
        updateMapSideCamera(viewer, flight);
        return;
    }
    updateManualForwardCamera(viewer, flight, config);
}
function updateManualForwardCamera(viewer, flight, config) {
    const target = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
    const axes = getFlightAxes(target, flight.headingDeg + config.camera.headingCameraOffsetDeg, flight.pitchDeg, flight.rollDeg);
    const cameraPosition = Cartesian3.add(target, Cartesian3.multiplyByScalar(axes.forward, -config.camera.rangeBehindM, new Cartesian3()), new Cartesian3());
    Cartesian3.add(cameraPosition, Cartesian3.multiplyByScalar(axes.up, config.camera.heightAboveM, new Cartesian3()), cameraPosition);
    const lookAt = Cartesian3.add(target, Cartesian3.multiplyByScalar(axes.forward, config.camera.lookAheadM, new Cartesian3()), new Cartesian3());
    Cartesian3.add(lookAt, Cartesian3.multiplyByScalar(axes.up, flight.pitchDeg * 3, new Cartesian3()), lookAt);
    const direction = Cartesian3.normalize(Cartesian3.subtract(lookAt, cameraPosition, new Cartesian3()), new Cartesian3());
    viewer.camera.setView({
        destination: cameraPosition,
        orientation: { direction, up: axes.up }
    });
}
function updateMapSideCamera(viewer, flight) {
    const trail = flight.trail;
    const current = Cartesian3.fromDegrees(flight.longitude, flight.latitude, flight.altitudeM);
    if (trail.length < 2) {
        viewer.camera.lookAt(current, new HeadingPitchRange(0, Math$1.toRadians(-18), 2600));
        viewer.camera.lookAtTransform(Matrix4.IDENTITY);
        return;
    }
    const first = trail[0];
    const last = trail[trail.length - 1];
    const firstPos = Cartesian3.fromDegrees(first[0], first[1], first[2]);
    const lastPos = Cartesian3.fromDegrees(last[0], last[1], last[2]);
    const center = Cartesian3.midpoint(firstPos, lastPos, new Cartesian3());
    const pathVector = Cartesian3.subtract(lastPos, firstPos, new Cartesian3());
    const pathLength = Math.max(Cartesian3.magnitude(pathVector), 1000);
    const pathDir = Cartesian3.normalize(pathVector, new Cartesian3());
    const up = Cartesian3.normalize(center, new Cartesian3());
    let side = Cartesian3.cross(pathDir, up, new Cartesian3());
    if (Cartesian3.magnitude(side) < 0.001) {
        side = Cartesian3.cross(pathDir, new Cartesian3(0, 0, 1), new Cartesian3());
    }
    Cartesian3.normalize(side, side);
    const maxAlt = Math.max(...trail.map((p) => p[2]), flight.altitudeM);
    const minAlt = Math.min(...trail.map((p) => p[2]), flight.altitudeM);
    const altitudeSpan = Math.max(300, maxAlt - minAlt);
    const sideDistance = Math.max(1700, pathLength * 1.25);
    const upDistance = Math.max(550, altitudeSpan * 0.85);
    const cameraPosition = Cartesian3.add(center, Cartesian3.multiplyByScalar(side, sideDistance, new Cartesian3()), new Cartesian3());
    Cartesian3.add(cameraPosition, Cartesian3.multiplyByScalar(up, upDistance, new Cartesian3()), cameraPosition);
    const lookAt = Cartesian3.add(center, Cartesian3.multiplyByScalar(up, altitudeSpan * 0.18, new Cartesian3()), new Cartesian3());
    const direction = Cartesian3.normalize(Cartesian3.subtract(lookAt, cameraPosition, new Cartesian3()), new Cartesian3());
    viewer.camera.setView({
        destination: cameraPosition,
        orientation: { direction, up }
    });
}

const EARTH_RADIUS_M = 6371000;
function movePoint(latDeg, lngDeg, headingDeg, distanceM) {
    const lat1 = toRad(latDeg);
    const lon1 = toRad(lngDeg);
    const brng = toRad(headingDeg);
    const angular = distanceM / EARTH_RADIUS_M;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) +
        Math.cos(lat1) * Math.sin(angular) * Math.cos(brng));
    const lon2 = lon1 +
        Math.atan2(Math.sin(brng) * Math.sin(angular) * Math.cos(lat1), Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2));
    return {
        latitude: toDeg(lat2),
        longitude: ((toDeg(lon2) + 540) % 360) - 180
    };
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function wrap360(value) {
    return ((value % 360) + 360) % 360;
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
function toDeg(rad) {
    return (rad * 180) / Math.PI;
}

const start = simulatorConfig.start;
const cfg = simulatorConfig.flight;
const trailCfg = simulatorConfig.trail;
function createInitialState() {
    return {
        mode: simulatorConfig.mode,
        latitude: start.latitude,
        longitude: start.longitude,
        altitudeM: start.altitudeM,
        speedMps: start.speedMps,
        throttle: 0.55,
        headingDeg: start.headingDeg,
        pitchDeg: 0,
        rollDeg: 0,
        paused: false,
        trail: [[start.longitude, start.latitude, start.altitudeM]]
    };
}
class FlightStateService {
    constructor() {
        this.subject = new BehaviorSubject(createInitialState());
        this.flight$ = this.subject.asObservable();
    }
    get snapshot() {
        return this.subject.value;
    }
    setMode(mode) {
        this.patch({ mode });
    }
    applyExternalTelemetry(telemetry) {
        const state = this.snapshot;
        const next = {
            ...state,
            mode: "EXTERNAL",
            latitude: telemetry.latitude,
            longitude: telemetry.longitude,
            altitudeM: telemetry.altitudeM,
            headingDeg: telemetry.headingDeg,
            pitchDeg: telemetry.pitchDeg,
            rollDeg: telemetry.rollDeg,
            speedMps: typeof telemetry.speedMps === "number" ? telemetry.speedMps : state.speedMps
        };
        this.pushTrail(next);
        this.subject.next(next);
    }
    tickFlight(dtSeconds, inputs, terrainHeightM) {
        const state = this.snapshot;
        if (state.paused || state.mode === "EXTERNAL")
            return;
        const dt = Math.min(dtSeconds, 0.05);
        let speedMps = state.speedMps;
        if (inputs.accelerate)
            speedMps += cfg.throttleAccelerationMps2 * dt;
        if (inputs.brake)
            speedMps -= cfg.brakeAccelerationMps2 * dt;
        speedMps = clamp(speedMps, cfg.minSpeedMps, cfg.maxSpeedMps);
        const yawInput = (inputs.yawRight ? 1 : 0) - (inputs.yawLeft ? 1 : 0);
        const yawTrimDegPerSec = yawInput * cfg.yawTrimPowerDegPerSec;
        const speedFactor = clamp(speedMps / 145, 0.45, 1.7);
        const turnFromRollDegPerSec = Math.sin((state.rollDeg * Math.PI) / 180) * cfg.turnPowerDegPerSec * speedFactor;
        const headingDeg = wrap360(state.headingDeg + (turnFromRollDegPerSec + yawTrimDegPerSec) * dt);
        const nextPoint = movePoint(state.latitude, state.longitude, headingDeg, speedMps * dt);
        const verticalSpeedMps = Math.sin((state.pitchDeg * Math.PI) / 180) * speedMps * cfg.climbPower;
        let altitudeM = state.altitudeM + verticalSpeedMps * dt;
        altitudeM = clamp(altitudeM, terrainHeightM + cfg.minAltitudeAboveGroundM, cfg.maxAltitudeM);
        const next = {
            ...state,
            speedMps,
            throttle: (speedMps - cfg.minSpeedMps) / (cfg.maxSpeedMps - cfg.minSpeedMps),
            headingDeg,
            latitude: nextPoint.latitude,
            longitude: nextPoint.longitude,
            altitudeM
        };
        this.pushTrail(next);
        this.subject.next(next);
    }
    pitchUpStep() {
        if (this.snapshot.mode === "EXTERNAL")
            return;
        this.patchAttitude({ pitchDeg: clamp(this.snapshot.pitchDeg + cfg.pitchStepDeg, cfg.maxPitchDownDeg, cfg.maxPitchUpDeg) });
    }
    pitchDownStep() {
        if (this.snapshot.mode === "EXTERNAL")
            return;
        this.patchAttitude({ pitchDeg: clamp(this.snapshot.pitchDeg - cfg.pitchStepDeg, cfg.maxPitchDownDeg, cfg.maxPitchUpDeg) });
    }
    rollLeftStep() {
        if (this.snapshot.mode === "EXTERNAL")
            return;
        this.patchAttitude({ rollDeg: clamp(this.snapshot.rollDeg - cfg.rollStepDeg, -cfg.maxRollDeg, cfg.maxRollDeg) });
    }
    rollRightStep() {
        if (this.snapshot.mode === "EXTERNAL")
            return;
        this.patchAttitude({ rollDeg: clamp(this.snapshot.rollDeg + cfg.rollStepDeg, -cfg.maxRollDeg, cfg.maxRollDeg) });
    }
    levelAttitude() {
        if (this.snapshot.mode === "EXTERNAL")
            return;
        const state = this.snapshot;
        this.patchAttitude({
            pitchDeg: lerp(state.pitchDeg, 0, cfg.levelStepFactor),
            rollDeg: lerp(state.rollDeg, 0, cfg.levelStepFactor)
        });
    }
    resetFlight() {
        this.subject.next(createInitialState());
    }
    togglePause() {
        this.patch({ paused: !this.snapshot.paused });
    }
    patchAttitude(partial) {
        const next = { ...this.snapshot, ...partial };
        this.pushTrail(next);
        this.subject.next(next);
    }
    patch(partial) {
        this.subject.next({ ...this.snapshot, ...partial });
    }
    pushTrail(state) {
        const trail = state.trail.slice();
        const last = trail[trail.length - 1];
        const shouldPush = !last ||
            Math.abs(last[0] - state.longitude) > trailCfg.minDistanceDeg ||
            Math.abs(last[1] - state.latitude) > trailCfg.minDistanceDeg ||
            Math.abs(last[2] - state.altitudeM) > trailCfg.minAltitudeDeltaM;
        if (shouldPush) {
            trail.push([state.longitude, state.latitude, state.altitudeM]);
            if (trail.length > trailCfg.maxPoints)
                trail.shift();
        }
        state.trail = trail;
    }
}
FlightStateService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: FlightStateService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
FlightStateService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: FlightStateService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: FlightStateService, decorators: [{
            type: Injectable
        }] });

class KeyboardInputService {
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
KeyboardInputService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: KeyboardInputService, deps: [{ token: FlightStateService }], target: i0.ɵɵFactoryTarget.Injectable });
KeyboardInputService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: KeyboardInputService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: KeyboardInputService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: FlightStateService }]; } });

class CesiumSceneComponent {
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
CesiumSceneComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CesiumSceneComponent, deps: [{ token: FlightStateService }, { token: KeyboardInputService }], target: i0.ɵɵFactoryTarget.Component });
CesiumSceneComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: CesiumSceneComponent, selector: "cfs-cesium-scene", inputs: { config: "config", viewMode: "viewMode", cesiumIonToken: "cesiumIonToken" }, viewQueries: [{ propertyName: "containerRef", first: true, predicate: ["container"], descendants: true, static: true }], usesOnChanges: true, ngImport: i0, template: `<div class="cesium-container" #container></div>`, isInline: true, styles: [":host{display:block;position:absolute;inset:0;z-index:1}.cesium-container{position:absolute;inset:0}\n"] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CesiumSceneComponent, decorators: [{
            type: Component,
            args: [{ selector: "cfs-cesium-scene", template: `<div class="cesium-container" #container></div>`, styles: [":host{display:block;position:absolute;inset:0;z-index:1}.cesium-container{position:absolute;inset:0}\n"] }]
        }], ctorParameters: function () { return [{ type: FlightStateService }, { type: KeyboardInputService }]; }, propDecorators: { containerRef: [{
                type: ViewChild,
                args: ["container", { static: true }]
            }], config: [{
                type: Input
            }], viewMode: [{
                type: Input
            }], cesiumIonToken: [{
                type: Input
            }] } });

function deepMerge(base, override) {
    if (!override)
        return base;
    const result = { ...base };
    Object.entries(override).forEach(([key, value]) => {
        if (value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            typeof result[key] === "object" &&
            result[key] !== null) {
            result[key] = deepMerge(result[key], value);
        }
        else if (value !== undefined) {
            result[key] = value;
        }
    });
    return result;
}

class FlightSimulatorWidgetComponent {
    constructor(flightState, keyboardInput) {
        this.flightState = flightState;
        this.keyboardInput = keyboardInput;
        this.enableKeyboard = true;
        this.initialViewMode = "FLIGHT_CAMERA";
        this.mergedConfig = simulatorConfig;
        this.viewMode = "FLIGHT_CAMERA";
        this.flight$ = this.flightState.flight$;
        this.floatingDragActive = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.floatingLeft = 0;
        this.floatingTop = 0;
        this.floatingPositioned = false;
        this.viewMode = this.initialViewMode;
    }
    ngOnInit() {
        this.applyConfig();
    }
    ngOnChanges(changes) {
        this.applyConfig();
    }
    applyConfig() {
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
    setViewMode(mode) {
        this.viewMode = mode;
    }
    fmt(value, decimals = 0) {
        return value.toLocaleString("en-US", {
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals
        });
    }
    get shellClass() {
        const base = this.mergedConfig.window.displayMode === "embedded"
            ? "sim-root sim-root--embedded"
            : this.mergedConfig.window.displayMode === "floating"
                ? "sim-root sim-root--floating"
                : "sim-root";
        return this.className ? `${base} ${this.className}` : base;
    }
    get embeddedStyle() {
        if (this.mergedConfig.window.displayMode !== "embedded")
            return null;
        return {
            width: this.sizeToCss(this.mergedConfig.window.width),
            height: this.sizeToCss(this.mergedConfig.window.height)
        };
    }
    get floatingShellStyle() {
        const w = this.mergedConfig.window;
        const width = typeof w.width === "number" ? w.width : 960;
        const height = typeof w.height === "number" ? w.height : 640;
        const style = {
            width: `${width}px`,
            height: `${height}px`,
            zIndex: String(w.floating.zIndex)
        };
        if (this.floatingPositioned) {
            style.left = `${this.floatingLeft}px`;
            style.top = `${this.floatingTop}px`;
            style.right = "auto";
            style.bottom = "auto";
        }
        else {
            Object.assign(style, this.anchorStyle(w.floating.position, w.floating.margin));
        }
        return style;
    }
    onFloatingHeaderMouseDown(event) {
        if (!this.mergedConfig.window.floating.draggable)
            return;
        if (event.button !== 0)
            return;
        const shell = event.currentTarget.parentElement;
        if (!shell)
            return;
        const rect = shell.getBoundingClientRect();
        this.floatingDragActive = true;
        this.floatingPositioned = true;
        this.dragOffsetX = event.clientX - rect.left;
        this.dragOffsetY = event.clientY - rect.top;
        this.floatingLeft = rect.left;
        this.floatingTop = rect.top;
        event.preventDefault();
    }
    onDocumentMouseMove(event) {
        if (!this.floatingDragActive)
            return;
        const margin = this.mergedConfig.window.floating.margin;
        const width = typeof this.mergedConfig.window.width === "number" ? this.mergedConfig.window.width : 960;
        const height = typeof this.mergedConfig.window.height === "number" ? this.mergedConfig.window.height : 640;
        const maxLeft = window.innerWidth - width - margin;
        const maxTop = window.innerHeight - height - margin;
        this.floatingLeft = Math.min(Math.max(margin, event.clientX - this.dragOffsetX), maxLeft);
        this.floatingTop = Math.min(Math.max(margin, event.clientY - this.dragOffsetY), maxTop);
    }
    onDocumentMouseUp() {
        this.floatingDragActive = false;
    }
    sizeToCss(value) {
        if (value === "auto")
            return "auto";
        if (value === "100%")
            return "100%";
        return `${value}px`;
    }
    applyFloatingAnchor() {
        this.floatingPositioned = false;
    }
    anchorStyle(position, margin) {
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
FlightSimulatorWidgetComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: FlightSimulatorWidgetComponent, deps: [{ token: FlightStateService }, { token: KeyboardInputService }], target: i0.ɵɵFactoryTarget.Component });
FlightSimulatorWidgetComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: FlightSimulatorWidgetComponent, selector: "cfs-flight-simulator", inputs: { mode: "mode", externalTelemetry: "externalTelemetry", enableKeyboard: "enableKeyboard", configOverride: "configOverride", initialViewMode: "initialViewMode", cesiumIonToken: "cesiumIonToken", className: "className" }, host: { listeners: { "document:mousemove": "onDocumentMouseMove($event)", "document:mouseup": "onDocumentMouseUp()" } }, providers: [FlightStateService, KeyboardInputService], usesOnChanges: true, ngImport: i0, template: "<div *ngIf=\"mergedConfig.window.displayMode === 'floating'; else embeddedHost\" class=\"cfs-floating-root\">\n  <div\n    class=\"cfs-floating-shell\"\n    [ngStyle]=\"floatingShellStyle\"\n    role=\"dialog\"\n    [attr.aria-label]=\"mergedConfig.window.floating.title\"\n  >\n    <div\n      class=\"cfs-floating-header\"\n      [class.is-draggable]=\"mergedConfig.window.floating.draggable\"\n      (mousedown)=\"onFloatingHeaderMouseDown($event)\"\n    >\n      {{ mergedConfig.window.floating.title }}\n    </div>\n    <div class=\"sim-root sim-root--floating\" [class]=\"className\">\n      <ng-container *ngTemplateOutlet=\"simulatorContent\"></ng-container>\n    </div>\n  </div>\n</div>\n\n<ng-template #embeddedHost>\n  <div [ngClass]=\"shellClass\" [ngStyle]=\"embeddedStyle\">\n    <ng-container *ngTemplateOutlet=\"simulatorContent\"></ng-container>\n  </div>\n</ng-template>\n\n<ng-template #simulatorContent>\n  <cfs-cesium-scene\n    [config]=\"mergedConfig\"\n    [viewMode]=\"viewMode\"\n    [cesiumIonToken]=\"cesiumIonToken\"\n  ></cfs-cesium-scene>\n\n  <ng-container *ngIf=\"flight$ | async as flight\">\n    <div\n      *ngIf=\"viewMode === 'FLIGHT_CAMERA' && mergedConfig.aircraft.renderMode === 'SCREEN_OVERLAY'\"\n      class=\"screen-aircraft-layer\"\n      [ngStyle]=\"{\n        transform:\n          'translate(-50%, calc(-50% + ' +\n          (mergedConfig.aircraft.screenOffsetYPx + -flight.pitchDeg * 1.05) +\n          'px)) rotate(' +\n          -flight.rollDeg +\n          'deg)',\n        width: mergedConfig.aircraft.screenSizePx + 'px',\n        height: mergedConfig.aircraft.screenSizePx + 'px'\n      }\"\n    >\n      <svg viewBox=\"0 0 200 200\" class=\"screen-aircraft-svg\" aria-hidden=\"true\">\n        <defs>\n          <linearGradient id=\"cfsGrayBody\" x1=\"0\" x2=\"1\">\n            <stop offset=\"0%\" stop-color=\"#6b7280\" />\n            <stop offset=\"50%\" stop-color=\"#d1d5db\" />\n            <stop offset=\"100%\" stop-color=\"#6b7280\" />\n          </linearGradient>\n        </defs>\n        <path\n          d=\"M100 12 C111 42 121 72 122 104 L113 166 L100 190 L87 166 L78 104 C79 72 89 42 100 12 Z\"\n          fill=\"url(#cfsGrayBody)\"\n          stroke=\"#111827\"\n          stroke-width=\"5\"\n        />\n        <path d=\"M83 128 L43 160 L90 149 Z\" fill=\"#9ca3af\" stroke=\"#111827\" stroke-width=\"5\" />\n        <path d=\"M117 128 L157 160 L110 149 Z\" fill=\"#9ca3af\" stroke=\"#111827\" stroke-width=\"5\" />\n      </svg>\n    </div>\n\n    <div class=\"hud\">\n      <div class=\"hud-top\" *ngIf=\"mergedConfig.annotations.hudTop\">\n        <div class=\"hud-card\"><span>SPD</span><strong>{{ fmt(flight.speedMps * 3.6) }} km/h</strong></div>\n        <div class=\"hud-card\"><span>ALT</span><strong>{{ fmt(flight.altitudeM) }} m</strong></div>\n        <div class=\"hud-card\"><span>HDG</span><strong>{{ fmt(flight.headingDeg) }}\u00B0</strong></div>\n        <div class=\"hud-card\"><span>PITCH</span><strong>{{ fmt(flight.pitchDeg, 1) }}\u00B0</strong></div>\n        <div class=\"hud-card\"><span>ROLL</span><strong>{{ fmt(flight.rollDeg, 1) }}\u00B0</strong></div>\n        <div class=\"hud-card\"><span>VIEW</span><strong>{{ viewMode === 'FLIGHT_CAMERA' ? 'FLIGHT' : 'SIDE' }}</strong></div>\n      </div>\n\n      <div\n        class=\"hud-center\"\n        *ngIf=\"viewMode === 'FLIGHT_CAMERA' && (mergedConfig.annotations.crosshair || mergedConfig.annotations.attitudeIndicator)\"\n      >\n        <ng-container *ngIf=\"mergedConfig.annotations.crosshair\">\n          <div class=\"crosshair horizontal\"></div>\n          <div class=\"crosshair vertical\"></div>\n          <div class=\"center-dot\"></div>\n        </ng-container>\n        <div\n          *ngIf=\"mergedConfig.annotations.attitudeIndicator\"\n          class=\"attitude-line\"\n          [ngStyle]=\"{ transform: 'rotate(' + -flight.rollDeg + 'deg) translateY(' + -flight.pitchDeg * 1.25 + 'px)' }\"\n        ></div>\n      </div>\n\n      <div class=\"hud-bottom\" *ngIf=\"mergedConfig.annotations.bottomTelemetry\">\n        <div>LAT {{ fmt(flight.latitude, 5) }}</div>\n        <div>LNG {{ fmt(flight.longitude, 5) }}</div>\n        <div>ALT {{ fmt(flight.altitudeM) }}m</div>\n        <div>TRAIL {{ flight.trail.length }}</div>\n        <div class=\"pause-pill\" *ngIf=\"flight.paused\">PAUSED</div>\n      </div>\n    </div>\n  </ng-container>\n\n  <div class=\"view-mode-toggle\" *ngIf=\"mergedConfig.window.showViewModeToggle\">\n    <button type=\"button\" [class.active]=\"viewMode === 'FLIGHT_CAMERA'\" (click)=\"setViewMode('FLIGHT_CAMERA')\">\n      Flight camera\n    </button>\n    <button type=\"button\" [class.active]=\"viewMode === 'MAP_SIDE_CAMERA'\" (click)=\"setViewMode('MAP_SIDE_CAMERA')\">\n      Side map view\n    </button>\n  </div>\n</ng-template>\n", styles: ["*{box-sizing:border-box}html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:#020617;font-family:Inter,system-ui,Segoe UI,sans-serif}.sim-root{position:relative;width:100vw;height:100vh;overflow:hidden;background:#020617;color:#fff}.cesium-container{position:absolute;inset:0;z-index:1}.cesium-viewer-bottom,.cesium-widget-credits,.cesium-viewer-navigationContainer,.cesium-viewer-toolbar{display:none!important}.screen-aircraft-layer{pointer-events:none;position:absolute;left:50%;top:50%;z-index:8;transform-origin:center center;transition:transform 80ms linear}.screen-aircraft-svg{display:block;width:100%;height:100%;overflow:visible}.hud{pointer-events:none;position:absolute;inset:0;z-index:10;color:#dff8ff;text-shadow:0 0 12px rgba(34,211,238,.65)}.hud-top{position:absolute;top:16px;left:50%;transform:translate(-50%);display:flex;gap:10px;flex-wrap:wrap;justify-content:center;direction:ltr;max-width:1100px}.hud-card{min-width:106px;padding:10px 12px;border:1px solid rgba(103,232,249,.35);border-radius:14px;background:rgba(2,10,30,.62);backdrop-filter:blur(12px);text-align:center}.hud-card span{display:block;font-size:10px;color:#bae6fdc7;letter-spacing:.22em}.hud-card strong{display:block;margin-top:4px;font-size:17px}.hud-center{position:absolute;inset:0}.crosshair{position:absolute;left:50%;top:50%;background:rgba(125,249,255,.78);box-shadow:0 0 16px #22d3eed1;transform:translate(-50%,-50%)}.crosshair.horizontal{width:180px;height:1px}.crosshair.vertical{width:1px;height:72px}.center-dot{position:absolute;left:50%;top:50%;width:9px;height:9px;border:1px solid #bffaff;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 14px #22d3eed9}.attitude-line{position:absolute;left:calc(50% - 135px);top:calc(50% + 62px);width:270px;height:2px;background:linear-gradient(90deg,transparent,#67e8f9 18%,#67e8f9 82%,transparent);transform-origin:center;opacity:.9}.hud-bottom{position:absolute;bottom:20px;left:50%;display:flex;align-items:center;gap:16px;transform:translate(-50%);direction:ltr;padding:10px 16px;border:1px solid rgba(103,232,249,.28);border-radius:999px;background:rgba(2,10,30,.58);backdrop-filter:blur(12px);font-size:12px;color:#e0f2fee0;white-space:nowrap}.pause-pill{color:#fde68a;font-weight:800}.debug-panel{position:absolute;left:20px;bottom:84px;width:285px;padding:12px 14px;border-radius:16px;border:1px solid rgba(103,232,249,.25);background:rgba(2,8,23,.62);backdrop-filter:blur(12px);font-size:12px;line-height:1.7;color:#e0f2fee6;direction:ltr}@media (max-width: 900px){.debug-panel{display:none}.hud-top{transform:translate(-50%) scale(.82);transform-origin:top center}.hud-bottom{transform:translate(-50%) scale(.82);transform-origin:bottom center}.screen-aircraft-layer{scale:.82}}.view-mode-toggle{position:absolute;top:18px;right:18px;z-index:40;display:flex;gap:6px;padding:6px;border:1px solid rgba(148,163,184,.35);border-radius:14px;background:rgba(2,8,23,.68);backdrop-filter:blur(12px);direction:rtl}.view-mode-toggle button{pointer-events:auto;cursor:pointer;border:0;border-radius:10px;padding:9px 13px;background:transparent;color:#e2e8f0c7;font-weight:800;font-size:13px}.view-mode-toggle button.active{background:#67e8f9;color:#082f49;box-shadow:0 0 22px #67e8f96b}.unused-side-profile-root{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:72px 28px 28px;background:rgba(2,6,23,.72);backdrop-filter:blur(4px)}.side-profile-panel{width:min(1180px,96vw);border:1px solid rgba(148,163,184,.32);border-radius:22px;overflow:hidden;background:rgba(15,23,42,.88);box-shadow:0 28px 90px #00000073}.side-profile-title{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:16px 20px;color:#e0f2fe;border-bottom:1px solid rgba(148,163,184,.25)}.side-profile-title span{font-size:18px;font-weight:900}.side-profile-title small{color:#bae6fdb3;font-weight:700}.side-profile-svg{display:block;width:100%;height:min(58vh,560px)}.profile-axis-text{fill:#334155;font-size:20px;font-weight:800}.profile-label{fill:#e0f2fe;font-size:17px;font-weight:900;direction:ltr}.profile-label.small{font-size:13px;fill:#bae6fd}.side-profile-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(148,163,184,.22);direction:rtl}.side-profile-stats div{padding:14px 16px;background:rgba(2,8,23,.78);color:#e0f2fe}.side-profile-stats span{display:block;color:#bae6fda3;font-size:12px;font-weight:800}.side-profile-stats strong{display:block;margin-top:3px;font-size:18px;direction:ltr}@media (max-width: 860px){.view-mode-toggle{top:10px;right:10px;scale:.9;transform-origin:top right}.unused-side-profile-root{padding:62px 10px 10px}.side-profile-title{flex-direction:column;align-items:flex-start}.side-profile-stats{grid-template-columns:repeat(2,1fr)}}.view-mode-toggle{z-index:60}.sim-root--embedded{width:100%;height:100%;max-width:100%}.sim-root--floating{position:relative;width:100%;height:calc(100% - 42px);overflow:hidden}.cfs-floating-root{pointer-events:none}.cfs-floating-shell{position:fixed;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(103,232,249,.35);border-radius:16px;background:#020617;box-shadow:0 24px 80px #0000008c;pointer-events:auto}.cfs-floating-header{flex:0 0 auto;padding:10px 14px;border-bottom:1px solid rgba(103,232,249,.22);background:rgba(2,10,30,.92);color:#e0f2fe;font-size:13px;font-weight:700;direction:rtl;-webkit-user-select:none;user-select:none}.cfs-floating-header.is-draggable{cursor:grab}.cfs-floating-header.is-draggable:active{cursor:grabbing}\n"], dependencies: [{ kind: "directive", type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: CesiumSceneComponent, selector: "cfs-cesium-scene", inputs: ["config", "viewMode", "cesiumIonToken"] }, { kind: "pipe", type: i3.AsyncPipe, name: "async" }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: FlightSimulatorWidgetComponent, decorators: [{
            type: Component,
            args: [{ selector: "cfs-flight-simulator", encapsulation: ViewEncapsulation.None, providers: [FlightStateService, KeyboardInputService], template: "<div *ngIf=\"mergedConfig.window.displayMode === 'floating'; else embeddedHost\" class=\"cfs-floating-root\">\n  <div\n    class=\"cfs-floating-shell\"\n    [ngStyle]=\"floatingShellStyle\"\n    role=\"dialog\"\n    [attr.aria-label]=\"mergedConfig.window.floating.title\"\n  >\n    <div\n      class=\"cfs-floating-header\"\n      [class.is-draggable]=\"mergedConfig.window.floating.draggable\"\n      (mousedown)=\"onFloatingHeaderMouseDown($event)\"\n    >\n      {{ mergedConfig.window.floating.title }}\n    </div>\n    <div class=\"sim-root sim-root--floating\" [class]=\"className\">\n      <ng-container *ngTemplateOutlet=\"simulatorContent\"></ng-container>\n    </div>\n  </div>\n</div>\n\n<ng-template #embeddedHost>\n  <div [ngClass]=\"shellClass\" [ngStyle]=\"embeddedStyle\">\n    <ng-container *ngTemplateOutlet=\"simulatorContent\"></ng-container>\n  </div>\n</ng-template>\n\n<ng-template #simulatorContent>\n  <cfs-cesium-scene\n    [config]=\"mergedConfig\"\n    [viewMode]=\"viewMode\"\n    [cesiumIonToken]=\"cesiumIonToken\"\n  ></cfs-cesium-scene>\n\n  <ng-container *ngIf=\"flight$ | async as flight\">\n    <div\n      *ngIf=\"viewMode === 'FLIGHT_CAMERA' && mergedConfig.aircraft.renderMode === 'SCREEN_OVERLAY'\"\n      class=\"screen-aircraft-layer\"\n      [ngStyle]=\"{\n        transform:\n          'translate(-50%, calc(-50% + ' +\n          (mergedConfig.aircraft.screenOffsetYPx + -flight.pitchDeg * 1.05) +\n          'px)) rotate(' +\n          -flight.rollDeg +\n          'deg)',\n        width: mergedConfig.aircraft.screenSizePx + 'px',\n        height: mergedConfig.aircraft.screenSizePx + 'px'\n      }\"\n    >\n      <svg viewBox=\"0 0 200 200\" class=\"screen-aircraft-svg\" aria-hidden=\"true\">\n        <defs>\n          <linearGradient id=\"cfsGrayBody\" x1=\"0\" x2=\"1\">\n            <stop offset=\"0%\" stop-color=\"#6b7280\" />\n            <stop offset=\"50%\" stop-color=\"#d1d5db\" />\n            <stop offset=\"100%\" stop-color=\"#6b7280\" />\n          </linearGradient>\n        </defs>\n        <path\n          d=\"M100 12 C111 42 121 72 122 104 L113 166 L100 190 L87 166 L78 104 C79 72 89 42 100 12 Z\"\n          fill=\"url(#cfsGrayBody)\"\n          stroke=\"#111827\"\n          stroke-width=\"5\"\n        />\n        <path d=\"M83 128 L43 160 L90 149 Z\" fill=\"#9ca3af\" stroke=\"#111827\" stroke-width=\"5\" />\n        <path d=\"M117 128 L157 160 L110 149 Z\" fill=\"#9ca3af\" stroke=\"#111827\" stroke-width=\"5\" />\n      </svg>\n    </div>\n\n    <div class=\"hud\">\n      <div class=\"hud-top\" *ngIf=\"mergedConfig.annotations.hudTop\">\n        <div class=\"hud-card\"><span>SPD</span><strong>{{ fmt(flight.speedMps * 3.6) }} km/h</strong></div>\n        <div class=\"hud-card\"><span>ALT</span><strong>{{ fmt(flight.altitudeM) }} m</strong></div>\n        <div class=\"hud-card\"><span>HDG</span><strong>{{ fmt(flight.headingDeg) }}\u00B0</strong></div>\n        <div class=\"hud-card\"><span>PITCH</span><strong>{{ fmt(flight.pitchDeg, 1) }}\u00B0</strong></div>\n        <div class=\"hud-card\"><span>ROLL</span><strong>{{ fmt(flight.rollDeg, 1) }}\u00B0</strong></div>\n        <div class=\"hud-card\"><span>VIEW</span><strong>{{ viewMode === 'FLIGHT_CAMERA' ? 'FLIGHT' : 'SIDE' }}</strong></div>\n      </div>\n\n      <div\n        class=\"hud-center\"\n        *ngIf=\"viewMode === 'FLIGHT_CAMERA' && (mergedConfig.annotations.crosshair || mergedConfig.annotations.attitudeIndicator)\"\n      >\n        <ng-container *ngIf=\"mergedConfig.annotations.crosshair\">\n          <div class=\"crosshair horizontal\"></div>\n          <div class=\"crosshair vertical\"></div>\n          <div class=\"center-dot\"></div>\n        </ng-container>\n        <div\n          *ngIf=\"mergedConfig.annotations.attitudeIndicator\"\n          class=\"attitude-line\"\n          [ngStyle]=\"{ transform: 'rotate(' + -flight.rollDeg + 'deg) translateY(' + -flight.pitchDeg * 1.25 + 'px)' }\"\n        ></div>\n      </div>\n\n      <div class=\"hud-bottom\" *ngIf=\"mergedConfig.annotations.bottomTelemetry\">\n        <div>LAT {{ fmt(flight.latitude, 5) }}</div>\n        <div>LNG {{ fmt(flight.longitude, 5) }}</div>\n        <div>ALT {{ fmt(flight.altitudeM) }}m</div>\n        <div>TRAIL {{ flight.trail.length }}</div>\n        <div class=\"pause-pill\" *ngIf=\"flight.paused\">PAUSED</div>\n      </div>\n    </div>\n  </ng-container>\n\n  <div class=\"view-mode-toggle\" *ngIf=\"mergedConfig.window.showViewModeToggle\">\n    <button type=\"button\" [class.active]=\"viewMode === 'FLIGHT_CAMERA'\" (click)=\"setViewMode('FLIGHT_CAMERA')\">\n      Flight camera\n    </button>\n    <button type=\"button\" [class.active]=\"viewMode === 'MAP_SIDE_CAMERA'\" (click)=\"setViewMode('MAP_SIDE_CAMERA')\">\n      Side map view\n    </button>\n  </div>\n</ng-template>\n", styles: ["*{box-sizing:border-box}html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:#020617;font-family:Inter,system-ui,Segoe UI,sans-serif}.sim-root{position:relative;width:100vw;height:100vh;overflow:hidden;background:#020617;color:#fff}.cesium-container{position:absolute;inset:0;z-index:1}.cesium-viewer-bottom,.cesium-widget-credits,.cesium-viewer-navigationContainer,.cesium-viewer-toolbar{display:none!important}.screen-aircraft-layer{pointer-events:none;position:absolute;left:50%;top:50%;z-index:8;transform-origin:center center;transition:transform 80ms linear}.screen-aircraft-svg{display:block;width:100%;height:100%;overflow:visible}.hud{pointer-events:none;position:absolute;inset:0;z-index:10;color:#dff8ff;text-shadow:0 0 12px rgba(34,211,238,.65)}.hud-top{position:absolute;top:16px;left:50%;transform:translate(-50%);display:flex;gap:10px;flex-wrap:wrap;justify-content:center;direction:ltr;max-width:1100px}.hud-card{min-width:106px;padding:10px 12px;border:1px solid rgba(103,232,249,.35);border-radius:14px;background:rgba(2,10,30,.62);backdrop-filter:blur(12px);text-align:center}.hud-card span{display:block;font-size:10px;color:#bae6fdc7;letter-spacing:.22em}.hud-card strong{display:block;margin-top:4px;font-size:17px}.hud-center{position:absolute;inset:0}.crosshair{position:absolute;left:50%;top:50%;background:rgba(125,249,255,.78);box-shadow:0 0 16px #22d3eed1;transform:translate(-50%,-50%)}.crosshair.horizontal{width:180px;height:1px}.crosshair.vertical{width:1px;height:72px}.center-dot{position:absolute;left:50%;top:50%;width:9px;height:9px;border:1px solid #bffaff;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 14px #22d3eed9}.attitude-line{position:absolute;left:calc(50% - 135px);top:calc(50% + 62px);width:270px;height:2px;background:linear-gradient(90deg,transparent,#67e8f9 18%,#67e8f9 82%,transparent);transform-origin:center;opacity:.9}.hud-bottom{position:absolute;bottom:20px;left:50%;display:flex;align-items:center;gap:16px;transform:translate(-50%);direction:ltr;padding:10px 16px;border:1px solid rgba(103,232,249,.28);border-radius:999px;background:rgba(2,10,30,.58);backdrop-filter:blur(12px);font-size:12px;color:#e0f2fee0;white-space:nowrap}.pause-pill{color:#fde68a;font-weight:800}.debug-panel{position:absolute;left:20px;bottom:84px;width:285px;padding:12px 14px;border-radius:16px;border:1px solid rgba(103,232,249,.25);background:rgba(2,8,23,.62);backdrop-filter:blur(12px);font-size:12px;line-height:1.7;color:#e0f2fee6;direction:ltr}@media (max-width: 900px){.debug-panel{display:none}.hud-top{transform:translate(-50%) scale(.82);transform-origin:top center}.hud-bottom{transform:translate(-50%) scale(.82);transform-origin:bottom center}.screen-aircraft-layer{scale:.82}}.view-mode-toggle{position:absolute;top:18px;right:18px;z-index:40;display:flex;gap:6px;padding:6px;border:1px solid rgba(148,163,184,.35);border-radius:14px;background:rgba(2,8,23,.68);backdrop-filter:blur(12px);direction:rtl}.view-mode-toggle button{pointer-events:auto;cursor:pointer;border:0;border-radius:10px;padding:9px 13px;background:transparent;color:#e2e8f0c7;font-weight:800;font-size:13px}.view-mode-toggle button.active{background:#67e8f9;color:#082f49;box-shadow:0 0 22px #67e8f96b}.unused-side-profile-root{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:72px 28px 28px;background:rgba(2,6,23,.72);backdrop-filter:blur(4px)}.side-profile-panel{width:min(1180px,96vw);border:1px solid rgba(148,163,184,.32);border-radius:22px;overflow:hidden;background:rgba(15,23,42,.88);box-shadow:0 28px 90px #00000073}.side-profile-title{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:16px 20px;color:#e0f2fe;border-bottom:1px solid rgba(148,163,184,.25)}.side-profile-title span{font-size:18px;font-weight:900}.side-profile-title small{color:#bae6fdb3;font-weight:700}.side-profile-svg{display:block;width:100%;height:min(58vh,560px)}.profile-axis-text{fill:#334155;font-size:20px;font-weight:800}.profile-label{fill:#e0f2fe;font-size:17px;font-weight:900;direction:ltr}.profile-label.small{font-size:13px;fill:#bae6fd}.side-profile-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(148,163,184,.22);direction:rtl}.side-profile-stats div{padding:14px 16px;background:rgba(2,8,23,.78);color:#e0f2fe}.side-profile-stats span{display:block;color:#bae6fda3;font-size:12px;font-weight:800}.side-profile-stats strong{display:block;margin-top:3px;font-size:18px;direction:ltr}@media (max-width: 860px){.view-mode-toggle{top:10px;right:10px;scale:.9;transform-origin:top right}.unused-side-profile-root{padding:62px 10px 10px}.side-profile-title{flex-direction:column;align-items:flex-start}.side-profile-stats{grid-template-columns:repeat(2,1fr)}}.view-mode-toggle{z-index:60}.sim-root--embedded{width:100%;height:100%;max-width:100%}.sim-root--floating{position:relative;width:100%;height:calc(100% - 42px);overflow:hidden}.cfs-floating-root{pointer-events:none}.cfs-floating-shell{position:fixed;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(103,232,249,.35);border-radius:16px;background:#020617;box-shadow:0 24px 80px #0000008c;pointer-events:auto}.cfs-floating-header{flex:0 0 auto;padding:10px 14px;border-bottom:1px solid rgba(103,232,249,.22);background:rgba(2,10,30,.92);color:#e0f2fe;font-size:13px;font-weight:700;direction:rtl;-webkit-user-select:none;user-select:none}.cfs-floating-header.is-draggable{cursor:grab}.cfs-floating-header.is-draggable:active{cursor:grabbing}\n"] }]
        }], ctorParameters: function () { return [{ type: FlightStateService }, { type: KeyboardInputService }]; }, propDecorators: { mode: [{
                type: Input
            }], externalTelemetry: [{
                type: Input
            }], enableKeyboard: [{
                type: Input
            }], configOverride: [{
                type: Input
            }], initialViewMode: [{
                type: Input
            }], cesiumIonToken: [{
                type: Input
            }], className: [{
                type: Input
            }], onDocumentMouseMove: [{
                type: HostListener,
                args: ["document:mousemove", ["$event"]]
            }], onDocumentMouseUp: [{
                type: HostListener,
                args: ["document:mouseup"]
            }] } });

class CesiumFlightSimulatorModule {
}
CesiumFlightSimulatorModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CesiumFlightSimulatorModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CesiumFlightSimulatorModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.2.10", ngImport: i0, type: CesiumFlightSimulatorModule, declarations: [FlightSimulatorWidgetComponent, CesiumSceneComponent], imports: [CommonModule], exports: [FlightSimulatorWidgetComponent] });
CesiumFlightSimulatorModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CesiumFlightSimulatorModule, imports: [CommonModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CesiumFlightSimulatorModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [FlightSimulatorWidgetComponent, CesiumSceneComponent],
                    imports: [CommonModule],
                    exports: [FlightSimulatorWidgetComponent]
                }]
        }] });

/**
 * Generated bundle index. Do not edit.
 */

export { CesiumFlightSimulatorModule, FlightSimulatorWidgetComponent, deepMerge, resolveMapTileUrl, simulatorConfig };
//# sourceMappingURL=cesium-suite-cesium-flight-simulator-angular.mjs.map
