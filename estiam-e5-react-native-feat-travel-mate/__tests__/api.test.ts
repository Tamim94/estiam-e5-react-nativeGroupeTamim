/**
 * Simple unit tests for API data validation
 */

describe('Trip Validation', () => {
  interface Trip {
    id?: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    description?: string;
    image?: string;
    photos?: string[];
    isFavorite?: boolean;
    location?: { lat: number; lng: number };
  }

  const isValidTrip = (trip: Partial<Trip>): boolean => {
    if (!trip.title || trip.title.trim() === '') return false;
    if (!trip.destination || trip.destination.trim() === '') return false;
    if (!trip.startDate || !trip.endDate) return false;

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    if (end < start) return false;

    return true;
  };

  const isValidLocation = (location: any): boolean => {
    if (!location) return false;
    if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return false;
    if (location.lat < -90 || location.lat > 90) return false;
    if (location.lng < -180 || location.lng > 180) return false;
    return true;
  };

  it('should validate a complete trip', () => {
    const trip: Trip = {
      title: 'Paris Adventure',
      destination: 'Paris, France',
      startDate: '2024-06-01',
      endDate: '2024-06-10',
    };
    expect(isValidTrip(trip)).toBe(true);
  });

  it('should reject trip without title', () => {
    const trip = {
      title: '',
      destination: 'Paris, France',
      startDate: '2024-06-01',
      endDate: '2024-06-10',
    };
    expect(isValidTrip(trip)).toBe(false);
  });

  it('should reject trip without destination', () => {
    const trip = {
      title: 'Trip',
      destination: '',
      startDate: '2024-06-01',
      endDate: '2024-06-10',
    };
    expect(isValidTrip(trip)).toBe(false);
  });

  it('should reject trip with end date before start date', () => {
    const trip = {
      title: 'Trip',
      destination: 'Paris, France',
      startDate: '2024-06-10',
      endDate: '2024-06-01',
    };
    expect(isValidTrip(trip)).toBe(false);
  });

  it('should accept trip with same start and end date', () => {
    const trip = {
      title: 'Day Trip',
      destination: 'Paris, France',
      startDate: '2024-06-01',
      endDate: '2024-06-01',
    };
    expect(isValidTrip(trip)).toBe(true);
  });

  it('should validate correct location coordinates', () => {
    expect(isValidLocation({ lat: 48.8566, lng: 2.3522 })).toBe(true); // Paris
    expect(isValidLocation({ lat: 35.6762, lng: 139.6503 })).toBe(true); // Tokyo
    expect(isValidLocation({ lat: -33.8688, lng: 151.2093 })).toBe(true); // Sydney
  });

  it('should reject invalid location coordinates', () => {
    expect(isValidLocation({ lat: 91, lng: 0 })).toBe(false); // Lat > 90
    expect(isValidLocation({ lat: -91, lng: 0 })).toBe(false); // Lat < -90
    expect(isValidLocation({ lat: 0, lng: 181 })).toBe(false); // Lng > 180
    expect(isValidLocation({ lat: 0, lng: -181 })).toBe(false); // Lng < -180
  });

  it('should reject location with missing coordinates', () => {
    expect(isValidLocation(null)).toBe(false);
    expect(isValidLocation(undefined)).toBe(false);
    expect(isValidLocation({ lat: 48 })).toBe(false);
    expect(isValidLocation({ lng: 2 })).toBe(false);
    expect(isValidLocation({})).toBe(false);
  });
});

describe('API Response Helpers', () => {
  const getBaseUrl = (env: string): string => {
    switch (env) {
      case 'production':
        return 'https://api.example.com';
      case 'staging':
        return 'https://staging.api.example.com';
      default:
        return 'http://localhost:3000';
    }
  };

  it('should return correct URL for production', () => {
    expect(getBaseUrl('production')).toBe('https://api.example.com');
  });

  it('should return correct URL for staging', () => {
    expect(getBaseUrl('staging')).toBe('https://staging.api.example.com');
  });

  it('should return localhost for development', () => {
    expect(getBaseUrl('development')).toBe('http://localhost:3000');
  });

  it('should default to localhost for unknown environment', () => {
    expect(getBaseUrl('unknown')).toBe('http://localhost:3000');
  });
});

