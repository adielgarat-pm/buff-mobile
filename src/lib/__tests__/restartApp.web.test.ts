/**
 * @jest-environment jsdom
 */
import { restartApp } from '../restartApp.web';

describe('restartApp (web)', () => {
  const realLocation = window.location;
  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
  });

  it('does a full page reload and does not remount', async () => {
    const reload = jest.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
    const remount = jest.fn();
    await restartApp(remount);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(remount).not.toHaveBeenCalled();
  });

  it('falls back to remount if reload throws', async () => {
    const reload = jest.fn(() => { throw new Error('blocked'); });
    Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
    const remount = jest.fn();
    await restartApp(remount);
    expect(remount).toHaveBeenCalledTimes(1);
  });
});
