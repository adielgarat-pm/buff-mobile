// jest.config.js — test runner config for buff-mobile.
//
// Uses jest-expo preset which configures jsdom env, TS transforms, RN mocks,
// and module-name mapping for static assets.
//
// Conventions:
//   - Tests live in src/**/__tests__/ or as *.test.ts(x) siblings.
//   - The transformIgnorePatterns list is the standard Expo/RN allowlist —
//     these packages ship untranspiled ES, so Jest needs to run them through
//     Babel. Adding to this list when a new RN/Expo dep complains is normal.
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest-setup.ts'],
  // Full-suite runs were flaky ONLY under parallel load: Jest's default
  // maxWorkers (= logical cores - 1 → 15 here) spawns more jsdom/RN worker
  // processes than this machine's free RAM supports, so heavy screen suites
  // get starved and their waitFor-driven tests blow the 5s default timeout —
  // while passing instantly in isolation. Cap workers to half the cores and
  // give component tests a timeout that tolerates a loaded machine; passing
  // tests are event-driven so the higher ceiling costs nothing.
  maxWorkers: '50%',
  testTimeout: 30000,
  // Recycle workers whose heap balloons (jest-expo workers accumulate memory
  // across suites), so late-scheduled suites don't inherit a paging process.
  workerIdleMemoryLimit: '512MB',
  // Use `roots` + relative testMatch so the glob doesn't have to interpolate
  // <rootDir> — which mangles paths that contain `.` segments (like git
  // worktrees rooted under `.claude/`).
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/*.test.ts?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-clone-referenced-element|@react-native-community/.*|@react-navigation/.*|react-native-purchases|@supabase/.*|@react-native-async-storage/.*))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
