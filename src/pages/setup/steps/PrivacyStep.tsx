import { useState, useEffect } from "react";

interface PrivacyStepProps {
    onNext: () => void;
    onBack: () => void;
}

const COMMUNITY_LINKS = [
    {
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
        ),
        label: "Discord",
        desc: "Join the community",
        url: "#", // TODO: Add your Discord invite link
        color: "from-indigo-500/20 to-purple-500/20",
        borderColor: "hover:border-indigo-500/30",
    },
    {
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.185-1.76.222-.298.019-.595.011-.896.008-.236-.006-.043.025-.058.068-.018.043-.004.099-.004.148 0 .049.002.1.004.148.016.043.003.026.058.068.302-.003.605.01.907.018.595.015 1.194-.017 1.779-.118.657-.113 1.146-.477 1.324-1.137.158-.586.204-1.199.263-1.805.065-.669.127-1.338.19-2.007l.394-4.174.075-.815.083-.576z" />
            </svg>
        ),
        label: "Buy Me a Coffee",
        desc: "Support development",
        url: "#", // TODO: Add your Buy Me a Coffee link
        color: "from-yellow-500/20 to-amber-500/20",
        borderColor: "hover:border-yellow-500/30",
    },
    {
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
        ),
        label: "Website",
        desc: "Learn more",
        url: "#", // TODO: Add your website URL
        color: "from-cyan-500/20 to-blue-500/20",
        borderColor: "hover:border-cyan-500/30",
    },
    {
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        ),
        label: "GitHub",
        desc: "Star the repo",
        url: "https://github.com/Vikky-Prabhas/NezukoChan",
        color: "from-white/10 to-white/5",
        borderColor: "hover:border-white/30",
    },
];

export default function PrivacyStep({ onNext, onBack }: PrivacyStepProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const openExternalLink = (url: string) => {
        if (url !== "#") {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    background: "radial-gradient(ellipse at 60% 30%, rgba(50, 130, 200, 0.3) 0%, transparent 60%)",
                }}
            />

            <div
                className="relative z-10 w-full max-w-lg px-6 transition-all duration-700 ease-out"
                style={{
                    opacity: show ? 1 : 0,
                    transform: show ? "translateY(0)" : "translateY(30px)",
                }}
            >
                {/* Shield Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Your Privacy, Our Promise
                    </h2>
                </div>

                {/* Privacy Points */}
                <div className="space-y-4 mb-10">
                    {[
                        { icon: "🚫", text: "No servers. No tracking. Zero data collection." },
                        { icon: "🔓", text: "100% open source — inspect every line of code." },
                        { icon: "💾", text: "Your data stays on YOUR device (or your Google Drive)." },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-5 py-4 bg-white/[0.03] border border-white/5 rounded-xl transition-all duration-500"
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-white/20 text-xs tracking-widest uppercase">Join the Colony</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Community Links */}
                <div className="grid grid-cols-2 gap-3 mb-10">
                    {COMMUNITY_LINKS.map((link, i) => (
                        <button
                            key={i}
                            onClick={() => openExternalLink(link.url)}
                            className={`flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br ${link.color} border border-white/5 ${link.borderColor} rounded-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-95`}
                        >
                            <span className="text-white/70">{link.icon}</span>
                            <div className="text-left">
                                <p className="text-white/80 text-sm font-medium">{link.label}</p>
                                <p className="text-white/30 text-xs">{link.desc}</p>
                            </div>
                        </button>
                    ))}
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
                        onClick={onNext}
                        className="px-8 py-3 bg-white/10 border border-white/15 rounded-full text-white font-medium hover:bg-white/15 hover:border-white/25 transition-all cursor-pointer"
                    >
                        Continue →
                    </button>
                </div>
            </div>
        </div>
    );
}
