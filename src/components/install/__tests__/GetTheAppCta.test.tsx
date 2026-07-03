/**
 * GetTheAppCta.web — renders the right variant per visitor class, gated on async
 * eligibility, and never renders for standalone/ios-pwa/desktop (SPEC §3.1 / §6.1).
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import GetTheAppCta from '../GetTheAppCta.web';
import type { InstallTarget } from '../../../lib/installTarget.web';

let mockTarget: InstallTarget = 'android-play';

jest.mock('../../../lib/installTarget.web', () => ({
  classifyInstallTarget: () => ({
    target: mockTarget,
    isMobile: true,
    isInAppWebView: mockTarget === 'android-inapp-webview' || mockTarget === 'ios-inapp-webview',
    resolveInstalledState: async () => mockTarget,
  }),
  buildPlayInstallUrl: (id: string, placement: string) =>
    `https://play.google.com/store/apps/details?id=com.buffapp.mobile&referrer=cta_id%3D${id}%26m%3D${placement}`,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockLog = jest.fn();
jest.mock('../../../lib/installCtaTelemetry.web', () => ({
  logInstallCtaEvent: (...args: unknown[]) => mockLog(...args),
}));

// Eligible by default; individual tests can flip it.
let mockEligible = true;
jest.mock('../../../lib/installCtaEligibility.web', () => ({
  isInstallCtaEligible: async () => mockEligible,
  recordInstallCtaImpression: async () => {},
  recordInstallCtaDismiss: async () => {},
}));

beforeEach(() => {
  mockTarget = 'android-play';
  mockEligible = true;
  mockLog.mockClear();
});

it('android-play + post-signup renders title, body, Play button and keep-browsing', async () => {
  const { findByText, getByText } = render(<GetTheAppCta placement="post-signup" />);
  expect(await findByText('install.getApp.postSignupTitle')).toBeTruthy();
  expect(getByText('install.getApp.postSignupBody')).toBeTruthy();
  expect(getByText('install.getApp.playButton')).toBeTruthy();
  expect(getByText('install.getApp.keepBrowsing')).toBeTruthy();
});

it('android-play + entry renders the slim strip (stripText + Install), no keep-browsing', async () => {
  const { findByText, queryByText } = render(<GetTheAppCta placement="entry" />);
  expect(await findByText('install.getApp.stripText')).toBeTruthy();
  expect(queryByText('install.getApp.installShort')).toBeTruthy();
  expect(queryByText('install.getApp.keepBrowsing')).toBeNull();
});

it('dashboard-nudge renders the strip with dashboard copy, bypassing internal eligibility', async () => {
  mockEligible = false; // manager gates the dashboard nudge, not the internal check
  const { findByText } = render(<GetTheAppCta placement="dashboard-nudge" />);
  expect(await findByText('install.getApp.dashboardText')).toBeTruthy();
  expect(await findByText('install.getApp.installShort')).toBeTruthy();
});

it('android in-app webview (post-signup card) renders the intent breakout + copy link', async () => {
  mockTarget = 'android-inapp-webview';
  const { findByText, getByText } = render(<GetTheAppCta placement="post-signup" />);
  expect(await findByText('install.getApp.inAppTitle')).toBeTruthy();
  expect(getByText('install.getApp.copyLink')).toBeTruthy();
});

it('renders nothing for ios-pwa (existing add-to-home nudge handles it)', async () => {
  mockTarget = 'ios-pwa';
  const r = render(<GetTheAppCta placement="entry" />);
  await act(async () => {});
  expect(r.toJSON()).toBeNull();
});

it('renders nothing for standalone (already installed)', async () => {
  mockTarget = 'standalone';
  const r = render(<GetTheAppCta placement="entry" />);
  await act(async () => {});
  expect(r.toJSON()).toBeNull();
});

it('renders nothing for desktop in v1', async () => {
  mockTarget = 'desktop';
  const r = render(<GetTheAppCta placement="entry" />);
  await act(async () => {});
  expect(r.toJSON()).toBeNull();
});

it('renders nothing when eligibility is suppressed (cooldown/cap)', async () => {
  mockEligible = false;
  const r = render(<GetTheAppCta placement="post-signup" />);
  await act(async () => {});
  expect(r.toJSON()).toBeNull();
});

it('dismiss hides the CTA, calls onDismiss and logs a dismiss event', async () => {
  const onDismiss = jest.fn();
  const { findByLabelText, toJSON } = render(
    <GetTheAppCta placement="post-signup" onDismiss={onDismiss} />,
  );
  fireEvent.press(await findByLabelText('install.getApp.dismissLabel'));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(mockLog).toHaveBeenCalledWith('dismiss', 'post-signup', 'android-play', expect.any(String));
  await waitFor(() => expect(toJSON()).toBeNull());
});

it('logs an impression when it becomes visible', async () => {
  render(<GetTheAppCta placement="entry" />);
  await waitFor(() =>
    expect(mockLog).toHaveBeenCalledWith('impression', 'entry', 'android-play', expect.any(String)),
  );
});
