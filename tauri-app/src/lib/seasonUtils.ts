import { AnimeMedia, AnimeRelationEdge } from "../types";

export interface AnimeSeason {
    id: number;
    title: string;
    image: string;
    year: number | null;
    format: string; // TV, MOVIE, OVA
    isCurrent: boolean;
    relation: string;
}

/**
 * Extracts related seasons/movies from Anilist relations.
 * Sorts them roughly chronologically.
 */
export function getAnimeSeasons(currentAnime: AnimeMedia): AnimeSeason[] {
    if (!currentAnime.relations?.edges) return [];

    const seasons: AnimeSeason[] = [];

    // 1. Add current anime
    seasons.push({
        id: currentAnime.id,
        title: currentAnime.title.english || currentAnime.title.romaji,
        image: currentAnime.coverImage.large,
        year: currentAnime.seasonYear || currentAnime.startDate?.year || null,
        format: currentAnime.format || "TV",
        isCurrent: true,
        relation: "CURRENT",
    });

    // 2. Process relations
    // validTypes: "PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY", "ALTERNATIVE_SETTING"
    // We might want to filter strictly if the list gets too cluttered, 
    // but for now, let's include major narrative links.
    const validTypes = new Set(["PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY", "ALTERNATIVE_SETTING"]);

    currentAnime.relations.edges.forEach((edge: AnimeRelationEdge) => {
        if (!edge.node || !validTypes.has(edge.relationType)) return;

        // Avoid duplicates if data is weird
        if (seasons.some(s => s.id === edge.node.id)) return;

        seasons.push({
            id: edge.node.id,
            title: edge.node.title.english || edge.node.title.romaji,
            image: edge.node.coverImage?.large,
            year: edge.node.startDate?.year || null,
            format: edge.node.format || "TV",
            isCurrent: false,
            relation: edge.relationType,
        });
    });

    // 3. Sort Chronologically
    seasons.sort((a, b) => {
        if (a.year !== b.year) {
            return (a.year || 9999) - (b.year || 9999);
        }
        return a.id - b.id;
    });

    // 4. Smart Labeling: Remove redundant main title prefix
    const mainTitle = currentAnime.title.english || currentAnime.title.romaji || "";

    return seasons.map(s => {
        // Simple heuristic: If season title starts with main title, strip it
        // e.g. "Demon Slayer: Kimetsu no Yaiba Entertainment District Arc" -> "Entertainment District Arc"
        let cleanTitle = s.title;
        if (mainTitle.length > 5 && s.title.startsWith(mainTitle)) {
            const stripped = s.title.slice(mainTitle.length).trim();
            // Remove common separators like ": " or "- "
            const cleaner = stripped.replace(/^[:\-\s]+/, "");
            if (cleaner.length > 2) {
                cleanTitle = cleaner;
            }
        }
        return {
            ...s,
            title: cleanTitle
        };
    });
}
