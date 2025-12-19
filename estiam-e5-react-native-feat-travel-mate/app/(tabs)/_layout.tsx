import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/contexts/theme-context';

// Theme colors
const PRIMARY_COLOR = '#a855f7';
const INACTIVE_LIGHT = '#9ca3af';
const INACTIVE_DARK = '#6b7280';

export default function TabLayout() {
    const { isDarkMode } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: HapticTab,

                tabBarActiveTintColor: PRIMARY_COLOR,
                tabBarInactiveTintColor: isDarkMode
                    ? INACTIVE_DARK
                    : INACTIVE_LIGHT,

                tabBarStyle: {
                    backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: isDarkMode ? 0.4 : 0.05,
                    shadowRadius: 10,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                },

                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'home' : 'home-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="trips"
                options={{
                    title: 'Trips',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'map' : 'map-outline'}
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
                            name={focused ? 'notifications' : 'notifications-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'person' : 'person-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
