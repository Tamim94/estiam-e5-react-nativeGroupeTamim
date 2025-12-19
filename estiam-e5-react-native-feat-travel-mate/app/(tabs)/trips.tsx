import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { API, Trip } from "@/services/api";
import IMAGES_SOURCES from "./index";
import { toggleFavorite as toggleFavoriteStorage } from "@/services/favorites";

export default function TripsScreen() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "All" | "Upcoming" | "Past" | "Favorites"
  >("All");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const tabs: readonly ("All" | "Upcoming" | "Past" | "Favorites")[] = [
    "All",
    "Upcoming",
    "Past",
    "Favorites",
  ];

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadTrips = async () => {
        try {
          setLoading(true);
          const data = await API.getTrips();
          if (mounted) setTrips(data);
        } catch (e) {
          console.error("Failed to load trips", e);
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
    setTrips((prev) =>
      prev.map((trip) => ({
        ...trip,
        isFavorite: updatedFavorites.includes(trip.id!),
      }))
    );
  };

  const filteredTrips = useMemo(() => {
    const now = new Date();

    return trips
      .filter((trip) => {
        if (selectedTab === "Upcoming") {
          return new Date(trip.startDate) > now;
        }
        if (selectedTab === "Past") {
          return new Date(trip.endDate) < now;
        }
        if (selectedTab === "Favorites") {
          return trip.isFavorite;
        }
        return true;
      })
      .filter((trip) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          trip.title.toLowerCase().includes(q) ||
          trip.destination.toLowerCase().includes(q)
        );
      });
  }, [trips, selectedTab, query]);

  const tripsWithLocation = useMemo(() => {
    return filteredTrips.filter(
      (trip) =>
        trip.location &&
        typeof trip.location.lat === "number" &&
        typeof trip.location.lng === "number"
    );
  }, [filteredTrips]);

  const getMapHTML = () => {
    const markers = tripsWithLocation
      .map(
        (trip) => `
        {
          lat: ${trip.location!.lat},
          lng: ${trip.location!.lng},
          title: "${trip.title.replace(/"/g, '\\"')}",
          destination: "${trip.destination.replace(/"/g, '\\"')}",
          id: "${trip.id}"
        }
      `
      )
      .join(",");

    const centerLat =
      tripsWithLocation.length > 0
        ? tripsWithLocation.reduce((sum, t) => sum + t.location!.lat, 0) /
          tripsWithLocation.length
        : 48.8566;

    const centerLng =
      tripsWithLocation.length > 0
        ? tripsWithLocation.reduce((sum, t) => sum + t.location!.lng, 0) /
          tripsWithLocation.length
        : 2.3522;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          #map { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const markers = [${markers}];
          const map = L.map('map').setView([${centerLat}, ${centerLng}], ${
      tripsWithLocation.length > 0 ? 4 : 2
    });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          const purpleIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: linear-gradient(135deg, #a855f7, #ec4899); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          markers.forEach(m => {
            const marker = L.marker([m.lat, m.lng], { icon: purpleIcon }).addTo(map);
            marker.bindPopup('<b>' + m.title + '</b><br>' + m.destination);
            marker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                id: m.id
              }));
            });
          });

          if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "markerClick") {
        const trip = trips.find((t) => t.id === data.id);
        if (trip) setSelectedTrip(trip);
      }
    } catch (e) {
      console.error("Map message error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Trips</Text>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
          >
            <Ionicons
              name={viewMode === "list" ? "map" : "list"}
              size={24}
              color="#a855f7"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trips"
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Tabs - Use View wrapper with fixed height */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {viewMode === "list" ? (
        <ScrollView
          style={styles.listScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {loading && (
            <Text style={styles.loadingText}>Loading...</Text>
          )}

          {!loading && filteredTrips.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="airplane-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No trips found</Text>
              <Text style={styles.emptySubtext}>
                {selectedTab === "Past"
                  ? "You don't have any past trips yet"
                  : selectedTab === "Upcoming"
                  ? "You don't have any upcoming trips"
                  : selectedTab === "Favorites"
                  ? "You haven't favorited any trips"
                  : "Start by adding your first trip!"}
              </Text>
            </View>
          )}

          {filteredTrips.map((trip) => (
            <TouchableOpacity key={trip.id} style={styles.card}>
              <View style={styles.imageContainer}>
                <Image
                  source={
                    IMAGES_SOURCES[trip.image as keyof typeof IMAGES_SOURCES]
                      ? IMAGES_SOURCES[
                          trip.image as keyof typeof IMAGES_SOURCES
                        ]
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
                    name={trip.isFavorite ? "heart" : "heart-outline"}
                    size={24}
                    color={trip.isFavorite ? "#ec4899" : "white"}
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
                  {new Date(trip.startDate).toLocaleDateString("fr-FR")} –{" "}
                  {new Date(trip.endDate).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          {tripsWithLocation.length === 0 ? (
            <View style={styles.noLocationContainer}>
              <Ionicons name="map-outline" size={64} color="#d1d5db" />
              <Text style={styles.noLocationText}>
                Aucun voyage avec localisation
              </Text>
              <Text style={styles.noLocationSubtext}>
                Ajoutez des coordonnées à vos voyages pour les voir sur la carte
              </Text>
            </View>
          ) : (
            <WebView
              source={{ html: getMapHTML() }}
              style={styles.mapWebView}
              onMessage={handleMapMessage}
              javaScriptEnabled
            />
          )}
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/modal/add-trip")}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Trip Detail Modal */}
      <Modal
        visible={!!selectedTrip}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTrip(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTrip && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTrip.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Ionicons name="location" size={18} color="#a855f7" />
                    <Text style={styles.modalText}>
                      {selectedTrip.destination}
                    </Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Ionicons name="calendar" size={18} color="#a855f7" />
                    <Text style={styles.modalText}>
                      {new Date(selectedTrip.startDate).toLocaleDateString(
                        "fr-FR"
                      )}{" "}
                      –{" "}
                      {new Date(selectedTrip.endDate).toLocaleDateString(
                        "fr-FR"
                      )}
                    </Text>
                  </View>

                  {selectedTrip.description && (
                    <Text style={styles.modalDescription}>
                      {selectedTrip.description}
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb"
  },
  header: {
    padding: 24,
    backgroundColor: "#fff"
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#faf5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  // Fixed tabs - use View instead of ScrollView
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#f9fafb",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  tabActive: {
    backgroundColor: "#a855f7",
  },
  tabText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#fff"
  },

  // List
  listScrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    color: "#6b7280",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 14,
    paddingHorizontal: 40,
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 180,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  favorite: {
    position: "absolute",
    top: 12,
    right: 12
  },
  imageContent: {
    position: "absolute",
    bottom: 16,
    left: 16
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold"
  },
  location: {
    color: "#fff",
    marginTop: 4,
  },
  info: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  date: {
    color: "#6b7280"
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#a855f7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Map
  mapContainer: {
    flex: 1
  },
  mapWebView: {
    flex: 1
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noLocationText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
  },
  noLocationSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  modalBody: {
    gap: 12
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalText: {
    fontSize: 15,
    color: "#374151",
  },
  modalDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    lineHeight: 20,
  },
});