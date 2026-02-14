import { Eye, Bookmark, CheckCircle, FolderOpen, History, Play } from "lucide-react";
import { Link } from "react-router-dom";
import AnimeCard from "../../components/ui/AnimeCard";
import CollectionCard from "../../components/ui/CollectionCard";
import { cn } from "../../lib/utils";
import type { ProfilePageProps } from "./Profile";
import type { LibraryStatus } from "../../types";

const TABS: { id: LibraryStatus | "collections" | "history"; icon: typeof Eye; label: string }[] = [
  { id: "watching", label: "Watching", icon: Eye },
  { id: "toWatch", label: "To Watch", icon: Bookmark },
  { id: "watched", label: "Watched", icon: CheckCircle },
  { id: "history", label: "History", icon: History },
  { id: "collections", label: "Collections", icon: FolderOpen },
];

export default function ProfileMobile({ activeTab, setActiveTab, entries, collections, history, counts }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-black pb-24 px-4" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-lg font-bold text-white/60 uppercase">NC</div>
        <div>
          <h1 className="text-xl font-bold text-white">NezukoChan User</h1>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-white/50"><strong className="text-white">{counts.watching + counts.toWatch + counts.watched}</strong> anime</span>
            <span className="text-xs text-white/50"><strong className="text-white">{counts.collections}</strong> collections</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
              activeTab === tab.id
                ? "bg-white text-black border-white"
                : "bg-white/5 text-white/40 border-white/5",
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label} {counts[tab.id as keyof typeof counts]}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "collections" ? (
        collections.length === 0 ? (
          <EmptyState text="No collections yet — create one from the Collections page!" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collections.map(c => <CollectionCard key={c.id} collection={c} />)}
          </div>
        )
      ) : activeTab === "history" ? (
        history.length === 0 ? (
          <EmptyState text="No watch history yet." />
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <Link
                key={i}
                to={`/watch/${entry.animeId}?ep=${entry.episodeId}`}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
                  <Play className="w-4 h-4 text-white fill-current" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{entry.animeTitle || `Anime #${entry.animeId}`}</h4>
                  <p className="text-[10px] text-white/40">Episode {entry.episodeNumber} · Resume Playing</p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : entries.length === 0 ? (
        <EmptyState text="Empty — browse anime to fill this up!" />
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {entries.map(e => <AnimeCard key={e.animeId} anime={e.anime} size="sm" />)}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-20 border border-dashed border-white/10 rounded-xl">
      <p className="text-white/25 text-xs font-medium">{text}</p>
    </div>
  );
}
