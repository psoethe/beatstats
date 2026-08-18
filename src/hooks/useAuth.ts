import { useState, useEffect, useCallback } from 'react';
import { AuthUser, ALLOWED_EMAILS, isEmailAuthorized } from '../types/auth';

const STORAGE_KEY = 'beatstats_auth_user';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
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

  // Login with raw email or profile
  const loginWithEmail = useCallback((email: string, name?: string, picture?: string) => {
    setAuthError(null);
    const normalized = email.trim().toLowerCase();

    if (!isEmailAuthorized(normalized)) {
      setAuthError(
        `Acesso não autorizado para o e-mail "${email}". Apenas ${ALLOWED_EMAILS.join(' e ')} possuem permissão de acesso.`
      );
      return false;
    }

    const authUser: AuthUser = {
      name: name || (normalized.startsWith('psoethe') ? 'Pedro Soethe' : 'Alice B. Soethe'),
      email: normalized,
      picture,
      authenticatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
    return true;
  }, []);

  // Parse Google JWT Token from Google Identity Services credential response
  const handleGoogleCredentialResponse = useCallback((credentialResponse: any) => {
    setAuthError(null);
    try {
      const token = credentialResponse.credential;
      if (!token) {
        setAuthError('Falha ao obter credenciais do Google.');
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
      const email = payload.email;
      const name = payload.name || payload.given_name || email;
      const picture = payload.picture;

      if (!isEmailAuthorized(email)) {
        setAuthError(
          `Acesso não autorizado para a conta Google "${email}". Apenas os e-mails ${ALLOWED_EMAILS.join(' e ')} têm permissão de acesso.`
        );
        return;
      }

      loginWithEmail(email, name, picture);
    } catch (e: any) {
      console.error('Erro ao decodificar token do Google:', e);
      setAuthError('Erro ao validar login do Google.');
    }
  }, [loginWithEmail]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAuthError(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    authError,
    setAuthError,
    loginWithEmail,
    handleGoogleCredentialResponse,
    logout,
    allowedEmails: ALLOWED_EMAILS,
  };
}
