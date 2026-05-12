/**
 * jest-setup.ts — runs once before every test file.
 *
 * Loaded via setupFilesAfterEach in jest.config.js.
 *
 * Use this for global mocks that every test needs (AsyncStorage, supabase
 * client, RC's Purchases, etc.). Per-test mocks should live inside the
 * test file itself.
 */

// Mock AsyncStorage with the official in-memory mock from the package.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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
