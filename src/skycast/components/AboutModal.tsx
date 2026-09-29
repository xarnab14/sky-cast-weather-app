/* ============================================================
   SkyCast — AboutModal
   Architecture overview modal (original component with theme
   fixes and cleaned-up imports).
   ============================================================ */

import React from 'react';
import { X, Code, Layers, Server, Cpu } from 'lucide-react';
import { ThemeMode } from '../types/weather';

interface AboutModalProps {
  isOpen: boolean;
  aiMissing?: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, aiMissing, onClose, themeMode }) => {
  if (!isOpen) return null;
  const isDark = themeMode === 'dark';

  const cardCls = `p-4 rounded-2xl border ${
    isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
  }`;
  const listText = isDark ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div
        id="about-portfolio-modal"
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all custom-scrollbar ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b mb-6 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-500">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">SkyCast Architecture</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Portfolio Showcase & Engineering Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical highlights */}
        <div className="space-y-4 text-xs sm:text-sm">
          <div className={cardCls}>
            <h4 className="font-bold text-sky-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Frontend Engineering
            </h4>
            <ul className={`space-y-1.5 list-disc list-inside ${listText}`}>
              <li><strong>React 19 & TypeScript:</strong> Strict typing, custom hooks, responsive components, and clean state separation.</li>
              <li><strong>Tailwind CSS:</strong> Weather-reactive theming, responsive layouts, and zero layout shift.</li>
              <li><strong>Interactive 24-Hour Curve:</strong> Hand-rolled SVG diurnal thermal chart with time-of-day filters (Morning, Afternoon, Evening, Night).</li>
              <li><strong>Interactive Radar:</strong> Canvas-based simulation of Doppler sweeps, cloud layers, and wind vector dynamics.</li>
            </ul>
          </div>

          <div className={cardCls}>
            <h4 className="font-bold text-indigo-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              Backend & API Proxy
            </h4>
            <ul className={`space-y-1.5 list-disc list-inside ${listText}`}>
              <li><strong>Express.js Reverse Proxy:</strong> Hides secrets and secures client requests on port 3000.</li>
              <li><strong>In-Memory TTL Cache:</strong> 10-minute weather cache prevents rate limits while keeping data fresh.</li>
              <li><strong>Open-Meteo REST API:</strong> WMO code decoding, solar metrics, and air quality index evaluation.</li>
              <li><strong>Resilient Fallback Engine:</strong> Synthetic data keeps the UI alive even when upstream is offline.</li>
            </ul>
          </div>

          <div className={cardCls}>
            <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              AI Weather Intelligence
            </h4>
            <p className={`${listText} leading-relaxed`}>
              Powered by server-side Google GenAI SDK integration (<code>gemini-2.5-flash</code>) delivering structured
              meteorologist briefs and outfit recommendations, alongside an atmospheric SkyArt image generator.
              {aiMissing && ' AI is currently disabled — set GEMINI_API_KEY in the server .env to enable it.'}
            </p>
          </div>
        </div>

        <div className={`mt-6 pt-4 border-t flex justify-end ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
