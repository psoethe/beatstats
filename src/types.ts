export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: SpotifyImage[];
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    name: string;
    images: SpotifyImage[];
  };
  duration_ms: number;
  popularity?: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyRecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

export interface SpotifyAudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
}

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
}
