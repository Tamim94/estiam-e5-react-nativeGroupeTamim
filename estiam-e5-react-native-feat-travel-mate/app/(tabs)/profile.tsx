import { useAuth } from '@/contexts/auth-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    TouchableOpacity,
    Alert,
    TextInput,
    Switch
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { API } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';


export default function ProfileScreen() {
    const router = useRouter();
    const { logout } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState('Odilon');
    const [lastName, setLastName] = useState('Hema');
    const [avatar, setAvatar] = useState('😎');
    const { isDarkMode, toggleDarkMode } = useTheme();

    const [counts, setCounts] = useState({
        trips: 0,
        photos: 0,
        favorites: 0
    });

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const loadStats = async () => {
                try {
                    const tripsData = await API.getTrips();

                    if (mounted) {
                        const totalTrips = tripsData.length;
                        const totalPhotos = tripsData.reduce((acc, trip) => {
                            return acc + (trip.photos ? trip.photos.length : 0);
                        }, 0);
                        const totalFavorites = tripsData.filter(t => t.isFavorite).length;

                        setCounts({
                            trips: totalTrips,
                            photos: totalPhotos,
                            favorites: totalFavorites
                        });
                    }
                } catch (e) {
                    console.error("Failed to load profile stats", e);
                }
            };

            loadStats();

            return () => {
                mounted = false;
            };
        }, [])
    );

    const stats = [
        {
            label: 'Voyages',
            value: counts.trips.toString(),
            icon: 'map-outline',
            colors: ['#a855f7', '#ec4899'] as const
        },
        {
            label: 'Photos',
            value: counts.photos.toString(),
            icon: 'camera',
            colors: ['#3b82f6', '#06b6d4'] as const
        },
        {
            label: 'Favoris',
            value: counts.favorites.toString(),
            icon: 'heart-outline',
            colors: ['#ef4444', '#f43f5e'] as const
        }
    ];

    const handleSave = () => {
        setIsEditing(false);
        Alert.alert('Profil mis à jour ✅');
    };

    return (
        <SafeAreaView
            style={[
                styles.container,
                isDarkMode && styles.containerDark
            ]}
            edges={['top']}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={isDarkMode ? ['#111827', '#1f2933'] : ['#a855f7', '#ec4899']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Profil</Text>

                    <View style={[
                        styles.profileCard,
                        isDarkMode && styles.cardDark
                    ]}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarEmoji}>{avatar}</Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={[
                                    styles.profileName,
                                    isDarkMode && styles.textDark
                                ]}>
                                    {firstName} {lastName}
                                </Text>
                                <Text style={styles.profileEmail}>dummy@mail.com</Text>
                            </View>
                        </View>

                        <View style={styles.statsGrid}>
                            {stats.map((stat, idx) => (
                                <View key={idx} style={styles.statItem}>
                                    <LinearGradient colors={stat.colors} style={styles.statIcon}>
                                        <Ionicons name={stat.icon as any} size={24} color="white" />
                                    </LinearGradient>
                                    <Text style={[
                                        styles.statValue,
                                        isDarkMode && styles.textDark
                                    ]}>
                                        {stat.value}
                                    </Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => setIsEditing(!isEditing)}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.editBtnText}>Modifier le profil</Text>
                        </TouchableOpacity>

                        {isEditing && (
                            <View style={styles.form}>
                                <TextInput
                                    placeholder="Prénom"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    style={styles.input}
                                    placeholderTextColor="#6b7280"
                                />
                                <TextInput
                                    placeholder="Nom"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    style={styles.input}
                                    placeholderTextColor="#6b7280"
                                />
                                <TextInput
                                    placeholder="Avatar (emoji)"
                                    value={avatar}
                                    onChangeText={setAvatar}
                                    style={styles.input}
                                    placeholderTextColor="#6b7280"
                                />

                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                    <Text style={styles.saveBtnText}>Enregistrer</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* 🌙 Dark mode toggle */}
                    <View style={[
                        styles.menuItem,
                        isDarkMode && styles.cardDark,
                        { marginBottom: 16 }
                    ]}>
                        <Ionicons
                            name="moon-outline"
                            size={24}
                            color={isDarkMode ? '#fff' : '#000'}
                            style={{ marginRight: 16 }}
                        />
                        <Text style={[
                            styles.menuItemTitle,
                            isDarkMode && styles.textDark,
                            { flex: 1 }
                        ]}>
                            Mode sombre
                        </Text>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleDarkMode}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.menuItem,
                            isDarkMode && styles.cardDark
                        ]}
                        onPress={() => {
                            Alert.alert(
                                'Déconnexion',
                                'Êtes-vous sûr ?',
                                [
                                    { text: 'Annuler', style: 'cancel' },
                                    {
                                        text: 'Déconnexion',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await logout();
                                            router.replace('/login');
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <LinearGradient colors={['#ef4444', '#f43f5e']} style={styles.menuItemIcon}>
                            <Ionicons name='log-out-outline' size={24} color='white' />
                        </LinearGradient>
                        <View>
                            <Text style={[
                                styles.menuItemTitle,
                                isDarkMode && styles.textDark
                            ]}>
                                Déconnexion
                            </Text>
                            <Text style={styles.menuItemSubTitle}>Se déconnecter</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    containerDark: { backgroundColor: '#111827' },

    header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 128, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 32 },

    profileCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, elevation: 4 },
    cardDark: { backgroundColor: '#1f2933' },

    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#faf5ff', justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 40 },

    profileInfo: { flex: 1 },
    profileName: { fontSize: 24, fontWeight: 'bold' },
    profileEmail: { fontSize: 14, color: '#6b7280' },

    statsGrid: { flexDirection: 'row', gap: 12 },
    statItem: { flex: 1, alignItems: 'center' },
    statIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 12, color: '#6b7280' },

    editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, backgroundColor: '#a855f7', padding: 12, borderRadius: 12 },
    editBtnText: { color: '#fff', marginLeft: 8, fontWeight: '600' },

    form: { marginTop: 16 },
    input: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, marginBottom: 12 },

    saveBtn: { backgroundColor: '#22c55e', padding: 12, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold' },

    content: { padding: 24, marginTop: -80 },

    menuItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
    menuItemIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },

    menuItemTitle: { fontSize: 16, fontWeight: '600' },
    menuItemSubTitle: { color: '#6b7280' },

    textDark: { color: '#f9fafb' }
});
