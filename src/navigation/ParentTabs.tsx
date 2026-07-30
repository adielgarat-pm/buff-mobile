import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { ParentTabsParamList } from './types';
import { PARENT_THEME } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { logOnboardingEvent } from '../lib/onboardingFunnel';

// Parent navigation audit (pkg/parent-ia-and-aha Phase 1). One nav-session id
// per JS launch + a monotonic sequence, so the tab-visit order and first-tab-
// of-session are reconstructable from onboarding_events with no schema. Module
// scope so they survive ParentTabs remounts within one launch.
const NAV_SESSION_ID = Math.random().toString(36).slice(2, 10);
let navSeq = 0;

import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import ParentTasksScreen from '../screens/parent/ParentTasksScreen';
import ParentRewardsScreen from '../screens/parent/ParentRewardsScreen';
import ParentTimetableScreen from '../screens/parent/TimetableScreen';
import ParentSettingsScreen from '../screens/parent/ParentSettingsScreen';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator<ParentTabsParamList>();

const TAB_CONFIG: Record<
  keyof ParentTabsParamList,
  { labelKey: string; icon: IconName; iconActive: IconName }
> = {
  ParentDashboard: { labelKey: 'tabs.parent.dashboard',  icon: 'home-outline',     iconActive: 'home' },
  ParentTasks:     { labelKey: 'tabs.parent.tasks',      icon: 'checkbox-outline', iconActive: 'checkbox' },
  ParentRewards:   { labelKey: 'tabs.parent.rewards',    icon: 'star-outline',     iconActive: 'star' },
  ParentTimetable: { labelKey: 'timetable.tabLabel',     icon: 'calendar-outline', iconActive: 'calendar' },
  ParentSettings:  { labelKey: 'tabs.parent.settings',   icon: 'settings-outline', iconActive: 'settings' },
};

export default function ParentTabs() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { familyId } = useAuth();

  return (
    <Tab.Navigator
      screenListeners={({ route }) => ({
        focus: () => {
          const seq = navSeq++;
          void logOnboardingEvent({
            familyId,
            eventType: 'parent_tab_viewed',
            source:    route.name,   // verbatim — survives the tab rename
            method:    seq === 0 ? 'initial' : 'tab_press',
            variant:   `${NAV_SESSION_ID}:${seq}`,
          });
        },
      })}
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name as keyof ParentTabsParamList];
        return {
          headerShown: false,
          lazy: true,
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
          tabBarLabel: t(cfg.labelKey),
        };
      }}
    >
      <Tab.Screen name="ParentDashboard"  component={ParentDashboardScreen} />
      <Tab.Screen name="ParentTasks"      component={ParentTasksScreen} />
      <Tab.Screen name="ParentRewards"    component={ParentRewardsScreen} />
      <Tab.Screen name="ParentTimetable"  component={ParentTimetableScreen} />
      <Tab.Screen name="ParentSettings"   component={ParentSettingsScreen} />
    </Tab.Navigator>
  );
}
