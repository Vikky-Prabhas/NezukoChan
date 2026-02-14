import type { AnimeMedia, CatalogFilters } from "../types";
import { fetch } from '../lib/tauri';

const API = "https://graphql.anilist.co";

// ─── Shared fragment ─────────────────────────────
const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large medium }
  bannerImage
  description
  averageScore
  meanScore
  popularity
  trending
  status
  format
  genres
  episodes
  duration
  season
  seasonYear
  startDate { year month day }
  endDate { year month day }
  studios { nodes { name isAnimationStudio } }
  trailer { id site }
  source
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
`;

const DETAIL_EXTRA = `
  characters(perPage: 12, sort: [ROLE, FAVOURITES_DESC]) {
    edges { role node { id name { full native } image { large medium } } }
  }
  relations { edges { relationType node { id title { romaji english } coverImage { extraLarge large } format status episodes } } }
  staff(perPage: 12, sort: FAVOURITES_DESC) { edges { role node { id name { full } image { large } } } }
  reviews(perPage: 5, sort: RATING_DESC) { nodes { id summary score body user { name avatar { medium } } } }
  recommendations(perPage: 8, sort: RATING_DESC) { nodes { mediaRecommendation { ${MEDIA_FIELDS} } } }
`;

// ─── Cache & Queue State ──────────────────────────
const CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

// ─── Helpers ──────────────────────────────────────
async function processQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) return;
  activeRequests++;
  const next = requestQueue.shift();
  if (next) next();
}

async function fetchWithQueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const execute = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (e) {
        reject(e);
      } finally {
        activeRequests--;
        processQueue();
      }
    };

    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      activeRequests++;
      execute();
    } else {
      requestQueue.push(execute);
    }
  });
}

async function query<T>(gql: string, variables: Record<string, unknown> = {}, retries = 3, delay = 1000): Promise<T> {
  const cacheKey = JSON.stringify({ gql, variables });
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  return fetchWithQueue(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: gql, variables }),
        });

        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * (i + 1);
          console.warn(`Hit Rate Limit(429).Waiting ${waitTime}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status} `);
        }

        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0]?.message ?? "AniList query failed");

        // Update Cache
        CACHE.set(cacheKey, { data: json.data, timestamp: Date.now() });
        return json.data;

      } catch (err) {
        if (i === retries - 1) throw err;
        console.warn(`Anilist query failed, retrying(${i + 1}/${retries})...`, err);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error("Anilist query failed after retries");
  });
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<br\s*\/?>/g, " ").replace(/<[^>]*>/g, "");
}

// ─── Public API ───────────────────────────────────
export const AnilistService = {

  async getTrending(page = 1, perPage = 20): Promise<AnimeMedia[]> {
    const data = await query<{ Page: { media: AnimeMedia[] } }>(`
query($page: Int, $perPage: Int){ Page(page: $page, perPage: $perPage){ media(sort: TRENDING_DESC, type: ANIME, isAdult: false){${MEDIA_FIELDS} } } }
`, { page, perPage });
    return data.Page.media;
  },

  async getPopular(page = 1, perPage = 20): Promise<AnimeMedia[]> {
    const data = await query<{ Page: { media: AnimeMedia[] } }>(`
query($page: Int, $perPage: Int){ Page(page: $page, perPage: $perPage){ media(sort: POPULARITY_DESC, type: ANIME, isAdult: false){${MEDIA_FIELDS} } } }
`, { page, perPage });
    return data.Page.media;
  },

  async getTopRated(page = 1, perPage = 20): Promise<AnimeMedia[]> {
    const data = await query<{ Page: { media: AnimeMedia[] } }>(`
query($page: Int, $perPage: Int){ Page(page: $page, perPage: $perPage){ media(sort: SCORE_DESC, type: ANIME, isAdult: false){${MEDIA_FIELDS} } } }
`, { page, perPage });
    return data.Page.media;
  },

  async searchAnime(filters: CatalogFilters, page = 1, perPage = 24): Promise<{ media: AnimeMedia[]; hasNext: boolean }> {
    const vars: Record<string, unknown> = { page, perPage, type: "ANIME", isAdult: false };
    const argDefs: string[] = ["$page:Int", "$perPage:Int", "$type:MediaType", "$isAdult:Boolean"];
    const argUses: string[] = ["type:$type", "isAdult:$isAdult"];

    if (filters.search) { vars.search = filters.search; argDefs.push("$search:String"); argUses.push("search:$search"); }
    if (filters.year) { vars.seasonYear = filters.year; argDefs.push("$seasonYear:Int"); argUses.push("seasonYear:$seasonYear"); }
    if (filters.season) { vars.season = filters.season; argDefs.push("$season:MediaSeason"); argUses.push("season:$season"); }
    if (filters.format) { vars.format = filters.format; argDefs.push("$format:MediaFormat"); argUses.push("format:$format"); }
    if (filters.status) { vars.status = filters.status; argDefs.push("$status:MediaStatus"); argUses.push("status:$status"); }
    if (filters.genres?.length) { vars.genre_in = filters.genres; argDefs.push("$genre_in:[String]"); argUses.push("genre_in:$genre_in"); }
    if (filters.sort) { vars.sort = [filters.sort]; argDefs.push("$sort:[MediaSort]"); argUses.push("sort:$sort"); }
    else { vars.sort = ["TRENDING_DESC"]; argDefs.push("$sort:[MediaSort]"); argUses.push("sort:$sort"); }

    const data = await query<{ Page: { media: AnimeMedia[]; pageInfo: { hasNextPage: boolean } } }>(`
query(${argDefs.join(",")}){
  Page(page: $page, perPage: $perPage){
        pageInfo{ hasNextPage }
    media(${argUses.join(",")}){${MEDIA_FIELDS} }
  }
}
`, vars);
    return { media: data.Page.media, hasNext: data.Page.pageInfo.hasNextPage };
  },

  async getAnimeById(id: string | number): Promise<AnimeMedia | null> {
    try {
      const data = await query<{ Media: AnimeMedia }>(`
query($id: Int){ Media(id: $id, type: ANIME){${MEDIA_FIELDS} } }
`, { id: typeof id === "string" ? parseInt(id) : id });
      return data.Media;
    } catch { return null; }
  },

  async getAnimeDetail(id: number): Promise<AnimeMedia | null> {
    try {
      const data = await query<{ Media: AnimeMedia }>(`
query($id: Int){ Media(id: $id, type: ANIME){${MEDIA_FIELDS}${DETAIL_EXTRA} } }
`, { id });
      return data.Media;
    } catch { return null; }
  },

  stripHtml,
};
