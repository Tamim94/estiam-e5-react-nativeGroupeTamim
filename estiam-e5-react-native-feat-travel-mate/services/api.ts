import { config } from "@/utils/env";
import { OFFLINE } from "./offline";
import { auth } from "./auth";
import { getFavorites } from "./favorites";

export interface Trip {
  id?: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  image?: string;
  photos?: string[];
  isFavorite?: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface TripInput {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  image?: string;
  photos?: string[];
  location?: { latitude: number; longitude: number };
}

function normalizeDate(date?: string): string {
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

function normalizeImage(uri?: string): string | undefined {
  if (!uri) return undefined;
  if (uri.startsWith("file://")) return undefined;
  return uri;
}

function normalizeTrip(trip: any): Trip {
  return {
    ...trip,
    startDate: normalizeDate(trip.startDate),
    endDate: normalizeDate(trip.endDate),
    image: normalizeImage(trip.image),
    photos: Array.isArray(trip.photos)
      ? trip.photos.filter((p: string) => !p.startsWith("file://"))
      : [],
    location: trip.location || undefined,
  };
}

function convertLocationToBackend(
  location?: { latitude: number; longitude: number }
): { lat: number; lng: number } | undefined {
  if (!location) return undefined;
  return { lat: location.latitude, lng: location.longitude };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const tokens = await auth.getTokens();
  if (!tokens?.accessToken) throw new Error("Non authentifié");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${tokens.accessToken}`,
  };
}

export const API = {
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${config.mockBackendUrl}/uploads`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Image upload failed");
    const data = await response.json();
    return data.url;
  },

  async createTrip(trip: TripInput): Promise<Trip> {
    const isOnline = await OFFLINE.checkIsOnline();

    const payload = {
      ...trip,
      location: convertLocationToBackend(trip.location),
    };

    if (!isOnline) {
      const localTrip = { ...payload, id: `local-${Date.now()}` };
      await OFFLINE.addToQueue({
        type: "CREATE",
        endpoint: "/trips",
        method: "POST",
        payload,
      });
      return localTrip as Trip;
    }

    const headers = await getAuthHeaders();
    const response = await fetch(`${config.mockBackendUrl}/trips`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to create trip");
    return response.json();
  },

  async getTrips(): Promise<Trip[]> {
    const isOnline = await OFFLINE.checkIsOnline();

    if (isOnline) {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${config.mockBackendUrl}/trips`, {
          headers,
        });

        if (!response.ok) throw new Error("Failed to fetch trips");

        const rawTrips = await response.json();
        if (!Array.isArray(rawTrips))
          throw new Error("Trips response is not an array");

        const favorites = await getFavorites();
        const normalized = rawTrips.map((trip) => {
          const t = normalizeTrip(trip);
          return { ...t, isFavorite: favorites.includes(t.id) };
        });

        await OFFLINE.cacheTrips(normalized);
        return normalized;
      } catch (error) {
        console.log("Fetch error, using cache", error);
        return (await OFFLINE.getCachedTrips()) || [];
      }
    }

    return (await OFFLINE.getCachedTrips()) || [];
  },

  async getTrip(id: string): Promise<Trip> {
    const isOnline = await OFFLINE.checkIsOnline();

    if (!isOnline) {
      const cached = await OFFLINE.getCachedTrips();
      const trip = cached?.find((t) => t.id === id);
      if (!trip) throw new Error("Trip not found in cache");
      return trip;
    }

    const headers = await getAuthHeaders();
    const response = await fetch(`${config.mockBackendUrl}/trips/${id}`, {
      headers,
    });

    if (!response.ok) throw new Error("Failed to fetch trip");

    const trip = await response.json();
    const favorites = await getFavorites();
    const normalized = normalizeTrip(trip);

    return { ...normalized, isFavorite: favorites.includes(normalized.id) };
  },

  async updateTrip(id: string, trip: Partial<TripInput>): Promise<Trip> {
    const isOnline = await OFFLINE.checkIsOnline();

    const payload = {
      ...trip,
      location: trip.location
        ? convertLocationToBackend(trip.location)
        : undefined,
    };

    if (!isOnline) {
      await OFFLINE.addToQueue({
        type: "UPDATE",
        endpoint: `/trips/${id}`,
        method: "PUT",
        payload,
      });

      // Update local cache
      const cached = await OFFLINE.getCachedTrips();
      if (cached) {
        const updated = cached.map((t) =>
          t.id === id ? { ...t, ...payload } : t
        );
        await OFFLINE.cacheTrips(updated);
      }

      return { id, ...payload } as Trip;
    }

    const headers = await getAuthHeaders();
    const response = await fetch(`${config.mockBackendUrl}/trips/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to update trip");

    const updated = await response.json();

    // Update cache
    const cached = await OFFLINE.getCachedTrips();
    if (cached) {
      const newCache = cached.map((t) =>
        t.id === id ? normalizeTrip(updated) : t
      );
      await OFFLINE.cacheTrips(newCache);
    }

    return normalizeTrip(updated);
  },

  async deleteTrip(id: string): Promise<void> {
    const isOnline = await OFFLINE.checkIsOnline();

    if (!isOnline) {
      await OFFLINE.addToQueue({
        type: "DELETE",
        endpoint: `/trips/${id}`,
        method: "DELETE",
        payload: { id },
      });

      // Remove from local cache
      const cached = await OFFLINE.getCachedTrips();
      if (cached) {
        const filtered = cached.filter((t) => t.id !== id);
        await OFFLINE.cacheTrips(filtered);
      }

      return;
    }

    const headers = await getAuthHeaders();
    const response = await fetch(`${config.mockBackendUrl}/trips/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) throw new Error("Failed to delete trip");

    // Remove from cache
    const cached = await OFFLINE.getCachedTrips();
    if (cached) {
      const filtered = cached.filter((t) => t.id !== id);
      await OFFLINE.cacheTrips(filtered);
    }
  },
};