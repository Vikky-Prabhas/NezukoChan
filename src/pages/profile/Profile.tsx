import { useState } from "react";
import { useResponsive } from "../../hooks/useResponsive";
import { useLibrary } from "../../hooks/useLibrary";
import type { LibraryEntry, LibraryStatus, Collection, WatchHistoryEntry } from "../../types";
import ProfileDesktop from "./Profile.desktop";
import ProfileMobile from "./Profile.mobile";

export interface ProfilePageProps {
  activeTab: LibraryStatus | "collections" | "history";
  setActiveTab: (tab: LibraryStatus | "collections" | "history") => void;
  entries: LibraryEntry[];
  collections: Collection[];
  history: WatchHistoryEntry[];
  counts: { watching: number; toWatch: number; watched: number; collections: number; history: number };
}

export default function Profile() {
  const { isMobile } = useResponsive();
  const { library, collections, watchHistory, getLibraryByStatus } = useLibrary();
  const [activeTab, setActiveTab] = useState<LibraryStatus | "collections" | "history">("watching");

  const entries = activeTab === "collections" || activeTab === "history" ? [] : getLibraryByStatus(activeTab);

  // Sort history by most recent
  const history = activeTab === "history"
    ? [...watchHistory].sort((a, b) => b.watchedAt - a.watchedAt)
    : [];

  const counts = {
    watching: library.filter(e => e.status === "watching").length,
    toWatch: library.filter(e => e.status === "toWatch").length,
    watched: library.filter(e => e.status === "watched").length,
    collections: collections.length,
    history: watchHistory.length,
  };

  const props: ProfilePageProps = { activeTab, setActiveTab, entries, collections, history, counts };
  return isMobile ? <ProfileMobile {...props} /> : <ProfileDesktop {...props} />;
}
