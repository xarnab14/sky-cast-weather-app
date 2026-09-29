/* ============================================================
   SkyCast — ErrorState
   Full error-recovery panel with retry and popular-city
   fallbacks (original component).
   ============================================================ */

import React from 'react';
import { AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { ThemeMode } from '../types/weather';
import { POPULAR_LOCATIONS } from '../utils/weatherUtils';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  onSelectCity: (name: string) => void;
  themeMode: ThemeMode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onSelectCity,
  themeMode,
}) => {
  const isDark = themeMode === 'dark';

  return (
    <div
      id="weather-error-state"
      className={`w-full max-w-2xl mx-auto my-8 p-8 rounded-3xl border text-center backdrop-blur-xl shadow-xl ${
        isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold mb-2">Weather Data Unavailable</h3>
      <p className={`text-sm mb-6 max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {error || "We couldn't retrieve weather information right now. Please check your query or try one of the locations below."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>

      <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider block mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Or explore a popular city:
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_LOCATIONS.slice(0, 5).map((pop) => (
            <button
              key={pop.name}
              onClick={() => onSelectCity(pop.name)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <MapPin className="w-3 h-3 text-sky-500" />
              <span>{pop.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
