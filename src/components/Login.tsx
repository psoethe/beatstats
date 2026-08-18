import React, { useState, useEffect } from 'react';
import { redirectToAuthCodeFlow } from '../lib/spotify';
import { Music, Download } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#1DB954] opacity-20 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#1DB954] opacity-10 blur-[100px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 flex flex-col items-center max-w-md text-center"
      >
        <div className="w-24 h-24 bg-[#1DB954] rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(29,185,84,0.4)]">
          <Music size={48} className="text-black" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          BeatStats
        </h1>
        
        <p className="text-[#B3B3B3] text-lg mb-10 leading-relaxed">
          Descubra seus artistas favoritos, músicas mais ouvidas e estatísticas detalhadas da sua conta Spotify.
        </p>
        
        <button 
          onClick={redirectToAuthCodeFlow}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 text-lg shadow-lg"
        >
          Conectar com Spotify
        </button>

        {deferredPrompt && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleInstallClick}
            className="mt-8 flex items-center gap-2 bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-opacity-90 transition-all"
          >
            <Download size={18} />
            <span>Instalar App</span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};
