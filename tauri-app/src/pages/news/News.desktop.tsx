import { Link } from "react-router-dom";
import type { NewsPageProps } from "./News";

export default function NewsDesktop({ articles, isLoading, hasMore, onLoadMore }: NewsPageProps) {
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  const hero = articles[0];
  const spotlight = articles.slice(1, 4);
  const feed = articles.slice(4);

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-[1920px] mx-auto px-12">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-8 tracking-tight animate-slide-up">
          NezukoChan <span className="text-white/40 font-sans tracking-widest text-lg font-bold uppercase ml-2">News</span>
        </h1>

        <div className="grid grid-cols-12 gap-8 mb-16">
          {/* Main Hero - Spans 8 cols */}
          {hero && (
            <div className="col-span-8 group relative h-[600px] rounded-2xl overflow-hidden cursor-pointer animate-fade-in">
              <Link to={`/anime/${hero.anime.id}`} className="block w-full h-full">
                <img src={hero.image} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 max-w-4xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white text-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg">{hero.category}</span>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider">{hero.timeAgo}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight mb-4 group-hover:underline decoration-2 underline-offset-4 decoration-white/30 line-clamp-3">{hero.title}</h2>
                  <p className="text-white/70 text-base md:text-lg line-clamp-2 max-w-2xl font-medium drop-shadow-md">
                    {hero.anime.description?.replace(/<[^>]*>?/gm, "")}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Sidebar Spotlight - Spans 4 cols */}
          <div className="col-span-4 flex flex-col gap-4">
            {spotlight.map((article, i) => (
              <Link
                key={article.id}
                to={`/anime/${article.anime.id}`}
                className="group relative flex-1 min-h-[180px] rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/20 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img src={article.image} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                <div className="relative p-6 flex flex-col justify-center h-full">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{article.category}</span>
                  <h3 className="text-xl font-bold text-white leading-tight group-hover:text-white/90 transition-colors line-clamp-2">{article.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Latest Feed */}
        <div className="mb-12">
          <h3 className="text-xl font-serif font-bold text-white mb-6 border-b border-white/10 pb-4">Latest Updates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {feed.map((article) => (
              <Link
                key={article.id}
                to={`/anime/${article.anime.id}`}
                className="group flex flex-col gap-3 animate-fade-in"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5">
                  <img src={article.image} className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-white/70 uppercase tracking-wide">
                    {article.category}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug group-hover:text-white/70 transition-colors line-clamp-2">{article.title}</h4>
                  <span className="text-xs text-white/30 font-medium mt-1 block">{article.timeAgo}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {hasMore && (
          <div className="flex justify-center pt-8">
            <button
              onClick={onLoadMore}
              className="px-10 py-3 bg-white text-black font-black text-xs tracking-[0.2em] uppercase rounded hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Load More Stories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
