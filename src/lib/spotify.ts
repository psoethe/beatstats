const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'COLOQUE_SEU_CLIENT_ID_AQUI';
const REDIRECT_URI = window.location.origin + '/';

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

export const redirectToAuthCodeFlow = async () => {
  const codeVerifier = generateRandomString(64);
  window.sessionStorage.setItem('code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  const scope = 'user-top-read user-read-recently-played user-read-currently-playing user-read-private user-read-email';
  const authUrl = new URL('https://accounts.spotify.com/authorize');

  window.sessionStorage.setItem('auth_redirect_uri', REDIRECT_URI);

  const params = {
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
};

export const getAccessToken = async (code: string) => {
  const verifier = window.sessionStorage.getItem('code_verifier');
  const storedRedirectUri = window.sessionStorage.getItem('auth_redirect_uri') || REDIRECT_URI;
  
  if (!verifier) {
    throw new Error('Code verifier is missing');
  }

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
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
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Failed to fetch access token');
  }

  const data = await response.json();
  
  // Store tokens
  window.localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }
  
  const expiryTime = Date.now() + (data.expires_in * 1000);
  window.localStorage.setItem('spotify_token_expiry', expiryTime.toString());
  
  return data.access_token;
};

export const refreshAccessToken = async () => {
  const refreshToken = window.localStorage.getItem('spotify_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
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
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  
  window.localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }
  
  const expiryTime = Date.now() + (data.expires_in * 1000);
  window.localStorage.setItem('spotify_token_expiry', expiryTime.toString());
  
  return data.access_token;
};

export const getValidToken = async () => {
  const token = window.localStorage.getItem('spotify_access_token');
  const expiry = window.localStorage.getItem('spotify_token_expiry');

  if (!token || !expiry) return null;

  if (Date.now() > parseInt(expiry, 10) - 60000) {
    // Refresh token if within 1 minute of expiring
    try {
      return await refreshAccessToken();
    } catch (e) {
      console.error('Failed to refresh token', e);
      logout();
      return null;
    }
  }

  return token;
};

export const logout = () => {
  window.localStorage.removeItem('spotify_access_token');
  window.localStorage.removeItem('spotify_refresh_token');
  window.localStorage.removeItem('spotify_token_expiry');
  window.location.reload();
};

const fetchWebApi = async (endpoint: string, method: string = 'GET') => {
  const token = await getValidToken();
  if (!token) throw new Error('No valid token');

  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 204) return null; // No content (e.g. not playing anything)
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }

  return await res.json();
};

export const getUserProfile = () => fetchWebApi('v1/me');
export const getTopArtists = (timeRange = 'short_term') => fetchWebApi(`v1/me/top/artists?time_range=${timeRange}&limit=20`);
export const getTopTracks = (timeRange = 'short_term') => fetchWebApi(`v1/me/top/tracks?time_range=${timeRange}&limit=20`);
export const getRecentlyPlayed = () => fetchWebApi('v1/me/player/recently-played?limit=50');
export const getCurrentlyPlaying = () => fetchWebApi('v1/me/player/currently-playing');
export const getAudioFeatures = (ids: string[]) => fetchWebApi(`v1/audio-features?ids=${ids.join(',')}`);
