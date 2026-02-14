import { useState, useEffect } from "react";

interface InterfaceStepProps {
    contentMode: "anime" | "cartoon" | "both";
    onUpdate: (mode: "anime" | "cartoon" | "both") => void;
    onComplete: () => void;
    onBack: () => void;
}

export default function InterfaceStep({ contentMode, onUpdate, onComplete, onBack }: InterfaceStepProps) {
    const [mode, setMode] = useState(contentMode);
    const [show, setShow] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [animeImageError, setAnimeImageError] = useState(false);
    const [cartoonImageError, setCartoonImageError] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const toggleMode = (selected: "anime" | "cartoon") => {
        setMode((prev) => {
            if (prev === "both") {
                // Unselect one → keep the other
                return selected === "anime" ? "cartoon" : "anime";
            }
            if (prev === selected) {
                // Can't deselect the only one, do nothing
                return prev;
            }
            // One is selected, toggling the other → both
            return "both";
        });
    };

    const handleComplete = async () => {
        setCompleting(true);
        onUpdate(mode);
        // Brief celebration pause
        await new Promise((resolve) => setTimeout(resolve, 800));
        onComplete();
    };

    const isAnimeSelected = mode === "anime" || mode === "both";
    const isCartoonSelected = mode === "cartoon" || mode === "both";

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 opacity-15"
                style={{
                    background:
                        "radial-gradient(ellipse at 30% 30%, rgba(200, 50, 100, 0.3) 0%, transparent 50%), " +
                        "radial-gradient(ellipse at 70% 70%, rgba(50, 100, 200, 0.3) 0%, transparent 50%)",
                }}
            />

            {/* Completion Overlay */}
            {completing && (
                <div className="absolute inset-0 z-50 bg-black flex items-center justify-center"
                    style={{ animation: "fade-in 0.3s ease-out" }}
                >
                    <div className="text-center" style={{ animation: "fade-up 0.5s ease-out 0.2s both" }}>
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className="text-3xl font-bold text-white mb-2">You're all set!</h2>
                        <p className="text-white/40">Loading your personalized experience...</p>
                        <div className="mt-8">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                        </div>
                    </div>
                </div>
            )}

            <div
                className="relative z-10 w-full max-w-2xl px-6 transition-all duration-700 ease-out"
                style={{
                    opacity: show ? 1 : 0,
                    transform: show ? "translateY(0)" : "translateY(30px)",
                }}
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        What are you into?
                    </h2>
                    <p className="text-white/40 text-sm">Select one or both — switch anytime in settings</p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    {/* Anime Card */}
                    <button
                        onClick={() => toggleMode("anime")}
                        className={`
              relative group rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer
              transition-all duration-500
              ${isAnimeSelected
                                ? "ring-2 ring-white/30 shadow-2xl shadow-white/10 scale-[1.02]"
                                : "opacity-60 hover:opacity-80"
                            }
            `}
                    >
                        {/* Background */}
                        {!animeImageError ? (
                            <img
                                src="/setup/anime-card.jpg"
                                alt="Anime"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={() => setAnimeImageError(true)}
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 via-purple-900/40 to-indigo-900/40" />
                        )}

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-end pb-6 px-4">
                            <span className="text-4xl mb-3">🎌</span>
                            <h3 className="text-xl font-bold text-white mb-1">Anime</h3>
                            <p className="text-white/40 text-xs text-center">
                                Japanese animation, subs & dubs, seasonal releases
                            </p>

                            {/* Selection Indicator */}
                            {isAnimeSelected && (
                                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                                    style={{ animation: "fade-in 0.3s ease-out" }}
                                >
                                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Cartoon Card */}
                    <button
                        onClick={() => toggleMode("cartoon")}
                        className={`
              relative group rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer
              transition-all duration-500
              ${isCartoonSelected
                                ? "ring-2 ring-white/30 shadow-2xl shadow-white/10 scale-[1.02]"
                                : "opacity-60 hover:opacity-80"
                            }
            `}
                    >
                        {/* Background */}
                        {!cartoonImageError ? (
                            <img
                                src="/setup/cartoon-card.jpg"
                                alt="Cartoons"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={() => setCartoonImageError(true)}
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-cyan-900/40 to-teal-900/40" />
                        )}

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-end pb-6 px-4">
                            <span className="text-4xl mb-3">📺</span>
                            <h3 className="text-xl font-bold text-white mb-1">Cartoons</h3>
                            <p className="text-white/40 text-xs text-center">
                                Western animation, classics, new releases
                            </p>

                            {/* Selection Indicator */}
                            {isCartoonSelected && (
                                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                                    style={{ animation: "fade-in 0.3s ease-out" }}
                                >
                                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </button>
                </div>

                {/* Mode Label */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
                        <span className="text-white/40 text-sm">
                            {mode === "both"
                                ? "🎌📺 Anime + Cartoons"
                                : mode === "anime"
                                    ? "🎌 Anime only"
                                    : "📺 Cartoons only"}
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="px-6 py-3 text-white/30 hover:text-white/60 transition-colors text-sm cursor-pointer"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleComplete}
                        disabled={completing}
                        className="group relative px-10 py-4 rounded-full text-white font-semibold text-lg overflow-hidden cursor-pointer disabled:cursor-not-allowed"
                    >
                        {/* Button glow bg */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/10 border border-white/20 rounded-full group-hover:from-white/20 group-hover:to-white/15 group-hover:border-white/30 transition-all duration-300" />
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ boxShadow: "0 0 40px rgba(255, 255, 255, 0.15)" }}
                        />
                        <span className="relative z-10 flex items-center gap-2">
                            Let's Go! 🚀
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
