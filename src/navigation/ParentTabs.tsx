import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ParentTabsParamList } from './types';
import { PARENT_THEME } from '../theme';

import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import ParentTasksScreen from '../screens/parent/ParentTasksScreen';
import ParentRewardsScreen from '../screens/parent/ParentRewardsScreen';
import ParentSettingsScreen from '../screens/parent/ParentSettingsScreen';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator<ParentTabsParamList>();

const TAB_CONFIG: Record<
  keyof ParentTabsParamList,
  { label: string; icon: IconName; iconActive: IconName }
> = {
  ParentDashboard: { label: 'Dashboard', icon: 'home-outline',     iconActive: 'home' },
  ParentTasks:     { label: 'Tasks',     icon: 'checkbox-outline', iconActive: 'checkbox' },
  ParentRewards:   { label: 'Rewards',   icon: 'star-outline',     iconActive: 'star' },
  ParentSettings:  { label: 'Settings',  icon: 'settings-outline', iconActive: 'settings' },
};

export default function ParentTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name as keyof ParentTabsParamList];
        return {
          headerShown: false,
          tabBarActiveTintColor: PARENT_THEME.accent,
          tabBarInactiveTintColor: PARENT_THEME.textMuted,
          tabBarStyle: {
            backgroundColor: PARENT_THEME.tabBar,
            borderTopColor: PARENT_THEME.tabBarBorder,
            borderTopWidth: 1,
            paddingBottom: 4 + insets.bottom,
            height: 56 + insets.bottom,
          },
          tabBarLabelStyle: { fontSize: 11, marginTop: -2 },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? cfg.iconActive : cfg.icon}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: cfg.label,
        };
      }}
    >
      <Tab.Screen name="ParentDashboard" component={ParentDashboardScreen} />
      <Tab.Screen name="ParentTasks"     component={ParentTasksScreen} />
      <Tab.Screen name="ParentRewards"   component={ParentRewardsScreen} />
      <Tab.Screen name="ParentSettings"  component={ParentSettingsScreen} />
    </Tab.Navigator>
  );
}
