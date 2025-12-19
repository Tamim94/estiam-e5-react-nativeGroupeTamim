import { useState } from "react";
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
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { API } from "@/services/api";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AddTripModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const colors = {
        bg: isDark ? "#020617" : "#ffffff",
        card: isDark ? "#020617" : "#f9fafb",
        text: isDark ? "#f9fafb" : "#111827",
        muted: "#9ca3af",
        border: isDark ? "#1f2933" : "#e5e7eb",
        accent: "#a855f7",
    };

    const [tripTitle, setTripTitle] = useState("");
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [description, setDescription] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    const DESTINATION_REGEX = /^[A-Za-zÀ-ÿ\s]+,\s[A-Za-zÀ-ÿ\s]+$/;

    const validateForm = () => {
        if (!tripTitle.trim()) {
            Alert.alert("Erreur", "Le titre est obligatoire");
            return false;
        }
        if (!DESTINATION_REGEX.test(destination)) {
            Alert.alert("Erreur", 'La destination doit être au format "Ville, Pays"');
            return false;
        }
        if (!startDate || !endDate) {
            Alert.alert("Erreur", "Les dates sont obligatoires");
            return false;
        }
        if (new Date(endDate) < new Date(startDate)) {
            Alert.alert("Erreur", "La date de retour doit être après la date de départ");
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
        });
        if (!result.canceled) {
            setSelectedImages((p) => [...p, ...result.assets.map((a) => a.uri)]);
        }
    };

    const uploadImages = async () => {
        const uploaded: string[] = [];
        let cover = "";
        for (let i = 0; i < selectedImages.length; i++) {
            const url = await API.uploadImage(selectedImages[i]);
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
            const { uploaded, cover } = await uploadImages();
            await API.createTrip({
                title: tripTitle,
                destination,
                startDate,
                endDate,
                description,
                image: cover,
                photos: uploaded,
            });
            Alert.alert("Succès", "Voyage créé", [{ text: "OK", onPress: router.back }]);
        } catch (e: any) {
            Alert.alert("Erreur", e.message || "Erreur inconnue");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <Text style={[styles.title, { color: colors.text }]}>Add New Trip</Text>

            <ScrollView>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Trip title"
                    placeholderTextColor={colors.muted}
                    value={tripTitle}
                    onChangeText={setTripTitle}
                />

                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="City, Country"
                    placeholderTextColor={colors.muted}
                    value={destination}
                    onChangeText={setDestination}
                />

                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Description"
                    placeholderTextColor={colors.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <TouchableOpacity onPress={pickImage} style={styles.pickBtn}>
                    <Ionicons name="image" size={24} color={colors.accent} />
                    <Text style={{ color: colors.accent }}>Ajouter des photos</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSaveTrip} disabled={isUploading}>
                    <LinearGradient
                        colors={["#a855f7", "#ec4899"]}
                        style={styles.saveButton}
                    >
                        <Text style={styles.saveText}>
                            {isUploading ? "Enregistrement..." : "Créer le voyage"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    input: {
        borderRadius: 16,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    pickBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 24,
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    saveText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});
