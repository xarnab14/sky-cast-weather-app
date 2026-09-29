/* ============================================================
   SkyCast — DailyForecast
   7-day forecast list (original component with the detail box
   reworked into a footer that shows on all screen sizes).
   ============================================================ */

import React, { useState } from 'react';
import { Calendar, Droplets, ArrowUp, ArrowDown, SunMedium, Wind } from 'lucide-react';
import { DailyPoint, ThemeMode, UnitSystem } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { formatTemp } from '../utils/weatherUtils';

interface DailyForecastProps {
  daily: DailyPoint[];
  unit: UnitSystem;
  themeMode: ThemeMode;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  daily,
  unit,
  themeMode,
}) => {
  const [selectedDay, setSelectedDay] = useState<DailyPoint | null>(null);
  const isDark = themeMode === 'dark';

  return (
    <section
      id="seven-day-forecast-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              7-Day Forecast
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Weekly weather trajectory and temperature ranges
            </p>
          </div>
        </div>
      </div>

      {/* Days list */}
      <div className="grid grid-cols-1 gap-2.5">
        {daily.map((item, index) => {
          const isToday = index === 0;
          const isSelected = selectedDay?.date === item.date;

          return (
            <div
              key={item.date}
              id={`daily-forecast-row-${index}`}
              onClick={() => setSelectedDay(isSelected ? null : item)}
              className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? isDark
                    ? 'bg-sky-500/15 border-sky-500/40 shadow-sm'
                    : 'bg-sky-50 border-sky-300 shadow-sm'
                  : isDark
                    ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              {/* Day & date */}
              <div className="flex items-center gap-3 sm:w-1/4">
                <div className={`w-12 text-left font-bold text-sm sm:text-base ${
                  isToday ? 'text-sky-400 font-extrabold' : isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {item.dayName}
                </div>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.shortDate}
                </span>
              </div>

              {/* Icon & condition */}
              <div className="flex items-center gap-3 sm:w-1/3 my-2 sm:my-0">
                <WeatherIcon code={item.weatherCode} className="w-6 h-6 flex-shrink-0" />
                <span className={`text-xs sm:text-sm font-medium truncate ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  {item.condition}
                </span>
              </div>

              {/* Rain probability */}
              <div className="flex items-center gap-1 sm:w-1/6 text-xs">
                {item.precipitationProbability > 0 ? (
                  <div className="flex items-center gap-1 text-sky-400 font-medium">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{item.precipitationProbability}%</span>
                  </div>
                ) : (
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Dry
                  </span>
                )}
              </div>

              {/* High / low */}
              <div className="flex items-center justify-end gap-3 sm:w-1/4">
                <div className="flex items-center gap-1 font-bold text-sm sm:text-base text-rose-400">
                  <ArrowUp className="w-3.5 h-3.5 opacity-70" />
                  <span>{formatTemp(item.tempMax, unit)}</span>
                </div>
                <span className="text-slate-600">/</span>
                <div className={`flex items-center gap-1 font-semibold text-sm sm:text-base ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <ArrowDown className="w-3.5 h-3.5 opacity-70 text-sky-400" />
                  <span>{formatTemp(item.tempMin, unit)}</span>
                </div>
              </div>

              {/* Expanded detail footer when clicked */}
              {isSelected && (
                <div className={`mt-3 pt-3 border-t w-full flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-xs ${
                  isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                    UV Index: {item.uvIndexMax}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-indigo-400" />
                    Wind: up to {item.windSpeedMax} km/h
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    Precip: {item.precipitationSum} mm
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
