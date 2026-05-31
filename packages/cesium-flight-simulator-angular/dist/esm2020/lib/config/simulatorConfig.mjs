export const simulatorConfig = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yQ29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9jb25maWcvc2ltdWxhdG9yQ29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FBRztJQUM3QixJQUFJLEVBQUUsVUFBcUM7SUFFM0MsS0FBSyxFQUFFO1FBQ0wsUUFBUSxFQUFFLE9BQU87UUFDakIsU0FBUyxFQUFFLE9BQU87UUFDbEIsU0FBUyxFQUFFLElBQUk7UUFDZixVQUFVLEVBQUUsRUFBRTtRQUNkLFFBQVEsRUFBRSxHQUFHO0tBQ2Q7SUFFRDs7T0FFRztJQUNILE1BQU0sRUFBRTtRQUNOLDRFQUE0RTtRQUM1RSxXQUFXLEVBQUUsWUFBc0Q7UUFDbkUsS0FBSyxFQUFFLE1BQWtDO1FBQ3pDLE1BQU0sRUFBRSxNQUFrQztRQUMxQyxRQUFRLEVBQUU7WUFDUixRQUFRLEVBQUUsY0FLRTtZQUNaLFNBQVMsRUFBRSxJQUFJO1lBQ2YsS0FBSyxFQUFFLHlCQUF5QjtZQUNoQyxNQUFNLEVBQUUsRUFBRTtZQUNWLE1BQU0sRUFBRSxLQUFLO1NBQ2Q7UUFDRCxrQkFBa0IsRUFBRSxJQUFJO0tBQ3pCO0lBRUQsUUFBUSxFQUFFO1FBQ1I7O1dBRUc7UUFDSCxVQUFVLEVBQUUsTUFBcUQ7UUFDakUsUUFBUSxFQUFFLG1DQUFtQztRQUU3Qzs7V0FFRztRQUNILEtBQUssRUFBRSxFQUFFO1FBQ1QsZ0JBQWdCLEVBQUUsR0FBRztRQUNyQixZQUFZLEVBQUUsR0FBRztRQUVqQjs7Ozs7Ozs7V0FRRztRQUNILGVBQWUsRUFBRSxpQkFBaUQ7UUFFbEUscUJBQXFCLEVBQUUsQ0FBQztRQUN4QixtQkFBbUIsRUFBRSxDQUFDO1FBQ3RCLGtCQUFrQixFQUFFLENBQUM7UUFFckIsWUFBWSxFQUFFLEdBQUc7UUFDakIsZUFBZSxFQUFFLEVBQUU7UUFDbkIsT0FBTyxFQUFFLEdBQUc7UUFDWixNQUFNLEVBQUUsR0FBRztRQUNYLE9BQU8sRUFBRSxFQUFFO0tBQ1o7SUFFRCxNQUFNLEVBQUU7UUFDTixXQUFXLEVBQUUsRUFBRTtRQUNmLFdBQVcsRUFBRSxHQUFHO1FBQ2hCLHdCQUF3QixFQUFFLEVBQUU7UUFDNUIscUJBQXFCLEVBQUUsRUFBRTtRQUN6QixZQUFZLEVBQUUsR0FBRztRQUNqQixXQUFXLEVBQUUsR0FBRztRQUNoQixhQUFhLEVBQUUsRUFBRTtRQUNqQixlQUFlLEVBQUUsQ0FBQyxFQUFFO1FBQ3BCLFVBQVUsRUFBRSxFQUFFO1FBQ2QsZUFBZSxFQUFFLElBQUk7UUFDckIsa0JBQWtCLEVBQUUsRUFBRTtRQUN0QixxQkFBcUIsRUFBRSxDQUFDO1FBQ3hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLHVCQUF1QixFQUFFLEVBQUU7UUFDM0IsWUFBWSxFQUFFLEtBQUs7S0FDcEI7SUFFRCxNQUFNLEVBQUU7UUFDTixPQUFPLEVBQUUsSUFBSTtRQUViOzs7O1dBSUc7UUFDSCxJQUFJLEVBQUUsc0JBQXdEO1FBRTlELFlBQVksRUFBRSxHQUFHO1FBQ2pCLFlBQVksRUFBRSxHQUFHO1FBQ2pCLFVBQVUsRUFBRSxJQUFJO1FBRWhCLFNBQVMsRUFBRSxHQUFHO1FBQ2QsU0FBUyxFQUFFLElBQUk7UUFFZjs7O1dBR0c7UUFDSCxzQkFBc0IsRUFBRSxDQUFDO0tBQzFCO0lBRUQsR0FBRyxFQUFFO1FBQ0gsSUFBSSxFQUFFLGFBQWdFO1FBQ3RFLDBEQUEwRDtRQUMxRCxPQUFPLEVBQUUsdURBQXVEO1FBQ2hFLGFBQWEsRUFDWCwrRkFBK0Y7UUFDakcsK0JBQStCO1FBQy9CLFdBQVcsRUFBRSx1REFBdUQ7UUFDcEUsV0FBVyxFQUFFLEtBQTBCO0tBQ3hDO0lBRUQsT0FBTyxFQUFFO1FBQ1AscUJBQXFCLEVBQUUsS0FBSztLQUM3QjtJQUVELEtBQUssRUFBRTtRQUNMLGlCQUFpQixFQUFFLEtBQUs7UUFDeEIsUUFBUSxFQUFFLEtBQUs7UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLHVCQUF1QixFQUFFLEtBQUs7S0FDL0I7SUFFRCxXQUFXLEVBQUU7UUFDWCx3REFBd0Q7UUFDeEQsTUFBTSxFQUFFLElBQUk7UUFDWixTQUFTLEVBQUUsSUFBSTtRQUNmLGlCQUFpQixFQUFFLElBQUk7UUFDdkIsc0RBQXNEO1FBQ3RELGVBQWUsRUFBRSxJQUFJO1FBQ3JCLFlBQVksRUFBRSxLQUFLO1FBQ25CLDZDQUE2QztRQUM3QyxLQUFLLEVBQUUsSUFBSTtRQUNYLFVBQVUsRUFBRSxLQUFLO0tBQ2xCO0lBRUQsS0FBSyxFQUFFO1FBQ0w7OztXQUdHO1FBQ0gsS0FBSyxFQUFFLEVBQUU7UUFDVCxTQUFTLEVBQUUsSUFBSTtRQUNmLFNBQVMsRUFBRSxJQUFJO1FBQ2YsY0FBYyxFQUFFLFFBQVE7UUFDeEIsaUJBQWlCLEVBQUUsR0FBRztRQUN0QixVQUFVLEVBQUUsS0FBSztRQUNqQixjQUFjLEVBQUUsQ0FBQztLQUNsQjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3Qgc2ltdWxhdG9yQ29uZmlnID0ge1xuICBtb2RlOiBcIklOVEVSTkFMXCIgYXMgXCJJTlRFUk5BTFwiIHwgXCJFWFRFUk5BTFwiLFxuXG4gIHN0YXJ0OiB7XG4gICAgbGF0aXR1ZGU6IDMyLjA4NTMsXG4gICAgbG9uZ2l0dWRlOiAzNC43ODE4LFxuICAgIGFsdGl0dWRlTTogMTIwMCxcbiAgICBoZWFkaW5nRGVnOiAyNSxcbiAgICBzcGVlZE1wczogMTQ1XG4gIH0sXG5cbiAgLyoqXG4gICAqIExheW91dCBvZiB0aGUgc2ltdWxhdG9yIHdpZGdldCBpbiB0aGUgaG9zdCBwYWdlLlxuICAgKi9cbiAgd2luZG93OiB7XG4gICAgLyoqIGBmdWxsc2NyZWVuYCB8IGBlbWJlZGRlZGAgKGZpeGVkIGJveCkgfCBgZmxvYXRpbmdgIChkcmFnZ2FibGUgcGFuZWwpLiAqL1xuICAgIGRpc3BsYXlNb2RlOiBcImZ1bGxzY3JlZW5cIiBhcyBcImVtYmVkZGVkXCIgfCBcImZsb2F0aW5nXCIgfCBcImZ1bGxzY3JlZW5cIixcbiAgICB3aWR0aDogXCIxMDAlXCIgYXMgbnVtYmVyIHwgXCJhdXRvXCIgfCBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiIGFzIG51bWJlciB8IFwiYXV0b1wiIHwgXCIxMDAlXCIsXG4gICAgZmxvYXRpbmc6IHtcbiAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiIGFzXG4gICAgICAgIHwgXCJ0b3AtbGVmdFwiXG4gICAgICAgIHwgXCJ0b3AtcmlnaHRcIlxuICAgICAgICB8IFwiYm90dG9tLWxlZnRcIlxuICAgICAgICB8IFwiYm90dG9tLXJpZ2h0XCJcbiAgICAgICAgfCBcImNlbnRlclwiLFxuICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgdGl0bGU6IFwiQ2VzaXVtIEZsaWdodCBTaW11bGF0b3JcIixcbiAgICAgIG1hcmdpbjogMTYsXG4gICAgICB6SW5kZXg6IDEwMDAwXG4gICAgfSxcbiAgICBzaG93Vmlld01vZGVUb2dnbGU6IHRydWVcbiAgfSxcblxuICBhaXJjcmFmdDoge1xuICAgIC8qKlxuICAgICAqINeU157XldeT15wg16nXlNei15zXmdeqLCDXnteV157XqCDXnNa+R0xCINee16fXldee15kuXG4gICAgICovXG4gICAgcmVuZGVyTW9kZTogXCJHTFRGXCIgYXMgXCJTQ1JFRU5fT1ZFUkxBWVwiIHwgXCJTSU1QTEVfRU5USVRZXCIgfCBcIkdMVEZcIixcbiAgICBtb2RlbFVyaTogXCIvbW9kZWxzL3N0ZWFsdGhfZHJvbmVfcGVyZmVjdC5nbGJcIixcblxuICAgIC8qKlxuICAgICAqINeS15PXldecINee16HXpNeZ16cg15vXk9eZINec16jXkNeV16og15HXqNeV16guXG4gICAgICovXG4gICAgc2NhbGU6IDkwLFxuICAgIG1pbmltdW1QaXhlbFNpemU6IDEzMCxcbiAgICBtYXhpbXVtU2NhbGU6IDkwMCxcblxuICAgIC8qKlxuICAgICAqINeq15nXp9eV158g15fXqdeV15E6XG4gICAgICog15HXnteV15PXnCDXlNeW15QgUGl0Y2gvUm9sbCDXoNeo15DXlSDXnteV15fXnNek15nXnSDXkS1DZXNpdW0uXG4gICAgICog15zXm9efINeR16jXmdeo16og15TXnteX15PXnCDXnteX15zXmdek15Qg15HXmdeg15nXlNedINeR16rXpteV15LXlCDXkdec15HXky5cbiAgICAgKlxuICAgICAqINeU15jXmdeh15Qg16LXptee15Qg16DXqdeQ16jXqiDXoNeb15XXoNeUOlxuICAgICAqIFcvVXAgPSBwaXRjaFxuICAgICAqIEEvRCA9IHJvbGxcbiAgICAgKi9cbiAgICBvcmllbnRhdGlvbk1vZGU6IFwiU1dBUF9QSVRDSF9ST0xMXCIgYXMgXCJOT1JNQUxcIiB8IFwiU1dBUF9QSVRDSF9ST0xMXCIsXG5cbiAgICBtb2RlbEhlYWRpbmdPZmZzZXREZWc6IDAsXG4gICAgbW9kZWxQaXRjaE9mZnNldERlZzogMCxcbiAgICBtb2RlbFJvbGxPZmZzZXREZWc6IDAsXG5cbiAgICBzY3JlZW5TaXplUHg6IDE1MCxcbiAgICBzY3JlZW5PZmZzZXRZUHg6IDI4LFxuICAgIGxlbmd0aE06IDIyMCxcbiAgICB3aWR0aE06IDE1MCxcbiAgICBoZWlnaHRNOiA2MFxuICB9LFxuXG4gIGZsaWdodDoge1xuICAgIG1pblNwZWVkTXBzOiA1NSxcbiAgICBtYXhTcGVlZE1wczogMzEwLFxuICAgIHRocm90dGxlQWNjZWxlcmF0aW9uTXBzMjogNDIsXG4gICAgYnJha2VBY2NlbGVyYXRpb25NcHMyOiA1NSxcbiAgICBwaXRjaFN0ZXBEZWc6IDIuNSxcbiAgICByb2xsU3RlcERlZzogMy41LFxuICAgIG1heFBpdGNoVXBEZWc6IDM4LFxuICAgIG1heFBpdGNoRG93bkRlZzogLTQyLFxuICAgIG1heFJvbGxEZWc6IDc1LFxuICAgIGxldmVsU3RlcEZhY3RvcjogMC4zNSxcbiAgICB0dXJuUG93ZXJEZWdQZXJTZWM6IDM0LFxuICAgIHlhd1RyaW1Qb3dlckRlZ1BlclNlYzogOSxcbiAgICBjbGltYlBvd2VyOiAwLjkyLFxuICAgIG1pbkFsdGl0dWRlQWJvdmVHcm91bmRNOiAyMCxcbiAgICBtYXhBbHRpdHVkZU06IDE0MDAwXG4gIH0sXG5cbiAgY2FtZXJhOiB7XG4gICAgZW5hYmxlZDogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIE1BTlVBTF9GT1JXQVJEX0NIQVNFOlxuICAgICAqINec15Ag157Xqdeq157XqSDXkS1DZXNpdW0gbG9va0F0INep157Xkdec15HXnCDXm9eZ15XXldefLlxuICAgICAqINeR15XXoNeUINee16bXnNee15Qg15nXk9eg15nXqiDXnteQ15fXldeo15kg15TXmNeZ15wsINeV157Xodeq15vXnCDXp9eT15nXnteUINec15vXmdeV15XXnyDXlNeY15nXodeULlxuICAgICAqL1xuICAgIG1vZGU6IFwiTUFOVUFMX0ZPUldBUkRfQ0hBU0VcIiBhcyBcIk1BTlVBTF9GT1JXQVJEX0NIQVNFXCIgfCBcIlRPUFwiLFxuXG4gICAgcmFuZ2VCZWhpbmRNOiA3MDAsXG4gICAgaGVpZ2h0QWJvdmVNOiAxNzAsXG4gICAgbG9va0FoZWFkTTogMTQwMCxcblxuICAgIG1pblJhbmdlTTogMjIwLFxuICAgIG1heFJhbmdlTTogMzgwMCxcblxuICAgIC8qKlxuICAgICAqINeQ150g16TXotedINee16jXkteZ16kg15TXpNeV15osINep16DXlCDXnC0xODAuXG4gICAgICog15vXqNeS16IgMCA9INen15PXmdee15Qg15zXpNeZINeb15nXldeV158g15TXmNeZ16HXlC5cbiAgICAgKi9cbiAgICBoZWFkaW5nQ2FtZXJhT2Zmc2V0RGVnOiAwXG4gIH0sXG5cbiAgbWFwOiB7XG4gICAgbW9kZTogXCJPTkxJTkVfRVNSSVwiIGFzIFwiT05MSU5FX0VTUklcIiB8IFwiTE9DQUxfWFlaXCIgfCBcIkNVU1RPTVwiIHwgXCJOT05FXCIsXG4gICAgLyoqIFByaW1hcnkgVVJMIGZvciBMT0NBTF9YWVogLyBDVVNUT00g4oCUIGB7en0ve3h9L3t5fWAuICovXG4gICAgdGlsZVVybDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDEvdGlsZXMvc2F0ZWxsaXRlL3t6fS97eH0ve3l9LmpwZ1wiLFxuICAgIG9ubGluZUVzcmlVcmw6XG4gICAgICBcImh0dHBzOi8vc2VydmVyLmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvV29ybGRfSW1hZ2VyeS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fVwiLFxuICAgIC8qKiBAZGVwcmVjYXRlZCBVc2UgdGlsZVVybC4gKi9cbiAgICBsb2NhbFh5elVybDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDEvdGlsZXMvc2F0ZWxsaXRlL3t6fS97eH0ve3l9LmpwZ1wiLFxuICAgIHVybFRlbXBsYXRlOiBcIlhZWlwiIGFzIFwiWFlaXCIgfCBcIkVTUklfWVhcIlxuICB9LFxuXG4gIHRlcnJhaW46IHtcbiAgICB1c2VDZXNpdW1Xb3JsZFRlcnJhaW46IGZhbHNlXG4gIH0sXG5cbiAgc2NlbmU6IHtcbiAgICBzaG93U2t5QXRtb3NwaGVyZTogZmFsc2UsXG4gICAgc2hvd01vb246IGZhbHNlLFxuICAgIHNob3dTdW46IGZhbHNlLFxuICAgIGZvZ0VuYWJsZWQ6IGZhbHNlLFxuICAgIGRlcHRoVGVzdEFnYWluc3RUZXJyYWluOiBmYWxzZVxuICB9LFxuXG4gIGFubm90YXRpb25zOiB7XG4gICAgLyoqIFRvcCBzdHJpcDogc3BlZWQsIGFsdGl0dWRlLCBoZWFkaW5nLCBwaXRjaCwgcm9sbC4gKi9cbiAgICBodWRUb3A6IHRydWUsXG4gICAgY3Jvc3NoYWlyOiB0cnVlLFxuICAgIGF0dGl0dWRlSW5kaWNhdG9yOiB0cnVlLFxuICAgIC8qKiBCb3R0b20gc3RyaXA6IGxhdCwgbG5nLCBhbHRpdHVkZSwgdHJhaWwgbGVuZ3RoLiAqL1xuICAgIGJvdHRvbVRlbGVtZXRyeTogdHJ1ZSxcbiAgICBjb250cm9sc0hlbHA6IGZhbHNlLFxuICAgIC8qKiBDZXNpdW0gcG9seWxpbmUgdHJhaWwgYmVoaW5kIGFpcmNyYWZ0LiAqL1xuICAgIHRyYWlsOiB0cnVlLFxuICAgIGRlYnVnUGFuZWw6IGZhbHNlXG4gIH0sXG5cbiAgdHJhaWw6IHtcbiAgICAvKipcbiAgICAgKiDXqdeV15HXnCDXp9eVINeR15zXkdeTLlxuICAgICAqINee16nXqtee16kg15EtQ2FsbGJhY2tQcm9wZXJ0eSDXm9eT15kg16nXlNen15Ug15nXqtei15PXm9efINeq157XmdeTINeV15zXkCDXmdeZ16LXnNedLlxuICAgICAqL1xuICAgIHdpZHRoOiAxMixcbiAgICBnbG93UG93ZXI6IDAuMzgsXG4gICAgbWF4UG9pbnRzOiA5MDAwLFxuICAgIG1pbkRpc3RhbmNlRGVnOiAwLjAwMDAwMixcbiAgICBtaW5BbHRpdHVkZURlbHRhTTogMC4xLFxuICAgIHNob3dQb2ludHM6IGZhbHNlLFxuICAgIHBvaW50UGl4ZWxTaXplOiAwXG4gIH1cbn07XG4iXX0=