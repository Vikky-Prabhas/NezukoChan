import { AnimeResult, UnifiedAnimeResult } from "../types";

/**
 * Normalizes anime titles by removing common suffixes like (Dub), (Sub), etc.
 * and groups them into a single UnifiedAnimeResult.
 */
/**
 * Normalizes anime titles by removing common suffixes like (Dub), (Sub), etc.
 * and groups them into a single UnifiedAnimeResult.
 */
export function normalizeAndGroupResults(results: AnimeResult[]): UnifiedAnimeResult[] {
    const grouped: UnifiedAnimeResult[] = [];

    // Helper: Calculate Levenshtein Distance for fuzzy matching
    const levenshtein = (a: string, b: string): number => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    results.forEach((res) => {
        // 1. Normalize Title
        // Remove " (Dub)", " (Sub)", " (Uncensored)" case insensitive
        // Also remove specific "Dub" suffix without parens if present at the end
        let cleanTitle = res.title
            .replace(/\s*[\(\[]Dub[\)\]]\s*/gi, "")
            .replace(/\s*[\(\[]Sub[\)\]]\s*/gi, "")
            .replace(/\s*[\(\[]Uncensored[\)\]]\s*/gi, "")
            .replace(/\s*[\(\[]TV[\)\]]\s*/gi, "")
            .replace(/\s*-\s*Dub\s*$/gi, "") // Handle "Title - Dub" at end
            .trim();

        // Edge case: "One Piece Dub" -> "One Piece"
        if (cleanTitle.endsWith(" Dub")) {
            cleanTitle = cleanTitle.substring(0, cleanTitle.length - 4).trim();
        }


        // 2. Determine Language of this specific result
        const resultLanguages = res.is_multi_audio
            ? res.available_languages
            : [res.language || "Japanese"];

        // 3. Find existing group with Fuzzy Matching
        // Tolerance: 2 edits for short titles, 3 for longer ones
        let foundGroup = grouped.find(g => {
            const dist = levenshtein(g.title.toLowerCase(), cleanTitle.toLowerCase());
            const limit = cleanTitle.length > 10 ? 3 : 1; // Strict for short titles
            return dist <= limit;
        });

        if (!foundGroup) {
            foundGroup = {
                id: res.id,
                title: cleanTitle,
                image: res.image,
                languageIdMap: {},
                availableLanguages: [],
            };
            grouped.push(foundGroup);
        }

        // 4. Map Languages to ID
        resultLanguages.forEach(lang => {
            if (foundGroup) {
                // PRIORITY CHECK:
                // Anitaku IDs (clean slugs) should ALWAYS overwrite AWI IDs (paths starting with /)
                // AWI IDs should NEVER overwrite Anitaku IDs for "Japanese" or "English"
                const currentId = foundGroup.languageIdMap[lang];
                const newId = res.id;
                const isAnitaku = !newId.startsWith("/") && !newId.startsWith("http");
                const isCurrentAnitaku = currentId && !currentId.startsWith("/") && !currentId.startsWith("http");

                // If no ID exists, take it.
                // If new ID is Anitaku and current is NOT, take it (Upgrade).
                // If both are same type, overwrite (default behavior).
                // If current is Anitaku and new is NOT, KEEP current (Protect Anitaku).

                if (!currentId || (isAnitaku && !isCurrentAnitaku)) {
                    foundGroup.languageIdMap[lang] = newId;
                } else if (isAnitaku === !!isCurrentAnitaku) {
                    // Same source type? Overwrite generally ok, but maybe prefer the one that matches title matches better?
                    // For now, let's stick to "Latest wins" unless it's a "Downgrade".
                    foundGroup.languageIdMap[lang] = newId;
                }

                if (!foundGroup.availableLanguages.includes(lang)) {
                    foundGroup.availableLanguages.push(lang);
                }
            }
        });

        // 5. Intelligent ID Selection (Prefer Sub/Japanese as primary ID if available)
        if (foundGroup && resultLanguages.includes("Japanese")) {
            // Apply same Anitaku priority for the Main ID
            const currentMainId = foundGroup.id;
            const newMainId = res.id;
            const isAnitaku = !newMainId.startsWith("/") && !newMainId.startsWith("http");
            const isCurrentMainAnitaku = currentMainId && !currentMainId.startsWith("/") && !currentMainId.startsWith("http");

            if (isAnitaku || !isCurrentMainAnitaku) {
                foundGroup.id = res.id;
                foundGroup.image = res.image;
                foundGroup.title = cleanTitle;
            }
        }
    });

    return grouped;
}
