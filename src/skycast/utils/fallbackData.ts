/* ============================================================
   SkyCast — client-side resilient fallback data
   Last line of defense: if the proxy itself is unreachable
   (offline, server down), fabricate plausible data so the UI
   never shows a broken state. Shape-identical to the server
   payload (source: 'fallback').
   ============================================================ */

import { WeatherData } from '../types/weather';
import { evaluateAirQuality, getWeatherInfo } from './weatherUtils';

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getFallbackWeatherData(city: string = 'Lahore', country: string = 'Pakistan'): WeatherData {
  const now = new Date();
  const currentHour = now.getHours();

  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const localTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const sunriseIso = new Date();
  sunriseIso.setHours(5, 42, 0, 0);
  const sunsetIso = new Date();
  sunsetIso.setHours(18, 48, 0, 0);
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const sunrise = toIso(sunriseIso);
  const sunset = toIso(sunsetIso);

  // Diurnal hourly curve peaking mid-afternoon.
  const hourly = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date();
    d.setHours(i, 0, 0, 0);
    const hour = d.getHours();
    const isDay = hour >= 6 && hour < 19;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hourLabel = `${hour % 12 || 12} ${ampm}`;
    const hhmm = `${String(hour).padStart(2, '0')}:00`;

    const temp = Math.round(26 + 8 * Math.sin(((hour - 7) / 24) * 2 * Math.PI));
    const code = hour >= 11 && hour <= 16 ? 2 : 1;

    return {
      time: hhmm,
      isoTime: toIso(d),
      hourLabel,
      temperature: temp,
      apparentTemperature: temp + 3,
      weatherCode: code,
      condition: getWeatherInfo(code, isDay).condition,
      precipitationProbability: hour === 15 ? 15 : 5,
      precipitation: 0,
      windSpeed: 10 + Math.round(Math.sin(i) * 5),
      uvIndex: isDay ? Math.max(0, Math.round(7 * Math.sin(((hour - 6) / 13) * Math.PI))) : 0,
      isDay,
      isCurrentHour: hour === currentHour,
    };
  });

  // Seven days of plausible forecasts.
  const conditions = [
    { code: 2, condition: 'Partly Cloudy', max: 34, min: 26, rain: 10 },
    { code: 0, condition: 'Clear Sky', max: 35, min: 27, rain: 5 },
    { code: 2, condition: 'Partly Cloudy', max: 34, min: 26, rain: 15 },
    { code: 61, condition: 'Slight Rain', max: 30, min: 25, rain: 65 },
    { code: 3, condition: 'Overcast', max: 31, min: 24, rain: 30 },
    { code: 1, condition: 'Mainly Clear', max: 33, min: 25, rain: 10 },
    { code: 0, condition: 'Clear Sky', max: 36, min: 27, rain: 0 },
  ];

  const daily = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const cond = conditions[i % conditions.length];

    return {
      date: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weatherCode: cond.code,
      condition: cond.condition,
      tempMax: cond.max,
      tempMin: cond.min,
      precipitationProbability: cond.rain,
      precipitationSum: cond.rain > 50 ? 8.4 : 0.2,
      uvIndexMax: 7,
      windSpeedMax: 16,
      sunrise,
      sunset,
    };
  });

  return {
    location: {
      id: 'fallback-default',
      name: city,
      region: '—',
      country,
      latitude: 31.5497,
      longitude: 74.3436,
      timezone: 'auto',
    },
    current: {
      temperature: 31,
      apparentTemperature: 34,
      weatherCode: 2,
      condition: 'Partly Cloudy',
      isDay: currentHour >= 6 && currentHour < 19,
      humidity: 72,
      windSpeed: 14,
      windDirection: 135,
      windGusts: 22,
      pressure: 1012,
      visibility: 8,
      uvIndex: 6,
      cloudCover: 35,
      precipitation: 0,
      localTime,
      dateFormatted,
      sunrise,
      sunset,
    },
    hourly,
    daily,
    airQuality: evaluateAirQuality(92), // Moderate AQI
    theme: 'cloudy',
    lastUpdated: now.toISOString(),
    source: 'fallback',
  };
}
