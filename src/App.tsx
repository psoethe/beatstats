import React, { useState, useEffect } from 'react';
import { SpotifyAccount } from './types/spotify';
import { loadBundledSpotifyData } from './utils/remoteLoader';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { FolderDropzone } from './components/FolderDropzone';
import { ComparativeOverview } from './components/ComparativeOverview';
import { AccountDetail } from './components/AccountDetail';

export default function App() {
  const {
    user,
    isAuthenticated,
    authError,
    googleClientId,
    setGoogleClientId,
    handleGoogleCredentialResponse,
    handleGoogleAccessToken,
    logout,
  } = useAuth();

  const [accounts, setAccounts] = useState<SpotifyAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'overview'>('overview');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Auto-load bundled dataset from /public/spotifydata when authenticated
  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [isAuthenticated]);

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

  // 1. If not authenticated with allowed Google account, show Auth Screen
  if (!isAuthenticated || !user) {
    return (
      <AuthScreen
        onGoogleSuccess={handleGoogleCredentialResponse}
        onAccessToken={handleGoogleAccessToken}
        googleClientId={googleClientId}
        onSaveClientId={setGoogleClientId}
        error={authError}
      />
    );
  }

  // 2. Loading state when fetching files from /public/spotifydata
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-base">Carregando dados sincronizados do Spotify...</p>
        <p className="text-xs text-[#727272]">Lendo históricos de reprodução, playlists e perfis</p>
      </div>
    );
  }

  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col selection:bg-[#1DB954] selection:text-black">
      {accounts.length > 0 ? (
        <>
          <Navbar
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onResetData={handleResetData}
            onReloadBundledData={handleReloadBundledData}
            authUser={user}
            onLogout={logout}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
            {selectedAccountId === 'overview' || !currentAccount ? (
              <ComparativeOverview
                accounts={accounts}
                onSelectAccount={id => setSelectedAccountId(id)}
              />
            ) : (
              <AccountDetail account={currentAccount} />
            )}
          </main>
        </>
      ) : (
        <main className="flex-1 flex items-center justify-center p-4">
          <FolderDropzone onDataLoaded={handleDataLoaded} />
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-[#202020] py-6 px-4 text-center text-xs text-[#727272] flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <p>Spotify Multi-Account Stats • Logado como <strong className="text-white">{user.email}</strong></p>
        <p className="text-[11px] text-[#555]">Acesso restrito • Processamento local no navegador</p>
      </footer>
    </div>
  );
}
