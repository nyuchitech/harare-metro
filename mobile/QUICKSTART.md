# Mukoko News Mobile - Quick Start Guide

## ✅ What's Been Built

The Mukoko News React Native mobile app is now ready with:

### 📱 Core Features
- **Home Screen** - News feed with category filtering, search, pull-to-refresh
- **NewsBytes** - TikTok-style vertical scrolling news (full-screen)
- **Auth Screen** - Login/Register with email/password
- **Custom Theme** - Zimbabwe flag colors + Material Design 3
- **API Client** - Full REST client connecting to backend

### 🎨 Design System
- **Primary Color**: Mukoko News Green (#729b63)
- **Accent Color**: Zimbabwe Yellow (#ffcc00)
- **Error Color**: Zimbabwe Red (#e03c31)
- **Typography**: Noto Sans (body) + Noto Serif (headings)
- **Roundness**: 16px for vibrant feel
- **Branding**: Zimbabwe flag strip on all screens

## 🚀 How to Run

### Option 1: Physical Device (Recommended)

**1. Install Expo Go on your phone:**
- iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

**2. Start the dev server:**
```bash
# From root directory
npm run mobile

# Or from mobile directory
cd mobile
npm start
```

**3. Scan the QR code:**
- **iOS**: Open Camera app → Point at QR code → Tap notification
- **Android**: Open Expo Go app → Tap "Scan QR Code"

**4. The app will load on your device!**

### Option 2: iOS Simulator (macOS only)

**Prerequisites:**
- Xcode installed
- iOS Simulator set up

**Run:**
```bash
npm run mobile:ios
```

### Option 3: Android Emulator

**Prerequisites:**
- Android Studio installed
- Android Virtual Device (AVD) created

**Run:**
```bash
npm run mobile:android
```

## 🛠️ Development Workflow

### Making Changes

1. **Edit any file** in `mobile/screens/` or `mobile/components/`
2. **Save** - Changes will hot reload automatically
3. **Shake device** (physical) or **Cmd+D** (simulator) for dev menu

### Key Files

```
mobile/
├── App.js              # Root app with theme provider
├── theme.js            # Custom Mukoko theme
├── api/client.js       # Backend API client
├── screens/
│   ├── HomeScreen.js       # News feed
│   ├── NewsBytesScreen.js  # TikTok-style bytes
│   └── AuthScreen.js       # Login/Register
```

### Connecting to Backend

The app is configured to connect to:
- **Development**: `http://localhost:8787` (local backend)
- **Production**: `https://www.hararemetro.co.zw`

**To test with local backend:**
1. Start backend: `npm run dev` (from root)
2. Update `mobile/api/client.js` line 7 with your local IP:
   ```javascript
   const API_BASE_URL = __DEV__
     ? 'http://192.168.1.X:8787'  // Replace X with your IP
     : 'https://www.hararemetro.co.zw';
   ```
3. Restart Expo: `npm start -- --clear`

**Why not localhost?**
Mobile devices/emulators can't access `localhost` on your computer. You need to use your local network IP address.

## 🐛 Troubleshooting

### Metro Bundler Won't Start

```bash
# Clear cache
npm start -- --clear

# Or reset completely
rm -rf node_modules
npm install --legacy-peer-deps
npm start -- --clear
```

### App Won't Load on Device

1. **Check same WiFi**: Phone and computer must be on same network
2. **Check firewall**: Allow port 8081/8082 through firewall
3. **Use tunnel**: `npm start -- --tunnel` (slower but works everywhere)

### iOS Simulator Issues

```bash
# Reset simulator
xcrun simctl erase all

# Check Xcode command line tools
sudo xcode-select --switch /Applications/Xcode.app
```

### Android Emulator Issues

1. Open Android Studio
2. AVD Manager → Create new virtual device
3. Start emulator BEFORE running `npm run android`

### "Unable to resolve module" Errors

```bash
# Clear watchman cache
watchman watch-del-all

# Clear Metro cache
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps
```

## 📊 Next Steps

Once the app is running, you can:

1. **Test the news feed** - Pull to refresh, filter by category
2. **Try NewsBytes** - Swipe vertically like TikTok
3. **Test auth flow** - Register → Login → View profile
4. **Customize theme** - Edit `mobile/theme.js`
5. **Add navigation** - Install React Navigation for multi-screen navigation
6. **Build features** - Comments, bookmarks, push notifications

## 🔗 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Native](https://reactnative.dev/docs/getting-started)
- [Mukoko News Backend API](../backend/README.md)

## 📱 Screenshots

To take screenshots for the app store:
```bash
# iOS Simulator
Cmd+S

# Android Emulator
Ctrl+S (Windows/Linux) or Cmd+S (macOS)

# Physical Device
Device screenshot button (varies by device)
```

## 🚢 Deployment

### Building for App Stores

**iOS (TestFlight/App Store):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios
```

**Android (Google Play):**
```bash
# Build for Android
eas build --platform android
```

**Submit to stores:**
```bash
eas submit --platform ios
eas submit --platform android
```

---

**Need Help?**
Check the main [mobile/README.md](README.md) for more detailed documentation.
