import React, { useState, useMemo } from 'react';
import { SpotifyAccount, PlaylistItem } from '../types/spotify';
import { formatPlaytime } from '../utils/parser';
import { TopTable } from './TopTable';
import {
  Clock,
  Headphones,
  Music2,
  Sparkles,
  Calendar,
  Award,
  Disc3,
  Search,
  ListMusic,
  User,
  ShieldAlert,
  BarChart3,
  Flame,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface AccountDetailProps {
  account: SpotifyAccount;
}

export const AccountDetail: React.FC<AccountDetailProps> = ({ account }) => {
  const [artistMetric, setArtistMetric] = useState<'time' | 'streams'>('time');
  const [trackMetric, setTrackMetric] = useState<'time' | 'streams'>('time');
  const [activeTab, setActiveTab] = useState<'rankings' | 'playlists' | 'searches' | 'profile'>('rankings');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [playlistSearch, setPlaylistSearch] = useState<string>('');
  const [expandedPlaylists, setExpandedPlaylists] = useState<Record<string, boolean>>({});

  // Discover available years in history
  const availableYears = useMemo(() => {
    if (!account.hasStreamingHistory) return [];
    const years = new Set<string>();
    account.streams.forEach(s => {
      const y = s.dateStr.slice(0, 4);
      if (y) years.add(y);
    });
    return Array.from(years).sort().reverse();
  }, [account]);

  // Recalculate monthly activity for charts if filtered
  const chartMonthlyData = useMemo(() => {
    if (selectedYear === 'all') return account.monthlyActivity;
    return account.monthlyActivity.filter(m => m.yearMonth.startsWith(selectedYear));
  }, [account, selectedYear]);

  const togglePlaylistExpand = (name: string) => {
    setExpandedPlaylists(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Filter playlists
  const filteredPlaylists = useMemo(() => {
    if (!account.playlists) return [];
    if (!playlistSearch.trim()) return account.playlists;
    const q = playlistSearch.toLowerCase().trim();
    return account.playlists.filter(
      pl =>
        pl.name.toLowerCase().includes(q) ||
        (pl.description && pl.description.toLowerCase().includes(q)) ||
        pl.items.some(
          t => t.trackName.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q)
        )
    );
  }, [account.playlists, playlistSearch]);

  const topArtistByTime = account.topArtistsByTime[0];
  const topTrackByTime = account.topTracksByTime[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Account Hero Header */}
      <div className="bg-[#181818] border border-[#282828] p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-6 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 flex items-center justify-center font-black text-2xl sm:text-3xl text-black shadow-lg shadow-[#1DB954]/20 shrink-0">
            {account.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {account.displayName}
              </h2>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  account.accountType === 'primary'
                    ? 'bg-[#1DB954]/15 text-[#1DB954] border-[#1DB954]/30'
                    : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                }`}
              >
                {account.accountType === 'primary' ? 'Conta Principal' : 'Conta Kids'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#A7A7A7] flex items-center gap-2">
              <span>Pasta: <code className="text-white bg-[#242424] px-1.5 py-0.5 rounded text-xs">{account.folderName}</code></span>
            </p>

            {account.hasStreamingHistory && (
              <p className="text-xs text-[#727272] mt-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#1DB954]" />
                <span>
                  Período: {account.firstStreamDate?.slice(0, 10)} até {account.lastStreamDate?.slice(0, 10)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Year / Period Filter */}
        {availableYears.length > 1 && account.hasStreamingHistory && (
          <div className="flex items-center gap-2 self-start md:self-auto z-10">
            <span className="text-xs text-[#A7A7A7] font-semibold">Filtrar Ano:</span>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-[#242424] text-white text-xs font-bold rounded-xl px-3 py-2 pr-8 outline-none border border-[#383838] focus:border-[#1DB954] appearance-none cursor-pointer"
              >
                <option value="all">Todo o Histórico</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    Ano {y}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A7A7A7] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#1DB954]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Warning Card for Accounts with NO streaming history (Rule b) */}
      {!account.hasStreamingHistory && (
        <div className="bg-amber-950/25 border-2 border-amber-600/40 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-amber-200 shadow-xl">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-amber-300">
              Esta conta não possui histórico de reprodução disponível.
            </h3>
            <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
              Nenhum arquivo de streaming (<code className="bg-amber-950/60 px-1 py-0.5 rounded text-xs">StreamingHistory_*.json</code> ou <code className="bg-amber-950/60 px-1 py-0.5 rounded text-xs">endsong_*.json</code>) foi encontrado para esta conta ou a pasta está vazia. O sistema registrou o status com segurança.
            </p>
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      {account.hasStreamingHistory && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Tempo Total */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A7A7A7] mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tempo Ouvido</span>
              <Clock size={15} className="text-[#1DB954]" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white">{formatPlaytime(account.totalMsPlayed)}</h4>
              <p className="text-[10px] text-[#727272]">{account.totalHours} horas no total</p>
            </div>
          </div>

          {/* Total Streams */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A7A7A7] mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Streams</span>
              <Headphones size={15} className="text-sky-400" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white">{account.streamCount.toLocaleString()}</h4>
              <p className="text-[10px] text-[#727272]">Músicas tocadas</p>
            </div>
          </div>

          {/* Artistas Únicos */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A7A7A7] mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Artistas Únicos</span>
              <Music2 size={15} className="text-purple-400" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white">{account.uniqueArtistsCount}</h4>
              <p className="text-[10px] text-[#727272]">Artistas distintos</p>
            </div>
          </div>

          {/* Faixas Únicas */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A7A7A7] mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Faixas Únicas</span>
              <Disc3 size={15} className="text-pink-400" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white">{account.uniqueTracksCount}</h4>
              <p className="text-[10px] text-[#727272]">Músicas distintas</p>
            </div>
          </div>

          {/* Diversidade */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A7A7A7] mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Diversidade</span>
              <Sparkles size={15} className="text-amber-400" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white">{(account.diversityRatio * 100).toFixed(0)}%</h4>
              <p className="text-[10px] text-[#727272]">Índice de variedade</p>
            </div>
          </div>

          {/* Horário de Pico */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A7A7A7] mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pico de Audição</span>
              <Flame size={15} className="text-orange-400" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white">{String(account.peakHour).padStart(2, '0')}:00h</h4>
              <p className="text-[10px] text-[#727272]">{account.mostActiveDay}</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Highlights of #1 Artist & #1 Track */}
      {account.hasStreamingHistory && topArtistByTime && topTrackByTime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Artist Highlight */}
          <div className="bg-gradient-to-r from-emerald-950/40 to-[#181818] border border-emerald-800/30 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl">
                <Award size={24} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">Artista #1</span>
                <h4 className="text-lg font-black text-white">{topArtistByTime.name}</h4>
                <p className="text-xs text-[#A7A7A7]">
                  {formatPlaytime(topArtistByTime.totalMsPlayed)} • {topArtistByTime.streamCount} reproduções
                </p>
              </div>
            </div>
          </div>

          {/* Top Track Highlight */}
          <div className="bg-gradient-to-r from-sky-950/40 to-[#181818] border border-sky-800/30 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xl">
                <Disc3 size={24} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-sky-400 tracking-wider">Música #1</span>
                <h4 className="text-lg font-black text-white">{topTrackByTime.name}</h4>
                <p className="text-xs text-[#A7A7A7]">
                  {topTrackByTime.subtitle} • {formatPlaytime(topTrackByTime.totalMsPlayed)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts: Activity Over Time, Weekdays, Hours */}
      {account.hasStreamingHistory && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly timeline */}
          <div className="lg:col-span-2 bg-[#181818] border border-[#282828] p-6 rounded-2xl shadow-xl flex flex-col">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-xl bg-[#1DB954]/10 text-[#1DB954]">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Histórico ao Longo do Tempo</h3>
                <p className="text-xs text-[#727272]">Horas de reprodução mês a mês</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1DB954" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1DB954" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#727272" fontSize={11} tickLine={false} />
                  <YAxis stroke="#727272" fontSize={11} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val} horas`, 'Tempo Ouvido']}
                  />
                  <Area
                    type="monotone"
                    dataKey="hoursPlayed"
                    stroke="#1DB954"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMonthly)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity by Day of Week */}
          <div className="bg-[#181818] border border-[#282828] p-6 rounded-2xl shadow-xl flex flex-col">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dia da Semana Mais Ativo</h3>
                <p className="text-xs text-[#727272]">Distribuição por dia</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={account.dayOfWeekActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="dayName"
                    stroke="#727272"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={name => name.slice(0, 3)}
                  />
                  <YAxis stroke="#727272" fontSize={10} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val}h`, 'Tempo']}
                  />
                  <Bar dataKey="hoursPlayed" fill="#a855f7" radius={[6, 6, 0, 0]}>
                    {account.dayOfWeekActivity.map((d, index) => (
                      <Cell
                        key={`day-cell-${index}`}
                        fill={d.dayName === account.mostActiveDay ? '#1DB954' : '#a855f7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Heatmap / Distribution */}
      {account.hasStreamingHistory && (
        <div className="bg-[#181818] border border-[#282828] p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Horários de Pico de Audição (00h às 23h)</h3>
              <p className="text-xs text-[#727272]">Identifique os horários em que esta conta mais escuta música</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={account.hourlyActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hourLabel" stroke="#727272" fontSize={10} tickLine={false} interval={1} />
                <YAxis stroke="#727272" fontSize={10} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val}h`, 'Tempo']}
                />
                <Bar dataKey="hoursPlayed" radius={[4, 4, 0, 0]}>
                  {account.hourlyActivity.map(h => (
                    <Cell
                      key={`hour-cell-${h.hour}`}
                      fill={h.hour === account.peakHour ? '#f97316' : '#38bdf8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#282828] pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('rankings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rankings'
              ? 'bg-[#1DB954] text-black shadow-md'
              : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
          }`}
        >
          <Award size={15} />
          <span>Top Artistas & Músicas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'playlists'
              ? 'bg-[#1DB954] text-black shadow-md'
              : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
          }`}
        >
          <ListMusic size={15} />
          <span>Playlists & Biblioteca ({account.playlists?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('searches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'searches'
              ? 'bg-[#1DB954] text-black shadow-md'
              : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
          }`}
        >
          <Search size={15} />
          <span>Histórico de Buscas ({account.searchQueries?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#1DB954] text-black shadow-md'
              : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
          }`}
        >
          <User size={15} />
          <span>Dados Cadastrais & Perfil</span>
        </button>
      </div>

      {/* Sub-Tab 1: Top Rankings Tables */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          {!account.hasStreamingHistory ? (
            <div className="bg-[#181818] border border-[#282828] rounded-2xl p-12 text-center text-[#727272]">
              <Info size={32} className="mx-auto mb-3 text-[#555]" />
              <p className="text-sm font-semibold">Nenhum dado de ranking para exibir.</p>
              <p className="text-xs mt-1">Essa conta não possui arquivos de streaming históricos vinculados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Artists Table */}
              <TopTable
                items={artistMetric === 'time' ? account.topArtistsByTime : account.topArtistsByStreams}
                type="artist"
                metric={artistMetric}
                onMetricChange={setArtistMetric}
                title="Top Artistas"
              />

              {/* Top Tracks Table */}
              <TopTable
                items={trackMetric === 'time' ? account.topTracksByTime : account.topTracksByStreams}
                type="track"
                metric={trackMetric}
                onMetricChange={setTrackMetric}
                title="Top Músicas"
              />
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Playlists & Library */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          {/* Playlists Section */}
          <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Playlists Criadas e Salvas</h3>
                <p className="text-xs text-[#727272]">Dados extraídos de Playlist1.json</p>
              </div>

              {/* Search in playlists */}
              {account.playlists && account.playlists.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727272]" />
                  <input
                    type="text"
                    value={playlistSearch}
                    onChange={e => setPlaylistSearch(e.target.value)}
                    placeholder="Filtrar playlists ou faixas..."
                    className="w-full bg-[#121212] text-xs text-white placeholder-[#727272] pl-9 pr-3 py-2 rounded-xl border border-[#282828] focus:border-[#1DB954] outline-none"
                  />
                </div>
              )}
            </div>

            {(!filteredPlaylists || filteredPlaylists.length === 0) ? (
              <p className="text-xs text-[#727272] py-8 text-center">Nenhuma playlist encontrada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlaylists.map((pl, idx) => {
                  const isExpanded = !!expandedPlaylists[pl.name];
                  const displayedTracks = isExpanded ? pl.items : pl.items.slice(0, 5);

                  return (
                    <div key={idx} className="bg-[#121212] border border-[#282828] p-5 rounded-2xl flex flex-col justify-between gap-4 hover:border-[#383838] transition-all">
                      <div>
                        {/* Playlist Title & Stats */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <ListMusic size={16} className="text-[#1DB954] shrink-0" />
                            <span>{pl.name}</span>
                          </h4>
                          <span className="bg-[#242424] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border border-[#333]">
                            {pl.items.length} {pl.items.length === 1 ? 'faixa' : 'faixas'}
                          </span>
                        </div>

                        {pl.description && (
                          <p className="text-xs text-[#A7A7A7] mb-2 leading-relaxed">{pl.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-[#727272] mb-3">
                          {pl.lastModifiedDate && <span>Modificada: {pl.lastModifiedDate}</span>}
                          {pl.numberOfFollowers !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users size={11} /> {pl.numberOfFollowers} seguidores
                            </span>
                          )}
                        </div>

                        {/* Tracks list */}
                        {pl.items.length > 0 ? (
                          <div className="mt-3 bg-[#181818] p-3 rounded-xl border border-[#222222]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#727272] block mb-2">
                              Faixas da Playlist:
                            </span>
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {displayedTracks.map((track, tIdx) => (
                                <div key={tIdx} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-[#202020] last:border-0">
                                  <div className="min-w-0 flex items-center gap-2">
                                    <span className="text-[11px] text-[#666] font-bold w-4 text-right">{tIdx + 1}</span>
                                    <div className="truncate">
                                      <p className="font-semibold text-white truncate">{track.trackName}</p>
                                      <p className="text-[11px] text-[#A7A7A7] truncate">{track.artistName} {track.albumName ? `• ${track.albumName}` : ''}</p>
                                    </div>
                                  </div>
                                  {track.addedDate && (
                                    <span className="text-[10px] text-[#666] shrink-0">{track.addedDate.slice(0, 10)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#666] italic">Playlist vazia.</p>
                        )}
                      </div>

                      {/* Expand Button */}
                      {pl.items.length > 5 && (
                        <button
                          type="button"
                          onClick={() => togglePlaylistExpand(pl.name)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#181818] hover:bg-[#222] border border-[#282828] text-xs font-semibold text-[#1DB954] transition-all cursor-pointer self-start"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp size={14} />
                              <span>Recolher</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              <span>Ver todas as {pl.items.length} faixas</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Library Summary */}
          {account.library && (
            <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1">Resumo da Sua Biblioteca</h3>
              <p className="text-xs text-[#727272] mb-5">Itens salvos em YourLibrary.json</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
                <div className="bg-[#121212] p-3 rounded-xl border border-[#282828]">
                  <span className="block text-lg font-black text-white">{account.library.tracks?.length || 0}</span>
                  <span className="text-xs text-[#A7A7A7]">Músicas Curtidas</span>
                </div>
                <div className="bg-[#121212] p-3 rounded-xl border border-[#282828]">
                  <span className="block text-lg font-black text-white">{account.library.albums?.length || 0}</span>
                  <span className="text-xs text-[#A7A7A7]">Álbuns Salvos</span>
                </div>
                <div className="bg-[#121212] p-3 rounded-xl border border-[#282828]">
                  <span className="block text-lg font-black text-white">{account.library.artists?.length || 0}</span>
                  <span className="text-xs text-[#A7A7A7]">Artistas Seguidos</span>
                </div>
                <div className="bg-[#121212] p-3 rounded-xl border border-[#282828]">
                  <span className="block text-lg font-black text-white">{account.library.shows?.length || 0}</span>
                  <span className="text-xs text-[#A7A7A7]">Podcasts</span>
                </div>
              </div>

              {/* Sample tracks from library */}
              {account.library.tracks && account.library.tracks.length > 0 && (
                <div className="bg-[#121212] p-4 rounded-xl border border-[#282828]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A7A7A7] mb-3">
                    Exemplos de Músicas Salvas na Biblioteca:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {account.library.tracks.slice(0, 10).map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#181818] border border-[#242424] truncate">
                        <Disc3 size={14} className="text-[#1DB954] shrink-0" />
                        <span className="font-semibold text-white truncate">{t.track}</span>
                        <span className="text-[#727272] truncate">({t.artist})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Search Queries */}
      {activeTab === 'searches' && (
        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Search size={18} className="text-[#1DB954]" />
            <h3 className="text-base font-bold text-white">Histórico de Buscas Realizadas</h3>
          </div>
          <p className="text-xs text-[#727272] mb-5">Termos e consultas pesquisadas no Spotify (SearchQueries.json)</p>

          {(!account.searchQueries || account.searchQueries.length === 0) ? (
            <p className="text-xs text-[#727272] py-8 text-center">Nenhum termo de busca registrado para esta conta.</p>
          ) : (
            <div className="divide-y divide-[#222222] max-h-[500px] overflow-y-auto pr-2">
              {account.searchQueries.map((query, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#666] font-bold w-6">#{idx + 1}</span>
                    <span className="text-sm font-semibold text-white">"{query.searchQuery}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#A7A7A7]">
                    {query.platform && (
                      <span className="bg-[#242424] px-2 py-0.5 rounded-lg border border-[#333] text-[11px]">
                        {query.platform}
                      </span>
                    )}
                    <span>{query.date} {query.searchTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: User Profile & Inferences */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cadastral Info */}
          <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Dados Cadastrais</h3>
            <p className="text-xs text-[#727272] mb-4">Informações de UserAttributes.json / Userdata.json</p>

            {account.userData ? (
              <dl className="divide-y divide-[#242424] text-xs">
                {account.userData.username && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#A7A7A7]">Nome de Usuário:</dt>
                    <dd className="font-semibold text-white">{account.userData.username}</dd>
                  </div>
                )}
                {account.userData.email && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#A7A7A7]">E-mail:</dt>
                    <dd className="font-semibold text-white">{account.userData.email}</dd>
                  </div>
                )}
                {account.userData.country && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#A7A7A7]">País:</dt>
                    <dd className="font-semibold text-white">{account.userData.country}</dd>
                  </div>
                )}
                {account.userData.birthdate && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#A7A7A7]">Data de Nascimento:</dt>
                    <dd className="font-semibold text-white">{account.userData.birthdate}</dd>
                  </div>
                )}
                {account.userData.gender && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#A7A7A7]">Gênero:</dt>
                    <dd className="font-semibold text-white">{account.userData.gender}</dd>
                  </div>
                )}
                {account.userData.creationTime && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#A7A7A7]">Criação da Conta:</dt>
                    <dd className="font-semibold text-white">{account.userData.creationTime}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-[#727272] py-4">Arquivo de perfil não encontrado nesta conta.</p>
            )}
          </div>

          {/* Inferences / Interests */}
          <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Segmentos & Inferências de Interesse</h3>
            <p className="text-xs text-[#727272] mb-4">Extraído de Inferences.json / Wrapped.json</p>

            {account.inferences && account.inferences.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1">
                {account.inferences.map((inf, i) => (
                  <span
                    key={i}
                    className="bg-[#242424] text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-500/20"
                  >
                    {inf}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#727272] py-4">Nenhum segmento de inferência registrado para esta conta.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
