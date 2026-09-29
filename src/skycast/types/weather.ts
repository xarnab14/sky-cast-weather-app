/* ============================================================
   SkyCast — shared weather types (canonical, original spec)
   ============================================================ */

export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark' | 'light';

export type WeatherTheme =
  | 'sunny'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'night'
  | 'default';

export interface LocationData {
  id: string | number;
  name: string;
  region?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  temperature: number; // always stored in Celsius from raw API
  apparentTemperature: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts?: number; // km/h
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number; // 0-12
  cloudCover: number; // %
  precipitation: number; // mm
  localTime: string; // "HH:MM" (location-local)
  dateFormatted: string;
  sunrise: string; // ISO-like "YYYY-MM-DDTHH:MM"
  sunset: string; // ISO-like "YYYY-MM-DDTHH:MM"
}

export interface HourlyPoint {
  time: string; // "HH:MM"
  isoTime: string; // "YYYY-MM-DDTHH:MM"
  hourLabel: string; // "2 PM"
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  condition: string;
  precipitationProbability: number;
  precipitation: number; // mm
  windSpeed: number; // km/h
  uvIndex: number;
  isDay: boolean;
  isCurrentHour?: boolean;
}

export interface DailyPoint {
  date: string; // "YYYY-MM-DD"
  dayName: string;
  shortDate: string;
  weatherCode: number;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  precipitationSum: number;
  uvIndexMax: number;
  windSpeedMax: number;
  sunrise: string; // ISO-like
  sunset: string; // ISO-like
}

export interface AirQualityData {
  aqi: number;
  category:
    | 'Good'
    | 'Moderate'
    | 'Unhealthy for Sensitive'
    | 'Unhealthy'
    | 'Very Unhealthy'
    | 'Hazardous';
  categoryColor: string;
  pm2_5: number;
  pm10: number;
  co: number; // mg/m³
  no2: number;
  o3: number;
  so2: number;
  summary: string;
}

export interface WeatherData {
  location: LocationData;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  airQuality?: AirQualityData;
  theme: WeatherTheme;
  lastUpdated: string; // ISO timestamp
  source?: 'live' | 'fallback';
}

export interface FavoriteLocation {
  id: string;
  name: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
  tempCelsius?: number; // quick-preview temperature, °C
  weatherCode?: number; // quick-preview condition icon
  condition?: string; // quick-preview condition text
  addedAt: number;
}

export interface RecentSearch {
  id: string;
  name: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

/* -------- additive types used by the surrounding app -------- */

export interface AiWeatherBrief {
  brief: string;
  outfit: string;
  recommendation: string;
}

export interface SkyArtResult {
  imageUrl: string;
}

export interface GeoSuggestion {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export type SkyCastTab = 'weather' | 'forecast' | 'maps' | 'favorites' | 'about';
