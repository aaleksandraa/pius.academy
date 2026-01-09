# PMU Akademija - Mobile App Setup Guide

## Pregled

Ovaj projekat koristi **Capacitor** za kreiranje native Android i iOS aplikacija iz postojeće Vue.js web aplikacije.

## Struktura projekta

```
frontend/
├── android/          # Native Android projekat
├── ios/              # Native iOS projekat (Xcode)
├── src/              # Vue.js source kod
├── dist/             # Build output (web assets)
├── capacitor.config.ts
└── package.json
```

## Preduvjeti

### Za Android razvoj:
- Android Studio (najnovija verzija)
- Android SDK (API 24+)
- Java JDK 17+

### Za iOS razvoj (samo na macOS):
- Xcode 15+
- CocoaPods
- Apple Developer Account (za testiranje na uređaju)

---

## 1. Inicijalni Setup

```bash
cd frontend

# Instaliraj dependencies
npm install

# Build web aplikacije
npm run build

# Sync sa native projektima
npx cap sync
```

---

## 2. Android Setup

### 2.1 Otvori Android Studio

```bash
npx cap open android
```

### 2.2 Firebase Setup (Push Notifikacije)

1. Idi na [Firebase Console](https://console.firebase.google.com/)
2. Kreiraj novi projekat ili koristi postojeći
3. Dodaj Android aplikaciju:
   - Package name: `com.pmuacademy.app`
   - App nickname: `PMU Akademija`
4. Preuzmi `google-services.json`
5. Kopiraj fajl u: `frontend/android/app/google-services.json`

### 2.3 Build APK/AAB

U Android Studio:
- **Debug APK**: Build → Build Bundle(s) / APK(s) → Build APK(s)
- **Release AAB** (za Play Store): Build → Generate Signed Bundle / APK

### 2.4 Testiranje

```bash
# Build i pokreni na uređaju/emulatoru
npx cap run android
```

---

## 3. iOS Setup (samo macOS)

### 3.1 Otvori Xcode

```bash
npx cap open ios
```

### 3.2 Pod Install

```bash
cd ios/App
pod install
cd ../..
```

### 3.3 Apple Push Notification Setup

1. Idi na [Apple Developer Portal](https://developer.apple.com/)
2. Kreiraj App ID sa Push Notifications capability
3. Kreiraj Push Notification Certificate ili Key
4. U Xcode:
   - Signing & Capabilities → + Capability → Push Notifications
   - Background Modes → Remote notifications

### 3.4 Firebase Setup za iOS

1. U Firebase Console, dodaj iOS aplikaciju:
   - Bundle ID: `com.pmuacademy.app`
2. Preuzmi `GoogleService-Info.plist`
3. Dodaj u Xcode projekat (drag & drop u App folder)

### 3.5 Build

U Xcode:
- Product → Archive (za App Store)
- Product → Run (za testiranje)

---

## 4. Push Notifikacije - Backend Setup

### 4.1 Dodaj FCM Server Key u .env

```env
FCM_SERVER_KEY=your_firebase_server_key_here
```

Server key možeš naći u:
Firebase Console → Project Settings → Cloud Messaging → Server key

### 4.2 Pokreni migraciju

```bash
cd backend
php artisan migrate
```

### 4.3 Slanje Push Notifikacija iz koda

```php
use App\Http\Controllers\Api\PushNotificationController;

// Pošalji jednom korisniku
PushNotificationController::sendToUser(
    userId: 1,
    title: 'Nova obavijest',
    body: 'Imate novu poruku',
    data: ['link' => '/feed']
);

// Pošalji svim korisnicima
PushNotificationController::sendToAll(
    title: 'Novi kurs dostupan',
    body: 'Pogledajte novi kurs PMU tehnika',
    data: ['link' => '/course'],
    exceptUserId: $adminId // opciono - izuzmi admina koji šalje
);
```

---

## 5. Development Workflow

### Brzi razvoj (Live Reload)

1. Pokreni dev server:
```bash
npm run dev
```

2. U `capacitor.config.ts`, otkomentiraj:
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:5173',
  cleartext: true,
}
```

3. Sync i pokreni:
```bash
npx cap sync
npx cap run android
```

### Production Build

```bash
# Build web + sync
npm run build:mobile

# Ili pojedinačno
npm run build:android
npm run build:ios
```

---

## 6. Korisne komande

```bash
# Sync web assets sa native projektima
npx cap sync

# Otvori Android Studio
npx cap open android

# Otvori Xcode
npx cap open ios

# Pokreni na Android uređaju
npx cap run android

# Pokreni na iOS uređaju
npx cap run ios

# Ažuriraj Capacitor plugine
npx cap update
```

---

## 7. Troubleshooting

### Android: "google-services.json not found"
- Preuzmi fajl iz Firebase Console
- Stavi ga u `android/app/google-services.json`

### iOS: Push notifications ne rade
- Provjeri da li je Push Notifications capability dodan u Xcode
- Provjeri da li je APNs key/certificate konfigurisan u Firebase

### Build fails nakon update-a
```bash
npx cap sync
# Za Android
cd android && ./gradlew clean && cd ..
# Za iOS
cd ios/App && pod install && cd ../..
```

---

## 8. App Store / Play Store Checklist

### Google Play Store:
- [ ] Signed AAB file
- [ ] App icons (sve veličine)
- [ ] Screenshots (phone + tablet)
- [ ] Privacy Policy URL
- [ ] Feature graphic (1024x500)

### Apple App Store:
- [ ] Signed IPA / Archive
- [ ] App icons (sve veličine)
- [ ] Screenshots (sve iPhone/iPad veličine)
- [ ] Privacy Policy URL
- [ ] App Store Connect metadata

---

## Kontakt

Za pitanja ili probleme, kontaktirajte development tim.
