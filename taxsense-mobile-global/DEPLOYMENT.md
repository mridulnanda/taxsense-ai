# TaxSense Mobile App - Deployment Guide

## Pre-Deployment Checklist

### Code & Testing
- [ ] All tests pass (unit, integration, E2E)
- [ ] No console errors or warnings
- [ ] TypeScript compilation succeeds
- [ ] Linting passes
- [ ] Code review completed
- [ ] Security scan passed

### Configuration
- [ ] Environment variables set correctly
- [ ] API endpoints verified
- [ ] SSL certificates installed
- [ ] Analytics tracking configured
- [ ] Crash reporting enabled
- [ ] App versioning updated

### Assets
- [ ] App icons generated (all sizes)
- [ ] Splash screens created
- [ ] Screenshots prepared for store
- [ ] Privacy policy drafted
- [ ] Terms of service prepared

## Development Build

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for development (iOS)
eas build --platform ios --profile development

# Build for development (Android)
eas build --platform android --profile development
```

### Local Development Build

```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

## Staging Build

For beta testing and quality assurance:

```bash
# Build for staging
eas build --platform ios --profile staging
eas build --platform android --profile staging

# Install on test devices
# iOS: Use TestFlight with eas
# Android: Use Google Play Console internal testing
```

## Production Build

### Step 1: Prepare Secrets

```bash
# Generate signing certificates for iOS
eas credentials

# Configure Google Play signing for Android
eas credentials --platform android
```

### Step 2: Version Bump

```bash
# Update version in package.json and app.json
# Follow semantic versioning (MAJOR.MINOR.PATCH)
```

### Step 3: Build

```bash
# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Step 4: Test Builds

Before submission:
- Test on multiple devices
- Test on different network conditions
- Test offline functionality
- Performance profiling
- Battery consumption testing

## iOS Deployment

### Requirements
- Apple Developer Account ($99/year)
- Xcode 14+
- Provisioning profiles
- Distribution certificates

### App Store Submission Process

1. **Prepare App Store Connect**
   ```bash
   # Login to App Store Connect
   # Create new app record
   # Configure bundle ID (com.taxsense.global)
   # Setup pricing and availability
   ```

2. **Build with EAS**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit with EAS**
   ```bash
   eas submit --platform ios --latest
   ```

4. **Manual Submission** (if not using EAS submit)
   - Download `.ipa` from EAS dashboard
   - Open Transporter app
   - Drag and drop `.ipa`
   - Submit for review

5. **App Store Review**
   - Typically 24-48 hours
   - Monitor review status in App Store Connect
   - Respond to any review questions
   - Address rejections if any

6. **Release**
   - Set release date
   - Enable phased rollout (recommended for production)
   - Release to all users

### iOS Build Configuration

Update `eas.json` for iOS:
```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "archive",
        "distribution": "store",
        "developmentClient": false
      }
    }
  }
}
```

### Code Signing

```bash
# Manage certificates
eas credentials

# View current certificates
eas credentials --platform ios --show
```

## Android Deployment

### Requirements
- Google Play Developer Account ($25 one-time)
- Keystore file for signing
- Google Play Console access

### Google Play Submission Process

1. **Create Signing Key**
   ```bash
   # EAS handles this automatically
   eas build --platform android --profile production
   ```

2. **Build APK/AAB**
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit to Google Play**
   ```bash
   eas submit --platform android --latest
   ```

4. **Manual Submission** (if not using EAS submit)
   - Login to Google Play Console
   - Create new release in "Production" track
   - Upload AAB file
   - Fill in release notes
   - Review content rating questionnaire
   - Accept agreements
   - Submit for review

5. **Play Store Review**
   - Typically 2-4 hours
   - Monitor review status
   - Can escalate if delayed

6. **Release**
   - Choose rollout percentage (recommend 10% → 50% → 100%)
   - Monitor for crashes and issues
   - Gradually increase rollout

### Android Build Configuration

Update `eas.json` for Android:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "distribution": "store"
      }
    }
  }
}
```

## Post-Deployment

### Monitoring

Set up monitoring for:
- App crashes (Sentry, Firebase Crashlytics)
- User analytics (Mixpanel, Firebase Analytics)
- API performance (DataDog, New Relic)
- App performance (Firebase Performance)

### Tracking

Monitor key metrics:
- Downloads and active users
- Crash rate
- Average session duration
- Feature usage
- API response times

### User Support

- Setup support email/chat
- Create FAQ documentation
- Monitor app store reviews
- Respond to user feedback

## Hotfix Deployment

For critical bugs requiring immediate deployment:

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix the issue
# 3. Test thoroughly
# 4. Bump patch version

# 5. Build hotfix
eas build --platform ios --profile production
eas build --platform android --profile production

# 6. Submit
eas submit --platform ios --latest
eas submit --platform android --latest

# 7. Monitor rollout
# Use phased rollout: 10% → 50% → 100%

# 8. Merge back to main
```

## Rollback Procedure

If critical issue discovered after release:

```bash
# 1. Pause rollout in app store
# 2. Identify and fix issue
# 3. Bump version (e.g., 1.0.1 → 1.0.2)
# 4. Build and test new version
# 5. Submit update to app stores
# 6. Monitor new version deployment
```

## Environment-Specific Configuration

### Development
```
API_ENDPOINT=https://dev-api.taxsense.global
LOG_LEVEL=debug
SENTRY_DSN=<dev-key>
ANALYTICS_KEY=<dev-key>
```

### Staging
```
API_ENDPOINT=https://staging-api.taxsense.global
LOG_LEVEL=info
SENTRY_DSN=<staging-key>
ANALYTICS_KEY=<staging-key>
```

### Production
```
API_ENDPOINT=https://api.taxsense.global
LOG_LEVEL=warn
SENTRY_DSN=<prod-key>
ANALYTICS_KEY=<prod-key>
```

## Performance Optimization Before Release

### Bundle Size
```bash
# Analyze bundle
npm run analyze

# Should be under 5MB
# Check in EAS build logs
```

### Performance Profiling
```bash
# Profile with Hermes
# Check JavaScript startup time
# Monitor native module loading
```

### Battery & Memory
- Profile with Xcode (iOS)
- Profile with Android Studio (Android)
- Test with different device capabilities

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  ↓     ↓      ↓
  1  .  2  .  3

MAJOR - Breaking changes, major features
MINOR - New features, backward compatible
PATCH - Bug fixes
```

### Release Notes Template

```
Version 1.2.0 - Release Date

New Features:
- Feature 1 description
- Feature 2 description

Improvements:
- Improvement 1
- Improvement 2

Bug Fixes:
- Fixed issue #123
- Fixed issue #456

Security:
- Security patch for CVE-XXXX

Compatibility:
- Requires iOS 14+
- Requires Android 9+
```

## Continuous Deployment (CD)

### GitHub Actions Setup

```yaml
name: Deploy to App Stores

on:
  push:
    tags:
      - 'v*'

jobs:
  build-ios:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build iOS
        run: eas build --platform ios --profile production --non-interactive
      - name: Submit iOS
        run: eas submit --platform ios --latest --non-interactive

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build Android
        run: eas build --platform android --profile production --non-interactive
      - name: Submit Android
        run: eas submit --platform android --latest --non-interactive
```

## Troubleshooting Deployment Issues

### Build Failures

**Issue**: Build fails with cryptic error

**Solution**:
```bash
# Clear cache
expo client:select --clear

# Rebuild
eas build --platform ios --profile production --wait --logs=all

# Check logs for details
# Common issues:
# - Node version mismatch
# - Missing dependencies
# - iOS provisioning profile expired
```

### Submission Rejection

**Issue**: App Store/Play Store rejection

**Solutions**:
- Review rejection reason carefully
- Check app guidelines compliance
- Test on actual device
- Verify all required screens present
- Check content rating accuracy
- Update privacy policy if needed

### Performance Issues Post-Launch

**Issue**: App crashes or performs poorly

**Solutions**:
```bash
# Monitor crashes with Sentry
# Profile with React Profiler
# Check API latency
# Optimize images
# Clear cache

# If critical, deploy hotfix
eas build --platform ios --profile production
```

## Release Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Release notes written
- [ ] Screenshots/descriptions updated
- [ ] Privacy policy current
- [ ] Analytics tracking verified
- [ ] Error reporting enabled
- [ ] Performance benchmarks acceptable
- [ ] Security scan passed
- [ ] Build uploaded and ready
- [ ] Phased rollout planned
- [ ] Rollback plan prepared
- [ ] Support team notified
- [ ] Monitoring configured
