/* ============================================================
   SkyCast — WeatherDetails
   Atmospheric parameter grid with derived comfort descriptions
   (original component; visibility descriptions now compare in
   km since that's what the server provides).
   ============================================================ */

import React from 'react';
import {
  Droplets,
  Wind,
  Eye,
  Gauge,
  SunMedium,
  Cloud,
  Activity,
} from 'lucide-react';
import { CurrentWeather, ThemeMode, UnitSystem } from '../types/weather';
import {
  formatWind,
  formatVisibility,
  formatPressure,
  getWindDirection,
  getUvRisk,
} from '../utils/weatherUtils';

interface WeatherDetailsProps {
  current: CurrentWeather;
  unit: UnitSystem;
  themeMode: ThemeMode;
}

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({
  current,
  unit,
  themeMode,
}) => {
  const isDark = themeMode === 'dark';
  const uvInfo = getUvRisk(current.uvIndex);
  const windDir = getWindDirection(current.windDirection);
  const visKm = current.visibility;

  // Derived descriptive comfort level
  const getHumidityComfort = (humidity: number) => {
    if (humidity < 30) return 'Dry air, hydrate frequently';
    if (humidity <= 60) return 'Comfortable, healthy moisture';
    if (humidity <= 75) return 'Moderate humidity, humid feel';
    return 'Very humid, muggy atmosphere';
  };

  const getVisibilityDescription = (km: number) => {
    if (km >= 10) return 'Completely clear horizon';
    if (km >= 5) return 'Good visibility, slight haze';
    if (km >= 2) return 'Moderate mist or particulates';
    return 'Poor visibility, drive with caution';
  };

  const getPressureTendency = (hPa: number) => {
    if (hPa >= 1020) return 'High pressure, settled calm';
    if (hPa >= 1010) return 'Normal barometric pressure';
    return 'Low pressure, unsettled weather likely';
  };

  const cards = [
    {
      id: 'metric-humidity',
      label: 'Humidity',
      value: `${current.humidity}%`,
      description: getHumidityComfort(current.humidity),
      icon: Droplets,
      iconColor: 'text-sky-400 bg-sky-500/15',
    },
    {
      id: 'metric-wind',
      label: 'Wind Status',
      value: formatWind(current.windSpeed, unit),
      description: `${windDir} direction • Gusts to ${formatWind(current.windGusts ?? current.windSpeed * 1.3, unit)}`,
      icon: Wind,
      iconColor: 'text-indigo-400 bg-indigo-500/15',
    },
    {
      id: 'metric-visibility',
      label: 'Visibility',
      value: formatVisibility(current.visibility, unit),
      description: getVisibilityDescription(visKm),
      icon: Eye,
      iconColor: 'text-emerald-400 bg-emerald-500/15',
    },
    {
      id: 'metric-pressure',
      label: 'Pressure',
      value: formatPressure(current.pressure, unit),
      description: getPressureTendency(current.pressure),
      icon: Gauge,
      iconColor: 'text-purple-400 bg-purple-500/15',
    },
    {
      id: 'metric-uv-index',
      label: 'UV Index',
      value: `${current.uvIndex} (${uvInfo.label})`,
      description: uvInfo.advice,
      icon: SunMedium,
      iconColor: 'text-amber-400 bg-amber-500/15',
    },
    {
      id: 'metric-cloud-cover',
      label: 'Cloud Cover',
      value: `${current.cloudCover}%`,
      description: current.cloudCover > 70 ? 'Dense overcast' : current.cloudCover > 30 ? 'Scattered breaks' : 'Clear blue sky',
      icon: Cloud,
      iconColor: 'text-blue-400 bg-blue-500/15',
    },
  ];

  return (
    <section
      id="weather-details-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Weather Details
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Atmospheric parameters and biometric factors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-bold tracking-tight mb-1">
                {card.value}
              </div>

              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
