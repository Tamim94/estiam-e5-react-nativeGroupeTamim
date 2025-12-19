import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API } from "@/services/api";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function AddTripModal() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const [tripTitle, setTripTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<Array<string>>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  // Date picker states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<Coordinates | null>(
    null
  );

  const DESTINATION_REGEX = /^[A-Za-zÀ-ÿ\s]+,\s[A-Za-zÀ-ÿ\s]+$/;

  const validateForm = () => {
    if (!tripTitle.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire");
      return false;
    }

    if (!DESTINATION_REGEX.test(destination)) {
      Alert.alert(
        "Erreur",
        'La destination doit être au format "Ville, Pays"'
      );
      return false;
    }

    if (!startDate || !endDate) {
      Alert.alert("Erreur", "Les dates sont obligatoires");
      return false;
    }

    if (endDate < startDate) {
      Alert.alert(
        "Erreur",
        "La date de retour doit être après la date de départ"
      );
      return false;
    }

    return true;
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const showPermissionAlert = (title: string, message: string) => {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      { text: "Ouvrir les paramètres", onPress: openAppSettings },
    ]);
  };

  const showSimulatorAlert = (feature: string) => {
    Alert.alert(
      "Fonctionnalité non disponible",
      `La fonctionnalité "${feature}" n'est pas disponible sur un simulateur.`,
      [{ text: "D'accord", style: "cancel" }]
    );
  };

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
    if (Platform.OS === "android") {
      setShowStartPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowEndPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showPermissionAlert(
          "Permission Galerie refusée",
          "Nous avons besoin de l'accès à vos photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const selectedUris = result.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...selectedUris]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showSimulatorAlert("Galerie");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showPermissionAlert(
          "Permission refusée",
          "Nous avons besoin de l'accès à la caméra."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        setSelectedImages((prev) => [...prev, photoUri]);
      }
    } catch (error) {
      console.log("Error taking photo:", error);
      showSimulatorAlert("Camera");
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showPermissionAlert(
          "Permission Localisation refusée",
          "Nous avons besoin de l'accès à votre localisation."
        );
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
        const formattedAddress =
          `${city}${city && country ? ", " : ""}${country}`.trim();
        setDestination(formattedAddress);
      }
    } catch (error) {
      console.log("Error getting location:", error);
      showSimulatorAlert("Localisation");
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
        setTempCoordinates({
          latitude: data.lat,
          longitude: data.lng,
        });
      }
    } catch (e) {
      console.error("Error parsing map message:", e);
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
          const formattedAddress =
            `${city}${city && country ? ", " : ""}${country}`.trim();
          setDestination(formattedAddress);
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

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        map.on('moveend', function() {
          const center = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'locationSelected',
            lat: center.lat,
            lng: center.lng
          }));
        });

        // Initial message
        setTimeout(() => {
          const center = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'locationSelected',
            lat: center.lat,
            lng: center.lng
          }));
        }, 500);
      </script>
    </body>
    </html>
  `;

  const uploadImages = async () => {
    const uploaded: string[] = [];
    let cover = "";

    for (let i = 0; i < selectedImages.length; i++) {
      const uri = selectedImages[i];
      const url = await API.uploadImage(uri);
      uploaded.push(url);

      if (i === 0) cover = url;

      setUploadProgress(Math.round(((i + 1) / selectedImages.length) * 100));
    }

    return { uploaded, cover };
  };

  const handleSaveTrip = async () => {
    if (!validateForm()) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { uploaded, cover } = await uploadImages();

      const trip = {
        title: tripTitle,
        destination,
        startDate: formatDateISO(startDate),
        endDate: formatDateISO(endDate),
        description,
        image: cover,
        photos: uploaded,
        location: coordinates || undefined,
      };

      await API.createTrip(trip);

      Alert.alert("Succès", "Voyage créé avec succès", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error creating trip:", error);
      Alert.alert(
        "Erreur",
        `Impossible de créer le voyage: ${error.message || error}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Text style={styles.pageTitle}>Add New Trip</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.section}>
          <Text style={styles.label}>Cover photo</Text>
          <View style={styles.photoUpload}>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#a855f7" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="image" size={32} color="#ec4899" />
              </TouchableOpacity>
            </View>
            <Text style={styles.photoText}>
              Take a photo or choose from library
            </Text>
            <Text style={styles.photoSubText}>Access camera and photos</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Trip Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter trip title"
            value={tripTitle}
            onChangeText={setTripTitle}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Destination with location */}
        <View style={styles.section}>
          <Text style={styles.label}>Destination</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <TextInput
              style={styles.inputFlex}
              placeholder="City, Country"
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
              <Text style={styles.locationButtonText}>Current Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={openMapPicker}
            >
              <Ionicons name="map" size={18} color="#a855f7" />
              <Text style={styles.locationButtonText}>Pick on Map</Text>
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
          <Text style={styles.label}>Date de départ</Text>
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
              {startDate ? formatDate(startDate) : "Sélectionner une date"}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onStartDateChange}
                locale="fr-FR"
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowStartPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* End Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date de retour</Text>
          <TouchableOpacity
            style={styles.inputWithIcon}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <Text
              style={[styles.dateText, !endDate && styles.dateTextPlaceholder]}
            >
              {endDate ? formatDate(endDate) : "Sélectionner une date"}
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
                locale="fr-FR"
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowEndPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez votre voyage..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Photos Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Images sélectionnées ({selectedImages.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      setSelectedImages((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressInfo}>
                <Ionicons name="cloud-upload-outline" size={24} color="#a855f7" />
                <Text style={styles.progressText}>
                  Téléchargement en cours...
                </Text>
              </View>
              <Text style={styles.progressPercent}>{uploadProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={["#a855f7", "#ec4899"]}
                style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveTrip}
          disabled={isUploading}
        >
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.saveButtonText}>
              {isUploading ? "Enregistrement ..." : "Créer le voyage"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Text style={styles.mapCancelText}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Choisir un lieu</Text>
            <TouchableOpacity onPress={confirmMapLocation}>
              <Text style={styles.mapConfirmText}>Confirmer</Text>
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

          <View style={styles.mapFooter}>
            <Text style={styles.mapHint}>
              Déplacez la carte pour positionner le marqueur
            </Text>
            {tempCoordinates && (
              <Text style={styles.mapCoords}>
                {tempCoordinates.latitude.toFixed(4)},{" "}
                {tempCoordinates.longitude.toFixed(4)}
              </Text>
            )}
          </View>
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
  photoUpload: {
    backgroundColor: "#faf5ff",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e9d5ff",
    paddingBottom: 16,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    paddingVertical: 16,
  },
  photoButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoText: {
    fontSize: 14,
    color: "#6b7280",
  },
  photoSubText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
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
  progressCard: {
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#111827",
  },
  progressPercent: {
    fontSize: 14,
    color: "#a855f7",
    fontWeight: "600",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#e9d5ff",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
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
  // Map Modal Styles
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
  mapFooter: {
    padding: 16,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    gap: 4,
  },
  mapHint: {
    color: "#6b7280",
    fontSize: 14,
  },
  mapCoords: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "500",
  },
});