import React from 'react';
import { SpotifyAccount } from '../types/spotify';
import { AuthUser } from '../types/auth';
import { Users, User, ShieldAlert, FolderOpen, LogOut, LayoutDashboard, Database } from 'lucide-react';

interface NavbarProps {
  accounts: SpotifyAccount[];
  selectedAccountId: string | 'overview';
  onSelectAccount: (id: string | 'overview') => void;
  onResetData: () => void;
  onReloadBundledData: () => void;
  authUser: AuthUser;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onResetData,
  onReloadBundledData,
  authUser,
  onLogout,
}) => {
  return (
    <header className="bg-[#121212]/90 backdrop-blur-md sticky top-0 z-40 border-b border-[#282828] px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Account count */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1DB954] to-[#1ed760] flex items-center justify-center text-black font-black shadow-md shadow-[#1DB954]/20">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">Spotify Family Stats</h1>
              <span className="bg-[#282828] text-[#A7A7A7] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#333]">
                {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'}
              </span>
            </div>
            <p className="text-[11px] text-[#727272]">Dados sincronizados de <code className="text-[#A7A7A7]">/public/spotifydata</code></p>
          </div>
        </div>

        {/* Account Selector Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 bg-[#181818] p-1 rounded-2xl border border-[#282828]">
          {/* Overview Tab */}
          <button
            type="button"
            onClick={() => onSelectAccount('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedAccountId === 'overview'
                ? 'bg-[#1DB954] text-black shadow-md'
                : 'text-[#B3B3B3] hover:text-white hover:bg-[#252525]'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Visão Geral</span>
          </button>

          {/* Account Tabs */}
          {accounts.map(acc => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onSelectAccount(acc.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <User size={13} className={isSelected ? 'text-black' : 'text-[#1DB954]'} />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{acc.displayName}</span>

                {!acc.hasStreamingHistory ? (
                  <span
                    title="Esta conta não possui histórico de reprodução"
                    className="flex items-center justify-center text-amber-400 ml-0.5"
                  >
                    <ShieldAlert size={12} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* User Email Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-xl border border-[#282828] text-xs">
            <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
            <span className="text-[#A7A7A7] truncate max-w-[140px]" title={authUser.email}>
              {authUser.email}
            </span>
          </div>

          <button
            type="button"
            onClick={onReloadBundledData}
            title="Recarregar dados originais de /public/spotifydata"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#A7A7A7] hover:text-white hover:bg-[#252525] border border-[#282828] transition-all cursor-pointer"
          >
            <Database size={13} />
            <span className="hidden sm:inline">Recarregar</span>
          </button>

          <button
            type="button"
            onClick={onResetData}
            title="Carregar outra pasta localmente"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#282828] hover:bg-[#333333] text-white text-xs font-bold rounded-xl border border-[#383838] transition-all cursor-pointer"
          >
            <FolderOpen size={13} />
            <span className="hidden sm:inline">Outra Pasta</span>
          </button>

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
    </header>
  );
};
