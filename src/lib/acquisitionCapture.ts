/**
 * acquisitionCapture.ts — default / native variant + TypeScript anchor.
 *
 * Metro resolves acquisitionCapture.web.ts on web and this file on native
 * (android/ios). `import ... from '../lib/acquisitionCapture'` type-checks
 * against this signature.
 *
 * Native has no inbound URL or referrer at launch: an organic Play Store
 * install carries no attribution, and utm-tagged NATIVE installs (an FB→Play
 * link) would arrive via the Google Play Install Referrer — that path is
 * deferred (pkg/smart-join-link / #301, needs a new native dependency). Until
 * then every native signup resolves to 'organic' + device-locale country,
 * which is exactly what let us hand-classify the first US install.
 */
import { Platform } from 'react-native';
import { AcquisitionSignal, deviceRegion } from './acquisitionCapture.shared';

export async function captureAcquisitionFromUrl(): Promise<void> {
  // No-op on native — nothing to capture at launch.
}

export async function resolveAcquisition(): Promise<AcquisitionSignal> {
  return {
    source: 'organic',
    raw: { platform: Platform.OS, capture: 'native_organic' },
    country: deviceRegion(),
  };
}

export async function clearAcquisition(): Promise<void> {
  // No-op on native.
}
