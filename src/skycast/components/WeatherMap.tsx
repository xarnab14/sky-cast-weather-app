/* ============================================================
   SkyCast — WeatherMap
   Interactive weather radar & maps: canvas-based atmospheric
   layers (rain radar sweep, thermal gradient, drifting clouds,
   wind particle stream) with play/pause, layer chips, and
   legends (original component, with a pause-state fix for the
   wind layer and unused imports removed).
   ============================================================ */

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Thermometer,
  CloudRain,
  Cloud,
  Wind,
  MapPin,
  Play,
  Pause,
} from 'lucide-react';
import { LocationData, ThemeMode, UnitSystem } from '../types/weather';
import { formatTemp } from '../utils/weatherUtils';

interface WeatherMapProps {
  location: LocationData;
  tempCelsius: number;
  condition: string;
  unit: UnitSystem;
  themeMode: ThemeMode;
}

type MapLayer = 'temp' | 'rain' | 'clouds' | 'wind';

export const WeatherMap: React.FC<WeatherMapProps> = ({
  location,
  tempCelsius,
  condition,
  unit,
  themeMode,
}) => {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('rain');
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDark = themeMode === 'dark';

  // Live atmospheric particle radar animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Generate pseudo-particles
    const particles = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * 600,
      y: Math.random() * 360,
      speed: 0.8 + Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      alpha: 0.2 + Math.random() * 0.6,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Base background color
      ctx.fillStyle = isDark ? '#0b1329' : '#e2e8f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stylized geographic grid lines
      ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw stylized topography contour blobs
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Layer-specific radar heat map or precipitation blobs
      if (activeLayer === 'temp') {
        const radGrad = ctx.createRadialGradient(
          centerX + Math.sin(time * 0.02) * 20,
          centerY + Math.cos(time * 0.02) * 15,
          10,
          centerX,
          centerY,
          240
        );
        radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        radGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
        radGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.25)');
        radGrad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (activeLayer === 'rain') {
        // Radar sweep beam
        const sweepAngle = (time * 0.03) % (Math.PI * 2);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 260, sweepAngle, sweepAngle + 0.5);
        ctx.lineTo(0, 0);
        const sweepGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 260);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
        sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
        ctx.fillStyle = sweepGrad;
        ctx.fill();
        ctx.restore();

        // Precipitation radar blips
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        for (let i = 0; i < 5; i++) {
          const bx = centerX + Math.sin(i * 1.5 + time * 0.01) * (60 + i * 25);
          const by = centerY + Math.cos(i * 2.1 + time * 0.01) * (40 + i * 20);
          ctx.beginPath();
          ctx.arc(bx, by, 35 + i * 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (activeLayer === 'clouds') {
        ctx.fillStyle = isDark ? 'rgba(226, 232, 240, 0.18)' : 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 7; i++) {
          const cx = (i * 90 + time * 0.8) % (canvas.width + 100) - 50;
          const cy = 60 + (i % 3) * 80;
          ctx.beginPath();
          ctx.arc(cx, cy, 45, 0, Math.PI * 2);
          ctx.arc(cx + 30, cy - 10, 35, 0, Math.PI * 2);
          ctx.arc(cx + 60, cy, 40, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (activeLayer === 'wind') {
        // Wind vectors
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        particles.forEach((p) => {
          if (isPlaying) {
            // Particles only advance while playing (pause-state fix).
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + 12 * p.speed, p.y - 4);
            ctx.stroke();

            p.x += p.speed * 1.5;
            p.y -= 0.5;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
          } else {
            // Paused: keep the last frame's stream visible.
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + 12 * p.speed, p.y - 4);
            ctx.stroke();
          }
        });
      }

      // Draw Center Location Pin Marker
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulsing location ripple
      const ripple = (time * 0.5) % 25;
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - ripple / 25})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8 + ripple, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlaying) {
        time += 1;
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [activeLayer, isPlaying, isDark]);

  const layers = [
    { id: 'rain', label: 'Rain / Radar', icon: CloudRain },
    { id: 'temp', label: 'Temperature', icon: Thermometer },
    { id: 'clouds', label: 'Clouds', icon: Cloud },
    { id: 'wind', label: 'Wind Stream', icon: Wind },
  ] as const;

  return (
    <section
      id="weather-map-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Interactive Weather Radar & Maps
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              High-resolution meteorological radar centered at {location.name} ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
            </p>
          </div>
        </div>

        {/* Layer selector chips */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto max-w-full ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          {layers.map((l) => {
            const Icon = l.icon;
            const isActive = activeLayer === l.id;
            return (
              <button
                key={l.id}
                id={`map-layer-${l.id}`}
                onClick={() => setActiveLayer(l.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? isDark ? 'bg-sky-500 text-white shadow-xs' : 'bg-white text-sky-700 shadow-xs'
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map radar stage */}
      <div className={`relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border shadow-inner ${
        isDark ? 'border-slate-700/60' : 'border-slate-300'
      }`}>
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="w-full h-full object-cover"
        />

        {/* Floating location overlay badge */}
        <div className={`absolute top-4 left-4 p-3 rounded-2xl border backdrop-blur-md text-xs shadow-lg ${
          isDark ? 'bg-slate-900/85 border-slate-700 text-white' : 'bg-white/90 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2 font-bold mb-1">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>{location.name}</span>
            <span className="opacity-60 font-normal">({formatTemp(tempCelsius, unit)})</span>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Layer: <span className="capitalize font-semibold text-sky-500">{activeLayer}</span> • {condition}
          </p>
        </div>

        {/* Floating controls: play/pause */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md ${
              isDark ? 'bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800' : 'bg-white/90 border-slate-200 text-slate-800'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-sky-400" /> : <Play className="w-4 h-4 text-sky-400" />}
          </button>
        </div>

        {/* Layer legend indicator */}
        <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-xl border backdrop-blur-md text-[11px] flex items-center gap-2 ${
          isDark ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'
        }`}>
          <span className="font-semibold">Legend:</span>
          {activeLayer === 'temp' && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-xs bg-sky-400" /> Cold
              <span className="w-3 h-2 rounded-xs bg-amber-400 ml-1" /> Mild
              <span className="w-3 h-2 rounded-xs bg-rose-500 ml-1" /> Hot
            </span>
          )}
          {activeLayer === 'rain' && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-xs bg-sky-300" /> Light Rain
              <span className="w-3 h-2 rounded-xs bg-blue-500 ml-1" /> Moderate
              <span className="w-3 h-2 rounded-xs bg-indigo-700 ml-1" /> Heavy
            </span>
          )}
          {activeLayer === 'clouds' && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-xs bg-slate-400/40" /> Thin
              <span className="w-3 h-2 rounded-xs bg-slate-300 ml-1" /> Overcast
            </span>
          )}
          {activeLayer === 'wind' && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-xs bg-sky-400" /> Real-time Vector Stream
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
