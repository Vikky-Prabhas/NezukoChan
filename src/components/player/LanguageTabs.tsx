import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface LanguageTabsProps {
    availableLanguages: string[];
    selectedLanguage: string | null;
    onSelect: (lang: string) => void;
}

export const LanguageTabs = ({
    availableLanguages,
    selectedLanguage,
    onSelect,
}: LanguageTabsProps) => {
    if (!availableLanguages || availableLanguages.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-widest pl-1">
                Audio Language
            </h3>
            <div className="flex flex-wrap gap-2 p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/5 w-fit min-w-[300px]">
                {availableLanguages.map((lang) => {
                    const isActive = selectedLanguage === lang;
                    return (
                        <button
                            key={lang}
                            onClick={() => onSelect(lang)}
                            className={cn(
                                "relative px-4 py-2 rounded-lg text-sm font-semibold transition-colors z-0 flex-1 min-w-[100px]",
                                isActive ? "text-white" : "text-white/40 hover:text-white/70"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-language-tab"
                                    className="absolute inset-0 bg-white/10 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {lang}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
