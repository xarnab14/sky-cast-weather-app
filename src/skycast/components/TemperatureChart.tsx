/* ============================================================
   SkyCast — TemperatureChart
   Recharts area chart of today's thermal progression with
   time-of-day segment filters and a rich hover tooltip
   (original component).
   ============================================================ */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Sun, Moon, Sunset, Sunrise } from 'lucide-react';
import { HourlyPoint, ThemeMode, UnitSystem } from '../types/weather';
import { convertTemp } from '../utils/weatherUtils';

interface TemperatureChartProps {
  hourly: HourlyPoint[];
  unit: UnitSystem;
  themeMode: ThemeMode;
}

type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';

export const TemperatureChart: React.FC<TemperatureChartProps> = ({
  hourly,
  unit,
  themeMode,
}) => {
  const [filter, setFilter] = useState<TimeFilter>('all');
  const isDark = themeMode === 'dark';

  // Filter hourly points based on time of day
  const filteredData = useMemo(() => {
    return hourly.filter((item) => {
      if (filter === 'all') return true;
      const h = Number((item.time || '0').split(':')[0]);
      if (filter === 'morning') return h >= 6 && h < 12;
      if (filter === 'afternoon') return h >= 12 && h < 18;
      if (filter === 'evening') return h >= 18 && h < 22;
      if (filter === 'night') return h >= 22 || h < 6;
      return true;
    }).map((item) => ({
      time: item.hourLabel,
      temp: convertTemp(item.temperature, unit),
      feelsLike: convertTemp(item.apparentTemperature ?? item.temperature, unit),
      condition: item.condition ?? '',
      precip: item.precipitationProbability,
      wind: item.windSpeed ?? 0,
    }));
  }, [hourly, filter, unit]);

  // Graceful Y-axis padding
  const { minTemp, maxTemp } = useMemo(() => {
    if (filteredData.length === 0) return { minTemp: 0, maxTemp: 40 };
    const temps = filteredData.map((d) => d.temp);
    return {
      minTemp: Math.min(...temps) - 2,
      maxTemp: Math.max(...temps) + 2,
    };
  }, [filteredData]);

  const filterButtons = [
    { id: 'all', label: 'All Day', icon: TrendingUp },
    { id: 'morning', label: 'Morning', icon: Sunrise },
    { id: 'afternoon', label: 'Afternoon', icon: Sun },
    { id: 'evening', label: 'Evening', icon: Sunset },
    { id: 'night', label: 'Night', icon: Moon },
  ] as const;

  return (
    <section
      id="temperature-chart-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      {/* Header with title and segment filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Today's Temperature
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Thermal progression curve in °{unit === 'imperial' ? 'F' : 'C'}
            </p>
          </div>
        </div>

        {/* Time-of-day tabs */}
        <div
          id="chart-filter-tabs"
          className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto max-w-full ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {filterButtons.map((b) => {
            const Icon = b.icon;
            const isActive = filter === b.id;
            return (
              <button
                key={b.id}
                id={`chart-filter-${b.id}`}
                onClick={() => setFilter(b.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-white text-sky-700 shadow-xs'
                    : isDark
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart canvas */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#334155' : '#e2e8f0'}
              opacity={0.6}
            />
            <XAxis
              dataKey="time"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[minTemp, maxTemp]}
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}°`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={`p-3 rounded-2xl border shadow-xl backdrop-blur-xl text-xs space-y-1 ${
                      isDark
                        ? 'bg-slate-900/95 border-slate-700 text-white'
                        : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200'
                    }`}>
                      <p className="font-bold text-sky-500">{data.time}</p>
                      <p className="text-sm font-extrabold">{data.temp}°{unit === 'imperial' ? 'F' : 'C'}</p>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                        {data.condition} (Feels like {data.feelsLike}°)
                      </p>
                      {data.precip > 0 && (
                        <p className="text-sky-500">🌧 {data.precip}% rain chance</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ fill: '#38bdf8', strokeWidth: 2, r: 4, stroke: isDark ? '#0f172a' : '#ffffff' }}
              activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#ffffff' }}
              fillOpacity={1}
              fill="url(#tempGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
