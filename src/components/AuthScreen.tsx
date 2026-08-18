import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { ALLOWED_EMAILS } from '../types/auth';

interface AuthScreenProps {
  onGoogleSuccess: (credentialResponse: any) => void;
  onAccessToken: (token: string) => void;
  googleClientId: string;
  error: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onGoogleSuccess,
  onAccessToken,
  googleClientId,
  error,
}) => {
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services script
  useEffect(() => {
    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      setIsGsiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGsiLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize Google Button when script and client ID are ready
  useEffect(() => {
    if (!isGsiLoaded || !googleClientId) return;

    try {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            setIsSigningIn(false);
            onGoogleSuccess(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            locale: 'pt-BR',
            width: 320,
          });
        }
      }
    } catch (e) {
      console.error('Erro ao renderizar botão do Google:', e);
    }
  }, [isGsiLoaded, googleClientId, onGoogleSuccess]);

  // Trigger Google OAuth2 Popup flow
  const handleOAuth2Popup = () => {
    if (!(window as any).google?.accounts?.oauth2) {
      alert('Carregando serviço de autenticação do Google. Aguarde um instante e tente novamente.');
      return;
    }

    setIsSigningIn(true);
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        callback: (response: any) => {
          setIsSigningIn(false);
          if (response.access_token) {
            onAccessToken(response.access_token);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (e: any) {
      setIsSigningIn(false);
      console.error('Erro no popup OAuth2:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 selection:bg-[#1DB954] selection:text-black">
      <div className="max-w-md w-full bg-[#181818] border border-[#282828] p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col gap-6 text-center">
        {/* Ambient Glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-[#1DB954]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 flex items-center justify-center text-black font-black shadow-lg shadow-[#1DB954]/20">
            <Lock size={30} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Spotify Family Stats
            </h1>
            <p className="text-xs text-[#A7A7A7] mt-1">Autenticação Obrigatória com Google</p>
          </div>
        </div>

        {/* Whitelist Banner */}
        <div className="bg-[#121212] border border-[#282828] p-4 rounded-2xl text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1DB954] uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>Acesso Restrito</span>
          </div>
          <p className="text-xs text-[#A7A7A7] leading-relaxed">
            O painel é protegido e acessível apenas através do login com as seguintes contas Google:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ALLOWED_EMAILS.map(email => (
              <span
                key={email}
                className="bg-[#242424] text-white font-mono text-[11px] px-2.5 py-1 rounded-lg border border-[#383838]"
              >
                {email}
              </span>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 text-left animate-fadeIn">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google Authentication Actions */}
        <div className="flex flex-col items-center justify-center gap-4 pt-2">
          {/* Official Google GSI Button Container */}
          <div ref={googleBtnRef} className="flex justify-center min-h-[44px]" />

          {/* Primary Google Login Button (triggers OAuth2 Popup) */}
          <button
            type="button"
            onClick={handleOAuth2Popup}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-full bg-white hover:bg-slate-100 text-black font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <RefreshCw size={18} className="animate-spin text-black" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isSigningIn ? 'Conectando ao Google...' : 'Fazer Login com Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
