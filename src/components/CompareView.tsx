import React, { useState, useEffect } from 'react';
import { getTopArtists, getTopTracks } from '../lib/spotify';
import { SpotifyArtist, SpotifyTrack } from '../types';
import { User, Disc3, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

interface RangeData {
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  loading: boolean;
}

export const CompareView: React.FC = () => {
  const [range1, setRange1] = useState<TimeRange>('short_term');
  const [range2, setRange2] = useState<TimeRange>('long_term');

  const [data1, setData1] = useState<RangeData>({ artists: [], tracks: [], loading: true });
  const [data2, setData2] = useState<RangeData>({ artists: [], tracks: [], loading: true });

  const fetchData = async (range: TimeRange, setData: React.Dispatch<React.SetStateAction<RangeData>>) => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const [artistsRes, tracksRes] = await Promise.all([
        getTopArtists(range),
        getTopTracks(range)
      ]);
      setData({ artists: artistsRes?.items || [], tracks: tracksRes?.items || [], loading: false });
    } catch (error) {
      console.error('Erro ao buscar dados para comparação', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData(range1, setData1);
  }, [range1]);

  useEffect(() => {
    fetchData(range2, setData2);
  }, [range2]);

  const renderColumn = (
    range: TimeRange, 
    setRange: (r: TimeRange) => void, 
    data: RangeData, 
    title: string
  ) => (
    <div className="flex flex-col gap-6 bg-[#181818] p-6 rounded-3xl border border-[#282828] shadow-lg">
      <div className="flex items-center justify-between border-b border-[#282828] pb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <select 
          value={range}
          onChange={(e) => setRange(e.target.value as TimeRange)}
          className="bg-[#282828] text-white text-sm font-bold rounded-full px-4 py-2 outline-none border border-transparent focus:border-[#1DB954] cursor-pointer"
        >
          <option value="short_term">4 Semanas</option>
          <option value="medium_term">6 Meses</option>
          <option value="long_term">1+ Ano (Todo Período)</option>
        </select>
      </div>

      {data.loading ? (
         <div className="flex-1 flex items-center justify-center py-20">
           <RefreshCw className="animate-spin text-[#1DB954]" size={32} />
         </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#B3B3B3]">
              <User size={18} className="text-[#1DB954]" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Top Artistas</h4>
            </div>
            <div className="flex flex-col gap-3">
              {data.artists.slice(0, 10).map((artist, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={artist.id} 
                  className="flex items-center gap-4 bg-[#121212] p-3 rounded-xl border border-[#282828] hover:border-[#333]"
                >
                  <span className="font-black text-[#444] w-5 text-right">{i + 1}</span>
                  <img src={artist.images[0]?.url} alt={artist.name} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-bold truncate text-sm">{artist.name}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 text-[#B3B3B3]">
              <Disc3 size={18} className="text-[#1DB954]" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Top Músicas</h4>
            </div>
            <div className="flex flex-col gap-3">
              {data.tracks.slice(0, 10).map((track, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={track.id} 
                  className="flex items-center gap-4 bg-[#121212] p-3 rounded-xl border border-[#282828] hover:border-[#333]"
                >
                  <span className="font-black text-[#444] w-5 text-right">{i + 1}</span>
                  <img src={track.album.images[0]?.url} alt={track.name} className="w-10 h-10 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-sm">{track.name}</p>
                    <p className="text-xs text-[#B3B3B3] truncate">{track.artists[0].name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-[#1DB954]/10 border border-[#1DB954]/20 p-4 rounded-xl text-sm text-[#EAEAEA]">
        <strong>Modo Comparativo:</strong> Selecione dois períodos diferentes abaixo para visualizar lado a lado como o seu gosto musical mudou ao longo do tempo.
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderColumn(range1, setRange1, data1, 'Período A')}
        {renderColumn(range2, setRange2, data2, 'Período B')}
      </div>
    </div>
  );
};
