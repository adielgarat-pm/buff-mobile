/**
 * Child My Stats — router that picks the right layout per theme.
 *   Gamer theme → GamerMyStatsScreen (Stitch 5B-lite)
 *   Pastel/Mint → redirects to Dashboard (the tab itself is hidden in
 *                 ChildTabs for non-gamer; the redirect is a safety net
 *                 for the case where the user was on this tab when the
 *                 theme switched).
 */
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import GamerMyStatsScreen from './GamerMyStatsScreen';
import type { ChildTabsParamList } from '../../navigation/types';

export default function ChildMyStatsScreen() {
  const { themeName } = useTheme();
  const navigation = useNavigation<NavigationProp<ChildTabsParamList>>();

  useEffect(() => {
    if (themeName !== 'gamer') {
      navigation.navigate('ChildDashboard');
    }
  }, [themeName, navigation]);

  if (themeName === 'gamer') {
    return <GamerMyStatsScreen />;
  }

  return null;
}
