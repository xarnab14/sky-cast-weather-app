/* ============================================================
   SkyCast — LoadingSkeleton
   Layout-matched shimmer skeleton for the initial load
   (original component with theme-aware divider fix).
   ============================================================ */

import React from 'react';
import { ThemeMode } from '../types/weather';

interface LoadingSkeletonProps {
  themeMode: ThemeMode;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ themeMode }) => {
  const isDark = themeMode === 'dark';
  const shimmerBase = isDark ? 'bg-slate-800/80' : 'bg-slate-200/80';
  const card = `rounded-3xl p-8 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`;
  const divider = isDark ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse" id="weather-loading-skeleton">
      {/* Current weather card skeleton */}
      <div className={`w-full ${card}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className={`h-8 w-48 rounded-xl ${shimmerBase}`} />
            <div className={`h-4 w-32 rounded-lg ${shimmerBase}`} />
          </div>
          <div className={`h-12 w-12 rounded-2xl ${shimmerBase}`} />
        </div>

        <div className="flex justify-between items-center my-6">
          <div className="space-y-3">
            <div className={`h-20 w-44 rounded-2xl ${shimmerBase}`} />
            <div className={`h-6 w-36 rounded-lg ${shimmerBase}`} />
          </div>
          <div className={`h-24 w-24 rounded-3xl ${shimmerBase}`} />
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 border-t ${divider}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-16 rounded-2xl ${shimmerBase}`} />
          ))}
        </div>
      </div>

      {/* Hourly forecast carousel skeleton */}
      <div className={`w-full rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`h-6 w-40 rounded-xl mb-4 ${shimmerBase}`} />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-28 w-24 rounded-2xl flex-shrink-0 ${shimmerBase}`} />
          ))}
        </div>
      </div>

      {/* Two-column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`h-72 rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`} />
        <div className={`h-72 rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`} />
      </div>
    </div>
  );
};
