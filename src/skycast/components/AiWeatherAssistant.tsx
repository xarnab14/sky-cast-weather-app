/* ============================================================
   SkyCast — AiWeatherAssistant
   AI meteorologist brief + SkyArt generator modal (original
   component, refetched-once fix and theme corrections applied).
   ============================================================ */

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Shirt, Compass, Image as ImageIcon, Loader2, RefreshCw, CloudOff } from 'lucide-react';
import { WeatherData, ThemeMode } from '../types/weather';
import { fetchAiWeatherBrief, generateAiWeatherImage } from '../services/weatherApi';

interface AiWeatherAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  themeMode: ThemeMode;
}

interface BriefState {
  data: { brief: string; outfit: string; recommendation: string } | null;
  error: string | null;
}

export const AiWeatherAssistant: React.FC<AiWeatherAssistantProps> = ({
  isOpen, onClose, weather, themeMode,
}) => {
  const [brief, setBrief] = useState<BriefState>({ data: null, error: null });
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const isDark = themeMode === 'dark';

  // Fetch the brief once per location when the modal opens.
  const briefKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen || !weather) return;
    const key = `${weather.location.latitude},${weather.location.longitude},${weather.current.localTime.slice(0, 13)}`;
    if (briefKeyRef.current === key) return;
    briefKeyRef.current = key;

    setLoadingBrief(true);
    setBrief({ data: null, error: null });
    fetchAiWeatherBrief(weather)
      .then((res) => setBrief({ data: res, error: null }))
      .catch((err: Error) => setBrief({ data: null, error: err.message || 'AI brief unavailable.' }))
      .finally(() => setLoadingBrief(false));
  }, [isOpen, weather]);

  // Reset SkyArt when switching locations.
  const artKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!weather) return;
    const key = `${weather.location.latitude},${weather.location.longitude}`;
    if (artKeyRef.current !== key) {
      artKeyRef.current = key;
      setGeneratedImage(null);
      setImageError(null);
    }
  }, [weather]);

  if (!isOpen || !weather) return null;

  const handleGenerateArt = async () => {
    setGeneratingImage(true);
    setImageError(null);
    try {
      const res = await generateAiWeatherImage(
        `Atmospheric fine-art scenic landscape of ${weather.location.name} during ${weather.current.condition}`,
        weather.location.name,
        weather.current.condition,
      );
      setGeneratedImage(res.imageUrl);
    } catch (err: any) {
      setImageError(err.message || 'Image generation is currently taking a breath. Try again shortly.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const cardCls = `p-4 rounded-2xl border ${
    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
  }`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div
        id="ai-weather-modal"
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all custom-scrollbar ${
          isDark ? 'bg-slate-900 border-indigo-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b mb-6 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>AI Meteorologist & SkyArt</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                  Gemini 2.5
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Intelligent briefing for {weather.location.name}, {weather.location.country}
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

        {/* Executive brief */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-indigo-950/30 border-indigo-800/40' : 'bg-indigo-50/70 border-indigo-100'
          }`}>
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-500 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Meteorologist Executive Summary
            </h4>

            {loadingBrief ? (
              <div className="flex items-center gap-2 text-slate-400 py-3 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Consulting Gemini AI meteorology models…</span>
              </div>
            ) : brief.error ? (
              <div className="flex items-start gap-2 text-sm text-amber-500">
                <CloudOff className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{brief.error} Add GEMINI_API_KEY to the server .env to enable AI briefs.</span>
              </div>
            ) : (
              <p className="text-sm sm:text-base leading-relaxed">
                {brief.data?.brief}
              </p>
            )}
          </div>

          {/* Outfit & activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={cardCls}>
              <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider mb-1.5">
                <Shirt className="w-4 h-4" />
                <span>Outfit Recommendation</span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {brief.data?.outfit || (loadingBrief ? 'Checking clothing recommendations…' : '—')}
              </p>
            </div>

            <div className={cardCls}>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider mb-1.5">
                <Compass className="w-4 h-4" />
                <span>Outdoor Activity Advice</span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {brief.data?.recommendation || (loadingBrief ? 'Planning outdoor recommendations…' : '—')}
              </p>
            </div>
          </div>

          {/* SkyArt */}
          <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-500" />
                  <span>Atmospheric SkyArt</span>
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Generate visual landscape art mirroring {weather.location.name}'s current sky
                </p>
              </div>

              <button
                onClick={handleGenerateArt}
                disabled={generatingImage || brief.error != null}
                title={brief.error ? 'Requires GEMINI_API_KEY' : undefined}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Painting…</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{generatedImage ? 'Regenerate Art' : 'Create SkyArt'}</span>
                  </>
                )}
              </button>
            </div>

            {imageError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 mb-3">
                {imageError}
              </p>
            )}

            {generatedImage && (
              <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 shadow-xl">
                <img
                  src={generatedImage}
                  alt={`AI weather landscape of ${weather.location.name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover max-h-72"
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white">
                  Created by Gemini Vision
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
