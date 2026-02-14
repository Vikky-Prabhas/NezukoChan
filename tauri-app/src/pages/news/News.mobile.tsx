import { Link } from "react-router-dom";
import type { NewsPageProps } from "./News";

export default function NewsMobile({ articles, isLoading, hasMore, onLoadMore }: NewsPageProps) {
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-4 pb-24" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
      <div className="px-4 mb-6">
        <h1 className="text-3xl font-serif font-black text-white">Latest<br /><span className="text-white/40">Updates</span></h1>
      </div>

      <div className="px-4 space-y-6">
        {articles.map((a, i) => (
          <Link
            key={a.id}
            to={`/anime/${a.anime.id}`}
            className="group block animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-white/5 border border-white/5">
              <img src={a.image} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[9px] font-black text-white uppercase tracking-widest border border-white/10 shadow-lg">
                {a.category}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">{a.timeAgo}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide line-clamp-1">{a.anime.title.english || a.anime.title.romaji}</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight mb-1">{a.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="px-4 mt-8">
          <button
            onClick={onLoadMore}
            className="w-full py-3.5 bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl active:scale-95 transition-transform"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
