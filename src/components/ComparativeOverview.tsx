import React, { useMemo } from 'react';
import { SpotifyAccount } from '../types/spotify';
import { formatPlaytime } from '../utils/parser';
import {
  Clock,
  Headphones,
  Music,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Disc3,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface ComparativeOverviewProps {
  accounts: SpotifyAccount[];
  onSelectAccount: (id: string) => void;
}

const ACCOUNT_COLORS = ['#1DB954', '#38bdf8', '#f59e0b', '#ec4899', '#a855f7', '#6366f1'];

export const ComparativeOverview: React.FC<ComparativeOverviewProps> = ({
  accounts,
  onSelectAccount,
}) => {
  // Aggregate family/group stats
  const totalMsAll = useMemo(() => accounts.reduce((acc, a) => acc + a.totalMsPlayed, 0), [accounts]);
  const totalStreamsAll = useMemo(() => accounts.reduce((acc, a) => acc + a.streamCount, 0), [accounts]);
  const activeAccounts = useMemo(() => accounts.filter(a => a.hasStreamingHistory), [accounts]);
  const emptyAccounts = useMemo(() => accounts.filter(a => !a.hasStreamingHistory), [accounts]);

  // Unique artists count across all accounts combined
  const allUniqueArtists = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach(acc => {
      acc.streams.forEach(s => set.add(s.artistName));
    });
    return set.size;
  }, [accounts]);

  // Data for Listening Time Comparison Bar Chart
  const timeBarData = useMemo(() => {
    return accounts.map((acc, index) => ({
      name: acc.displayName,
      hours: acc.totalHours,
      streams: acc.streamCount,
      hasData: acc.hasStreamingHistory,
      color: ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
    }));
  }, [accounts]);

  // Data for Share of Listening Pie Chart
  const pieData = useMemo(() => {
    return activeAccounts.map((acc, index) => ({
      name: acc.displayName,
      value: acc.totalHours,
      color: ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
    }));
  }, [activeAccounts]);

  // Consolidated monthly timeline comparison
  const monthlyComparisonData = useMemo(() => {
    const monthsSet = new Set<string>();
    activeAccounts.forEach(acc => {
      acc.monthlyActivity.forEach(m => monthsSet.add(m.yearMonth));
    });

    const sortedMonths = Array.from(monthsSet).sort();

    return sortedMonths.map(ym => {
      const row: any = { yearMonth: ym };
      const [y, m] = ym.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      row.label = `${monthNames[parseInt(m, 10) - 1] || m} ${y}`;

      activeAccounts.forEach(acc => {
        const found = acc.monthlyActivity.find(ma => ma.yearMonth === ym);
        row[acc.id] = found ? found.hoursPlayed : 0;
      });

      return row;
    });
  }, [activeAccounts]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Headline & Group KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Time */}
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#A7A7A7]">
            <span className="text-xs font-bold uppercase tracking-wider">Tempo Total (Grupo)</span>
            <div className="p-2 rounded-xl bg-[#1DB954]/10 text-[#1DB954]">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{formatPlaytime(totalMsAll)}</h3>
            <p className="text-xs text-[#727272] mt-1">{(totalMsAll / 3600000).toFixed(1)} horas reproduzidas</p>
          </div>
        </div>

        {/* Total Streams */}
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#A7A7A7]">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Streams</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Headphones size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{totalStreamsAll.toLocaleString()}</h3>
            <p className="text-xs text-[#727272] mt-1">Reproduções em todas as contas</p>
          </div>
        </div>

        {/* Unique Artists */}
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#A7A7A7]">
            <span className="text-xs font-bold uppercase tracking-wider">Artistas Distintos</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Music size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{allUniqueArtists.toLocaleString()}</h3>
            <p className="text-xs text-[#727272] mt-1">Diversidade musical conjunta</p>
          </div>
        </div>

        {/* Accounts Tracked */}
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#A7A7A7]">
            <span className="text-xs font-bold uppercase tracking-wider">Contas Mapeadas</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{accounts.length}</h3>
            <p className="text-xs text-[#727272] mt-1">
              {activeAccounts.length} com dados • {emptyAccounts.length} sem histórico
            </p>
          </div>
        </div>
      </div>

      {/* Comparative Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Hours per Account */}
        <div className="lg:col-span-2 bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#1DB954]/10 text-[#1DB954]">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tempo Total Ouvido por Conta</h3>
                <p className="text-xs text-[#727272]">Comparativo em horas acumuladas</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="#727272"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tickFormatter={val => (val.length > 16 ? `${val.slice(0, 14)}...` : val)}
                />
                <YAxis stroke="#727272" fontSize={11} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val} horas`, 'Tempo de Execução']}
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                  {timeBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={entry.hasData ? 1 : 0.25} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Share of Listening */}
        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <PieIcon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Distribuição de Audição</h3>
              <p className="text-xs text-[#727272]">Participação de cada membro</p>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-xs text-[#727272]">Sem dados de streaming disponíveis.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val}h (${totalMsAll > 0 ? ((val / (totalMsAll / 3600000)) * 100).toFixed(1) : 0}%)`, 'Tempo']}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#A7A7A7', paddingTop: '10px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Timeline Comparison Across Accounts */}
      {monthlyComparisonData.length > 1 && (
        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Evolução Mensal Comparativa</h3>
              <p className="text-xs text-[#727272]">Horas ouvidas mês a mês por cada usuário</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparisonData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <XAxis dataKey="label" stroke="#727272" fontSize={11} tickLine={false} />
                <YAxis stroke="#727272" fontSize={11} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#A7A7A7', paddingTop: '10px' }} iconType="circle" />
                {activeAccounts.map((acc, idx) => (
                  <Line
                    key={acc.id}
                    type="monotone"
                    dataKey={acc.id}
                    name={acc.displayName}
                    stroke={ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Accounts List Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Painel Consolidado de Contas</h2>
          <span className="text-xs text-[#727272]">Clique em uma conta para abrir o painel detalhado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc, index) => {
            const topArtist = acc.topArtistsByTime[0]?.name || 'N/A';
            const topTrack = acc.topTracksByTime[0]?.name || 'N/A';
            const topTrackArtist = acc.topTracksByTime[0]?.subtitle || '';
            const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];

            return (
              <div
                key={acc.id}
                onClick={() => onSelectAccount(acc.id)}
                className="bg-[#181818] border border-[#282828] hover:border-[#383838] p-5 rounded-2xl transition-all hover:bg-[#202020] cursor-pointer group shadow-lg flex flex-col justify-between gap-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-black shadow-md"
                      style={{ backgroundColor: color }}
                    >
                      {acc.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-[#1DB954] transition-colors">
                          {acc.displayName}
                        </h3>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            acc.accountType === 'primary'
                              ? 'bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/30'
                              : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          }`}
                        >
                          {acc.accountType === 'primary' ? 'Principal' : 'Conta Kids'}
                        </span>
                      </div>
                      <p className="text-xs text-[#727272] truncate max-w-xs">{acc.folderName}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-xl bg-[#282828] text-[#A7A7A7] group-hover:text-white group-hover:bg-[#1DB954] group-hover:text-black transition-all"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Content body */}
                {acc.hasStreamingHistory ? (
                  <div className="space-y-3">
                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#121212] p-2 rounded-xl border border-[#282828]">
                        <span className="block text-xs font-black text-white">{formatPlaytime(acc.totalMsPlayed)}</span>
                        <span className="text-[10px] text-[#727272]">Ouvidos</span>
                      </div>
                      <div className="bg-[#121212] p-2 rounded-xl border border-[#282828]">
                        <span className="block text-xs font-black text-white">{acc.streamCount.toLocaleString()}</span>
                        <span className="text-[10px] text-[#727272]">Streams</span>
                      </div>
                      <div className="bg-[#121212] p-2 rounded-xl border border-[#282828]">
                        <span className="block text-xs font-black text-white">{acc.uniqueArtistsCount}</span>
                        <span className="text-[10px] text-[#727272]">Artistas</span>
                      </div>
                    </div>

                    {/* Top highlights */}
                    <div className="space-y-1.5 text-xs bg-[#121212]/60 p-3 rounded-xl border border-[#242424]">
                      <div className="flex items-center gap-2 text-[#A7A7A7]">
                        <Award size={14} className="text-amber-400 shrink-0" />
                        <span className="truncate">
                          Top Artista: <strong className="text-white">{topArtist}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#A7A7A7]">
                        <Disc3 size={14} className="text-[#1DB954] shrink-0" />
                        <span className="truncate">
                          Top Faixa:{' '}
                          <strong className="text-white">
                            {topTrack} {topTrackArtist ? `(${topTrackArtist})` : ''}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state alert */
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center gap-3 text-amber-300 text-xs">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <p className="font-semibold">Esta conta não possui histórico de reprodução disponível.</p>
                      <p className="text-[11px] text-amber-400/70 mt-0.5">
                        Nenhum arquivo de streaming foi detectado na pasta.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
