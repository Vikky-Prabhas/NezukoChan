import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import type { AnimeSeason } from "../../lib/seasonUtils";

interface SeasonSelectorProps {
    seasons: AnimeSeason[];
    currentSeasonId: number;
}

export default function SeasonSelector({ seasons, currentSeasonId }: SeasonSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    if (seasons.length <= 1) return null;

    const currentSeason = seasons.find(s => s.id === currentSeasonId) || seasons[0];

    return (
        <div className="relative z-50 mb-6" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group"
            >
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Season</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-[300px]">
                        {currentSeason.title}
                    </span>
                    <span className="text-xs text-white/40 font-mono">({currentSeason.year || "?"})</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-white/40 group-hover:text-white transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-[320px] max-h-[400px] overflow-y-auto bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl custom-scrollbar"
                    >
                        <div className="p-2 space-y-1">
                            {seasons.map((season) => {
                                const isSelected = season.id === currentSeasonId;
                                return (
                                    <button
                                        key={season.id}
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate(`/anime/${season.id}`);
                                        }}
                                        className={cn(
                                            "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all border border-transparent",
                                            isSelected
                                                ? "bg-white/10 border-white/5"
                                                : "hover:bg-white/5 hover:border-white/5"
                                        )}
                                    >
                                        <img
                                            src={season.image}
                                            alt=""
                                            className="w-10 h-14 object-cover rounded bg-white/5 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={cn("text-xs font-bold", isSelected ? "text-white" : "text-white/70")}>{season.format} • {season.year}</span>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <p className={cn("text-sm font-medium truncate", isSelected ? "text-white" : "text-white/60")}>{season.title}</p>
                                            <p className="text-[10px] text-white/30 capitalize mt-0.5">{season.relation.replace(/_/g, " ").toLowerCase()}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
