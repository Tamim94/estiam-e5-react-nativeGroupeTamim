/**
 * Simple unit tests for favorites service logic
 */

describe('Favorites Service', () => {
  // Simulating the favorites toggle logic
  const toggleFavorite = (
    currentFavorites: string[],
    tripId: string
  ): string[] => {
    if (currentFavorites.includes(tripId)) {
      return currentFavorites.filter((id) => id !== tripId);
    }
    return [...currentFavorites, tripId];
  };

  const isFavorite = (favorites: string[], tripId: string): boolean => {
    return favorites.includes(tripId);
  };

  it('should add trip to favorites when not already favorited', () => {
    const favorites: string[] = ['trip1', 'trip2'];
    const result = toggleFavorite(favorites, 'trip3');

    expect(result).toContain('trip3');
    expect(result.length).toBe(3);
  });

  it('should remove trip from favorites when already favorited', () => {
    const favorites: string[] = ['trip1', 'trip2', 'trip3'];
    const result = toggleFavorite(favorites, 'trip2');

    expect(result).not.toContain('trip2');
    expect(result.length).toBe(2);
  });

  it('should correctly identify favorited trips', () => {
    const favorites: string[] = ['trip1', 'trip2'];

    expect(isFavorite(favorites, 'trip1')).toBe(true);
    expect(isFavorite(favorites, 'trip2')).toBe(true);
    expect(isFavorite(favorites, 'trip3')).toBe(false);
  });

  it('should handle empty favorites list', () => {
    const favorites: string[] = [];
    const result = toggleFavorite(favorites, 'trip1');

    expect(result).toContain('trip1');
    expect(result.length).toBe(1);
  });

  it('should not mutate original favorites array', () => {
    const favorites: string[] = ['trip1', 'trip2'];
    const original = [...favorites];

    toggleFavorite(favorites, 'trip3');

    expect(favorites).toEqual(original);
  });
});

