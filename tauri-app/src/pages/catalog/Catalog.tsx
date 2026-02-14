import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnilistService } from "../../services/anilist";
import { useResponsive } from "../../hooks/useResponsive";
import { useDebounce } from "../../hooks/useDebounce";
import type { AnimeMedia, CatalogFilters } from "../../types";
import CatalogDesktop from "./Catalog.desktop";
import CatalogMobile from "./Catalog.mobile";

export interface CatalogPageProps {
  results: AnimeMedia[];
  filters: CatalogFilters;
  setFilters: (f: CatalogFilters) => void;
  isLoading: boolean;
  hasNext: boolean;
  loadMore: () => void;
  sortBy: string;
  setSortBy: (s: string) => void;
}

export default function Catalog() {
  const { isMobile } = useResponsive();
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>(() => {
    const genre = searchParams.get("genre");
    return {
      search: searchParams.get("search") || undefined,
      sort: searchParams.get("sort") || "TRENDING_DESC",
      genres: genre ? [genre] : undefined,
    };
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);

  const debouncedFilters = useDebounce(filters, 350);

  const fetchData = useCallback(async (p: number, append = false) => {
    setIsLoading(true);
    try {
      const data = await AnilistService.searchAnime(debouncedFilters, p, 24);
      setResults(prev => append ? [...prev, ...data.media] : data.media);
      setHasNext(data.hasNext);
    } catch (err) {
      console.error("Catalog fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters]);

  // Reset and fetch on filter change
  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [fetchData]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchData(next, true);
  };

  const sortBy = filters.sort || "TRENDING_DESC";
  const setSortBy = (s: string) => setFilters({ ...filters, sort: s });

  const props: CatalogPageProps = { results, filters, setFilters, isLoading, hasNext, loadMore, sortBy, setSortBy };
  return isMobile ? <CatalogMobile {...props} /> : <CatalogDesktop {...props} />;
}
