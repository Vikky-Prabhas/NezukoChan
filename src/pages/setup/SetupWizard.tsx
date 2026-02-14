import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSetup } from "../../hooks/useSetup";
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
        // Navigate to home after brief delay for the celebration animation
        setTimeout(() => navigate("/", { replace: true }), 100);
    }, [completeSetup, navigate]);

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
            {/* Step Content with Transition */}
            <div
                key={currentStep}
                className="absolute inset-0"
                style={{
                    animation: `${direction === "forward" ? "setup-slide-in-right" : "setup-slide-in-left"} 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both`,
                }}
            >
                {renderStep()}
            </div>

            {/* Progress Dots (hidden on welcome screen) */}
            {currentStep > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
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
