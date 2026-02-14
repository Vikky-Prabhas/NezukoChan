import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

/**
 * Safely invokes a Tauri command.
 */
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    try {
        // @ts-ignore
        if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
            return await tauriInvoke<T>(cmd, args);
        }

        console.warn(`[Tauri Mock] Invoke '${cmd}' called in browser environment. Returning mock/error.`);
        if (cmd === "get_mappings_command") return {} as T;
        if (cmd === "search_anime_command") return [] as T;

        throw new Error(`Tauri API not available (Browser Mode). Command: ${cmd}`);
    } catch (e) {
        console.warn(`[Safe Invoke] Failed to invoke '${cmd}':`, e);
        throw e;
    }
}

/**
 * Safely performs an HTTP request.
 * Uses Tauri's HTTP plugin if available (to bypass CORS), otherwise falls back to native browser fetch.
 */
export async function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // @ts-ignore
    if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
        try {
            return await tauriFetch(input, init);
        } catch (e) {
            console.warn("[Tauri Fetch] Failed, falling back to native fetch:", e);
        }
    }
    return window.fetch(input, init);
}
