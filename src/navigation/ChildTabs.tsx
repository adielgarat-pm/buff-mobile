import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChildTabsParamList } from './types';
import { useChildTheme, useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useMode } from '../contexts/ModeContext';
import { useAuth } from '../contexts/AuthContext';

import ChildDashboardScreen from '../screens/child/ChildDashboardScreen';
import ChildTasksScreen from '../screens/child/ChildTasksScreen';
import ChildBagPrepScreen from '../screens/child/ChildBagPrepScreen';
import ChildRewardsScreen from '../screens/child/ChildRewardsScreen';
import ChildMyStatsScreen from '../screens/child/ChildMyStatsScreen';
import ChildSettingsScreen from '../screens/child/ChildSettingsScreen';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator<ChildTabsParamList>();

const TAB_CONFIG: Record<
  keyof ChildTabsParamList,
  { labelKey: string; icon: IconName; iconActive: IconName }
> = {
  ChildDashboard: { labelKey: 'tabs.child.hq',     icon: 'game-controller-outline', iconActive: 'game-controller' },
  ChildTasks:     { labelKey: 'tabs.child.quests', icon: 'rocket-outline',           iconActive: 'rocket' },
  ChildBagPrep:   { labelKey: 'tabs.child.gear',   icon: 'briefcase-outline',        iconActive: 'briefcase' },
  ChildRewards:   { labelKey: 'tabs.child.shop',   icon: 'bag-outline',              iconActive: 'bag' },
  ChildMyStats:   { labelKey: 'tabs.child.stats',  icon: 'stats-chart-outline',      iconActive: 'stats-chart' },
  ChildSettings:  { labelKey: 'tabs.child.menu',   icon: 'menu-outline',             iconActive: 'menu' },
};

// Module-level constants — STABLE REFERENCES.
// React Navigation's reconciler treats option-prop identity changes as
// component changes; inline `() => null` and `{ display: 'none' }` literals
// created in the parent's render scope cause the tab item to thrash on every
// theme switch (the bug this package fixes). Defining them once at module
// scope keeps the reference identity stable across renders.
const HIDDEN_TAB_BUTTON = () => null;
const HIDDEN_TAB_OPTIONS: BottomTabNavigationOptions = {
  tabBarButton: HIDDEN_TAB_BUTTON,
  tabBarItemStyle: { display: 'none' },
};

export default function ChildTabs() {
  const T               = useChildTheme();
  const insets          = useSafeAreaInsets();
  const { t }           = useTranslation();
  const { isChildPreview, exitChildPreview } = useMode();
  const { profile }     = useAuth();
  const { themeName }   = useTheme();
  const isGamer         = themeName === 'gamer';

  // Memoize the global screenOptions function so its identity is stable
  // across renders that don't change visual tokens (e.g. previewBanner show/
  // hide). React Navigation re-evaluates options on every screenOptions
  // identity change — keeping it stable avoids unnecessary thrash.
  const screenOptions = useCallback(
    ({ route }: { route: { name: string } }) => {
      const cfg = TAB_CONFIG[route.name as keyof ChildTabsParamList];
      return {
        headerShown: false,
        tabBarActiveTintColor:   T.tabBarActive,
        tabBarInactiveTintColor: T.tabBarInactive,
        tabBarStyle: {
          backgroundColor: T.tabBar,
          borderTopColor:  T.tabBarBorder,
          borderTopWidth:  1,
          paddingBottom:   4 + insets.bottom,
          height:          56 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, marginTop: -2 },
        tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
          <Ionicons
            name={focused ? cfg.iconActive : cfg.icon}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: t(cfg.labelKey),
      };
    },
    [T.tabBarActive, T.tabBarInactive, T.tabBar, T.tabBarBorder, insets.bottom, t],
  );

  // MY STATS is a Gamer-only tab. We always render the <Tab.Screen> (stable
  // children — React Navigation expects this) and hide the tab button when
  // not in Gamer theme via module-level constant options (stable identity).
  const myStatsOptions = isGamer ? undefined : HIDDEN_TAB_OPTIONS;

  return (
    <View style={{ flex: 1 }}>
      {isChildPreview && (
        <TouchableOpacity
          style={[banner.strip, { paddingTop: insets.top || 12 }]}
          onPress={exitChildPreview}
          activeOpacity={0.85}
        >
          <Text style={banner.text}>
            {t('childTabs.previewBanner', { name: profile?.display_name ?? '' })}
          </Text>
          <Text style={banner.exit}>{t('childTabs.exitPreview')}</Text>
        </TouchableOpacity>
      )}

      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="ChildDashboard" component={ChildDashboardScreen} />
        <Tab.Screen name="ChildTasks"     component={ChildTasksScreen} />
        <Tab.Screen name="ChildBagPrep"   component={ChildBagPrepScreen} />
        <Tab.Screen name="ChildRewards"   component={ChildRewardsScreen} />
        <Tab.Screen name="ChildMyStats"   component={ChildMyStatsScreen} options={myStatsOptions} />
        <Tab.Screen name="ChildSettings"  component={ChildSettingsScreen} />
      </Tab.Navigator>
    </View>
  );
}

const banner = StyleSheet.create({
  strip: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  text:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  exit:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
});
