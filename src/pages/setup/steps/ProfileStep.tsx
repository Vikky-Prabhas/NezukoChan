import { useState, useEffect } from "react";

interface ProfileStepProps {
    displayName: string;
    avatarIndex: number;
    isAdult: boolean;
    onUpdate: (data: { displayName: string; avatarIndex: number; isAdult: boolean }) => void;
    onNext: () => void;
    onBack: () => void;
}

// 8 preset avatar options — anime-inspired silhouettes using emoji + colored backgrounds
const AVATARS = [
    { emoji: "🌸", bg: "from-pink-500/20 to-purple-500/20", border: "border-pink-500/30" },
    { emoji: "⚡", bg: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
    { emoji: "🔥", bg: "from-red-500/20 to-orange-500/20", border: "border-red-500/30" },
    { emoji: "💎", bg: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30" },
    { emoji: "🌙", bg: "from-indigo-500/20 to-purple-500/20", border: "border-indigo-500/30" },
    { emoji: "🍃", bg: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30" },
    { emoji: "🎭", bg: "from-violet-500/20 to-fuchsia-500/20", border: "border-violet-500/30" },
    { emoji: "⭐", bg: "from-amber-500/20 to-yellow-500/20", border: "border-amber-500/30" },
];

export default function ProfileStep({ displayName, avatarIndex, isAdult, onUpdate, onNext, onBack }: ProfileStepProps) {
    const [name, setName] = useState(displayName);
    const [avatar, setAvatar] = useState(avatarIndex);
    const [adult, setAdult] = useState(isAdult);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleNext = () => {
        onUpdate({ displayName: name.trim() || "Anime Fan", avatarIndex: avatar, isAdult: adult });
        onNext();
    };

    return (
        <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
            {/* Subtle Background */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    background: "radial-gradient(ellipse at 30% 40%, rgba(120, 50, 180, 0.3) 0%, transparent 60%)",
                }}
            />

            <div
                className="relative z-10 w-full max-w-lg px-6 transition-all duration-700 ease-out"
                style={{
                    opacity: show ? 1 : 0,
                    transform: show ? "translateY(0)" : "translateY(30px)",
                }}
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        What should we call you?
                    </h2>
                    <p className="text-white/40 text-sm">Personalize your experience</p>
                </div>

                {/* Name Input */}
                <div className="mb-10">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        maxLength={30}
                        className="w-full px-6 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-white text-lg placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all duration-300 backdrop-blur-sm"
                    />
                </div>

                {/* Avatar Selection */}
                <div className="mb-10">
                    <p className="text-white/40 text-sm mb-4 text-center">Choose your avatar</p>
                    <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
                        {AVATARS.map((av, i) => (
                            <button
                                key={i}
                                onClick={() => setAvatar(i)}
                                className={`
                  relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl
                  bg-gradient-to-br ${av.bg} border ${avatar === i ? av.border : "border-white/5"}
                  transition-all duration-300 cursor-pointer
                  ${avatar === i ? "scale-110 shadow-lg" : "hover:scale-105 hover:border-white/15"}
                `}
                            >
                                {av.emoji}
                                {avatar === i && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Age Gate */}
                <div className="mb-10">
                    <button
                        onClick={() => setAdult(!adult)}
                        className="flex items-center gap-3 mx-auto px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                    >
                        <div className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center ${adult ? "bg-white/20 justify-end" : "bg-white/5 justify-start"}`}>
                            <div className={`w-5 h-5 rounded-full mx-0.5 transition-all duration-300 ${adult ? "bg-white" : "bg-white/30"}`} />
                        </div>
                        <span className="text-white/50 text-sm">I am 18+</span>
                    </button>
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
                        onClick={handleNext}
                        className="px-8 py-3 bg-white/10 border border-white/15 rounded-full text-white font-medium hover:bg-white/15 hover:border-white/25 transition-all cursor-pointer"
                    >
                        Continue →
                    </button>
                </div>
            </div>
        </div>
    );
}
