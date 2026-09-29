/* ============================================================
   SkyCast — API service layer (browser side)
   Original routes (?city=, /api/search, /api/ai/weather-brief,
   /api/ai/image) with relative URLs, plus the geocoding helpers
   the tabbed app uses. Resilience: fetchWeather falls back to
   client-side synthetic data when the proxy is unreachable.
   ============================================================ */

import { LocationData, WeatherData } from '../types/weather';
import { getFallbackWeatherData } from '../utils/fallbackData';

const API_BASE = import.meta.env.VITE_SKYCAST_API ?? '';

export async function fetchWeather(
  cityOrCoords?: { city?: string; lat?: number; lon?: number },
): Promise<WeatherData> {
  let url = `${API_BASE}/api/weather`;
  if (cityOrCoords?.lat !== undefined && cityOrCoords?.lon !== undefined) {
    url += `?lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  } else if (cityOrCoords?.city) {
    url += `?city=${encodeURIComponent(cityOrCoords.city)}`;
  } else {
    url += `?city=Lahore`;
  }

  try {
    const res = await fetch(url);
    if (res.status === 404) {
      // City not found by the geocoder — surface the error state
      // instead of fabricating data for a place that doesn't exist.
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(body.error || 'Location not found'), {
        noFallback: true,
      });
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if ((err as { noFallback?: boolean })?.noFallback) {
      throw err;
    }
    console.warn('API error, loading resilient fallback weather data:', err);
    return getFallbackWeatherData(cityOrCoords?.city || 'Lahore');
  }
}

/* Coordinate fetch with a descriptive place label (kept for
   compatibility with callers that pass explicit coordinates). */
export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
  place: string,
): Promise<WeatherData> {
  return fetchWeather({ lat, lon, city: place });
}

export async function searchLocations(query: string): Promise<LocationData[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Location search fallback:', err);
    return [];
  }
}

export async function fetchGeocoding(query: string): Promise<LocationData[]> {
  return searchLocations(query);
}

export async function fetchReverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const res = await fetch(
      `${API_BASE}/api/reverse-geocode?lat=${latitude}&lon=${longitude}`,
    );
    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();
    return data.label || 'My Location';
  } catch {
    return 'My Location';
  }
}

export async function fetchAiWeatherBrief(weather: WeatherData): Promise<{
  brief: string;
  outfit: string;
  recommendation: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/ai/weather-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: `${weather.location.name}, ${weather.location.country}`,
        condition: weather.current.condition,
        temp: weather.current.temperature,
        feelsLike: weather.current.apparentTemperature,
        humidity: weather.current.humidity,
        windSpeed: weather.current.windSpeed,
        uvIndex: weather.current.uvIndex,
        aqi: weather.airQuality?.category,
      }),
    });
    if (!res.ok) throw new Error('Brief request failed');
    return await res.json();
  } catch (err) {
    // Client-side fallback brief keeps the modal useful without a key.
    return {
      brief: `Current weather in ${weather.location.name} is ${weather.current.condition.toLowerCase()} with temperatures sitting at ${weather.current.temperature}°C.`,
      outfit:
        weather.current.temperature > 25
          ? 'Light, breathable clothing and UV sunglasses.'
          : 'A warm layer or light jacket.',
      recommendation: 'Great time for your planned activities.',
    };
  }
}

export async function generateAiWeatherImage(
  prompt: string,
  city: string,
  condition: string,
): Promise<{ imageUrl: string }> {
  const res = await fetch(`${API_BASE}/api/ai/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, city, condition }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate weather art');
  }
  return await res.json();
}
