import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChildTabsParamList } from './types';
import { useChildTheme, useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useMode } from '../contexts/ModeContext';
import { useAuth } from '../contexts/AuthContext';

import ChildDashboardScreen from '../screens/child/ChildDashboardScreen';
import ChildTasksScreen from '../screens/child/ChildTasksScreen';
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
  ChildRewards:   { labelKey: 'tabs.child.shop',   icon: 'bag-outline',              iconActive: 'bag' },
  ChildMyStats:   { labelKey: 'tabs.child.stats',  icon: 'stats-chart-outline',      iconActive: 'stats-chart' },
  ChildSettings:  { labelKey: 'tabs.child.menu',   icon: 'menu-outline',             iconActive: 'menu' },
};

export default function ChildTabs() {
  const T               = useChildTheme();
  const insets          = useSafeAreaInsets();
  const { t }           = useTranslation();
  const { isChildPreview, exitChildPreview } = useMode();
  const { profile }     = useAuth();
  const { themeName }   = useTheme();
  const isGamer         = themeName === 'gamer';

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

    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name as keyof ChildTabsParamList];
        const isMyStatsTab = route.name === 'ChildMyStats';
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? cfg.iconActive : cfg.icon}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: t(cfg.labelKey),
          // Hide the MY STATS tab for Pastel theme without unmounting the
          // route — keeps React Navigation's state stable across runtime
          // theme switches. (Conditional <Tab.Screen> rendering breaks
          // the navigator when themeName changes after mount.)
          tabBarItemStyle: isMyStatsTab && !isGamer ? { display: 'none' } : undefined,
          tabBarButton: isMyStatsTab && !isGamer ? () => null : undefined,
        };
      }}
    >
      <Tab.Screen name="ChildDashboard" component={ChildDashboardScreen} />
      <Tab.Screen name="ChildTasks"     component={ChildTasksScreen} />
      <Tab.Screen name="ChildRewards"   component={ChildRewardsScreen} />
      <Tab.Screen name="ChildMyStats"   component={ChildMyStatsScreen} />
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
