/**
 * AniList OAuth — Implicit Grant Flow
 *
 * Flow:
 *   1. Redirect user to AniList authorize URL
 *   2. User approves, AniList redirects back with #access_token=...
 *   3. We extract the token from the URL fragment
 *   4. Use the token for authenticated API calls
 */

import { fetch } from "../lib/tauri";

// ─── Configuration ────────────────────────────────
const ANILIST_CLIENT_ID = "AKLgyixSf993ATKqYwZCl6Vitfi8kEA3zbfWSLcz";
const ANILIST_AUTH_URL = "https://anilist.co/api/v2/oauth/authorize";
const ANILIST_API_URL = "https://graphql.anilist.co";

// Storage keys (separate from setup for security)
const TOKEN_KEY = "nezuko_anilist_token";

// ─── Auth URL ─────────────────────────────────────
export function getAniListAuthUrl(): string {
    return `${ANILIST_AUTH_URL}?client_id=${ANILIST_CLIENT_ID}&response_type=token`;
}

// ─── Token Management ─────────────────────────────
export interface AniListTokenData {
    access_token: string;
    token_type: string;
    expires_in: number;
    saved_at: number;
}

/**
 * Parse the URL hash fragment returned by AniList after auth.
 * Format: #access_token=...&token_type=bearer&expires_in=31536000
 */
export function extractTokenFromHash(hash: string): AniListTokenData | null {
    if (!hash || !hash.startsWith("#")) return null;

    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const token_type = params.get("token_type") || "bearer";
    const expires_in = parseInt(params.get("expires_in") || "31536000", 10);

    if (!access_token) return null;

    return {
        access_token,
        token_type,
        expires_in,
        saved_at: Date.now(),
    };
}

export function saveToken(data: AniListTokenData): void {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

export function getToken(): string | null {
    try {
        const raw = localStorage.getItem(TOKEN_KEY);
        if (!raw) return null;

        const data: AniListTokenData = JSON.parse(raw);
        // Check if token has expired
        const elapsed = (Date.now() - data.saved_at) / 1000;
        if (elapsed >= data.expires_in) {
            clearToken();
            return null;
        }
        return data.access_token;
    } catch {
        return null;
    }
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

// ─── Authenticated API Queries ────────────────────

interface AniListViewer {
    id: number;
    name: string;
    avatar: { medium: string | null };
    about: string | null;
    statistics: {
        anime: {
            count: number;
            episodesWatched: number;
            minutesWatched: number;
        };
    };
}

async function authQuery<T>(gql: string, variables: Record<string, unknown> = {}): Promise<T> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated with AniList");

    const res = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: gql, variables }),
    });

    if (!res.ok) {
        if (res.status === 401) {
            clearToken();
            throw new Error("AniList token expired. Please reconnect.");
        }
        throw new Error(`AniList API error: ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message ?? "AniList query failed");
    return json.data;
}

/**
 * Fetch the authenticated user's profile info.
 */
export async function fetchViewerProfile(): Promise<AniListViewer> {
    const data = await authQuery<{ Viewer: AniListViewer }>(`
        query {
            Viewer {
                id
                name
                avatar { medium }
                about
                statistics {
                    anime {
                        count
                        episodesWatched
                        minutesWatched
                    }
                }
            }
        }
    `);
    return data.Viewer;
}

/**
 * Fetch the user's anime list for syncing into the local library.
 */
export interface AniListMediaEntry {
    mediaId: number;
    status: string;
    score: number;
    progress: number;
    media: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { large: string };
        episodes: number | null;
        format: string;
        status: string;
    };
}

export async function fetchUserAnimeList(): Promise<AniListMediaEntry[]> {
    const viewer = await fetchViewerProfile();
    const allEntries: AniListMediaEntry[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
        const data = await authQuery<{
            MediaListCollection: {
                lists: Array<{
                    entries: AniListMediaEntry[];
                }>;
                hasNextChunk: boolean;
            };
        }>(`
            query($userId: Int, $page: Int) {
                MediaListCollection(userId: $userId, type: ANIME, chunk: $page, perChunk: 50) {
                    lists {
                        entries {
                            mediaId
                            status
                            score
                            progress
                            media {
                                id
                                title { romaji english }
                                coverImage { large }
                                episodes
                                format
                                status
                            }
                        }
                    }
                    hasNextChunk
                }
            }
        `, { userId: viewer.id, page });

        for (const list of data.MediaListCollection.lists) {
            allEntries.push(...list.entries);
        }
        hasNext = data.MediaListCollection.hasNextChunk;
        page++;
    }

    return allEntries;
}

// ─── Export Service ───────────────────────────────
export const AniListAuth = {
    getAuthUrl: getAniListAuthUrl,
    extractTokenFromHash,
    saveToken,
    getToken,
    clearToken,
    isAuthenticated,
    fetchViewerProfile,
    fetchUserAnimeList,
};
