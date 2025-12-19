import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../config/i18n';

import { useOffline } from '@/hooks/use-offline';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
// Import the Custom Theme Provider and Hook
import { ThemeProviderCustom, useTheme } from '@/contexts/theme-contexts';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  // Use our custom hook instead of the raw useColorScheme
  const { isDarkMode } = useTheme();

  const { isOnline, pendingCount, isSyncing } = useOffline();
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // check auth
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'modal';
    const isLoginpage = segments[0] === 'login';

    if (!isAuthenticated && inAuthGroup) {
      return router.replace('/login');
    } else if (isAuthenticated && isLoginpage) {
      return router.replace('/(tabs)');
    }
  }, [segments, isLoading, isAuthenticated, router])

  useEffect(() => {
    if (segments[0] === '(tabs)' && !isLoading && !isAuthenticated) {
      refreshAuth();
    }
  }, [segments, isLoading, isAuthenticated, router])

  return (
      // Apply the navigation theme based on our calculated isDarkMode
      <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>

        {/*Banner Offline*/}
        {!isOnline && (
            <View style={styles.offlineBanner}>
              <Ionicons name='cloud-offline-outline' size={16} color='#fff' />
              <Text style={styles.bannerText}>
                Hors ligne {pendingCount > 0 && `• ${pendingCount} en attente`}
              </Text>
            </View>
        )}

        {/*Banner Sync */}
        {isOnline && pendingCount > 0 && (
            <TouchableOpacity>
              <View style={styles.syncBanner}>
                <Ionicons
                    name={isSyncing ? "sync" : "sync-outline"}
                    size={16}
                    color="#fff"
                />
                <Text style={styles.bannerText}>
                  {isSyncing
                      ? 'Synchronisation...'
                      : `Synchroniser ${pendingCount} action(s)`}
                </Text>
              </View>
            </TouchableOpacity>
        )}

        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        {/* Update Status Bar style based on theme */}
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 50,
    gap: 8,
  },
  syncBanner: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 50,
    gap: 8,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default function RootLayout() {
  return (
      <AuthProvider>
        {/* Wrap everything in ThemeProviderCustom */}
        <ThemeProviderCustom>
          <RootLayoutContent />
        </ThemeProviderCustom>
      </AuthProvider>
  );
}
