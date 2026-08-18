/**
 * Types and interfaces for Spotify Account Data and Dashboard
 */

// Standard Spotify Streaming History Item (StreamingHistory_music_0.json)
export interface StandardStreamItem {
  endTime?: string;
  artistName?: string;
  trackName?: string;
  msPlayed?: number;
}

// Extended Spotify Streaming History Item (endsong_0.json or Streaming_History_Audio_*.json)
export interface ExtendedStreamItem {
  ts?: string;
  master_metadata_album_artist_name?: string | null;
  master_metadata_track_name?: string | null;
  master_metadata_album_album_name?: string | null;
  ms_played?: number;
  spotify_track_uri?: string | null;
  reason_start?: string | null;
  reason_end?: string | null;
  shuffle?: boolean | null;
  skipped?: boolean | null;
  platform?: string | null;
  conn_country?: string | null;
  ip_addr_decrypted?: string | null;
  user_agent_decrypted?: string | null;
  episode_name?: string | null;
  episode_show_name?: string | null;
  spotify_episode_uri?: string | null;
}

// Normalized Stream Item used across the application
export interface NormalizedStream {
  timestamp: number; // Unix timestamp in ms
  dateStr: string; // YYYY-MM-DD
  dateTimeStr: string; // YYYY-MM-DD HH:mm
  yearMonth: string; // YYYY-MM
  hour: number; // 0 - 23
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  artistName: string;
  trackName: string;
  albumName?: string;
  msPlayed: number;
  secondsPlayed: number;
  minutesPlayed: number;
  trackUri?: string;
  platform?: string;
  skipped?: boolean;
}

// User Profile Data (Userdata.json)
export interface UserData {
  username?: string;
  email?: string;
  country?: string;
  createdFromFacebook?: boolean;
  facebookUid?: string;
  birthdate?: string;
  gender?: string;
  postalCode?: string;
  mobileNumber?: string;
  creationTime?: string;
  [key: string]: any;
}

// Playlist Item (Playlist.json or Playlists.json)
export interface PlaylistTrack {
  trackName: string;
  artistName: string;
  albumName: string;
  addedDate?: string;
}

export interface PlaylistItem {
  name: string;
  lastModifiedDate?: string;
  items: PlaylistTrack[];
  description?: string | null;
  numberOfFollowers?: number;
}

export interface PlaylistData {
  playlists?: PlaylistItem[];
}

// Library Content (YourLibrary.json)
export interface LibraryData {
  tracks?: Array<{ artist: string; album: string; track: string; uri?: string }>;
  albums?: Array<{ artist: string; album: string; uri?: string }>;
  artists?: Array<{ name: string; uri?: string }>;
  shows?: Array<{ name: string; publisher: string; uri?: string }>;
  bannedTracks?: Array<{ artist: string; album: string; track: string }>;
  bannedArtists?: Array<{ name: string }>;
}

// Search Query (SearchQueries.json)
export interface SearchQueryItem {
  date: string;
  platform: string;
  searchTime: string;
  searchQuery: string;
  searchInteractionURIs?: string[];
}

// Inferences & Wrapped
export interface InferencesData {
  inferences?: string[];
  [key: string]: any;
}

export interface WrappedData {
  [key: string]: any;
}

// Aggregated metrics for an entity (Artist or Track)
export interface AggregateRankItem {
  id: string;
  name: string;
  subtitle?: string; // Artist name for a track, or track count for an artist
  totalMsPlayed: number;
  totalHoursPlayed: number;
  streamCount: number;
  firstPlayed?: string;
  lastPlayed?: string;
  percentageOfTotal?: number;
}

// Temporal metrics
export interface MonthActivity {
  yearMonth: string; // YYYY-MM
  label: string; // "Mar 2026"
  msPlayed: number;
  hoursPlayed: number;
  streamCount: number;
  uniqueArtists: number;
  uniqueTracks: number;
}

export interface DayOfWeekActivity {
  dayIndex: number;
  dayName: string; // "Domingo", "Segunda", etc.
  msPlayed: number;
  hoursPlayed: number;
  streamCount: number;
}

export interface HourlyActivity {
  hour: number;
  hourLabel: string; // "00h", "01h", etc.
  msPlayed: number;
  hoursPlayed: number;
  streamCount: number;
}

// Complete Parsed Spotify Account
export interface SpotifyAccount {
  id: string;
  folderName: string;
  displayName: string;
  accountType: 'primary' | 'kids' | 'secondary';
  hasStreamingHistory: boolean;
  streamCount: number;
  totalMsPlayed: number;
  totalHours: number;
  totalMinutes: number;
  streams: NormalizedStream[];
  
  // Date boundaries
  firstStreamDate?: string;
  lastStreamDate?: string;

  // Key stats
  uniqueArtistsCount: number;
  uniqueTracksCount: number;
  diversityRatio: number; // unique tracks / total streams
  
  // Aggregated Rankings
  topArtistsByTime: AggregateRankItem[];
  topArtistsByStreams: AggregateRankItem[];
  topTracksByTime: AggregateRankItem[];
  topTracksByStreams: AggregateRankItem[];

  // Temporal analysis
  monthlyActivity: MonthActivity[];
  dayOfWeekActivity: DayOfWeekActivity[];
  hourlyActivity: HourlyActivity[];
  peakHour: number;
  mostActiveDay: string;

  // Optional Rich Data
  userData?: UserData | null;
  playlists?: PlaylistItem[];
  library?: LibraryData | null;
  searchQueries?: SearchQueryItem[];
  inferences?: string[];
  wrapped?: WrappedData | null;
}
