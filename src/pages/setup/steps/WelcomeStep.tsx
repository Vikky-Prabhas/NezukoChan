import { useEffect, useState } from "react";

interface WelcomeStepProps {
    onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
    const [show, setShow] = useState(false);
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        // Staggered reveal animation
        const timer = setTimeout(() => setShow(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Background Video or Gradient Fallback */}
            {!videoError ? (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                    onError={() => setVideoError(true)}
                >
                    <source src="/setup/welcome-bg.mp4" type="video/mp4" />
                </video>
            ) : (
                <div className="absolute inset-0">
                    {/* Animated gradient fallback when no video */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            background:
                                "radial-gradient(ellipse at 20% 50%, rgba(120, 50, 180, 0.4) 0%, transparent 60%), " +
                                "radial-gradient(ellipse at 80% 20%, rgba(50, 100, 200, 0.3) 0%, transparent 50%), " +
                                "radial-gradient(ellipse at 50% 80%, rgba(200, 50, 100, 0.2) 0%, transparent 50%)",
                            animation: "slow-zoom 20s linear infinite alternate",
                        }}
                    />
                </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
                {/* Logo Mark */}
                <div
                    className="transition-all duration-1000 ease-out"
                    style={{
                        opacity: show ? 1 : 0,
                        transform: show ? "translateY(0) scale(1)" : "translateY(30px) scale(0.9)",
                    }}
                >
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
                        <span className="text-4xl">🌸</span>
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-6xl md:text-7xl font-black tracking-tight text-white mb-4 text-center transition-all duration-1000 delay-200 ease-out"
                    style={{
                        opacity: show ? 1 : 0,
                        transform: show ? "translateY(0)" : "translateY(20px)",
                        fontFamily: "'Playfair Display', serif",
                    }}
                >
                    NezukoChan
                </h1>

                {/* Tagline */}
                <p
                    className="text-lg md:text-xl text-white/50 font-light tracking-widest uppercase mb-16 text-center transition-all duration-1000 delay-400 ease-out"
                    style={{
                        opacity: show ? 1 : 0,
                        transform: show ? "translateY(0)" : "translateY(20px)",
                    }}
                >
                    Your anime, your way
                </p>

                {/* CTA Button */}
                <button
                    onClick={onNext}
                    className="group relative px-10 py-4 rounded-full text-white font-semibold text-lg tracking-wide overflow-hidden transition-all duration-500 delay-700 ease-out cursor-pointer"
                    style={{
                        opacity: show ? 1 : 0,
                        transform: show ? "translateY(0)" : "translateY(20px)",
                    }}
                >
                    {/* Button Background */}
                    <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm group-hover:bg-white/15 group-hover:border-white/30 transition-all duration-300" />

                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: "0 0 40px rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.05)" }}
                    />

                    <span className="relative z-10 flex items-center gap-3">
                        Get Started
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                </button>

                {/* Version */}
                <p
                    className="absolute bottom-8 text-xs text-white/20 tracking-widest transition-all duration-1000 delay-1000"
                    style={{ opacity: show ? 1 : 0 }}
                >
                    v1.0.0 • OPEN SOURCE
                </p>
            </div>
        </div>
    );
}
