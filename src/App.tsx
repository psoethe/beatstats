import React, { useState } from 'react';
import { SpotifyAccount } from './types/spotify';
import { getDemoAccounts } from './utils/demoData';
import { Navbar } from './components/Navbar';
import { FolderDropzone } from './components/FolderDropzone';
import { ComparativeOverview } from './components/ComparativeOverview';
import { AccountDetail } from './components/AccountDetail';

export default function App() {
  // Start with demo data loaded so the dashboard is immediately populated and visually engaging,
  // while still offering clear controls to upload a custom folder/files anytime.
  const [accounts, setAccounts] = useState<SpotifyAccount[]>(() => getDemoAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'overview'>('overview');

  const handleDataLoaded = (newAccounts: SpotifyAccount[]) => {
    setAccounts(newAccounts);
    setSelectedAccountId('overview');
  };

  const handleResetData = () => {
    setAccounts([]);
    setSelectedAccountId('overview');
  };

  const handleLoadDemo = () => {
    const demo = getDemoAccounts();
    setAccounts(demo);
    setSelectedAccountId('overview');
  };

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
            onLoadDemo={handleLoadDemo}
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
      <footer className="border-t border-[#202020] py-6 px-4 text-center text-xs text-[#727272]">
        <p>Spotify Account Multi-Data Dashboard • Processamento 100% local e seguro no navegador</p>
      </footer>
    </div>
  );
}
