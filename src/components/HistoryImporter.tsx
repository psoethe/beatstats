import React, { useState, useMemo, useRef } from 'react';
import { Upload, FileJson, Clock, Disc3, User as UserIcon, Calendar, Activity, FileArchive, RefreshCw, Info, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import JSZip from 'jszip';

interface StandardHistoryItem {
  endTime: string;
  artistName: string;
  trackName: string;
  msPlayed: number;
}

interface ExtendedHistoryItem {
  ts: string;
  master_metadata_album_artist_name: string;
  master_metadata_track_name: string;
  ms_played: number;
}

// Unified interface
interface ParsedHistoryItem {
  timestamp: number;
  artistName: string;
  trackName: string;
  msPlayed: number;
  username: string;
  albumName: string;
}

export const HistoryImporter: React.FC = () => {
  const [historyData, setHistoryData] = useState<ParsedHistoryItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processJsonArray = (json: any[], parsedData: ParsedHistoryItem[]) => {
    json.forEach((item: any) => {
      // Standard History
      if (item.endTime && item.artistName && item.trackName) {
        if (item.msPlayed && item.msPlayed > 10000) { // filter out skips < 10s
          parsedData.push({
            timestamp: new Date(item.endTime).getTime(),
            artistName: item.artistName,
            trackName: item.trackName,
            msPlayed: item.msPlayed,
            username: item.username || 'Perfil Principal',
            albumName: item.albumName || 'Desconhecido'
          });
        }
      } 
      // Extended History
      else if (item.ts && item.master_metadata_album_artist_name && item.master_metadata_track_name) {
        if (item.ms_played && item.ms_played > 10000) {
          parsedData.push({
            timestamp: new Date(item.ts).getTime(),
            artistName: item.master_metadata_album_artist_name,
            trackName: item.master_metadata_track_name,
            msPlayed: item.ms_played,
            username: item.username || 'Perfil Principal',
            albumName: item.master_metadata_album_album_name || 'Desconhecido'
          });
        }
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    const parsedData: ParsedHistoryItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const jsonFiles = Object.values(zip.files).filter(zFile => zFile.name.endsWith('.json') && !zFile.dir);
          
          for (const zFile of jsonFiles) {
            const text = await zFile.async('string');
            try {
              const json = JSON.parse(text);
              if (Array.isArray(json)) {
                processJsonArray(json, parsedData);
              }
            } catch (e) {
              console.error(`Failed to parse json inside zip: ${zFile.name}`, e);
            }
          }
        } else if (file.name.endsWith('.json')) {
          const text = await file.text();
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            processJsonArray(json, parsedData);
          }
        }
      }

      setHistoryData(parsedData);
      const uniqueUsers = Array.from(new Set(parsedData.map(d => d.username)));
      if (uniqueUsers.length > 0) {
        setSelectedUser(uniqueUsers[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao processar o arquivo. Certifique-se de que é o arquivo ZIP ou JSON correto do Spotify.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const availableUsers = useMemo(() => Array.from(new Set(historyData.map(d => d.username))), [historyData]);

  const stats = useMemo(() => {
    if (historyData.length === 0 || !selectedUser) return null;

    const filteredData = historyData.filter(item => item.username === selectedUser);
    if (filteredData.length === 0) return null;

    let totalMs = 0;
    const trackCounts: Record<string, { artist: string, name: string, msPlayed: number, plays: number }> = {};
    const artistCounts: Record<string, { name: string, msPlayed: number, plays: number }> = {};
    const albumCounts: Record<string, { name: string, artist: string, msPlayed: number, plays: number }> = {};
    
    // For timeline (group by month)
    const timelineDataMap: Record<string, number> = {};
    const dayOfWeekMap: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    const hourOfDayMap: Record<number, number> = Array.from({length: 24}).reduce((acc: any, _, i) => { acc[i] = 0; return acc; }, {});

    filteredData.forEach(item => {
      totalMs += item.msPlayed;
      
      const trackKey = `${item.trackName} - ${item.artistName}`;
      if (!trackCounts[trackKey]) {
        trackCounts[trackKey] = { artist: item.artistName, name: item.trackName, msPlayed: 0, plays: 0 };
      }
      trackCounts[trackKey].msPlayed += item.msPlayed;
      trackCounts[trackKey].plays += 1;

      if (!artistCounts[item.artistName]) {
        artistCounts[item.artistName] = { name: item.artistName, msPlayed: 0, plays: 0 };
      }
      artistCounts[item.artistName].msPlayed += item.msPlayed;
      artistCounts[item.artistName].plays += 1;

      const albumKey = `${item.albumName} - ${item.artistName}`;
      if (!albumCounts[albumKey]) {
        albumCounts[albumKey] = { name: item.albumName, artist: item.artistName, msPlayed: 0, plays: 0 };
      }
      albumCounts[albumKey].msPlayed += item.msPlayed;
      albumCounts[albumKey].plays += 1;

      const date = new Date(item.timestamp);
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      timelineDataMap[monthYear] = (timelineDataMap[monthYear] || 0) + (item.msPlayed / 3600000); // hours

      const day = date.getDay();
      dayOfWeekMap[day] += (item.msPlayed / 3600000);

      const hour = date.getHours();
      hourOfDayMap[hour] += (item.msPlayed / 3600000);
    });

    const topTracks = Object.values(trackCounts)
      .sort((a, b) => b.msPlayed - a.msPlayed)
      .slice(0, 50);

    const topArtists = Object.values(artistCounts)
      .sort((a, b) => b.msPlayed - a.msPlayed)
      .slice(0, 50);

    const topAlbums = Object.values(albumCounts)
      .sort((a, b) => b.msPlayed - a.msPlayed)
      .slice(0, 50);

    const timelineData = Object.entries(timelineDataMap)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayOfWeekData = Object.entries(dayOfWeekMap).map(([dayIdx, hours]) => ({
      name: days[parseInt(dayIdx)],
      hours
    }));

    const hourOfDayData = Object.entries(hourOfDayMap).map(([hour, hours]) => ({
      name: `${hour}h`,
      hours
    }));

    return {
      totalHours: (totalMs / 3600000).toFixed(0),
      totalPlays: filteredData.length,
      topTracks,
      topArtists,
      topAlbums,
      timelineData,
      dayOfWeekData,
      hourOfDayData
    };
  }, [historyData, selectedUser]);

  if (historyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-6">
          <FileArchive size={40} className="text-[#1DB954]" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Importar Histórico Completo</h2>
        <p className="text-[#B3B3B3] max-w-lg mb-8">
          Descubra suas estatísticas reais sem limitações de data. Faça upload do seu arquivo <strong>.zip</strong> ou <strong>.json</strong> do Spotify. O aplicativo extrairá e combinará todos os seus anos de escuta automaticamente.
        </p>

        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 text-left max-w-xl w-full mb-10 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Info className="text-[#1DB954]" size={24} />
            <h3 className="text-lg font-bold">Como obter seus dados do Spotify?</h3>
          </div>
          <ol className="list-decimal list-inside space-y-3 text-[#B3B3B3] text-sm marker:text-[#1DB954] marker:font-bold">
            <li>
              Acesse a página de configurações de Privacidade do <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#1DB954] underline inline-flex items-center gap-1">Spotify <ExternalLink size={12}/></a>.
            </li>
            <li>Role até o final da página e encontre a seção <strong>"Baixar seus dados"</strong>.</li>
            <li>
              Recomendamos solicitar o <strong>"Histórico de streaming estendido"</strong> (leva alguns dias, mas tem o histórico de toda a sua conta). Ou, para algo rápido (1 ano), peça os "Dados da conta".
            </li>
            <li>Quando o Spotify enviar um e-mail com o arquivo <strong>.ZIP</strong>, basta arrastá-lo ou selecioná-lo no botão abaixo!</li>
          </ol>
        </div>
        
        <div className="relative group cursor-pointer">
          <button 
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 px-8 rounded-full flex items-center gap-3 transition-transform group-hover:scale-105"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="animate-spin"><RefreshCw size={24} /></span>
            ) : (
              <Upload size={24} />
            )}
            {isProcessing ? 'Extraindo dados...' : 'Selecionar Arquivo ZIP ou JSON'}
          </button>
          <input 
            type="file" 
            accept=".json,.zip" 
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>
        {error && <p className="text-red-400 mt-6">{error}</p>}
        
        <p className="text-xs text-[#555] mt-10 max-w-md">
          Todo o processamento e extração do ZIP é feito localmente no seu navegador. Nenhum dado é enviado para nossos servidores, garantindo sua total privacidade.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Análise Profunda</h2>
        
        <div className="flex items-center gap-4">
          {availableUsers.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#B3B3B3]">Perfil:</span>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-[#282828] text-white text-sm font-bold rounded-full px-4 py-1.5 outline-none border border-transparent focus:border-[#1DB954] cursor-pointer"
              >
                {availableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          )}
          
          <button 
            onClick={() => setHistoryData([])}
            className="text-xs text-[#B3B3B3] hover:text-white border border-[#282828] px-3 py-1.5 rounded-full hover:bg-[#282828] transition-colors"
          >
            Limpar Dados
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Big Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#181818] border border-[#282828] p-6 rounded-2xl flex items-center gap-6">
              <div className="w-16 h-16 bg-[#1DB954]/20 text-[#1DB954] rounded-full flex items-center justify-center">
                <Clock size={32} />
              </div>
              <div>
                <p className="text-sm text-[#B3B3B3] font-bold uppercase tracking-wider">Tempo Total Ouvindo</p>
                <p className="text-4xl font-black">{stats.totalHours} <span className="text-xl text-[#B3B3B3] font-normal">Horas</span></p>
              </div>
            </div>
            
            <div className="bg-[#181818] border border-[#282828] p-6 rounded-2xl flex items-center gap-6">
              <div className="w-16 h-16 bg-[#1DB954]/20 text-[#1DB954] rounded-full flex items-center justify-center">
                <Activity size={32} />
              </div>
              <div>
                <p className="text-sm text-[#B3B3B3] font-bold uppercase tracking-wider">Músicas Tocadas</p>
                <p className="text-4xl font-black">{stats.totalPlays.toLocaleString()} <span className="text-xl text-[#B3B3B3] font-normal">Plays</span></p>
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-[#1DB954]" />
              <h2 className="text-xl font-bold">Horas por Mês</h2>
            </div>
            <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#282828', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#1DB954', fontWeight: 'bold' }}
                    labelStyle={{ color: '#B3B3B3', marginBottom: '4px' }}
                    formatter={(val: number) => [val.toFixed(0) + 'h', 'Horas']}
                  />
                  <Area type="monotone" dataKey="hours" name="Horas" stroke="#1DB954" strokeWidth={3} fillOpacity={0.2} fill="#1DB954" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="text-[#1DB954]" />
                <h2 className="text-xl font-bold">Dias da Semana</h2>
              </div>
              <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dayOfWeekData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: '#282828' }}
                      contentStyle={{ backgroundColor: '#282828', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#1DB954', fontWeight: 'bold' }}
                      formatter={(val: number) => [val.toFixed(1) + 'h', 'Horas']}
                    />
                    <Bar dataKey="hours" fill="#1DB954" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-[#1DB954]" />
                <h2 className="text-xl font-bold">Horário do Dia</h2>
              </div>
              <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourOfDayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} minTickGap={3} />
                    <YAxis stroke="#B3B3B3" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: '#282828' }}
                      contentStyle={{ backgroundColor: '#282828', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#1DB954', fontWeight: 'bold' }}
                      formatter={(val: number) => [val.toFixed(1) + 'h', 'Horas']}
                    />
                    <Bar dataKey="hours" fill="#1ed760" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Tracks */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Disc3 className="text-[#1DB954]" />
                <h2 className="text-xl font-bold">Top Músicas (Tempo Real)</h2>
              </div>
              <div className="flex flex-col gap-2">
                {stats.topTracks.slice(0, 10).map((track, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-[#181818] rounded-xl border border-[#282828]">
                    <div className="text-[#B3B3B3] font-bold w-6 text-right">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{track.name}</p>
                      <p className="text-xs text-[#B3B3B3] truncate">{track.artist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1DB954]">{(track.msPlayed / 3600000).toFixed(1)}h</p>
                      <p className="text-[10px] text-[#B3B3B3]">{track.plays} plays</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Artists (Real History) */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <UserIcon className="text-[#1DB954]" />
                <h2 className="text-xl font-bold">Top Artistas (Tempo Real)</h2>
              </div>
              <div className="flex flex-col gap-2">
                {stats.topArtists.slice(0, 10).map((artist, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-[#181818] rounded-xl border border-[#282828]">
                    <div className="text-[#B3B3B3] font-bold w-6 text-right">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{artist.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1DB954]">{(artist.msPlayed / 3600000).toFixed(1)}h</p>
                      <p className="text-[10px] text-[#B3B3B3]">{artist.plays} plays</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Albums */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Disc3 className="text-[#1DB954]" />
                <h2 className="text-xl font-bold">Top Álbuns</h2>
              </div>
              <div className="flex flex-col gap-2">
                {stats.topAlbums.slice(0, 10).map((album, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-[#181818] rounded-xl border border-[#282828]">
                    <div className="text-[#B3B3B3] font-bold w-6 text-right">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{album.name}</p>
                      <p className="text-xs text-[#B3B3B3] truncate">{album.artist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1DB954]">{(album.msPlayed / 3600000).toFixed(1)}h</p>
                      <p className="text-[10px] text-[#B3B3B3]">{album.plays} plays</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
