/**
 * Resilient parser and aggregator for Spotify Account Data
 * Supports nested subdirectories, smart index.txt resolution, and rich data extraction.
 */

import {
  NormalizedStream,
  SpotifyAccount,
  AggregateRankItem,
  MonthActivity,
  DayOfWeekActivity,
  HourlyActivity,
  UserData,
  PlaylistItem,
  LibraryData,
  SearchQueryItem,
  InferencesData,
  WrappedData,
} from '../types/spotify';

const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/**
 * Format milliseconds to human readable hours and minutes string
 */
export function formatPlaytime(ms: number): string {
  if (!ms || ms <= 0) return '0 min';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Normalizes folder string for matching (removes symbols, extra spaces, lowercases)
 */
function normalizeFolderName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse an index.txt string into a list of account folder definitions,
 * optionally matching against actual directory names found on disk.
 */
export function parseIndexFile(
  indexContent: string,
  actualDiscoveredFolders: string[] = []
): Array<{ folderName: string; displayName: string; accountType: 'primary' | 'kids' | 'secondary' }> {
  const lines = indexContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  const accounts: Array<{ folderName: string; displayName: string; accountType: 'primary' | 'kids' | 'secondary' }> = [];

  for (const line of lines) {
    // 1. Strip arrows and descriptions (e.g. "Spotify Account Data you" -> pasta com os dados...)
    let cleanLine = line;
    if (cleanLine.includes('->')) {
      cleanLine = cleanLine.split('->')[0].trim();
    }
    cleanLine = cleanLine.replace(/^["']|["']$/g, '').trim();
    if (!cleanLine) continue;

    let matchedFolder = '';
    let displayName = '';
    let accountType: 'primary' | 'kids' | 'secondary' = 'secondary';

    // 2. Check if cleanLine starts with any actual folder discovered on disk
    if (actualDiscoveredFolders.length > 0) {
      // Sort discovered folders by length descending to match longest prefix first
      const sortedActual = [...actualDiscoveredFolders].sort((a, b) => b.length - a.length);
      for (const actFolder of sortedActual) {
        if (cleanLine.toLowerCase().startsWith(actFolder.toLowerCase())) {
          matchedFolder = actFolder;
          const remainder = cleanLine.slice(actFolder.length).trim();
          displayName = remainder.replace(/^[-_:–\s\[\]]+|[-_:–\s\[\]]+$/g, '').trim();
          break;
        }
      }
    }

    // 3. If no actual folder matched via prefix, use regex patterns
    if (!matchedFolder) {
      // Pattern: "Spotify Kids Account Data_1 Arthur B Soethe" or "Spotify Kids Account Data_1 [Arthur]"
      const kidsIndexedMatch = cleanLine.match(/^(Spotify\s+Kids\s+Account\s+Data(?:_\d+)?)(?:\s+(?:\[(.*?)\]|(.*)))?$/i);
      if (kidsIndexedMatch) {
        matchedFolder = kidsIndexedMatch[1].trim();
        displayName = (kidsIndexedMatch[2] || kidsIndexedMatch[3] || '').trim();
        accountType = 'kids';
      } else {
        // Pattern: "Spotify Account Data you"
        const mainMatch = cleanLine.match(/^(Spotify\s+Account\s+Data)(?:\s+(?:\[(.*?)\]|(.*)))?$/i);
        if (mainMatch) {
          matchedFolder = mainMatch[1].trim();
          displayName = (mainMatch[2] || mainMatch[3] || '').trim();
          accountType = 'primary';
        } else {
          // General pattern: First token/phrase or full line
          matchedFolder = cleanLine;
          displayName = cleanLine;
        }
      }
    }

    // 4. Refine account type and display name
    const isKids = /kids/i.test(matchedFolder) || /kids/i.test(cleanLine);
    const isYou = /you|principal|main/i.test(displayName) || /you|principal|main/i.test(cleanLine);

    if (isKids) {
      accountType = 'kids';
      if (!displayName) {
        displayName = `Conta Kids ${accounts.length + 1}`;
      }
    } else if (isYou || /Spotify\s+Account\s+Data$/i.test(matchedFolder)) {
      accountType = 'primary';
      if (!displayName || displayName.toLowerCase() === 'you') {
        displayName = 'Usuário Principal';
      }
    } else if (!displayName) {
      displayName = matchedFolder;
    }

    accounts.push({
      folderName: matchedFolder,
      displayName,
      accountType,
    });
  }

  return accounts;
}

/**
 * Normalizes raw stream records from standard and extended Spotify JSONs
 */
export function normalizeStreams(rawItems: any[]): NormalizedStream[] {
  const normalized: NormalizedStream[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;

    // Check for Standard Spotify history format (endTime, artistName, trackName, msPlayed)
    if (item.endTime && item.artistName && item.trackName) {
      const ts = new Date(item.endTime.replace(' ', 'T') + 'Z').getTime() || new Date(item.endTime).getTime();
      const dateObj = new Date(ts);
      const ms = Number(item.msPlayed) || 0;

      if (isNaN(ts) || !item.trackName) continue;

      const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const dateStr = dateObj.toISOString().slice(0, 10);
      const dateTimeStr = item.endTime;

      normalized.push({
        timestamp: ts,
        dateStr,
        dateTimeStr,
        yearMonth,
        hour: dateObj.getHours(),
        dayOfWeek: dateObj.getDay(),
        artistName: String(item.artistName).trim(),
        trackName: String(item.trackName).trim(),
        albumName: item.albumName ? String(item.albumName).trim() : undefined,
        msPlayed: ms,
        secondsPlayed: Math.round(ms / 1000),
        minutesPlayed: +(ms / 60000).toFixed(2),
      });
    }
    // Check for Extended Spotify history format (ts, master_metadata_album_artist_name, master_metadata_track_name, ms_played)
    else if (item.ts && (item.master_metadata_track_name || item.episode_name)) {
      const ts = new Date(item.ts).getTime();
      const dateObj = new Date(ts);
      const ms = Number(item.ms_played) || 0;

      if (isNaN(ts)) continue;

      const artist = item.master_metadata_album_artist_name || item.episode_show_name || 'Desconhecido';
      const track = item.master_metadata_track_name || item.episode_name || 'Faixa Desconhecida';
      const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const dateStr = dateObj.toISOString().slice(0, 10);
      const dateTimeStr = dateObj.toISOString().replace('T', ' ').slice(0, 16);

      normalized.push({
        timestamp: ts,
        dateStr,
        dateTimeStr,
        yearMonth,
        hour: dateObj.getHours(),
        dayOfWeek: dateObj.getDay(),
        artistName: String(artist).trim(),
        trackName: String(track).trim(),
        albumName: item.master_metadata_album_album_name ? String(item.master_metadata_album_album_name).trim() : undefined,
        msPlayed: ms,
        secondsPlayed: Math.round(ms / 1000),
        minutesPlayed: +(ms / 60000).toFixed(2),
        trackUri: item.spotify_track_uri || item.spotify_episode_uri,
        platform: item.platform,
        skipped: item.skipped ?? false,
      });
    }
  }

  // Sort chronologically ascending
  normalized.sort((a, b) => a.timestamp - b.timestamp);

  return normalized;
}

/**
 * Aggregates a normalized stream list into comprehensive stats and charts data
 */
export function aggregateAccountData(
  id: string,
  folderName: string,
  displayName: string,
  accountType: 'primary' | 'kids' | 'secondary',
  streams: NormalizedStream[],
  optionalData: {
    userData?: UserData | null;
    playlists?: PlaylistItem[];
    library?: LibraryData | null;
    searchQueries?: SearchQueryItem[];
    inferences?: string[];
    wrapped?: WrappedData | null;
  } = {}
): SpotifyAccount {
  const hasStreamingHistory = streams.length > 0;
  const streamCount = streams.length;
  const totalMsPlayed = streams.reduce((acc, s) => acc + s.msPlayed, 0);
  const totalMinutes = Math.floor(totalMsPlayed / 60000);
  const totalHours = +(totalMsPlayed / 3600000).toFixed(1);

  // If no streams, return resilient structure with no-history status
  if (!hasStreamingHistory) {
    return {
      id,
      folderName,
      displayName,
      accountType,
      hasStreamingHistory: false,
      streamCount: 0,
      totalMsPlayed: 0,
      totalHours: 0,
      totalMinutes: 0,
      streams: [],
      uniqueArtistsCount: 0,
      uniqueTracksCount: 0,
      diversityRatio: 0,
      topArtistsByTime: [],
      topArtistsByStreams: [],
      topTracksByTime: [],
      topTracksByStreams: [],
      monthlyActivity: [],
      dayOfWeekActivity: DAY_NAMES.map((name, i) => ({
        dayIndex: i,
        dayName: name,
        msPlayed: 0,
        hoursPlayed: 0,
        streamCount: 0,
      })),
      hourlyActivity: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        hourLabel: `${String(h).padStart(2, '0')}h`,
        msPlayed: 0,
        hoursPlayed: 0,
        streamCount: 0,
      })),
      peakHour: 0,
      mostActiveDay: 'Sem dados',
      userData: optionalData.userData || null,
      playlists: optionalData.playlists || [],
      library: optionalData.library || null,
      searchQueries: optionalData.searchQueries || [],
      inferences: optionalData.inferences || [],
      wrapped: optionalData.wrapped || null,
    };
  }

  // Calculate Artists aggregation
  const artistMap = new Map<string, { totalMs: number; count: number; first: number; last: number }>();
  const trackMap = new Map<string, { artist: string; track: string; totalMs: number; count: number; first: number; last: number }>();

  // Temporal maps
  const monthMap = new Map<string, { ms: number; count: number; artists: Set<string>; tracks: Set<string> }>();
  const dayMap = new Array(7).fill(0).map(() => ({ ms: 0, count: 0 }));
  const hourMap = new Array(24).fill(0).map(() => ({ ms: 0, count: 0 }));

  for (const stream of streams) {
    // Artist
    const artistKey = stream.artistName;
    const aData = artistMap.get(artistKey) || { totalMs: 0, count: 0, first: stream.timestamp, last: stream.timestamp };
    aData.totalMs += stream.msPlayed;
    aData.count += 1;
    if (stream.timestamp < aData.first) aData.first = stream.timestamp;
    if (stream.timestamp > aData.last) aData.last = stream.timestamp;
    artistMap.set(artistKey, aData);

    // Track (combination of artist + trackName)
    const trackKey = `${stream.artistName} - ${stream.trackName}`;
    const tData = trackMap.get(trackKey) || {
      artist: stream.artistName,
      track: stream.trackName,
      totalMs: 0,
      count: 0,
      first: stream.timestamp,
      last: stream.timestamp,
    };
    tData.totalMs += stream.msPlayed;
    tData.count += 1;
    if (stream.timestamp < tData.first) tData.first = stream.timestamp;
    if (stream.timestamp > tData.last) tData.last = stream.timestamp;
    trackMap.set(trackKey, tData);

    // Month
    const mData = monthMap.get(stream.yearMonth) || {
      ms: 0,
      count: 0,
      artists: new Set<string>(),
      tracks: new Set<string>(),
    };
    mData.ms += stream.msPlayed;
    mData.count += 1;
    mData.artists.add(stream.artistName);
    mData.tracks.add(trackKey);
    monthMap.set(stream.yearMonth, mData);

    // Day of week
    dayMap[stream.dayOfWeek].ms += stream.msPlayed;
    dayMap[stream.dayOfWeek].count += 1;

    // Hour
    hourMap[stream.hour].ms += stream.msPlayed;
    hourMap[stream.hour].count += 1;
  }

  // Top Artists by Time
  const topArtistsByTime: AggregateRankItem[] = Array.from(artistMap.entries())
    .map(([name, data]) => ({
      id: name,
      name,
      totalMsPlayed: data.totalMs,
      totalHoursPlayed: +(data.totalMs / 3600000).toFixed(2),
      streamCount: data.count,
      firstPlayed: new Date(data.first).toLocaleDateString(),
      lastPlayed: new Date(data.last).toLocaleDateString(),
      percentageOfTotal: totalMsPlayed > 0 ? +((data.totalMs / totalMsPlayed) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.totalMsPlayed - a.totalMsPlayed);

  // Top Artists by Streams
  const topArtistsByStreams: AggregateRankItem[] = [...topArtistsByTime].sort((a, b) => b.streamCount - a.streamCount);

  // Top Tracks by Time
  const topTracksByTime: AggregateRankItem[] = Array.from(trackMap.entries())
    .map(([key, data]) => ({
      id: key,
      name: data.track,
      subtitle: data.artist,
      totalMsPlayed: data.totalMs,
      totalHoursPlayed: +(data.totalMs / 3600000).toFixed(2),
      streamCount: data.count,
      firstPlayed: new Date(data.first).toLocaleDateString(),
      lastPlayed: new Date(data.last).toLocaleDateString(),
      percentageOfTotal: totalMsPlayed > 0 ? +((data.totalMs / totalMsPlayed) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.totalMsPlayed - a.totalMsPlayed);

  // Top Tracks by Streams
  const topTracksByStreams: AggregateRankItem[] = [...topTracksByTime].sort((a, b) => b.streamCount - a.streamCount);

  // Monthly Activity sorted chronologically
  const monthlyActivity: MonthActivity[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([yearMonth, data]) => {
      const [y, m] = yearMonth.split('-');
      const monthIdx = parseInt(m, 10) - 1;
      const label = `${MONTH_NAMES[monthIdx] || m} ${y}`;
      return {
        yearMonth,
        label,
        msPlayed: data.ms,
        hoursPlayed: +(data.ms / 3600000).toFixed(1),
        streamCount: data.count,
        uniqueArtists: data.artists.size,
        uniqueTracks: data.tracks.size,
      };
    });

  // Day of Week Activity
  const dayOfWeekActivity: DayOfWeekActivity[] = dayMap.map((d, i) => ({
    dayIndex: i,
    dayName: DAY_NAMES[i],
    msPlayed: d.ms,
    hoursPlayed: +(d.ms / 3600000).toFixed(1),
    streamCount: d.count,
  }));

  // Hourly Activity
  const hourlyActivity: HourlyActivity[] = hourMap.map((h, i) => ({
    hour: i,
    hourLabel: `${String(i).padStart(2, '0')}h`,
    msPlayed: h.ms,
    hoursPlayed: +(h.ms / 3600000).toFixed(1),
    streamCount: h.count,
  }));

  // Peak Hour (highest msPlayed)
  let peakHour = 0;
  let maxHourMs = 0;
  hourlyActivity.forEach(h => {
    if (h.msPlayed > maxHourMs) {
      maxHourMs = h.msPlayed;
      peakHour = h.hour;
    }
  });

  // Most Active Day
  let mostActiveDay = 'Domingo';
  let maxDayMs = 0;
  dayOfWeekActivity.forEach(d => {
    if (d.msPlayed > maxDayMs) {
      maxDayMs = d.msPlayed;
      mostActiveDay = d.dayName;
    }
  });

  const uniqueArtistsCount = artistMap.size;
  const uniqueTracksCount = trackMap.size;
  const diversityRatio = streamCount > 0 ? +(uniqueTracksCount / streamCount).toFixed(3) : 0;

  const firstStreamDate = streams[0]?.dateTimeStr;
  const lastStreamDate = streams[streams.length - 1]?.dateTimeStr;

  return {
    id,
    folderName,
    displayName,
    accountType,
    hasStreamingHistory: true,
    streamCount,
    totalMsPlayed,
    totalHours,
    totalMinutes,
    streams,
    firstStreamDate,
    lastStreamDate,
    uniqueArtistsCount,
    uniqueTracksCount,
    diversityRatio,
    topArtistsByTime,
    topArtistsByStreams,
    topTracksByTime,
    topTracksByStreams,
    monthlyActivity,
    dayOfWeekActivity,
    hourlyActivity,
    peakHour,
    mostActiveDay,
    userData: optionalData.userData || null,
    playlists: optionalData.playlists || [],
    library: optionalData.library || null,
    searchQueries: optionalData.searchQueries || [],
    inferences: optionalData.inferences || [],
    wrapped: optionalData.wrapped || null,
  };
}

/**
 * Checks whether a given file belongs to an account folder (including all subdirectories)
 */
function isFileInAccountFolder(file: File, targetFolderName: string, allDiscoveredFolders: string[]): boolean {
  const rawPath = file.webkitRelativePath || file.name;
  const segments = rawPath.split(/[/\\]/);

  const targetNorm = normalizeFolderName(targetFolderName);

  // Check each path segment (excluding the last segment which is the filename itself)
  const dirSegments = segments.slice(0, -1);

  for (const seg of dirSegments) {
    const segNorm = normalizeFolderName(seg);
    if (segNorm === targetNorm) {
      return true;
    }
    // Also handle prefixes like "Spotify Kids Account Data_1" matching "Spotify Kids Account Data 1"
    if (segNorm.startsWith(targetNorm) || targetNorm.startsWith(segNorm)) {
      // Check if it's the closest match
      return true;
    }
  }

  // Fallback: if only 1 folder exists in the dataset
  if (allDiscoveredFolders.length === 1 && rawPath.endsWith('.json')) {
    return true;
  }

  return false;
}

/**
 * Parses all files uploaded via directory selector or zip archive with full subdirectory support
 */
export async function parseUploadedFiles(
  fileList: File[] | FileList
): Promise<{ accounts: SpotifyAccount[]; indexFound: boolean; warnings: string[] }> {
  const files = Array.from(fileList);
  const warnings: string[] = [];

  // Helper to read file as text
  const readText = async (file: File): Promise<string> => {
    return await file.text();
  };

  // Helper to read and parse JSON safely
  const readJson = async (file: File): Promise<any | null> => {
    try {
      const text = await readText(file);
      return JSON.parse(text);
    } catch (e) {
      console.warn(`Erro ao ler JSON ${file.name}:`, e);
      return null;
    }
  };

  // 1. Discover all root and secondary directory names present in the file paths
  const discoveredFoldersSet = new Set<string>();
  for (const file of files) {
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split(/[/\\]/);
    if (parts.length > 1) {
      // Collect all folder parts (excluding the filename)
      for (let p = 0; p < parts.length - 1; p++) {
        const seg = parts[p].trim();
        if (seg && !seg.endsWith('.json') && !seg.endsWith('.txt') && !seg.endsWith('.pdf')) {
          // If it looks like a Spotify account folder or root container
          if (/Spotify/i.test(seg) || /Account/i.test(seg) || /Kids/i.test(seg)) {
            discoveredFoldersSet.add(seg);
          }
        }
      }
    }
  }

  const discoveredFolders = Array.from(discoveredFoldersSet);

  // 2. Locate index.txt (could be in root or subfolder)
  const indexFile = files.find(f => {
    const name = f.name.toLowerCase();
    return name === 'index.txt';
  });

  let mappedAccounts: Array<{ folderName: string; displayName: string; accountType: 'primary' | 'kids' | 'secondary' }> = [];

  if (indexFile) {
    try {
      const indexText = await readText(indexFile);
      mappedAccounts = parseIndexFile(indexText, discoveredFolders);
    } catch (e) {
      warnings.push('Falha ao processar index.txt. Usando pastas detectadas automaticamente.');
    }
  }

  // 3. If index.txt was not found or yielded no accounts, dynamically use discovered folders
  if (mappedAccounts.length === 0) {
    if (discoveredFolders.length > 0) {
      mappedAccounts = discoveredFolders.map((folderName, index) => {
        const isYou = /you|principal|main/i.test(folderName) || folderName.toLowerCase() === 'spotify account data';
        const isKids = /kids/i.test(folderName);
        let displayName = folderName;
        let accountType: 'primary' | 'kids' | 'secondary' = 'secondary';

        if (isYou) {
          displayName = 'Usuário Principal';
          accountType = 'primary';
        } else if (isKids) {
          accountType = 'kids';
          const match = folderName.match(/Spotify\s+Kids\s+Account\s+Data(?:_\d+)?\s*(?:\[(.*?)\]|(.*))?$/i);
          if (match && (match[1] || match[2])) {
            displayName = (match[1] || match[2]).trim();
          } else {
            displayName = `Conta Kids ${index}`;
          }
        }
        return { folderName, displayName, accountType };
      });
    } else {
      // Single folder fallback
      mappedAccounts = [{
        folderName: 'Spotify Account Data',
        displayName: 'Usuário Principal',
        accountType: 'primary',
      }];
    }
  }

  const allFolderNames = mappedAccounts.map(a => a.folderName);

  // 4. Process each mapped account recursively
  const parsedAccounts: SpotifyAccount[] = [];

  for (let i = 0; i < mappedAccounts.length; i++) {
    const accDef = mappedAccounts[i];
    const accId = `acc_${i}_${normalizeFolderName(accDef.folderName)}`;

    // Filter all files belonging to this account folder (including nested subdirectories!)
    const accountFiles = files.filter(f => isFileInAccountFolder(f, accDef.folderName, allFolderNames));

    // a) Wildcard & recursive search for Streaming History files
    // Matches StreamingHistory_music_0.json, StreamingHistory0.json, endsong_0.json, Streaming_History_Audio_*.json, etc.
    const potentialStreamFiles = accountFiles.filter(f => {
      const name = f.name.toLowerCase();
      return (
        /streaming.*history.*\.json$/i.test(name) ||
        /^endsong.*\.json$/i.test(name) ||
        /^ends_song.*\.json$/i.test(name) ||
        /^streaminghistory.*\.json$/i.test(name) ||
        /audio_.*\.json$/i.test(name) ||
        /music_.*\.json$/i.test(name)
      );
    });

    let rawStreamsList: any[] = [];

    // Parse detected stream files
    for (const sFile of potentialStreamFiles) {
      const json = await readJson(sFile);
      if (Array.isArray(json)) {
        rawStreamsList = rawStreamsList.concat(json);
      }
    }

    // Fallback: If no streams were found by filename, inspect all other JSON files in this account
    if (rawStreamsList.length === 0) {
      const otherJsonFiles = accountFiles.filter(
        f => f.name.toLowerCase().endsWith('.json') && !potentialStreamFiles.includes(f)
      );

      for (const oFile of otherJsonFiles) {
        const json = await readJson(oFile);
        if (Array.isArray(json) && json.length > 0) {
          const first = json[0];
          if (
            first &&
            typeof first === 'object' &&
            (first.endTime || first.ts || first.msPlayed || first.ms_played)
          ) {
            rawStreamsList = rawStreamsList.concat(json);
          }
        }
      }
    }

    const normalizedStreams = normalizeStreams(rawStreamsList);

    // c) Parse optional rich data safely from all subdirectories
    let userData: UserData | null = null;
    const userFile = accountFiles.find(f => /userdata.*\.json$/i.test(f.name) || /user_data.*\.json$/i.test(f.name));
    if (userFile) {
      userData = await readJson(userFile);
      if (userData && userData.username && (accDef.displayName.startsWith('Conta Kids') || accDef.displayName.startsWith('Spotify'))) {
        accDef.displayName = userData.username;
      }
    }

    let playlists: PlaylistItem[] = [];
    const playlistFile = accountFiles.find(f => /playlist.*\.json$/i.test(f.name));
    if (playlistFile) {
      const pJson = await readJson(playlistFile);
      if (pJson && Array.isArray(pJson.playlists)) {
        playlists = pJson.playlists;
      } else if (Array.isArray(pJson)) {
        playlists = pJson;
      }
    }

    let library: LibraryData | null = null;
    const libraryFile = accountFiles.find(f => /yourlibrary.*\.json$/i.test(f.name) || /library.*\.json$/i.test(f.name));
    if (libraryFile) {
      library = await readJson(libraryFile);
    }

    let searchQueries: SearchQueryItem[] = [];
    const searchFile = accountFiles.find(f => /searchqueries.*\.json$/i.test(f.name) || /search_queries.*\.json$/i.test(f.name) || /search.*\.json$/i.test(f.name));
    if (searchFile) {
      const sJson = await readJson(searchFile);
      if (Array.isArray(sJson)) {
        searchQueries = sJson;
      }
    }

    let inferences: string[] = [];
    const inferencesFile = accountFiles.find(f => /inferences.*\.json$/i.test(f.name));
    if (inferencesFile) {
      const infJson = await readJson(inferencesFile);
      if (infJson && Array.isArray(infJson.inferences)) {
        inferences = infJson.inferences;
      }
    }

    let wrapped: WrappedData | null = null;
    const wrappedFile = accountFiles.find(f => /wrapped.*\.json$/i.test(f.name));
    if (wrappedFile) {
      wrapped = await readJson(wrappedFile);
    }

    // Build the aggregated account
    const account = aggregateAccountData(
      accId,
      accDef.folderName,
      accDef.displayName,
      accDef.accountType,
      normalizedStreams,
      {
        userData,
        playlists,
        library,
        searchQueries,
        inferences,
        wrapped,
      }
    );

    parsedAccounts.push(account);
  }

  return {
    accounts: parsedAccounts,
    indexFound: !!indexFile,
    warnings,
  };
}
