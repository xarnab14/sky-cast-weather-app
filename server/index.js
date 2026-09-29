/* ============================================================
   SkyCast — Express API Proxy (server/index.js)

   • Reverse proxy for Open-Meteo (weather / air quality /
     geocoding) — keeps third-party traffic server-side.
   • In-memory TTL cache (10 min weather, 24 h geocoding).
   • `?city=` resolution: a bare city name is geocoded to
     coordinates and labeled "City, Region, Country".
   • Resilient fallback engine: shape-identical synthetic
     payloads so the UI never shows a broken state.
   • Gemini (gemini-2.5-flash) AI meteorologist brief +
     SkyArt image generation. GEMINI_API_KEY lives only here.

   Run:  npm run server   (http://localhost:3000)
   ============================================================ */

import express from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { GoogleGenAI } from '@google/genai';

const serverDir = dirname(fileURLToPath(import.meta.url));
const distPath = join(serverDir, '..', 'dist');

// Tiny .env loader (no dotenv dependency needed).
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"#\r\n]*)"?/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
} catch { /* .env is optional */ }

const PORT = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 3000;
const WEATHER_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GEO_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const app = express();

// Minimal CORS (dev-friendly: same-machine Vite origin).
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '1mb' }));

/* ---------------------------- cache ---------------------------- */

const cache = new Map(); // key -> { at, ttl, data }

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > hit.ttl) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data, ttl) {
  if (cache.size > 300) {
    const keys = [...cache.keys()].slice(0, 100);
    keys.forEach((k) => cache.delete(k));
  }
  cache.set(key, { at: Date.now(), ttl, data });
}

/* ------------------------- WMO decoding ------------------------ */

const WMO = {
  0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing Rime Fog',
  51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
  56: 'Freezing Drizzle', 57: 'Dense Freezing Drizzle',
  61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
  71: 'Slight Snow Fall', 73: 'Moderate Snow Fall', 75: 'Heavy Snow Fall', 77: 'Snow Grains',
  80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
  85: 'Slight Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm',
};

function describeWeather(code) {
  return WMO[code] ?? 'Partly Cloudy';
}

function themeForCode(code, isDay) {
  let theme = 'cloudy';
  if (code === 0 || code === 1) theme = 'sunny';
  else if (code === 2 || code === 3 || code === 45 || code === 48) theme = 'cloudy';
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) theme = 'rain';
  else if ((code >= 71 && code <= 77) || code === 85 || code === 86) theme = 'snow';
  else if (code >= 95) theme = 'storm';
  if (!isDay && (theme === 'sunny' || code === 0 || code === 1)) theme = 'night';
  return theme;
}

/* --------------------- 6-tier AQI evaluation ------------------- */

function evaluateAirQuality(usAqi) {
  const aqi = Math.round(usAqi);
  let category = 'Good';
  let categoryColor = 'text-emerald-400';
  let summary = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';

  if (aqi <= 50) {
    category = 'Good';
    categoryColor = 'text-emerald-400';
    summary = 'Air quality is ideal for outdoor activities and exercise.';
  } else if (aqi <= 100) {
    category = 'Moderate';
    categoryColor = 'text-amber-400';
    summary = 'Air quality is acceptable; unusually sensitive individuals should consider limiting outdoor exertion.';
  } else if (aqi <= 150) {
    category = 'Unhealthy for Sensitive';
    categoryColor = 'text-orange-400';
    summary = 'Members of sensitive groups may experience health effects; general public is less likely to be affected.';
  } else if (aqi <= 200) {
    category = 'Unhealthy';
    categoryColor = 'text-rose-400';
    summary = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.';
  } else if (aqi <= 300) {
    category = 'Very Unhealthy';
    categoryColor = 'text-purple-400';
    summary = 'Health alert: risk of health effects is increased for everyone.';
  } else {
    category = 'Hazardous';
    categoryColor = 'text-red-600';
    summary = 'Emergency warning: entire population is more likely to be severely affected.';
  }

  return { aqi, category, categoryColor, summary };
}

/* --------------------------- helpers --------------------------- */

async function fetchJson(url, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function hourLabel(hhmm) {
  const h = Number((hhmm || '').split(':')[0]);
  if (Number.isNaN(h)) return hhmm || '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ampm}`;
}

function isoDay(isoLike, fallback) {
  return typeof isoLike === 'string' && isoLike.includes('T') ? isoLike : fallback;
}

/* --------------------- location resolution --------------------- */
/* A bare city name is geocoded; coordinates alone are labeled
   via reverse geocoding. Results are cached for a day. */

async function geocodeCity(city) {
  const key = `geocity:${city.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
  );
  const r = data.results?.[0];
  if (!r) throw new Error(`Location "${city}" not found`);
  const resolved = {
    latitude: r.latitude,
    longitude: r.longitude,
    location: {
      id: r.id ?? `${r.latitude},${r.longitude}`,
      name: r.name,
      region: r.admin1 ?? '',
      country: r.country ?? '',
      countryCode: r.country_code ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone ?? 'auto',
    },
  };
  cacheSet(key, resolved, GEO_TTL_MS);
  return resolved;
}

async function reverseGeocodeCoords(lat, lon) {
  const key = `revgeo:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  try {
    const data = await fetchJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      6000,
    );
    const resolved = {
      location: {
        id: `${lat.toFixed(2)},${lon.toFixed(2)}`,
        name: data.city || data.locality || 'My Location',
        region: data.principalSubdivision ?? '',
        country: data.countryName ?? '',
        countryCode: data.countryCode ?? '',
        latitude: lat,
        longitude: lon,
        timezone: 'auto',
      },
    };
    cacheSet(key, resolved, GEO_TTL_MS);
    return resolved;
  } catch {
    return {
      location: {
        id: `${lat.toFixed(2)},${lon.toFixed(2)}`,
        name: 'My Location',
        region: '',
        country: '',
        latitude: lat,
        longitude: lon,
        timezone: 'auto',
      },
    };
  }
}

async function resolveLocation({ city, lat, lon }) {
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
    const { location } = await reverseGeocodeCoords(Number(lat), Number(lon));
    return { latitude: Number(lat), longitude: Number(lon), location };
  }
  if (city && city.trim()) {
    return geocodeCity(city.trim());
  }
  // Default: Lahore, Pakistan (per spec)
  return geocodeCity('Lahore');
}

/* ----------------------- fallback engine ----------------------- */
/* Plausible synthetic data seeded from coordinates + date so the
   app remains fully usable when Open-Meteo is unreachable.
   Shape-identical to the live payload. */

function pseudoRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildFallbackPayload(latitude, longitude, location) {
  const now = new Date();
  const currentHour = now.getHours();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const seasonal = Math.cos(((dayOfYear - 195) / 365) * 2 * Math.PI);
  const baseTemp = 27 - Math.abs(latitude) * 0.45 + seasonal * (latitude >= 0 ? -6 : 6);
  const jitter = pseudoRandom(latitude * 7 + longitude * 13 + now.getDate()) * 4 - 2;
  const temperature = Math.round((baseTemp + jitter) * 10) / 10;
  const weatherCode = [0, 1, 2, 3, 61, 80][Math.floor(pseudoRandom(latitude + longitude + currentHour) * 6)];
  const isDay = currentHour >= 6 && currentHour < 19;

  const sunriseIso = new Date();
  sunriseIso.setHours(5, 42, 0, 0);
  const sunsetIso = new Date();
  sunsetIso.setHours(18, 48, 0, 0);
  const toIso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const sunrise = toIso(sunriseIso);
  const sunset = toIso(sunsetIso);

  const hourly = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date();
    d.setHours(i, 0, 0, 0);
    const hour = d.getHours();
    const dayHour = hour >= 6 && hour < 19;
    const hhmm = `${String(hour).padStart(2, '0')}:00`;
    const temp = Math.round(26 + 8 * Math.sin(((hour - 7) / 24) * 2 * Math.PI));
    const code = hour >= 11 && hour <= 16 ? 2 : 1;
    hourly.push({
      time: hhmm,
      isoTime: toIso(d),
      hourLabel: hourLabel(hhmm),
      temperature: temp,
      apparentTemperature: temp + 3,
      weatherCode: code,
      condition: describeWeather(code),
      precipitationProbability: hour === 15 ? 15 : 5,
      precipitation: 0,
      windSpeed: 10 + Math.round(Math.sin(i) * 5),
      uvIndex: dayHour ? Math.max(0, Math.round(7 * Math.sin(((hour - 6) / 13) * Math.PI))) : 0,
      isDay: dayHour,
      isCurrentHour: hour === currentHour,
    });
  }

  const daily = [];
  for (let dI = 0; dI < 7; dI++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dI);
    const code = [0, 1, 2, 3, 61, 80, 95][Math.floor(pseudoRandom(day.getDate() * 7 + latitude) * 7)];
    daily.push({
      date: day.toISOString().slice(0, 10),
      dayName: dI === 0 ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      condition: describeWeather(code),
      weatherCode: code,
      tempMax: Math.round(temperature + 2 + pseudoRandom(dI + latitude) * 3),
      tempMin: Math.round(temperature - 4 + pseudoRandom(dI + longitude) * 3),
      precipitationProbability: Math.round(pseudoRandom(dI * 5 + longitude) * (WMO[code] > 50 ? 80 : 20)),
      precipitationSum: Math.round(pseudoRandom(dI * 9 + latitude) * 12 * 10) / 10,
      windSpeedMax: Math.round(10 + pseudoRandom(dI * 11 + longitude) * 25),
      uvIndexMax: Math.round(2 + pseudoRandom(dI * 13 + latitude) * 8),
      sunrise,
      sunset,
    });
  }

  return {
    location,
    current: {
      temperature,
      apparentTemperature: Math.round((temperature + 1.5) * 10) / 10,
      condition: describeWeather(weatherCode),
      weatherCode,
      isDay,
      humidity: Math.round(45 + pseudoRandom(latitude) * 40),
      windSpeed: Math.round(6 + pseudoRandom(longitude) * 22),
      windDirection: Math.round(pseudoRandom(latitude + longitude) * 360),
      windGusts: Math.round((6 + pseudoRandom(longitude) * 22) * 1.3),
      pressure: Math.round(1004 + pseudoRandom(currentHour) * 18),
      visibility: Math.round(12 + pseudoRandom(now.getDate()) * 12),
      uvIndex: isDay ? Math.round(2 + pseudoRandom(now.getDate() + 1) * 8) : 0,
      cloudCover: Math.round(pseudoRandom(weatherCode) * 90),
      precipitation: 0,
      sunrise,
      sunset,
      localTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      dateFormatted: now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    },
    hourly,
    daily,
    airQuality: evaluateAirQuality(Math.round(40 + pseudoRandom(latitude + longitude + now.getDate()) * 80)),
    theme: themeForCode(weatherCode, isDay),
    lastUpdated: now.toISOString(),
    source: 'fallback',
  };
}

/* --------------------- weather aggregation --------------------- */

async function buildWeatherPayload(latitude, longitude, location) {
  const key = `wx:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,` +
    `visibility,pressure_msl,uv_index,cloud_cover,weather_code,is_day` +
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,is_day,wind_speed_10m,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
    `precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=7&wind_speed_unit=kmh`;

  let wx;
  try {
    wx = await fetchJson(url);
  } catch (err) {
    console.warn(`[skycast] open-meteo failed for ${latitude},${longitude}: ${err.message}`);
    const fb = buildFallbackPayload(latitude, longitude, location);
    cacheSet(key, fb, 2 * 60 * 1000); // brief cache so retries happen soon
    return fb;
  }

  const c = wx.current ?? {};
  const hourlyAll = wx.hourly ?? {};
  const nowIso = c.time ?? '';
  let startIdx = (hourlyAll.time ?? []).findIndex((t) => t >= nowIso);
  if (startIdx < 0) startIdx = 0;

  const hourly = [];
  for (let i = startIdx; i < Math.min(startIdx + 24, (hourlyAll.time ?? []).length); i++) {
    const isoTime = hourlyAll.time[i] ?? '';
    const hhmm = isoTime.slice(11, 16);
    hourly.push({
      time: hhmm,
      isoTime,
      hourLabel: hourLabel(hhmm),
      temperature: hourlyAll.temperature_2m?.[i] ?? 0,
      apparentTemperature: hourlyAll.apparent_temperature?.[i] ?? 0,
      weatherCode: hourlyAll.weather_code?.[i] ?? 0,
      condition: describeWeather(hourlyAll.weather_code?.[i] ?? 0),
      precipitationProbability: hourlyAll.precipitation_probability?.[i] ?? 0,
      precipitation: hourlyAll.precipitation?.[i] ?? 0,
      windSpeed: hourlyAll.wind_speed_10m?.[i] ?? 0,
      uvIndex: Math.round(hourlyAll.uv_index?.[i] ?? 0),
      isDay: Boolean(hourlyAll.is_day?.[i]),
      isCurrentHour: isoTime === nowIso,
    });
  }

  const daily = (wx.daily?.time ?? []).map((date, i) => ({
    date,
    dayName: i === 0 ? 'Today' : new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
    shortDate: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    condition: describeWeather(wx.daily.weather_code?.[i] ?? 0),
    weatherCode: wx.daily.weather_code?.[i] ?? 0,
    tempMax: wx.daily.temperature_2m_max?.[i] ?? 0,
    tempMin: wx.daily.temperature_2m_min?.[i] ?? 0,
    precipitationProbability: wx.daily.precipitation_probability_max?.[i] ?? 0,
    precipitationSum: wx.daily.precipitation_sum?.[i] ?? 0,
    windSpeedMax: wx.daily.wind_speed_10m_max?.[i] ?? 0,
    uvIndexMax: Math.round(wx.daily.uv_index_max?.[i] ?? 0),
    sunrise: wx.daily.sunrise?.[i] ?? '',
    sunset: wx.daily.sunset?.[i] ?? '',
  }));

  const currentWeatherCode = c.weather_code ?? 0;
  const currentIsDay = Boolean(c.is_day);

  const payload = {
    location,
    current: {
      temperature: c.temperature_2m ?? 0,
      apparentTemperature: c.apparent_temperature ?? 0,
      condition: describeWeather(currentWeatherCode),
      weatherCode: currentWeatherCode,
      isDay: currentIsDay,
      humidity: c.relative_humidity_2m ?? 0,
      windSpeed: c.wind_speed_10m ?? 0,
      windGusts: c.wind_gusts_10m ?? Math.round((c.wind_speed_10m ?? 0) * 1.3),
      windDirection: c.wind_direction_10m ?? 0,
      visibility: Math.round((c.visibility ?? 0) / 100) / 10, // meters -> km, 1 decimal
      pressure: Math.round(c.pressure_msl ?? 1013),
      uvIndex: Math.round(c.uv_index ?? 0),
      cloudCover: c.cloud_cover ?? 0,
      precipitation: c.precipitation ?? 0,
      sunrise: isoDay(wx.daily?.sunrise?.[0], `${wx.daily?.time?.[0] ?? ''}T06:00`),
      sunset: isoDay(wx.daily?.sunset?.[0], `${wx.daily?.time?.[0] ?? ''}T18:00`),
      localTime: nowIso.slice(11, 16) || '00:00',
      dateFormatted: nowIso
        ? new Date(nowIso).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '',
    },
    hourly,
    daily,
    airQuality: null,
    theme: themeForCode(currentWeatherCode, currentIsDay),
    lastUpdated: new Date().toISOString(),
    source: 'live',
  };

  // Air quality is best-effort; failure leaves it null.
  try {
    const aqUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
      `&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide,sulphur_dioxide&timezone=auto`;
    const aq = await fetchJson(aqUrl, 6000);
    const a = aq.current ?? {};
    payload.airQuality = {
      ...evaluateAirQuality(a.us_aqi ?? 0),
      pm2_5: Math.round((a.pm2_5 ?? 0) * 10) / 10,
      pm10: Math.round((a.pm10 ?? 0) * 10) / 10,
      o3: Math.round(a.ozone ?? 0),
      no2: Math.round(a.nitrogen_dioxide ?? 0),
      co: Math.round(((a.carbon_monoxide ?? 0) / 1000) * 10) / 10, // µg/m³ -> mg/m³
      so2: Math.round(a.sulphur_dioxide ?? 0),
    };
  } catch {
    /* keep airQuality null */
  }

  cacheSet(key, payload, WEATHER_TTL_MS);
  return payload;
}

/* --------------------------- routes ---------------------------- */

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'skycast-proxy', time: new Date().toISOString() });
});

app.get('/api/weather', async (req, res) => {
  const city = req.query.city !== undefined ? String(req.query.city) : undefined;
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
  const lon = req.query.lon !== undefined ? Number(req.query.lon) : undefined;

  if (req.query.lat !== undefined && !Number.isFinite(lat)) {
    return res.status(400).json({ error: 'lat must be a number' });
  }
  if (req.query.lon !== undefined && !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lon must be a number' });
  }

  try {
    const resolved = await resolveLocation({ city, lat, lon });
    res.json(await buildWeatherPayload(resolved.latitude, resolved.longitude, resolved.location));
  } catch (err) {
    console.error('[skycast] /api/weather error:', err.message);
    // Unknown city (geocode miss): report a 404 so the client can
    // surface its error state rather than data for the wrong place.
    if (/not found/i.test(err.message)) {
      return res.status(404).json({ error: err.message });
    }
    res.status(502).json({ error: 'Weather aggregation failed' });
  }
});

app.get('/api/forecast', async (req, res) => {
  // Filtered alias of /api/weather: just the location + hourly + daily
  // blocks. Uses the same cache (no extra upstream traffic).
  try {
    const city = req.query.city !== undefined ? String(req.query.city) : 'Lahore';
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lon = req.query.lon !== undefined ? Number(req.query.lon) : undefined;
    const resolved = await resolveLocation({ city, lat, lon });
    const full = await buildWeatherPayload(resolved.latitude, resolved.longitude, resolved.location);
    res.json({ location: full.location, hourly: full.hourly, daily: full.daily });
  } catch (err) {
    console.error('[skycast] /api/forecast error:', err.message);
    if (/not found/i.test(err.message)) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Failed to retrieve forecast' });
  }
});

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) return res.json({ results: [] });
  const key = `search:${q.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);

  try {
    const data = await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`,
    );
    const results = (data.results ?? []).map((r) => ({
      id: r.id ?? `${r.latitude},${r.longitude}`,
      name: r.name,
      region: r.admin1 ?? '',
      country: r.country ?? '',
      countryCode: r.country_code ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone ?? 'auto',
    }));
    const payload = { results };
    cacheSet(key, payload, GEO_TTL_MS);
    res.json(payload);
  } catch (err) {
    console.warn('[skycast] search failed:', err.message);
    res.json({ results: [] });
  }
});

app.get('/api/reverse-geocode', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon required' });
  }
  const { location } = await reverseGeocodeCoords(lat, lon);
  const label = [location.name, location.region, location.country].filter(Boolean).join(', ');
  res.json({ label: label || 'My Location' });
});

/* --------------------------- Gemini ---------------------------- */

let genai = null;
function getGenai() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genai) genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return genai;
}

app.post('/api/ai/weather-brief', async (req, res) => {
  const { city, condition, temp, feelsLike, humidity, windSpeed, uvIndex, aqi } = req.body ?? {};
  if (!city) return res.status(400).json({ error: 'city required' });

  const ai = getGenai();
  if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY not configured on the server' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents:
        'You are SkyCast, a friendly AI meteorologist. Using ONLY the observations below, reply with STRICT JSON ' +
        '(no markdown fences) shaped as {"brief": string, "outfit": string, "recommendation": string}. ' +
        '"brief": a 2-3 sentence executive weather summary. "outfit": one practical clothing suggestion sentence. ' +
        '"recommendation": one outdoor-activity tip sentence.\n\nOBSERVATIONS:\n' +
        [
          `Location: ${city}`,
          `Condition: ${condition ?? 'unknown'}`,
          `Temperature: ${temp}°C (feels like ${feelsLike}°C)`,
          `Humidity: ${humidity}%`,
          `Wind: ${windSpeed} km/h`,
          `UV index: ${uvIndex}`,
          `Air quality category: ${aqi ?? 'unknown'}`,
        ].join('\n'),
    });
    const text = (response.text ?? '').trim().replace(/^```(?:json)?|```$/g, '');
    const parsed = JSON.parse(text);
    res.json({
      brief: String(parsed.brief ?? ''),
      outfit: String(parsed.outfit ?? ''),
      recommendation: String(parsed.recommendation ?? ''),
    });
  } catch (err) {
    console.error('[skycast] /api/ai/weather-brief error:', err.message);
    res.status(502).json({ error: 'AI brief unavailable right now' });
  }
});

app.post('/api/ai/image', async (req, res) => {
  const { prompt, city, condition } = req.body ?? {};
  if (!city && !prompt) return res.status(400).json({ error: 'prompt or city required' });

  const ai = getGenai();
  if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY not configured on the server' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents:
        `Generate a beautiful atmospheric fine-art landscape painting of the sky over ${city ?? 'the location'}, ` +
        `reflecting this weather: ${condition || 'clear sky'}. ${prompt ?? ''} No text or watermarks in the image.`,
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((p) => p.inlineData?.data);
    if (!inline) return res.status(502).json({ error: 'No image returned by the model' });
    const { mimeType, data } = inline.inlineData;
    res.json({ imageUrl: `data:${mimeType};base64,${data}` });
  } catch (err) {
    console.error('[skycast] /api/ai/image error:', err.message);
    res.status(502).json({ error: 'SkyArt generation is taking a breath. Try again shortly.' });
  }
});

/* -------------------------- reverse proxy ---------------------- */
/* Any /api/proxy/* call forwards to a whitelisted upstream — kept
   minimal: users can extend WHITELIST for their own integrations. */

const WHITELIST = {
  'open-meteo': 'https://api.open-meteo.com/v1/',
  'air-quality': 'https://air-quality-api.open-meteo.com/v1/',
};

app.all('/api/proxy/:service/*splat', async (req, res) => {
  const base = WHITELIST[req.params.service];
  if (!base) return res.status(404).json({ error: 'unknown proxy service' });
  const target = base + req.params.splat;
  try {
    res.json(await fetchJson(target));
  } catch (err) {
    res.status(502).json({ error: `upstream failed: ${err.message}` });
  }
});

/* ------------------------- static SPA -------------------------- */
/* After `npm run build`, this serves the standalone SkyCast UI on the
   same port as the API — one process, one port, deployable anywhere. */

app.use(express.static(distPath));
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 SkyCast running on http://localhost:${PORT}`);
  console.log(`   UI: ${existsSync(join(distPath, 'index.html')) ? 'serving built app (single-port mode)' : 'API only (run `npm run build` to serve the UI here)'}`);
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? 'enabled' : 'disabled (set GEMINI_API_KEY in .env)'}`);
});
