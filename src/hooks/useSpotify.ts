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

export const useSpotify = () => {
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

  // Check auth and handle callback
  useEffect(() => {
    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
          await getAccessToken(code);
          setIsSpotifyConnected(true);
        } catch (error: any) {
          console.error('Erro na troca de token do Spotify:', error);
          setSpotifyError(error.message || 'Falha ao autenticar com Spotify');
        }
      } else {
        const token = await getValidToken();
        setIsSpotifyConnected(!!token);
      }
      setIsConnecting(false);
    };

    initAuth();
  }, []);

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
        getUserProfile().catch(() => null),
        getTopArtists(timeRange, 50).catch(() => ({ items: [] })),
        getTopTracks(timeRange, 50).catch(() => ({ items: [] })),
        getRecentlyPlayed(50).catch(() => ({ items: [] })),
        getCurrentlyPlaying().catch(() => null),
        getUserPlaylists(50).catch(() => ({ items: [] })),
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
  }, [isSpotifyConnected, timeRange]);

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
      await redirectToSpotifyAuth(customClientId);
    } catch (e: any) {
      setSpotifyError(e.message || 'Falha ao iniciar autenticação com Spotify');
    }
  };

  const disconnectSpotify = () => {
    logoutSpotify();
    setIsSpotifyConnected(false);
    setSpotifyUser(null);
    setTopArtists([]);
    setTopTracks([]);
    setRecentlyPlayed([]);
    setCurrentlyPlaying(null);
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
