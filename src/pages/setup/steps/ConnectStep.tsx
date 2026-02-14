import { useState, useEffect } from "react";

interface ConnectStepProps {
    connectedAniList: boolean;
    connectedGDrive: boolean;
    onUpdate: (data: { connectedAniList: boolean; connectedGDrive: boolean }) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function ConnectStep({ connectedAniList, connectedGDrive, onUpdate, onNext, onBack }: ConnectStepProps) {
    const [anilist, setAnilist] = useState(connectedAniList);
    const [gdrive, setGdrive] = useState(connectedGDrive);
    const [show, setShow] = useState(false);
    const [connecting, setConnecting] = useState<"anilist" | "gdrive" | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleConnectAniList = async () => {
        setConnecting("anilist");
        // TODO: Implement real AniList OAuth flow
        // For now, simulate a connection with a brief delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setAnilist(true);
        setConnecting(null);
        onUpdate({ connectedAniList: true, connectedGDrive: gdrive });
    };

    const handleConnectGDrive = async () => {
        setConnecting("gdrive");
        // TODO: Implement real Google Drive OAuth flow
        // For now, simulate a connection with a brief delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setGdrive(true);
        setConnecting(null);
        onUpdate({ connectedAniList: anilist, connectedGDrive: true });
    };

    const handleDisconnect = (service: "anilist" | "gdrive") => {
        if (service === "anilist") {
            setAnilist(false);
            onUpdate({ connectedAniList: false, connectedGDrive: gdrive });
        } else {
            setGdrive(false);
            onUpdate({ connectedAniList: anilist, connectedGDrive: false });
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    background: "radial-gradient(ellipse at 40% 60%, rgba(80, 180, 120, 0.3) 0%, transparent 60%)",
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
                    <div className="flex justify-center mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Supercharge Your Experience
                    </h2>
                    <p className="text-white/40 text-sm">Connect your accounts for the best experience</p>
                </div>

                {/* AniList Card */}
                <div className="mb-4 p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl">📊</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">AniList</h3>
                            <p className="text-white/40 text-sm leading-relaxed mb-3">
                                Track what you watch, sync episode progress & ratings across devices. Your anime list, always up to date.
                            </p>

                            {anilist ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-green-400 text-sm font-medium">Connected</span>
                                    </div>
                                    <button
                                        onClick={() => handleDisconnect("anilist")}
                                        className="text-white/20 hover:text-red-400/60 text-xs transition-colors cursor-pointer"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectAniList}
                                    disabled={connecting === "anilist"}
                                    className="px-5 py-2.5 bg-blue-500/15 border border-blue-500/25 rounded-lg text-blue-300 text-sm font-medium hover:bg-blue-500/20 hover:border-blue-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {connecting === "anilist" ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        "Connect AniList"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Google Drive Card */}
                <div className="mb-8 p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl">☁️</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">Google Drive</h3>
                            <p className="text-white/40 text-sm leading-relaxed mb-3">
                                Backup your collections, watch history & app settings. Never lose your data, sync across devices.
                            </p>

                            {gdrive ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-green-400 text-sm font-medium">Connected</span>
                                    </div>
                                    <button
                                        onClick={() => handleDisconnect("gdrive")}
                                        className="text-white/20 hover:text-red-400/60 text-xs transition-colors cursor-pointer"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGDrive}
                                    disabled={connecting === "gdrive"}
                                    className="px-5 py-2.5 bg-green-500/15 border border-green-500/25 rounded-lg text-green-300 text-sm font-medium hover:bg-green-500/20 hover:border-green-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {connecting === "gdrive" ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        "Connect Google Drive"
                                    )}
                                </button>
                            )}
                        </div>
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onNext}
                            className="text-white/30 hover:text-white/60 text-sm transition-colors cursor-pointer"
                        >
                            Skip for now →
                        </button>
                        <button
                            onClick={onNext}
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
