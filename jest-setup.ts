// jest-setup.ts — runs once before every test file.
//
// Loaded via setupFiles in jest.config.js.
//
// Use this for global mocks that every test needs (AsyncStorage, supabase
// client, RC's Purchases, vector-icons, etc.). Per-test mocks should live
// inside the test file itself.

// Supabase client (src/integrations/supabase/client.ts) calls createClient at
// module load and throws "supabaseUrl is required" if these are unset. Jest does
// not load .env, so provide harmless dummy values — every test mocks the actual
// network/auth, so no real endpoint is ever contacted. Also lets CI run jest
// without the real (or any) Supabase secrets.
process.env.EXPO_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||= 'dummy.anon.key';

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

// Mock Sentry — no native module / no DSN in tests. Telemetry helpers
// (pushTelemetry, buffCatchTelemetry) call these; tests that want to assert
// on them import the mocked module and read the jest.fn() call args.
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
  captureException: jest.fn(),
  init: jest.fn(),
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
