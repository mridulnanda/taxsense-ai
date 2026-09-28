# Testing Guide

This document provides comprehensive testing guidelines for the TaxSense AI mobile application.

## Test Structure

### Unit Tests
Tests for individual functions and components in isolation.

**Location**: `src/__tests__/`

**Coverage Target**: >50% for branches, functions, lines, statements

### Component Tests
Tests for React components and screens.

**Location**: `src/screens/__tests__/`, `src/components/__tests__/`

### Integration Tests
Tests for multiple components working together.

### E2E Tests
End-to-end tests for complete user workflows.

**Location**: `e2e/`

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- authStore.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="Login"
```

## Test Examples

### Store Testing (Zustand)

```typescript
import { useAuthStore } from '@/stores/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should set user', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    useAuthStore.getState().setUser(mockUser);
    
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
});
```

### Service Testing

```typescript
import { authService } from '@/services/authService';
import axios from 'axios';

jest.mock('axios');

describe('AuthService', () => {
  it('should login successfully', async () => {
    const mockResponse = { data: { token: 'test', user: {} } };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result).toEqual(mockResponse.data);
  });
});
```

### Component Testing

```typescript
import { render, screen } from '@testing-library/react-native';
import LoginScreen from '@/screens/auth/LoginScreen';

describe('LoginScreen', () => {
  it('should render login form', () => {
    render(<LoginScreen navigation={{}} />);
    
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
  });
});
```

### Utility Testing

```typescript
import { calculateIncomeTax } from '@/utils/taxCalculations';

describe('Tax Calculations', () => {
  it('should calculate tax for new regime', () => {
    const result = calculateIncomeTax(500000, 'NEW');
    
    expect(result.tax).toBeGreaterThan(0);
    expect(result.totalTax).toBeGreaterThan(result.tax);
  });
});
```

## Mocking

### Mock Apollo Client

```typescript
import { MockedProvider } from '@apollo/client/testing';
import gql from 'graphql-tag';

const mocks = [
  {
    request: {
      query: GET_USER_QUERY,
      variables: { id: '1' },
    },
    result: {
      data: {
        user: { id: '1', email: 'test@example.com' },
      },
    },
  },
];

render(
  <MockedProvider mocks={mocks}>
    <YourComponent />
  </MockedProvider>
);
```

### Mock Async Storage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('value')),
  setItem: jest.fn(() => Promise.resolve()),
}));
```

### Mock Secure Store

```typescript
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('token')),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

## E2E Testing with Detox

### Setup

```bash
npm run e2e:build
```

### Run E2E Tests

```bash
npm run e2e
```

### E2E Test Example

```typescript
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login with valid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Login')).tap();

    await waitFor(element(by.text('Dashboard')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Test Checklist

### Authentication
- [ ] Sign up with valid data
- [ ] Sign up with invalid data (validation errors)
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] OTP verification
- [ ] Biometric authentication
- [ ] Logout
- [ ] Token persistence

### Tax Computation
- [ ] Add income entries
- [ ] Edit income entries
- [ ] Delete income entries
- [ ] Add deduction entries
- [ ] Calculate tax (old regime)
- [ ] Calculate tax (new regime)
- [ ] Compare regimes
- [ ] Calculate surcharge and cess

### Scenarios
- [ ] Create scenario
- [ ] Edit scenario
- [ ] Delete scenario
- [ ] Compare scenarios
- [ ] Apply template

### Document Management
- [ ] Scan document from camera
- [ ] Upload document
- [ ] Extract data from document
- [ ] Download document
- [ ] Share document

### Offline Functionality
- [ ] Access app without internet
- [ ] Perform tax calculations offline
- [ ] Save data locally
- [ ] Sync data when online

### Performance
- [ ] App starts in < 2 seconds
- [ ] Screens load without lag
- [ ] Scrolling is smooth
- [ ] No memory leaks
- [ ] No excessive re-renders

## Coverage Report Analysis

```bash
npm run test:coverage
```

This generates a coverage report in `coverage/` directory.

### Coverage Targets
- **Statements**: >50%
- **Branches**: >50%
- **Functions**: >50%
- **Lines**: >50%

### View HTML Report
```bash
open coverage/lcov-report/index.html
```

## Debugging Tests

### Run Single Test File
```bash
npm test -- authStore.test.ts --verbose
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Print Debug Output
```typescript
console.log('Debug:', value);
screen.debug();
```

## Common Issues & Solutions

### Tests Timeout
```typescript
// Increase timeout
jest.setTimeout(10000);
```

### Mock Not Working
```typescript
// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

### React Hooks Error
```typescript
// Wrap with act()
import { act } from '@testing-library/react-native';

await act(async () => {
  // Hook code here
});
```

### Async Issues
```typescript
// Use async/await
it('should handle async', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Test Maintenance

### Best Practices
1. Keep tests independent
2. Use descriptive test names
3. Mock external dependencies
4. Update tests with code changes
5. Aim for high but realistic coverage
6. Use beforeEach/afterEach for setup/cleanup
7. Test behavior, not implementation

### Regular Updates
- Review failing tests weekly
- Update snapshots when intentional
- Refactor duplicate test code
- Add tests for bug fixes
- Monitor coverage trends

---

For more information, see [Jest Documentation](https://jestjs.io/) and [Testing Library Documentation](https://testing-library.com/docs/react-native-testing-library/intro/).
