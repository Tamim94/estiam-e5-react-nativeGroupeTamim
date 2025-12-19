import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { API, Trip } from "@/services/api";
import IMAGES_SOURCES from "./trips"; // Ensure this path is correct
import { toggleFavorite as toggleFavoriteStorage } from "@/services/favorites";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/contexts/theme-contexts";

export default function TripsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  // Get theme values
  const { colors, isDarkMode } = useTheme();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const getTabLabel = (tab: "All" | "Upcoming" | "Past" | "Favorites") => {
    const labels = {
      All: t("trips.all"),
      Upcoming: t("trips.upcoming"),
      Past: t("trips.past"),
      Favorites: t("trips.favorites"),
    };
    return labels[tab];
  };

  const loadTrips = useCallback(async () => {
    try {
      const data = await API.getTrips();
      setTrips(data);
    } catch (e) {
      console.error("Failed to load trips", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const fetchTrips = async () => {
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
      fetchTrips();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  const toggleFavorite = async (id: string) => {
    const updatedFavorites = await toggleFavoriteStorage(id);
    setTrips((prev) =>
      prev.map((trip) => ({
        ...trip,
        isFavorite: updatedFavorites.includes(trip.id!),
      }))
    );
  };

  const handleTripPress = (trip: Trip) => {
    router.push(`/trips/${trip.id}`);
  };

  const handleDeleteTrip = (trip: Trip) => {
    Alert.alert(t("trips.deleteTrip"), t("trips.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await API.deleteTrip(trip.id!);
            setTrips((prev) => prev.filter((t) => t.id !== trip.id));
            Alert.alert(t("common.success"), t("trips.deleteSuccess"));
          } catch (error) {
            console.error("Failed to delete trip", error);
            Alert.alert(t("common.error"), t("trips.deleteError"));
          }
        },
      },
    ]);
  };

  const filteredTrips = useMemo(() => {
    const now = new Date();
    return trips
      .filter((trip) => {
        if (selectedTab === "Upcoming") return new Date(trip.startDate) > now;
        if (selectedTab === "Past") return new Date(trip.endDate) < now;
        if (selectedTab === "Favorites") return trip.isFavorite;
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
          #map { width: 100%; height: 100vh; background-color: ${isDarkMode ? '#1f2937' : '#fff'}; }
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

  const handleModalViewDetails = () => {
    if (selectedTrip) {
      setSelectedTrip(null);
      router.push(`/trips/${selectedTrip.id}`);
    }
  };

  const handleModalEdit = () => {
    if (selectedTrip) {
      setSelectedTrip(null);
      router.push(`/modal/edit-trip?id=${selectedTrip.id}`);
    }
  };

  // --- Dynamic Styles based on Theme ---
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.backgroundSecondary, // Changed from card to match iOS style headers usually
    },
    headerTitle: {
      color: colors.text,
    },
    viewToggle: {
      backgroundColor: isDarkMode ? "#374151" : "#faf5ff",
    },
    searchBar: {
      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
    },
    searchInput: {
      color: colors.text,
    },
    tabsContainer: {
      backgroundColor: colors.background,
    },
    tab: (active: boolean) => ({
      backgroundColor: active ? "#a855f7" : isDarkMode ? "#374151" : "#e5e7eb",
    }),
    tabText: (active: boolean) => ({
      color: active ? "#fff" : colors.textSecondary,
    }),
    card: {
      backgroundColor: colors.card,
    },
    dateText: {
      color: colors.textSecondary, // Fixes dark mode date visibility
    },
    cardActionButton: {
      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6", // Fixes button visibility
    },
    modalContent: {
      backgroundColor: colors.card,
    },
    modalText: {
      color: colors.text,
    },
    modalDescription: {
      color: colors.textSecondary,
    },
    loadingText: {
      color: colors.textSecondary,
    },
    emptyText: {
      color: colors.textSecondary,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>{t("trips.myTrips")}</Text>
          <TouchableOpacity
            style={[styles.viewToggle, dynamicStyles.viewToggle]}
            onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
          >
            <Ionicons
              name={viewMode === "list" ? "map" : "list"}
              size={24}
              color="#a855f7"
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, dynamicStyles.searchBar]}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={[styles.searchInput, dynamicStyles.searchInput]}
            placeholder={t("trips.searchTrips")}
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9ca3af"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, dynamicStyles.tabsContainer]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, dynamicStyles.tab(selectedTab === tab)]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, dynamicStyles.tabText(selectedTab === tab)]}>
              {getTabLabel(tab)}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
              colors={["#a855f7"]}
            />
          }
        >
          {loading && <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading...</Text>}

          {!loading && filteredTrips.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="airplane-outline" size={64} color="#d1d5db" />
              <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No trips found</Text>
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
            <TouchableOpacity
              key={trip.id}
              style={[styles.card, dynamicStyles.card]}
              onPress={() => handleTripPress(trip)}
              onLongPress={() => handleDeleteTrip(trip)}
              delayLongPress={500}
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
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(trip.id!);
                  }}
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

              <View style={styles.cardFooter}>
                <View style={styles.info}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.date, dynamicStyles.dateText]}>
                    {new Date(trip.startDate).toLocaleDateString("fr-FR")} –{" "}
                    {new Date(trip.endDate).toLocaleDateString("fr-FR")}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.cardActionButton, dynamicStyles.cardActionButton]}
                    onPress={() => router.push(`/modal/edit-trip?id=${trip.id}`)}
                  >
                    <Ionicons name="create-outline" size={18} color="#a855f7" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardActionButton, dynamicStyles.cardActionButton]}
                    onPress={() => handleDeleteTrip(trip)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
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
              <Text style={[styles.noLocationText, dynamicStyles.emptyText]}>
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

      {/* Trip Detail Modal (from map) */}
      <Modal
        visible={!!selectedTrip}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTrip(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            {selectedTrip && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, dynamicStyles.modalText]}>{selectedTrip.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Ionicons name="location" size={18} color="#a855f7" />
                    <Text style={[styles.modalText, dynamicStyles.modalText]}>
                      {selectedTrip.destination}
                    </Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Ionicons name="calendar" size={18} color="#a855f7" />
                    <Text style={[styles.modalText, dynamicStyles.modalText]}>
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
                    <Text style={[styles.modalDescription, dynamicStyles.modalDescription]}>
                      {selectedTrip.description}
                    </Text>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={handleModalViewDetails}
                  >
                    <Ionicons name="eye-outline" size={20} color="#a855f7" />
                    <Text style={styles.modalActionText}>
                      {t("common.view")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={handleModalEdit}
                  >
                    <Ionicons name="create-outline" size={20} color="#a855f7" />
                    <Text style={styles.modalActionText}>
                      {t("common.edit")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.deleteAction]}
                    onPress={() => {
                      setSelectedTrip(null);
                      handleDeleteTrip(selectedTrip);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={styles.deleteActionText}>
                      {t("common.delete")}
                    </Text>
                  </TouchableOpacity>
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
  },
  header: {
    padding: 24,
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
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabText: {
    fontWeight: "600",
    fontSize: 14,
  },
  listScrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 40,
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
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    paddingHorizontal: 40,
  },
  card: {
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
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  favorite: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  imageContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  location: {
    color: "#fff",
    marginTop: 4,
  },
  cardFooter: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  date: {
    // color handled dynamically
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  cardActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
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
  mapContainer: {
    flex: 1,
  },
  mapWebView: {
    flex: 1,
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
    marginTop: 16,
  },
  noLocationSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 250,
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
  },
  modalBody: {
    gap: 12,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalText: {
    fontSize: 15,
  },
  modalDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#faf5ff",
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalActionText: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteAction: {
    backgroundColor: "#fef2f2",
  },
  deleteActionText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
});
