import { Link } from "react-router-dom";
import type { Collection } from "../../types";
import { cn } from "../../lib/utils";

interface Props {
  collection: Collection;
  className?: string;
}

export default function CollectionCard({ collection, className }: Props) {
  const images = collection.coverImages.slice(0, 3);

  return (
    <Link
      to={`/collections/${collection.id}`}
      className={cn(
        "group relative block rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden",
        "hover:border-white/15 hover:bg-white/[0.06] transition-all duration-500",
        "hover:shadow-[0_0_40px_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <div className="p-5 pb-3">
        {/* Title */}
        <div className="text-center mb-4">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            {collection.description || "Collection"}
          </p>
          <h3 className="text-base font-serif font-bold text-white mt-0.5 leading-tight">
            {collection.name}
          </h3>
        </div>

        {/* Stacked Covers */}
        <div className="flex justify-center items-end gap-1.5 h-24">
          {images.length > 0 ? images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className={cn(
                "h-full rounded object-cover border border-white/10 transition-transform duration-500",
                "group-hover:scale-105",
                i === 1 && "z-10 h-[110%]",
              )}
              style={{ width: `${100 / Math.max(images.length, 1)}%`, maxWidth: 80 }}
            />
          )) : (
            <div className="flex items-center justify-center h-full w-full text-white/20 text-xs font-medium">
              No anime yet
            </div>
          )}
        </div>
      </div>

      {/* Item count */}
      <div className="px-5 py-2 border-t border-white/5 text-center">
        <span className="text-[10px] font-bold text-white/30">{collection.animeIds.length} anime</span>
      </div>
    </Link>
  );
}
