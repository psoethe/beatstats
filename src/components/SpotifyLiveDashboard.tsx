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
  BarChart2,
  Flame,
  Music2,
  Users2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

const BAR_COLORS = ['#1DB954', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#e11d48'];

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

  const [activeSubTab, setActiveSubTab] = useState<'tracks' | 'artists' | 'albums' | 'recent' | 'playlists'>('tracks');
  const [searchFilter, setSearchFilter] = useState('');
  const [showApiExplanation, setShowApiExplanation] = useState(false);

  // 1. Decades analysis exclusively based on album release dates
  const decadeData = useMemo(() => {
    if (!topTracks || topTracks.length === 0) return [];
    const counts: Record<string, number> = {};

    topTracks.forEach(t => {
      const dateStr = t.album?.release_date || '';
      const year = parseInt(dateStr.slice(0, 4), 10);
      if (!isNaN(year) && year >= 1920) {
        const decade = `${Math.floor(year / 10) * 10}s`;
        counts[decade] = (counts[decade] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const numA = parseInt(a.name, 10);
        const numB = parseInt(b.name, 10);
        return numA - numB;
      });
  }, [topTracks]);

  // 2. Average popularity & musical taste profile
  const popularityMetrics = useMemo(() => {
    let scores: number[] = [];
    if (topTracks && topTracks.length > 0) {
      scores = topTracks
        .map(t => t.popularity)
        .filter(p => typeof p === 'number');
    }

    if (scores.length === 0 && topArtists && topArtists.length > 0) {
      scores = topArtists
        .map(a => a.popularity)
        .filter(p => typeof p === 'number');
    }

    const total = scores.reduce((a, b) => a + b, 0);
    const avg = scores.length > 0 ? Math.round(total / scores.length) : 20;

    let label = 'Clássicos Vintage & Obras Raras';
    if (avg >= 70) label = 'Mainstream & Grandes Hits';
    else if (avg >= 45) label = 'Grandes Clássicos & Populares';
    else if (avg >= 25) label = 'Eclético & Clássicos do Blues/Rock';
    else label = 'Clássicos Vintage & Obras Raras';

    return { avg, label };
  }, [topTracks, topArtists]);

  // 3. Top Albums aggregation
  const topAlbums = useMemo(() => {
    if (!topTracks || topTracks.length === 0) return [];
    const albumMap: Record<string, { album: any; artist: string; count: number; tracks: string[] }> = {};

    topTracks.forEach(t => {
      const album = t.album;
      if (album && (album.id || album.name)) {
        const key = album.id || album.name;
        if (!albumMap[key]) {
          albumMap[key] = {
            album,
            artist: t.artists?.map((a: any) => a.name).join(', ') || 'Vários Artistas',
            count: 0,
            tracks: [],
          };
        }
        albumMap[key].count += 1;
        albumMap[key].tracks.push(t.name);
      }
    });

    return Object.values(albumMap).sort((a, b) => b.count - a.count);
  }, [topTracks]);

  // Filtered lists
  const filteredTracks = useMemo(() => {
    if (!searchFilter.trim()) return topTracks;
    const q = searchFilter.toLowerCase().trim();
    return topTracks.filter(
      t =>
        t.name?.toLowerCase().includes(q) ||
        t.artists?.some((a: any) => a.name?.toLowerCase().includes(q)) ||
        t.album?.name?.toLowerCase().includes(q)
    );
  }, [topTracks, searchFilter]);

  const filteredArtists = useMemo(() => {
    if (!searchFilter.trim()) return topArtists;
    const q = searchFilter.toLowerCase().trim();
    return topArtists.filter(
      a => a.name?.toLowerCase().includes(q) || (a.genres || []).some((g: string) => g.toLowerCase().includes(q))
    );
  }, [topArtists, searchFilter]);

  const filteredAlbums = useMemo(() => {
    if (!searchFilter.trim()) return topAlbums;
    const q = searchFilter.toLowerCase().trim();
    return topAlbums.filter(
      item =>
        item.album.name?.toLowerCase().includes(q) ||
        item.artist?.toLowerCase().includes(q)
    );
  }, [topAlbums, searchFilter]);

  const filteredPlaylists = useMemo(() => {
    if (!searchFilter.trim()) return playlists;
    const q = searchFilter.toLowerCase().trim();
    return playlists.filter(
      pl =>
        pl.name?.toLowerCase().includes(q) ||
        pl.owner?.display_name?.toLowerCase().includes(q)
    );
  }, [playlists, searchFilter]);

  // If not connected to Spotify API
  if (!isSpotifyConnected) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
        <div className="bg-[#181818] border border-[#282828] p-8 sm:p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shadow-inner">
            <Radio size={40} />
          </div>

          <div className="space-y-2 max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Conectar sua Conta Spotify
            </h2>
            <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
              Clique no botão abaixo para autorizar o BeatStats e carregar seus artistas mais ouvidos, músicas favoritas, álbuns de destaque, reproduções recentes e o que está tocando agora no seu Spotify.
            </p>
          </div>

          {spotifyError && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200 text-xs text-left max-w-md w-full leading-relaxed">
              <strong className="block font-bold text-red-300 mb-1">Atenção ao conectar:</strong>
              {spotifyError}
            </div>
          )}

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
              <span>{spotifyUser?.followers?.total ? `${spotifyUser.followers.total.toLocaleString('pt-BR')} seguidores` : 'Perfil Spotify'}</span>
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
          <div className="flex items-center gap-1 bg-[#121212] p-1.5 rounded-2xl border border-[#282828]">
            <button
              type="button"
              onClick={() => setTimeRange('short_term')}
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

      {/* Explanatory Banner */}
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
              <>Exibindo afinidade de <strong>Longo Prazo (~1 ano)</strong> calculada pelo algoritmo do Spotify.</>
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
                A API oficial calcula um <strong>ranking de afinidade</strong> ponderado por repetição recente (janelas de 4 semanas, 6 meses e ~12 meses).
              </p>
            </div>
            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828] space-y-1">
              <strong className="text-white block font-bold text-xs">📁 Arquivos Exportados (Aba superior):</strong>
              <p className="text-[11px] text-[#999] leading-relaxed">
                Os arquivos JSON contêm <strong>100% dos logs brutos</strong> de reprodução de todos os anos da conta com contagem exata de minutos ouvidos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Currently Playing Widget (Clickable) */}
      {currentlyPlaying?.item && (
        <a
          href={currentlyPlaying.item.external_urls?.spotify || `https://open.spotify.com/track/${currentlyPlaying.item.id}`}
          target="_blank"
          rel="noreferrer"
          className="bg-gradient-to-r from-emerald-950/40 to-[#181818] hover:to-[#222222] border border-emerald-500/30 hover:border-emerald-400/60 p-4 sm:p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 transition-all group block cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {currentlyPlaying.item.album?.images?.[0]?.url ? (
              <img
                src={currentlyPlaying.item.album.images[0].url}
                alt={currentlyPlaying.item.name}
                className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0 group-hover:scale-105 transition-transform"
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
              <h4 className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                {currentlyPlaying.item.name}
              </h4>
              <p className="text-xs text-[#A7A7A7] truncate">
                {currentlyPlaying.item.artists?.map((a: any) => a.name).join(', ')} • {currentlyPlaying.item.album?.name}
              </p>
            </div>
          </div>
          <ExternalLink size={16} className="text-[#A7A7A7] group-hover:text-[#1DB954] shrink-0" />
        </a>
      )}

      {/* Highlights & Decades Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Clickable #1 Artist, Clickable #1 Track, and Profile Score */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* #1 Artist (Clickable) */}
          {topArtists[0] && (
            <a
              href={topArtists[0].external_urls?.spotify || `https://open.spotify.com/artist/${topArtists[0].id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#181818] hover:bg-[#222222] border border-[#282828] hover:border-[#1DB954]/50 p-5 rounded-2xl flex items-center gap-4 shadow-lg transition-all group cursor-pointer"
            >
              {topArtists[0].images && topArtists[0].images[0]?.url ? (
                <img
                  src={topArtists[0].images[0].url}
                  alt={topArtists[0].name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#333] group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
                  <Award size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                    Artista #1 no Período
                  </span>
                  <ExternalLink size={12} className="text-[#666] group-hover:text-[#1DB954]" />
                </div>
                <h4 className="text-base font-black text-white truncate group-hover:text-[#1DB954] transition-colors">
                  {topArtists[0].name}
                </h4>
                <p className="text-xs text-[#727272] truncate">
                  {(topArtists[0].genres && topArtists[0].genres.length > 0)
                    ? topArtists[0].genres.slice(0, 3).join(', ')
                    : (topArtists[0].followers?.total ? `${topArtists[0].followers.total.toLocaleString('pt-BR')} seguidores` : 'Artista Spotify')}
                </p>
              </div>
            </a>
          )}

          {/* #1 Track (Clickable) */}
          {topTracks[0] && (
            <a
              href={topTracks[0].external_urls?.spotify || `https://open.spotify.com/track/${topTracks[0].id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#181818] hover:bg-[#222222] border border-[#282828] hover:border-sky-500/50 p-5 rounded-2xl flex items-center gap-4 shadow-lg transition-all group cursor-pointer"
            >
              {topTracks[0].album?.images && topTracks[0].album.images[0]?.url ? (
                <img
                  src={topTracks[0].album.images[0].url}
                  alt={topTracks[0].name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#333] group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xl shrink-0">
                  <Disc3 size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-sky-400 tracking-wider">
                    Faixa #1 no Período
                  </span>
                  <ExternalLink size={12} className="text-[#666] group-hover:text-sky-400" />
                </div>
                <h4 className="text-base font-black text-white truncate group-hover:text-sky-400 transition-colors">
                  {topTracks[0].name}
                </h4>
                <p className="text-xs text-[#727272] truncate">
                  {topTracks[0].artists?.map((a: any) => a.name).join(', ')}
                </p>
              </div>
            </a>
          )}

          {/* Profile Metrics Bar */}
          <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex items-center justify-between sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Flame size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#727272]">Perfil de Escuta no Spotify</span>
                <p className="text-sm font-black text-white flex items-center gap-2">
                  <span>{popularityMetrics.label}</span>
                  <span className="text-xs text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/40 font-semibold">
                    Índice: {popularityMetrics.avg}/100
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-[#727272]">Álbuns Representados</span>
              <p className="text-sm font-bold text-white">{topAlbums.length} álbuns</p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: LINHA DO TEMPO POR DÉCADAS (Exclusivo) */}
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl shadow-lg flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-[#A7A7A7] tracking-wider flex items-center gap-1.5">
              <BarChart2 size={14} className="text-[#1DB954]" />
              <span>Linha do Tempo por Décadas</span>
            </h3>
            <span className="text-[10px] text-[#727272] bg-[#121212] px-2 py-0.5 rounded-md border border-[#282828]">
              Ano de Lançamento
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {decadeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={decadeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#727272" fontSize={11} tickLine={false} />
                  <YAxis stroke="#727272" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} músicas`, 'Total no Top']}
                  />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {decadeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#727272] text-center">Processando anos de lançamento...</p>
            )}
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation: Tracks, Artists, Albums, Recent, Playlists */}
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
            onClick={() => setActiveSubTab('albums')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'albums'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
            }`}
          >
            <Music2 size={14} />
            <span>Top Álbuns ({topAlbums.length})</span>
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
            placeholder="Filtrar por nome, artista ou álbum..."
            className="w-full bg-[#181818] text-xs text-white placeholder-[#666] px-3 py-2 rounded-xl border border-[#282828] focus:border-[#1DB954] outline-none"
          />
        </div>
      </div>

      {/* SubTab Content: Tracks (Clickable to open Spotify) */}
      {activeSubTab === 'tracks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTracks.map((track, i) => (
            <a
              key={track.id || i}
              href={track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#181818] hover:bg-[#222222] border border-[#282828] hover:border-[#1DB954]/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-black text-xs text-[#555] w-5 text-right shrink-0">#{i + 1}</span>
                {track.album?.images && track.album.images[0]?.url ? (
                  <img
                    src={track.album.images[0].url}
                    alt={track.name}
                    className="w-11 h-11 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
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
                    {track.artists?.map((a: any) => a.name).join(', ')} • {track.album?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {typeof track.popularity === 'number' && (
                  <span className="text-[10px] text-[#727272] bg-[#242424] px-2 py-0.5 rounded-md border border-[#333]">
                    {track.popularity}%
                  </span>
                )}
                <ExternalLink size={14} className="text-[#666] group-hover:text-[#1DB954] transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* SubTab Content: Artists (Clickable to open Spotify) */}
      {activeSubTab === 'artists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtists.map((artist, i) => {
            const followersStr =
              artist.followers?.total && artist.followers.total > 0
                ? `${artist.followers.total.toLocaleString('pt-BR')} seguidores`
                : (artist.popularity ? `Popularidade: ${artist.popularity}%` : 'Artista Spotify');

            return (
              <a
                key={artist.id || i}
                href={artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#181818] hover:bg-[#222222] border border-[#282828] hover:border-[#1DB954]/50 p-4 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer"
              >
                <span className="font-black text-xs text-[#555] w-5 text-right shrink-0">#{i + 1}</span>
                {artist.images && artist.images[0]?.url ? (
                  <img
                    src={artist.images[0].url}
                    alt={artist.name}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-[#333] group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#242424] flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                      {artist.name}
                    </h4>
                    <ExternalLink size={12} className="text-[#666] group-hover:text-[#1DB954] shrink-0 ml-1" />
                  </div>
                  <p className="text-[11px] text-[#A7A7A7] truncate mt-0.5">
                    {(artist.genres && artist.genres.length > 0)
                      ? artist.genres.slice(0, 2).join(', ')
                      : 'Artista Spotify'}
                  </p>
                  <p className="text-[10px] text-[#666] truncate mt-0.5">
                    {followersStr}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* SubTab Content: Top Albums (Clickable to open Spotify) */}
      {activeSubTab === 'albums' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlbums.map((item, i) => (
            <a
              key={item.album.id || item.album.name || i}
              href={item.album.external_urls?.spotify || `https://open.spotify.com/album/${item.album.id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#181818] hover:bg-[#222222] border border-[#282828] hover:border-[#1DB954]/50 p-4 rounded-2xl flex items-start gap-4 transition-all group cursor-pointer"
            >
              <span className="font-black text-xs text-[#555] w-5 text-right shrink-0 mt-1">#{i + 1}</span>
              {item.album.images && item.album.images[0]?.url ? (
                <img
                  src={item.album.images[0].url}
                  alt={item.album.name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#333] shadow-md group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#242424] flex items-center justify-center shrink-0">
                  <Disc3 size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                    {item.album.name}
                  </h4>
                  <ExternalLink size={12} className="text-[#666] group-hover:text-[#1DB954] shrink-0 ml-1" />
                </div>
                <p className="text-xs text-[#A7A7A7] truncate">{item.artist}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40 font-bold">
                    {item.count} {item.count === 1 ? 'música no Top' : 'músicas no Top'}
                  </span>
                  {item.album.release_date && (
                    <span className="text-[10px] text-[#727272]">
                      {item.album.release_date.slice(0, 4)}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* SubTab Content: Recently Played (Clickable to open Spotify) */}
      {activeSubTab === 'recent' && (
        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-4 sm:p-6 shadow-xl divide-y divide-[#222222]">
          {recentlyPlayed.map((item, idx) => (
            <a
              key={idx}
              href={item.track?.external_urls?.spotify || `https://open.spotify.com/track/${item.track?.id}`}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-[#222222] rounded-xl transition-all group cursor-pointer block"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.track?.album?.images && item.track.album.images[0]?.url ? (
                  <img
                    src={item.track.album.images[0].url}
                    alt={item.track.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#242424] flex items-center justify-center shrink-0">
                    <Disc3 size={16} />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                    {item.track?.name}
                  </h4>
                  <p className="text-xs text-[#A7A7A7] truncate">
                    {item.track?.artists?.map((a: any) => a.name).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[#727272]">
                  {new Date(item.played_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <ExternalLink size={13} className="text-[#666] group-hover:text-[#1DB954]" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* SubTab Content: Playlists (Clickable 1-Click Cards with Covers) */}
      {activeSubTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaylists.map((pl, idx) => {
            const trackCount =
              pl.tracks?.total ??
              pl.total_tracks ??
              pl.tracks?.items?.length ??
              pl.total ??
              0;

            const playlistUrl = pl.external_urls?.spotify || `https://open.spotify.com/playlist/${pl.id}`;

            return (
              <a
                key={pl.id || idx}
                href={playlistUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#181818] hover:bg-[#222222] border border-[#282828] hover:border-[#1DB954]/50 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all group shadow-lg cursor-pointer block"
              >
                <div className="flex items-start gap-3.5">
                  {pl.images && pl.images[0]?.url ? (
                    <img
                      src={pl.images[0].url}
                      alt={pl.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-md border border-[#333] group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#242424] flex items-center justify-center shrink-0 text-[#1DB954]">
                      <ListMusic size={26} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors" title={pl.name}>
                      {pl.name}
                    </h4>
                    <p className="text-xs text-[#A7A7A7] mt-1">
                      {trackCount > 0 ? `${trackCount} faixas` : 'Playlist Oficial'}
                    </p>
                    <p className="text-[11px] text-[#666] mt-0.5 truncate">
                      Por {pl.owner?.display_name || 'Spotify'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#242424] text-xs font-bold text-[#1DB954]">
                  <span>Ouvir Playlist no Spotify</span>
                  <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
