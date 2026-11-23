"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { user, login } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            router.push("/");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to sign in. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#101114] p-4 text-[#F1F0EB]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#22242B] border border-[#55535B]/30 rounded-2xl shadow-2xl p-8"
            >
                <div className="text-center mb-8 flex flex-col items-center">
                    <Link href="/" className="inline-block mb-3">
                        <img src="/logo.png" alt=".ROOT" className="h-12 w-auto object-contain" />
                    </Link>
                    <p className="text-[#55535B]">Welcome back</p>
                </div>

                {error && (
                    <div className="bg-[#101114] border border-[#E16B55]/60 text-[#E16B55] p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#E16B55]" />
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-[#55535B]" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#101114] border border-[#55535B]/40 rounded-xl focus:border-[#E16B55] focus:ring-1 focus:ring-[#E16B55] outline-none transition-all text-[#F1F0EB] placeholder-[#55535B]"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-[#55535B]" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#101114] border border-[#55535B]/40 rounded-xl focus:border-[#E16B55] focus:ring-1 focus:ring-[#E16B55] outline-none transition-all text-[#F1F0EB] placeholder-[#55535B]"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#E16B55] hover:bg-[#E16B55]/90 text-[#F1F0EB] rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 active:scale-98 cursor-pointer"
                    >
                        {loading && <Loader2 className="h-5 w-5 animate-spin text-[#F1F0EB]" />}
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-[#55535B]">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[#F1F0EB] font-semibold hover:text-[#E16B55] transition-colors">
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
