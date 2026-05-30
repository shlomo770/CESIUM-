# Cesium Flight Simulator — AIM-120D Fixed Orientation + Reliable Trail

זו גרסה מתוקנת לשתי הבעיות האחרונות:

## 1. השובל לא נראה

תוקן כך:
- השובל משתמש עכשיו ב־`CallbackProperty`.
- זה אומר שהקו מתעדכן תמיד מתוך `trailPositionsRef`.
- השובל הוא קו בלבד.
- הקו עבה יותר: `width: 12`.
- צבע Cyan חזק.
- `depthFailMaterial` מוגדר כדי שלא ייעלם מאחורי terrain.

## 2. Pitch/Roll היו הפוכים במודל

תוקן בקונפיג:

```ts
aircraft: {
  orientationMode: "SWAP_PITCH_ROLL"
}
```

כלומר:
- פיזיקת הטיסה נשארת נכונה.
- רק התצוגה של המודל מתקנת את החלפת הצירים.
- חץ למעלה / W אמור להזיז את האף למעלה/למטה.
- חץ ימינה/שמאלה אמור לעשות Roll.

## 3. מצלמה אמיתית קדימה

המצלמה כבר לא משתמשת ב־Cesium `lookAt` הרגיל.
במקום זה יש מצלמה ידנית:

```ts
mode: "MANUAL_FORWARD_CHASE"
```

היא:
- ממוקמת מאחורי הטיל.
- מסתכלת קדימה לכיוון הטיסה.
- לא אמורה להרגיש כמו רוורס.

## הרצה

```bash
npm install
npm run dev
```

## קונפיג מרכזי

```text
src/config/simulatorConfig.ts
```

### אם המודל עדיין לא נכון

נסה לשנות:

```ts
orientationMode: "NORMAL"
```

או להשאיר:

```ts
orientationMode: "SWAP_PITCH_ROLL"
```

### אם הכיוון עדיין הפוך קדימה/אחורה

```ts
modelHeadingOffsetDeg: 180
```

### אם המפה מרגישה הפוכה

```ts
headingCameraOffsetDeg: 180
```

## שילוב בפרויקט קיים

```tsx
<FlightSimulatorWidget
  mode="EXTERNAL"
  enableKeyboard={false}
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
