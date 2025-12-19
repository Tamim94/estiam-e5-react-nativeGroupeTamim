import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOffline } from '@/hooks/use-offline';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
import { ThemeProviderCustom, useTheme } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const systemScheme = useColorScheme();
  const { isDarkMode } = useTheme();

  const { isOnline, pendingCount, isSyncing } = useOffline();
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'modal';
    const isLoginpage = segments[0] === 'login';

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && isLoginpage) {
      router.replace('/(tabs)');
    }
  }, [segments, isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (segments[0] === '(tabs)' && !isLoading && !isAuthenticated) {
      refreshAuth();
    }
  }, [segments, isLoading, isAuthenticated]);

  const theme =
      isDarkMode
          ? DarkTheme
          : systemScheme === 'dark'
              ? DarkTheme
              : DefaultTheme;

  return (
      <ThemeProvider value={theme}>
        {!isOnline && (
            <View style={styles.offlineBanner}>
              <Ionicons name='cloud-offline-outline' size={16} color='#fff' />
              <Text style={styles.bannerText}>
                Hors ligne {pendingCount > 0 && `• ${pendingCount} en attente`}
              </Text>
            </View>
        )}

        {isOnline && pendingCount > 0 && (
            <TouchableOpacity style={styles.syncBanner}>
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
            </TouchableOpacity>
        )}

        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>

        <StatusBar style={isDarkMode ? "light" : "auto"} />
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
        <ThemeProviderCustom>
          <RootLayoutContent />
        </ThemeProviderCustom>
      </AuthProvider>
  );
}
