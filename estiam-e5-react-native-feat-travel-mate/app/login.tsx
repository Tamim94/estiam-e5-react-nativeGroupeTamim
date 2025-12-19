import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
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

export default function LoginScreen() {
    const router = useRouter();
    const { login, register, isLoading, refreshAuth } = useAuth();
    const { isDarkMode } = useTheme();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (!isLoginMode && !name) {
            Alert.alert('Erreur', 'Veuillez entrer votre nom');
            return;
        }

        try {
            if (isLoginMode) {
                await login({ email, password });
            } else {
                await register({ email, password, name });
            }

            await new Promise(resolve => setTimeout(resolve, 200));
            await refreshAuth();
            router.replace('/(tabs)');
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Une erreur est survenue';
            Alert.alert('Erreur', errorMessage);
        }
    };

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: isDarkMode ? '#111827' : '#f9fafb' },
            ]}
            edges={['top', 'bottom']}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <LinearGradient
                        colors={['#a855f7', '#ec4899']}
                        style={styles.header}
                    >
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>
                            {isLoginMode
                                ? 'Connectez-vous à votre compte'
                                : 'Créez un nouveau compte'}
                        </Text>
                    </LinearGradient>

                    <View style={styles.form}>
                        {!isLoginMode && (
                            <View
                                style={[
                                    styles.inputContainer,
                                    isDarkMode && styles.inputContainerDark,
                                ]}
                            >
                                <Ionicons name="person-outline" size={24} color="#6b7280" />
                                <TextInput
                                    style={[styles.input, isDarkMode && styles.inputDark]}
                                    placeholder="Nom complet"
                                    placeholderTextColor="#9ca3af"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!isLoading}
                                />
                            </View>
                        )}

                        <View
                            style={[
                                styles.inputContainer,
                                isDarkMode && styles.inputContainerDark,
                            ]}
                        >
                            <Ionicons name="mail-outline" size={24} color="#6b7280" />
                            <TextInput
                                style={[styles.input, isDarkMode && styles.inputDark]}
                                placeholder="Email"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isLoading}
                            />
                        </View>

                        <View
                            style={[
                                styles.inputContainer,
                                isDarkMode && styles.inputContainerDark,
                            ]}
                        >
                            <Ionicons name="lock-closed-outline" size={24} color="#6b7280" />
                            <TextInput
                                style={[styles.input, isDarkMode && styles.inputDark]}
                                placeholder="Mot de passe"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={24}
                                    color="#6b7280"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={styles.submitButton}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#a855f7', '#ec4899']}
                                style={styles.submitButtonGradient}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isLoginMode ? 'Se connecter' : "S'inscrire"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsLoginMode(!isLoginMode)}
                            style={styles.switchModeButton}
                        >
                            <Text style={styles.switchModeText}>
                                {isLoginMode
                                    ? "Pas encore de compte ? S'inscrire"
                                    : 'Déjà un compte ? Se connecter'}
                            </Text>
                        </TouchableOpacity>

                        {isLoginMode && (
                            <TouchableOpacity style={styles.forgotPasswordButton}>
                                <Text style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                                    Mot de passe oublié ?
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
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1 },

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
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },

    form: { padding: 24, flex: 1 },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputContainerDark: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#111827',
    },
    inputDark: {
        color: '#f9fafb',
    },

    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    submitButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    switchModeButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    switchModeText: {
        color: '#a855f7',
        fontWeight: '600',
    },

    forgotPasswordButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
});
