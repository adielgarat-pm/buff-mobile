/**
 * Tests for purchaseService.initRevenueCat — iOS Phase-1 guard.
 *
 * On iOS we ship without an iOS RevenueCat key / IAP products (TestFlight, no
 * payments). Configuring the SDK with the Android key on iOS would error, so
 * initRevenueCat must early-return on iOS and NOT call Purchases.configure.
 * On Android it must configure as before.
 */
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { initRevenueCat } from '../purchaseService';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setLogLevel: jest.fn(),
    configure: jest.fn().mockResolvedValue(undefined),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));

const mockedConfigure = Purchases.configure as jest.Mock;
const mockedSetLogLevel = Purchases.setLogLevel as jest.Mock;
const originalOS = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  (Platform as { OS: string }).OS = originalOS;
  (console.log as jest.Mock).mockRestore();
});

describe('initRevenueCat', () => {
  it('skips configuration on iOS (Phase 1 — no IAP yet)', async () => {
    (Platform as { OS: string }).OS = 'ios';

    await initRevenueCat('user-123');

    expect(mockedConfigure).not.toHaveBeenCalled();
    expect(mockedSetLogLevel).not.toHaveBeenCalled();
  });

  it('configures the SDK on Android with the user id as appUserID', async () => {
    (Platform as { OS: string }).OS = 'android';

    await initRevenueCat('user-123');

    expect(mockedConfigure).toHaveBeenCalledTimes(1);
    expect(mockedConfigure).toHaveBeenCalledWith(
      expect.objectContaining({ appUserID: 'user-123' }),
    );
  });
});
