import { config } from "@/utils/env";
import { OFFLINE } from "./offline";
import { auth } from "./auth";

export interface Trip {
  id?: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  image?: string;
  photos?: string[];
}

/**
 * Convert DD/MM/YYYY → ISO (YYYY-MM-DD)
 */
function normalizeDate(date?: string): string {
  if (!date) return "";

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date;
  }

  // DD/MM/YYYY
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

/**
 * Ensure image is a valid React Native source
 */
function normalizeImage(uri?: string): string | undefined {
  if (!uri) return undefined;

  // Ignore local simulator files
  if (uri.startsWith("file://")) return undefined;

  return uri;
}

/**
 * Normalize backend trip → frontend-safe trip
 */
function normalizeTrip(trip: any): Trip {
  return {
    ...trip,
    startDate: normalizeDate(trip.startDate),
    endDate: normalizeDate(trip.endDate),
    image: normalizeImage(trip.image),
    photos: Array.isArray(trip.photos)
      ? trip.photos.filter((p: string) => !p.startsWith("file://"))
      : [],
  };
}

export const API = {
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append(
      "file",
      {
        uri,
        name: filename,
        type,
      } as any
    );

    const response = await fetch(`${config.mockBackendUrl}/uploads`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const data = await response.json();
    return data.url;
  },

  async createTrip(trip: Trip) {
    const isOnline = await OFFLINE.checkIsOnline();

    if (!isOnline) {
      await OFFLINE.addToQueue({
        type: "CREATE",
        endpoint: "/trips",
        method: "POST",
        payload: trip,
      });

      return { ...trip, id: `local-${Date.now()}` };
    }

    const tokens = await auth.getTokens();
    if (!tokens?.accessToken) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(`${config.mockBackendUrl}/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify(trip),
    });

    if (!response.ok) {
      throw new Error("Failed to create trip");
    }

    return response.json();
  },

  async getTrips(): Promise<Trip[]> {
    const isOnline = await OFFLINE.checkIsOnline();

    if (isOnline) {
      try {
        const tokens = await auth.getTokens();
        if (!tokens?.accessToken) {
          throw new Error("Non authentifié");
        }

        const response = await fetch(`${config.mockBackendUrl}/trips`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch trips");
        }

        const rawTrips = await response.json();

        if (!Array.isArray(rawTrips)) {
          throw new Error("Trips response is not an array");
        }

        const normalized = rawTrips.map(normalizeTrip);

        await OFFLINE.cacheTrips(normalized);
        return normalized;
      } catch (error) {
        console.log("Fetch error, using cache", error);
        return (await OFFLINE.getCachedTrips()) || [];
      }
    }

    return (await OFFLINE.getCachedTrips()) || [];
  },
};