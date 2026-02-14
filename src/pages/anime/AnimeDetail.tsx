import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AnilistService } from "../../services/anilist";
import { useResponsive } from "../../hooks/useResponsive";
import { useLibrary } from "../../hooks/useLibrary";
import type { AnimeMedia, LibraryStatus, Collection } from "../../types";
import AnimeDetailDesktop from "./AnimeDetail.desktop";
import AnimeDetailMobile from "./AnimeDetail.mobile";

export type DetailTab = "overview" | "episodes" | "relations" | "characters" | "staff" | "reviews";

export interface AnimeDetailPageProps {
  anime: AnimeMedia | null;
  isLoading: boolean;
  activeTab: DetailTab;
  setActiveTab: (t: DetailTab) => void;
  libraryStatus: LibraryStatus | null;
  onSetStatus: (status: LibraryStatus) => void;
  onRemoveStatus: () => void;
  collections: Collection[];
  onAddToCollection: (collectionId: string) => void;
}

export default function AnimeDetail() {
  const { id } = useParams();
  const { isMobile } = useResponsive();
  const { getStatus, addToLibrary, removeFromLibrary, collections, addToCollection } = useLibrary();
  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    AnilistService.getAnimeDetail(parseInt(id))
      .then(setAnime)
      .finally(() => setIsLoading(false));
  }, [id]);

  const libraryStatus = anime ? getStatus(anime.id) : null;

  const onSetStatus = (status: LibraryStatus) => {
    if (anime) addToLibrary(anime, status);
  };

  const onRemoveStatus = () => {
    if (anime) removeFromLibrary(anime.id);
  };

  const onAddToCollection = (collectionId: string) => {
    if (anime) addToCollection(collectionId, anime);
  };

  const props: AnimeDetailPageProps = { anime, isLoading, activeTab, setActiveTab, libraryStatus, onSetStatus, onRemoveStatus, collections, onAddToCollection };
  return isMobile ? <AnimeDetailMobile {...props} /> : <AnimeDetailDesktop {...props} />;
}
