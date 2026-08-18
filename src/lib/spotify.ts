/**
 * Spotify Web API integration (OAuth 2.0 PKCE Flow)
 *
 * Scoped by Google user email to prevent token leakage across accounts.
 */

export const DEFAULT_SPOTIFY_CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID ||
  '8581b67914dd4994a1414364b2eed34b';

export const getStoredSpotifyClientId = (): string => {
  return (
    localStorage.getItem('spotify_client_id') ||
    DEFAULT_SPOTIFY_CLIENT_ID
  );
};

export const setStoredSpotifyClientId = (clientId: string) => {
  localStorage.setItem('spotify_client_id', clientId.trim());
};

const getRedirectUri = () => {
  return window.location.origin + window.location.pathname;
};

const getStorageKeys = (userEmail?: string) => {
  const emailKey = (userEmail || localStorage.getItem('beatstats_current_user_email') || 'default').toLowerCase().trim();
  return {
    accessToken: `spotify_access_token_${emailKey}`,
    refreshToken: `spotify_refresh_token_${emailKey}`,
    tokenExpiry: `spotify_token_expiry_${emailKey}`,
  };
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

export const redirectToSpotifyAuth = async (userEmail?: string, customClientId?: string) => {
  const clientId = customClientId || getStoredSpotifyClientId();
  if (!clientId) {
    throw new Error('Spotify Client ID não configurado.');
  }

  const codeVerifier = generateRandomString(64);
  window.sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  if (userEmail) {
    window.sessionStorage.setItem('spotify_pending_google_user', userEmail.toLowerCase().trim());
  }

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
    show_dialog: 'true',
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
};

export const getAccessToken = async (code: string, userEmail?: string) => {
  const clientId = getStoredSpotifyClientId();
  const verifier = window.sessionStorage.getItem('spotify_code_verifier');
  const storedRedirectUri = window.sessionStorage.getItem('spotify_auth_redirect_uri') || getRedirectUri();
  const targetEmail =
    userEmail ||
    window.sessionStorage.getItem('spotify_pending_google_user') ||
    localStorage.getItem('beatstats_current_user_email') ||
    'default';

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
  const keys = getStorageKeys(targetEmail);

  window.localStorage.setItem(keys.accessToken, data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem(keys.refreshToken, data.refresh_token);
  }

  const expiryTime = Date.now() + data.expires_in * 1000;
  window.localStorage.setItem(keys.tokenExpiry, expiryTime.toString());

  // Clean pending state
  window.sessionStorage.removeItem('spotify_pending_google_user');

  return data.access_token;
};

export const refreshAccessToken = async (userEmail?: string) => {
  const clientId = getStoredSpotifyClientId();
  const keys = getStorageKeys(userEmail);
  const refreshToken = window.localStorage.getItem(keys.refreshToken);

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

  window.localStorage.setItem(keys.accessToken, data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem(keys.refreshToken, data.refresh_token);
  }

  const expiryTime = Date.now() + data.expires_in * 1000;
  window.localStorage.setItem(keys.tokenExpiry, expiryTime.toString());

  return data.access_token;
};

export const getValidToken = async (userEmail?: string) => {
  const keys = getStorageKeys(userEmail);
  const token = window.localStorage.getItem(keys.accessToken);
  const expiry = window.localStorage.getItem(keys.tokenExpiry);

  if (!token || !expiry) return null;

  if (Date.now() > parseInt(expiry, 10) - 60000) {
    try {
      return await refreshAccessToken(userEmail);
    } catch (e) {
      console.error('Falha ao renovar token do Spotify:', e);
      logoutSpotify(userEmail);
      return null;
    }
  }

  return token;
};

export const logoutSpotify = (userEmail?: string) => {
  const keys = getStorageKeys(userEmail);
  window.localStorage.removeItem(keys.accessToken);
  window.localStorage.removeItem(keys.refreshToken);
  window.localStorage.removeItem(keys.tokenExpiry);
};

export const fetchWebApi = async (endpoint: string, userEmail?: string, method: string = 'GET') => {
  const token = await getValidToken(userEmail);
  if (!token) throw new Error('Não autenticado no Spotify');

  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 204) return null;

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.warn(`Erro na chamada ${endpoint}:`, errorData);
    throw new Error(errorData.error?.message || `Erro Spotify API: ${res.statusText}`);
  }

  return await res.json();
};

export const getUserProfile = (userEmail?: string) => fetchWebApi('v1/me', userEmail);
export const getTopArtists = (timeRange = 'long_term', limit = 50, userEmail?: string) =>
  fetchWebApi(`v1/me/top/artists?time_range=${timeRange}&limit=${limit}`, userEmail);
export const getTopTracks = (timeRange = 'long_term', limit = 50, userEmail?: string) =>
  fetchWebApi(`v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`, userEmail);
export const getRecentlyPlayed = (limit = 50, userEmail?: string) =>
  fetchWebApi(`v1/me/player/recently-played?limit=${limit}`, userEmail);
export const getCurrentlyPlaying = (userEmail?: string) => fetchWebApi('v1/me/player/currently-playing', userEmail);
export const getUserPlaylists = (limit = 50, userEmail?: string) => fetchWebApi(`v1/me/playlists?limit=${limit}`, userEmail);
export const getPlaylistTracks = (playlistId: string, limit = 50, userEmail?: string) => {
  const cleanId = String(playlistId).replace(/^spotify:playlist:/, '').trim();
  return fetchWebApi(`v1/playlists/${cleanId}/tracks?limit=${limit}`, userEmail);
};
export const getAlbumDetails = (albumId: string, userEmail?: string) => {
  const cleanId = String(albumId).replace(/^spotify:album:/, '').trim();
  return fetchWebApi(`v1/albums/${cleanId}`, userEmail);
};
