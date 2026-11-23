const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface User {
    uid: string;
    email: string;
    displayName: string;
    bio?: string;
    photoURL?: string | null;
    followersCount?: number;
    followingCount?: number;
}

const TOKEN_KEY = "grietgo_token";
const USER_KEY = "grietgo_user";

export function getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data) as User;
    } catch {
        return null;
    }
}

export function setAuthSession(token: string, user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timer);
        return response;
    } catch (err: any) {
        clearTimeout(timer);
        if (err.name === "AbortError") {
            throw new Error(`Request timed out. The backend server at ${API_BASE_URL} took too long to respond. Is it running?`);
        }
        throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please make sure the Flask backend is running ('python app.py').`);
    }
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || "Login failed");
    }

    setAuthSession(data.token, data.user);
    return data;
}

export async function register(displayName: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName, email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || "Registration failed");
    }

    setAuthSession(data.token, data.user);
    return data;
}

export async function fetchMe(): Promise<User | null> {
    const token = getStoredToken();
    if (!token) return null;

    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }, 5000);

        if (!res.ok) {
            clearAuthSession();
            return null;
        }

        const user: User = await res.json();
        if (typeof window !== "undefined") {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        return user;
    } catch {
        return null;
    }
}
