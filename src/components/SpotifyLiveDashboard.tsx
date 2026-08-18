import React, { useState, useMemo } from 'react';
import { useSpotify } from '../hooks/useSpotify';
import {
  Headphones,
  Sparkles,
  Clock,
  Disc3,
  User,
  Music,
  LogOut,
  ExternalLink,
  RefreshCw,
  Award,
  ListMusic,
  Radio,
  Sliders,
  HelpCircle,
  TrendingUp,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PIE_COLORS = ['#1DB954', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#e11d48'];

export const SpotifyLiveDashboard: React.FC = () => {
  const {
    isSpotifyConnected,
    isConnecting,
    spotifyError,
    spotifyUser,
    topArtists,
    topTracks,
    recentlyPlayed,
    currentlyPlaying,
    playlists,
    timeRange,
    setTimeRange,
    isDataLoading,
    fetchLiveSpotifyData,
    connectSpotify,
    disconnectSpotify,
    spotifyClientId,
    setStoredSpotifyClientId,
  } = useSpotify();

  const [inputClientId, setInputClientId] = useState(spotifyClientId || '');
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'tracks' | 'artists' | 'recent' | 'playlists'>('tracks');
  const [searchFilter, setSearchFilter] = useState('');

  // Genre aggregation from live top artists
  const genreData = useMemo(() => {
    if (!topArtists || topArtists.length === 0) return [];
    const counts: Record<string, number> = {};
    topArtists.forEach(artist => {
      (artist.genres || []).forEach(g => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [topArtists]);

  const filteredTracks = useMemo(() => {
    if (!searchFilter.trim()) return topTracks;
    const q = searchFilter.toLowerCase().trim();
    return topTracks.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.artists.some(a => a.name.toLowerCase().includes(q)) ||
        t.album?.name.toLowerCase().includes(q)
    );
  }, [topTracks, searchFilter]);

  const filteredArtists = useMemo(() => {
    if (!searchFilter.trim()) return topArtists;
    const q = searchFilter.toLowerCase().trim();
    return topArtists.filter(
      a => a.name.toLowerCase().includes(q) || (a.genres || []).some(g => g.toLowerCase().includes(q))
    );
  }, [topArtists, searchFilter]);

  // If not connected to Spotify API
  if (!isSpotifyConnected) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
        {/* Connect Hero */}
        <div className="bg-[#181818] border border-[#282828] p-8 sm:p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shadow-inner">
            <Radio size={40} />
          </div>

          <div className="space-y-2 max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Conectar Spotify Live API
            </h2>
            <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
              Vincule sua conta pessoal do Spotify para visualizar seus dados em tempo real: artistas mais tocados, músicas favoritas de longo prazo (1+ ano), músicas recentes e o que está tocando agora!
            </p>
          </div>

          {spotifyError && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs text-left max-w-md">
              {spotifyError}
            </div>
          )}

          {/* Client ID input */}
          <div className="w-full max-w-md space-y-3 text-left bg-[#121212] p-5 rounded-2xl border border-[#282828]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Spotify Client ID:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowApiHelp(!showApiHelp)}
                className="text-[11px] text-[#1DB954] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle size={12} />
                <span>Como obter minha chave?</span>
              </button>
            </div>

            <input
              type="text"
              value={inputClientId}
              onChange={e => {
                setInputClientId(e.target.value);
                setStoredSpotifyClientId(e.target.value);
              }}
              placeholder="Cole seu Spotify Client ID aqui..."
              className="w-full bg-[#181818] text-xs text-white placeholder-[#666] px-3.5 py-2.5 rounded-xl border border-[#333] focus:border-[#1DB954] outline-none font-mono"
            />

            <button
              type="button"
              onClick={() => connectSpotify(inputClientId.trim())}
              disabled={isConnecting}
              className="w-full py-3 px-6 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-sm rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Headphones size={18} />
              <span>{isConnecting ? 'Conectando...' : 'Conectar com Spotify'}</span>
            </button>
          </div>

          {/* Instructions Helper Modal / Card */}
          {showApiHelp && (
            <div className="w-full max-w-md bg-[#121212] p-5 rounded-2xl border border-emerald-500/30 text-left text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                <CheckCircle2 size={15} />
                <span>Como criar seu Client ID no Spotify Developer:</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-[#A7A7A7] leading-relaxed">
                <li>
                  Acesse o{' '}
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1DB954] underline inline-flex items-center gap-0.5 font-semibold"
                  >
                    Spotify Developer Dashboard <ExternalLink size={10} />
                  </a>{' '}
                  e faça login com sua conta Spotify.
                </li>
                <li>Clique em <strong>"Create App"</strong> (Nome: <code>BeatStats</code>).</li>
                <li>
                  Nas configurações do App (<strong>Settings</strong>), em <strong>Redirect URIs</strong>, adicione:
                  <code className="block bg-[#1c1c1c] text-white p-2 rounded-lg font-mono text-[11px] my-1 select-all">
                    {window.location.origin + window.location.pathname}
                  </code>
                </li>
                <li>Salve as alterações e copie o <strong>Client ID</strong> gerado para a caixinha acima!</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If connected to Spotify API
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Live Profile Banner */}
      <div className="bg-[#181818] border border-[#282828] p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-6 z-10">
          {spotifyUser?.images && spotifyUser.images[0]?.url ? (
            <img
              src={spotifyUser.images[0].url}
              alt={spotifyUser.display_name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#1DB954] shadow-lg shadow-[#1DB954]/20"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 flex items-center justify-center font-black text-2xl text-black">
              {spotifyUser?.display_name?.charAt(0) || 'S'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {spotifyUser?.display_name || 'Usuário Spotify'}
              </h2>
              <span className="bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                API Conectada
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#A7A7A7] flex items-center gap-3">
              <span>{spotifyUser?.followers?.total || 0} seguidores</span>
              {spotifyUser?.external_urls?.spotify && (
                <a
                  href={spotifyUser.external_urls.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1DB954] hover:underline inline-flex items-center gap-1 text-xs font-semibold"
                >
                  <span>Abrir no Spotify</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </p>
          </div>
        </div>

        {/* Live Controls: Time Range + Refresh + Logout */}
        <div className="flex flex-wrap items-center gap-2 z-10 self-start md:self-auto">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#282828]">
            <button
              type="button"
              onClick={() => setTimeRange('short_term')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === 'short_term'
                  ? 'bg-[#1DB954] text-black shadow-md'
                  : 'text-[#A7A7A7] hover:text-white'
              }`}
            >
              4 Semanas
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('medium_term')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === 'medium_term'
                  ? 'bg-[#1DB954] text-black shadow-md'
                  : 'text-[#A7A7A7] hover:text-white'
              }`}
            >
              6 Meses
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('long_term')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === 'long_term'
                  ? 'bg-[#1DB954] text-black shadow-md'
                  : 'text-[#A7A7A7] hover:text-white'
              }`}
            >
              1+ Ano (Longo Prazo)
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLiveSpotifyData}
            title="Atualizar dados agora"
            className="p-2 rounded-xl bg-[#242424] text-[#A7A7A7] hover:text-white border border-[#333] transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={isDataLoading ? 'animate-spin text-[#1DB954]' : ''} />
          </button>

          <button
            type="button"
            onClick={disconnectSpotify}
            title="Desconectar do Spotify"
            className="p-2 rounded-xl bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-800/40 transition-all cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>

        <div className="absolute right-0 top-0 w-96 h-96 bg-[#1DB954]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Currently Playing Widget (if available) */}
      {currentlyPlaying?.item && (
        <div className="bg-gradient-to-r from-emerald-950/40 to-[#181818] border border-emerald-500/30 p-4 sm:p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5 min-w-0">
            {currentlyPlaying.item.album?.images[0]?.url ? (
              <img
                src={currentlyPlaying.item.album.images[0].url}
                alt={currentlyPlaying.item.name}
                className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center shrink-0">
                <Disc3 size={20} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-[#1DB954] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-ping" />
                  Tocando Agora no seu Spotify
                </span>
              </div>
              <h4 className="text-sm font-bold text-white truncate">{currentlyPlaying.item.name}</h4>
              <p className="text-xs text-[#A7A7A7] truncate">
                {currentlyPlaying.item.artists.map(a => a.name).join(', ')} • {currentlyPlaying.item.album?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Highlights & Genre Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highlights */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* #1 Artist */}
          {topArtists[0] && (
            <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex items-center gap-4 shadow-lg">
              {topArtists[0].images[0]?.url ? (
                <img
                  src={topArtists[0].images[0].url}
                  alt={topArtists[0].name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#333]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
                  <Award size={24} />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                  Artista #1 no Período
                </span>
                <h4 className="text-base font-black text-white truncate">{topArtists[0].name}</h4>
                <p className="text-xs text-[#727272] truncate">
                  {(topArtists[0].genres || []).slice(0, 3).join(', ') || 'Artista Spotify'}
                </p>
              </div>
            </div>
          )}

          {/* #1 Track */}
          {topTracks[0] && (
            <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex items-center gap-4 shadow-lg">
              {topTracks[0].album?.images[0]?.url ? (
                <img
                  src={topTracks[0].album.images[0].url}
                  alt={topTracks[0].name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#333]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xl shrink-0">
                  <Disc3 size={24} />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-sky-400 tracking-wider">
                  Faixa #1 no Período
                </span>
                <h4 className="text-base font-black text-white truncate">{topTracks[0].name}</h4>
                <p className="text-xs text-[#727272] truncate">
                  {topTracks[0].artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top Genres Pie */}
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase text-[#A7A7A7] tracking-wider mb-2">
            Gêneros Predominantes
          </h3>
          <div className="h-40 w-full">
            {genreData.length === 0 ? (
              <p className="text-xs text-[#727272] text-center pt-12">Carregando gêneros...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`genre-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#A7A7A7' }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('tracks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'tracks'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
            }`}
          >
            <Disc3 size={14} />
            <span>Top Músicas ({topTracks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('artists')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'artists'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
            }`}
          >
            <User size={14} />
            <span>Top Artistas ({topArtists.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'recent'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
            }`}
          >
            <Clock size={14} />
            <span>Ouvidas Recentemente ({recentlyPlayed.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('playlists')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'playlists'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
            }`}
          >
            <ListMusic size={14} />
            <span>Suas Playlists ({playlists.length})</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filtrar por nome ou artista..."
            className="w-full bg-[#181818] text-xs text-white placeholder-[#666] px-3 py-2 rounded-xl border border-[#282828] focus:border-[#1DB954] outline-none"
          />
        </div>
      </div>

      {/* SubTab Content: Tracks */}
      {activeSubTab === 'tracks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTracks.map((track, i) => (
            <div
              key={track.id || i}
              className="bg-[#181818] hover:bg-[#202020] border border-[#282828] p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-black text-xs text-[#555] w-5 text-right shrink-0">#{i + 1}</span>
                {track.album?.images[0]?.url ? (
                  <img
                    src={track.album.images[0].url}
                    alt={track.name}
                    className="w-11 h-11 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#242424] flex items-center justify-center shrink-0">
                    <Disc3 size={16} />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                    {track.name}
                  </h4>
                  <p className="text-xs text-[#A7A7A7] truncate">
                    {track.artists.map(a => a.name).join(', ')} • {track.album?.name}
                  </p>
                </div>
              </div>

              {track.external_urls?.spotify && (
                <a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-[#242424] text-[#A7A7A7] hover:text-white hover:bg-[#1DB954] hover:text-black transition-all shrink-0"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SubTab Content: Artists */}
      {activeSubTab === 'artists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtists.map((artist, i) => (
            <div
              key={artist.id || i}
              className="bg-[#181818] hover:bg-[#202020] border border-[#282828] p-4 rounded-2xl flex items-center gap-4 transition-all group"
            >
              <span className="font-black text-xs text-[#555] w-5 text-right shrink-0">#{i + 1}</span>
              {artist.images[0]?.url ? (
                <img
                  src={artist.images[0].url}
                  alt={artist.name}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-[#333]"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#242424] flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                  {artist.name}
                </h4>
                <p className="text-[11px] text-[#727272] truncate">
                  {(artist.genres || []).slice(0, 2).join(', ') || 'Artista Spotify'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SubTab Content: Recently Played */}
      {activeSubTab === 'recent' && (
        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl divide-y divide-[#222222]">
          {recentlyPlayed.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.track?.album?.images[0]?.url ? (
                  <img
                    src={item.track.album.images[0].url}
                    alt={item.track.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#242424] flex items-center justify-center shrink-0">
                    <Disc3 size={16} />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{item.track?.name}</h4>
                  <p className="text-xs text-[#A7A7A7] truncate">
                    {item.track?.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#727272] shrink-0">
                {new Date(item.played_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SubTab Content: Playlists */}
      {activeSubTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((pl, idx) => (
            <div
              key={pl.id || idx}
              className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col justify-between gap-3 hover:border-[#383838] transition-all"
            >
              <div>
                <h4 className="font-bold text-sm text-white">{pl.name}</h4>
                <p className="text-xs text-[#727272] mt-1">{pl.tracks?.total || 0} faixas</p>
              </div>
              {pl.external_urls?.spotify && (
                <a
                  href={pl.external_urls.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#1DB954] hover:underline inline-flex items-center gap-1 font-semibold self-start"
                >
                  <span>Abrir no Spotify</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
