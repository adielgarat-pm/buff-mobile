/**
 * Tests for pushTelemetry — the push-registration funnel instrumentation.
 *
 * Sentry is globally mocked in jest-setup.ts. We isolate the module per test so
 * the internal per-session dedupe Set (`reported`) starts empty each time.
 */

/** Fresh copy of the mocked Sentry + logPushStep with a reset dedupe Set. */
function load() {
  let Sentry: typeof import('@sentry/react-native');
  let logPushStep: typeof import('../pushTelemetry').logPushStep;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Sentry = require('@sentry/react-native');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ logPushStep } = require('../pushTelemetry'));
  });
  return { Sentry: Sentry!, logPushStep: logPushStep! };
}

const PII_KEYS = ['token', 'email', 'name', 'display_name', 'profileId', 'profile_id'];

describe('pushTelemetry.logPushStep', () => {
  test('emits a push_registration breadcrumb carrying only the passed ctx', () => {
    const { Sentry, logPushStep } = load();
    logPushStep('permission_result', { role: 'parent', platform: 'android', status: 'granted' });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    const crumb = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    expect(crumb).toMatchObject({
      category: 'push_registration',
      message: 'permission_result',
      level: 'info',
      data: { role: 'parent', platform: 'android', status: 'granted' },
    });
    // A success/neutral status must NOT escalate to a captured message.
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  test('never leaks PII — breadcrumb data has no identifying keys', () => {
    const { Sentry, logPushStep } = load();
    logPushStep('upsert_token', { role: 'child', platform: 'ios', status: 'success' });
    const crumb = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    for (const k of PII_KEYS) {
      expect(crumb.data).not.toHaveProperty(k);
    }
    // And nothing PII-shaped leaked into the serialized payload.
    const serialized = JSON.stringify(crumb);
    expect(serialized).not.toMatch(/@/); // no email
    expect(serialized).not.toMatch(/ExponentPushToken/); // no token
  });

  test('escalates a terminal failure (get_token null) to a warning captureMessage', () => {
    const { Sentry, logPushStep } = load();
    logPushStep('get_token', { platform: 'android', status: 'null' });

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    const [msg, opts] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(msg).toContain('get_token');
    expect(opts).toMatchObject({
      level: 'warning',
      tags: { push_step: 'get_token', push_status: 'null', push_platform: 'android' },
    });
  });

  test('escalates get_token error and forwards the sanitized reason', () => {
    const { Sentry, logPushStep } = load();
    logPushStep('get_token', { platform: 'android', status: 'error', reason: 'network down' });
    const [, opts] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(opts.extra).toEqual({ reason: 'network down' });
  });

  test('dedupes captureMessage per step+status within a session (breadcrumb still every time)', () => {
    const { Sentry, logPushStep } = load();
    logPushStep('get_token', { platform: 'android', status: 'null' });
    logPushStep('get_token', { platform: 'android', status: 'null' });

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1); // deduped
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(2); // always
  });
});
