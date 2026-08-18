import { useState, useCallback } from 'react';
import { AuthUser, ALLOWED_EMAILS, isEmailAuthorized } from '../types/auth';

const STORAGE_USER_KEY = 'beatstats_auth_user';

// Production Google OAuth Web Client ID configured in Google Cloud
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '806254169295-b6i2e34kstm2cuidblpdeebkuv88l3lu.apps.googleusercontent.com';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        if (isEmailAuthorized(parsed.email)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [authError, setAuthError] = useState<string | null>(null);

  // Handle Google JWT Token response from Google Identity Services (GIS)
  const handleGoogleCredentialResponse = useCallback((credentialResponse: any) => {
    setAuthError(null);
    try {
      const token = credentialResponse.credential;
      if (!token) {
        setAuthError('Nenhuma credencial retornada pelo Google.');
        return;
      }

      // Decode base64 JWT payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      const email = (payload.email || '').toLowerCase().trim();
      const name = payload.name || payload.given_name || email;
      const picture = payload.picture;
      const sub = payload.sub;

      if (!isEmailAuthorized(email)) {
        setAuthError(
          `Acesso não autorizado para a conta Google "${email}". Apenas ${ALLOWED_EMAILS.join(' e ')} possuem permissão para acessar este painel.`
        );
        return;
      }

      const authUser: AuthUser = {
        name,
        email,
        picture,
        sub,
        authenticatedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
      setUser(authUser);
    } catch (e: any) {
      console.error('Erro ao autenticar com Google:', e);
      setAuthError('Falha ao processar autenticação do Google.');
    }
  }, []);

  // Handle OAuth2 Access Token popup flow
  const handleGoogleAccessToken = useCallback(async (accessToken: string) => {
    setAuthError(null);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error('Falha ao buscar informações da conta Google.');
      }
      const data = await res.json();
      const email = (data.email || '').toLowerCase().trim();

      if (!isEmailAuthorized(email)) {
        setAuthError(
          `Acesso não autorizado para a conta Google "${email}". Apenas ${ALLOWED_EMAILS.join(' e ')} possuem permissão de acesso.`
        );
        return;
      }

      const authUser: AuthUser = {
        name: data.name || data.given_name || email,
        email,
        picture: data.picture,
        sub: data.sub,
        authenticatedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
      setUser(authUser);
    } catch (e: any) {
      console.error('Erro no fluxo OAuth2 do Google:', e);
      setAuthError('Erro ao obter perfil da conta Google.');
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    setAuthError(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    authError,
    setAuthError,
    googleClientId: GOOGLE_CLIENT_ID,
    handleGoogleCredentialResponse,
    handleGoogleAccessToken,
    logout,
    allowedEmails: ALLOWED_EMAILS,
  };
}
