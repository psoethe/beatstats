import { useState, useEffect, useCallback } from 'react';
import { 
  getAccessToken, 
  getValidToken, 
  getUserProfile, 
  getTopArtists, 
  getTopTracks, 
  getCurrentlyPlaying, 
  getRecentlyPlayed,
  getAudioFeatures
} from '../lib/spotify';
import { 
  SpotifyUser, 
  SpotifyArtist, 
  SpotifyTrack, 
  SpotifyCurrentlyPlaying,
  SpotifyRecentlyPlayedItem,
  SpotifyAudioFeatures
} from '../types';

export const useSpotify = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [audioFeatures, setAudioFeatures] = useState<SpotifyAudioFeatures[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<SpotifyRecentlyPlayedItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SpotifyCurrentlyPlaying | null>(null);
  
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('short_term');
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Check auth and handle callback
  useEffect(() => {
    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        // Immediately remove code from URL to prevent strict-mode double firing
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
          await getAccessToken(code);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error during token exchange', error);
        }
      } else {
        const token = await getValidToken();
        setIsAuthenticated(!!token);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsDataLoading(true);
    try {
      const [
        profileData,
        artistsData,
        tracksData,
        recentData,
        playingData
      ] = await Promise.all([
        getUserProfile(),
        getTopArtists(timeRange),
        getTopTracks(timeRange),
        getRecentlyPlayed(),
        getCurrentlyPlaying()
      ]);

      const tracks = tracksData?.items || [];
      
      setUser(profileData || null);
      setTopArtists(artistsData?.items || []);
      setTopTracks(tracks);
      // Audio features are deprecated by Spotify and return 403 Forbidden
      setAudioFeatures([]);
      setRecentlyPlayed(recentData?.items || []);
      setCurrentlyPlaying(playingData || null);
    } catch (error) {
      console.error('Error fetching Spotify data', error);
    } finally {
      setIsDataLoading(false);
    }
  }, [isAuthenticated, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    isAuthenticated,
    isLoading,
    isDataLoading,
    user,
    topArtists,
    topTracks,
    audioFeatures,
    recentlyPlayed,
    currentlyPlaying,
    timeRange,
    setTimeRange,
    refreshData: fetchData
  };
};
