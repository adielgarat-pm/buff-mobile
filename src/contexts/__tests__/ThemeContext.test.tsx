/**
 * ThemeContext — per-child theme isolation.
 *
 * Regression guard for the "sibling theme leak": the child theme used to be a
 * single device-global AsyncStorage key, so previewing/using a Gamer child then
 * a Mint child showed the Mint child in Gamer (+ the Gamer default buddy). The
 * theme is now keyed per child (`buff_child_theme:<id>`).
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../ThemeContext';

let mockProfile: { id: string; role: string } | null = null;
let mockPreviewChildId: string | null = null;

jest.mock('../AuthContext', () => ({ useAuth: () => ({ profile: mockProfile }) }));
jest.mock('../ModeContext', () => ({ useMode: () => ({ previewChildId: mockPreviewChildId }) }));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn().mockResolvedValue(undefined) },
}));

const mockedGetItem = AsyncStorage.getItem as jest.Mock;

// Only child "gamer-kid" has a stored gamer theme; everyone else has nothing.
beforeEach(() => {
  mockProfile = null;
  mockPreviewChildId = null;
  mockedGetItem.mockImplementation((key: string) =>
    Promise.resolve(key === 'buff_child_theme:gamer-kid' ? 'gamer' : null),
  );
});

const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeContext — per-child isolation', () => {
  it('loads the gamer theme for the child who stored it', async () => {
    mockProfile = { id: 'gamer-kid', role: 'child' };
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.themeName).toBe('gamer'));
  });

  it('does NOT leak a sibling\'s gamer theme — a child with none stored defaults to mint', async () => {
    // Same device, but the active child is a different sibling with no stored theme.
    mockProfile = { id: 'mint-kid', role: 'child' };
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.themeName).toBe('mint'));
  });

  it('uses the previewed child id when a parent is in View-as-Child', async () => {
    mockProfile = { id: 'parent-1', role: 'parent' };
    mockPreviewChildId = 'gamer-kid';
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.themeName).toBe('gamer'));
  });
});
