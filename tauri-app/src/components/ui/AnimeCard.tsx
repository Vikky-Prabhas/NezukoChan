import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { AnimeMedia } from "../../types";
import { cn } from "../../lib/utils";

interface Props {
  anime: AnimeMedia;
  linkTo?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AnimeCard({ anime, linkTo, size = "md", className }: Props) {
  const to = linkTo ?? `/anime/${anime.id}`;
  const title = anime.title.english || anime.title.romaji;
  const year = anime.seasonYear ?? anime.startDate?.year ?? null;
  const genre = anime.genres?.[0] ?? anime.format ?? "";
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={to}
      className={cn(
        "group block transition-all duration-300",
        className,
      )}
    >
      {/* Image Container */}
      <div className={cn(
        "relative overflow-hidden rounded-lg bg-white/5 border border-transparent",
        "transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]",
        size === "sm" && "aspect-[2/3]",
        size === "md" && "aspect-[2/3]",
        size === "lg" && "aspect-[2/3]",
      )}>
        <img
          src={anime.coverImage.extraLarge || anime.coverImage.large}
          alt={title}
          loading="lazy"
          onError={() => setImgError(true)}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110",
            imgError && "hidden",
          )}
        />
        {imgError && (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <span className="text-white/20 text-xs font-bold text-center px-2 line-clamp-2">{title}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating Badge */}
        {anime.averageScore && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xl px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-[10px] font-bold text-white">{(anime.averageScore / 10).toFixed(1)}</span>
          </div>
        )}

        {/* View Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="px-4 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.15em] rounded-sm translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            View
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2.5 space-y-0.5">
        <h3 className={cn(
          "font-bold text-white/80 group-hover:text-white transition-colors line-clamp-1",
          size === "sm" ? "text-xs" : "text-sm",
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-white/40 font-medium",
          size === "sm" ? "text-[9px]" : "text-[11px]",
        )}>
          {year ? `${year}` : "TBA"}{genre ? `, ${genre}` : ""}
        </p>
      </div>
    </Link>
  );
}
