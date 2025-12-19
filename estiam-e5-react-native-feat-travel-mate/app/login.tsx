import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-contexts";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/use-translation";

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading, refreshAuth } = useAuth();
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setshowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("addTrip.requiredFields"));
      return;
    }

    if (!isLoginMode && !name) {
      Alert.alert(t("common.error"), t("addTrip.requiredFields"));
      return;
    }

    try {
      if (isLoginMode) {
        await login({ email, password });
        await refreshAuth();
        router.replace("/(tabs)");
      } else {
        await register({ email, password, name });
        await refreshAuth();
        router.replace("/(tabs)");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("errors.generic");

      Alert.alert(t("common.error"), errorMessage, [{ text: t("common.ok") }]);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            style={styles.header}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isLoginMode ? t("auth.login") : t("auth.register")}
            </Text>
          </LinearGradient>

          <View style={styles.form}>
            {!isLoginMode && (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={
                    t("common.ok") === "OK" ? "Nom complet" : "Full name"
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            )}

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.email")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                keyboardType="email-address"
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.password")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setshowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#a855f7", "#ec4899"]}
                style={styles.submitButtonGradient}
              >
                {isLoading ? (
                  <Text style={styles.submitButtonText}>
                    {t("common.loading")}
                  </Text>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLoginMode ? t("auth.login") : t("auth.register")}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLoginMode(!isLoginMode)}
              style={styles.switchModeButton}
              disabled={isLoading}
            >
              <Text style={[styles.switchModeText, { color: colors.primary }]}>
                {isLoginMode
                  ? t("auth.dontHaveAccount")
                  : t("auth.alreadyHaveAccount")}
              </Text>
            </TouchableOpacity>

            {isLoginMode && (
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text
                  style={[
                    styles.forgotPasswordText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("auth.forgotPassword")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  form: {
    padding: 24,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchModeButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  forgotPasswordButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  testButtonText: {
    fontSize: 12,
  },
});