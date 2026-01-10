# Converting Here2Home (PWA) into iOS + Android Apps (Capacitor)
Last updated: 2026-01-01

This guide describes the recommended approach to convert your existing HTML/CSS/JS PWA into native apps for iOS and Android using **Capacitor**. It preserves one shared codebase and produces real Xcode/Android Studio projects suitable for App Store / Play Store.

---

## 0) Why Capacitor (recommended)
Capacitor wraps your existing web app inside a native shell, giving you:
- iOS (Xcode project) + Android (Android Studio project)
- Access to native plugins (location, storage, etc.)
- Offline support (your existing caching still works)
- One codebase (no rewrite into React Native/Flutter)

---

## 1) Pre‑refactor checklist (web app hygiene)
Before adding Capacitor, make the web app predictable:
1. Ensure your web app runs from HTTPS and from a local server (not `file://`).
2. Keep paths **relative** (use `./...` and avoid absolute `/...` paths).
3. Put assets in a clear folder (e.g. `assets/` or `icons/`).
4. Ensure offline cache logic is correct (service worker / localStorage cache).
5. Ensure you can build/copy the web app into a single folder (recommended: `dist/`).

Recommended structure:

- dist/
  - index.html
  - styles.css
  - app.js
  - manifest.webmanifest (optional once native)
  - service-worker.js (optional once native)
  - icons/
  - assets/

You can keep your existing files at repo root during prototyping, but for Capacitor you will point to a build/output directory like `dist/`.

---

## 2) Create a local build/output folder
If your app is static (plain HTML/JS), the simplest is to copy the files into `dist/`:

- Create `dist/`
- Copy: `index.html`, `styles.css`, `app.js`, images/icons into `dist/`

Later, you can automate this with a script, but manual copying is fine for first build.

---

## 3) Install Node.js (once)
Capacitor uses Node tooling.

Verify:
```bash
node -v
npm -v
```

If missing, install Node.js LTS from nodejs.org.

---

## 4) Initialize Capacitor in your project
From the repo root:

```bash
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init Here2Home com.tonyfitzs.here2home
```

When prompted for the web directory, enter:
```
dist
```

This creates `capacitor.config.*`

---

## 5) Add iOS and Android platforms

### Android
```bash
npm install @capacitor/android
npx cap add android
```

### iOS
```bash
npm install @capacitor/ios
npx cap add ios
```

Note: iOS requires macOS + Xcode.

---

## 6) Sync your web build into native projects
Whenever you change HTML/CSS/JS:

1) Ensure `dist/` contains the latest files
2) Run:

```bash
npx cap copy
```

(You can also use `npx cap sync` which copies and updates plugins.)

---

## 7) Open and run the native apps

### Android (Windows/Mac)
```bash
npx cap open android
```
This opens Android Studio.
- Run on an emulator or plugged-in device.

### iOS (Mac only)
```bash
npx cap open ios
```
This opens Xcode.
- Run on a simulator or plugged-in iPhone.

---

## 8) Native features (optional, later)
You can keep browser APIs, but native plugins are more reliable.

Common plugins:

### Geolocation
```bash
npm install @capacitor/geolocation
npx cap sync
```

### Storage (more robust than localStorage)
```bash
npm install @capacitor/preferences
npx cap sync
```

---

## 9) PWA vs Native updates
- PWAs update automatically.
- Native apps update only when you publish new versions to the stores.

Plan:
- Keep your web code as the source of truth.
- When ready, run `npx cap copy`, then build and submit new store versions.

---

## 10) App Store / Play Store prerequisites (high level)

### Apple App Store
- Apple Developer Program ($99/year)
- App icons, screenshots, privacy declarations
- Strong justification for “native shell”: offline use + travel + location is valid

### Google Play Store
- One-time developer registration fee
- Icons, screenshots, privacy form

---

## 11) Practical workflow summary
Daily dev:
1. Edit web code
2. Update `dist/` (copy or build)
3. `npx cap copy`
4. Run in simulator/device via Xcode/Android Studio

Release:
1. Bump version in native projects
2. Build signed binaries
3. Submit to App Store / Play Store

---

## 12) Notes about service workers
In a native wrapper:
- You usually do NOT need a service worker for offline caching.
- Local file bundling already provides offline assets.
- You WILL still need offline rates caching (localStorage / preferences / SQLite).

Keep your service worker during PWA prototyping; decide later whether to keep it in native.

---

## 13) Next info needed to tailor this guide
To tailor exact commands and config, decide:
1) Your development OS (Windows or Mac)
2) Whether you want a build step (Vite/React/etc.) or static `dist/`
3) Whether you need geolocation in native builds
