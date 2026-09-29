/* ============================================================
   SkyCast — HourlyForecast
   Horizontally scrollable hourly cards with nav arrows
   (original component).
   ============================================================ */

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Clock } from 'lucide-react';
import { HourlyPoint, ThemeMode, UnitSystem } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { formatTemp } from '../utils/weatherUtils';

interface HourlyForecastProps {
  hourly: HourlyPoint[];
  unit: UnitSystem;
  themeMode: ThemeMode;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  hourly,
  unit,
  themeMode,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDark = themeMode === 'dark';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hourly-forecast-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      {/* Header with title & scroll nav buttons */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Hourly Forecast
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Next 24-hour meteorological projection
            </p>
          </div>
        </div>

        {/* Scroll arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll hourly forecast left"
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll hourly forecast right"
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontally scrollable container */}
      <div
        ref={scrollContainerRef}
        id="hourly-cards-scroll-container"
        className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 custom-scrollbar scroll-smooth"
      >
        {hourly.map((item, index) => {
          const isNow = index === 0;

          return (
            <div
              key={`${item.time}-${index}`}
              id={`hourly-card-${index}`}
              className={`flex-shrink-0 flex flex-col items-center justify-between w-[92px] sm:w-[104px] py-4 px-2 rounded-2xl border transition-all duration-200 ${
                isNow
                  ? isDark
                    ? 'bg-gradient-to-b from-sky-500/25 to-indigo-500/10 border-sky-500/50 shadow-md shadow-sky-500/10 scale-[1.02]'
                    : 'bg-gradient-to-b from-sky-100 to-indigo-50 border-sky-300 shadow-md shadow-sky-100 scale-[1.02]'
                  : isDark
                    ? 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {/* Hour label */}
              <span className={`text-xs font-semibold tracking-tight ${
                isNow ? 'text-sky-400 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {item.hourLabel}
              </span>

              {/* Weather icon */}
              <div className="my-3 py-1">
                <WeatherIcon
                  code={item.weatherCode}
                  isDay={item.isDay}
                  className="w-7 h-7 sm:w-8 sm:h-8"
                />
              </div>

              {/* Temperature */}
              <span className="text-base sm:text-lg font-bold tracking-tight">
                {formatTemp(item.temperature, unit)}
              </span>

              {/* Rain probability badge */}
              <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${
                item.precipitationProbability > 20
                  ? 'text-sky-400'
                  : isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Droplets className="w-3 h-3" />
                <span>{item.precipitationProbability}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
