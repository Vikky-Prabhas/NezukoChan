import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Bookmark, CheckCircle, Play, Star, Plus, Check, ListVideo, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAnimeEpisodes } from "../../hooks/useProvider";
import type { AnimeDetailPageProps, DetailTab } from "./AnimeDetail";

const TABS: DetailTab[] = ["overview", "episodes", "relations", "characters", "staff", "reviews"];

export default function AnimeDetailDesktop({ anime, isLoading, activeTab, setActiveTab, libraryStatus, onSetStatus, onRemoveStatus, collections, onAddToCollection }: AnimeDetailPageProps) {
  const [showCollections, setShowCollections] = useState(false);
  const colRef = useRef<HTMLDivElement>(null);

  // Destructure new regional flags
  const { episodes, loading: epLoading, providerStatus, regionalAvailable: _regionalAvailable, regionalLanguages: _regionalLanguages } = useAnimeEpisodes(anime);

  const RegionalButton = ({ animeId: _animeId }: { animeId: number }) => {
    // AWI key not configured yet — show disabled placeholder
    return (
      <div className="mt-8 pt-6 border-t border-white/5">
        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-3">Regional Availability</p>
        <div
          className="flex items-center gap-4 px-5 py-4 bg-white/[0.02] border border-white/5 rounded-xl opacity-40 cursor-not-allowed group hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
            <span className="text-lg">🇮🇳</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white/50 group-hover:text-white/70 transition-colors">India Server</p>
            <p className="text-[10px] text-white/20 font-mono mt-0.5">KEY_MISSING • COMING SOON</p>
          </div>
        </div>
      </div>
    );
  };

  // Close collection dropdown on outside click
  useEffect(() => {
    if (!showCollections) return;
    const handler = (e: MouseEvent) => {
      if (colRef.current && !colRef.current.contains(e.target as Node)) setShowCollections(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCollections]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        <span className="text-white/30 text-xs font-mono tracking-widest uppercase">Loading Metadata...</span>
      </div>
    </div>
  );

  if (!anime) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-white/30 font-serif text-xl italic">Anime not found</p>
    </div>
  );

  const title = anime.title.english || anime.title.romaji;
  const studio = anime.studios?.nodes?.find(s => s.isAnimationStudio)?.name ?? anime.studios?.nodes?.[0]?.name;

  return (
    <div className="min-h-screen bg-black selection:bg-white/20">
      {/* MAGNIFICENT HERO */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        {/* Background Image with Gradient Mesh Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={anime.bannerImage || anime.coverImage.extraLarge} alt="" className="w-full h-full object-cover opacity-60 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000]/80 via-transparent to-transparent" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-12 pt-24 px-12 max-w-[1920px] mx-auto w-full">
          <div className="flex items-end gap-12">
            {/* Floating Cover Card */}
            <div className="relative shrink-0 group">
              <div className="absolute inset-0 bg-white/10 blur-2xl rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
              <img
                src={anime.coverImage.extraLarge}
                alt={title}
                className="w-60 aspect-[2/3] rounded-xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative z-10"
              />
            </div>

            {/* Typography & Actions */}
            <div className="flex-1 pb-4 space-y-6">
              {/* Tags / Season */}
              <div className="flex items-center gap-4">
                {anime.format && (
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                    {anime.format}
                  </span>
                )}
                {/* Season Selector Removed as requested */}
                {anime.status && (
                  <span className={cn(
                    "text-xs font-bold tracking-wide uppercase",
                    anime.status === "RELEASING" ? "text-emerald-400" : "text-white/40"
                  )}>
                    {formatStatus(anime.status)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl font-serif font-black text-white leading-none tracking-tight drop-shadow-2xl line-clamp-2 max-w-5xl">
                {title}
              </h1>

              {/* Meta Stats Row */}
              <div className="flex items-center gap-8 py-2">
                {anime.averageScore && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-xl font-bold text-white">{(anime.averageScore / 10).toFixed(1)}</span>
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Score</span>
                  </div>
                )}
                <div className="w-px h-8 bg-white/10" />
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-sm font-medium">{anime.episodes || "?"} Episodes</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-white/60 text-sm font-medium">{anime.duration || "?"} mins</span>
                  {startDateYear(anime) && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-white/60 text-sm font-medium">{startDateYear(anime)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                {anime.status === "NOT_YET_RELEASED" ? (
                  <button disabled className="px-8 py-4 bg-white/5 border border-white/5 rounded-xl text-white/40 font-bold uppercase tracking-widest text-sm cursor-not-allowed flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    Coming Soon
                  </button>
                ) : (
                  <Link
                    to={`/watch/${anime.id}${episodes.length > 0 ? `?ep=${episodes[0].id}` : ""}`}
                    className={cn(
                      "px-8 py-3.5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]",
                      epLoading && "bg-white/50 cursor-wait"
                    )}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {epLoading ? "Connect..." : "Watch Now"}
                  </Link>
                )}

                {/* Library Status as a Single Dropdown/Cycle Button or Row */}
                <div className="h-12 flex bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/10 p-1.5 gap-1">
                  {([
                    { status: "watching" as const, label: "Watching", icon: Eye },
                    { status: "toWatch" as const, label: "To Watch", icon: Bookmark },
                    { status: "watched" as const, label: "Watched", icon: CheckCircle },
                  ]).map(btn => (
                    <button
                      key={btn.status}
                      onClick={() => libraryStatus === btn.status ? onRemoveStatus() : onSetStatus(btn.status)}
                      className={cn(
                        "px-3 h-full rounded-lg flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                        libraryStatus === btn.status
                          ? "bg-white text-black shadow-lg"
                          : "hover:bg-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      <btn.icon className="w-3.5 h-3.5" />
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Collection Button */}
                <div className="relative" ref={colRef}>
                  <button
                    onClick={() => setShowCollections(!showCollections)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                  {/* Collection Dropdown - Keep logic same, just style update */}
                  {showCollections && (
                    <div className="absolute bottom-full left-0 mb-3 z-30 bg-[#111] border border-white/10 rounded-xl py-2 min-w-[240px] shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200">
                      <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Collections</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                        {collections.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-xs text-white/30 mb-2">No collections</p>
                            <Link to="/collections" className="text-xs font-bold text-white hover:underline">Create New</Link>
                          </div>
                        ) : collections.map(c => {
                          const isIn = anime ? c.animeIds.includes(anime.id) : false;
                          return (
                            <button
                              key={c.id}
                              onClick={() => !isIn && onAddToCollection(c.id)}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all",
                                isIn ? "bg-white/5 text-white/30 cursor-default" : "hover:bg-white/10 text-white/70 hover:text-white"
                              )}
                            >
                              <span className="truncate max-w-[150px]">{c.name}</span>
                              {isIn && <Check className="w-3 h-3" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY CONTENT - MAGAZINE LAYOUT */}
      <div className="max-w-[1920px] mx-auto px-12 grid grid-cols-12 gap-16 py-12">
        {/* LEFT COLUMN - STATS & INFO (3/12) */}
        <div className="col-span-3 space-y-10">
          {/* Studio Card */}
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-6">Production</h3>
            {studio && (
              <div className="mb-6">
                <span className="text-white font-serif text-2xl font-bold block">{studio}</span>
                <span className="text-white/40 text-xs mt-1 block">Animation Studio</span>
              </div>
            )}
            <div className="space-y-4">
              <DetailItem label="Source" value={anime.source?.replace(/_/g, " ")} />
              <DetailItem label="Format" value={anime.format} />
              <DetailItem label="Season" value={anime.season ? `${anime.season} ${anime.seasonYear || ""}` : null} />
              <DetailItem label="Status" value={anime.status ? formatStatus(anime.status) : null} />
            </div>
          </div>

          {/* Genres Tags */}
          <div>
            <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-4">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {anime.genres?.map(g => (
                <span key={g} className="px-3 py-1.5 rounded-md bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-default border border-transparent hover:border-white/5">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Regional Button Placement */}
          {episodes.length > 0 && providerStatus !== "Finding Stream..." && (
            <RegionalButton animeId={anime.id} />
          )}
        </div>

        {/* RIGHT COLUMN - TABS & CONTENT (9/12) */}
        <div className="col-span-9">
          {/* Tab Navigation */}
          <div className="flex items-center gap-8 border-b border-white/5 mb-10">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                  activeTab === tab ? "text-white" : "text-white/30 hover:text-white/60"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_white]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Rendering */}
          <div className="min-h-[500px] animate-in slide-in-from-bottom-4 fade-in duration-300">
            {activeTab === "overview" && (
              <div className="space-y-12">
                {/* Synopsis */}
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-2xl font-serif font-bold text-white mb-6">Synopsis</h3>
                  <div
                    className="text-white/70 leading-loose text-lg font-light"
                    dangerouslySetInnerHTML={{ __html: anime.description || "No description available." }}
                  />
                </div>

                {/* Trailer */}
                {anime.trailer?.id && anime.trailer?.site === "youtube" && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                    <iframe
                      src={`https://www.youtube.com/embed/${anime.trailer.id}`}
                      className="w-full h-full"
                      allowFullScreen
                      title="Trailer"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "episodes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold text-white">Season 1</h3>
                  {epLoading && <span className="text-xs font-mono text-white/50 animate-pulse">SYNCING STREAMS...</span>}
                </div>

                {episodes.length > 0 ? (
                  <div className="grid grid-cols-5 gap-4">
                    {episodes.map(ep => (
                      <Link
                        key={ep.id}
                        to={`/watch/${anime.id}?ep=${ep.id}`}
                        className="group relative aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:shadow-2xl"
                      >
                        {ep.image ? (
                          <img src={ep.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-black text-white/10 group-hover:text-white/20 transition-colors">{ep.number}</span>
                          </div>
                        )}

                        {/* Overlay Info */}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/60 group-hover:text-amber-400 uppercase tracking-wider">EP {ep.number}</span>
                            <Play className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs font-bold text-white line-clamp-1 mt-0.5">{ep.title || `Episode ${ep.number}`}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
                    <ListVideo className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 font-serif text-lg">No episodes indexed yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "relations" && (
              <div className="grid grid-cols-5 gap-6">
                {anime.relations?.edges?.map(rel => (
                  <Link to={`/anime/${rel.node.id}`} key={rel.node.id} className="group space-y-3">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 relative">
                      <img src={rel.node.coverImage.large} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded-md border border-white/10">
                        <span className="text-[9px] font-black text-white uppercase">{rel.node.format}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-1">{rel.relationType.replace(/_/g, " ")}</p>
                      <h4 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">{rel.node.title.english || rel.node.title.romaji}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === "characters" && (
              <div className="grid grid-cols-6 gap-6">
                {anime.characters?.edges?.map(ch => (
                  <div key={ch.node.id} className="group text-center">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-white/5 group-hover:border-white/20 transition-colors mb-4 relative">
                      <img src={ch.node.image.large} alt="" className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{ch.node.name.full}</h4>
                    <p className="text-xs text-white/40 mt-1 uppercase tracking-wide">{ch.role}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "staff" && (
              <div className="grid grid-cols-6 gap-6">
                {anime.staff?.edges?.map(s => (
                  <div key={s.node.id} className="group text-center">
                    <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors mb-4 bg-white/5">
                      <img src={s.node.image.large} alt="" className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-sm font-bold text-white leading-tight">{s.node.name.full}</h4>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">{s.role}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="grid grid-cols-2 gap-6">
                {anime.reviews?.nodes?.map(r => (
                  <div key={r.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={r.user.avatar.medium} alt="" className="w-10 h-10 rounded-full bg-white/5" />
                        <div>
                          <p className="text-sm font-bold text-white">{r.user.name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">Reviewer</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <span className="text-xs font-black text-white">{r.score}%</span>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed line-clamp-4 italic">"{r.summary}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0">
      <span className="text-xs font-bold text-white/30 uppercase">{label}</span>
      <span className="text-xs font-bold text-white text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}

function startDateYear(anime: any) {
  return anime.startDate?.year;
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}
