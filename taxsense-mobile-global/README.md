# TaxSense Global Mobile App

A professional, enterprise-grade React Native mobile application for tax management and compliance. Built with React Native, Expo, and TypeScript for iOS and Android platforms with a single codebase.

## Features

### ✅ Core Features
- **Biometric Authentication** - Face ID, Fingerprint, Iris authentication
- **Offline-First Architecture** - Full functionality without internet connection
- **Document Scanning** - Camera integration with OCR processing
- **Real-time Notifications** - Push notifications for deadlines and alerts
- **Tax Computation** - Multi-step tax calculation with regime comparison
- **Tax Planning** - What-if scenarios, deduction maximizer, quarterly calculator
- **Compliance Tracking** - Deadline management, audit risk scoring
- **Advisor Connection** - Find and connect with tax professionals
- **Reports** - Exportable tax reports (PDF, CSV, email)
- **Dark Mode** - Full dark theme support
- **Multi-Language** - Support for 10+ languages
- **Accessibility** - WCAG 2.1 AA compliance

### 🔒 Security Features
- Biometric + PIN protection
- Encrypted local storage
- SSL pinning
- Jailbreak/rooting detection
- Secure session management
- Auto-logout (15 min inactive)

### ⚡ Performance
- Target: <5MB app size
- Code splitting by screen
- Image optimization
- Lazy loading
- Memory management
- Battery optimization

## Project Structure

```
taxsense-mobile-global/
├── src/
│   ├── screens/              # Screen components
│   │   ├── auth/            # Authentication screens
│   │   ├── home/            # Home/Dashboard screens
│   │   ├── tax/             # Tax computation screens
│   │   ├── documents/       # Document management screens
│   │   ├── compliance/      # Compliance tracking screens
│   │   ├── reports/         # Reports screens
│   │   ├── advisor/         # Advisor connection screens
│   │   └── settings/        # Settings screens
│   ├── components/          # Reusable UI components
│   ├── navigation/          # Navigation configuration
│   │   ├── types.ts         # Navigation type definitions
│   │   ├── AuthNavigator.tsx
│   │   ├── index.tsx        # Root navigator
│   │   └── stacks/          # Stack navigators for each section
│   ├── store/               # Zustand state management
│   │   ├── authStore.ts     # Authentication state
│   │   ├── taxStore.ts      # Tax calculations state
│   │   ├── documentStore.ts # Documents state
│   │   └── uiStore.ts       # UI state (theme, language, etc.)
│   ├── api/                 # API client and configuration
│   │   └── client.ts        # Axios instance with interceptors
│   ├── services/            # API service modules
│   │   ├── authService.ts
│   │   ├── taxService.ts
│   │   └── documentService.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useTax.ts
│   ├── utils/               # Utility functions
│   │   ├── security.ts      # Security utilities
│   │   ├── validation.ts    # Form validation
│   │   ├── formatting.ts    # Data formatting
│   │   └── constants.ts     # Constants
│   ├── types/               # TypeScript type definitions
│   ├── constants/           # App constants
│   └── App.tsx              # Root component
├── assets/                  # Images, fonts, and other assets
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── .babelrc                 # Babel configuration
├── jest.config.js           # Jest configuration
├── eas.json                 # EAS Build configuration
└── README.md               # This file
```

## Tech Stack

### Core
- **React Native 0.73+** - Native mobile framework
- **Expo SDK 50+** - Development platform
- **TypeScript** - Static type checking
- **React Navigation 6** - Navigation management

### State Management & Storage
- **Zustand** - Lightweight state management
- **AsyncStorage** - Persistent key-value storage
- **React Native Encrypted Storage** - Secure data encryption
- **MMKV** - High-performance storage

### API & Data
- **Axios** - HTTP client
- **Apollo Client** - GraphQL client
- **GraphQL** - Query language

### UI & Styling
- **NativeWind** - Tailwind CSS for React Native
- **React Native Gesture Handler** - Gesture handling
- **React Native Reanimated** - Animation library
- **Ionicons** - Icon library

### Features
- **expo-camera** - Camera functionality
- **expo-local-authentication** - Biometric authentication
- **expo-document-picker** - Document selection
- **react-native-vision-camera** - Advanced camera features

### Testing
- **Jest** - Testing framework
- **React Native Testing Library** - Testing utilities
- **Detox** - E2E testing

## Installation & Setup

### Prerequisites
- Node.js 16+ or higher
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Install Dependencies

```bash
cd taxsense-mobile-global
npm install
# or
yarn install
```

### Configuration

1. Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

2. Update API endpoints and keys in `.env`

3. Configure EAS Build:
```bash
eas build:configure
```

## Development

### Start Development Server

```bash
npm start
# or
expo start
```

### Run on Emulator/Simulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web (development only)
npm run web
```

### Run Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Building & Deployment

### Build APK/IPA

#### Using EAS Build

```bash
# Development build
eas build --platform ios --profile development
eas build --platform android --profile development

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

#### Local Build

```bash
# Build iOS
npm run build:ios

# Build Android
npm run build:android
```

### Submit to App Stores

```bash
# Submit iOS to App Store
eas submit --platform ios

# Submit Android to Google Play
eas submit --platform android
```

## Architecture

### State Management (Zustand)
- `authStore.ts` - User authentication and profile
- `taxStore.ts` - Tax calculations and scenarios
- `documentStore.ts` - Document management
- `uiStore.ts` - UI state (theme, language, notifications)

### API Integration
- Centralized API client with interceptors
- Token refresh mechanism
- Error handling
- Request/response logging

### Offline-First
- All data cached locally
- Offline queue for pending actions
- Automatic sync when online
- Conflict resolution

### Navigation
- Deep linking support
- Type-safe navigation
- Stack-based navigation for each feature
- Bottom tab navigation for main sections

## Performance Optimization

### Bundle Size (<5MB target)
- Code splitting by screen
- Lazy loading of screens
- Image optimization
- Tree shaking for unused code

### Runtime Performance
- Memoization with React.memo
- useMemo/useCallback for expensive operations
- FlatList optimization
- Native bridge optimization

### Memory Management
- Proper cleanup in useEffect
- Unsubscribe from listeners
- Release large objects
- Image caching

## Security

### Authentication
- Biometric authentication (Face ID, Fingerprint, Iris)
- PIN-based authentication
- Session management
- Auto-logout after inactivity

### Data Protection
- Encrypted storage for sensitive data
- SSL pinning for API communication
- Data encryption in transit
- Secure token storage

### Device Security
- Jailbreak/rooting detection
- Certificate pinning
- Runtime integrity checks
- Secure random number generation

## Internationalization (i18n)

The app supports multiple languages through:
- Language preference storage
- Dynamic language switching
- Translation files per language
- RTL language support

Supported languages:
- English
- Hindi
- Spanish
- French
- German
- Chinese
- Japanese
- Korean
- Portuguese
- Russian

## Accessibility

### WCAG 2.1 AA Compliance
- Sufficient color contrast
- Keyboard navigation support
- Screen reader compatibility
- Proper heading hierarchy
- Alternative text for images
- Focus indicators
- Touch target size (minimum 44x44)

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Current user profile
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Request password reset

### Tax Calculations
- `GET /tax/calculations` - Get calculations
- `POST /tax/calculations` - Create calculation
- `GET /tax/calculations/{id}` - Get specific calculation
- `PUT /tax/calculations/{id}` - Update calculation
- `DELETE /tax/calculations/{id}` - Delete calculation
- `POST /tax/calculations/{id}/calculate` - Calculate tax
- `POST /tax/calculations/{id}/compare-regimes` - Compare tax regimes

### Documents
- `GET /documents` - Get all documents
- `POST /documents/upload` - Upload document
- `POST /documents/{id}/ocr` - Process with OCR
- `POST /documents/{id}/extract` - Extract data
- `DELETE /documents/{id}` - Delete document

### Compliance
- `GET /tax/deadlines` - Get tax deadlines
- `GET /tax/audit-risk` - Get audit risk score
- `GET /compliance/checklist` - Get compliance checklist

### Advisor
- `GET /advisors` - Search advisors
- `GET /advisors/{id}` - Get advisor profile
- `POST /consultations` - Book consultation
- `GET /consultations` - Get user consultations

## Environment Variables

```
API_URL=https://api.taxsense.global
GRAPHQL_URL=https://api.taxsense.global/graphql
AUTH_TOKEN_KEY=taxsense_auth_token
REFRESH_TOKEN_KEY=taxsense_refresh_token
ENCRYPTION_KEY=your_encryption_key_here
APP_VERSION=1.0.0
ENVIRONMENT=development
LOG_LEVEL=debug
ENABLE_OFFLINE_MODE=true
ENABLE_DEBUG=false
```

## Monitoring & Analytics

### Performance Monitoring
- Screen load times
- API response times
- Memory usage
- Crash reporting

### Analytics
- User flow tracking
- Feature usage
- Error tracking
- Session duration

## Troubleshooting

### Common Issues

**App crashes on startup:**
- Clear app cache and data
- Reinstall the app
- Check console logs with `npm start`

**API connection errors:**
- Check network connectivity
- Verify API endpoint in .env
- Check SSL certificate issues

**Build failures:**
- Clear Expo cache: `expo client:select --clear`
- Clear node_modules and reinstall
- Check Node.js version compatibility

**Performance issues:**
- Profile with React Native Debugger
- Check for memory leaks
- Optimize re-renders with React DevTools

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit pull request

## License

Proprietary - TaxSense Global

## Support

For support, email support@taxsense.global or visit https://taxsense.global/support

## Changelog

### v1.0.0 (Initial Release)
- Initial app launch
- Core tax computation features
- Document management
- Compliance tracking
- Advisor connection
- Offline-first architecture
- Biometric authentication
- Multi-language support
