import { Link } from "react-router-dom";
import { ArrowRight, Plus, Check } from "lucide-react";
import { AnilistService } from "../../services/anilist";
import AnimeCard from "../../components/ui/AnimeCard";
import type { HomePageProps } from "./Home";

export default function HomeMobile({ trending, popular, topRated, isLoading, error, onAddToLibrary, getStatus }: HomePageProps) {
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (error || !trending.length) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4">
      <p className="text-white/40 text-xs">{error || "No data"}</p>
      <button onClick={() => location.reload()} className="px-3 py-1.5 bg-white text-black rounded text-xs font-bold">Retry</button>
    </div>
  );

  const hero = trending[0];

  return (
    <div className="min-h-screen bg-black pb-4">
      {/* Hero */}
      <section className="relative h-[55vh] overflow-hidden">
        <img src={hero.bannerImage || hero.coverImage.extraLarge} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl font-serif font-black text-white mb-2 leading-tight">{hero.title.english || hero.title.romaji}</h1>
          <p className="text-white/60 text-xs line-clamp-2 mb-4">{AnilistService.stripHtml(hero.description)}</p>
          <Link to={`/anime/${hero.id}`} className="inline-flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-md text-xs font-bold">
            Learn More <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => onAddToLibrary(hero, "toWatch")}
            className={`ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold border ${getStatus(hero.id) === "toWatch"
              ? "bg-white text-black border-white"
              : "bg-transparent text-white border-white/30"
              }`}
          >
            {getStatus(hero.id) === "toWatch" ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> To Watch</>}
          </button>
        </div>
      </section>

      {/* Special For You */}
      <section className="px-4 mt-6 mb-8">
        <h2 className="text-sm font-serif font-bold text-white mb-3">Special For You</h2>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {trending.slice(1, 8).map(a => (
            <div key={a.id} className="min-w-[120px] max-w-[120px]">
              <AnimeCard anime={a} size="sm" />
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="px-4 mb-8">
        <h2 className="text-sm font-serif font-bold text-white mb-3">Trending Now</h2>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {trending.slice(8, 16).map(a => (
            <div key={a.id} className="min-w-[120px] max-w-[120px]">
              <AnimeCard anime={a} size="sm" />
            </div>
          ))}
        </div>
      </section>

      {/* Top Rated */}
      {topRated.length > 0 && (
        <section className="px-4 mb-8">
          <h2 className="text-sm font-serif font-bold text-white mb-3">Top Rated Masterpieces</h2>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {topRated.slice(0, 10).map(a => (
              <div key={a.id} className="min-w-[120px] max-w-[120px]">
                <AnimeCard anime={a} size="sm" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Grid */}
      <section className="px-4 mb-6">
        <h2 className="text-sm font-serif font-bold text-white mb-3">Most Popular</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {popular.slice(0, 12).map(a => (
            <AnimeCard key={a.id} anime={a} size="sm" />
          ))}
        </div>
        <Link to="/catalog?sort=POPULARITY_DESC" className="block w-full mt-4 py-2.5 bg-white/5 border border-white/10 text-white text-center text-xs font-bold uppercase tracking-wider rounded-md">
          Show More
        </Link>
      </section>
    </div>
  );
}
