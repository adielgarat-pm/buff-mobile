/**
 * Tests for otaTelemetry — OTA freshness instrumentation (layers 1+3).
 * Sentry is globally mocked in jest-setup.ts; isolate the module per test so the
 * per-session dedupe Set starts empty.
 */
function load() {
  let Sentry: typeof import('@sentry/react-native');
  let logOtaStep: typeof import('../otaTelemetry').logOtaStep;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Sentry = require('@sentry/react-native');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ logOtaStep } = require('../otaTelemetry'));
  });
  return { Sentry: Sentry!, logOtaStep: logOtaStep! };
}

const PII_KEYS = ['token', 'email', 'name', 'display_name', 'profileId', 'profile_id', 'family_id'];

describe('otaTelemetry.logOtaStep', () => {
  test('emits an ota_freshness breadcrumb with only the passed ctx', () => {
    const { Sentry, logOtaStep } = load();
    logOtaStep('toast_shown', { platform: 'android' });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    const crumb = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    expect(crumb).toMatchObject({
      category: 'ota_freshness',
      message: 'toast_shown',
      level: 'info',
      data: { platform: 'android' },
    });
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  test('never leaks PII', () => {
    const { Sentry, logOtaStep } = load();
    logOtaStep('toast_suppressed', { platform: 'android', status: 'route:ParentApp', surface: 'route:ParentApp' });
    const crumb = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    for (const k of PII_KEYS) expect(crumb.data).not.toHaveProperty(k);
    expect(JSON.stringify(crumb)).not.toMatch(/@/);
  });

  test('escalates a reload error to a warning captureMessage', () => {
    const { Sentry, logOtaStep } = load();
    logOtaStep('toast_reload_error', { platform: 'android', status: 'error', reason: 'boom' });
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    const [msg, opts] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(msg).toContain('toast_reload_error');
    expect(opts).toMatchObject({ level: 'warning', tags: { ota_step: 'toast_reload_error' } });
    expect(opts.extra).toMatchObject({ reason: 'boom' });
  });

  test('dedupes captureMessage per failing step within a session', () => {
    const { Sentry, logOtaStep } = load();
    logOtaStep('fl_error', { platform: 'android', reason: 'x' });
    logOtaStep('fl_error', { platform: 'android', reason: 'x' });
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(2);
  });

  test('a neutral layer-1 step never escalates', () => {
    const { Sentry, logOtaStep } = load();
    logOtaStep('fl_became_pending', { platform: 'android', ms: 900 });
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
