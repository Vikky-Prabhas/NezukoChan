import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import AnimeCard from "../../components/ui/AnimeCard";
import FilterPanel from "../../components/ui/FilterPanel";
import { SORT_OPTIONS } from "../../types";
import { cn } from "../../lib/utils";
import type { CatalogPageProps } from "./Catalog";

export default function CatalogDesktop({ results, filters, setFilters, isLoading, hasNext, loadMore, sortBy, setSortBy }: CatalogPageProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Trending";

  // Hero Image source (first result or fallback)
  const heroImage = results[0]?.bannerImage || results[0]?.coverImage?.extraLarge;

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* ─── Immersive Hero Section ─── */}
      <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden">
        {heroImage && (
          <div className="absolute inset-0 animate-fade-in">
            <img src={heroImage} className="w-full h-full object-cover opacity-40 blur-sm scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
          </div>
        )}

        <div className="relative z-10 h-full max-w-[1920px] mx-auto px-12 flex flex-col justify-center">
          <span className="text-white/60 font-medium tracking-[0.2em] text-sm uppercase mb-2 animate-slide-up">Discover</span>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-white mb-8 tracking-tight animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Catalog
          </h1>

          {/* Search Bar in Hero */}
          <div className="relative max-w-xl w-full group animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              value={filters.search || ""}
              onChange={e => setFilters({ ...filters, search: e.target.value || undefined })}
              placeholder="Search by title..."
              className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:bg-white/15 focus:border-white/20 transition-all outline-none text-lg font-medium shadow-2xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-12 -mt-10 relative z-20">
        <div className="flex gap-12">
          {/* ─── Sticky Sidebar ─── */}
          <div className="w-64 shrink-0 transition-opacity duration-500">
            <div className="sticky top-24 space-y-8">
              <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6 text-white/40 pb-4 border-b border-white/5">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
                </div>
                <FilterPanel filters={filters} onChange={setFilters} />
              </div>
            </div>
          </div>

          {/* ─── Main Grid ─── */}
          <div className="flex-1 min-w-0 pt-2">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-white/40 text-sm font-medium">
                Showing {results.length > 0 ? results.length : 0} results
              </p>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <span className="text-xs text-white/40 font-bold uppercase tracking-wider group-hover:text-white/60">Sort:</span>
                  <span className="text-sm text-white font-medium">{sortLabel}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform duration-300", sortOpen ? "rotate-180" : "")} />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 z-30 bg-[#111] border border-white/10 rounded-xl py-2 min-w-[180px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {SORT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setSortBy(o.value); setSortOpen(false); }}
                        className={cn(
                          "w-full text-left px-5 py-2.5 text-xs font-bold transition-colors border-l-2",
                          sortBy === o.value
                            ? "text-white bg-white/5 border-white"
                            : "text-white/40 border-transparent hover:text-white hover:bg-white/[0.02]"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {isLoading && !results.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <Search className="w-12 h-12 text-white/10 mb-4" />
                <p className="text-white/40 text-lg font-medium">No anime found</p>
                <p className="text-white/20 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                  {results.map((a, i) => (
                    <div key={a.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <AnimeCard anime={a} size="md" />
                    </div>
                  ))}
                </div>

                {hasNext && (
                  <div className="flex justify-center pt-8 pb-12">
                    <button
                      onClick={loadMore}
                      disabled={isLoading}
                      className="group relative px-8 py-3 bg-white text-black font-black text-xs tracking-[0.2em] uppercase rounded hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Loading
                        </span>
                      ) : (
                        <span>Show More</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Footer Spacer */}
            <div className="h-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
