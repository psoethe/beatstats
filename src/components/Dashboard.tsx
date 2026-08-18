import React, { useMemo, useState } from 'react';
import { useSpotify } from '../hooks/useSpotify';
import { logout } from '../lib/spotify';
import { motion } from 'motion/react';
import { LogOut, Clock, User, Disc3, Headphones, RefreshCw, Activity, PieChart as PieChartIcon, FileJson, Sparkles, GitCompare } from 'lucide-react';
import { SpotifyArtist, SpotifyTrack } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { UserHeader } from './UserHeader';
import { HistoryImporter } from './HistoryImporter';
import { CompareView } from './CompareView';

const PIE_COLORS = ['#1DB954', '#1ed760', '#1aa34a', '#14833b', '#0f642c'];

export const Dashboard: React.FC = () => {
  const {
    user,
    topArtists,
    topTracks,
    audioFeatures,
    recentlyPlayed,
    currentlyPlaying,
    timeRange,
    setTimeRange,
    isDataLoading,
    refreshData
  } = useSpotify();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'compare'>('overview');

  const chartData = useMemo(() => {
    const now = new Date();
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now);
      d.setHours(now.getHours() - (23 - i));
      return {
        timestamp: d.getTime(),
        hourLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: 0
      };
    });

    recentlyPlayed?.forEach(item => {
      const playedDate = new Date(item.played_at);
      const timeDiff = now.getTime() - playedDate.getTime();
      if (timeDiff <= 24 * 60 * 60 * 1000) {
        const bucket = last24Hours.find(b => {
          return new Date(b.timestamp).getHours() === playedDate.getHours() && 
                 new Date(b.timestamp).getDate() === playedDate.getDate();
        });
        if (bucket) {
          bucket.count += 1;
        }
      }
    });
    return last24Hours;
  }, [recentlyPlayed]);

  const genreData = useMemo(() => {
    if (!topArtists || topArtists.length === 0) return [];
    
    // Flatten all genres from top artists
    const allGenres = topArtists.flatMap(artist => artist.genres || []);
    
    // Count occurrences
    const genreCounts = allGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to array, sort, and get top 5
    const sortedGenres = Object.entries(genreCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
      
    return sortedGenres;
  }, [topArtists]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="animate-spin text-[#1DB954]"><RefreshCw size={32} /></div>
      </div>
    );
  }

  const handleTimeRangeChange = (range: 'short_term' | 'medium_term' | 'long_term') => {
    setTimeRange(range);
  };

  const getRangeLabel = (range: string) => {
    switch (range) {
      case 'short_term': return '4 Semanas';
      case 'medium_term': return '6 Meses';
      case 'long_term': return '1+ Ano (Todo Período)';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#181818] to-[#121212] text-white pb-24 font-sans">
      <UserHeader user={user} isDataLoading={isDataLoading} onRefresh={refreshData} />

      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#282828] mb-8 overflow-x-auto scrollbar-hide">
          <button 
            className={`pb-4 px-6 font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-[#1DB954] text-white' : 'border-transparent text-[#B3B3B3] hover:text-white'}`}
            onClick={() => setActiveTab('overview')}
          >
            <Sparkles size={18} /> Resumo API
          </button>
          <button 
            className={`pb-4 px-6 font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'compare' ? 'border-[#1DB954] text-white' : 'border-transparent text-[#B3B3B3] hover:text-white'}`}
            onClick={() => setActiveTab('compare')}
          >
            <GitCompare size={18} /> Comparar Períodos
          </button>
          <button 
            className={`pb-4 px-6 font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-[#1DB954] text-white' : 'border-transparent text-[#B3B3B3] hover:text-white'}`}
            onClick={() => setActiveTab('history')}
          >
            <FileJson size={18} /> Importar JSON
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Time Range Filters */}
            <div className="flex bg-[#121212] border border-[#282828] rounded-full p-1 mb-8 w-full max-w-md mx-auto">
          {['short_term', 'medium_term', 'long_term'].map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range as any)}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all ${
                timeRange === range 
                  ? 'bg-[#282828] text-white shadow-sm' 
                  : 'text-[#B3B3B3] hover:text-white hover:bg-[#181818]'
              }`}
            >
              {getRangeLabel(range)}
            </button>
          ))}
        </div>

        {/* Listening Activity Chart */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="text-[#1DB954]" />
                  <h2 className="text-2xl font-bold">Atividade (24h)</h2>
                </div>
              </div>
              <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] h-64 shadow-lg hover:border-[#333] transition-all">
                {isDataLoading && (!recentlyPlayed || recentlyPlayed.length === 0) ? (
                  <div className="w-full h-full animate-pulse bg-[#282828] rounded-lg"></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1DB954" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hourLabel" stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                      <YAxis stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#282828', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#1DB954', fontWeight: 'bold' }}
                        labelStyle={{ color: '#B3B3B3', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="count" name="Músicas" stroke="#1DB954" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="text-[#1DB954]" />
                  <h2 className="text-2xl font-bold">Gêneros</h2>
                </div>
              </div>
              <div className="bg-[#181818] p-4 rounded-2xl border border-[#282828] h-64 shadow-lg hover:border-[#333] transition-all flex items-center justify-center">
                {isDataLoading && genreData.length === 0 ? (
                  <div className="w-48 h-48 rounded-full animate-pulse bg-[#282828]"></div>
                ) : genreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#282828', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px', textTransform: 'capitalize' }}
                        itemStyle={{ color: '#1DB954', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-[#B3B3B3] text-sm">Sem dados suficientes</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Top Tracks */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Disc3 className="text-[#1DB954]" />
                <h2 className="text-2xl font-bold">Top Músicas</h2>
              </div>
              <span className="text-[10px] text-[#B3B3B3] uppercase tracking-widest font-bold">Visualizar Todas</span>
            </div>
            
            <div className="flex flex-col gap-3 mb-10">
              {isDataLoading && (!topTracks || topTracks.length === 0) ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex gap-4 p-3 bg-[#181818] rounded-xl border border-transparent">
                      <div className="w-12 h-12 bg-[#282828] rounded"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-[#282828] rounded w-3/4"></div>
                        <div className="h-3 bg-[#282828] rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                topTracks?.slice(0, 10).map((track: SpotifyTrack, index: number) => (
                  <motion.a 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={track.id} 
                    href={track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 bg-[#181818] rounded-xl hover:bg-[#282828] transition-colors group border border-transparent hover:border-[#333]"
                  >
                    <div className="text-lg font-black italic text-[#444] w-6 group-hover:text-[#1DB954] transition-colors text-right">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <img 
                      src={track?.album?.images?.[2]?.url || track?.album?.images?.[0]?.url} 
                      alt={track.name} 
                      className="w-12 h-12 rounded shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">{track.name}</p>
                      <p className="text-xs text-[#B3B3B3] truncate mb-1">
                        {track.artists?.map(a => a.name).join(', ')}
                      </p>
                      {track.popularity !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 bg-[#282828] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#1DB954]" 
                              style={{ width: `${track.popularity}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[#B3B3B3] font-bold" title="Popularidade (o Spotify não fornece contagem de plays)">POP</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-[#B3B3B3] font-medium ml-2">
                      {Math.floor(track.duration_ms / 60000)}:
                      {((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                    </div>
                  </motion.a>
                ))
              )}
            </div>
            
          </section>

          {/* Top Artists & Recently Played */}
          <div className="flex flex-col gap-10">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <User className="text-[#1DB954]" />
                  <h2 className="text-2xl font-bold">Top Artistas</h2>
                </div>
                <span className="text-[10px] text-[#B3B3B3] uppercase tracking-widest font-bold">Visualizar Todos</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {isDataLoading && (!topArtists || topArtists.length === 0) ? (
                  [1,2,3,4,5,6].map(i => (
                    <div key={i} className="animate-pulse bg-[#181818] p-4 rounded-2xl flex flex-col items-center gap-3 border border-transparent">
                      <div className="w-20 h-20 bg-[#282828] rounded-full"></div>
                      <div className="h-4 bg-[#282828] rounded w-20"></div>
                    </div>
                  ))
                ) : (
                  topArtists?.slice(0, 6).map((artist: SpotifyArtist, index: number) => (
                    <motion.a
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      key={artist.id}
                      href={artist.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#181818] p-4 rounded-2xl flex flex-col items-center gap-3 group relative border border-transparent hover:border-[#333] transition-all text-center"
                    >
                      <div className="w-20 h-20 overflow-hidden rounded-full shadow-xl">
                        <img 
                          src={artist.images[1]?.url || artist.images[0]?.url} 
                          alt={artist.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="font-bold text-sm line-clamp-1">{artist.name}</p>
                    </motion.a>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="text-[#1DB954]" />
                  <h2 className="text-2xl font-bold">Últimas Ouvidas</h2>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {recentlyPlayed?.slice(0, 5).map((item, index) => (
                  <div key={`${item?.track?.id}-${index}`} className="flex items-center gap-3 p-3 bg-[#181818] rounded-xl hover:bg-[#282828] transition-colors group border border-transparent hover:border-[#333]">
                    <img 
                      src={item?.track?.album?.images?.[2]?.url || item?.track?.album?.images?.[0]?.url} 
                      alt={item?.track?.name} 
                      className="w-12 h-12 rounded shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{item?.track?.name}</p>
                      <p className="text-xs text-[#B3B3B3] truncate">{item?.track?.artists?.[0]?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          </div>
          </>
        ) : activeTab === 'compare' ? (
          <CompareView />
        ) : (
          <HistoryImporter />
        )}
      </main>

      {/* Currently Playing Floating Bar */}
      {currentlyPlaying && currentlyPlaying.is_playing && currentlyPlaying.item && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none"
        >
          <div className="max-w-md mx-auto bg-[#181818]/95 backdrop-blur-md border border-[#282828] p-3 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto">
            <div className="relative w-12 h-12 flex-shrink-0">
              <img 
                src={currentlyPlaying.item?.album?.images?.[0]?.url || currentlyPlaying.item?.images?.[0]?.url} 
                alt="Album Art" 
                className="w-full h-full rounded-md animate-[spin_10s_linear_infinite]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#181818] rounded-full"></div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Headphones size={12} className="text-[#1DB954] animate-pulse" />
                <p className="text-[10px] font-bold text-[#1DB954] uppercase tracking-widest">Tocando Agora</p>
              </div>
              <p className="font-bold text-white truncate text-sm">{currentlyPlaying.item?.name}</p>
              <p className="text-xs text-[#B3B3B3] truncate">{currentlyPlaying.item?.artists?.map((a: any) => a.name).join(', ')}</p>
            </div>
            
            <a 
              href={currentlyPlaying.item?.external_urls?.spotify} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-black hover:scale-105 transition-transform flex-shrink-0 mr-1"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};
