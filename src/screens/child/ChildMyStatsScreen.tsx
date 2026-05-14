/**
 * Child My Stats — router that picks the right layout per theme.
 *   Gamer theme → GamerMyStatsScreen (Stitch 5B-lite)
 *   Pastel/Mint → null (the tab itself is hidden in ChildTabs for non-gamer)
 *
 * If a Pastel-themed child somehow reaches this screen (e.g. theme switched
 * mid-session before tabs re-render), we render nothing rather than crash.
 */
import { useTheme } from '../../contexts/ThemeContext';
import GamerMyStatsScreen from './GamerMyStatsScreen';

export default function ChildMyStatsScreen() {
  const { themeName } = useTheme();

  if (themeName === 'gamer') {
    return <GamerMyStatsScreen />;
  }

  return null;
}
