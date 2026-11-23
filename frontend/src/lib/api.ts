import { getStoredToken, clearAuthSession } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = getStoredToken();

    const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (networkError: any) {
        console.warn(`[.ROOT API] Could not connect to backend at ${API_BASE_URL}${endpoint}.`, networkError);
        throw new Error(
            `Backend server unreachable (${API_BASE_URL}). Please verify that the Flask backend is running on port 8000.`
        );
    }

    if (res.status === 401 && typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
            clearAuthSession();
        }
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || error.message || `Request failed with status ${res.status}`);
    }

    if (res.status === 204) return null;

    return res.json();
}
