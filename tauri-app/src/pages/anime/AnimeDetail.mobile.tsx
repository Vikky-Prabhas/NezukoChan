import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Plus, Share2, Star, Check, Bookmark, Eye, ListVideo, ChevronDown, Layers } from "lucide-react";
import { useAnimeEpisodes } from "../../hooks/useProvider";
import { cn } from "../../lib/utils";
import type { AnimeDetailPageProps, DetailTab } from "./AnimeDetail";

const TABS: DetailTab[] = ["overview", "episodes", "relations", "characters", "staff"];

export default function AnimeDetailMobile({ anime, isLoading, activeTab, setActiveTab, libraryStatus, onSetStatus, onRemoveStatus, collections, onAddToCollection }: AnimeDetailPageProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);

  const { episodes, loading: epLoading } = useAnimeEpisodes(anime);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!anime) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-white/30">Anime not found</p>
    </div>
  );

  const title = anime.title.english || anime.title.romaji;
  const studio = anime.studios?.nodes?.find(s => s.isAnimationStudio)?.name;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* IMMERSIVE HERO */}
      <div className="relative h-[55vh] w-full overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          <Link to="/" className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <img src={anime.coverImage.extraLarge} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {anime.format && (
              <span className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white border border-white/5">
                {anime.format}
              </span>
            )}
            {anime.status && (
              <span className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-white/5">
                {anime.status.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-serif font-black text-white leading-none tracking-tight mb-2 line-clamp-3 drop-shadow-xl">{title}</h1>

          <div className="flex items-center gap-4 text-xs font-bold text-white/60">
            <div className="flex items-center gap-1.5 text-yellow-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "?.?"}</span>
            </div>
            <span>•</span>
            <span>{anime.startDate?.year}</span>
            <span>•</span>
            <span>{anime.episodes || "?"} Eps</span>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="px-5 py-6 space-y-4">
        <Link
          to={`/watch/${anime.id}${episodes.length > 0 ? `?ep=${episodes[0].id}` : ""}`}
          className={cn(
            "w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all",
            episodes.length > 0 ? "bg-white text-black" : "bg-white/10 text-white/30"
          )}
        >
          <Play className="w-5 h-5 fill-current" />
          {epLoading ? "Loading..." : "Watch Now"}
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={cn(
                "w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 border active:scale-[0.98] transition-all",
                libraryStatus ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10"
              )}
            >
              {libraryStatus === "watching" && <Eye className="w-4 h-4" />}
              {libraryStatus === "toWatch" && <Bookmark className="w-4 h-4" />}
              {libraryStatus === "watched" && <Check className="w-4 h-4" />}
              {!libraryStatus && <Plus className="w-4 h-4" />}
              {libraryStatus ? formatStatus(libraryStatus) : "Add to List"}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {/* Status Dropdown */}
            {showStatusMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
                {["watching", "toWatch", "watched"].map((status) => (
                  <button
                    key={status}
                    onClick={() => { onSetStatus(status as any); setShowStatusMenu(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 border-b border-white/5 last:border-0 capitalize"
                  >
                    {formatStatus(status)}
                  </button>
                ))}
                {libraryStatus && (
                  <button
                    onClick={() => { onRemoveStatus(); setShowStatusMenu(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-white/5"
                  >
                    Remove from List
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCollectionMenu(!showCollectionMenu)}
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 bg-white/5 text-white border border-white/10 active:scale-[0.98] transition-all"
            >
              <Layers className="w-4 h-4" />
              Collection
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {showCollectionMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCollectionMenu(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
                  {collections.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-white/30">No collections yet</p>
                  ) : collections.map(col => (
                    <button
                      key={col.id}
                      onClick={() => { onAddToCollection(col.id); setShowCollectionMenu(false); }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-white/60 active:bg-white/10 border-b border-white/5 last:border-0"
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex items-center px-5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab ? "text-white border-white" : "text-white/40 border-transparent"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 py-6 min-h-[50vh]">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-serif font-bold text-xl mb-3">Synopsis</h3>
              <div className={cn("text-white/70 text-sm leading-relaxed overflow-hidden relative", !showFullDesc && "max-h-32")}>
                <div dangerouslySetInnerHTML={{ __html: anime.description || "No description." }} />
                {!showFullDesc && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent flex items-end justify-center">
                  </div>
                )}
              </div>
              <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs font-bold text-white mt-2 uppercase tracking-wide">
                {showFullDesc ? "Show Less" : "Read More"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Studio" value={studio} />
              <InfoItem label="Status" value={anime.status ? formatStatus(anime.status) : undefined} />
              <InfoItem label="Source" value={anime.source?.replace(/_/g, " ")} />
              <InfoItem label="Season" value={anime.season} />
            </div>

            {anime.trailer?.id && (
              <div className="space-y-3">
                <h3 className="text-white font-serif font-bold text-xl">Trailer</h3>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/5">
                  <iframe
                    src={`https://www.youtube.com/embed/${anime.trailer.id}`}
                    className="w-full h-full"
                    allowFullScreen
                    title="trailer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "episodes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Episodes</h3>
              <span className="text-xs font-bold text-white/40">{episodes.length} Total</span>
            </div>

            {epLoading ? (
              <div className="py-10 text-center"><span className="text-xs text-white/30 animate-pulse">Loading Episodes...</span></div>
            ) : episodes.length > 0 ? (
              <div className="grid gap-3">
                {episodes.map(ep => (
                  <Link
                    key={ep.id}
                    to={`/watch/${anime.id}?ep=${ep.id}`}
                    className="flex gap-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl active:bg-white/10 transition-colors"
                  >
                    <div className="w-24 aspect-video rounded-lg bg-white/5 overflow-hidden shrink-0 relative">
                      {ep.image ? (
                        <img src={ep.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white/20 font-black text-lg">{ep.number}</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/80 fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1">Episode {ep.number}</h4>
                      <p className="text-sm font-bold text-white truncate text-ellipsis">{ep.title || `Episode ${ep.number}`}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-white/5 rounded-2xl">
                <ListVideo className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/40">No episodes found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "relations" && (
          <div className="grid grid-cols-2 gap-4">
            {anime.relations?.edges?.map(rel => (
              <Link to={`/anime/${rel.node.id}`} key={rel.node.id} className="block space-y-2">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 relative">
                  <img src={rel.node.coverImage.large} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[9px] font-black text-white uppercase">{rel.node.format}</div>
                </div>
                <p className="text-xs font-bold text-white line-clamp-2">{rel.node.title.english || rel.node.title.romaji}</p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "characters" && (
          <div className="grid grid-cols-3 gap-4">
            {anime.characters?.edges?.map(ch => (
              <div key={ch.node.id} className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-white/5 mb-2 border border-white/10">
                  <img src={ch.node.image.large} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-bold text-white line-clamp-1">{ch.node.name.full}</p>
                <p className="text-[10px] text-white/40">{ch.role}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "staff" && (
          <div className="grid grid-cols-3 gap-4">
            {anime.staff?.edges?.map(s => (
              <div key={s.node.id} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-white/5 mb-2 border border-white/10">
                  <img src={s.node.image.large} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-bold text-white line-clamp-1">{s.node.name.full}</p>
                <p className="text-[10px] text-white/40">{s.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-white truncate">{value}</p>
    </div>
  )
}

function formatStatus(s: string) {
  if (!s) return "";
  return s.replace(/_/g, " ").toLowerCase();
}
