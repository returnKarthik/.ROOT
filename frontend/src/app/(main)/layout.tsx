"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#101114]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E16B55]"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#101114] text-[#F1F0EB]">
            <Sidebar />
            <main className="flex-1 md:ml-64 pb-16 md:pb-0 bg-[#101114]">
                <div className="max-w-2xl mx-auto w-full">
                    {children}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
