// jest-setup.ts — runs once before every test file.
//
// Loaded via setupFiles in jest.config.js.
//
// Use this for global mocks that every test needs (AsyncStorage, supabase
// client, RC's Purchases, vector-icons, etc.). Per-test mocks should live
// inside the test file itself.

// Mock AsyncStorage with the official in-memory mock from the package.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock @expo/vector-icons so component tests don't transitively pull in
// expo-font. Every icon family becomes a stub component that renders a
// <Text> with the icon name — enough to keep render trees stable.
jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  const stub = (props: { name?: string }) =>
    React.createElement(Text, null, props.name ?? '');
  return new Proxy({}, { get: () => stub });
});

// (expo-audio mock removed: the dependency was dropped in the 1.6.2 hotfix —
// sfx.ts is now soundless and no test pulls the native module. The stale mock
// made jest fail to resolve a non-existent module and broke the whole suite.)

// Mock RevenueCat purchases — no real native module in tests.
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  setLogLevel: jest.fn(),
  getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
  getOfferings: jest.fn().mockResolvedValue({ current: null }),
  getProducts: jest.fn().mockResolvedValue([]),
  purchasePackage: jest.fn(),
  purchaseStoreProduct: jest.fn(),
  restorePurchases: jest.fn(),
  LOG_LEVEL: { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' },
}));

// Silence the act() warning for state updates in async hooks during tests.
// (We accept the noise from tests that don't wrap async setState calls.)
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
    return;
  }
  originalError(...args);
};
