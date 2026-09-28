# Deployment Guide

Complete guide for deploying TaxSense AI mobile app to iOS and Android app stores.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Linting clean: `npm run lint`
- [ ] Code reviewed

### Version Management
- [ ] Increment version in `app.json`: `"version": "1.0.1"`
- [ ] Increment version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Update release notes

### Configuration
- [ ] Set production API URLs in `.env`
- [ ] Disable debug logging
- [ ] Configure error tracking (Sentry)
- [ ] Enable analytics

### Testing
- [ ] Device testing on iOS
- [ ] Device testing on Android
- [ ] Biometric authentication testing
- [ ] Offline mode testing
- [ ] Network error handling

## iOS Deployment

### Prerequisites
- Apple Developer Account
- Xcode installed
- iOS certificates and provisioning profiles
- Fastlane installed (optional but recommended)

### Step 1: Configure Code Signing

```bash
# Update bundle identifier in app.json
"ios": {
  "bundleIdentifier": "com.mnbresearch.taxsense"
}
```

### Step 2: Create Build with EAS

```bash
# Login to EAS
eas login

# Create production build
eas build --platform ios --profile production
```

### Step 3: Test Build

Download the IPA and test on physical device:

```bash
# Using Xcode
open -a Xcode /path/to/TaxSense.ipa
```

### Step 4: Submit to App Store

```bash
# Automatic submission
eas submit --platform ios --latest

# Or manual using Transporter
# Download IPA from EAS dashboard
# Open Apple Transporter app
# Add IPA file
# Submit
```

### Step 5: App Store Review

1. Go to App Store Connect
2. Select Build version
3. Fill in review information:
   - Description
   - Keywords
   - Support URL
   - Privacy Policy
   - Demo account (if needed)
4. Submit for review

### Step 6: Monitoring

After app store approval:
- Monitor crash reports in Xcode Organizer
- Monitor user reviews
- Monitor analytics
- Prepare hotfix if needed

## Android Deployment

### Prerequisites
- Google Play Developer Account
- Android keystore file
- Fastlane installed (optional)

### Step 1: Configure Package Name

```bash
# Update package name in app.json
"android": {
  "package": "com.mnbresearch.taxsense",
  "versionCode": 1
}
```

### Step 2: Create Keystore (First Time Only)

```bash
# Generate keystore
keytool -genkey -v -keystore taxsense-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias taxsense-key

# Store securely and backup
```

### Step 3: Configure Keystore in EAS

```bash
# Upload keystore
eas credentials

# Follow prompts to configure credentials
```

### Step 4: Create Build with EAS

```bash
# Create production build
eas build --platform android --profile production
```

### Step 5: Test Build

```bash
# Download and test APK on emulator/device
adb install -r /path/to/app-release.apk
```

### Step 6: Submit to Play Store

```bash
# Automatic submission
eas submit --platform android --latest

# Or manual
# 1. Download AAB from EAS dashboard
# 2. Go to Google Play Console
# 3. Create new release
# 4. Upload AAB
# 5. Review and publish
```

### Step 7: Play Store Review

1. Fill in store listing:
   - App title
   - Short description
   - Full description
   - Screenshots (5-8)
   - Feature graphic
   - Promotional text

2. Set pricing and distribution:
   - Select countries
   - Set price (or free)
   - Content rating questionnaire

3. Submit for review

## Continuous Deployment (CI/CD)

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to App Stores

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run type-check
      
      - name: Build iOS
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: eas build --platform ios --auto-submit
      
      - name: Build Android
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: eas build --platform android --auto-submit
```

## Version Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

### Update Versions

```bash
# Update app.json
{
  "version": "1.0.1"
}

# Update package.json
{
  "version": "1.0.1"
}

# Create git tag
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

## Rollback Procedures

### If Critical Bug Found

1. **Immediately pause distribution**
   - iOS: Contact Apple support to remove from sale
   - Android: Un-publish from Play Store

2. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/critical-bug v1.0.0
   # Fix bug
   git commit -am "fix: critical bug fix"
   ```

3. **Release hotfix**
   ```bash
   git tag v1.0.1
   # Deploy new version
   ```

4. **Communicate with users**
   - Release notes
   - In-app notification
   - Email to active users

## Monitoring Post-Deployment

### Analytics Tracking

Monitor key metrics:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session length
- Feature usage
- Crash rates

### Crash Monitoring

Configure Sentry:

```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

### Performance Monitoring

Track app performance:
- App startup time
- Screen load times
- API response times
- Memory usage

### User Feedback

- Monitor App Store/Play Store reviews
- Respond to user feedback
- Track issue reports
- Prepare responses

## Release Hotline

For production issues:

1. **Assess severity** (Critical/High/Medium/Low)
2. **Notify team** immediately
3. **Create issue** on GitHub
4. **Fix and test** thoroughly
5. **Deploy hotfix** via CI/CD
6. **Communicate** with users

## Compliance & Security

### Before Release

- [ ] GDPR compliance check
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Data encryption enabled
- [ ] API security review
- [ ] Dependency vulnerability scan

### Ongoing

- [ ] Weekly security updates
- [ ] Regular penetration testing
- [ ] Code security audit
- [ ] Dependency updates

## Troubleshooting

### Build Failures

```bash
# Clear EAS cache
eas build --platform ios --clear-cache

# Check build logs
eas build:list  # View all builds
eas build:view <build-id>  # View specific build
```

### Submission Rejections

Common reasons:
1. Crash on launch
2. Missing privacy policy
3. Misleading description
4. Requires account without benefit
5. Incomplete app functionality

Solution:
1. Review rejection reason
2. Fix issues
3. Resubmit for review

### Version Conflicts

```bash
# Check current versions
grep '"version"' app.json package.json

# Ensure consistency
# Both should match
```

## Support

For deployment issues:
- EAS Documentation: https://docs.expo.dev/build/
- GitHub Issues: Check existing issues
- Expo Forums: https://forums.expo.dev/

---

For questions or issues, contact: deploy@taxsense.ai
