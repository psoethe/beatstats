/**
 * Spotify Web API integration (OAuth 2.0 PKCE)
 */

export const getStoredSpotifyClientId = (): string => {
  return (
    localStorage.getItem('spotify_client_id') ||
    import.meta.env.VITE_SPOTIFY_CLIENT_ID ||
    ''
  );
};

export const setStoredSpotifyClientId = (clientId: string) => {
  localStorage.setItem('spotify_client_id', clientId.trim());
};

const getRedirectUri = () => {
  return window.location.origin + window.location.pathname;
};

const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const redirectToSpotifyAuth = async (customClientId?: string) => {
  const clientId = customClientId || getStoredSpotifyClientId();
  if (!clientId) {
    throw new Error('Spotify Client ID não configurado.');
  }

  const codeVerifier = generateRandomString(64);
  window.sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  const scope = [
    'user-top-read',
    'user-read-recently-played',
    'user-read-currently-playing',
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
  ].join(' ');

  const redirectUri = getRedirectUri();
  window.sessionStorage.setItem('spotify_auth_redirect_uri', redirectUri);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  const params = {
    response_type: 'code',
    client_id: clientId,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
};

export const getAccessToken = async (code: string) => {
  const clientId = getStoredSpotifyClientId();
  const verifier = window.sessionStorage.getItem('spotify_code_verifier');
  const storedRedirectUri = window.sessionStorage.getItem('spotify_auth_redirect_uri') || getRedirectUri();

  if (!verifier) {
    throw new Error('Code verifier está ausente.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: storedRedirectUri,
    code_verifier: verifier,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Falha ao obter token de acesso do Spotify');
  }

  const data = await response.json();

  window.localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }

  const expiryTime = Date.now() + data.expires_in * 1000;
  window.localStorage.setItem('spotify_token_expiry', expiryTime.toString());

  return data.access_token;
};

export const refreshAccessToken = async () => {
  const clientId = getStoredSpotifyClientId();
  const refreshToken = window.localStorage.getItem('spotify_refresh_token');
  if (!refreshToken) {
    throw new Error('Nenhum refresh token disponível.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error('Falha ao renovar token do Spotify.');
  }

  const data = await response.json();

  window.localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }

  const expiryTime = Date.now() + data.expires_in * 1000;
  window.localStorage.setItem('spotify_token_expiry', expiryTime.toString());

  return data.access_token;
};

export const getValidToken = async () => {
  const token = window.localStorage.getItem('spotify_access_token');
  const expiry = window.localStorage.getItem('spotify_token_expiry');

  if (!token || !expiry) return null;

  if (Date.now() > parseInt(expiry, 10) - 60000) {
    try {
      return await refreshAccessToken();
    } catch (e) {
      console.error('Falha ao renovar token:', e);
      logoutSpotify();
      return null;
    }
  }

  return token;
};

export const logoutSpotify = () => {
  window.localStorage.removeItem('spotify_access_token');
  window.localStorage.removeItem('spotify_refresh_token');
  window.localStorage.removeItem('spotify_token_expiry');
};

const fetchWebApi = async (endpoint: string, method: string = 'GET') => {
  const token = await getValidToken();
  if (!token) throw new Error('Não autenticado no Spotify');

  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 204) return null;

  if (!res.ok) {
    throw new Error(`Erro Spotify API: ${res.statusText}`);
  }

  return await res.json();
};

export const getUserProfile = () => fetchWebApi('v1/me');
export const getTopArtists = (timeRange = 'long_term', limit = 50) =>
  fetchWebApi(`v1/me/top/artists?time_range=${timeRange}&limit=${limit}`);
export const getTopTracks = (timeRange = 'long_term', limit = 50) =>
  fetchWebApi(`v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
export const getRecentlyPlayed = (limit = 50) =>
  fetchWebApi(`v1/me/player/recently-played?limit=${limit}`);
export const getCurrentlyPlaying = () => fetchWebApi('v1/me/player/currently-playing');
export const getUserPlaylists = (limit = 50) => fetchWebApi(`v1/me/playlists?limit=${limit}`);
