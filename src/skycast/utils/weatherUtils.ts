import { AirQualityData, UnitSystem, WeatherTheme } from '../types/weather';

export interface WeatherCodeInfo {
  condition: string;
  theme: WeatherTheme;
  iconName: string;
  description: string;
}

export const WMO_CODE_MAP: Record<number, WeatherCodeInfo> = {
  0: { condition: 'Clear Sky', theme: 'sunny', iconName: 'Sun', description: 'Completely clear skies' },
  1: { condition: 'Mainly Clear', theme: 'sunny', iconName: 'SunMedium', description: 'Mostly clear, faint wisps' },
  2: { condition: 'Partly Cloudy', theme: 'cloudy', iconName: 'CloudSun', description: 'Scattered clouds throughout' },
  3: { condition: 'Overcast', theme: 'cloudy', iconName: 'Cloud', description: 'Persistent dense cloud cover' },
  45: { condition: 'Foggy', theme: 'cloudy', iconName: 'CloudFog', description: 'Reduced visibility due to fog' },
  48: { condition: 'Depositing Rime Fog', theme: 'cloudy', iconName: 'CloudFog', description: 'Freezing dense mist' },
  51: { condition: 'Light Drizzle', theme: 'rain', iconName: 'CloudDrizzle', description: 'Light patchy drizzle' },
  53: { condition: 'Moderate Drizzle', theme: 'rain', iconName: 'CloudDrizzle',description: 'Steady gentle drizzle' },
  55: { condition: 'Dense Drizzle', theme: 'rain', iconName: 'CloudRain', description: 'Heavy misty precipitation' },
  56: { condition: 'Freezing Drizzle', theme: 'snow', iconName: 'CloudSnow', description: 'Freezing misty precipitation' },
  57: { condition: 'Dense Freezing Drizzle', theme: 'snow', iconName: 'CloudSnow', description: 'Heavy freezing drizzle' },
  61: { condition: 'Slight Rain', theme: 'rain', iconName: 'CloudRain', description: 'Scattered gentle rainfall' },
  62: { condition: 'Moderate Rain', theme: 'rain', iconName: 'CloudRain', description: 'Continuous steady rain' },
  63: { condition: 'Moderate Rain', theme: 'rain', iconName: 'CloudRain', description: 'Steady rainfall' },
  65: { condition: 'Heavy Rain', theme: 'rain', iconName: 'CloudRainWind', description: 'Substantial downpour' },
  66: { condition: 'Light Freezing Rain', theme: 'snow', iconName: 'CloudSnow', description: 'Cold rain freezing on surface' },
  67: { condition: 'Heavy Freezing Rain', theme: 'snow', iconName: 'CloudSnow', description: 'Hazardous freezing downpour' },
  71: { condition: 'Slight Snow Fall', theme: 'snow', iconName: 'CloudSnow', description: 'Gentle falling snowflakes' },
  73: { condition: 'Moderate Snow Fall', theme: 'snow', iconName: 'CloudSnow', description: 'Steady accumulation of snow' },
  75: { condition: 'Heavy Snow Fall', theme: 'snow', iconName: 'Snowflake', description: 'Intense blizzard-like snow' },
  77: { condition: 'Snow Grains', theme: 'snow', iconName: 'Snowflake', description: 'Small crystalline snow grains' },
  80: { condition: 'Slight Rain Showers', theme: 'rain', iconName: 'CloudRain', description: 'Brief passing showers' },
  81: { condition: 'Moderate Rain Showers', theme: 'rain', iconName: 'CloudRain', description: 'Periodic heavy showers' },
  82: { condition: 'Violent Rain Showers', theme: 'storm', iconName: 'CloudRainWind', description: 'Torrential localized showers' },
  85: { condition: 'Slight Snow Showers', theme: 'snow', iconName: 'CloudSnow', description: 'Brief passing flurries' },
  86: { condition: 'Heavy Snow Showers', theme: 'snow', iconName: 'CloudSnow', description: 'Intense snow squalls' },
  95: { condition: 'Thunderstorm', theme: 'storm', iconName: 'CloudLightning', description: 'Active thunder and lightning' },
  96: { condition: 'Thunderstorm with Hail', theme: 'storm', iconName: 'CloudLightning', description: 'Severe convective thunderstorm' },
  99: { condition: 'Severe Thunderstorm', theme: 'storm', iconName: 'CloudLightning', description: 'Violent squalls and hail' },
};

export function getWeatherInfo(code: number, isDay: boolean = true): WeatherCodeInfo {
  const info = WMO_CODE_MAP[code] || {
    condition: 'Partly Cloudy',
    theme: 'cloudy',
    iconName: 'CloudSun',
    description: 'Variable cloud conditions',
  };

  if (!isDay && (code === 0 || code === 1)) {
    return {
      ...info,
      condition: code === 0 ? 'Clear Night' : 'Mainly Clear Night',
      theme: 'night',
      iconName: 'Moon',
      description: 'Starlit tranquil night sky',
    };
  }

  if (!isDay && info.theme === 'sunny') {
    return {
      ...info,
      theme: 'night',
      iconName: 'Moon',
    };
  }
  return info;
}

export function convertTemp(celsius: number, unit: UnitSystem): number {
  if (unit === 'imperial') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function formatTemp(celsius: number, unit: UnitSystem, showUnit: boolean = true): string {
  const val = convertTemp(celsius, unit);
  return `${val}°${showUnit ? (unit === 'imperial' ? 'F' : 'C') : ''}`;
}

export function convertWind(kmh: number, unit: UnitSystem): { value: number; unit: string } {
  if (unit === 'imperial') {
    return { value: Math.round(kmh * 0.621371), unit: 'mph' };
  }
  return { value: Math.round(kmh), unit: 'km/h' };
}

export function formatWind(kmh: number, unit: UnitSystem): string {
  const { value, unit: u } = convertWind(kmh, unit);
  return `${value} ${u}`;
}

export function formatVisibility(km: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const miles = (km * 0.621371).toFixed(1);
    return `${miles} mi`;
  }
  return `${km.toFixed(0)} km`;
}

export function formatPressure(hPa: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const inHg = (hPa * 0.02953).toFixed(2);
    return `${inHg} inHg`;
  }
  return `${Math.round(hPa)} hPa`;
}

export function getWindDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index] || 'N';
}

export function getUvRisk(uv: number): { label: string; color: string; advice: string } {
  if (uv <= 2) return { label: 'Low', color: 'text-emerald-400', advice: 'No protection required. Safe outdoors.' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-amber-400', advice: 'Wear sunglasses & SPF 30+ around midday.' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-400', advice: 'Protection required. Seek shade during peak hours.' };
  if (uv <= 10) return { label: 'Very High', color: 'text-rose-400', advice: 'Extra protection. Minimize midday sun exposure.' };
  return { label: 'Extreme', color: 'text-purple-400', advice: 'Avoid sun outside if possible. Take all precautions.' };
}

export function calculateSunMetrics(sunriseStr: string, sunsetStr: string, currentTimeStr?: string) {
  try {
    // Accepts ISO-like strings, "HH:MM", and "H:MM AM/PM" — the
    // server and fallback engine emit all three shapes.
    const parseMinutes = (s: string, fb: Date): number => {
      const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\s*$/.exec(s ?? '');
      if (m) {
        let h = Number(m[1]) % 24;
        const min = Number(m[2]);
        const ap = m[3]?.toUpperCase();
        if (ap === 'PM' && h < 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      }
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
      return fb.getHours() * 60 + fb.getMinutes();
    };

    const localNow = new Date();
    const nowMinutes = currentTimeStr
      ? parseMinutes(currentTimeStr, localNow)
      : localNow.getHours() * 60 + localNow.getMinutes();
    const sunriseMinutes = parseMinutes(sunriseStr, localNow);
    const sunsetMinutes = parseMinutes(sunsetStr, localNow);

    const totalDayMinutes = Math.max(1, sunsetMinutes - sunriseMinutes);
    const dayHours = Math.floor(totalDayMinutes / 60);
    const dayMins = totalDayMinutes % 60;

    let progress = 0;
    let isDaytime = false;

    if (nowMinutes >= sunriseMinutes && nowMinutes <= sunsetMinutes) {
      progress = ((nowMinutes - sunriseMinutes) / totalDayMinutes) * 100;
      isDaytime = true;
    } else if (nowMinutes > sunsetMinutes) {
      progress = 100;
      isDaytime = false;
    } else {
      progress = 0;
      isDaytime = false;
    }

    const formatTime = (minutes: number) => {
      let h = Math.floor(minutes / 60) % 24;
      const m = (minutes % 60).toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    };

    return {
      progress: Math.min(100, Math.max(0, Math.round(progress))),
      isDaytime,
      dayLength: `${dayHours}h ${dayMins}m`,
      formattedSunrise: formatTime(sunriseMinutes),
      formattedSunset: formatTime(sunsetMinutes),
    };
  } catch {
    return {
      progress: 50,
      isDaytime: true,
      dayLength: '12h 10m',
      formattedSunrise: '5:42 AM',
      formattedSunset: '6:48 PM',
    };
  }
}

export function evaluateAirQuality(usAqi: number): AirQualityData {
  let category: AirQualityData['category'] = 'Good';
  let categoryColor = 'text-emerald-400';
  let summary = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';

  if (usAqi <= 50) {
    category = 'Good';
    categoryColor = 'text-emerald-400';
    summary = 'Air quality is ideal for outdoor activities and exercise.';
  } else if (usAqi <= 100) {
    category = 'Moderate';
    categoryColor = 'text-amber-400';
    summary = 'Air quality is acceptable; unusually sensitive individuals should consider limiting outdoor exertion.';
  } else if (usAqi <= 150) {
    category = 'Unhealthy for Sensitive';
    categoryColor = 'text-orange-400';
    summary = 'Members of sensitive groups may experience health effects; general public is less likely to be affected.';
  } else if (usAqi <= 200) {
    category = 'Unhealthy';
    categoryColor = 'text-rose-400';
    summary = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.';
  } else if (usAqi <= 300) {
    category = 'Very Unhealthy';
    categoryColor = 'text-purple-400';
    summary = 'Health alert: risk of health effects is increased for everyone.';
  } else {
    category = 'Hazardous';
    categoryColor = 'text-red-600';
    summary = 'Emergency warning: entire population is more likely to be severely affected.';
  }

  return {
    aqi: Math.round(usAqi),
    category,
    categoryColor,
    pm2_5: Math.round(usAqi * 0.4 + 5),
    pm10: Math.round(usAqi * 0.7 + 10),
    co: +(0.3 + usAqi * 0.005).toFixed(1),
    no2: Math.round(usAqi * 0.2 + 8),
    o3: Math.round(usAqi * 0.3 + 15),
    so2: Math.round(usAqi * 0.1 + 3),
    summary,
  };
}

export const POPULAR_LOCATIONS = [
  { name: 'Lahore', country: 'Pakistan', region: 'Punjab', latitude: 31.5497, longitude: 74.3436 },
  { name: 'Islamabad', country: 'Pakistan', region: 'Islamabad', latitude: 33.6844, longitude: 73.0479 },
  { name: 'Karachi', country: 'Pakistan', region: 'Sindh', latitude: 24.8607, longitude: 67.0011 },
  { name: 'Rawalpindi', country: 'Pakistan', region: 'Punjab', latitude: 33.5651, longitude: 73.0169 },
  { name: 'London', country: 'United Kingdom', region: 'Greater London', latitude: 51.5074, longitude: -0.1278 },
  { name: 'New York', country: 'United States', region: 'New York', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Dubai', country: 'United Arab Emirates', region: 'Dubai', latitude: 25.2048, longitude: 55.2708 },
  { name: 'Tokyo', country: 'Japan', region: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Paris', country: 'France', region: 'Île-de-France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Sydney', country: 'Australia', region: 'New South Wales', latitude: -33.8688, longitude: 151.2093 },
];

/* ============================================================
   Helper used by the hand-rolled SVG thermal curve
   (Catmull-Rom smoothing over a list of {x, y} points).
   ============================================================ */

export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  const d: string[] = [`M ${points[0].x},${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`);
  }
  return d.join(' ');
}
