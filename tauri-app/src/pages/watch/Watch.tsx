import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { AnilistService } from "../../services/anilist";
import { useResponsive } from "../../hooks/useResponsive";
import { useLibrary } from "../../hooks/useLibrary";
import { useAnimeEpisodes } from "../../hooks/useProvider";
import type { AnimeMedia, Episode } from "../../types";
import WatchDesktop from "./Watch.desktop";
import WatchMobile from "./Watch.mobile";

export interface WatchPageProps {
  anime: AnimeMedia | null;
  episodes: Episode[];
  currentEpisodeId: string | null;
  loading: boolean;
  error: string | null;
  providerStatus: string;
  onEpisodeSelect: (epId: string) => void;
  isEpisodeWatched: (epId: string) => boolean;
  // Unified Language Props
  watchContext: "global" | "regional";
  variants: import("../../types").LanguageVariant[];
  selectedVariant: import("../../types").LanguageVariant | null;
  setVariant: (id: string) => void;
  regionalAvailable: boolean;
  regionalLanguages: string[];
  verificationStatus: string | null;
  // Audio Mode (Sub/Dub toggle)
  audioMode: "sub" | "dub";
  setAudioMode: (mode: "sub" | "dub") => void;
}

export default function Watch() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const epParam = searchParams.get("ep");
  const contextParam = searchParams.get("context") as "global" | "regional" | null;
  const watchContext = contextParam === "regional" ? "regional" : "global";
  const navigate = useNavigate();
  const initializedRef = useRef(false);

  const { isMobile } = useResponsive();
  const { isEpisodeWatched: isWatched, markEpisodeWatched } = useLibrary();

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [loadingAnime, setLoadingAnime] = useState(true);
  const [animeError, setAnimeError] = useState<string | null>(null);

  // Hook now accepts context
  const {
    episodes,
    loading: epLoading,
    error: epError,
    providerStatus,
    variants,
    selectedVariant,
    changeVariant,
    audioMode,
    changeAudioMode,
    regionalAvailable,
    regionalLanguages,
    verificationStatus
  } = useAnimeEpisodes(anime, watchContext);

  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  // 1. Initial Load: Fetch Anime Info
  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoadingAnime(true);
    setAnimeError(null);

    AnilistService.getAnimeById(id)
      .then((data: import("../../types").AnimeMedia | null) => {
        if (mounted) {
          setAnime(data);
          setLoadingAnime(false);
        }
      })
      .catch((err: Error) => {
        if (mounted) {
          console.error("Failed to fetch anime:", err);
          setAnimeError("Failed to load anime info");
          setLoadingAnime(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Ref to persist current episode number during variant switches
  const preserveEpisodeNumber = useRef<number | null>(null);

  // 2. Provider Switch: Reset episode context but preserve number
  useEffect(() => {
    if (!selectedVariant) return;

    // Capture current episode number before reset
    if (currentEpisodeId) {
      const current = episodes.find(e => e.id === currentEpisodeId);
      if (current) {
        console.log(`[Watch] Switching Variant. Preserving Episode Number: ${current.number}`);
        preserveEpisodeNumber.current = current.number;
      }
    }

    // Clear URL param
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("ep");
    navigate({ search: newParams.toString() }, { replace: true });

    setCurrentEpisodeId(null);
    initializedRef.current = false;
  }, [selectedVariant?.id ?? ""]);

  // 3. Auto-select episode when list loads (Preserving number if possible)
  useEffect(() => {
    // Only proceed if we have episodes and are NOT loading
    // Waiting for !loading ensures we don't accidentally select from the OLD list during the switch race condition
    if (episodes.length > 0 && !epLoading && !currentEpisodeId && !initializedRef.current) {
      initializedRef.current = true; // Mark handled

      // 1. Try preserved number (Variant Switch)
      if (preserveEpisodeNumber.current !== null) {
        const match = episodes.find(e => e.number === preserveEpisodeNumber.current);
        if (match) {
          console.log(`[Watch] Restoring Preserved Episode: ${match.number} (ID: ${match.id})`);
          setCurrentEpisodeId(match.id);
          preserveEpisodeNumber.current = null; // Reset
          return;
        }
      }

      // 2. Try URL Param
      if (epParam) {
        // Validation: Verify the param ID actually exists in this list (or looks plausible)
        const match = episodes.find(e => e.id === epParam);
        if (match) {
          setCurrentEpisodeId(epParam);
          return;
        }
      }

      // 3. Default to First Episode
      console.log(`[Watch] Defaulting to First Episode: ${episodes[0].id}`);
      setCurrentEpisodeId(episodes[0].id);
    }
  }, [episodes, epLoading, currentEpisodeId, epParam]);


  const handleEpisodeSelect = (episodeId: string) => {
    setCurrentEpisodeId(episodeId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("ep", episodeId);
    navigate({ search: newParams.toString() }, { replace: true });

    // Record to watch history
    if (anime) {
      const ep = episodes.find(e => e.id === episodeId);
      if (ep) {
        const title = anime.title.english || anime.title.romaji || "Unknown";
        markEpisodeWatched(anime.id, title, episodeId, ep.number);
      }
    }
  };

  const checkWatched = (epId: string) => {
    return anime ? isWatched(anime.id, epId) : false;
  };

  const status = loadingAnime || epLoading ? "loading" : animeError || epError ? "error" : providerStatus;

  const props: WatchPageProps = {
    anime,
    episodes,
    currentEpisodeId,
    loading: loadingAnime || epLoading,
    error: animeError || epError,
    providerStatus: status,
    onEpisodeSelect: handleEpisodeSelect,
    isEpisodeWatched: checkWatched,

    // Strict State
    watchContext,
    variants,
    selectedVariant,
    setVariant: changeVariant,
    regionalAvailable,
    regionalLanguages,
    verificationStatus,
    // Audio Mode
    audioMode,
    setAudioMode: changeAudioMode
  };

  return isMobile ? <WatchMobile {...props} /> : <WatchDesktop {...props} />;
}
