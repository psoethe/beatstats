import { useState, useEffect, useCallback } from 'react';
import {
  getAccessToken,
  getValidToken,
  getUserProfile,
  getTopArtists,
  getTopTracks,
  getCurrentlyPlaying,
  getRecentlyPlayed,
  getUserPlaylists,
  logoutSpotify,
  redirectToSpotifyAuth,
  getStoredSpotifyClientId,
  setStoredSpotifyClientId,
} from '../lib/spotify';
import {
  SpotifyUser,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyCurrentlyPlaying,
  SpotifyRecentlyPlayedItem,
} from '../types';

export const useSpotify = (userEmail?: string) => {
  const [isSpotifyConnected, setIsSpotifyConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<SpotifyRecentlyPlayedItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SpotifyCurrentlyPlaying | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);

  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('long_term');
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Sync active user email to localStorage for redirect recovery
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('beatstats_current_user_email', userEmail.toLowerCase().trim());
    }
  }, [userEmail]);

  // Check auth and handle callback for this specific user
  useEffect(() => {
    const initAuth = async () => {
      setIsConnecting(true);
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
          await getAccessToken(code, userEmail);
          setIsSpotifyConnected(true);
        } catch (error: any) {
          console.error('Erro na troca de token do Spotify:', error);
          setSpotifyError(error.message || 'Falha ao autenticar com Spotify');
        }
      } else {
        const token = await getValidToken(userEmail);
        setIsSpotifyConnected(!!token);
        if (!token) {
          // Reset data if no active token for this user
          setSpotifyUser(null);
          setTopArtists([]);
          setTopTracks([]);
          setRecentlyPlayed([]);
          setCurrentlyPlaying(null);
          setPlaylists([]);
        }
      }
      setIsConnecting(false);
    };

    initAuth();
  }, [userEmail]);

  const fetchLiveSpotifyData = useCallback(async () => {
    if (!isSpotifyConnected) return;

    setIsDataLoading(true);
    setSpotifyError(null);
    try {
      const [
        profileData,
        artistsData,
        tracksData,
        recentData,
        playingData,
        playlistsData,
      ] = await Promise.all([
        getUserProfile(userEmail).catch(() => null),
        getTopArtists(timeRange, 50, userEmail).catch(() => ({ items: [] })),
        getTopTracks(timeRange, 50, userEmail).catch(() => ({ items: [] })),
        getRecentlyPlayed(50, userEmail).catch(() => ({ items: [] })),
        getCurrentlyPlaying(userEmail).catch(() => null),
        getUserPlaylists(50, userEmail).catch(() => ({ items: [] })),
      ]);

      if (profileData) setSpotifyUser(profileData);
      setTopArtists(artistsData?.items || []);
      setTopTracks(tracksData?.items || []);
      setRecentlyPlayed(recentData?.items || []);
      setCurrentlyPlaying(playingData || null);
      setPlaylists(playlistsData?.items || []);
    } catch (error: any) {
      console.error('Erro ao buscar dados ao vivo do Spotify:', error);
      setSpotifyError(error.message || 'Erro ao carregar dados do Spotify');
    } finally {
      setIsDataLoading(false);
    }
  }, [isSpotifyConnected, timeRange, userEmail]);

  useEffect(() => {
    if (isSpotifyConnected) {
      fetchLiveSpotifyData();
    }
  }, [isSpotifyConnected, fetchLiveSpotifyData]);

  const connectSpotify = async (customClientId?: string) => {
    setSpotifyError(null);
    if (customClientId) {
      setStoredSpotifyClientId(customClientId);
    }
    try {
      await redirectToSpotifyAuth(userEmail, customClientId);
    } catch (e: any) {
      setSpotifyError(e.message || 'Falha ao iniciar autenticação com Spotify');
    }
  };

  const disconnectSpotify = () => {
    logoutSpotify(userEmail);
    setIsSpotifyConnected(false);
    setSpotifyUser(null);
    setTopArtists([]);
    setTopTracks([]);
    setRecentlyPlayed([]);
    setCurrentlyPlaying(null);
    setPlaylists([]);
  };

  return {
    isSpotifyConnected,
    isConnecting,
    spotifyError,
    spotifyUser,
    topArtists,
    topTracks,
    recentlyPlayed,
    currentlyPlaying,
    playlists,
    timeRange,
    setTimeRange,
    isDataLoading,
    fetchLiveSpotifyData,
    connectSpotify,
    disconnectSpotify,
    spotifyClientId: getStoredSpotifyClientId(),
    setStoredSpotifyClientId,
  };
};
