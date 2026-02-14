import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSetup } from "../../hooks/useSetup";
import { useResponsive } from "../../hooks/useResponsive";
import WelcomeStep from "./steps/WelcomeStep";
import ProfileStep from "./steps/ProfileStep";
import PrivacyStep from "./steps/PrivacyStep";
import ConnectStep from "./steps/ConnectStep";
import GenreStep from "./steps/GenreStep";
import InterfaceStep from "./steps/InterfaceStep";

const TOTAL_STEPS = 6;

export default function SetupWizard() {
    const navigate = useNavigate();
    const { setup, updateSetup, completeSetup } = useSetup();
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<"forward" | "backward">("forward");
    const [isMuted, setIsMuted] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isMobile } = useResponsive();

    const videoSrc = isMobile
        ? "/setup/welcome-bg-mobile.mp4"
        : "/setup/welcome-bg-desktop.mp4";

    const goNext = useCallback(() => {
        setDirection("forward");
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }, []);

    const goBack = useCallback(() => {
        setDirection("backward");
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    }, []);

    const handleComplete = useCallback(() => {
        completeSetup();
        setTimeout(() => navigate("/", { replace: true }), 100);
    }, [completeSetup, navigate]);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <WelcomeStep onNext={goNext} />;
            case 1:
                return (
                    <ProfileStep
                        displayName={setup.displayName}
                        avatarIndex={setup.avatarIndex}
                        isAdult={setup.isAdult}
                        onUpdate={(data) => updateSetup(data)}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 2:
                return <PrivacyStep onNext={goNext} onBack={goBack} />;
            case 3:
                return (
                    <ConnectStep
                        connectedAniList={setup.connectedAniList}
                        connectedGDrive={setup.connectedGDrive}
                        onUpdate={(data) => updateSetup(data)}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 4:
                return (
                    <GenreStep
                        preferredGenres={setup.preferredGenres}
                        onUpdate={(genres) => updateSetup({ preferredGenres: genres })}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 5:
                return (
                    <InterfaceStep
                        contentMode={setup.contentMode}
                        onUpdate={(mode) => updateSetup({ contentMode: mode })}
                        onComplete={handleComplete}
                        onBack={goBack}
                    />
                );
            default:
                return <WelcomeStep onNext={goNext} />;
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* ============ PERSISTENT VIDEO BACKGROUND ============ */}
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

            {/* 4-Edge Vignette — persists across all steps */}
            <div className="absolute inset-0 pointer-events-none z-[1]" style={{
                boxShadow: "inset 0 0 150px 60px rgba(0, 0, 0, 0.7)",
            }} />

            {/* ============ STEP CONTENT (transparent bg, renders on top) ============ */}
            <div
                key={currentStep}
                className="absolute inset-0 z-[2]"
                style={{
                    animation: `${direction === "forward" ? "setup-slide-in-right" : "setup-slide-in-left"} 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both`,
                }}
            >
                {renderStep()}
            </div>

            {/* ============ PERSISTENT UI CONTROLS ============ */}

            {/* Mute/Unmute Button — always visible, top right */}
            {!videoError && (
                <button
                    onClick={toggleMute}
                    className="absolute top-6 right-6 z-[5] w-11 h-11 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 hover:border-white/20 transition-all cursor-pointer active:scale-90"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 14.25H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 15.75H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                    )}
                </button>
            )}

            {/* Progress Dots (hidden on welcome screen) */}
            {currentStep > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[5] flex items-center gap-2">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div
                            key={i}
                            className={`
                                rounded-full transition-all duration-500
                                ${i === currentStep
                                    ? "w-8 h-2 bg-white/60"
                                    : i < currentStep
                                        ? "w-2 h-2 bg-white/30"
                                        : "w-2 h-2 bg-white/10"
                                }
                            `}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
