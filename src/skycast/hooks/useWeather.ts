import { useState, useEffect, useCallback } from 'react';
import { FavoriteLocation, LocationData, RecentSearch, ThemeMode, UnitSystem, WeatherData } from '../types/weather';
import { fetchWeather } from '../services/weatherApi';

const FAVORITES_STORAGE_KEY = 'skycast_favorites_v1';
const RECENTS_STORAGE_KEY = 'skycast_recents_v1';
const UNIT_STORAGE_KEY = 'skycast_unit_v1';
const THEME_STORAGE_KEY = 'skycast_theme_v1';

const INITIAL_FAVORITES: FavoriteLocation[] = [
  { id: 'fav-lahore', name: 'Lahore', country: 'Pakistan', region: 'Punjab', latitude: 31.5497, longitude: 74.3436, tempCelsius: 31, condition: 'Partly Cloudy', addedAt: 1 },
  { id: 'fav-islamabad', name: 'Islamabad', country: 'Pakistan', region: 'Islamabad', latitude: 33.6844, longitude: 73.0479, tempCelsius: 28, condition: 'Clear Sky', addedAt: 2 },
  { id: 'fav-karachi', name: 'Karachi', country: 'Pakistan', region: 'Sindh', latitude: 24.8607, longitude: 67.0011, tempCelsius: 30, condition: 'Haze', addedAt: 3 },
  { id: 'fav-rawalpindi', name: 'Rawalpindi', country: 'Pakistan', region: 'Punjab', latitude: 33.5651, longitude: 73.0169, tempCelsius: 29, condition: 'Sunny', addedAt: 4 },
];

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Unit preferences (°C / °F)
  const [unit, setUnit] = useState<UnitSystem>(() => {
    try {
      const saved = localStorage.getItem(UNIT_STORAGE_KEY);
      return (saved === 'imperial' || saved === 'metric') ? saved : 'metric';
    } catch {
      return 'metric';
    }
  });

  // Theme mode (dark / light)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Favorites
  const [favorites, setFavorites] = useState<FavoriteLocation[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
    } catch {
      return INITIAL_FAVORITES;
    }
  });

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    try {
      const saved = localStorage.getItem(RECENTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        { id: 'rec-lahore', name: 'Lahore', country: 'Pakistan', latitude: 31.5497, longitude: 74.3436, timestamp: Date.now() - 100000 },
        { id: 'rec-islamabad', name: 'Islamabad', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479, timestamp: Date.now() - 200000 },
        { id: 'rec-london', name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timestamp: Date.now() - 300000 },
        { id: 'rec-dubai', name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timestamp: Date.now() - 400000 },
      ];
    } catch {
      return [];
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch (e) {
      console.warn(e);
    }
  }, [unit]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (e) {
      console.warn(e);
    }
  }, [themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn(e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recentSearches));
    } catch (e) {
      console.warn(e);
    }
  }, [recentSearches]);

  const addRecent = useCallback((loc: LocationData) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.name.toLowerCase() !== loc.name.toLowerCase()
      );
      const newEntry: RecentSearch = {
        id: `rec-${Date.now()}`,
        name: loc.name,
        region: loc.region,
        country: loc.country,
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: Date.now(),
      };
      return [newEntry, ...filtered].slice(0, 8);
    });
  }, []);

  const loadWeather = useCallback(
    async (params?: { city?: string; lat?: number; lon?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeather(params);
        setWeather(data);
        if (data.location) {
          addRecent(data.location);
        }
      } catch (err: any) {
        setError(err.message || "Couldn't retrieve weather information. Try another city.");
      } finally {
        setLoading(false);
      }
    },
    [addRecent]
  );

  // Initial load: defaults to Lahore, Pakistan as requested
  useEffect(() => {
    loadWeather({ city: 'Lahore' });
  }, [loadWeather]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadWeather({ lat: latitude, lon: longitude });
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("We couldn't access your location. Permission was denied. Search for a city instead.");
        } else {
          setError("Location detection timed out or failed. Please search for your city directly.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [loadWeather]);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const addFavorite = useCallback((loc: LocationData, tempCelsius?: number, condition?: string) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.name.toLowerCase() === loc.name.toLowerCase())) {
        return prev;
      }
      const newFav: FavoriteLocation = {
        id: `fav-${Date.now()}`,
        name: loc.name,
        region: loc.region,
        country: loc.country,
        latitude: loc.latitude,
        longitude: loc.longitude,
        tempCelsius,
        condition,
        addedAt: Date.now(),
      };
      return [...prev, newFav];
    });
  }, []);

  const removeFavorite = useCallback((idOrName: string) => {
    setFavorites((prev) =>
      prev.filter(
        (f) => f.id !== idOrName && f.name.toLowerCase() !== idOrName.toLowerCase()
      )
    );
  }, []);

  const isFavorite = useCallback(
    (name: string) => {
      return favorites.some((f) => f.name.toLowerCase() === name.toLowerCase());
    },
    [favorites]
  );

  const clearRecents = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    weather,
    loading,
    error,
    unit,
    themeMode,
    favorites,
    recentSearches,
    loadWeather,
    detectLocation,
    toggleUnit,
    toggleThemeMode,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearRecents,
  };
}
