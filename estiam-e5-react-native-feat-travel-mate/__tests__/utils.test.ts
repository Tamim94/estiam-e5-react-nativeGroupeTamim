/**
 * Simple unit tests for utility functions
 * These tests don't require any external dependencies or mocking
 */

describe('Date Utilities', () => {
  // Helper function to calculate trip duration
  const getDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Helper function to format date
  const formatDateISO = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  it('should calculate trip duration correctly for multiple days', () => {
    const duration = getDuration('2024-01-01', '2024-01-05');
    expect(duration).toBe(5);
  });

  it('should calculate trip duration as 1 for same day trip', () => {
    const duration = getDuration('2024-01-01', '2024-01-01');
    expect(duration).toBe(1);
  });

  it('should calculate trip duration correctly for a week', () => {
    const duration = getDuration('2024-01-01', '2024-01-07');
    expect(duration).toBe(7);
  });

  it('should format date to ISO string correctly', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const formatted = formatDateISO(date);
    expect(formatted).toBe('2024-06-15');
  });
});

describe('String Utilities', () => {
  // Destination validation regex (from add-trip.tsx)
  const DESTINATION_REGEX = /^[A-Za-zÀ-ÿ\s]+,\s[A-Za-zÀ-ÿ\s]+$/;

  it('should validate correct destination format "City, Country"', () => {
    expect(DESTINATION_REGEX.test('Paris, France')).toBe(true);
    expect(DESTINATION_REGEX.test('New York, USA')).toBe(true);
    expect(DESTINATION_REGEX.test('São Paulo, Brésil')).toBe(true);
  });

  it('should reject invalid destination formats', () => {
    expect(DESTINATION_REGEX.test('Paris')).toBe(false);
    expect(DESTINATION_REGEX.test('Paris,France')).toBe(false); // Missing space after comma
    expect(DESTINATION_REGEX.test('')).toBe(false);
  });

  it('should handle accented characters', () => {
    expect(DESTINATION_REGEX.test('Montréal, Canada')).toBe(true);
    expect(DESTINATION_REGEX.test('München, Allemagne')).toBe(true);
  });
});

describe('Array Utilities', () => {
  // Filter trips by tab (similar to trips.tsx logic)
  interface Trip {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    isFavorite: boolean;
  }

  const filterTrips = (
    trips: Trip[],
    tab: 'All' | 'Upcoming' | 'Past' | 'Favorites',
    now: Date
  ): Trip[] => {
    return trips.filter((trip) => {
      if (tab === 'Upcoming') {
        return new Date(trip.startDate) > now;
      }
      if (tab === 'Past') {
        return new Date(trip.endDate) < now;
      }
      if (tab === 'Favorites') {
        return trip.isFavorite;
      }
      return true; // 'All'
    });
  };

  const mockTrips: Trip[] = [
    { id: '1', title: 'Past Trip', startDate: '2023-01-01', endDate: '2023-01-05', isFavorite: false },
    { id: '2', title: 'Future Trip', startDate: '2025-12-25', endDate: '2025-12-31', isFavorite: true },
    { id: '3', title: 'Another Future', startDate: '2026-01-01', endDate: '2026-01-10', isFavorite: false },
  ];

  const now = new Date('2024-06-15');

  it('should return all trips when tab is "All"', () => {
    const result = filterTrips(mockTrips, 'All', now);
    expect(result.length).toBe(3);
  });

  it('should return only upcoming trips', () => {
    const result = filterTrips(mockTrips, 'Upcoming', now);
    expect(result.length).toBe(2);
    expect(result.every(t => new Date(t.startDate) > now)).toBe(true);
  });

  it('should return only past trips', () => {
    const result = filterTrips(mockTrips, 'Past', now);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Past Trip');
  });

  it('should return only favorite trips', () => {
    const result = filterTrips(mockTrips, 'Favorites', now);
    expect(result.length).toBe(1);
    expect(result[0].isFavorite).toBe(true);
  });
});

describe('Search Utilities', () => {
  interface Trip {
    title: string;
    destination: string;
  }

  const searchTrips = (trips: Trip[], query: string): Trip[] => {
    if (!query.trim()) return trips;
    const q = query.toLowerCase();
    return trips.filter(
      (trip) =>
        trip.title.toLowerCase().includes(q) ||
        trip.destination.toLowerCase().includes(q)
    );
  };

  const mockTrips: Trip[] = [
    { title: 'Paris Adventure', destination: 'Paris, France' },
    { title: 'Tokyo Journey', destination: 'Tokyo, Japan' },
    { title: 'Beach Holiday', destination: 'Bali, Indonesia' },
  ];

  it('should return all trips when query is empty', () => {
    const result = searchTrips(mockTrips, '');
    expect(result.length).toBe(3);
  });

  it('should find trips by title', () => {
    const result = searchTrips(mockTrips, 'adventure');
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Paris Adventure');
  });

  it('should find trips by destination', () => {
    const result = searchTrips(mockTrips, 'japan');
    expect(result.length).toBe(1);
    expect(result[0].destination).toBe('Tokyo, Japan');
  });

  it('should be case insensitive', () => {
    const result = searchTrips(mockTrips, 'PARIS');
    expect(result.length).toBe(1);
  });

  it('should return empty array when no match', () => {
    const result = searchTrips(mockTrips, 'xyz');
    expect(result.length).toBe(0);
  });
});

