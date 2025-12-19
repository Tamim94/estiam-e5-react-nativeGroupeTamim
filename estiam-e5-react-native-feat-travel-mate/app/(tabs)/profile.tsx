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
    TextInput
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { API } from '@/services/api';
import { useTranslation } from '@/hooks/use-translation';
// Import theme hook
import { useTheme } from '@/contexts/theme-contexts';

export default function ProfileScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const { t, switchLanguage, currentLanguage } = useTranslation();

    // Get theme functions
    const { themeMode, setThemeMode, isDarkMode, colors } = useTheme();

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState('Odilon');
    const [lastName, setLastName] = useState('Hema');
    const [avatar, setAvatar] = useState('😎');

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
            return () => { mounted = false; };
        }, [])
    );

    const stats = [
        {
            label: t('trips.title'),
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
            label: t('favorites.title'),
            value: counts.favorites.toString(),
            icon: 'heart-outline',
            colors: ['#ef4444', '#f43f5e'] as const
        }
    ];

    const handleSave = () => {
        setIsEditing(false);
        Alert.alert(t('common.success'));
    };

    // Helper to get display text for theme
    const getThemeLabel = () => {
        switch(themeMode) {
            case 'light': return currentLanguage === 'fr' ? 'Clair' : 'Light';
            case 'dark': return currentLanguage === 'fr' ? 'Sombre' : 'Dark';
            case 'system': return currentLanguage === 'fr' ? 'Automatique' : 'System';
        }
    };

    // Generate styles based on theme
    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 128, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
        headerTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 32 },
        profileCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
        profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
        avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: isDarkMode ? '#374151' : '#faf5ff', justifyContent: 'center', alignItems: 'center' },
        avatarEmoji: { fontSize: 40 },
        profileInfo: { flex: 1 },
        profileName: { fontSize: 24, fontWeight: 'bold', color: colors.text },
        profileEmail: { fontSize: 14, color: colors.textSecondary },
        statsGrid: { flexDirection: 'row', gap: 12 },
        statItem: { flex: 1, alignItems: 'center' },
        statIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
        statValue: { fontSize: 20, fontWeight: 'bold', color: colors.text },
        statLabel: { fontSize: 12, color: colors.textSecondary },
        editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, backgroundColor: '#a855f7', padding: 12, borderRadius: 12 },
        editBtnText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
        form: { marginTop: 16 },
        input: { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 12, padding: 12, marginBottom: 12, color: colors.text },
        saveBtn: { backgroundColor: '#22c55e', padding: 12, borderRadius: 12, alignItems: 'center' },
        saveBtnText: { color: '#fff', fontWeight: 'bold' },
        content: { padding: 24, marginTop: -80 },
        menuItem: { backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
        menuItemIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
        menuItemTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
        menuItemSubTitle: { color: colors.textSecondary }
    });

    // Handle Theme Selection
    const handleThemeChange = () => {
        Alert.alert(
            currentLanguage === 'fr' ? 'Choisir le thème' : 'Select Theme',
            '',
            [
                {
                    text: (currentLanguage === 'fr' ? 'Clair' : 'Light') + (themeMode === 'light' ? ' ✓' : ''),
                    onPress: () => setThemeMode('light')
                },
                {
                    text: (currentLanguage === 'fr' ? 'Sombre' : 'Dark') + (themeMode === 'dark' ? ' ✓' : ''),
                    onPress: () => setThemeMode('dark')
                },
                {
                    text: (currentLanguage === 'fr' ? 'Automatique' : 'System') + (themeMode === 'system' ? ' ✓' : ''),
                    onPress: () => setThemeMode('system')
                },
                { text: t('common.cancel'), style: 'cancel' }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.header}>
                    <Text style={styles.headerTitle}>{t('profile.title')}</Text>

                    <View style={styles.profileCard}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarEmoji}>{avatar}</Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{firstName} {lastName}</Text>
                                <Text style={styles.profileEmail}>dummy@mail.com</Text>
                            </View>
                        </View>

                        <View style={styles.statsGrid}>
                            {stats.map((stat, idx) => (
                                <View key={idx} style={styles.statItem}>
                                    <LinearGradient colors={stat.colors} style={styles.statIcon}>
                                        <Ionicons name={stat.icon as any} size={24} color="white" />
                                    </LinearGradient>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => setIsEditing(!isEditing)}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
                        </TouchableOpacity>

                        {isEditing && (
                            <View style={styles.form}>
                                <TextInput
                                    placeholder={currentLanguage === 'fr' ? "Prénom" : "First Name"}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder={currentLanguage === 'fr' ? "Nom" : "Last Name"}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Avatar (emoji)"
                                    value={avatar}
                                    onChangeText={setAvatar}
                                    style={styles.input}
                                />

                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                    <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                <View style={styles.content}>

                    {/* Theme Selector */}
                    <TouchableOpacity
                        style={[styles.menuItem, { marginBottom: 16 }]}
                        onPress={handleThemeChange}
                    >
                        <LinearGradient colors={['#8b5cf6', '#d946ef']} style={styles.menuItemIcon}>
                            <Ionicons name='contrast-outline' size={24} color='white' />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuItemTitle}>
                                {currentLanguage === 'fr' ? 'Thème' : 'Theme'}
                            </Text>
                            <Text style={styles.menuItemSubTitle}>
                                {getThemeLabel()}
                            </Text>
                        </View>
                        <Ionicons name='chevron-forward-outline' size={20} color='#9ca3af' />
                    </TouchableOpacity>

                    {/* Language Selector */}
                    <TouchableOpacity
                        style={[styles.menuItem, { marginBottom: 16 }]}
                        onPress={() => {
                            Alert.alert(
                                t('settings.selectLanguage'),
                                '',
                                [
                                    {
                                        text: t('settings.french') + (currentLanguage === 'fr' ? ' ✓' : ''),
                                        onPress: () => switchLanguage('fr')
                                    },
                                    {
                                        text: t('settings.english') + (currentLanguage === 'en' ? ' ✓' : ''),
                                        onPress: () => switchLanguage('en')
                                    },
                                    { text: t('common.cancel'), style: 'cancel' }
                                ]
                            );
                        }}
                    >
                        <LinearGradient colors={['#3b82f6', '#06b6d4']} style={styles.menuItemIcon}>
                            <Ionicons name='language-outline' size={24} color='white' />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuItemTitle}>{t('profile.language')}</Text>
                            <Text style={styles.menuItemSubTitle}>
                                {currentLanguage === 'fr' ? t('settings.french') : t('settings.english')}
                            </Text>
                        </View>
                        <Ionicons name='chevron-forward-outline' size={20} color='#9ca3af' />
                    </TouchableOpacity>

                    {/* Logout */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            Alert.alert(
                                t('auth.logout'),
                                currentLanguage === 'fr' ? 'Êtes-vous sûr ?' : 'Are you sure?',
                                [
                                    { text: t('common.cancel'), style: 'cancel' },
                                    {
                                        text: t('auth.logout'),
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
                            <Text style={styles.menuItemTitle}>{t('auth.logout')}</Text>
                            <Text style={styles.menuItemSubTitle}>
                                {currentLanguage === 'fr' ? 'Se déconnecter' : 'Sign out'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

