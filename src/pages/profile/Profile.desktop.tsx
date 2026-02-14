import { Eye, Bookmark, CheckCircle, FolderOpen, History, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AnimeCard from "../../components/ui/AnimeCard";
import CollectionCard from "../../components/ui/CollectionCard";
import { cn } from "../../lib/utils";
import type { ProfilePageProps } from "./Profile";
import type { LibraryStatus } from "../../types";

const TABS: { id: LibraryStatus | "collections" | "history"; label: string; icon: typeof Eye }[] = [
  { id: "watching", label: "Watching", icon: Eye },
  { id: "toWatch", label: "To Watch", icon: Bookmark },
  { id: "watched", label: "Watched", icon: CheckCircle },
  { id: "history", label: "History", icon: History },
  { id: "collections", label: "Collections", icon: FolderOpen },
];

export default function ProfileDesktop({ activeTab, setActiveTab, entries, collections, history, counts }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-black pt-20 pb-16">
      <div className="max-w-[1920px] mx-auto px-12">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-12 pt-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-black border border-white/10 flex items-center justify-center text-3xl font-serif font-bold text-white/50 shrink-0 uppercase shadow-2xl">
            NC
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">NezukoChan User</h1>
            <div className="flex gap-6">
              <Stat label="Anime" value={counts.watching + counts.toWatch + counts.watched} />
              <Stat label="Collections" value={counts.collections} />
              <Stat label="Episodes" value={counts.history} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-white/5 mb-10">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all duration-300 border-b-2 -mb-px hover:bg-white/[0.02]",
                activeTab === tab.id
                  ? "text-white border-white"
                  : "text-white/40 border-transparent hover:text-white/70",
              )}
            >
              <tab.icon className="w-4 h-4 opacity-70" />
              {tab.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md ml-1.5",
                activeTab === tab.id ? "bg-white text-black" : "bg-white/10 text-white/50",
              )}>
                {counts[tab.id as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "collections" ? (
          collections.length === 0 ? (
            <EmptyState text="No collections yet. Head to a show and add it to a collection!" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collections.map(c => <CollectionCard key={c.id} collection={c} />)}
            </div>
          )
        ) : activeTab === "history" ? (
          history.length === 0 ? (
            <EmptyState text="No watch history yet. Start watching something!" />
          ) : (
            <div className="space-y-4">
              {history.map((entry, i) => (
                <Link
                  key={`${entry.animeId}-${entry.episodeId}-${i}`} // Use index fallback for key uniqueness
                  to={`/watch/${entry.animeId}?ep=${entry.episodeId}`}
                  className="group flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-5 h-5 text-white/50 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{entry.animeTitle || `Anime #${entry.animeId}`}</h4>
                    <p className="text-white/40 text-xs mt-0.5">Episode {entry.episodeNumber} · Watched {new Date(entry.watchedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-full">Resume</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : entries.length === 0 ? (
          <EmptyState text={`Your ${activeTab === "toWatch" ? "To Watch" : activeTab} list is empty. Start browsing anime!`} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-x-5 gap-y-8">
            {entries.map(e => <AnimeCard key={e.animeId} anime={e.anime} size="md" />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-black text-white">{value}</span>
      <span className="text-xs text-white/40 font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
      <p className="text-white/30 text-sm max-w-sm text-center font-medium">{text}</p>
    </div>
  );
}
