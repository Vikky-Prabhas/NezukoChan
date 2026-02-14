import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import AnimeCard from "../../components/ui/AnimeCard";
import FilterPanel from "../../components/ui/FilterPanel";
import type { CatalogPageProps } from "./Catalog";

export default function CatalogMobile({ results, filters, setFilters, isLoading, hasNext, loadMore }: CatalogPageProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-black pt-4 pb-24" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
      {/* Header & Search */}
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-serif font-black text-white mb-4">Discover</h1>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:bg-white/10 transition-colors">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input
              type="text"
              value={filters.search || ""}
              onChange={e => setFilters({ ...filters, search: e.target.value || undefined })}
              placeholder="Search anime..."
              className="bg-transparent border-none outline-none text-sm ml-3 text-white placeholder:text-white/25 w-full font-medium"
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-5 overflow-y-auto animate-in slide-in-from-bottom-10 duration-200">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/95 py-2 -mx-2 px-2 border-b border-white/5">
            <h2 className="text-xl font-serif font-black text-white">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="p-2 bg-white/10 rounded-full text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="pb-24">
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-5 bg-black/90 border-t border-white/10 backdrop-blur-lg">
            <button
              onClick={() => setShowFilters(false)}
              className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm tracking-wide uppercase shadow-xl active:scale-95 transition-transform"
            >
              Show Results
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading && !results.length ? (
        <div className="grid grid-cols-3 gap-3 px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {results.map(a => <AnimeCard key={a.id} anime={a} size="sm" />)}
          </div>

          {hasNext && (
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="w-full mt-8 py-3.5 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl active:bg-white/10 transition-colors"
            >
              {isLoading ? "Loading..." : "Show More"}
            </button>
          )}

          <div className="h-10" />
        </div>
      )}
    </div>
  );
}
