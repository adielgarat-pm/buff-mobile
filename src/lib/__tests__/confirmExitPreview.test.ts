import { Alert } from 'react-native';
import { confirmExitPreview } from '../confirmExitPreview';

const t = (k: string, vars?: Record<string, unknown>) =>
  vars ? `${k}(${Object.entries(vars).map(([a, b]) => `${a}=${b}`).join(',')})` : k;

describe('confirmExitPreview', () => {
  afterEach(() => jest.restoreAllMocks());

  it('asks before exiting, and exits only on confirm', () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onExit = jest.fn();
    confirmExitPreview(t, 'Gal', onExit);
    expect(onExit).not.toHaveBeenCalled();
    const [title, , buttons] = spy.mock.calls[0] as [string, string, { text: string; style?: string; onPress?: () => void }[]];
    expect(title).toContain('Gal');
    const cancel = buttons.find(b => b.style === 'cancel');
    const yes = buttons.find(b => b.text === 'childTabs.exitConfirmYes');
    expect(cancel).toBeTruthy();
    cancel?.onPress?.();
    expect(onExit).not.toHaveBeenCalled();
    yes?.onPress?.();
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('uses the whole-sentence NoName title when the child name is missing', () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    confirmExitPreview(t, null, jest.fn());
    expect(spy.mock.calls[0][0]).toBe('childTabs.exitConfirmTitleNoName');
  });

  it('isolates the name (bidi) and is cancelable on Android', () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    confirmExitPreview(t, 'נועה', jest.fn());
    expect(spy.mock.calls[0][0]).toContain('\u2068נועה\u2069');
    expect(spy.mock.calls[0][3]).toEqual({ cancelable: true });
  });
});
