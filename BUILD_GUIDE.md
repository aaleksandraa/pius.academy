# PMU Akademija - Mobile Build Guide

## Prerequisites

1. **Node.js** (v18+)
2. **Android Studio** (Ladybug ili noviji)
3. **Java JDK 17** (Android Studio ga obično instalira)
4. **Xcode** (samo za iOS, macOS required)

## Quick Start

### 1. Build Web App
```bash
cd frontend
npm install
npx vite build
```

### 2. Sync with Android
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Run App
- U Android Studio: **Run → Run 'app'**
- Ili klikni zeleni play button

## Troubleshooting

### "Offline mode" Error
Ako dobiješ error sa "offline mode":
1. File → Settings → Build, Execution, Deployment → Gradle
2. Isključi "Offline work"
3. File → Sync Project with Gradle Files

### AGP Version Mismatch
Projekat koristi AGP 8.10.0 i Gradle 8.9 za kompatibilnost.
Ako Android Studio traži upgrade, **odbij** - trenutna verzija radi.

### App Crashes on Start
1. Build → Clean Project
2. Build → Rebuild Project
3. Run again

### API Connection (Emulator)
Za emulator, API koristi `10.0.2.2` umjesto `localhost`.
Ovo je već konfigurisano u `src/lib/api.ts`.

### API Connection (Physical Device)
Za fizički uređaj:
1. Otvori `src/lib/api.ts`
2. Promijeni IP na IP adresu tvog računara
3. Rebuild: `npx vite build && npx cap sync android`

## Build APK for Release

1. Build → Generate Signed Bundle / APK
2. Odaberi APK
3. Kreiraj novi keystore ili koristi postojeći
4. Build type: release
5. APK će biti u `android/app/release/`

## iOS Build (macOS only)

```bash
npx cap sync ios
npx cap open ios
```

U Xcode:
1. Odaberi team za signing
2. Product → Run

## Push Notifications (Optional)

Push notifications su trenutno DISABLED.

Da ih omogućiš:
1. `npm install @capacitor/push-notifications`
2. Kreiraj Firebase projekat
3. Dodaj `google-services.json` u `android/app/`
4. Rebuild projekat

## Useful Commands

```bash
# Full rebuild
npx vite build && npx cap sync android

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios

# Check Capacitor status
npx cap doctor
```
