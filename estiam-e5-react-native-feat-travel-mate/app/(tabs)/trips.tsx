import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { API, Trip } from '@/services/api';
import IMAGES_SOURCES from './index';
import { toggleFavorite as toggleFavoriteStorage } from '@/services/favorites';
import { useTheme } from '@/contexts/theme-context';

export default function TripsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] =
      useState<'All' | 'Upcoming' | 'Past' | 'Favorites'>('All');
  const [query, setQuery] = useState('');

  const tabs = ['All', 'Upcoming', 'Past', 'Favorites'] as const;

  useFocusEffect(
      useCallback(() => {
        let mounted = true;

        const loadTrips = async () => {
          try {
            setLoading(true);
            const data = await API.getTrips();
            if (mounted) setTrips(data);
          } catch (e) {
            console.error('Failed to load trips', e);
          } finally {
            if (mounted) setLoading(false);
          }
        };

        loadTrips();
        return () => {
          mounted = false;
        };
      }, [])
  );

  const toggleFavorite = async (id: string) => {
    const updatedFavorites = await toggleFavoriteStorage(id);

    setTrips(prev =>
        prev.map(trip => ({
          ...trip,
          isFavorite: updatedFavorites.includes(trip.id!),
        }))
    );
  };

  const filteredTrips = useMemo(() => {
    const now = new Date();

    return trips
        .filter(trip => {
          if (selectedTab === 'Upcoming') {
            return new Date(trip.startDate) > now;
          }
          if (selectedTab === 'Past') {
            return new Date(trip.endDate) < now;
          }
          if (selectedTab === 'Favorites') {
            return trip.isFavorite;
          }
          return true;
        })
        .filter(trip => {
          if (!query.trim()) return true;
          const q = query.toLowerCase();
          return (
              trip.title.toLowerCase().includes(q) ||
              trip.destination.toLowerCase().includes(q)
          );
        });
  }, [trips, selectedTab, query]);

  return (
      <SafeAreaView
          style={[styles.container, isDarkMode && styles.containerDark]}
          edges={['top']}
      >
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.cardDark]}>
          <Text style={[styles.HeaderTitle, isDarkMode && styles.textDark]}>
            My Trips
          </Text>

          <View style={[styles.searchBar, isDarkMode && styles.searchBarDark]}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
                style={[styles.searchInput, isDarkMode && styles.textDark]}
                placeholder="Search trips"
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={setQuery}
            />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {tabs.map(tab => (
                <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      isDarkMode && styles.tabDark,
                      selectedTab === tab && styles.tabActive,
                    ]}
                    onPress={() => setSelectedTab(tab)}
                >
                  <Text
                      style={[
                        styles.tabText,
                        isDarkMode && styles.textMutedDark,
                        selectedTab === tab && styles.tabTextActive,
                      ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Trips */}
          <View style={styles.list}>
            {!loading && filteredTrips.length === 0 && (
                <Text style={styles.empty}>No trips found</Text>
            )}

            {filteredTrips.map(trip => (
                <TouchableOpacity
                    key={trip.id}
                    style={[styles.card, isDarkMode && styles.cardDark]}
                >
                  <View style={styles.imageContainer}>
                    <Image
                        source={
                          IMAGES_SOURCES[trip.image as keyof typeof IMAGES_SOURCES]
                              ? IMAGES_SOURCES[trip.image as keyof typeof IMAGES_SOURCES]
                              : trip.image
                                  ? { uri: trip.image }
                                  : undefined
                        }
                        style={styles.image}
                    />
                    <View style={styles.overlay} />

                    <TouchableOpacity
                        style={styles.favorite}
                        onPress={() => toggleFavorite(trip.id!)}
                    >
                      <Ionicons
                          name={trip.isFavorite ? 'heart' : 'heart-outline'}
                          size={24}
                          color={trip.isFavorite ? '#ec4899' : 'white'}
                      />
                    </TouchableOpacity>

                    <View style={styles.imageContent}>
                      <Text style={styles.title}>{trip.title}</Text>
                      <Text style={styles.location}>{trip.destination}</Text>
                    </View>
                  </View>

                  <View style={styles.info}>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text style={styles.date}>
                      {new Date(trip.startDate).toLocaleDateString('fr-FR')} –{' '}
                      {new Date(trip.endDate).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/modal/add-trip')}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  containerDark: { backgroundColor: '#111827' },

  header: { padding: 24, backgroundColor: '#fff' },
  HeaderTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 16 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  searchBarDark: { backgroundColor: '#1f2933' },
  searchInput: { flex: 1, fontSize: 16 },

  tabs: { paddingHorizontal: 24, paddingVertical: 16 },
  tab: { padding: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 8 },
  tabDark: { backgroundColor: '#1f2933' },
  tabActive: { backgroundColor: '#a855f7' },

  tabText: { color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  list: { paddingHorizontal: 24 },
  empty: { textAlign: 'center', marginTop: 40, color: '#6b7280' },

  card: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 16 },
  cardDark: { backgroundColor: '#1f2933' },

  imageContainer: { height: 180 },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },

  favorite: { position: 'absolute', top: 12, right: 12 },

  imageContent: { position: 'absolute', bottom: 16, left: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  location: { color: '#fff' },

  info: { padding: 16, flexDirection: 'row', gap: 8 },
  date: { color: '#6b7280' },

  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textDark: { color: '#f9fafb' },
  textMutedDark: { color: '#9ca3af' },
});
