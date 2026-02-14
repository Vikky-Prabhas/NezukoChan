import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, SkipForward, AlertCircle, Monitor } from "lucide-react";
import VideoPlayer from "../../components/player/VideoPlayer";
import { useStream } from "../../hooks/useProvider";
import { cn } from "../../lib/utils";
import type { WatchPageProps } from "./Watch";

export default function WatchDesktop({ anime, episodes, currentEpisodeId, onEpisodeSelect, variants, selectedVariant, setVariant, audioMode, setAudioMode }: WatchPageProps) {
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

  // Smart Fallback: Try next server when stream fails
  const handleStreamError = useCallback(() => {
    if (!variants || variants.length <= 1 || !selectedVariant || hasTriedFallback.current) return;
    hasTriedFallback.current = true;

    const currentIdx = variants.findIndex(v => v.id === selectedVariant.id);
    const nextIdx = (currentIdx + 1) % variants.length;
    const nextVar = variants[nextIdx];

    if (nextVar && nextVar.id !== selectedVariant.id) {
      console.log(`[Watch] Fallback: ${selectedVariant.name} failed, trying ${nextVar.name}...`);
      setFallbackToast(`${selectedVariant.name} failed. Switching to ${nextVar.name}...`);
      setVariant(nextVar.id);

      // Clear toast after 3s
      setTimeout(() => setFallbackToast(null), 3000);
    }
  }, [variants, selectedVariant, setVariant]);

  // Auto-fallback when useStream reports an error
  useEffect(() => {
    if (streamError && !hasTriedFallback.current) {
      handleStreamError();
    }
  }, [streamError, handleStreamError]);

  // Reset fallback flag when variant changes intentionally
  useEffect(() => {
    hasTriedFallback.current = false;
  }, [selectedVariant?.id]);

  // Auto-title
  useEffect(() => {
    if (anime && currentEpisode) {
      document.title = `Watching ${anime.title.english || anime.title.romaji} - Episode ${currentEpisode.number}`;
    }
  }, [anime, currentEpisode]);

  if (!anime || !currentEpisode) return null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 flex flex-col overflow-hidden">
      {/* Fallback Toast */}
      {fallbackToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-amber-500/90 text-black rounded-lg text-xs font-bold shadow-2xl animate-bounce">
          ⚡ {fallbackToast}
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/anime/${anime.id}`} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white/90 line-clamp-1 max-w-[300px]">{anime.title.english || anime.title.romaji}</h1>
            <p className="text-xs text-white/40 font-medium">Episode {currentEpisode.number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Sub/Dub Toggle Pills */}
          <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
            <button
              onClick={() => setAudioMode("sub")}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                audioMode === "sub"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              Sub
            </button>
            <button
              onClick={() => setAudioMode("dub")}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                audioMode === "dub"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              Dub
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-16 h-screen flex">
        {/* Main Player Area */}
        <div className="flex-1 flex flex-col relative bg-black/50">
          <div className="flex-1 relative group">
            {streamError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500/80" />
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg">Stream Unavailable</p>
                  <p className="text-white/40 text-sm max-w-md">{streamError}</p>
                </div>
                <div className="flex gap-3">
                  {variants.length > 1 && (
                    <button
                      onClick={handleStreamError}
                      className="px-6 py-2 bg-amber-500 text-black rounded-full text-sm font-bold hover:bg-amber-400 transition-colors"
                    >
                      Try Next Server
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-white/90 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : streamLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Fetching Stream...</p>
              </div>
            ) : streamUrl ? (
              <VideoPlayer
                src={streamUrl}
                poster={currentEpisode.image || anime.bannerImage || anime.coverImage.extraLarge}
                title={`Episode ${currentEpisode.number} - ${currentEpisode.title}`}
                isHLS={streamUrl.includes('.m3u8')}
                onEnded={() => nextEpisode && onEpisodeSelect(nextEpisode.id)}
                onError={handleStreamError}
                onTimeUpdate={(t) => { fallbackTimeRef.current = t; }}
                initialTime={fallbackTimeRef.current || undefined}
              />
            ) : null}
          </div>

          {/* Player Footer Controls */}
          <div className="h-16 border-t border-white/5 px-6 flex items-center justify-between bg-black/90">
            <div className="flex items-center gap-4">
              {/* Previous/Next buttons could go here if wired up */}
              <button
                className="text-white/40 hover:text-white transition-colors disabled:opacity-20"
                disabled={currentEpisodeIndex <= 0}
                onClick={() => currentEpisodeIndex > 0 && onEpisodeSelect(episodes[currentEpisodeIndex - 1].id)}
                title="Previous Episode"
              >
                <SkipForward className="w-5 h-5 rotate-180" />
              </button>
              <button
                className="text-white/40 hover:text-white transition-colors disabled:opacity-20"
                disabled={!nextEpisode}
                onClick={() => nextEpisode && onEpisodeSelect(nextEpisode.id)}
                title="Next Episode"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 relative group">
                <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-white/50 uppercase cursor-pointer hover:text-white transition-colors">
                  {selectedVariant?.name || providerId || "Server"}
                </span>

                {/* Server Dropdown */}
                {variants && variants.length > 1 && (
                  <div className="absolute bottom-full right-0 mb-2 w-40 bg-[#111] border border-white/10 rounded-xl py-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-3 py-1 mb-1 border-b border-white/5">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Select Server</span>
                    </div>
                    {variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setVariant(v.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10",
                          selectedVariant?.id === v.id ? "text-emerald-400" : "text-white/60"
                        )}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Episode List */}
        <div className="w-80 border-l border-white/5 bg-[#0a0a0a] flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Episodes</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {episodes.map(ep => (
              <button
                key={ep.id}
                onClick={() => onEpisodeSelect(ep.id)}
                className={cn(
                  "w-full flex gap-3 p-2 rounded-lg text-left transition-all group",
                  ep.number === currentEpisode.number
                    ? "bg-white/10"
                    : "hover:bg-white/5"
                )}
              >
                <div className="w-24 aspect-video bg-white/5 rounded overflow-hidden relative shrink-0 border border-white/5">
                  {ep.image ? (
                    <img src={ep.image} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs font-bold text-white/20">{ep.number}</div>
                  )}
                  {ep.number === currentEpisode.number && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wide mb-0.5",
                    ep.number === currentEpisode.number ? "text-emerald-400" : "text-white/30"
                  )}>
                    Episode {ep.number}
                  </span>
                  <span className={cn(
                    "text-xs font-bold truncate",
                    ep.number === currentEpisode.number ? "text-white" : "text-white/60 group-hover:text-white"
                  )}>
                    {ep.title || `Episode ${ep.number}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
