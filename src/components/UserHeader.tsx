import React from 'react';
import { User, RefreshCw, LogOut } from 'lucide-react';
import { SpotifyUser } from '../types';
import { logout } from '../lib/spotify';

interface UserHeaderProps {
  user: SpotifyUser;
  isDataLoading: boolean;
  onRefresh: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ user, isDataLoading, onRefresh }) => {
  return (
    <header className="bg-black border-b border-[#282828] pt-8 pb-6 px-6 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user?.images?.[0] ? (
            <img 
              src={user.images[0].url} 
              alt={user.display_name} 
              className="w-16 h-16 rounded-full shadow-lg border-2 border-transparent hover:border-[#1DB954] transition-colors object-cover" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center">
              <User size={32} />
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#B3B3B3] font-bold mb-1">Perfil</p>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{user?.display_name || 'Usuário'}</h1>
            <p className="text-[10px] text-[#B3B3B3] mt-1">{user?.followers?.total?.toLocaleString() || 0} seguidores</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onRefresh} 
            className="p-3 bg-[#181818] border border-[#282828] hover:bg-[#282828] rounded-full transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw size={20} className={isDataLoading ? "animate-spin text-[#1DB954]" : "text-[#B3B3B3]"} />
          </button>
          <button 
            onClick={logout} 
            className="p-3 bg-[#181818] border border-[#282828] hover:bg-red-900/50 rounded-full transition-colors text-[#B3B3B3] hover:text-red-400"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
