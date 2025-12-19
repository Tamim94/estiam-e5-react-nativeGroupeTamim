import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API, Trip } from "@/services/api";
import { toggleFavorite as toggleFavoriteStorage } from "@/services/favorites";
import IMAGES_SOURCES from ".";
import { useTranslation } from "@/hooks/use-translation";

const { width } = Dimensions.get("window");

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      let mounted = true;

      const loadTrip = async () => {
        try {
          setLoading(true);
          const data = await API.getTrip(id);
          if (mounted) setTrip(data);
        } catch (e) {
          console.error("Failed to load trip", e);
          Alert.alert(t("common.error"), "Failed to load trip details");
        } finally {
          if (mounted) setLoading(false);
        }
      };

      loadTrip();
      return () => {
        mounted = false;
      };
    }, [id])
  );

  const handleToggleFavorite = async () => {
    if (!trip?.id) return;
    const updatedFavorites = await toggleFavoriteStorage(trip.id);
    setTrip((prev) =>
      prev ? { ...prev, isFavorite: updatedFavorites.includes(trip.id!) } : null
    );
  };

  const handleEdit = () => {
    router.push(`/modal/edit-trip?id=${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      t("trips.deleteTrip"),
      t("trips.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await API.deleteTrip(id);
      Alert.alert(t("common.success"), t("trips.deleteSuccess"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to delete trip", error);
      Alert.alert(t("common.error"), t("trips.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const allPhotos = trip
    ? [trip.image, ...(trip.photos || [])].filter(Boolean)
    : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Trip not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {allPhotos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / width
                  );
                  setActivePhotoIndex(index);
                }}
              >
                {allPhotos.map((photo, index) => (
                  <Image
                    key={index}
                    source={
                      IMAGES_SOURCES[photo as keyof typeof IMAGES_SOURCES]
                        ? IMAGES_SOURCES[photo as keyof typeof IMAGES_SOURCES]
                        : { uri: photo }
                    }
                    style={styles.heroImage}
                  />
                ))}
              </ScrollView>

              {/* Photo indicators */}
              {allPhotos.length > 1 && (
                <View style={styles.photoIndicators}>
                  {allPhotos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === activePhotoIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={64} color="#d1d5db" />
            </View>
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.heroGradient}
          />

          {/* Back button */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={trip.isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={trip.isFavorite ? "#ec4899" : "white"}
              />
            </TouchableOpacity>
          </View>

          {/* Title overlay */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{trip.title}</Text>
            <View style={styles.heroLocation}>
              <Ionicons name="location" size={16} color="white" />
              <Text style={styles.heroLocationText}>{trip.destination}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Date Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={20} color="#a855f7" />
              </View>
              <Text style={styles.cardTitle}>{t("trips.dates")}</Text>
            </View>

            <View style={styles.dateInfo}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{t("addTrip.startDate")}</Text>
                <Text style={styles.dateValue}>{formatDate(trip.startDate)}</Text>
              </View>
              <View style={styles.dateSeparator} />
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{t("addTrip.endDate")}</Text>
                <Text style={styles.dateValue}>{formatDate(trip.endDate)}</Text>
              </View>
            </View>

            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={16} color="#a855f7" />
              <Text style={styles.durationText}>
                {getDuration(trip.startDate, trip.endDate)} {t("trips.days")}
              </Text>
            </View>
          </View>

          {/* Location Card */}
          {trip.location && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="navigate" size={20} color="#a855f7" />
                </View>
                <Text style={styles.cardTitle}>{t("trips.coordinates")}</Text>
              </View>

              <Text style={styles.coordsText}>
                📍 {trip.location.lat.toFixed(4)}, {trip.location.lng.toFixed(4)}
              </Text>
            </View>
          )}

          {/* Description Card */}
          {trip.description && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-text" size={20} color="#a855f7" />
                </View>
                <Text style={styles.cardTitle}>{t("addTrip.description")}</Text>
              </View>

              <Text style={styles.descriptionText}>{trip.description}</Text>
            </View>
          )}

          {/* Photos Gallery */}
          {trip.photos && trip.photos.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="images" size={20} color="#a855f7" />
                </View>
                <Text style={styles.cardTitle}>
                  {t("trips.photos")} ({trip.photos.length})
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosScroll}
              >
                {trip.photos.map((photo, index) => (
                  <TouchableOpacity key={index} style={styles.photoThumb}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoThumbImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#a855f7" />
              <Text style={styles.editButtonText}>{t("common.edit")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>
                    {t("common.delete")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#a855f7",
    borderRadius: 12,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  heroContainer: {
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: width,
    height: 300,
  },
  noImageContainer: {
    width: width,
    height: 300,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  photoIndicators: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  indicatorActive: {
    backgroundColor: "white",
    width: 24,
  },
  headerButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    position: "absolute",
    top: 50,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  heroLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroLocationText: {
    color: "white",
    fontSize: 16,
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#faf5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  dateInfo: {
    gap: 12,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateLabel: {
    color: "#6b7280",
    fontSize: 14,
  },
  dateValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  dateSeparator: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#faf5ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  durationText: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "600",
  },
  coordsText: {
    color: "#374151",
    fontSize: 14,
  },
  descriptionText: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 24,
  },
  photosScroll: {
    marginHorizontal: -8,
  },
  photoThumb: {
    marginHorizontal: 8,
  },
  photoThumbImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#faf5ff",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e9d5ff",
  },
  editButtonText: {
    color: "#a855f7",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fecaca",
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
});