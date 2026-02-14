
import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "../lib/tauri";
import type { AnimeMedia, Episode, AnimeResult, LanguageVariant, WatchContext, ProviderMappings, VideoSource } from "../types";

// ===================================================================================
// NEZUKOCHAN PROVIDER HOOK (STRICT SPEC)
// --------------------------------------
// 1. No "Unified" Merging. Global (Anitaku) and Regional (AWI) are separate.
// 2. No "isDub" Guessing. We report exactly what the backend gives us.
// 3. Backend is the Single Source of Truth.
// 4. AniZip mappings used for episode count validation.
// ===================================================================================

const MAPPING_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ===================================================================================
// HELPER: Get AniZip Mappings with localStorage Cache
// ===================================================================================
async function getMappings(anilistId: number): Promise<ProviderMappings | null> {
    const cacheKey = `anizip_mapping_${anilistId}`;

    // Check cache first
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < MAPPING_CACHE_TTL) {
                console.log(`[getMappings] Cache hit for AniList ID: ${anilistId}`);
                return data as ProviderMappings;
            }
        }
    } catch (e) {
        console.warn("[getMappings] Cache read error:", e);
    }

    // Fetch from backend
    try {
        console.log(`[getMappings] Fetching mappings for AniList ID: ${anilistId}`);
        const mappings = await invoke<ProviderMappings>("get_mappings_command", { anilistId });

        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
            data: mappings,
            timestamp: Date.now()
        }));

        console.log(`[getMappings] Got mappings: episode_count=${mappings.episode_count}, mal_id=${mappings.mal_id}`);
        return mappings;
    } catch (e) {
        console.warn(`[getMappings] Failed for AniList ID ${anilistId}:`, e);
        return null;
    }
}

export function useAnimeEpisodes(anime: AnimeMedia | null, context: WatchContext = "global") {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [providerStatus, setProviderStatus] = useState("Idle");
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

    // Strict Language State
    const [variants, setVariants] = useState<LanguageVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<LanguageVariant | null>(null);

    // Audio Mode: "sub" or "dub" — controlled by user toggle
    const [audioMode, setAudioMode] = useState<"sub" | "dub">("sub");

    // Pre-cache ALL search results (sub + dub) on first load so mode switching is instant
    const cachedSearchResults = useRef<AnimeResult[]>([]);
    const cachedExpectedEps = useRef<number | null>(null);

    // Regional Availability Flag (Explicit)
    const [regionalAvailable, setRegionalAvailable] = useState(false);
    const [regionalLanguages, setRegionalLanguages] = useState<string[]>([]);

    const fetchIdRef = useRef(0);




    // ===================================================================================
    // COMMON: Fetch Episodes (Moved up for scope safety)
    // ===================================================================================
    // Store mappings to enrich episodes later
    const mappingsRef = useRef<ProviderMappings | null>(null);

    // ===================================================================================
    // COMMON: Fetch Episodes (Moved up for scope safety)
    // ===================================================================================
    const fetchEpisodes = useCallback(async (id: string, currentFetchId: number): Promise<number> => {
        console.log(`[useProvider] Fetching episodes for ID: ${id} (FetchID: ${currentFetchId})`);
        setProviderStatus("Loading episodes...");
        setLoading(true);
        try {
            const epList = await invoke<Episode[]>("get_episodes_command", { id });
            console.log(`[useProvider] Received ${epList.length} episodes for ${id}`);

            if (fetchIdRef.current !== currentFetchId) {
                console.log("[useProvider] Fetch aborted (stale)");
                return 0;
            }

            // Merge metadata if available
            const enrichedEpisodes = epList
                .filter(ep => ep.number > 0) // Filter out Episode 0
                .map(ep => {
                    const epNum = ep.number.toString();
                    const epNumPadded = epNum.padStart(2, "0"); // Try "01" if "1" fails


                    // 1. Try AniZip Mappings (Best for titles)
                    let title = mappingsRef.current?.titles?.[epNum] ||
                        mappingsRef.current?.titles?.[epNumPadded] ||
                        mappingsRef.current?.titles?.[ep.number];

                    let description = mappingsRef.current?.overviews?.[epNum] ||
                        mappingsRef.current?.overviews?.[epNumPadded] ||
                        mappingsRef.current?.overviews?.[ep.number];

                    let image = mappingsRef.current?.images?.[epNum] ||
                        mappingsRef.current?.images?.[epNumPadded] ||
                        mappingsRef.current?.images?.[ep.number];

                    // 2. Try Anilist Streaming Episodes (Best for thumbnails/images if mapped correctly)
                    // Fallback if mappings are missing
                    if ((!title || !image) && anime?.streamingEpisodes?.length) {
                        const se = anime.streamingEpisodes.find(s => {
                            // Heuristic: Try to find "Episode X" in title
                            // Normalized to handle "Episode 01" vs "Episode 1"
                            const normalizedTitle = s.title.replace(/^Episode\s+0+/, "Episode ");
                            return normalizedTitle.startsWith(`Episode ${ep.number} `) ||
                                normalizedTitle === `Episode ${ep.number}` ||
                                s.title.startsWith(`Episode ${ep.number} `) ||
                                s.title === `Episode ${ep.number}`; // Direct match
                        });

                        if (se) {
                            if (!title) {
                                // Extract verify actual title part (remove "Episode X - ")
                                // e.g. "Episode 1 - The Beginning" -> "The Beginning"
                                const t = se.title.replace(/^Episode\s+\d+(\s*-\s*)?/, "").trim();
                                if (t) title = t;
                            }
                            if (!image) image = se.thumbnail;
                        }
                    }

                    return {
                        ...ep,
                        title: title, // undefined title means UI usage logic handles fallback
                        description: description,
                        image: image
                    };
                });

            setEpisodes(enrichedEpisodes);
            setProviderStatus("Ready");
            return enrichedEpisodes.length;
        } catch (e) {
            if (fetchIdRef.current !== currentFetchId) return 0;
            console.error("Episode fetch failed", e);
            setError("Failed to load episodes");
            setProviderStatus("Error");
            return 0;
        } finally {
            if (fetchIdRef.current === currentFetchId) setLoading(false);
        }
    }, []);

    // ===================================================================================
    // 1. FETCH GLOBAL (Anitaku)
    // ===================================================================================
    const fetchGlobal = useCallback(async (currentFetchId: number) => {
        if (!anime) return;
        setProviderStatus("Searching Global Sources (AllAnime, HiAnime, Anitaku)...");

        // 0. Get AniZip mappings first (for episode count validation and titles)
        const mappings = await getMappings(anime.id);
        mappingsRef.current = mappings; // Store for title enrichment
        const expectedEps = mappings?.episode_count || anime.episodes || null;

        let searchQueries: string[] = [];

        // Prioritize titles from AniZip if available, otherwise use Anime object
        if (mappings?.titles) {
            if (mappings.titles.en) searchQueries.push(mappings.titles.en);
            if (mappings.titles.ja) searchQueries.push(mappings.titles.ja);
            // Add AniZip synonyms if useful, but prioritize Romaji from Anime object
        } else {
            if (anime.title.english) searchQueries.push(anime.title.english);
        }

        // ALWAYS add Romaji from AniList as it's often the most accurate for sources like AllAnime
        if (anime.title.romaji) searchQueries.push(anime.title.romaji);

        // Deduplicate and filter empty
        searchQueries = [...new Set(searchQueries)].filter(Boolean);
        if (searchQueries.length === 0) searchQueries.push(""); // Fallback empty query

        console.log(`[useProvider] Smart Search Queries: ${JSON.stringify(searchQueries)}`);

        let bestResults: AnimeResult[] = [];
        let foundVerifiedMatch = false;

        // SMART SEARCH LOOP
        for (const query of searchQueries) {
            if (fetchIdRef.current !== currentFetchId) return;
            if (foundVerifiedMatch) break; // Stop if we found a perfect match

            console.log(`[useProvider] Executing Query: "${query}"`);

            // Invoke Unified Search
            let allResults: AnimeResult[] = await invoke<AnimeResult[]>("search_anime_command", { query }).catch(e => {
                console.error(`Global search failed for query "${query}":`, e);
                return [];
            });

            if (fetchIdRef.current !== currentFetchId) return;

            // Filter and Validate
            const validResults = allResults.filter(r => {
                if (r.provider === "awi") return false; // Handled by fetchRegional

                // EPISODE COUNT VALIDATION (CRITICAL)
                if (expectedEps && expectedEps > 0 && r.episode_count) {
                    const diff = Math.abs(r.episode_count - expectedEps);
                    let tolerance = Math.max(1, Math.floor(expectedEps * 0.15));
                    if (expectedEps <= 10) tolerance = 1;

                    if (diff <= tolerance) return true;
                }

                // Title matching
                const resultTitle = r.title.toLowerCase().trim();
                const qTitle = query.toLowerCase().trim();

                // Exact match or contains
                if (resultTitle === qTitle || resultTitle.includes(qTitle) || qTitle.includes(resultTitle)) return true;

                // Fuzzy match
                const dist = levenshtein(resultTitle, qTitle);
                if (dist <= 4 || dist <= qTitle.length * 0.3) return true;

                return false;
            });

            if (validResults.length > 0) {
                // Sort by relevance
                validResults.sort((a, b) => {
                    const distA = levenshtein(a.title.toLowerCase(), query.toLowerCase());
                    const distB = levenshtein(b.title.toLowerCase(), query.toLowerCase());
                    return distA - distB;
                });

                // Check for verified match
                const verified = validResults.find(r => {
                    if (!expectedEps || !r.episode_count) return false;
                    return Math.abs(r.episode_count - expectedEps) <= Math.max(2, expectedEps * 0.2);
                });

                if (verified) {
                    setVerificationStatus(`Verified Match: ${verified.title} (${verified.episode_count} eps)`);
                    foundVerifiedMatch = true;
                    bestResults = validResults;
                } else if (bestResults.length === 0) {
                    bestResults = validResults;
                }
            }
        }

        if (bestResults.length === 0) {
            throw new Error("No Global sources found.");
        }

        // Pre-cache ALL results for instant Sub/Dub switching
        cachedSearchResults.current = bestResults;
        cachedExpectedEps.current = expectedEps;

        // Build variants based on current audioMode
        const newVariants = buildVariants(bestResults, audioMode, expectedEps);

        if (newVariants.length === 0) {
            throw new Error("No compatible servers found.");
        }

        setVariants(newVariants);

        // Auto-select first available and fetch
        const defaultVar = newVariants[0];
        setSelectedVariant(defaultVar);

        console.log(`[useProvider] Auto-selecting ${defaultVar.name} (${defaultVar.id})`);

        const count = await fetchEpisodes(defaultVar.id, currentFetchId);

        if (count === 0 && newVariants.length > 1) {
            // Fallback to next server if first empty
            console.warn(`[useProvider] ${defaultVar.name} empty, trying next...`);
            const nextVar = newVariants[1];
            setSelectedVariant(nextVar);
            await fetchEpisodes(nextVar.id, currentFetchId);
        }

    }, [anime, fetchEpisodes]);

    // ===================================================================================
    // 2. FETCH REGIONAL (AnimeWorldIndia)
    // ===================================================================================
    const fetchRegional = useCallback(async (currentFetchId: number) => {
        if (!anime) return;
        setProviderStatus("Searching Regional Sources (AWI)...");

        const q = anime.title.english || anime.title.romaji || "";
        const REGIONAL_LANGUAGES = ["Hindi", "Telugu", "Tamil", "Malayalam", "Kannada"];

        // Multi-Query Variant Search:
        // AWI lists language dubs as SEPARATE entries (e.g. "One Piece Hindi Dub" = 500 eps)
        // A single search for "One Piece" might only find the main 61-ep entry.
        // So we search: "One Piece", "One Piece Hindi", "One Piece Telugu", etc.
        const queries = [q, ...REGIONAL_LANGUAGES.map(lang => `${q} ${lang}`)];

        console.log(`[useProvider] AWI Multi-Query Search: ${queries.length} queries for "${q}"`);

        const allResults: AnimeResult[] = [];
        const seenIds = new Set<string>();

        // Fire all searches in parallel
        const searchPromises = queries.map(query =>
            invoke<AnimeResult[]>("search_awi_command", { query }).catch(e => {
                console.warn(`AWI Search Error for "${query}":`, e);
                return [] as AnimeResult[];
            })
        );

        const searchResults = await Promise.all(searchPromises);

        // Deduplicate by ID
        for (const results of searchResults) {
            for (const r of results) {
                if (!seenIds.has(r.id)) {
                    seenIds.add(r.id);
                    allResults.push(r);
                }
            }
        }

        console.log(`[useProvider] AWI total unique results: ${allResults.length}`);

        if (allResults.length === 0) {
            setRegionalAvailable(false);
            if (context === "regional") throw new Error("No Regional sources found.");
            return;
        }

        // Title matching: only keep results that match the anime we're looking for
        const animeTitleEn = (anime.title.english || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const animeTitleRo = (anime.title.romaji || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const titleMatched = allResults.filter(r => {
            const cleanAwiTitle = r.title
                .replace(/\[.*?\]/g, "")
                .replace(/\(.*?\)/g, "")
                .replace(/Hindi|Tamil|Telugu|Malayalam|Kannada|Dub|Multi|Audio|Season\s*\d*/gi, "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .trim();

            return (animeTitleEn && (cleanAwiTitle.includes(animeTitleEn) || animeTitleEn.includes(cleanAwiTitle))) ||
                (animeTitleRo && (cleanAwiTitle.includes(animeTitleRo) || animeTitleRo.includes(cleanAwiTitle)));
        });

        console.log(`[useProvider] AWI: ${titleMatched.length} matched title "${q}" (from ${allResults.length} total)`);
        titleMatched.forEach(r => console.log(`  → "${r.title}" (${r.available_languages?.join(", ") || "no langs"}) ID: ${r.id}`));

        // Filter valid results (with languages)
        const regionalResults = titleMatched.filter(r => r.available_languages && r.available_languages.length > 0);

        if (regionalResults.length === 0) {
            setRegionalAvailable(false);
            if (context === "regional") throw new Error("No Regional dubs found for this anime.");
            return;
        }

        setRegionalAvailable(true);
        const allLangs = new Set<string>();
        regionalResults.forEach(r => {
            if (r.available_languages) r.available_languages.forEach((l: string) => allLangs.add(l));
        });
        setRegionalLanguages(Array.from(allLangs));

        if (context === "regional") {
            // PROCESSED VARIANTS LOGIC
            // 1. We map EACH search result to a "Variant".
            // 2. This allows user to pick "One Piece (Telugu)" specifically to get the correct 300 episode/sequence.
            // 3. We also keep the "Multi Audio" one as the default fallback.

            const newVariants: LanguageVariant[] = regionalResults.map(r => {
                let name = r.title;
                let type: "sub" | "dub" | "multi" = "sub";

                // Heuristic Labeling
                if (r.is_multi_audio || r.title.toLowerCase().includes("multi")) {
                    name = "Multi Audio";
                    type = "multi";
                } else if (r.title.toLowerCase().includes("dub")) {
                    // Extract "Telugu Dub" -> "Telugu"
                    const dubMatch = r.title.match(/([a-zA-Z]+)\s+Dub/i);
                    if (dubMatch) {
                        name = dubMatch[1]; // e.g. "Hindi", "Telugu"
                    } else {
                        // Or try extracting from brackets "One Piece (Hindi)"
                        const bracketMatch = r.title.match(/\(([^)]+)\)$/);
                        if (bracketMatch) name = bracketMatch[1];
                    }
                    type = "dub";
                } else {
                    // Default / Sub
                    name = "Subbed";
                }

                // If name is still the full title, try to shorten it for the button
                if (name.length > 20) {
                    name = r.language || "Unknown";
                }

                return {
                    name: name,
                    id: r.id,
                    type: type
                };
            });

            // Priorities: Multi > specific dubs > sub
            newVariants.sort((a, b) => {
                if (a.type === "multi") return -1;
                if (b.type === "multi") return 1;
                return a.name.localeCompare(b.name);
            });

            setVariants(newVariants);

            // Auto-select "Multi Audio" if available, else first one
            const defaultVar = newVariants.find(v => v.type === "multi") || newVariants[0];
            setSelectedVariant(defaultVar);

            if (defaultVar) await fetchEpisodes(defaultVar.id, currentFetchId);
        }

    }, [anime, context, fetchEpisodes]);


    // ===================================================================================
    // COMMON: Fetch Episodes
    // ===================================================================================


    // ===================================================================================
    // EFFECT: Main orchestrator
    // ===================================================================================
    useEffect(() => {
        if (!anime) return;
        const currentFetchId = ++fetchIdRef.current;
        setLoading(true);
        setError(null);
        setProviderStatus("Initializing...");

        (async () => {
            try {
                if (context === "global") {
                    // 1. Fetch Global (Blocking)
                    await fetchGlobal(currentFetchId);

                    // 2. Check Regional Availability (Non-blocking background check)
                    // We don't await this to block UI, but we trigger it
                    fetchRegional(currentFetchId).catch(console.error);
                } else {
                    // Regional Mode
                    await fetchRegional(currentFetchId);
                }
            } catch (e) {
                if (fetchIdRef.current === currentFetchId) {
                    setError(e instanceof Error ? e.message : "Error");
                    setProviderStatus("Error");
                }
            } finally {
                if (fetchIdRef.current === currentFetchId) setLoading(false);
            }
        })();

    }, [anime?.id, context, fetchGlobal, fetchRegional]);


    // ===================================================================================
    // PUBLIC API
    // ===================================================================================
    const changeVariant = (variantId: string) => {
        const v = variants.find(v => v.id === variantId);
        if (!v) return;
        setSelectedVariant(v);
        fetchEpisodes(v.id, fetchIdRef.current);
    };

    // Audio Mode Switch: Rebuild variants from cache and re-fetch episodes
    const changeAudioMode = useCallback((mode: "sub" | "dub") => {
        if (mode === audioMode) return;
        console.log(`[useProvider] Switching audio mode: ${audioMode} → ${mode}`);
        setAudioMode(mode);

        // Rebuild variants from cached search results
        if (cachedSearchResults.current.length > 0) {
            const newVariants = buildVariants(cachedSearchResults.current, mode, cachedExpectedEps.current);
            if (newVariants.length > 0) {
                setVariants(newVariants);

                // Try to stay on the same server number
                const currentServerNum = selectedVariant?.name?.match(/Server (\d)/)?.[1];
                const sameServer = currentServerNum
                    ? newVariants.find(v => v.name.includes(`Server ${currentServerNum}`))
                    : null;

                const targetVar = sameServer || newVariants[0];
                setSelectedVariant(targetVar);
                fetchEpisodes(targetVar.id, fetchIdRef.current);
            }
        }
    }, [audioMode, selectedVariant, fetchEpisodes]);

    return {
        episodes,
        loading,
        error,
        providerStatus,
        verificationStatus,

        // Strict State
        variants,
        selectedVariant,
        changeVariant,

        // Audio Mode
        audioMode,
        changeAudioMode,

        // Regional Info
        regionalAvailable,
        regionalLanguages
    };
}

// Minimal Levenshtein implementation
function levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}

// ===================================================================================
// HELPER: Build Variants from cached results based on audio mode
// Seanime-inspired: Levenshtein + episode count combo scoring
// ===================================================================================
function findBestMatch(list: AnimeResult[], expectedEps: number | null): AnimeResult | undefined {
    if (list.length === 0) return undefined;
    // Score = levenshteinPenalty + episodeCountDiff
    // Lower is better — use spread to avoid mutating the input array
    return [...list].sort((a, b) => {
        const aEps = a.episode_count || 0;
        const bEps = b.episode_count || 0;
        let aScore = 0;
        let bScore = 0;

        if (expectedEps && expectedEps > 0) {
            aScore += Math.abs(aEps - expectedEps) * 2;
            bScore += Math.abs(bEps - expectedEps) * 2;
        } else {
            // No expected eps: prefer more episodes
            aScore -= aEps;
            bScore -= bEps;
        }

        return aScore - bScore;
    })[0];
}

function buildVariants(allResults: AnimeResult[], mode: "sub" | "dub", expectedEps: number | null): LanguageVariant[] {
    const newVariants: LanguageVariant[] = [];

    // Diamond = Server 1 (AllAnime) — supports sub/dub via mode param
    const diamonds = allResults.filter(r => r.provider === "allanime");
    const diamond = findBestMatch(diamonds, expectedEps);
    if (diamond) {
        // AllAnime: append :sub or :dub suffix for backend to use correct mode
        const allanimeId = diamond.id.replace(/:(?:sub|dub)$/, "") + ":" + mode;
        newVariants.push({ name: "Server 1", id: allanimeId, type: mode === "dub" ? "dub" : "sub" });
    }

    // Gold = Server 2 (HiAnime) — multi-audio, same ID for sub/dub
    const golds = allResults.filter(r => r.provider === "hianime");
    const gold = findBestMatch(golds, expectedEps);
    if (gold) {
        newVariants.push({ name: "Server 2", id: gold.id, type: "multi" });
    }

    // Silver = Server 3 (Anitaku) — separate entries for sub vs dub
    if (mode === "dub") {
        const silversDub = allResults.filter(r => r.provider === "anitaku" && r.title.toLowerCase().includes("(dub)"));
        const silverDub = findBestMatch(silversDub, expectedEps);
        if (silverDub) {
            newVariants.push({ name: "Server 3", id: silverDub.id, type: "dub" });
        }
    } else {
        const silversSub = allResults.filter(r => r.provider === "anitaku" && !r.title.toLowerCase().includes("(dub)"));
        const silverSub = findBestMatch(silversSub, expectedEps);
        if (silverSub) {
            newVariants.push({ name: "Server 3", id: silverSub.id, type: "sub" });
        }
    }

    return newVariants;
}

export function useStream(episodeId: string | undefined) {
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioTracks, setAudioTracks] = useState<string[]>([]);
    const [audioTrack, setAudioTrack] = useState<string | null>(null);
    const [providerId, setProviderId] = useState<string | null>(null);

    useEffect(() => {
        if (!episodeId) {
            setStreamUrl(null);
            return;
        }

        let mounted = true;
        setIsLoading(true);
        setError(null);
        setStreamUrl(null);
        setAudioTracks([]);
        setProviderId(null);

        console.log(`[useStream] Fetching stream for Episode ID: ${episodeId}`);

        invoke<VideoSource>("get_stream_command", { id: episodeId })
            .then(source => {
                if (mounted) {
                    console.log("[useStream] Stream fetched:", source);
                    setStreamUrl(source.url);
                    setProviderId(source.provider_id);

                    // Audio Tracks
                    const tracks = source.audio_tracks?.map(t => t.name) || [];
                    setAudioTracks(tracks);

                    // Default Audio Track
                    const defaultTrack = source.audio_tracks?.find(t => t.default)?.name || tracks[0] || null;
                    setAudioTrack(defaultTrack);

                    setIsLoading(false);
                }
            })
            .catch(err => {
                if (mounted) {
                    console.error("[useStream] Failed to fetch stream:", err);
                    setError(typeof err === 'string' ? err : "Failed to load stream");
                    setIsLoading(false);
                }
            });

        return () => { mounted = false; };
    }, [episodeId]);

    return {
        streamUrl,
        isLoading,
        error,
        audioTracks,
        audioTrack,
        setAudioTrack,
        providerId
    };
}
