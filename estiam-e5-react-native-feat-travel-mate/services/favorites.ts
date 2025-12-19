import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@favorite_trips';

export async function getFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleFavorite(id: string): Promise<string[]> {
  const favorites = await getFavorites();
  const updated = favorites.includes(id)
    ? favorites.filter(f => f !== id)
    : [...favorites, id];

  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
