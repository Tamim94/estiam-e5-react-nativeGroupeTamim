import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API, Trip } from "@/services/api";
import { useTranslation } from "@/hooks/use-translation";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function EditTripModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const webViewRef = useRef<WebView>(null);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tripTitle, setTripTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [coverImage, setCoverImage] = useState<string | undefined>();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<Coordinates | null>(
    null
  );

  useEffect(() => {
    if (!id) return;

    const loadTrip = async () => {
      try {
        const trip = await API.getTrip(id);
        setTripTitle(trip.title);
        setDestination(trip.destination);
        setStartDate(trip.startDate ? new Date(trip.startDate) : null);
        setEndDate(trip.endDate ? new Date(trip.endDate) : null);
        setDescription(trip.description || "");
        setCoverImage(trip.image);
        setExistingImages(trip.photos || []);

        if (trip.location) {
          setCoordinates({
            latitude: trip.location.lat,
            longitude: trip.location.lng,
          });
        }
      } catch (e) {
        console.error("Failed to load trip", e);
        Alert.alert(t("common.error"), "Failed to load trip");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [id]);

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateISO = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const onStartDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") setShowStartPicker(false);
    if (event.type === "set" && selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndPicker(false);
    if (event.type === "set" && selectedDate) setEndDate(selectedDate);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("common.error"), t("addTrip.galleryPermissionDenied"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setNewImages((prev) => [...prev, ...uris]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("common.error"), t("addTrip.locationPermissionDenied"));
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setCoordinates(coords);

    const address = await Location.reverseGeocodeAsync(location.coords);
    if (address.length > 0) {
      const addr = address[0];
      const city = addr.city || addr.name || "";
      const country = addr.country || "";
      setDestination(`${city}${city && country ? ", " : ""}${country}`.trim());
    }
  };

  const openMapPicker = () => {
    setTempCoordinates(coordinates || { latitude: 48.8566, longitude: 2.3522 });
    setShowMapModal(true);
  };

  const handleMapMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "locationSelected") {
        setTempCoordinates({ latitude: data.lat, longitude: data.lng });
      }
    } catch (e) {
      console.error("Map message error:", e);
    }
  };

  const confirmMapLocation = async () => {
    if (tempCoordinates) {
      setCoordinates(tempCoordinates);

      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: tempCoordinates.latitude,
          longitude: tempCoordinates.longitude,
        });

        if (address.length > 0) {
          const addr = address[0];
          const city = addr.city || addr.name || "";
          const country = addr.country || "";
          setDestination(
            `${city}${city && country ? ", " : ""}${country}`.trim()
          );
        }
      } catch (e) {
        console.log("Reverse geocode failed:", e);
      }
    }
    setShowMapModal(false);
  };

  const getMapHTML = (lat: number, lng: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
        .crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          pointer-events: none;
          font-size: 32px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="crosshair">📍</div>
      <script>
        const map = L.map('map').setView([${lat}, ${lng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('moveend', function() {
          const center = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'locationSelected',
            lat: center.lat,
            lng: center.lng
          }));
        });
      </script>
    </body>
    </html>
  `;

  const handleSave = async () => {
    if (!tripTitle.trim() || !startDate || !endDate) {
      Alert.alert(t("common.error"), t("addTrip.requiredFields"));
      return;
    }

    try {
      setSaving(true);

      // Upload new images
      const uploadedNew: string[] = [];
      for (const uri of newImages) {
        const url = await API.uploadImage(uri);
        uploadedNew.push(url);
      }

      const allPhotos = [...existingImages, ...uploadedNew];
      const newCover =
        uploadedNew.length > 0 ? uploadedNew[0] : coverImage || allPhotos[0];

      await API.updateTrip(id!, {
        title: tripTitle,
        destination,
        startDate: formatDateISO(startDate),
        endDate: formatDateISO(endDate),
        description,
        image: newCover,
        photos: allPhotos,
        location: coordinates || undefined,
      });

      Alert.alert(t("common.success"), t("trips.updateSuccess"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to update trip", error);
      Alert.alert(t("common.error"), t("trips.updateError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Text style={styles.pageTitle}>{t("trips.editTrip")}</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("addTrip.tripTitle")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("addTrip.tripTitlePlaceholder")}
            value={tripTitle}
            onChangeText={setTripTitle}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Destination */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("addTrip.destination")}</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <TextInput
              style={styles.inputFlex}
              placeholder={t("addTrip.destinationPlaceholder")}
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.locationButtons}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getLocation}
            >
              <Ionicons name="navigate" size={18} color="#a855f7" />
              <Text style={styles.locationButtonText}>
                {t("addTrip.currentLocation")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={openMapPicker}
            >
              <Ionicons name="map" size={18} color="#a855f7" />
              <Text style={styles.locationButtonText}>
                {t("addTrip.pickLocation")}
              </Text>
            </TouchableOpacity>
          </View>

          {coordinates && (
            <View style={styles.coordsPreview}>
              <Text style={styles.coordsText}>
                📍 {coordinates.latitude.toFixed(4)},{" "}
                {coordinates.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("addTrip.startDate")}</Text>
          <TouchableOpacity
            style={styles.inputWithIcon}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <Text
              style={[
                styles.dateText,
                !startDate && styles.dateTextPlaceholder,
              ]}
            >
              {startDate ? formatDate(startDate) : t("addTrip.selectDate")}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onStartDateChange}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowStartPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>{t("common.ok")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* End Date */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("addTrip.endDate")}</Text>
          <TouchableOpacity
            style={styles.inputWithIcon}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <Text
              style={[styles.dateText, !endDate && styles.dateTextPlaceholder]}
            >
              {endDate ? formatDate(endDate) : t("addTrip.selectDate")}
            </Text>
          </TouchableOpacity>

          {showEndPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onEndDateChange}
                minimumDate={startDate || undefined}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowEndPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>{t("common.ok")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("addTrip.description")}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t("addTrip.descriptionPlaceholder")}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Existing Photos */}
        {existingImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {t("trips.existingPhotos")} ({existingImages.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {existingImages.map((uri, index) => (
                <View key={`existing-${index}`} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeExistingImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Add New Photos */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
            <Ionicons name="add-circle-outline" size={24} color="#a855f7" />
            <Text style={styles.addPhotoText}>{t("addTrip.addImages")}</Text>
          </TouchableOpacity>

          {newImages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
            >
              {newImages.map((uri, index) => (
                <View key={`new-${index}`} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeNewImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={showMapModal} animationType="slide">
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Text style={styles.mapCancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <Text style={styles.mapTitle}>{t("addTrip.pickLocation")}</Text>
            <TouchableOpacity onPress={confirmMapLocation}>
              <Text style={styles.mapConfirmText}>{t("common.confirm")}</Text>
            </TouchableOpacity>
          </View>

          <WebView
            ref={webViewRef}
            source={{
              html: getMapHTML(
                tempCoordinates?.latitude || 48.8566,
                tempCoordinates?.longitude || 2.3522
              ),
            }}
            style={styles.mapWebView}
            onMessage={handleMapMessage}
            javaScriptEnabled
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 12,
  },
  inputFlex: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  locationButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#faf5ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  locationButtonText: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "600",
  },
  coordsPreview: {
    marginTop: 12,
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 12,
  },
  coordsText: {
    color: "#166534",
    fontSize: 13,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  dateTextPlaceholder: {
    color: "#9ca3af",
  },
  pickerContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  pickerDoneButton: {
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  pickerDoneText: {
    color: "#a855f7",
    fontSize: 16,
    fontWeight: "600",
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  imagePreview: {
    marginRight: 12,
    position: "relative",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#faf5ff",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e9d5ff",
  },
  addPhotoText: {
    color: "#a855f7",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  mapCancelText: {
    color: "#6b7280",
    fontSize: 16,
  },
  mapTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  mapConfirmText: {
    color: "#a855f7",
    fontSize: 16,
    fontWeight: "600",
  },
  mapWebView: {
    flex: 1,
  },
});