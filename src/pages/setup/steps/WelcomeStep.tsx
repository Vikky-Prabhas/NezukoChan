import { useEffect, useRef, useState } from "react";
import { useResponsive } from "../../../hooks/useResponsive";

interface WelcomeStepProps {
    onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
    const [show, setShow] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isMobile } = useResponsive();

    const videoSrc = isMobile
        ? "/setup/welcome-bg-mobile.mp4"
        : "/setup/welcome-bg-desktop.mp4";

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Background Video — clear, no blur, no dark tint */}
            {!videoError ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setVideoError(true)}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
            ) : (
                <div className="absolute inset-0">
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

            {/* 4-Edge Vignette — medium blackish shadows on all edges, clear center */}
            <div className="absolute inset-0 pointer-events-none" style={{
                boxShadow: "inset 0 0 150px 60px rgba(0, 0, 0, 0.7)",
            }} />

            {/* Mute/Unmute Button — top right */}
            {!videoError && (
                <button
                    onClick={toggleMute}
                    className="absolute top-6 right-6 z-20 w-11 h-11 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 hover:border-white/20 transition-all cursor-pointer active:scale-90"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        /* Muted Icon */
                        <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 14.25H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                    ) : (
                        /* Unmuted Icon */
                        <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 15.75H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                    )}
                </button>
            )}

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
                    <div className="w-20 h-20 rounded-2xl bg-black/30 border border-white/15 backdrop-blur-md flex items-center justify-center mb-8 mx-auto shadow-2xl">
                        <span className="text-4xl">🌸</span>
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-6xl md:text-7xl font-black tracking-tight text-white mb-4 text-center transition-all duration-1000 delay-200 ease-out drop-shadow-lg"
                    style={{
                        opacity: show ? 1 : 0,
                        transform: show ? "translateY(0)" : "translateY(20px)",
                        fontFamily: "'Playfair Display', serif",
                        textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                    }}
                >
                    NezukoChan
                </h1>

                {/* Tagline */}
                <p
                    className="text-lg md:text-xl text-white/70 font-light tracking-widest uppercase mb-16 text-center transition-all duration-1000 delay-400 ease-out"
                    style={{
                        opacity: show ? 1 : 0,
                        transform: show ? "translateY(0)" : "translateY(20px)",
                        textShadow: "0 1px 10px rgba(0,0,0,0.5)",
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
                    <div className="absolute inset-0 bg-black/40 border border-white/20 rounded-full backdrop-blur-sm group-hover:bg-black/50 group-hover:border-white/35 transition-all duration-300" />

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
                    className="absolute bottom-8 text-xs text-white/30 tracking-widest transition-all duration-1000 delay-1000"
                    style={{ opacity: show ? 1 : 0, textShadow: "0 1px 5px rgba(0,0,0,0.5)" }}
                >
                    v1.0.0 • OPEN SOURCE
                </p>
            </div>
        </div>
    );
}
