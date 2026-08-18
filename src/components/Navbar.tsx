import React from 'react';
import { SpotifyAccount } from '../types/spotify';
import { Users, User, ShieldAlert, FolderOpen, Sparkles, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  accounts: SpotifyAccount[];
  selectedAccountId: string | 'overview';
  onSelectAccount: (id: string | 'overview') => void;
  onResetData: () => void;
  onLoadDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onResetData,
  onLoadDemo,
}) => {
  return (
    <header className="bg-[#121212]/90 backdrop-blur-md sticky top-0 z-40 border-b border-[#282828] px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1DB954] to-[#1ed760] flex items-center justify-center text-black font-black shadow-md shadow-[#1DB954]/20">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">Spotify Multi-Account Stats</h1>
              <span className="bg-[#282828] text-[#A7A7A7] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#333]">
                {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'}
              </span>
            </div>
            <p className="text-[11px] text-[#727272]">Painel consolidado e histórico paginado</p>
          </div>
        </div>

        {/* Account Selector Tabs / Dropdown */}
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
            <span>Visão Geral Comparativa</span>
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
                <span className="truncate max-w-[130px] sm:max-w-[180px]">{acc.displayName}</span>

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

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={onLoadDemo}
            title="Recarregar conjunto com 4 contas de demonstração"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#A7A7A7] hover:text-emerald-400 hover:bg-emerald-950/40 border border-[#282828] hover:border-emerald-800 transition-all cursor-pointer"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Demo</span>
          </button>

          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#282828] hover:bg-[#333333] text-white text-xs font-bold rounded-xl border border-[#383838] transition-all cursor-pointer"
          >
            <FolderOpen size={13} />
            <span>Carregar Outra Pasta</span>
          </button>
        </div>
      </div>
    </header>
  );
};
