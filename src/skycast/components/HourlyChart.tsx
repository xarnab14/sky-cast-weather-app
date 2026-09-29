/* ============================================================
   SkyCast — HourlyChart
   Interactive 24-hour diurnal thermal curve (hand-rolled SVG,
   no chart library needed) with time-of-day filters, hover
   tooltips and precipitation-probability bars.
   ============================================================ */

import React, { useMemo, useRef, useState } from 'react';
import { ChartLine, Droplets } from 'lucide-react';
import { HourlyPoint, ThemeMode, UnitSystem } from '../types/weather';
import { formatTemp, smoothPath } from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';

interface HourlyChartProps {
  hourly: HourlyPoint[];
  unit: UnitSystem;
  themeMode: ThemeMode;
}

type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';

const FILTERS: { id: TimeFilter; label: string; hours: [number, number] }[] = [
  { id: 'all', label: '24 Hours', hours: [0, 24] },
  { id: 'morning', label: 'Morning', hours: [5, 12] },
  { id: 'afternoon', label: 'Afternoon', hours: [12, 17] },
  { id: 'evening', label: 'Evening', hours: [17, 21] },
  { id: 'night', label: 'Night', hours: [21, 29] }, // wraps past midnight
];

const hourOf = (t: string) => Number((t || '0').split(':')[0]);

export const HourlyChart: React.FC<HourlyChartProps> = ({ hourly, unit, themeMode }) => {
  const isDark = themeMode === 'dark';
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const points = useMemo(() => {
    if (hourly.length === 0) return [];
    if (filter === 'all') return hourly.slice(0, 24);
    const f = FILTERS.find((x) => x.id === filter)!;
    const [from, to] = f.hours;
    const inRange = hourly.filter((p) => {
      const h = hourOf(p.time);
      return to > 24 ? h >= from || h < to - 24 : h >= from && h < to;
    });
    return inRange.length > 1 ? inRange : hourly.slice(0, 24);
  }, [hourly, filter]);

  const W = 820;
  const H = 250;
  const PAD_X = 34;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 64;

  const temps = points.map((p) => p.temperature);
  const minT = Math.min(...temps, 0);
  const maxT = Math.max(...temps, 1);
  const span = Math.max(1, maxT - minT);

  const xy = (i: number): { x: number; y: number } => ({
    x: PAD_X + (i / Math.max(1, points.length - 1)) * (W - PAD_X * 2),
    y: PAD_TOP + (1 - (temps[i] - minT) / span) * (H - PAD_TOP - PAD_BOTTOM),
  });

  const coords = points.map((_, i) => xy(i));
  const linePath = smoothPath(coords);
  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x},${H - PAD_BOTTOM} L ${coords[0].x},${H - PAD_BOTTOM} Z`
      : '';

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || coords.length === 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - relX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHoverIdx(best);
  };

  const peak = temps.indexOf(Math.max(...temps));
  const low = temps.indexOf(Math.min(...temps));
  const axisColor = isDark ? '#475569' : '#cbd5e1';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const hover = hoverIdx != null ? points[hoverIdx] : null;

  if (points.length < 2) return null;

  return (
    <section
      id="hourly-chart-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
            <ChartLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">24-Hour Thermal Curve</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Diurnal temperature trend with precipitation probability
            </p>
          </div>
        </div>

        {/* Time-of-day filters */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : isDark
                    ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/70'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="sc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={isDark ? 0.35 : 0.25} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sc-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
              y2={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
              stroke={gridColor}
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}

          {/* Precipitation probability bars */}
          {points.map((p, i) => {
            const c = xy(i);
            const barH = (p.precipitationProbability / 100) * 34;
            return (
              <rect
                key={`pr-${i}`}
                x={c.x - 7}
                y={H - PAD_BOTTOM + 8}
                width="14"
                height={Math.max(1.5, barH)}
                rx="2"
                fill="#38bdf8"
                opacity={p.precipitationProbability > 0 ? 0.5 : 0.15}
              />
            );
          })}

          {/* Area + curve */}
          {areaPath && <path d={areaPath} fill="url(#sc-area)" />}
          {linePath && (
            <path d={linePath} fill="none" stroke="url(#sc-line)" strokeWidth="3" strokeLinecap="round" />
          )}

          {/* Dots + hour labels */}
          {coords.map((c, i) => (
            <g key={`pt-${i}`}>
              {(i === peak || i === low) && (
                <circle cx={c.x} cy={c.y} r="5.5" fill={i === peak ? '#fb923c' : '#38bdf8'} stroke={isDark ? '#0f172a' : '#fff'} strokeWidth="2" />
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={hoverIdx === i ? 5 : 3}
                fill={hoverIdx === i ? '#0ea5e9' : isDark ? '#1e293b' : '#ffffff'}
                stroke="#0ea5e9"
                strokeWidth="2"
              />
              {i % 3 === 0 && (
                <text x={c.x} y={H - PAD_BOTTOM + 58} textAnchor="middle" fontSize="11" fill={axisColor} fontWeight="500">
                  {points[i].time}
                </text>
              )}
            </g>
          ))}

          {/* Hover guide */}
          {hoverIdx != null && coords[hoverIdx] && (
            <line
              x1={coords[hoverIdx].x}
              x2={coords[hoverIdx].x}
              y1={PAD_TOP - 8}
              y2={H - PAD_BOTTOM}
              stroke="#0ea5e9"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.6"
            />
          )}
        </svg>

        {/* Hover tooltip */}
        {hover && hoverIdx != null && coords[hoverIdx] && (
          <div
            className={`absolute pointer-events-none -translate-x-1/2 rounded-2xl border px-3.5 py-2.5 shadow-xl backdrop-blur-md transition-all ${
              isDark ? 'bg-slate-800/95 border-slate-600/60 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
            style={{
              left: `${(coords[hoverIdx].x / W) * 100}%`,
              top: `${(coords[hoverIdx].y / H) * 100}%`,
              transform: 'translate(-50%, -130%)',
            }}
          >
            <div className="flex items-center gap-2">
              <WeatherIcon code={hover.weatherCode} isDay={hover.isDay} size={22} />
              <span className="text-base font-extrabold leading-none">
                {formatTemp(hover.temperature, unit)}
              </span>
            </div>
            <div className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              <Droplets className="w-3 h-3 text-sky-400" />
              {hover.precipitationProbability}% precip · {hover.time}
            </div>
          </div>
        )}
      </div>

      <div className={`mt-3 flex items-center justify-between text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Peak {formatTemp(temps[peak], unit)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-sky-400/60 inline-block" /> Precipitation probability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Low {formatTemp(temps[low], unit)}
        </span>
      </div>
    </section>
  );
};
