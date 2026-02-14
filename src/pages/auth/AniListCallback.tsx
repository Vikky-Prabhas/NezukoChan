/**
 * AniList OAuth Callback Page
 *
 * Route: /auth/anilist/callback
 * AniList redirects here with #access_token=... in the URL fragment.
 * We extract the token, fetch the user profile, save everything, and redirect.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AniListAuth, extractTokenFromHash, saveToken } from "../../services/anilistAuth";
import { getSetupData } from "../../hooks/useSetup";

type CallbackState = "extracting" | "fetching_profile" | "success" | "error";

export default function AniListCallback() {
    const navigate = useNavigate();
    const [state, setState] = useState<CallbackState>("extracting");
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        const processCallback = async () => {
            try {
                // 1. Extract token from URL hash
                const hash = window.location.hash;
                const tokenData = extractTokenFromHash(hash);

                if (!tokenData) {
                    throw new Error("No access token found in the redirect URL. Please try connecting again.");
                }

                // 2. Save token
                saveToken(tokenData);
                setState("fetching_profile");

                // 3. Fetch user profile
                const viewer = await AniListAuth.fetchViewerProfile();
                setUserName(viewer.name);

                // 4. Update setup data
                const setupData = getSetupData();
                const updatedSetup = {
                    ...setupData,
                    connectedAniList: true,
                    anilistToken: tokenData.access_token,
                    anilistUser: {
                        id: viewer.id,
                        name: viewer.name,
                        avatar: viewer.avatar?.medium || null,
                    },
                };
                localStorage.setItem("nezuko_setup", JSON.stringify(updatedSetup));

                setState("success");

                // 5. Redirect after brief celebration
                setTimeout(() => {
                    // Go back to setup wizard if not complete, otherwise go to profile
                    if (!setupData.setupComplete) {
                        navigate("/setup", { replace: true });
                    } else {
                        navigate("/profile", { replace: true });
                    }
                }, 2000);

            } catch (err) {
                console.error("[AniList Callback] Error:", err);
                setError(err instanceof Error ? err.message : "Unknown error during authentication");
                setState("error");
            }
        };

        processCallback();
    }, [navigate]);

    return (
        <div className="w-full h-screen bg-black flex items-center justify-center">
            <div className="text-center px-6">
                {state === "extracting" && (
                    <div className="animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                        <p className="text-white/70 text-lg">Extracting authentication token...</p>
                    </div>
                )}

                {state === "fetching_profile" && (
                    <div className="animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <p className="text-white/70 text-lg">Fetching your AniList profile...</p>
                    </div>
                )}

                {state === "success" && (
                    <div style={{ animation: "scale-in 0.5s ease-out both" }}>
                        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome, {userName}!</h2>
                        <p className="text-white/50">Your AniList account is now connected. Redirecting...</p>
                    </div>
                )}

                {state === "error" && (
                    <div>
                        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
                        <p className="text-white/50 mb-6 max-w-md">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
                        >
                            Go Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
