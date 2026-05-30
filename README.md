# Cesium Flight Simulator — Map Side Camera

הגרסה הזאת מתקנת את התצוגה לפי מה שביקשת:

## לא חלון נפרד

אין יותר תצוגת צד כ־panel מעל המפה.

במקום זה יש כפתור שמחליף את **מצלמת Cesium עצמה**:

```text
מצלמת טיסה | צד בתוך המפה
```

## מצב 1 — מצלמת טיסה

מה שהיה:
- טיסה מאחורי הטיל
- שובל קו
- מפה/תצלום אוויר

## מצב 2 — צד בתוך המפה

זה בתוך Cesium עצמו:
- המצלמה עוברת לצד המסלול
- רואים את כל הנתיב/שובל מהצד
- רואים את הטיל בתוך המפה
- רואים את הגובה והטיסה ביחס לקרקע
- אין חלון נפרד ואין גרף חיצוני

## קבצים חשובים

```text
src/components/ViewModeToggle.tsx
src/components/CesiumScene.tsx
src/types/viewMode.ts
```

## הרצה

```bash
npm install
npm run dev
```

## שימוש בפרויקט קיים

```tsx
<FlightSimulatorWidget
  mode="EXTERNAL"
  enableKeyboard={false}
  initialViewMode="MAP_SIDE_CAMERA"
  externalTelemetry={{
    latitude: 32.0853,
    longitude: 34.7818,
    altitudeM: 1200,
    speedMps: 160,
    headingDeg: 25,
    pitchDeg: 5,
    rollDeg: 10
  }}
/>
```

אפשר להתחיל במצלמת טיסה:

```tsx
initialViewMode="FLIGHT_CAMERA"
```
