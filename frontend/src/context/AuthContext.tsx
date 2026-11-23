"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, getStoredToken, getStoredUser, login as authLogin, register as authRegister, clearAuthSession, fetchMe, setAuthSession } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (displayName: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedToken = getStoredToken();
        const savedUser = getStoredUser();

        if (savedToken && savedUser) {
            setUser(savedUser);
            setToken(savedToken);
            setLoading(false);

            // Verify/refresh user data in background
            fetchMe().then((freshUser) => {
                if (freshUser) {
                    setUser(freshUser);
                } else {
                    setUser(null);
                    setToken(null);
                }
            });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await authLogin(email, password);
        setUser(res.user);
        setToken(res.token);
    };

    const register = async (displayName: string, email: string, password: string) => {
        const res = await authRegister(displayName, email, password);
        setUser(res.user);
        setToken(res.token);
    };

    const logout = () => {
        clearAuthSession();
        setUser(null);
        setToken(null);
        router.push("/login");
    };

    const updateUser = (updatedFields: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...updatedFields };
            if (token) {
                setAuthSession(token, updated);
            }
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
