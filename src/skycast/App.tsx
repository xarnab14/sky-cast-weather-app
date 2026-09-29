/* ============================================================
   SkyCast — original root composition (App.tsx)
   Full-page layout: fixed tabbed navbar (About opens a modal
   rather than being a tab), always-visible search + recents,
   and the 8-section Weather view. State lives in useWeather.
   ============================================================ */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { RecentSearches } from './components/RecentSearches';
import { CurrentWeather } from './components/CurrentWeather';
import { HourlyForecast } from './components/HourlyForecast';
import { TemperatureChart } from './components/TemperatureChart';
import { DailyForecast } from './components/DailyForecast';
import { WeatherDetails } from './components/WeatherDetails';
import { SunriseSunset } from './components/SunriseSunset';
import { AirQuality } from './components/AirQuality';
import { WeatherMap } from './components/WeatherMap';
import { FavouriteLocations } from './components/FavouriteLocations';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorState } from './components/ErrorState';
import { SettingsModal } from './components/SettingsModal';
import { AiWeatherAssistant } from './components/AiWeatherAssistant';
import { AboutModal } from './components/AboutModal';
import { useWeather } from './hooks/useWeather';

export function App() {
  const {
    weather,
    loading,
    error,
    unit,
    themeMode,
    favorites,
    recentSearches,
    loadWeather,
    detectLocation,
    toggleUnit,
    toggleThemeMode,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearRecents,
  } = useWeather();

  const [activeTab, setActiveTab] = useState<'weather' | 'forecast' | 'maps' | 'favorites'>('weather');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  const isDark = themeMode === 'dark';

  // Toggle favorite for the currently displayed location.
  const handleToggleCurrentFavorite = () => {
    if (!weather) return;
    if (isFavorite(weather.location.name)) {
      removeFavorite(weather.location.name);
    } else {
      addFavorite(
        weather.location,
        weather.current.temperature,
        weather.current.condition,
      );
    }
  };

  const handleSelectLocation = (loc: { name: string; lat: number; lon: number }) => {
    if (Number.isFinite(loc.lat) && Number.isFinite(loc.lon)) {
      loadWeather({ lat: loc.lat, lon: loc.lon });
    } else {
      // Raw query (Enter with no suggestions) — the proxy geocodes it.
      loadWeather({ city: loc.name });
    }
    setActiveTab('weather');
  };

  const handleNavTabSelect = (tab: 'weather' | 'forecast' | 'maps' | 'favorites' | 'about') => {
    if (tab === 'about') {
      setAboutModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top fixed navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavTabSelect}
        unit={unit}
        toggleUnit={toggleUnit}
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAiModal={() => setAiModalOpen(true)}
        favoritesCount={favorites.length}
      />

      {/* Main content area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search bar (always accessible at top) */}
        <SearchBar
          onSelectLocation={handleSelectLocation}
          onDetectLocation={detectLocation}
          isLoading={loading}
          themeMode={themeMode}
        />

        {/* Recent searches bar */}
        {recentSearches.length > 0 && (
          <RecentSearches
            recents={recentSearches}
            onSelectRecent={(recent) =>
              handleSelectLocation({ name: recent.name, lat: recent.latitude, lon: recent.longitude })
            }
            onClearRecents={clearRecents}
            themeMode={themeMode}
          />
        )}

        {/* Loading state skeleton */}
        {loading && <LoadingSkeleton themeMode={themeMode} />}

        {/* Error state with retry + popular-city recovery */}
        {!loading && error && (
          <ErrorState
            error={error}
            onRetry={() => loadWeather({ city: 'Lahore' })}
            onSelectCity={(name) => loadWeather({ city: name })}
            themeMode={themeMode}
          />
        )}

        {/* Loaded weather data views */}
        {!loading && !error && weather && (
          <>
            {/* VIEW 1: main weather overview */}
            {activeTab === 'weather' && (
              <div className="space-y-6">
                {/* 1. Large current-weather hero card */}
                <CurrentWeather
                  current={weather.current}
                  location={weather.location}
                  unit={unit}
                  themeMode={themeMode}
                  isFavorite={isFavorite(weather.location.name)}
                  onToggleFavorite={handleToggleCurrentFavorite}
                />

                {/* 2. 24-hour hourly forecast strip */}
                <HourlyForecast
                  hourly={weather.hourly}
                  unit={unit}
                  themeMode={themeMode}
                />

                {/* 3. Recharts diurnal temperature curve */}
                <TemperatureChart
                  hourly={weather.hourly}
                  unit={unit}
                  themeMode={themeMode}
                />

                {/* 4. Grid: 6-factor details + solar arc */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2">
                    <WeatherDetails
                      current={weather.current}
                      unit={unit}
                      themeMode={themeMode}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <SunriseSunset
                      sunrise={weather.current.sunrise}
                      sunset={weather.current.sunset}
                      localTime={weather.current.localTime}
                      themeMode={themeMode}
                    />
                  </div>
                </div>

                {/* 5. 7-day forecast */}
                <DailyForecast
                  daily={weather.daily}
                  unit={unit}
                  themeMode={themeMode}
                />

                {/* 6. Air quality index & pollutants */}
                <AirQuality
                  airQuality={weather.airQuality}
                  themeMode={themeMode}
                />

                {/* 7. Interactive radar / weather map */}
                <WeatherMap
                  location={weather.location}
                  tempCelsius={weather.current.temperature}
                  condition={weather.current.condition}
                  unit={unit}
                  themeMode={themeMode}
                />

                {/* 8. Saved favorites grid */}
                <FavouriteLocations
                  favorites={favorites}
                  onSelectFavorite={(fav) =>
                    handleSelectLocation({ name: fav.name, lat: fav.latitude, lon: fav.longitude })
                  }
                  onRemoveFavorite={removeFavorite}
                  unit={unit}
                  themeMode={themeMode}
                />
              </div>
            )}

            {/* VIEW 2: forecast */}
            {activeTab === 'forecast' && (
              <div className="space-y-6">
                <DailyForecast
                  daily={weather.daily}
                  unit={unit}
                  themeMode={themeMode}
                />
                <HourlyForecast
                  hourly={weather.hourly}
                  unit={unit}
                  themeMode={themeMode}
                />
                <TemperatureChart
                  hourly={weather.hourly}
                  unit={unit}
                  themeMode={themeMode}
                />
              </div>
            )}

            {/* VIEW 3: interactive maps */}
            {activeTab === 'maps' && (
              <div className="space-y-6">
                <WeatherMap
                  location={weather.location}
                  tempCelsius={weather.current.temperature}
                  condition={weather.current.condition}
                  unit={unit}
                  themeMode={themeMode}
                />
              </div>
            )}

            {/* VIEW 4: favorites */}
            {activeTab === 'favorites' && (
              <div className="space-y-6">
                <FavouriteLocations
                  favorites={favorites}
                  onSelectFavorite={(fav) => {
                    handleSelectLocation({ name: fav.name, lat: fav.latitude, lon: fav.longitude });
                    setActiveTab('weather');
                  }}
                  onRemoveFavorite={removeFavorite}
                  unit={unit}
                  themeMode={themeMode}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`mt-12 py-8 border-t transition-colors ${
          isDark ? 'bg-slate-950/80 border-slate-900 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-[10px]">
              SC
            </div>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              SkyCast Precision Weather
            </span>
            <span className="opacity-60">• Real-time Meteorological Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setAboutModalOpen(true)} className="hover:text-sky-400 transition-colors">
              Architecture &amp; Stack
            </button>
            <span>•</span>
            <button onClick={() => setSettingsOpen(true)} className="hover:text-sky-400 transition-colors">
              Preferences
            </button>
            <span>•</span>
            <span className="opacity-60">Open-Meteo &amp; Gemini AI</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        unit={unit}
        setUnit={toggleUnit}
        themeMode={themeMode}
        setThemeMode={toggleThemeMode}
      />

      <AiWeatherAssistant
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        weather={weather}
        themeMode={themeMode}
      />

      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        themeMode={themeMode}
      />
    </div>
  );
}

export default App;
