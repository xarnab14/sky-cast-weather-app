/* ============================================================
   SkyCast — Air Quality Index section
   (Original component with theme-aware text fixes for light mode.)
   ============================================================ */

import React from 'react';
import { Wind } from 'lucide-react';
import { AirQualityData, ThemeMode } from '../types/weather';

interface AirQualityProps {
  airQuality?: AirQualityData | null;
  themeMode: ThemeMode;
}

export const AirQuality: React.FC<AirQualityProps> = ({ airQuality, themeMode }) => {
  const isDark = themeMode === 'dark';

  if (!airQuality) return null;

  // Percentage for the gauge bar (scale 0–300).
  const aqiProgress = Math.min(100, Math.max(5, (airQuality.aqi / 300) * 100));

  const pollutants = [
    { label: 'PM2.5', value: `${airQuality.pm2_5} µg/m³`, desc: 'Fine inhalable particles' },
    { label: 'PM10', value: `${airQuality.pm10} µg/m³`, desc: 'Coarse dust particles' },
    { label: 'O₃', value: `${airQuality.o3} µg/m³`, desc: 'Ground-level ozone' },
    { label: 'NO₂', value: `${airQuality.no2} µg/m³`, desc: 'Nitrogen dioxide' },
    { label: 'CO', value: `${airQuality.co} mg/m³`, desc: 'Carbon monoxide' },
  ];

  return (
    <section
      id="air-quality-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Air Quality Index (AQI)
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Environmental atmospheric health evaluation
            </p>
          </div>
        </div>

        {/* Category badge */}
        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
          airQuality.category === 'Good'
            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
            : airQuality.category === 'Moderate'
              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
              : 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
        }`}>
          {airQuality.category}
        </span>
      </div>

      {/* Main AQI score & gauge bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border mb-5 ${
        isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">
              {airQuality.aqi}
            </span>
            <span className={`text-sm font-semibold ${airQuality.categoryColor}`}>
              • {airQuality.category}
            </span>
          </div>

          <p className={`text-xs max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {airQuality.summary}
          </p>
        </div>

        <div className={`w-full h-2.5 rounded-full overflow-hidden relative ${isDark ? 'bg-slate-700/40' : 'bg-slate-200'}`}>
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
            style={{ width: `${aqiProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
          <span>0 (Good)</span>
          <span>50</span>
          <span>100 (Moderate)</span>
          <span>150</span>
          <span>300+ (Hazardous)</span>
        </div>
      </div>

      {/* Key pollutants grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {pollutants.map((p) => (
          <div
            key={p.label}
            className={`p-3 rounded-xl border text-center transition-colors ${
              isDark ? 'bg-slate-800/30 border-slate-700/40' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-xs font-bold text-sky-500 block mb-0.5">
              {p.label}
            </span>
            <span className="text-sm font-extrabold block">
              {p.value}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {p.desc}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
