/* ============================================================
   SkyCast — RecentSearches
   Horizontal chips of recently viewed cities with one-tap
   re-select and clear-all (original component).
   ============================================================ */

import React from 'react';
import { History, Trash2, ArrowUpRight } from 'lucide-react';
import { RecentSearch, ThemeMode } from '../types/weather';

interface RecentSearchesProps {
  recents: RecentSearch[];
  onSelectRecent: (recent: RecentSearch) => void;
  onClearRecents: () => void;
  themeMode: ThemeMode;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  recents,
  onSelectRecent,
  onClearRecents,
  themeMode,
}) => {
  const isDark = themeMode === 'dark';

  if (recents.length === 0) {
    return null;
  }

  return (
    <div id="recent-searches-bar" className="w-full max-w-4xl mx-auto px-4 mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <History className="w-3.5 h-3.5 text-sky-400" />
          <span>Recent Searches</span>
        </div>

        <button
          onClick={onClearRecents}
          title="Clear search history"
          aria-label="Clear recent searches"
          className={`text-[11px] flex items-center gap-1 transition-colors ${
            isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-500'
          }`}
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear history</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
        {recents.map((item) => (
          <button
            key={item.id}
            id={`recent-search-${item.name.toLowerCase()}`}
            onClick={() => onSelectRecent(item)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isDark
                ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white hover:border-slate-500'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{item.name}</span>
            <span className="text-[10px] opacity-60">({item.country})</span>
            <ArrowUpRight className="w-3 h-3 text-sky-400 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
};
