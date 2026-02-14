/**
 * Google Drive Backup Service
 *
 * Uses Google Identity Services (GSI) for OAuth2 token acquisition,
 * then uses the Drive REST API v3 for file operations.
 *
 * We use the `drive.appdata` scope which gives us a hidden app-specific
 * folder in the user's Drive — we can't see their files, they can't
 * see our backup files. Perfect isolation.
 */

// ─── Configuration ────────────────────────────────
// User must provide their Google Cloud OAuth Client ID
let GDRIVE_CLIENT_ID = "";

const SCOPES = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const BACKUP_FILENAME = "nezukochan_backup.json";

// Token storage
const GDRIVE_TOKEN_KEY = "nezuko_gdrive_token";

// ─── GSI Script Loader ────────────────────────────

let gsiLoaded = false;
let tokenClient: any = null;

export function setGDriveClientId(clientId: string): void {
    GDRIVE_CLIENT_ID = clientId;
}

function loadGSIScript(): Promise<void> {
    if (gsiLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            gsiLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
        document.head.appendChild(script);
    });
}

// ─── Token Management ─────────────────────────────

export interface GDriveTokenData {
    access_token: string;
    expires_in: number;
    saved_at: number;
}

export function saveGDriveToken(token: GDriveTokenData): void {
    localStorage.setItem(GDRIVE_TOKEN_KEY, JSON.stringify(token));
}

export function getGDriveToken(): string | null {
    try {
        const raw = localStorage.getItem(GDRIVE_TOKEN_KEY);
        if (!raw) return null;
        const data: GDriveTokenData = JSON.parse(raw);
        const elapsed = (Date.now() - data.saved_at) / 1000;
        if (elapsed >= data.expires_in) {
            clearGDriveToken();
            return null;
        }
        return data.access_token;
    } catch {
        return null;
    }
}

export function clearGDriveToken(): void {
    localStorage.removeItem(GDRIVE_TOKEN_KEY);
}

export function isGDriveAuthenticated(): boolean {
    return getGDriveToken() !== null;
}

// ─── OAuth Flow ───────────────────────────────────

/**
 * Initialize GSI and request access. Returns access_token via a Promise.
 */
export async function requestGDriveAccess(): Promise<string> {
    if (!GDRIVE_CLIENT_ID) {
        throw new Error("Google Drive Client ID not configured. Please add it in Settings.");
    }

    await loadGSIScript();

    return new Promise((resolve, reject) => {
        // @ts-ignore - google is loaded by GSI script
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GDRIVE_CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
                if (response.error) {
                    reject(new Error(response.error_description || response.error));
                    return;
                }

                const tokenData: GDriveTokenData = {
                    access_token: response.access_token,
                    expires_in: response.expires_in || 3600,
                    saved_at: Date.now(),
                };
                saveGDriveToken(tokenData);
                resolve(response.access_token);
            },
        });

        tokenClient.requestAccessToken();
    });
}

// ─── Drive API Operations ─────────────────────────

interface DriveFile {
    id: string;
    name: string;
    modifiedTime: string;
    size: string;
}

/**
 * List existing backup files in the app's hidden folder.
 */
export async function listBackups(): Promise<DriveFile[]> {
    const token = getGDriveToken();
    if (!token) throw new Error("Not authenticated with Google Drive");

    const params = new URLSearchParams({
        spaces: "appDataFolder",
        fields: "files(id, name, modifiedTime, size)",
        orderBy: "modifiedTime desc",
        q: `name = '${BACKUP_FILENAME}'`,
    });

    const res = await window.fetch(`${DRIVE_API}/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
    const data = await res.json();
    return data.files || [];
}

/**
 * Backup all localStorage data to Google Drive.
 */
export async function backupToGDrive(): Promise<{ fileId: string; timestamp: string }> {
    const token = getGDriveToken();
    if (!token) throw new Error("Not authenticated with Google Drive");

    // Collect all nezuko_ localStorage keys
    const backupData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("nezuko_")) {
            try {
                backupData[key] = JSON.parse(localStorage.getItem(key) || "null");
            } catch {
                backupData[key] = localStorage.getItem(key);
            }
        }
    }

    const backupPayload = {
        version: 1,
        timestamp: new Date().toISOString(),
        app: "NezukoChan",
        data: backupData,
    };

    // Check if a backup file already exists (update it, don't create duplicates)
    const existing = await listBackups();

    if (existing.length > 0) {
        // Update existing file
        const fileId = existing[0].id;
        const res = await window.fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(backupPayload),
            }
        );
        if (!res.ok) throw new Error(`Failed to update backup: ${res.status}`);
        return { fileId, timestamp: backupPayload.timestamp };
    } else {
        // Create new file in appDataFolder
        const metadata = {
            name: BACKUP_FILENAME,
            parents: ["appDataFolder"],
        };

        const form = new FormData();
        form.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        form.append(
            "file",
            new Blob([JSON.stringify(backupPayload)], { type: "application/json" })
        );

        const res = await window.fetch(
            `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            }
        );
        if (!res.ok) throw new Error(`Failed to create backup: ${res.status}`);
        const file = await res.json();
        return { fileId: file.id, timestamp: backupPayload.timestamp };
    }
}

/**
 * Restore data from Google Drive backup.
 */
export async function restoreFromGDrive(): Promise<{ keysRestored: number; timestamp: string }> {
    const token = getGDriveToken();
    if (!token) throw new Error("Not authenticated with Google Drive");

    const files = await listBackups();
    if (files.length === 0) throw new Error("No backup found on Google Drive");

    const fileId = files[0].id;
    const res = await window.fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to download backup: ${res.status}`);
    const backup = await res.json();

    if (!backup.data || backup.version !== 1) {
        throw new Error("Invalid backup format");
    }

    // Restore each key
    let count = 0;
    for (const [key, value] of Object.entries(backup.data)) {
        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        count++;
    }

    return { keysRestored: count, timestamp: backup.timestamp };
}

// ─── Export Service ───────────────────────────────
export const GDriveService = {
    setClientId: setGDriveClientId,
    requestAccess: requestGDriveAccess,
    isAuthenticated: isGDriveAuthenticated,
    getToken: getGDriveToken,
    clearToken: clearGDriveToken,
    listBackups,
    backup: backupToGDrive,
    restore: restoreFromGDrive,
};
