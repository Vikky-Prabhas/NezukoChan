import { useState, useCallback } from "react";

export interface AniListUser {
    id: number;
    name: string;
    avatar: string | null;
}

export interface SetupData {
    displayName: string;
    avatarIndex: number;
    isAdult: boolean;
    connectedAniList: boolean;
    connectedGDrive: boolean;
    preferredGenres: string[];
    contentMode: "anime" | "cartoon" | "both";
    setupComplete: boolean;
    setupCompletedAt: string | null;
    // OAuth tokens
    anilistToken: string | null;
    anilistUser: AniListUser | null;
    gdriveToken: string | null;
}

const STORAGE_KEY = "nezuko_setup";

const defaultSetup: SetupData = {
    displayName: "",
    avatarIndex: 0,
    isAdult: false,
    connectedAniList: false,
    connectedGDrive: false,
    preferredGenres: [],
    contentMode: "anime",
    setupComplete: false,
    setupCompletedAt: null,
    anilistToken: null,
    anilistUser: null,
    gdriveToken: null,
};

function loadSetup(): SetupData {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return { ...defaultSetup, ...JSON.parse(raw) };
        }
    } catch {
        // corrupted data, reset
    }
    return { ...defaultSetup };
}

function saveSetup(data: SetupData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useSetup() {
    const [setup, setSetup] = useState<SetupData>(loadSetup);

    const updateSetup = useCallback((partial: Partial<SetupData>) => {
        setSetup((prev) => {
            const updated = { ...prev, ...partial };
            saveSetup(updated);
            return updated;
        });
    }, []);

    const completeSetup = useCallback(() => {
        setSetup((prev) => {
            const updated = {
                ...prev,
                setupComplete: true,
                setupCompletedAt: new Date().toISOString(),
            };
            saveSetup(updated);
            return updated;
        });
    }, []);

    const resetSetup = useCallback(() => {
        const fresh = { ...defaultSetup };
        saveSetup(fresh);
        setSetup(fresh);
    }, []);

    return {
        setup,
        updateSetup,
        completeSetup,
        resetSetup,
        isSetupComplete: setup.setupComplete,
    };
}

export function isSetupComplete(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            return data.setupComplete === true;
        }
    } catch {
        // ignore
    }
    return false;
}

/** Read setup data outside of React (for service layer) */
export function getSetupData(): SetupData {
    return loadSetup();
}
