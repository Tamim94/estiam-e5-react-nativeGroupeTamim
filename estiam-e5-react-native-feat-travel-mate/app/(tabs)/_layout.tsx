import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HapticTab } from '@/components/haptic-tab';
import { useTranslation } from '@/hooks/use-translation';
import { useTheme } from '@/contexts/theme-contexts';

// Using the same Purple from your Home/Profile screens
const PRIMARY_COLOR = '#a855f7';
const INACTIVE_COLOR = '#9ca3af'; // Gray

export default function TabLayout() {
  const { t } = useTranslation();
  const { isDarkMode, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // Set the active color to your theme purple
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: isDarkMode ? '#9ca3af' : '#6b7280',
        headerShown: false,
        tabBarButton: HapticTab,
        // Styling the Tab Bar to look cleaner
        tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 0,
            elevation: 0, // Remove shadow on Android
            shadowColor: '#000', // Subtle shadow on iOS
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
            paddingTop: 10,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            color: colors.text,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: t('tabs.trips'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
                name={focused ? "map" : "map-outline"}
                size={24}
                color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notification"
        options={{
            title: 'Alerts',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons
                    name={focused ? "notifications" : "notifications-outline"}
                    size={24}
                    color={color}
                />
            ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}