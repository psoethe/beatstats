import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import { ALLOWED_EMAILS } from '../types/auth';

interface AuthScreenProps {
  onGoogleSuccess: (credentialResponse: any) => void;
  onDirectLogin: (email: string) => void;
  error: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onGoogleSuccess,
  onDirectLogin,
  error,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services script
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google && googleBtnRef.current) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: onGoogleSuccess,
        });

        (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          locale: 'pt-BR',
          width: 280,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onGoogleSuccess]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail.trim()) {
      onDirectLogin(customEmail.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 selection:bg-[#1DB954] selection:text-black">
      <div className="max-w-md w-full bg-[#181818] border border-[#282828] p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col gap-6 text-center">
        {/* Glow */}
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
            <p className="text-xs text-[#A7A7A7] mt-1">Autenticação com Conta Google</p>
          </div>
        </div>

        {/* Whitelist Banner */}
        <div className="bg-[#121212] border border-[#282828] p-4 rounded-2xl text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1DB954] uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>Acesso Restrito</span>
          </div>
          <p className="text-xs text-[#A7A7A7] leading-relaxed">
            Por motivos de segurança, o acesso é restrito exclusivamente às contas autorizadas:
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
          <div className="bg-red-950/40 border border-red-800/60 p-3.5 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 text-left">
            <AlertCircle size={17} className="text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Render Button if client_id configured */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div ref={googleBtnRef} />

          {/* Quick Access Account Selector Buttons */}
          <div className="w-full space-y-2 pt-2 border-t border-[#242424]">
            <p className="text-xs text-[#727272] mb-3">Selecione sua conta Google autorizada:</p>

            <button
              type="button"
              onClick={() => onDirectLogin('psoethe@gmail.com')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#242424] hover:bg-[#2c2c2c] border border-[#383838] hover:border-[#1DB954] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center font-black text-sm">
                  P
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#1DB954] transition-colors">
                    Pedro Soethe
                  </h4>
                  <p className="text-xs text-[#A7A7A7]">psoethe@gmail.com</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#727272] group-hover:text-white transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onDirectLogin('alicebsoethe@gmail.com')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#242424] hover:bg-[#2c2c2c] border border-[#383838] hover:border-[#1DB954] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-sm">
                  A
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#1DB954] transition-colors">
                    Alice B. Soethe
                  </h4>
                  <p className="text-xs text-[#A7A7A7]">alicebsoethe@gmail.com</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#727272] group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Test other email validation */}
          <form onSubmit={handleCustomSubmit} className="w-full pt-3">
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                placeholder="Outro e-mail Google..."
                className="flex-1 bg-[#121212] text-xs text-white placeholder-[#666] px-3.5 py-2.5 rounded-xl border border-[#282828] focus:border-[#1DB954] outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2.5 bg-[#282828] hover:bg-[#333] text-white text-xs font-bold rounded-xl border border-[#383838] transition-all cursor-pointer"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
