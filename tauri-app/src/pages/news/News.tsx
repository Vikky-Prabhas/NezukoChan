import { useEffect, useState } from "react";
import { AnilistService } from "../../services/anilist";
import { useResponsive } from "../../hooks/useResponsive";
import type { AnimeMedia } from "../../types";
import NewsDesktop from "./News.desktop";
import NewsMobile from "./News.mobile";

export interface NewsArticle {
  id: number;
  title: string;
  image: string;
  timeAgo: string;
  category: string;
  anime: AnimeMedia;
}

const TIME_LABELS = ["Just now", "2 hours ago", "5 hours ago", "Today", "Yesterday", "2 days ago", "This week"];

function getHeadline(anime: AnimeMedia): string {
  const title = anime.title.english || anime.title.romaji;

  if (anime.status === "RELEASING") {
    if (anime.nextAiringEpisode) {
      return `Episode ${anime.nextAiringEpisode.episode} of "${title}" Airs Soon`;
    }
    return `New Episodes of "${title}" Are Streaming Now`;
  }

  if (anime.status === "NOT_YET_RELEASED") {
    if (anime.startDate.year && anime.startDate.month) {
      const date = new Date(anime.startDate.year, anime.startDate.month - 1);
      const month = date.toLocaleString('default', { month: 'long' });
      return `"${title}" Premieres in ${month} ${anime.startDate.year}`;
    }
    return `"${title}" Announced for Upcoming Season`;
  }

  if (anime.status === "FINISHED") {
    if (anime.averageScore && anime.averageScore > 80) {
      return `Critically Acclaimed "${title}" Completes Its Run`;
    }
    return `Binge the Complete Season of "${title}"`;
  }

  // High trending fallback
  if ((anime.trending || 0) > 10000) {
    return `"${title}" Trends Worldwide as Fans React`;
  }

  return `Latest Updates on "${title}"`;
}

function generateNews(anime: AnimeMedia[], pageNum: number): NewsArticle[] {
  // Sort slightly to put Releasing/Upcoming first for "News" feel
  const sorted = [...anime].sort((a, b) => {
    const scoreA = (a.status === "RELEASING" ? 2 : 0) + (a.status === "NOT_YET_RELEASED" ? 1 : 0);
    const scoreB = (b.status === "RELEASING" ? 2 : 0) + (b.status === "NOT_YET_RELEASED" ? 1 : 0);
    return scoreB - scoreA;
  });

  return sorted.map((a, i) => ({
    id: a.id * 1000 + pageNum * 100 + i,
    title: getHeadline(a),
    image: a.bannerImage || a.coverImage.extraLarge,
    timeAgo: TIME_LABELS[i % TIME_LABELS.length],
    anime: a,
    category: a.status === "RELEASING" ? "AIRING NOW" : a.status === "NOT_YET_RELEASED" ? "UPCOMING" : "TRENDING",
  }));
}

export interface NewsPageProps {
  articles: NewsArticle[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function News() {
  const { isMobile } = useResponsive();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    AnilistService.getTrending(1, 12).then(data => {
      setArticles(generateNews(data, 1));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const onLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    AnilistService.getTrending(nextPage, 12).then(data => {
      if (data.length === 0) { setHasMore(false); return; }
      setArticles(prev => [...prev, ...generateNews(data, nextPage)]);
    }).catch(() => setHasMore(false));
  };

  const props: NewsPageProps = { articles, isLoading, hasMore, onLoadMore };
  return isMobile ? <NewsMobile {...props} /> : <NewsDesktop {...props} />;
}
