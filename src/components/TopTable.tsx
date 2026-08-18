import React, { useState, useMemo } from 'react';
import { AggregateRankItem } from '../types/spotify';
import { formatPlaytime } from '../utils/parser';
import { Search, Clock, PlayCircle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

interface TopTableProps {
  items: AggregateRankItem[];
  type: 'artist' | 'track';
  metric: 'time' | 'streams';
  onMetricChange: (metric: 'time' | 'streams') => void;
  title: string;
}

export const TopTable: React.FC<TopTableProps> = ({
  items,
  type,
  metric,
  onMetricChange,
  title,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Max value for progress bar
  const maxValue = useMemo(() => {
    if (items.length === 0) return 1;
    return metric === 'time' ? items[0].totalMsPlayed : items[0].streamCount;
  }, [items, metric]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="bg-[#181818] border border-[#282828] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#1DB954]/10 text-[#1DB954]">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-[#A7A7A7]">
              {items.length} {type === 'artist' ? 'artistas' : 'músicas'} no total
            </p>
          </div>
        </div>

        {/* Metric Toggle */}
        <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#282828] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onMetricChange('time')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'time'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#B3B3B3] hover:text-white hover:bg-[#282828]'
            }`}
          >
            <Clock size={13} />
            <span>Por Tempo</span>
          </button>
          <button
            type="button"
            onClick={() => onMetricChange('streams')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'streams'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#B3B3B3] hover:text-white hover:bg-[#282828]'
            }`}
          >
            <PlayCircle size={13} />
            <span>Por Streams</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727272]" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={`Buscar ${type === 'artist' ? 'artista' : 'música ou artista'}...`}
          className="w-full bg-[#121212] text-sm text-white placeholder-[#727272] pl-10 pr-4 py-2 rounded-xl border border-[#282828] focus:border-[#1DB954] focus:outline-none transition-all"
        />
      </div>

      {/* Items List / Table */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-[#727272] text-sm">
          Nenhum resultado encontrado para "{search}".
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#222222]">
          {pagedItems.map((item, idx) => {
            const globalRank = (currentPage - 1) * pageSize + idx + 1;
            const currentVal = metric === 'time' ? item.totalMsPlayed : item.streamCount;
            const percentWidth = Math.min(100, Math.max(4, (currentVal / maxValue) * 100));

            return (
              <div
                key={item.id || idx}
                className="py-3 px-2 flex items-center gap-3 hover:bg-[#202020] rounded-xl transition-colors group"
              >
                {/* Rank Badge */}
                <div className="w-7 text-center font-bold text-sm">
                  {globalRank === 1 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 text-xs font-black">
                      1
                    </span>
                  ) : globalRank === 2 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 text-xs font-black">
                      2
                    </span>
                  ) : globalRank === 3 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 text-xs font-black">
                      3
                    </span>
                  ) : (
                    <span className="text-[#666666] font-medium text-xs">#{globalRank}</span>
                  )}
                </div>

                {/* Info & Progress Bar */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                      {item.name}
                    </span>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white">
                        {metric === 'time'
                          ? formatPlaytime(item.totalMsPlayed)
                          : `${item.streamCount.toLocaleString()} plays`}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle / Bar */}
                  <div className="flex items-center justify-between text-xs text-[#A7A7A7] gap-2">
                    <span className="truncate">{item.subtitle || `${item.streamCount} reproduções`}</span>
                    {item.percentageOfTotal ? (
                      <span className="text-[11px] text-[#727272]">{item.percentageOfTotal}% do total</span>
                    ) : null}
                  </div>

                  <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-[#222222] text-xs text-[#A7A7A7]">
          <span>
            Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-[#121212] border border-[#282828] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#252525] text-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-[#121212] border border-[#282828] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#252525] text-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
