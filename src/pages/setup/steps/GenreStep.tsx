import { useState, useEffect } from "react";

interface GenreStepProps {
    preferredGenres: string[];
    onUpdate: (genres: string[]) => void;
    onNext: () => void;
    onBack: () => void;
}

const GENRES = [
    { name: "Action", emoji: "⚔️" },
    { name: "Adventure", emoji: "🗺️" },
    { name: "Comedy", emoji: "😂" },
    { name: "Drama", emoji: "🎭" },
    { name: "Fantasy", emoji: "🧙" },
    { name: "Horror", emoji: "👻" },
    { name: "Mystery", emoji: "🔍" },
    { name: "Romance", emoji: "💕" },
    { name: "Sci-Fi", emoji: "🚀" },
    { name: "Slice of Life", emoji: "🌻" },
    { name: "Sports", emoji: "⚽" },
    { name: "Thriller", emoji: "😰" },
    { name: "Supernatural", emoji: "👁️" },
    { name: "Mecha", emoji: "🤖" },
    { name: "Music", emoji: "🎵" },
    { name: "Psychological", emoji: "🧠" },
    { name: "Ecchi", emoji: "🔥" },
    { name: "Isekai", emoji: "🌀" },
];

export default function GenreStep({ preferredGenres, onUpdate, onNext, onBack }: GenreStepProps) {
    const [selected, setSelected] = useState<string[]>(preferredGenres);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const toggleGenre = (genre: string) => {
        setSelected((prev) => {
            const updated = prev.includes(genre)
                ? prev.filter((g) => g !== genre)
                : [...prev, genre];
            return updated;
        });
    };

    const handleNext = () => {
        onUpdate(selected);
        onNext();
    };

    return (
        <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    background:
                        "radial-gradient(ellipse at 70% 40%, rgba(200, 80, 120, 0.3) 0%, transparent 50%), " +
                        "radial-gradient(ellipse at 20% 70%, rgba(80, 100, 200, 0.2) 0%, transparent 50%)",
                }}
            />

            <div
                className="relative z-10 w-full max-w-xl px-6 transition-all duration-700 ease-out"
                style={{
                    opacity: show ? 1 : 0,
                    transform: show ? "translateY(0)" : "translateY(30px)",
                }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <span className="text-3xl">🎭</span>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Pick your favorites
                    </h2>
                    <p className="text-white/40 text-sm">We'll personalize your home screen</p>
                </div>

                {/* Genre Grid */}
                <div className="flex flex-wrap justify-center gap-2.5 mb-8 max-h-[40vh] overflow-y-auto no-scrollbar">
                    {GENRES.map((genre, i) => {
                        const isSelected = selected.includes(genre.name);
                        return (
                            <button
                                key={genre.name}
                                onClick={() => toggleGenre(genre.name)}
                                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-300 cursor-pointer
                  ${isSelected
                                        ? "bg-white/15 border-white/25 text-white shadow-lg shadow-white/5 scale-105"
                                        : "bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/[0.06] hover:border-white/10 hover:text-white/70"
                                    }
                  border
                `}
                                style={{
                                    transitionDelay: `${i * 20}ms`,
                                    animationDelay: `${i * 30}ms`,
                                }}
                            >
                                <span className="text-base">{genre.emoji}</span>
                                {genre.name}
                                {isSelected && (
                                    <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Counter */}
                <div className="text-center mb-8">
                    <p className="text-white/30 text-sm">
                        {selected.length === 0
                            ? "Select genres you enjoy"
                            : `Selected: ${selected.length} genre${selected.length > 1 ? "s" : ""}`}
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="px-6 py-3 text-white/30 hover:text-white/60 transition-colors text-sm cursor-pointer"
                    >
                        ← Back
                    </button>
                    <div className="flex items-center gap-4">
                        {selected.length === 0 && (
                            <button
                                onClick={() => { onUpdate([]); onNext(); }}
                                className="text-white/30 hover:text-white/60 text-sm transition-colors cursor-pointer"
                            >
                                Skip →
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-white/10 border border-white/15 rounded-full text-white font-medium hover:bg-white/15 hover:border-white/25 transition-all cursor-pointer"
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
