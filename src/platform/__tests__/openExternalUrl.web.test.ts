/**
 * @jest-environment jsdom
 */
import { openExternalUrl } from '../openExternalUrl.web';

describe('openExternalUrl (web)', () => {
  const realOpen = window.open;
  afterEach(() => { window.open = realOpen; });

  it('opens a new tab and does NOT navigate the current one (the noopener-null bug)', () => {
    const tab = { opener: {} as unknown };
    const open = jest.fn(() => tab as unknown as Window);
    window.open = open as unknown as typeof window.open;
    const before = window.location.href;
    openExternalUrl('https://cal.com/x');
    expect(open).toHaveBeenCalledWith('https://cal.com/x', '_blank');
    expect(tab.opener).toBeNull();
    expect(window.location.href).toBe(before);
  });
});
