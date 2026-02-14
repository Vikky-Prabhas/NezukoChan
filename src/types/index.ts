// ============================================================
// Nezuko — Shared Type Definitions
// ============================================================

export interface AnimeTitleData {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AnimeCoverImage {
  extraLarge: string;
  large: string;
  medium: string;
}

export interface AnimeDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface AnimeTrailer {
  id: string;
  site: string;
}

export interface AnimeCharacterEdge {
  role: string;
  node: {
    id: number;
    name: { full: string; native: string | null };
    image: { large: string; medium: string };
  };
}

export interface AnimeRelationEdge {
  relationType: string;
  node: {
    id: number;
    title: AnimeTitleData;
    coverImage: { extraLarge: string; large: string };
    format: string | null;
    status: string | null;
    episodes: number | null;
    startDate: AnimeDate;
  };
}

export interface AnimeStaffEdge {
  role: string;
  node: {
    id: number;
    name: { full: string };
    image: { large: string };
  };
}

export interface AnimeReview {
  id: number;
  summary: string;
  score: number;
  body: string;
  user: { name: string; avatar: { medium: string } };
}

export interface AnimeMedia {
  id: number;
  title: AnimeTitleData;
  coverImage: AnimeCoverImage;
  bannerImage: string | null;
  description: string | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  trending: number | null;
  status: string | null;
  format: string | null;
  genres: string[];
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: AnimeDate;
  endDate: AnimeDate;
  studios: { nodes: { name: string; isAnimationStudio: boolean }[] };
  trailer: AnimeTrailer | null;
  source: string | null;
  streamingEpisodes?: {
    title: string;
    thumbnail: string;
    url: string;
    site: string;
  }[];
  // Detail-only (optional)
  characters?: { edges: AnimeCharacterEdge[] };
  relations?: { edges: AnimeRelationEdge[] };
  staff?: { edges: AnimeStaffEdge[] };
  reviews?: { nodes: AnimeReview[] };
  nextAiringEpisode?: {
    episode: number;
    timeUntilAiring: number;
    airingAt: number;
  };
}

// ─── Library ──────────────────────────────────────
export type LibraryStatus = "watching" | "toWatch" | "watched";

export interface LibraryEntry {
  animeId: number;
  status: LibraryStatus;
  addedAt: number;
  anime: AnimeMedia;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  animeIds: number[];
  animeMap: Record<number, AnimeMedia>;
  coverImages: string[];
  createdAt: number;
}

// ─── Watch History ────────────────────────────────
export interface WatchHistoryEntry {
  animeId: number;
  animeTitle: string;
  episodeId: string;
  episodeNumber: number;
  watchedAt: number;
}

// ─── Catalog Filters ──────────────────────────────
export interface CatalogFilters {
  search?: string;
  year?: number;
  season?: string;
  genres?: string[];
  format?: string;
  status?: string;
  sort?: string;
}

// ─── Constants ────────────────────────────────────
export const SORT_OPTIONS = [
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "POPULARITY_DESC", label: "Popular" },
  { value: "SCORE_DESC", label: "Score" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "START_DATE", label: "Oldest" },
  { value: "TITLE_ROMAJI", label: "Title" },
] as const;

export const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;

export const FORMATS = [
  { value: "TV", label: "TV Show" },
  { value: "MOVIE", label: "Movie" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Special" },
  { value: "MUSIC", label: "Music" },
] as const;

export const AIRING_STATUSES = [
  { value: "RELEASING", label: "Airing" },
  { value: "FINISHED", label: "Finished" },
  { value: "NOT_YET_RELEASED", label: "Upcoming" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const ALL_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
  "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological",
  "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
] as const;

export interface Episode {
  id: string;
  number: number;
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface SubtitleTrack {
  label: string;
  file: string;
  kind: string;
}

export interface AudioTrack {
  name: string;
  language: string;
  default: boolean;
}

export interface VideoSource {
  url: string;
  quality: string;
  is_m3u8: boolean;
  subtitles?: SubtitleTrack[];
  audio_tracks?: AudioTrack[];
  provider: string; // "Diamond" | "Gold" | "Silver"
  provider_id: string; // "allanime" | "gogo" | "hianime"
}

export interface AnimeResult {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate?: string; // Repurposed or remove if unused, backend sends release_date
  release_date?: string;
  // Language Architecture Fields
  language?: string;
  is_multi_audio: boolean;
  available_languages: string[];
  provider: string; // "allanime" | "anitaku" | "awi"

  // Episode count for sorting (AllAnime provides this)
  episode_count?: number;

  regionalAvailable?: boolean; // Computed or extra
  regionalLanguages?: string[];
}

export type WatchContext = "global" | "regional";
export type ActiveProvider = "anitaku" | "allanime" | "hianime";

export interface LanguageVariant {
  name: string; // "Japanese", "English", "Hindi"
  id: string;   // Provider ID
  type: "sub" | "dub" | "multi"; // Helper for UI icons
}

// Deprecated: UnifiedAnimeResult is replaced by separate contexts
// Keeping for now if needed for transition, but strictly typed
export interface UnifiedAnimeResult {
  id: string;
  title: string;
  image: string;
  languageIdMap: Record<string, string>;
  availableLanguages: string[];
}

export interface ProviderMappings {
  anilist_id: number;
  mal_id?: number;
  anidb_id?: number;
  allanime_id?: string;
  gogoanime_id?: string;
  zoro_id?: string;
  episode_count?: number;
  titles?: Record<string, string>;
  overviews?: Record<string, string>;
  images?: Record<string, string>;
}
