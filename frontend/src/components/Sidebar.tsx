"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, User, LogOut, MessageCircle, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const links = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/explore", icon: Compass, label: "Explore" },
        { href: "/create", icon: PlusSquare, label: "Create" },
        { href: "/notifications", icon: Bell, label: "Notifications" },
        { href: "/messages", icon: MessageCircle, label: "Messages" },
        { href: "/profile/me", icon: User, label: "Profile" },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-[#22242B] bg-[#101114] p-4 text-[#F1F0EB]">
            <div className="mb-8 px-4 flex items-center">
                <Link href="/" className="inline-block">
                    <img src="/logo.png" alt=".ROOT" className="h-9 w-auto object-contain" />
                </Link>
            </div>

            <nav className="flex-1 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive
                                ? "bg-[#22242B] text-[#F1F0EB] font-semibold border-l-2 border-[#E16B55]"
                                : "text-[#55535B] hover:bg-[#22242B]/60 hover:text-[#F1F0EB]"
                                }`}
                        >
                            <Icon className={`h-6 w-6 ${isActive ? "text-[#E16B55]" : ""}`} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={logout}
                className="flex items-center gap-4 px-4 py-3 text-[#E16B55] hover:bg-[#E16B55]/10 rounded-xl transition-all mt-auto"
            >
                <LogOut className="h-6 w-6" />
                <span>Logout</span>
            </button>
        </div>
    );
}
