import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AnimeMedia, LibraryEntry, LibraryStatus, Collection, WatchHistoryEntry } from "../types";

interface LibraryContextValue {
  library: LibraryEntry[];
  collections: Collection[];
  watchHistory: WatchHistoryEntry[];
  addToLibrary: (anime: AnimeMedia, status: LibraryStatus) => void;
  removeFromLibrary: (animeId: number) => void;
  getStatus: (animeId: number) => LibraryStatus | null;
  getLibraryByStatus: (status: LibraryStatus) => LibraryEntry[];
  createCollection: (name: string, description?: string) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (collectionId: string, anime: AnimeMedia) => void;
  removeFromCollection: (collectionId: string, animeId: number) => void;
  getCollectionAnime: (collectionId: string) => AnimeMedia[];
  markEpisodeWatched: (animeId: number, animeTitle: string, episodeId: string, episodeNumber: number) => void;
  isEpisodeWatched: (animeId: number, episodeId: string) => boolean;
  getLastWatchedEpisode: (animeId: number) => WatchHistoryEntry | null;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);

const LIB_KEY = "nezuko_library";
const COL_KEY = "nezuko_collections";
const HIST_KEY = "nezuko_watch_history";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryEntry[]>(() => loadJSON(LIB_KEY, []));
  const [collections, setCollections] = useState<Collection[]>(() => loadJSON(COL_KEY, []));
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>(() => loadJSON(HIST_KEY, []));

  // Persist
  useEffect(() => { localStorage.setItem(LIB_KEY, JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem(COL_KEY, JSON.stringify(collections)); }, [collections]);
  useEffect(() => { localStorage.setItem(HIST_KEY, JSON.stringify(watchHistory)); }, [watchHistory]);

  const addToLibrary = useCallback((anime: AnimeMedia, status: LibraryStatus) => {
    setLibrary(prev => {
      const filtered = prev.filter(e => e.animeId !== anime.id);
      return [...filtered, { animeId: anime.id, status, addedAt: Date.now(), anime }];
    });
  }, []);

  const removeFromLibrary = useCallback((animeId: number) => {
    setLibrary(prev => prev.filter(e => e.animeId !== animeId));
  }, []);

  const getStatus = useCallback((animeId: number): LibraryStatus | null => {
    return library.find(e => e.animeId === animeId)?.status ?? null;
  }, [library]);

  const getLibraryByStatus = useCallback((status: LibraryStatus): LibraryEntry[] => {
    return library.filter(e => e.status === status);
  }, [library]);

  const createCollection = useCallback((name: string, description = "") => {
    setCollections(prev => [...prev, {
      id: crypto.randomUUID(),
      name,
      description,
      animeIds: [],
      animeMap: {},
      coverImages: [],
      createdAt: Date.now(),
    }]);
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  const addToCollection = useCallback((collectionId: string, anime: AnimeMedia) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId || c.animeIds.includes(anime.id)) return c;
      return {
        ...c,
        animeIds: [...c.animeIds, anime.id],
        animeMap: { ...c.animeMap, [anime.id]: anime },
        coverImages: [...c.coverImages, anime.coverImage.large].slice(0, 4),
      };
    }));
  }, []);

  const removeFromCollection = useCallback((collectionId: string, animeId: number) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c;
      const newIds = c.animeIds.filter(id => id !== animeId);
      const newMap = { ...c.animeMap };
      delete newMap[animeId];
      // Rebuild coverImages from remaining anime
      const newCovers = newIds
        .map(id => newMap[id]?.coverImage?.large)
        .filter((img): img is string => !!img)
        .slice(0, 4);
      return { ...c, animeIds: newIds, animeMap: newMap, coverImages: newCovers };
    }));
  }, []);

  const getCollectionAnime = useCallback((collectionId: string): AnimeMedia[] => {
    const col = collections.find(c => c.id === collectionId);
    if (!col) return [];
    // Primary: use animeMap (new format), fallback to library (old format migration)
    return col.animeIds
      .map(aid => col.animeMap?.[aid] ?? library.find(e => e.animeId === aid)?.anime)
      .filter((a): a is AnimeMedia => !!a);
  }, [collections, library]);

  const markEpisodeWatched = useCallback((animeId: number, animeTitle: string, episodeId: string, episodeNumber: number) => {
    setWatchHistory(prev => {
      const exists = prev.some(e => e.animeId === animeId && e.episodeId === episodeId);
      if (exists) return prev.map(e =>
        e.animeId === animeId && e.episodeId === episodeId ? { ...e, watchedAt: Date.now() } : e
      );
      return [...prev, { animeId, animeTitle, episodeId, episodeNumber, watchedAt: Date.now() }];
    });
  }, []);

  const isEpisodeWatched = useCallback((animeId: number, episodeId: string): boolean => {
    return watchHistory.some(e => e.animeId === animeId && e.episodeId === episodeId);
  }, [watchHistory]);

  const getLastWatchedEpisode = useCallback((animeId: number): WatchHistoryEntry | null => {
    const entries = watchHistory.filter(e => e.animeId === animeId);
    if (!entries.length) return null;
    return entries.reduce((a, b) => a.watchedAt > b.watchedAt ? a : b);
  }, [watchHistory]);

  return (
    <LibraryContext.Provider value={{
      library, collections, watchHistory,
      addToLibrary, removeFromLibrary, getStatus, getLibraryByStatus,
      createCollection, deleteCollection, addToCollection, removeFromCollection,
      getCollectionAnime, markEpisodeWatched, isEpisodeWatched, getLastWatchedEpisode,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}
