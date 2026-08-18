/**
 * Automatic remote loader for bundled dataset in /spotifydata
 */

import { SpotifyAccount, NormalizedStream, UserData, PlaylistItem, LibraryData, SearchQueryItem } from '../types/spotify';
import { parseIndexFile, normalizeStreams, aggregateAccountData } from './parser';

/**
 * Fetch a JSON file safely from public path
 */
async function fetchJsonSafe(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch a text file safely from public path
 */
async function fetchTextSafe(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Loads all real accounts and streaming history directly from public/spotifydata
 */
export async function loadBundledSpotifyData(): Promise<SpotifyAccount[]> {
  // Base path relative to app root
  const basePath = './spotifydata';

  // 1. Fetch index.txt
  const indexText = await fetchTextSafe(`${basePath}/index.txt`);

  const knownFolders = [
    'Spotify Account Data',
    'Spotify Kids Account Data_1',
    'Spotify Kids Account Data_2',
    'Spotify Kids Account Data_3',
  ];

  let mappedAccounts: Array<{ folderName: string; displayName: string; accountType: 'primary' | 'kids' | 'secondary' }> = [];

  if (indexText) {
    mappedAccounts = parseIndexFile(indexText, knownFolders);
  } else {
    mappedAccounts = [
      { folderName: 'Spotify Account Data', displayName: 'Usuário Principal', accountType: 'primary' },
      { folderName: 'Spotify Kids Account Data_1', displayName: 'Arthur B Soethe', accountType: 'kids' },
      { folderName: 'Spotify Kids Account Data_2', displayName: 'Arthur B. Soethe', accountType: 'kids' },
      { folderName: 'Spotify Kids Account Data_3', displayName: 'Alice B Soethe', accountType: 'kids' },
    ];
  }

  const accounts: SpotifyAccount[] = [];

  for (let i = 0; i < mappedAccounts.length; i++) {
    const accDef = mappedAccounts[i];
    const accId = `acc_bundled_${i}_${accDef.folderName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const folderUrl = `${basePath}/${encodeURIComponent(accDef.folderName)}`;

    // Potential streaming files in each account
    const streamFileNames = [
      'StreamingHistory_music_0.json',
      'StreamingHistory_music_1.json',
      'StreamingHistory_music_2.json',
      'StreamingHistory_podcast_0.json',
      'StreamingHistory0.json',
      'StreamingHistory1.json',
      'endsong_0.json',
      'endsong_1.json',
      'ends_song_0.json',
    ];

    let rawStreams: any[] = [];

    // Fetch streaming files concurrently
    const streamPromises = streamFileNames.map(name => fetchJsonSafe(`${folderUrl}/${name}`));
    const streamResults = await Promise.all(streamPromises);

    for (const json of streamResults) {
      if (Array.isArray(json)) {
        rawStreams = rawStreams.concat(json);
      }
    }

    const normalizedStreams: NormalizedStream[] = normalizeStreams(rawStreams);

    // Fetch optional rich data
    const [userAttr, kidsAcc, userDataFile, playlist1, playlistFile, yourLib, searchQ, inferencesJson, wrappedJson] = await Promise.all([
      fetchJsonSafe(`${folderUrl}/UserAttributes.json`),
      fetchJsonSafe(`${folderUrl}/KidsAccount.json`),
      fetchJsonSafe(`${folderUrl}/Userdata.json`),
      fetchJsonSafe(`${folderUrl}/Playlist1.json`),
      fetchJsonSafe(`${folderUrl}/Playlist.json`),
      fetchJsonSafe(`${folderUrl}/YourLibrary.json`),
      fetchJsonSafe(`${folderUrl}/SearchQueries.json`),
      fetchJsonSafe(`${folderUrl}/Inferences.json`),
      fetchJsonSafe(`${folderUrl}/Wrapped2025.json`),
    ]);

    // Construct UserData
    let userData: UserData | null = null;
    if (userAttr || userDataFile || kidsAcc) {
      userData = {
        ...(userDataFile || {}),
        ...(userAttr || {}),
      };
      if (kidsAcc) {
        if (kidsAcc.name) accDef.displayName = kidsAcc.name;
        if (kidsAcc.account_created && !userData.creationTime) {
          userData.creationTime = kidsAcc.account_created.slice(0, 10);
        }
      }
    }

    // Construct Playlists
    let playlists: PlaylistItem[] = [];
    const rawPlaylists = playlist1 || playlistFile;
    if (rawPlaylists) {
      if (Array.isArray(rawPlaylists.playlists)) {
        playlists = rawPlaylists.playlists;
      } else if (Array.isArray(rawPlaylists)) {
        playlists = rawPlaylists;
      }
    }

    // Construct Library
    let library: LibraryData | null = yourLib || null;

    // Construct Search Queries
    let searchQueries: SearchQueryItem[] = Array.isArray(searchQ) ? searchQ : [];

    // Inferences
    let inferences: string[] = [];
    if (inferencesJson && Array.isArray(inferencesJson.inferences)) {
      inferences = inferencesJson.inferences;
    }

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
        wrapped: wrappedJson || null,
      }
    );

    accounts.push(account);
  }

  return accounts;
}
