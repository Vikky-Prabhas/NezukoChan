import { Link } from "react-router-dom";
import { ArrowRight, Plus, Check } from "lucide-react";
import { AnilistService } from "../../services/anilist";
import AnimeCard from "../../components/ui/AnimeCard";
import ScrollRow from "../../components/ui/ScrollRow";
import type { HomePageProps } from "./Home";

export default function HomeDesktop({ trending, popular, topRated, isLoading, error, onAddToLibrary, getStatus }: HomePageProps) {
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (error || !trending.length) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-white/40 text-sm">{error || "No data available"}</p>
      <button onClick={() => location.reload()} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold">Retry</button>
    </div>
  );

  const hero = trending[0];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* ─── Hero ─── */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero.bannerImage || hero.coverImage.extraLarge} alt="" className="w-full h-full object-cover opacity-50 scale-105 animate-slow-zoom" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end px-12 pb-20 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-serif font-black text-white mb-3 leading-[0.95] tracking-tight animate-slide-down" style={{ animationDelay: "0.1s" }}>
            {hero.title.english || hero.title.romaji}
          </h1>
          <p className="text-white/70 text-base max-w-xl mb-6 leading-relaxed line-clamp-2 animate-slide-down" style={{ animationDelay: "0.2s" }}>
            {AnilistService.stripHtml(hero.description)}
          </p>
          <div className="flex items-center gap-3 animate-slide-down" style={{ animationDelay: "0.3s" }}>
            <Link to={`/anime/${hero.id}`} className="bg-white text-black px-6 py-2.5 rounded-md font-bold text-xs tracking-wider uppercase hover:bg-white/90 transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onAddToLibrary(hero, "toWatch")}
              className={`px-6 py-2.5 border rounded-md font-bold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 ${getStatus(hero.id) === "toWatch"
                ? "bg-white text-black border-white"
                : "border-white/20 text-white hover:bg-white/10"
                }`}
            >
              {getStatus(hero.id) === "toWatch" ? <><Check className="w-4 h-4" /> Added</> : <><Plus className="w-4 h-4" /> To Watch</>}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Special For You ─── */}
      <ScrollRow title="Special For You" className="px-12 -mt-12 relative z-20 mb-14">
        {trending.slice(1, 21).map(a => (
          <div key={a.id} className="min-w-[160px] max-w-[160px] snap-start">
            <AnimeCard anime={a} size="sm" />
          </div>
        ))}
      </ScrollRow>

      {/* ─── Featured Collections ─── */}
      {trending.length >= 13 && (
        <section className="px-12 mb-14">
          <h2 className="text-lg font-serif font-bold text-white mb-5">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Mystical\nAnime", label: "The Best", idx: [4, 5, 6], genre: "Fantasy" },
              { title: "Romance\nAnime", label: "Top 20", idx: [7, 8, 9], genre: "Romance" },
              { title: "Classic\nAnimes", label: "The Best", idx: [10, 11, 12], genre: "Action" },
            ].map((col, ci) => (
              <Link to={`/catalog?sort=POPULARITY_DESC&genre=${col.genre}`} key={ci} className="group relative h-40 rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all duration-500">
                <img src={trending[col.idx[0]]?.bannerImage || trending[col.idx[0]]?.coverImage.extraLarge} className="absolute right-0 top-0 w-3/4 h-full object-cover opacity-15 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="relative z-10 p-5 flex flex-col justify-center h-full">
                  <span className="text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">{col.label}</span>
                  <h3 className="text-xl font-serif font-black text-white whitespace-pre-line leading-tight mt-1">{col.title}</h3>
                  <div className="flex -space-x-2 mt-3">
                    {col.idx.map(i => trending[i] && (
                      <img key={i} className="h-7 w-7 rounded-full ring-2 ring-black object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src={trending[i].coverImage.medium} />
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Trending Now ─── */}
      <ScrollRow title="Trending Now" className="px-12 mb-14">
        {trending.slice(21, 41).map(a => (
          <div key={a.id} className="min-w-[160px] max-w-[160px] snap-start">
            <AnimeCard anime={a} size="sm" />
          </div>
        ))}
      </ScrollRow>

      {/* ─── Top Rated ─── */}
      <ScrollRow title="Top Rated Masterpieces" className="px-12 mb-14">
        {topRated.map(a => (
          <div key={a.id} className="min-w-[160px] max-w-[160px] snap-start">
            <AnimeCard anime={a} size="sm" />
          </div>
        ))}
      </ScrollRow>

      {/* ─── Most Popular ─── */}
      <section className="px-12 mb-14">
        <h2 className="text-lg font-serif font-bold text-white mb-5">Most Popular</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
          {popular.map(a => (
            <AnimeCard key={a.id} anime={a} size="sm" />
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <Link to="/catalog?sort=POPULARITY_DESC" className="w-full max-w-xl py-3 bg-white/5 border border-white/10 text-white font-bold text-xs tracking-[0.15em] uppercase hover:bg-white hover:text-black transition-all duration-300 rounded-md text-center">
            Show More
          </Link>
        </div>
      </section>
    </div>
  );
}
