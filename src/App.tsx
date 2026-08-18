import React, { useState, useEffect } from 'react';
import { SpotifyAccount } from './types/spotify';
import { isFamilyAdmin } from './types/auth';
import { loadBundledSpotifyData } from './utils/remoteLoader';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { FolderDropzone } from './components/FolderDropzone';
import { ComparativeOverview } from './components/ComparativeOverview';
import { AccountDetail } from './components/AccountDetail';
import { SpotifyLiveDashboard } from './components/SpotifyLiveDashboard';
import { Lock, Radio, ShieldAlert } from 'lucide-react';

export default function App() {
  const {
    user,
    isAuthenticated,
    authError,
    googleClientId,
    handleGoogleCredentialResponse,
    handleGoogleAccessToken,
    logout,
  } = useAuth();

  const [activeMode, setActiveMode] = useState<'files' | 'spotify_api'>('files');
  const [accounts, setAccounts] = useState<SpotifyAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'overview'>('overview');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const isFamilyUser = user ? isFamilyAdmin(user.email) : false;

  // Auto-switch mode based on user permissions on login
  useEffect(() => {
    if (user) {
      if (isFamilyAdmin(user.email)) {
        setActiveMode('files');
      } else {
        setActiveMode('spotify_api');
      }
    }
  }, [user]);

  // Auto-load bundled dataset from /public/spotifydata when family user is authenticated
  useEffect(() => {
    if (isAuthenticated && isFamilyUser) {
      let isMounted = true;
      setIsLoadingData(true);

      loadBundledSpotifyData()
        .then(loadedAccounts => {
          if (isMounted) {
            setAccounts(loadedAccounts);
            setSelectedAccountId('overview');
          }
        })
        .catch(err => {
          console.error('Erro ao carregar dados em /public/spotifydata:', err);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingData(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, isFamilyUser]);

  const handleDataLoaded = (newAccounts: SpotifyAccount[]) => {
    setAccounts(newAccounts);
    setSelectedAccountId('overview');
  };

  const handleResetData = () => {
    setAccounts([]);
    setSelectedAccountId('overview');
  };

  const handleReloadBundledData = async () => {
    setIsLoadingData(true);
    try {
      const loaded = await loadBundledSpotifyData();
      setAccounts(loaded);
      setSelectedAccountId('overview');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 1. If not authenticated with Google account, show Auth Screen
  if (!isAuthenticated || !user) {
    return (
      <AuthScreen
        onGoogleSuccess={handleGoogleCredentialResponse}
        onAccessToken={handleGoogleAccessToken}
        googleClientId={googleClientId}
        error={authError}
      />
    );
  }

  // 2. Loading state when fetching family files
  if (isLoadingData && activeMode === 'files' && isFamilyUser) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-base">Carregando dados sincronizados da família...</p>
        <p className="text-xs text-[#727272]">Lendo históricos de reprodução, playlists e perfis</p>
      </div>
    );
  }

  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col selection:bg-[#1DB954] selection:text-black">
      <Navbar
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={setSelectedAccountId}
        onResetData={handleResetData}
        onReloadBundledData={handleReloadBundledData}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        authUser={user}
        onLogout={logout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* Mode 1: Spotify Live API Dashboard (Available to anyone) */}
        {activeMode === 'spotify_api' && <SpotifyLiveDashboard />}

        {/* Mode 2: Exported Family Files Dashboard (Restricted to Family Admins or Custom Folder) */}
        {activeMode === 'files' && (
          <>
            {!isFamilyUser ? (
              <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Lock size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Acesso Restrito aos Dados Familiares</h3>
                  <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed max-w-lg mx-auto">
                    Os arquivos históricos privados estão restritos para as contas administradoras (<code>psoethe@gmail.com</code> e <code>alicebsoethe@gmail.com</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('spotify_api')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs rounded-full shadow-lg transition-all cursor-pointer"
                >
                  <Radio size={15} />
                  <span>Acessar Meu Spotify Ao Vivo</span>
                </button>
              </div>
            ) : accounts.length > 0 ? (
              selectedAccountId === 'overview' || !currentAccount ? (
                <ComparativeOverview
                  accounts={accounts}
                  onSelectAccount={id => setSelectedAccountId(id)}
                />
              ) : (
                <AccountDetail account={currentAccount} />
              )
            ) : (
              <FolderDropzone onDataLoaded={handleDataLoaded} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#202020] py-6 px-4 text-center text-xs text-[#727272] flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <p>
          BeatStats • Logado como <strong className="text-white">{user.email}</strong>{' '}
          {isFamilyUser ? (
            <span className="text-emerald-400 text-[10px] font-bold uppercase ml-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/40">
              Admin Família
            </span>
          ) : null}
        </p>
        <p className="text-[11px] text-[#555]">Processamento 100% seguro no navegador</p>
      </footer>
    </div>
  );
}
