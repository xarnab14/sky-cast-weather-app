/* ============================================================
   SkyCast — SearchBar (hero)
   Hero search with debounced autocomplete, full keyboard
   navigation (↑ ↓ Enter Esc), GPS detection, popular-city
   shortcuts, and light/dark theming (original component).
   ============================================================ */

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, CornerDownLeft } from 'lucide-react';
import { LocationData, ThemeMode } from '../types/weather';
import { searchLocations } from '../services/weatherApi';
import { POPULAR_LOCATIONS } from '../utils/weatherUtils';

interface SearchBarProps {
  onSelectLocation: (loc: { name: string; lat: number; lon: number }) => void;
  onDetectLocation: () => void;
  isLoading: boolean;
  themeMode: ThemeMode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectLocation,
  onDetectLocation,
  isLoading,
  themeMode,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setSelectedIndex(-1);
      } catch (e) {
        console.warn(e);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: { name: string; latitude: number; longitude: number; country?: string }) => {
    onSelectLocation({
      name: loc.name,
      lat: loc.latitude,
      lon: loc.longitude,
    });
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // No suggestions — pass the raw query through; the app layer
        // resolves it via geocoding rather than guessing at 0,0.
        onSelectLocation({ name: query.trim(), lat: NaN, lon: NaN });
        setShowDropdown(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const isDark = themeMode === 'dark';

  return (
    <div id="hero-weather-search" className="w-full max-w-4xl mx-auto text-center py-6 sm:py-8 px-4">
      <div className="space-y-2 mb-6 sm:mb-8">
        <h1
          id="hero-heading"
          className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
        >
          <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            What's the weather like today?
          </span>
        </h1>
        <p
          id="hero-subtitle"
          className={`text-sm sm:text-base max-w-xl mx-auto font-normal ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Get accurate weather information and forecasts for any location.
        </p>
      </div>

      {/* Main search input */}
      <div className="relative max-w-2xl mx-auto">
        <div
          className={`relative flex items-center w-full rounded-2xl border transition-all duration-200 shadow-xl ${
            isDark
              ? 'bg-slate-900/90 border-slate-700/80 focus-within:border-sky-500/70 focus-within:ring-4 focus-within:ring-sky-500/10 shadow-slate-950/50'
              : 'bg-white border-slate-200 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/10 shadow-slate-200/50'
          }`}
        >
          {/* Search icon / spinner */}
          <div className="pl-4 sm:pl-5 text-slate-400">
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            ) : (
              <Search className="w-5 h-5 text-sky-400" />
            )}
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            id="city-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a city..."
            autoComplete="off"
            className={`w-full py-4 pl-3 pr-24 text-base sm:text-lg bg-transparent focus:outline-none placeholder:text-slate-400 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          />

          {/* Clear button */}
          {query && (
            <button
              id="clear-search-button"
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setShowDropdown(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
              className={`p-1.5 mr-1 transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Location detection ("Use my location") */}
          <button
            id="detect-location-button"
            type="button"
            onClick={onDetectLocation}
            disabled={isLoading}
            title="Use my current location"
            aria-label="Use my location"
            className={`flex items-center gap-1.5 mr-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isDark
                ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Use my location</span>
            <span className="sm:hidden">GPS</span>
          </button>
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            id="autocomplete-dropdown"
            className={`absolute z-50 left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl divide-y text-left transition-all ${
              isDark
                ? 'bg-slate-900/95 border-slate-700/80 divide-slate-800/80 shadow-black/80'
                : 'bg-white/95 border-slate-200 divide-slate-100 shadow-xl'
            }`}
          >
            {suggestions.map((loc, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={`${loc.name}-${loc.latitude}-${index}`}
                  id={`suggestion-item-${index}`}
                  onClick={() => handleSelect(loc)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 sm:px-5 py-3.5 transition-colors ${
                    isSelected
                      ? isDark
                        ? 'bg-sky-500/20 text-white'
                        : 'bg-sky-50 text-sky-900'
                      : isDark
                        ? 'text-slate-200 hover:bg-slate-800/70'
                        : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm sm:text-base">
                        {loc.name}
                      </span>
                      <span className="text-xs opacity-70">
                        {[loc.region, loc.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 opacity-60" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Popular fast-jump cities */}
      <div id="popular-cities-bar" className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
        <span className={`font-medium mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Popular:
        </span>
        {POPULAR_LOCATIONS.slice(0, 6).map((pop) => (
          <button
            key={pop.name}
            id={`popular-city-${pop.name.toLowerCase()}`}
            onClick={() => onSelectLocation({ name: pop.name, lat: pop.latitude, lon: pop.longitude })}
            className={`px-3 py-1 rounded-full border transition-all ${
              isDark
                ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            {pop.name}
          </button>
        ))}
      </div>
    </div>
  );
};
