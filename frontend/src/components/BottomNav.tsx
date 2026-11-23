"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, Heart, User } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/explore", icon: Compass, label: "Explore" },
        { href: "/create", icon: PlusSquare, label: "Create" },
        { href: "/notifications", icon: Heart, label: "Notifications" },
        { href: "/profile/me", icon: User, label: "Profile" },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#101114] border-t border-[#22242B] pb-safe z-40">
            <div className="flex justify-around items-center h-16">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-[#E16B55]" : "text-[#55535B] hover:text-[#F1F0EB]"
                                }`}
                        >
                            <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
