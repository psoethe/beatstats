import React, { useState, useMemo } from 'react';
import { useSpotify } from '../hooks/useSpotify';
import {
  Headphones,
  Clock,
  Disc3,
  User,
  LogOut,
  ExternalLink,
  RefreshCw,
  Award,
  ListMusic,
  Radio,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PIE_COLORS = ['#1DB954', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#e11d48'];

interface SpotifyLiveDashboardProps {
  userEmail: string;
}

export const SpotifyLiveDashboard: React.FC<SpotifyLiveDashboardProps> = ({ userEmail }) => {
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
  } = useSpotify(userEmail);

  const [activeSubTab, setActiveSubTab] = useState<'tracks' | 'artists' | 'recent' | 'playlists'>('tracks');
  const [searchFilter, setSearchFilter] = useState('');
  const [showApiExplanation, setShowApiExplanation] = useState(false);

  // Genre aggregation from live top artists
  const genreData = useMemo(() => {
    if (!topArtists || topArtists.length === 0) return [];
    const counts: Record<string, number> = {};
    topArtists.forEach(artist => {
      if (Array.isArray(artist.genres)) {
        artist.genres.forEach(g => {
          if (g && typeof g === 'string') {
            const formattedGenre = g.charAt(0).toUpperCase() + g.slice(1);
            counts[formattedGenre] = (counts[formattedGenre] || 0) + 1;
          }
        });
      }
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
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
        {/* Connect Hero */}
        <div className="bg-[#181818] border border-[#282828] p-8 sm:p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shadow-inner">
            <Radio size={40} />
          </div>

          <div className="space-y-2 max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Conectar sua Conta Spotify
            </h2>
            <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
              Clique no botão abaixo para autorizar o BeatStats e carregar seus artistas mais ouvidos, músicas favoritas, reproduções recentes e o que está tocando agora no seu Spotify.
            </p>
          </div>

          {spotifyError && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200 text-xs text-left max-w-md w-full leading-relaxed">
              <strong className="block font-bold text-red-300 mb-1">Atenção ao conectar:</strong>
              {spotifyError}
            </div>
          )}

          {/* 1-Click Connect Button */}
          <div className="w-full max-w-sm pt-2">
            <button
              type="button"
              onClick={() => connectSpotify()}
              disabled={isConnecting}
              className="w-full py-4 px-8 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-base rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Headphones size={22} />
              <span>{isConnecting ? 'Conectando ao Spotify...' : 'Conectar com Spotify'}</span>
            </button>
            <p className="text-[11px] text-[#666] mt-3">
              Autenticação segura via Spotify OAuth 2.0 PKCE • Sem compartilhamento de senhas
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If connected to Spotify API
  return (
    <div className="space-y-6 animate-fadeIn">
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
          {/* Time Range Selector with clearer labels */}
          <div className="flex items-center gap-1 bg-[#121212] p-1.5 rounded-2xl border border-[#282828]">
            <button
              type="button"
              onClick={() => setTimeRange('short_term')}
              title="Últimas ~4 semanas de escuta"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              title="Últimos ~6 meses de escuta"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              title="Afinidade calculada pelo algoritmo do Spotify (~1 ano)"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === 'long_term'
                  ? 'bg-[#1DB954] text-black shadow-md'
                  : 'text-[#A7A7A7] hover:text-white'
              }`}
            >
              Longo Prazo (~1 Ano)
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLiveSpotifyData}
            title="Atualizar dados agora"
            className="p-2.5 rounded-xl bg-[#242424] text-[#A7A7A7] hover:text-white border border-[#333] transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={isDataLoading ? 'animate-spin text-[#1DB954]' : ''} />
          </button>

          <button
            type="button"
            onClick={disconnectSpotify}
            title="Desconectar do Spotify"
            className="p-2.5 rounded-xl bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-800/40 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="absolute right-0 top-0 w-96 h-96 bg-[#1DB954]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Explanatory Banner: Como funciona o cálculo da API vs Arquivos JSON */}
      <div className="bg-[#181818]/70 border border-[#282828] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#A7A7A7]">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info size={16} className="text-[#1DB954] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            {timeRange === 'short_term' && (
              <>Exibindo afinidade das <strong>últimas 4 semanas</strong> calculadas pelo algoritmo do Spotify.</>
            )}
            {timeRange === 'medium_term' && (
              <>Exibindo afinidade dos <strong>últimos 6 meses</strong> calculadas pelo algoritmo do Spotify.</>
            )}
            {timeRange === 'long_term' && (
              <>
                Exibindo afinidade de <strong>Longo Prazo (~1 ano)</strong> calculada pelo algoritmo do Spotify.
              </>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowApiExplanation(!showApiExplanation)}
          className="text-[11px] text-[#1DB954] hover:underline font-semibold shrink-0 cursor-pointer self-end sm:self-auto"
        >
          {showApiExplanation ? 'Ocultar detalhes' : 'Entenda a diferença para o JSON exportado'}
        </button>
      </div>

      {/* Expanded API vs JSON details */}
      {showApiExplanation && (
        <div className="bg-[#121212] border border-[#2c2c2c] p-5 rounded-2xl text-xs space-y-3 text-[#B3B3B3] animate-fadeIn">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Calendar size={15} className="text-[#1DB954]" />
            <span>Por que os dados da API são diferentes do JSON exportado?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828] space-y-1">
              <strong className="text-white block font-bold text-xs">🟢 Spotify Live API (Esta tela):</strong>
              <p className="text-[11px] text-[#999] leading-relaxed">
                A API oficial do Spotify não faz uma soma cronológica simples de streams, mas sim um <strong>ranking algorítmico de afinidade</strong> ponderado por repetição e período recente (dividido em 4 semanas, 6 meses e ~12 meses para o <em>long_term</em>).
              </p>
            </div>
            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828] space-y-1">
              <strong className="text-white block font-bold text-xs">📁 Arquivos Exportados (Aba superior):</strong>
              <p className="text-[11px] text-[#999] leading-relaxed">
                Os arquivos JSON exportados contêm <strong>100% dos logs brutos</strong> de reprodução com contagem exata de minutos, milissegundos e histórico de anos anteriores.
              </p>
            </div>
          </div>
        </div>
      )}

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
              {topArtists[0].images && topArtists[0].images[0]?.url ? (
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
                  {(topArtists[0].genres && topArtists[0].genres.length > 0)
                    ? topArtists[0].genres.slice(0, 3).join(', ')
                    : 'Artista Spotify'}
                </p>
              </div>
            </div>
          )}

          {/* #1 Track */}
          {topTracks[0] && (
            <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex items-center gap-4 shadow-lg">
              {topTracks[0].album?.images && topTracks[0].album.images[0]?.url ? (
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
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl shadow-lg flex flex-col justify-between min-h-[220px]">
          <h3 className="text-xs font-bold uppercase text-[#A7A7A7] tracking-wider mb-2">
            Gêneros Predominantes
          </h3>

          <div className="h-44 w-full flex items-center justify-center">
            {isDataLoading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-[#727272]">
                <RefreshCw size={14} className="animate-spin text-[#1DB954]" />
                <span>Processando gêneros...</span>
              </div>
            ) : genreData.length === 0 ? (
              <div className="text-center p-3 space-y-1">
                <p className="text-xs text-[#A7A7A7] font-semibold">Gêneros não catalogados</p>
                <p className="text-[11px] text-[#666] leading-tight">
                  Os artistas deste período não possuem tags de gênero na API do Spotify.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={genreData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={30}
                    outerRadius={55}
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
                  <Legend
                    wrapperStyle={{ fontSize: '10px', color: '#A7A7A7', paddingTop: '4px' }}
                    iconType="circle"
                  />
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
                {track.album?.images && track.album.images[0]?.url ? (
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
              {artist.images && artist.images[0]?.url ? (
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
                  {(artist.genres && artist.genres.length > 0)
                    ? artist.genres.slice(0, 2).join(', ')
                    : 'Artista Spotify'}
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
                {item.track?.album?.images && item.track.album.images[0]?.url ? (
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
