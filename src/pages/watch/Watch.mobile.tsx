import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Monitor, AlertCircle, ChevronUp } from "lucide-react";
import VideoPlayer from "../../components/player/VideoPlayer";
import { useStream } from "../../hooks/useProvider";
import { cn } from "../../lib/utils";
import type { WatchPageProps } from "./Watch";

export default function WatchMobile({ anime, episodes, currentEpisodeId, onEpisodeSelect, variants, selectedVariant, setVariant, audioMode, setAudioMode }: WatchPageProps) {
  const [serverOpen, setServerOpen] = useState(false);

  const currentEpisode = episodes.find(e => e.id === currentEpisodeId) || null;
  const currentEpisodeIndex = episodes.findIndex(e => e.id === currentEpisodeId);
  const nextEpisode = currentEpisodeIndex !== -1 && currentEpisodeIndex < episodes.length - 1 ? episodes[currentEpisodeIndex + 1] : null;

  // Use the extracted hook for stream logic
  const {
    streamUrl,
    isLoading: streamLoading,
    error: streamError,
    providerId,
  } = useStream(currentEpisode?.id);

  // Smart Fallback State
  const fallbackTimeRef = useRef<number>(0);
  const [fallbackToast, setFallbackToast] = useState<string | null>(null);
  const hasTriedFallback = useRef(false);

  const handleStreamError = useCallback(() => {
    if (!variants || variants.length <= 1 || !selectedVariant || hasTriedFallback.current) return;
    hasTriedFallback.current = true;

    const currentIdx = variants.findIndex(v => v.id === selectedVariant.id);
    const nextIdx = (currentIdx + 1) % variants.length;
    const nextVar = variants[nextIdx];

    if (nextVar && nextVar.id !== selectedVariant.id) {
      setFallbackToast(`Switching to ${nextVar.name}...`);
      setVariant(nextVar.id);
      setTimeout(() => setFallbackToast(null), 3000);
    }
  }, [variants, selectedVariant, setVariant]);

  useEffect(() => {
    if (streamError && !hasTriedFallback.current) handleStreamError();
  }, [streamError, handleStreamError]);

  useEffect(() => {
    hasTriedFallback.current = false;
  }, [selectedVariant?.id]);

  // Auto-title
  useEffect(() => {
    if (anime && currentEpisode) {
      document.title = `Watching ${anime.title.english || anime.title.romaji}`;
    }
  }, [anime, currentEpisode]);

  if (!anime || !currentEpisode) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Fallback Toast */}
      {fallbackToast && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] px-3 py-1.5 bg-amber-500/90 text-black rounded-lg text-[10px] font-bold shadow-2xl">
          ⚡ {fallbackToast}
        </div>
      )}

      {/* Sticky Player Container */}
      <div className="sticky top-0 z-50 w-full aspect-video bg-black shadow-2xl">
        <div className="relative w-full h-full">
          <Link to={`/anime/${anime.id}`} className="absolute top-4 left-4 z-40 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {streamError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10 space-y-3 p-4 text-center">
              <AlertCircle className="w-10 h-10 text-red-500/80" />
              <div>
                <p className="font-bold text-white text-sm">Stream Error</p>
                <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{streamError}</p>
              </div>
              <div className="flex gap-2">
                {variants.length > 1 && (
                  <button onClick={handleStreamError} className="px-3 py-1.5 bg-amber-500 text-black rounded-lg text-[10px] font-bold">Try Next</button>
                )}
                <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-bold">Retry</button>
              </div>
            </div>
          ) : streamLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest animate-pulse">Loading Stream...</p>
            </div>
          ) : streamUrl ? (
            <VideoPlayer
              src={streamUrl}
              poster={currentEpisode.image || anime.bannerImage || anime.coverImage.extraLarge}
              title={`Episode ${currentEpisode.number}`}
              isHLS={streamUrl.includes('.m3u8')}
              onEnded={() => nextEpisode && onEpisodeSelect(nextEpisode.id)}
              onError={handleStreamError}
              onTimeUpdate={(t) => { fallbackTimeRef.current = t; }}
              initialTime={fallbackTimeRef.current || undefined}
            />
          ) : null}
        </div>
      </div>

      {/* Info & Controls */}
      <div className="p-4 border-b border-white/5 bg-[#0a0a0a]">
        <h1 className="text-sm font-bold text-white line-clamp-1 leading-tight">{anime.title.english || anime.title.romaji}</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-white/40 font-bold">Episode {currentEpisode.number}</p>

          <div className="flex items-center gap-2 relative z-50">
            {/* Sub/Dub Toggle Pills */}
            <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
              <button
                onClick={() => setAudioMode("sub")}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                  audioMode === "sub"
                    ? "bg-emerald-500 text-black"
                    : "text-white/50"
                )}
              >
                Sub
              </button>
              <button
                onClick={() => setAudioMode("dub")}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                  audioMode === "dub"
                    ? "bg-emerald-500 text-black"
                    : "text-white/50"
                )}
              >
                Dub
              </button>
            </div>

            {/* Server Selector */}
            <div className="relative">
              <button
                onClick={() => setServerOpen(v => !v)}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5 active:scale-95 transition-transform"
              >
                <Monitor className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-white/50 uppercase">
                  {selectedVariant?.name || providerId || "Server"}
                </span>
                {serverOpen ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
              </button>

              {/* Click-based Dropdown */}
              {serverOpen && variants && variants.length > 1 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setServerOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-32 bg-[#111] border border-white/10 rounded-xl py-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    {variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => { setVariant(v.id); setServerOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[10px] font-bold transition-colors active:bg-white/20",
                          selectedVariant?.id === v.id ? "text-emerald-400" : "text-white/60"
                        )}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episode List */}
      <div className="flex-1 overflow-y-auto bg-black p-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Episodes</h3>
          <span className="text-[10px] font-bold text-white/20">{episodes.length} Total</span>
        </div>

        <div className="grid gap-2">
          {episodes.map(ep => {
            const isCurrent = ep.number === currentEpisode.number;
            return (
              <button
                key={ep.id}
                onClick={() => onEpisodeSelect(ep.id)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-xl transition-all active:scale-[0.98]",
                  isCurrent ? "bg-white/10" : "bg-white/[0.02] border border-white/5"
                )}
              >
                <div className="w-20 aspect-video rounded-lg overflow-hidden relative shrink-0 bg-white/5">
                  {ep.image ? (
                    <img src={ep.image} alt="" className={cn("w-full h-full object-cover", isCurrent ? "opacity-100" : "opacity-60")} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/20">{ep.number}</div>
                  )}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={cn("text-[9px] font-black uppercase mb-0.5", isCurrent ? "text-emerald-400" : "text-white/30")}>Episode {ep.number}</p>
                  <p className={cn("text-xs font-bold truncate", isCurrent ? "text-white" : "text-white/60")}>{ep.title || `Episode ${ep.number}`}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
