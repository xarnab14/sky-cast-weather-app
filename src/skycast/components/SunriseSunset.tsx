/* ============================================================
   SkyCast — SunriseSunset
   Solar cycle visualizer: SVG semi-circle arc with a glowing
   sun positioned by time-of-day progress (original component,
   with theme-aware night-badge fix).
   ============================================================ */

import React from 'react';
import { Sunrise, Sunset, Sun } from 'lucide-react';
import { ThemeMode } from '../types/weather';
import { calculateSunMetrics } from '../utils/weatherUtils';

interface SunriseSunsetProps {
  sunrise: string;
  sunset: string;
  localTime?: string;
  themeMode: ThemeMode;
}

export const SunriseSunset: React.FC<SunriseSunsetProps> = ({
  sunrise,
  sunset,
  localTime,
  themeMode,
}) => {
  const isDark = themeMode === 'dark';
  const metrics = calculateSunMetrics(sunrise, sunset, localTime);

  // Position the sun along an SVG semi-circle arc.
  // Angle goes from PI (left, sunrise) to 0 (right, sunset) as
  // progress goes from 0 to 100.
  const progressRatio = metrics.progress / 100;
  const angle = Math.PI * (1 - progressRatio);
  const radius = 90;
  const centerX = 150;
  const centerY = 110;
  const sunX = centerX + radius * Math.cos(angle);
  const sunY = centerY - radius * Math.sin(angle);

  return (
    <section
      id="sunrise-sunset-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Solar Cycle
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Day length: {metrics.dayLength}
            </p>
          </div>
        </div>

        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
          metrics.isDaytime
            ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
            : isDark
              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
              : 'bg-indigo-50 text-indigo-600 border-indigo-200'
        }`}>
          {metrics.isDaytime ? 'Daylight active' : 'Night period'}
        </span>
      </div>

      {/* SVG arc celestial horizon visualizer */}
      <div className="relative flex flex-col items-center justify-center py-2">
        <svg viewBox="0 0 300 130" className="w-full max-w-[320px] overflow-visible">
          {/* Ground horizon line */}
          <line
            x1="20"
            y1="110"
            x2="280"
            y2="110"
            stroke={isDark ? '#334155' : '#e2e8f0'}
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Dotted celestial trajectory arc */}
          <path
            d="M 60 110 A 90 90 0 0 1 240 110"
            fill="none"
            stroke={isDark ? '#1e293b' : '#f1f5f9'}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active daylight progress path */}
          <path
            d="M 60 110 A 90 90 0 0 1 240 110"
            fill="none"
            stroke="url(#solarGradient)"
            strokeWidth="3"
            strokeDasharray="300"
            strokeDashoffset={300 - (300 * metrics.progress) / 100}
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="solarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Positioned sun */}
          <circle
            cx={sunX}
            cy={sunY}
            r="10"
            fill="#f59e0b"
            filter="url(#sunGlow)"
            className="transition-all duration-700"
          />
          <circle
            cx={sunX}
            cy={sunY}
            r="5"
            fill="#ffffff"
          />
        </svg>

        {/* Sunrise and sunset labels */}
        <div className="w-full flex items-center justify-between px-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Sunrise className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Sunrise
              </span>
              <span className="text-sm font-bold">
                {metrics.formattedSunrise}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Sunset
              </span>
              <span className="text-sm font-bold">
                {metrics.formattedSunset}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
              <Sunset className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
