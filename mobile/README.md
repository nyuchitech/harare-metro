# Mukoko News Mobile App

React Native + Expo mobile application for Mukoko News platform.

## 🎨 Design System

Built with **React Native Paper** and custom Material Design theme using:

- **Primary**: Mukoko News Green (#729b63)
- **Accent**: Zimbabwe Yellow (#ffcc00)
- **Error**: Zimbabwe Red (#e03c31)
- **Success**: Zimbabwe Green (#00843d)
- **Roundness**: 16px (vibrant mobile feel)
- **Typography**: Noto Sans (body), Noto Serif (headings)

## 🏗️ Architecture

```
mobile/
├── App.js                 # Root component with Paper theme
├── theme.js               # Custom Material Design theme
├── api/
│   └── client.js          # Backend API client
├── screens/
│   ├── HomeScreen.js      # News feed
│   ├── NewsBytesScreen.js # TikTok-style short news
│   ├── AuthScreen.js      # Login/Register
│   └── ProfileScreen.js   # User profile
└── components/
    ├── ArticleCard.js     # Article preview card
    ├── CategoryChips.js   # Category filters
    └── ZimbabweFlagStrip.js # Brand element
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (installed via npm)
- **For iOS**: macOS with Xcode and iOS Simulator
- **For Android**: Android Studio with Android Emulator
- **Expo Go app** (for testing on physical devices)

### Installation

```bash
# From root directory
npm run mobile:install

# Or from mobile directory
cd mobile
npm install --legacy-peer-deps
```

### Running the App

**Option 1: Physical Device (Easiest)**
```bash
# Start Expo dev server
npm start

# Scan QR code with:
# - iOS: Camera app → Opens in Expo Go
# - Android: Expo Go app → Scan QR
```

**Option 2: iOS Simulator (macOS only)**
```bash
npm run ios

# Or from root:
npm run mobile:ios
```

**Option 3: Android Emulator**
```bash
npm run android

# Or from root:
npm run mobile:android
```

**Note on Web Support:**
This is a React Native app optimized for mobile (iOS/Android). Web support via Expo Web is limited and not recommended for production. For web, use the main React Router web app at the repository root.

### Troubleshooting

**Metro bundler errors:**
1. Clear cache: `npx expo start --clear`
2. Delete node_modules: `rm -rf node_modules && npm install --legacy-peer-deps`
3. Reset Metro: `npx expo start --reset-cache`

**iOS Simulator not opening:**
1. Ensure Xcode is installed
2. Open Xcode → Preferences → Locations → Command Line Tools is set
3. Run: `sudo xcode-select --switch /Applications/Xcode.app`

**Android Emulator issues:**
1. Ensure Android Studio is installed
2. Create an AVD (Android Virtual Device) in Android Studio
3. Start the emulator before running `npm run android`

## 🔗 Backend Connection

The app connects to the Cloudflare Worker backend:

- **Development**: http://localhost:8787
- **Production**: https://www.hararemetro.co.zw

API client automatically detects environment using `__DEV__` flag.

## 📱 Features

### Phase 1 (Current)
- [x] News feed with infinite scroll
- [x] Category filtering
- [x] Search functionality
- [x] Article cards with images
- [x] Pull-to-refresh
- [x] Zimbabwe flag branding

### Phase 2 (Planned)
- [ ] NewsBytes (TikTok-style)
- [ ] User authentication
- [ ] Bookmarks and likes
- [ ] Push notifications
- [ ] Offline reading
- [ ] Dark mode

### Phase 3 (Future)
- [ ] Analytics dashboard
- [ ] Insights AI chat (Deepseek)
- [ ] User profiles
- [ ] Comments and engagement
- [ ] Share functionality

## 🎯 Design Philosophy

Follows the **Nyuchi Brand System v5.0** with:

1. **Mobile-First**: TikTok-like experience for Gen Z users
2. **Zimbabwe Pride**: Flag colors throughout the UI
3. **Material Design**: Consistent with other Mukoko apps (Lingo, Travel)
4. **Typography Hierarchy**: Noto Serif for headings (brand elegance), Noto Sans for body (readability)
5. **Vibrant Roundness**: 16px for modern, friendly feel

## 🛠️ Development

### API Client Usage

```javascript
import { articles, auth, categories } from './api/client';

// Load articles
const { data, error } = await articles.getFeed({
  limit: 20,
  offset: 0,
  category: 'politics'
});

// Sign in
const { data: session } = await auth.signIn(email, password);

// Get categories
const { data: cats } = await categories.getAll();
```

### Theme Usage

```javascript
import mukokoTheme from './theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: mukokoTheme.colors.background,
    padding: mukokoTheme.spacing.md,
    borderRadius: mukokoTheme.roundness,
  },
  title: {
    fontFamily: mukokoTheme.fonts.serif.fontFamily,
    color: mukokoTheme.colors.primary,
  },
});
```

## 📦 Dependencies

Core packages:

- `expo` - React Native development platform
- `react-native-paper` - Material Design components
- `react-native-safe-area-context` - Safe area handling
- `react-native-vector-icons` - Icon library

## 🔍 Troubleshooting

### Backend Connection Issues

If you can't connect to the backend:

1. Check that the dev server is running: `npm run dev` (in root directory)
2. Update API_BASE_URL in `api/client.js` to your local IP (not localhost)
3. Ensure CORS is configured correctly in backend

### Theme Not Loading

If custom theme isn't applying:

1. Ensure `PaperProvider` wraps your app in `App.js`
2. Check that `paperTheme` is imported from `./theme`
3. Verify font family names match installed fonts

## 📄 License

Part of the Mukoko News platform by Nyuchi.
