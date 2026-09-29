/* ============================================================
   SkyCast — WeatherIcon (lucide variant)
   Lucide-based iconography keyed off WMO codes with day/night
   variants and glow accents (original component, with the
   sized-by-class behavior my other components rely on).
   ============================================================ */

import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  Tornado,
} from 'lucide-react';

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  code,
  isDay = true,
  className = 'w-6 h-6',
  size,
}) => {
  const iconProps = {
    className,
    ...(size ? { size } : {}),
  };

  // Clear skies
  if (code === 0) {
    return isDay ? (
      <Sun {...iconProps} className={`${className} text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]`} />
    ) : (
      <Moon {...iconProps} className={`${className} text-sky-200 drop-shadow-[0_0_8px_rgba(186,230,253,0.4)]`} />
    );
  }

  // Mainly clear / few clouds
  if (code === 1) {
    return isDay ? (
      <Sun {...iconProps} className={`${className} text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.4)]`} />
    ) : (
      <CloudMoon {...iconProps} className={`${className} text-indigo-200`} />
    );
  }

  // Partly cloudy
  if (code === 2) {
    return isDay ? (
      <CloudSun {...iconProps} className={`${className} text-sky-300`} />
    ) : (
      <CloudMoon {...iconProps} className={`${className} text-indigo-300`} />
    );
  }

  // Overcast
  if (code === 3) {
    return <Cloud {...iconProps} className={`${className} text-slate-300`} />;
  }

  // Fog / mist
  if (code === 45 || code === 48) {
    return <CloudFog {...iconProps} className={`${className} text-slate-400`} />;
  }

  // Drizzle
  if (code >= 51 && code <= 57) {
    return <CloudDrizzle {...iconProps} className={`${className} text-sky-400`} />;
  }

  // Freezing + normal rain
  if (code >= 61 && code <= 67) {
    return <CloudRain {...iconProps} className={`${className} text-blue-400`} />;
  }

  // Snow
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return <Snowflake {...iconProps} className={`${className} text-cyan-200 animate-pulse-subtle`} />;
  }

  // Rain showers
  if (code >= 80 && code <= 82) {
    return <CloudRain {...iconProps} className={`${className} text-sky-400`} />;
  }

  // Thunderstorm (+ hail variants)
  if (code >= 95) {
    return <CloudLightning {...iconProps} className={`${className} text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]`} />;
  }

  // Fallback
  return isDay ? (
    <CloudSun {...iconProps} className={`${className} text-sky-300`} />
  ) : (
    <CloudMoon {...iconProps} className={`${className} text-indigo-300`} />
  );
};
