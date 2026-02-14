import { useEffect, useState } from "react";
import { AnilistService } from "../../services/anilist";
import { useResponsive } from "../../hooks/useResponsive";
import { useLibrary } from "../../hooks/useLibrary";
import type { AnimeMedia, LibraryStatus } from "../../types";
import HomeDesktop from "./Home.desktop";
import HomeMobile from "./Home.mobile";

export interface HomePageProps {
  trending: AnimeMedia[];
  popular: AnimeMedia[];
  topRated: AnimeMedia[];
  isLoading: boolean;
  error: string | null;
  onAddToLibrary: (anime: AnimeMedia, status: LibraryStatus) => void;
  getStatus: (animeId: number) => LibraryStatus | null;
}

export default function Home() {
  const { isMobile } = useResponsive();
  const { addToLibrary, getStatus } = useLibrary();
  const [trending, setTrending] = useState<AnimeMedia[]>([]);
  const [popular, setPopular] = useState<AnimeMedia[]>([]);
  const [topRated, setTopRated] = useState<AnimeMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [t, p, tr] = await Promise.all([
          AnilistService.getTrending(1, 50),
          AnilistService.getPopular(1, 36),
          AnilistService.getTopRated(1, 40),
        ]);
        setTrending(t);
        setPopular(p);
        setTopRated(tr);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const props: HomePageProps = { trending, popular, topRated, isLoading, error, onAddToLibrary: addToLibrary, getStatus };
  return isMobile ? <HomeMobile {...props} /> : <HomeDesktop {...props} />;
}
