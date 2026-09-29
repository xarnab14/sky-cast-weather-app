/* ============================================================
   SkyCast — RadarCanvas
   Canvas-based Doppler radar simulation: rotating sweep,
   temperature-contoured cloud clusters, and wind vectors driven
   by the live wind speed/direction. Honors reduced motion.
   ============================================================ */

import React, { useEffect, useRef } from 'react';
import { Radar } from 'lucide-react';
import { CurrentWeather, ThemeMode } from '../types/weather';
import { getWindDirection } from '../utils/weatherUtils';

interface RadarCanvasProps {
  current: CurrentWeather;
  themeMode: ThemeMode;
  /** Canvas size in px (default 260). The Maps tab uses a larger sweep. */
  size?: number;
  /** Hide the card chrome when embedded full-width in a tab view. */
  compact?: boolean;
}

interface Cluster {
  angle: number;
  dist: number; // 0..1 of radius
  size: number;
  intensity: number; // 0..1 reflectivity
  drift: number;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({ current, themeMode, size = 260, compact = false }) => {
  const isDark = themeMode === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const weatherRef = useRef(current);
  weatherRef.current = current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const SIZE = size;

    const resize = () => {
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Seed cloud clusters from current conditions.
    const mkClusters = (c: CurrentWeather): Cluster[] => {
      const n = Math.max(2, Math.round((c.cloudCover / 100) * 7));
      const seedRand = (i: number) => {
        const x = Math.sin(c.weatherCode * 12.9898 + i * 78.233) * 43758.5453;
        return x - Math.floor(x);
      };
      return Array.from({ length: n }, (_, i) => ({
        angle: seedRand(i) * Math.PI * 2,
        dist: 0.15 + seedRand(i + 40) * 0.75,
        size: 8 + seedRand(i + 80) * 26,
        intensity: Math.min(1, 0.25 + (c.cloudCover / 100) * 0.75 + seedRand(i + 120) * 0.2),
        drift: (seedRand(i + 160) - 0.5) * 0.0016,
      }));
    };
    let clusters = mkClusters(weatherRef.current);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = SIZE / 2 - 18;
    let sweep = 0;

    const draw = () => {
      const w = weatherRef.current;
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Background disc.
      const bg = ctx.createRadialGradient(cx, cy, 8, cx, cy, R);
      bg.addColorStop(0, isDark ? '#0b1220' : '#e8f2fb');
      bg.addColorStop(1, isDark ? '#05080f' : '#d4e6f7');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      // Range rings.
      ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.25)';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1].forEach((f) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });
      // Cross-hairs.
      ctx.beginPath();
      ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
      ctx.stroke();

      // Cloud clusters (drift with wind direction).
      const windRad = ((w.windDirection - 90) * Math.PI) / 180; // direction wind is heading
      clusters.forEach((cl) => {
        cl.angle += cl.drift + Math.cos(windRad) * 0.0004;
        cl.dist = Math.min(0.92, Math.max(0.08, cl.dist + Math.sin(windRad) * 0.0004));
        const x = cx + Math.cos(cl.angle) * cl.dist * R;
        const y = cy + Math.sin(cl.angle) * cl.dist * R;
        const g = ctx.createRadialGradient(x, y, 1, x, y, cl.size);
        const green = Math.round(120 + cl.intensity * 60);
        g.addColorStop(0, `rgba(${cl.intensity > 0.8 ? '248,113,113' : '56,189,248'}, ${0.55 * cl.intensity})`);
        g.addColorStop(0.6, `rgba(${cl.intensity > 0.8 ? '251,146,60' : '74,222,128'}, ${0.28 * cl.intensity})`);
        g.addColorStop(1, 'rgba(16,185,129,0)');
        void green;
        ctx.beginPath();
        ctx.arc(x, y, cl.size, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Rotating sweep.
      if (!reducedMotion) sweep += 0.022;
      const grad = ctx.createConicGradient
        ? ctx.createConicGradient(sweep, cx, cy)
        : null;
      if (grad) {
        grad.addColorStop(0, 'rgba(56,189,248,0.35)');
        grad.addColorStop(0.12, 'rgba(56,189,248,0.05)');
        grad.addColorStop(0.2, 'rgba(56,189,248,0)');
        grad.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      // Sweep leading edge.
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.strokeStyle = 'rgba(125,211,252,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wind vectors around the rim.
      const speedFactor = Math.min(1, w.windSpeed / 40);
      const vectors = 12;
      for (let i = 0; i < vectors; i++) {
        const a = (i / vectors) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * R * 0.88;
        const y1 = cy + Math.sin(a) * R * 0.88;
        const len = 6 + speedFactor * 12;
        const x2 = x1 + Math.cos(windRad) * len;
        const y2 = y1 + Math.sin(windRad) * len;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(129,140,248,${0.25 + speedFactor * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Arrowhead.
        const headA = windRad + Math.PI * 0.82;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + Math.cos(headA) * 4, y2 + Math.sin(headA) * 4);
        ctx.stroke();
      }

      // Center station dot.
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isDark, size]);

  if (compact) {
    return (
      <div className="flex justify-center py-2">
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="rounded-full"
          aria-label="Simulated weather radar sweep"
          role="img"
        />
      </div>
    );
  }

  return (
    <section
      id="radar-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
          <Radar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">Interactive Radar</h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Simulated Doppler sweep · {current.cloudCover}% cloud cover
          </p>
        </div>
        <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
          isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}>
          Wind {getWindDirection(current.windDirection)} · {Math.round(current.windSpeed)} km/h
        </span>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="rounded-full"
          aria-label="Simulated weather radar sweep"
          role="img"
        />
      </div>
    </section>
  );
};
