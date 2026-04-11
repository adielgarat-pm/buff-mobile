import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChildTabsParamList } from './types';
import { useChildTheme } from '../contexts/ThemeContext';
import { useMode } from '../contexts/ModeContext';
import { useAuth } from '../contexts/AuthContext';

import ChildDashboardScreen from '../screens/child/ChildDashboardScreen';
import ChildTasksScreen from '../screens/child/ChildTasksScreen';
import ChildRewardsScreen from '../screens/child/ChildRewardsScreen';
import ChildSettingsScreen from '../screens/child/ChildSettingsScreen';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator<ChildTabsParamList>();

const TAB_CONFIG: Record<
  keyof ChildTabsParamList,
  { label: string; icon: IconName; iconActive: IconName }
> = {
  ChildDashboard: { label: 'HQ',       icon: 'game-controller-outline', iconActive: 'game-controller' },
  ChildTasks:     { label: 'Missions', icon: 'rocket-outline',           iconActive: 'rocket' },
  ChildRewards:   { label: 'Shop',     icon: 'bag-outline',              iconActive: 'bag' },
  ChildSettings:  { label: 'Menu',     icon: 'menu-outline',             iconActive: 'menu' },
};

export default function ChildTabs() {
  const T               = useChildTheme();
  const insets          = useSafeAreaInsets();
  const { isChildPreview, exitChildPreview } = useMode();
  const { profile }     = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {isChildPreview && (
        <TouchableOpacity
          style={[banner.strip, { paddingTop: insets.top || 12 }]}
          onPress={exitChildPreview}
          activeOpacity={0.85}
        >
          <Text style={banner.text}>
            👁 Viewing as parent — {profile?.display_name ?? 'Parent'}
          </Text>
          <Text style={banner.exit}>✕ Exit</Text>
        </TouchableOpacity>
      )}

    <Tab.Navigator
      screenOptions={({ route }) => {
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
      <Tab.Screen name="ChildDashboard" component={ChildDashboardScreen} />
      <Tab.Screen name="ChildTasks"     component={ChildTasksScreen} />
      <Tab.Screen name="ChildRewards"   component={ChildRewardsScreen} />
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
