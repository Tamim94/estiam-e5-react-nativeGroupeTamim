import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { API, Trip } from '@/services/api';
import IMAGES_SOURCES from './trips';

// Keep colors for consistency
const PURPLE = '#a855f7';
const PINK = '#ec4899';
const GRAY = '#6b7280';
const BG = '#f9fafb';

export default function HomeScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        try {
          setLoading(true);
          const data = await API.getTrips();
          if (mounted) setTrips(data);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const now = new Date();

  const upcomingTrips = useMemo(
    () => trips.filter((t) => new Date(t.startDate) > now).slice(0, 5),
    [trips]
  );

  // Redesigned Stats Configuration
  const statsConfig = [
    {
      label: 'Total Trips',
      value: trips.length,
      icon: 'map-outline',
      colors: ['#a855f7', '#ec4899'] as const,
    },
    {
      label: 'Upcoming',
      value: upcomingTrips.length,
      icon: 'calendar-outline',
      colors: ['#3b82f6', '#06b6d4'] as const,
    },
    {
      label: 'Favorites',
      value: trips.filter((t) => t.isFavorite).length,
      icon: 'heart-outline',
      colors: ['#ef4444', '#f43f5e'] as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient colors={[PURPLE, PINK]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSubtitle}>Hello, Traveler</Text>
              <Text style={styles.headerTitle}>Welcome 👋</Text>
            </View>
            {/* Optional: Add user avatar here if needed */}
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          {/* Stats Card (Floating Effect) */}
          <View style={styles.statsCard}>
            <View style={styles.statsGrid}>
              {statsConfig.map((stat, idx) => (
                <View key={idx} style={styles.statItem}>
                  <LinearGradient
                    colors={stat.colors}
                    style={styles.statIcon}
                  >
                    <Ionicons
                      name={stat.icon as any}
                      size={20}
                      color="white"
                    />
                  </LinearGradient>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Upcoming Trips */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming trips</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
                <Text style={styles.link}>See all</Text>
              </TouchableOpacity>
            </View>

            {upcomingTrips.length === 0 && !loading && (
              <Text style={styles.empty}>No upcoming trips scheduled.</Text>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingTrips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => router.push('/(tabs)/trips')}
                >
                  <Image
                    source={
                      IMAGES_SOURCES[trip.image as keyof typeof IMAGES_SOURCES]
                        ? IMAGES_SOURCES[trip.image as keyof typeof IMAGES_SOURCES]
                        : trip.image
                        ? { uri: trip.image }
                        : undefined
                    }
                    style={styles.tripImage}
                  />

                  {/* Overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.overlay}
                  />

                  {/* Favorite Badge */}
                  {trip.isFavorite && (
                    <View style={styles.favoriteBadge}>
                      <Ionicons name="heart" size={16} color="white" />
                    </View>
                  )}

                  {/* Content */}
                  <View style={styles.tripContent}>
                    <Text style={styles.tripTitle}>{trip.title}</Text>
                    <View style={styles.tripMetaRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="rgba(255,255,255,0.8)"
                      />
                      <Text style={styles.tripDestination}>
                        {trip.destination}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quick Actions (Styled like Profile Menu Items) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick actions</Text>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/modal/add-trip')}
            >
              <LinearGradient
                colors={['#a855f7', '#ec4899']}
                style={styles.actionIconBox}
              >
                <Ionicons name="add" size={24} color="white" />
              </LinearGradient>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Add a trip</Text>
                <Text style={styles.actionSubtitle}>
                  Plan a new adventure
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GRAY} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(tabs)/trips')}
            >
              <LinearGradient
                colors={['#f43f5e', '#ef4444']}
                style={styles.actionIconBox}
              >
                <Ionicons name="heart" size={24} color="white" />
              </LinearGradient>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>View favorites</Text>
                <Text style={styles.actionSubtitle}>
                  See your bucket list
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GRAY} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  /* Header Styles */
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100, // Large padding for overlap
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: 'white',
  },

  /* Main Content Overlay */
  contentContainer: {
    marginTop: -70, // Overlaps the header
    paddingHorizontal: 24,
  },

  /* Stats Card */
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: GRAY,
    fontWeight: '500',
  },

  /* Sections */
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  link: {
    color: PURPLE,
    fontWeight: '600',
    fontSize: 14,
  },
  empty: {
    color: GRAY,
    fontStyle: 'italic',
  },

  /* Trip Cards */
  tripCard: {
    width: 280,
    height: 180,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(236, 72, 153, 0.9)', // Pink with opacity
    padding: 8,
    borderRadius: 50,
    backdropFilter: 'blur(4px)',
  },
  tripContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  tripTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripDestination: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },

  /* Quick Action Items (Styled like Profile Menu) */
  actionItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: GRAY,
  },
});