# TaxSense Mobile App - Quick Start Guide

Get up and running with TaxSense Mobile App in 5 minutes!

## Prerequisites

- Node.js 16+ ([Download](https://nodejs.org/))
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (Mac only)
- For Android: Android Studio + Emulator

## Installation

### 1. Clone and Install

```bash
cd taxsense-mobile-global
npm install
# or
yarn install
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# (defaults work for development)
nano .env
```

### 3. Start Development Server

```bash
npm start
# or
yarn start
```

This will show you a QR code in the terminal.

## Running the App

### iOS (on Mac)

**Option 1: Simulator**
```bash
npm run ios
```

**Option 2: iPhone (physical)**
- Install Expo Go from App Store
- Scan QR code from terminal
- App will load on your device

### Android

**Option 1: Emulator**
```bash
npm run android
```

**Option 2: Phone (physical)**
- Install Expo Go from Google Play
- Scan QR code from terminal
- App will load on your device

### Web (for development only)

```bash
npm run web
```

Opens at `http://localhost:19006`

## Project Structure Quick Tour

```
src/
├── screens/          # UI screens for each feature
├── components/       # Reusable UI components
├── store/            # State management (Zustand)
├── services/         # API communication
├── utils/            # Helper functions
└── App.tsx           # Root component
```

## Common Tasks

### Run Tests

```bash
npm test              # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Code Quality

```bash
npm run lint          # Check code
npm run lint:fix      # Auto-fix issues
npm run typecheck     # TypeScript check
```

### Build for Deployment

```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

## Authentication

### Test Credentials

- Email: `test@example.com`
- Password: `Test123!@#`

### Biometric Testing

- iOS Simulator: Cmd + Shift + H (for face ID)
- Android Emulator: Command menu → Finger Print

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Restart
npm start
```

### Dependencies Issue

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Expo Issues

```bash
# Clear Expo cache
expo client:select --clear

# Clear local cache
rm -rf .expo

# Restart
npm start
```

### iOS Build Issues

```bash
# Clear derived data (Xcode)
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Rebuild
npm run ios
```

### Android Build Issues

```bash
# Clear gradle cache
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

Edit screens, components, and services as needed

### 3. Test Locally

```bash
npm test
npm run lint
npm start
```

### 4. Commit Changes

```bash
git add .
git commit -m "Add my feature"
```

### 5. Push and Create PR

```bash
git push origin feature/my-feature
# Create PR on GitHub
```

## Key Files to Know

- `App.tsx` - Root component and navigation setup
- `package.json` - Dependencies and scripts
- `app.json` - Expo configuration
- `.env` - Environment variables
- `src/store/` - Global state management
- `src/screens/` - Page components

## API Documentation

For API endpoints and authentication, see:
- `ARCHITECTURE.md` - System architecture
- `README.md` - Full documentation
- `src/services/` - Service implementations

## Performance Tips

1. **Use lazy loading**:
   ```tsx
   const Screen = React.lazy(() => import('./Screen'));
   ```

2. **Optimize lists**:
   ```tsx
   <FlatList
     data={items}
     renderItem={renderItem}
     keyExtractor={(item) => item.id}
     initialNumToRender={10}
     maxToRenderPerBatch={10}
   />
   ```

3. **Memoize components**:
   ```tsx
   export const MyComponent = React.memo(({ data }) => ...)
   ```

## Debugging

### React DevTools

```bash
npm install -g react-devtools
react-devtools
```

### Redux DevTools

Check Redux state and actions (if using Redux)

### Network Debugging

```bash
# iOS Safari
Safari → Develop → [Your Device] → [App Name]

# Android Chrome
chrome://inspect/
```

## Next Steps

1. **Read Documentation**:
   - `README.md` - Full feature overview
   - `ARCHITECTURE.md` - System design
   - `DEPLOYMENT.md` - Deployment guide

2. **Explore Code**:
   - Check `src/screens/auth/LoginScreen.tsx` for example screen
   - Review `src/store/authStore.ts` for state management
   - Look at `src/services/authService.ts` for API integration

3. **Start Building**:
   - Create a new screen in `src/screens/`
   - Add a service in `src/services/`
   - Update navigation in `src/navigation/`

## Tips & Tricks

### Hot Reload

Press `r` in terminal to reload app
Press `m` to toggle menu
Press `w` to reload web

### Show/Hide Errors

Press `e` to show error in fullscreen
Press `j` to show/hide errors

### Keyboard Shortcuts in Simulator

- `Cmd + D` (iOS) / `Ctrl + M` (Android) - Open Expo menu
- `Cmd + R` (iOS) / `R R` (Android) - Reload app
- `Cmd + Shift + H` (iOS) - Simulate Face ID

## Getting Help

- Check `ARCHITECTURE.md` for system design questions
- Review `README.md` for feature documentation
- Check code comments for implementation details
- Ask on GitHub discussions

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

Happy coding! 🚀
