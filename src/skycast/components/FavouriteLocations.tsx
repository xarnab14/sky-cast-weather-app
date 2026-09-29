/* ============================================================
   SkyCast — FavouriteLocations
   Favorites manager: persistent bookmarks with quick weather
   preview, click-to-load and remove (original component, with
   theme-aware divider fixes).
   ============================================================ */

import React from 'react';
import { Heart, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { FavoriteLocation, ThemeMode, UnitSystem } from '../types/weather';
import { formatTemp } from '../utils/weatherUtils';

interface FavouriteLocationsProps {
  favorites: FavoriteLocation[];
  onSelectFavorite: (fav: FavoriteLocation) => void;
  onRemoveFavorite: (id: string) => void;
  unit: UnitSystem;
  themeMode: ThemeMode;
}

export const FavouriteLocations: React.FC<FavouriteLocationsProps> = ({
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
  unit,
  themeMode,
}) => {
  const isDark = themeMode === 'dark';

  return (
    <section
      id="favourite-locations-section"
      className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/40'
      }`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
            <Heart className="w-5 h-5 fill-rose-500/30" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Favorite Locations
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bookmarked cities saved in persistent client storage
            </p>
          </div>
        </div>

        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
        }`}>
          {favorites.length} saved
          </span>
      </div>

      {favorites.length === 0 ? (
        <div className={`text-center py-10 rounded-2xl border border-dashed ${
          isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
        }`}>
          <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No favorite cities saved yet.</p>
          <p className="text-xs mt-1">Tap the heart icon on any city card to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              id={`favorite-card-${fav.name.toLowerCase()}`}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  onClick={() => onSelectFavorite(fav)}
                  className="cursor-pointer flex-1"
                >
                  <h4 className="font-bold text-base group-hover:text-sky-500 transition-colors">
                    {fav.name}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {[fav.region, fav.country].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(fav.id);
                  }}
                  title="Remove from favorites"
                  aria-label={`Remove ${fav.name} from favorites`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quick weather preview */}
              <div
                onClick={() => onSelectFavorite(fav)}
                className={`mt-4 pt-3 border-t flex items-center justify-between cursor-pointer ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div>
                  {fav.tempCelsius !== undefined ? (
                    <span className="text-lg font-extrabold tracking-tight">
                      {formatTemp(fav.tempCelsius, unit)}
                    </span>
                  ) : (
                    <span className="text-xs text-sky-500">View weather</span>
                  )}
                  {fav.condition && (
                    <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {fav.condition}
                    </span>
                  )}
                </div>

                <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-500 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
