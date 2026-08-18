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
        // Default guest users to Spotify API, but allow files tab with personal dropzone
        setActiveMode('spotify_api');
      }
    }
  }, [user]);

  // Auto-load bundled dataset from /public/spotifydata ONLY for whitelisted family users
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
      // Non-family users start with empty accounts so they see the FolderDropzone guide
      setAccounts([]);
      setIsLoadingData(false);
    }
  }, [isAuthenticated, isFamilyUser]);

  const handleDataLoaded = (newAccounts: SpotifyAccount[]) => {
    setAccounts(newAccounts);
    if (newAccounts.length === 1) {
      setSelectedAccountId(newAccounts[0].id);
    } else {
      setSelectedAccountId('overview');
    }
  };

  const handleResetData = () => {
    setAccounts([]);
    setSelectedAccountId('overview');
  };

  const handleReloadBundledData = async () => {
    if (!isFamilyUser) return;
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

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || (accounts.length === 1 ? accounts[0] : undefined);

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
        {/* Mode 1: Spotify Live API Dashboard (isolated by user email) */}
        {activeMode === 'spotify_api' && <SpotifyLiveDashboard userEmail={user.email} />}

        {/* Mode 2: Exported Files Dashboard (preloaded for family, dropzone for all users) */}
        {activeMode === 'files' && (
          <>
            {accounts.length > 0 ? (
              (selectedAccountId === 'overview' && accounts.length > 1) || !currentAccount ? (
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
          BeatStats • Logado como <strong className="text-white">{user.email}</strong>
        </p>
        <p className="text-[11px] text-[#A7A7A7] flex items-center gap-1.5">
          <span>🔒 Processamento 100% local no navegador • O site não salva nem armazena nenhuma informação sua</span>
        </p>
      </footer>
    </div>
  );
}
