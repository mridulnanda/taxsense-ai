import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((val) => val),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((val) => val),
  withTiming: jest.fn((val) => val),
  Animated: {
    createAnimatedComponent: (Comp) => Comp,
  },
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(),
  isAvailableAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  Camera: {
    Constants: {
      Type: { back: 'back', front: 'front' },
      FlashMode: { on: 'on', off: 'off', auto: 'auto' },
    },
  },
  CameraType: { back: 'back', front: 'front' },
}));

global.fetch = jest.fn();
