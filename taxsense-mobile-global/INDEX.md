# TaxSense Mobile App - File Index

Quick reference for all project files and their purposes.

## 📋 Documentation (Start Here)

| File | Purpose |
|------|---------|
| `README.md` | Complete feature overview, setup, and API documentation |
| `QUICKSTART.md` | 5-minute setup guide for developers |
| `ARCHITECTURE.md` | System architecture, data flows, and design patterns |
| `DEPLOYMENT.md` | iOS/Android deployment and App Store submission guide |
| `PROJECT_STATUS.md` | Current status, what's done, what's needed |
| `INDEX.md` | This file - quick reference |

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, and project metadata |
| `app.json` | Expo configuration (name, icon, permissions, etc.) |
| `tsconfig.json` | TypeScript compilation settings |
| `jest.config.js` | Jest testing configuration |
| `jest.setup.js` | Jest setup and mocks |
| `.babelrc` | Babel transpilation configuration |
| `.eslintrc.json` | ESLint code quality rules |
| `.prettierrc` | Prettier code formatting |
| `eas.json` | EAS Build configuration for iOS/Android |
| `.gitignore` | Git ignore rules |
| `.env.example` | Environment variables template |

## 🎯 Core App

| File | Purpose |
|------|---------|
| `index.js` | App entry point for Expo |
| `src/App.tsx` | Root component with auth logic |

## 🧭 Navigation

| File | Purpose |
|------|---------|
| `src/navigation/types.ts` | Type-safe navigation type definitions |
| `src/navigation/index.tsx` | Root navigator with tab navigation |
| `src/navigation/AuthNavigator.tsx` | Authentication flow navigator |
| `src/navigation/stacks/HomeStack.tsx` | Home/Dashboard navigation |
| `src/navigation/stacks/TaxStack.tsx` | Tax computation navigation |
| `src/navigation/stacks/DocumentsStack.tsx` | Documents navigation |
| `src/navigation/stacks/ComplianceStack.tsx` | Compliance navigation |
| `src/navigation/stacks/ReportsStack.tsx` | Reports navigation |
| `src/navigation/stacks/AdvisorStack.tsx` | Advisor connection navigation |
| `src/navigation/stacks/SettingsStack.tsx` | Settings navigation |

## 🎨 Screens - Authentication

| File | Purpose |
|------|---------|
| `src/screens/auth/SplashScreen.tsx` | App splash screen on launch |
| `src/screens/auth/LoginScreen.tsx` | Email/password login |
| `src/screens/auth/SignupScreen.tsx` | User registration |
| `src/screens/auth/OTPVerificationScreen.tsx` | OTP verification for phone |
| `src/screens/auth/ForgotPasswordScreen.tsx` | Password reset request |
| `src/screens/auth/ResetPasswordScreen.tsx` | Create new password |
| `src/screens/auth/BiometricSetupScreen.tsx` | Setup Face ID/Fingerprint |
| `src/screens/auth/ProfileCreationScreen.tsx` | Complete user profile |
| `src/screens/auth/CountrySelectionScreen.tsx` | Select tax jurisdiction |

## 🎨 Screens - Home

| File | Purpose |
|------|---------|
| `src/screens/home/DashboardScreen.tsx` | Main dashboard with summary |
| `src/screens/home/QuickActionsScreen.tsx` | Quick action buttons |
| `src/screens/home/NotificationsScreen.tsx` | User notifications list |

## 🎨 Screens - Placeholder Directories

The following directories contain placeholder files (stubs):

```
src/screens/
├── tax/              # Tax computation screens (TODO)
├── documents/        # Document management screens (TODO)
├── compliance/       # Compliance tracking screens (TODO)
├── reports/          # Report generation screens (TODO)
├── advisor/          # Advisor connection screens (TODO)
└── settings/         # User settings screens (TODO)
```

## 🔧 State Management (Zustand)

| File | Purpose |
|------|---------|
| `src/store/authStore.ts` | User authentication and profile state |
| `src/store/taxStore.ts` | Tax calculations and scenarios state |
| `src/store/documentStore.ts` | Document management state |
| `src/store/uiStore.ts` | UI state (theme, language, notifications) |

## 🌐 API & Services

### API Client
| File | Purpose |
|------|---------|
| `src/api/client.ts` | Centralized Axios client with interceptors |

### Services
| File | Purpose |
|------|---------|
| `src/services/authService.ts` | Authentication API endpoints |
| `src/services/taxService.ts` | Tax computation API endpoints |
| `src/services/documentService.ts` | Document management API endpoints |

## 🔧 Custom Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useAuth.ts` | Authentication hook with biometric support |
| `src/hooks/useTax.ts` | Tax calculations hook |

## 🛠️ Utilities

| File | Purpose |
|------|---------|
| `src/utils/security.ts` | Biometric auth, encryption, secure storage |
| `src/utils/validation.ts` | Form validation and sanitization |
| `src/utils/formatting.ts` | Data formatting (currency, date, etc.) |

## 📝 Type Definitions & Constants

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript type definitions for entire app |
| `src/constants/index.ts` | All constants, validation rules, configurations |

## 📦 Components Directory (TODO)

Placeholder directory for reusable UI components:
```
src/components/
├── buttons/
├── inputs/
├── cards/
├── modals/
├── lists/
└── common/
```

## 📱 Quick Command Reference

```bash
# Setup
npm install
cp .env.example .env

# Development
npm start                # Start dev server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run web             # Run in web browser

# Quality
npm test                # Run tests
npm run lint            # Check code
npm run typecheck       # TypeScript check

# Building
eas build --platform ios --profile development
eas build --platform android --profile development

# Deployment
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --latest
eas submit --platform android --latest
```

## 🎯 Key Concepts

### State Management
- All global state in Zustand stores
- Auto-persist with AsyncStorage
- Sensitive data encrypted

### API Communication
- Centralized Axios client in `src/api/client.ts`
- Automatic token injection
- Token refresh on 401
- Error handling and retry logic

### Custom Hooks
- `useAuth` - Authentication and biometric login
- `useTax` - Tax calculations and scenarios
- Access stores without importing directly

### Navigation
- Type-safe with TypeScript
- Deep linking support
- Stack navigators for each feature
- Bottom tab navigation for main sections

### Offline Support
- LocalStorage for app state
- Encrypted storage for tokens
- Offline queue for pending actions
- Auto-sync when online

## 🚀 Getting Started

1. **Read** `QUICKSTART.md` (5 minutes)
2. **Install** dependencies: `npm install`
3. **Setup** `.env` file: `cp .env.example .env`
4. **Start** dev server: `npm start`
5. **Read** `ARCHITECTURE.md` for system design
6. **Review** screen structure and start building

## 🔗 Related Documentation

- **Architecture**: `ARCHITECTURE.md` - System design, data flows
- **Deployment**: `DEPLOYMENT.md` - iOS/Android submission
- **Status**: `PROJECT_STATUS.md` - What's done, what's needed
- **Full README**: `README.md` - Features, setup, API docs

## 💡 Tips

1. TypeScript is strict - no `any` types
2. Use custom hooks to access stores
3. All services in `src/services/` use centralized API client
4. Styles use NativeWind (Tailwind for React Native)
5. Tests in `__tests__` directories alongside code
6. Screenshots and icons in `assets/` directory

## 📞 Support

- Check documentation first
- Review similar existing screens for patterns
- Use TypeScript for type safety
- Run tests before committing
- Follow ESLint/Prettier rules

---

**Last Updated**: 2026-09-28
**Framework**: React Native 0.73+ with Expo 50+
**Language**: TypeScript 5.2+
