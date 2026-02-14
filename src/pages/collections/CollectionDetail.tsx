import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useLibrary } from "../../hooks/useLibrary";
import { useResponsive } from "../../hooks/useResponsive";
import AnimeCard from "../../components/ui/AnimeCard";
import { cn } from "../../lib/utils";

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { collections, getCollectionAnime, removeFromCollection, deleteCollection } = useLibrary();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const collection = collections.find(c => c.id === id);

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/30 text-sm">Collection not found</p>
        <Link to="/collections" className="text-white/50 hover:text-white text-sm font-bold">Back to Collections</Link>
      </div>
    );
  }

  const anime = getCollectionAnime(collection.id);

  const handleDelete = () => {
    deleteCollection(collection.id);
    navigate("/collections");
  };

  return (
    <div className={cn("min-h-screen bg-black pb-16", isMobile ? "pt-2 px-4 pb-24" : "pt-24 px-12")}>
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link to="/collections" className="flex items-center gap-1 text-white/40 hover:text-white text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> Collections
          </Link>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={cn("font-serif font-black text-white", isMobile ? "text-2xl" : "text-3xl")}>{collection.name}</h1>
            {collection.description && (
              <p className="text-white/40 text-sm mt-1">{collection.description}</p>
            )}
            <p className="text-white/30 text-xs font-bold mt-2">{anime.length} anime</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>

            {confirmDelete && (
              <div className="absolute right-0 top-12 z-30 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg p-4 min-w-[220px] shadow-2xl space-y-3">
                <p className="text-xs text-white/60">Delete "{collection.name}"?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 text-xs font-bold text-white/60 border border-white/10 rounded-lg hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Anime Grid */}
        {anime.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/5 rounded-2xl">
            <p className="text-white/25 text-sm mb-2">This collection is empty</p>
            <Link to="/catalog" className="text-white/50 hover:text-white text-xs font-bold">Browse anime to add</Link>
          </div>
        ) : (
          <div className={cn(
            "grid gap-x-4 gap-y-6",
            isMobile ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
          )}>
            {anime.map(a => (
              <div key={a.id} className="relative group/card">
                <AnimeCard anime={a} size="sm" />
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromCollection(collection.id, a.id); }}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-black/70 backdrop-blur-xl rounded-full text-white/50 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-all border border-white/10"
                  title="Remove from collection"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
