/* ============================================================
   SkyCast — CurrentWeather hero card
   (Original component with light-mode contrast fixes and a
   live/fallback data-source badge.)
   ============================================================ */

import React from 'react';
import {
  Heart, MapPin, Clock, Sunrise, Sunset, Droplets, Wind, Eye,
  Gauge, SunMedium,
} from 'lucide-react';
import { CurrentWeather as CurrentWeatherType, LocationData, ThemeMode, UnitSystem } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import {
  formatTemp, formatWind, formatVisibility, formatPressure,
  getWindDirection, getUvRisk, calculateSunMetrics, convertTemp,
} from '../utils/weatherUtils';

interface CurrentWeatherProps {
  current: CurrentWeatherType;
  location: LocationData;
  unit: UnitSystem;
  themeMode: ThemeMode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isFallback?: boolean;
}

export const CurrentWeather: React.FC<CurrentWeatherProps> = ({
  current, location, unit, themeMode, isFavorite, onToggleFavorite, isFallback,
}) => {
  const isDark = themeMode === 'dark';
  const uvInfo = getUvRisk(current.uvIndex);
  const sunMetrics = calculateSunMetrics(current.sunrise, current.sunset, current.localTime);
  const windDir = getWindDirection(current.windDirection);

  // Dynamic atmospheric card theme background.
  const getAtmosphereGradient = () => {
    if (!current.isDay) {
      return 'from-slate-900/90 via-indigo-950/70 to-slate-900/90 border-indigo-900/40 shadow-indigo-950/40';
    }
    switch (current.condition.toLowerCase()) {
      case 'clear sky':
      case 'sunny':
        return 'from-sky-900/80 via-blue-900/60 to-indigo-950/80 border-sky-600/30 shadow-sky-900/30';
      case 'thunderstorm':
      case 'severe thunderstorm':
        return 'from-purple-950/90 via-slate-900/80 to-indigo-950/90 border-purple-800/40 shadow-purple-950/40';
      case 'rain':
      case 'moderate rain':
      case 'heavy rain':
        return 'from-slate-900/90 via-blue-950/80 to-slate-900/90 border-blue-800/30 shadow-blue-950/40';
      default:
        return 'from-slate-900/90 via-slate-800/80 to-indigo-950/80 border-slate-700/60 shadow-slate-900/40';
    }
  };

  return (
    <div
      id="current-weather-card"
      className={`relative w-full rounded-3xl p-6 sm:p-8 lg:p-10 border backdrop-blur-2xl transition-all duration-500 shadow-2xl bg-gradient-to-br ${
        isDark
          ? getAtmosphereGradient()
          : 'from-sky-500/10 via-white to-blue-500/5 border-sky-100 shadow-sky-900/5 text-slate-800'
      }`}
    >
      {/* Top bar: location, time, favorite toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="current-city-name" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {location.name}
              </h2>
              <span className={`text-base sm:text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {location.country}
              </span>
            </div>
            {location.region && (
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {location.region}
              </p>
            )}
          </div>
        </div>

        {/* Local date & time + favorite toggle */}
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <div className={`hidden sm:flex flex-col text-right text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="flex items-center justify-end gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              {current.localTime}
            </span>
            <span className="opacity-80">{current.dateFormatted}</span>
          </div>

          <button
            id="favorite-toggle-button"
            type="button"
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Save as favorite'}
            aria-label={isFavorite ? 'Remove city from favorites' : 'Add city to favorites'}
            className={`p-3 rounded-2xl border transition-all ${
              isFavorite
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                : isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero temperature & condition section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6 sm:py-8">
        <div className="md:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span
                id="current-temp-display"
                className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-none"
              >
                {convertTemp(current.temperature, unit)}
              </span>
              <span className="text-3xl sm:text-4xl lg:text-5xl font-light opacity-70 ml-1">
                °{unit === 'imperial' ? 'F' : 'C'}
              </span>
              <span
                className={`ml-3 self-center inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isFallback
                    ? isDark
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                    : isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}
              >
                {isFallback ? 'Offline mode' : 'Live'}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <span
                id="current-weather-condition"
                className="text-xl sm:text-2xl font-semibold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent"
              >
                {current.condition}
              </span>
              <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}>
                Feels like {formatTemp(current.apparentTemperature, unit)}
              </span>
            </div>

            <p className={`mt-2 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {current.isDay ? 'Daytime conditions' : 'Nighttime observations'} with {current.cloudCover}% cloud cover.
            </p>
          </div>
        </div>

        {/* Right: weather graphic + sunrise/sunset pill */}
        <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col items-center justify-center sm:justify-end gap-4">
          <div className="relative p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center">
            <WeatherIcon
              code={current.weatherCode}
              isDay={current.isDay}
              size={84}
              className="w-20 h-20 sm:w-24 sm:h-24 transition-transform hover:scale-105 duration-300"
            />
          </div>

          <div className={`flex items-center gap-4 text-xs font-medium px-4 py-2 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <span>{sunMetrics.formattedSunrise}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-400/50" />
            <div className="flex items-center gap-1.5">
              <Sunset className="w-4 h-4 text-orange-400" />
              <span>{sunMetrics.formattedSunset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom metrics strip */}
      <div
        id="current-weather-metrics-strip"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6 border-t border-white/10"
      >
        {[
          { label: 'Humidity', value: `${current.humidity}%`, icon: Droplets, tint: 'bg-sky-500/15 text-sky-400' },
          { label: `Wind (${windDir})`, value: formatWind(current.windSpeed, unit), icon: Wind, tint: 'bg-indigo-500/15 text-indigo-400' },
          { label: 'Visibility', value: formatVisibility(current.visibility, unit), icon: Eye, tint: 'bg-emerald-500/15 text-emerald-400' },
          { label: 'Pressure', value: formatPressure(current.pressure, unit), icon: Gauge, tint: 'bg-purple-500/15 text-purple-400' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/80 border-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl ${m.tint}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-[11px] font-medium uppercase tracking-wider block ${isDark ? 'opacity-60' : 'text-slate-500'}`}>
                  {m.label}
                </span>
                <span className="text-base font-bold tracking-tight">
                  {m.value}
                </span>
              </div>
            </div>
          );
        })}

        {/* UV Index */}
        <div className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
          isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <SunMedium className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[11px] font-medium uppercase tracking-wider block ${isDark ? 'opacity-60' : 'text-slate-500'}`}>
              UV Index
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight">
                {current.uvIndex}
              </span>
              <span className={`text-[11px] font-semibold ${uvInfo.color}`}>
                ({uvInfo.label})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
