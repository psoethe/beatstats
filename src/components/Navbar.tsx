import React from 'react';
import { SpotifyAccount } from '../types/spotify';
import { AuthUser, isFamilyAdmin } from '../types/auth';
import {
  Users,
  User,
  ShieldAlert,
  FolderOpen,
  LogOut,
  LayoutDashboard,
  Database,
  Radio,
  FolderArchive,
  Trash2,
} from 'lucide-react';

interface NavbarProps {
  accounts: SpotifyAccount[];
  selectedAccountId: string | 'overview';
  onSelectAccount: (id: string | 'overview') => void;
  onResetData: () => void;
  onReloadBundledData: () => void;
  activeMode: 'files' | 'spotify_api';
  onModeChange: (mode: 'files' | 'spotify_api') => void;
  authUser: AuthUser;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onResetData,
  onReloadBundledData,
  activeMode,
  onModeChange,
  authUser,
  onLogout,
}) => {
  const isFamilyUser = isFamilyAdmin(authUser.email);

  const handleDeleteData = () => {
    if (window.confirm('Deseja realmente limpar e excluir os dados carregados da tela?')) {
      onResetData();
    }
  };

  return (
    <header className="bg-[#121212]/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#282828] px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col gap-3.5">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 flex items-center justify-center text-black font-black shadow-md shadow-[#1DB954]/20">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">BeatStats</h1>
                <span className="bg-[#242424] text-[#A7A7A7] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#333]">
                  Spotify Hub
                </span>
              </div>
              <p className="text-[11px] text-[#727272]">
                {activeMode === 'files'
                  ? accounts.length > 0
                    ? `Análise de Arquivos Locais (${accounts.length} ${accounts.length === 1 ? 'conta' : 'contas'})`
                    : 'Importação de Arquivos JSON / ZIP'
                  : 'Estatísticas em Tempo Real via API Oficial'}
              </p>
            </div>
          </div>

          {/* Mode Switcher: Files vs Live API */}
          <div className="flex items-center gap-1.5 bg-[#181818] p-1.5 rounded-2xl border border-[#282828] self-start md:self-auto">
            <button
              type="button"
              onClick={() => onModeChange('files')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'files'
                  ? 'bg-[#1DB954] text-black shadow-md'
                  : 'text-[#A7A7A7] hover:text-white hover:bg-[#242424]'
              }`}
            >
              <FolderArchive size={14} />
              <span>Arquivos Exportados</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('spotify_api')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'spotify_api'
                  ? 'bg-[#1DB954] text-black shadow-md'
                  : 'text-[#A7A7A7] hover:text-white hover:bg-[#242424]'
              }`}
            >
              <Radio size={14} />
              <span>Spotify API Ao Vivo</span>
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-xl border border-[#282828] text-xs">
              <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
              <span className="text-[#A7A7A7] truncate max-w-[130px]" title={authUser.email}>
                {authUser.email}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sair da conta Google"
              className="p-2 rounded-xl bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-800/40 transition-all cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Second Row: Sub-account tabs when in 'files' mode with loaded accounts */}
        {activeMode === 'files' && accounts.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-[#222222]">
            {accounts.length > 1 && (
              <button
                type="button"
                onClick={() => onSelectAccount('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedAccountId === 'overview'
                    ? 'bg-white text-black shadow-md'
                    : 'text-[#A7A7A7] hover:text-white hover:bg-[#202020]'
                }`}
              >
                <LayoutDashboard size={13} />
                <span>Visão Geral do Grupo</span>
              </button>
            )}

            {accounts.map(acc => {
              const isSelected = selectedAccountId === acc.id || (accounts.length === 1 && selectedAccountId === 'overview');
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onSelectAccount(acc.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-[#B3B3B3] hover:text-white hover:bg-[#202020]'
                  }`}
                >
                  <User size={12} className={isSelected ? 'text-black' : 'text-[#1DB954]'} />
                  <span className="truncate max-w-[130px]">{acc.displayName}</span>

                  {!acc.hasStreamingHistory ? (
                    <span
                      title="Esta conta não possui histórico de reprodução"
                      className="flex items-center justify-center text-amber-400 ml-0.5"
                    >
                      <ShieldAlert size={11} />
                    </span>
                  ) : null}
                </button>
              );
            })}

            <div className="ml-auto flex items-center gap-2">
              {isFamilyUser && (
                <button
                  type="button"
                  onClick={onReloadBundledData}
                  title="Recarregar dados originais de /public/spotifydata"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-[#A7A7A7] hover:text-white hover:bg-[#202020] border border-[#282828] transition-all cursor-pointer"
                >
                  <Database size={12} />
                  <span>Sincronizar Família</span>
                </button>
              )}

              <button
                type="button"
                onClick={onResetData}
                title="Carregar outro arquivo ZIP ou pasta"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#242424] hover:bg-[#2c2c2c] text-white text-[11px] font-bold rounded-xl border border-[#333] transition-all cursor-pointer"
              >
                <FolderOpen size={12} />
                <span>Trocar Arquivos</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteData}
                title="Deletar dados da visualização atual"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-[11px] font-bold rounded-xl border border-red-800/40 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Deletar Dados</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
