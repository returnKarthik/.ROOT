"use client";

import { useState, useEffect } from "react";
import Feed from "@/components/Feed";
import { fetchWithAuth } from "@/lib/api";

export default function ExplorePage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await fetchWithAuth(`/users/search/?q=${encodeURIComponent(query)}`);
                setResults(data);
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div className="p-4 text-[#F1F0EB]">
            <h1 className="text-2xl font-bold mb-4">Explore</h1>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full p-3 rounded-xl bg-[#22242B] border border-[#55535B]/30 text-[#F1F0EB] placeholder-[#55535B] focus:border-[#E16B55] focus:ring-1 focus:ring-[#E16B55] outline-none transition"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {query ? (
                <div className="space-y-4 mb-8">
                    {searching && <p className="text-[#55535B]">Searching...</p>}
                    {!searching && results.length === 0 && <p className="text-[#55535B]">No users found.</p>}

                    {results.map(user => (
                        <a key={user.uid} href={`/profile/${user.uid}`} className="flex items-center gap-3 p-3 bg-[#22242B] border border-[#55535B]/20 rounded-xl hover:border-[#E16B55]/40 transition">
                            <div className="h-10 w-10 rounded-full bg-[#101114] overflow-hidden flex-shrink-0 border border-[#55535B]/40">
                                {user.photoURL ? (
                                    <img 
                                        src={user.photoURL} 
                                        alt="" 
                                        className="h-full w-full object-cover" 
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            const filename = user.photoURL?.split('/').pop();
                                            if (filename && !target.src.includes(`/posts/${filename}`)) {
                                                target.src = `/posts/${filename}`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-[#101114] text-[#F1F0EB] font-bold">
                                        {user.displayName?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#F1F0EB]">{user.displayName}</h3>
                                <p className="text-xs text-[#55535B] max-w-[200px] truncate">{user.bio || "No bio"}</p>
                            </div>
                        </a>
                    ))}
                </div>
            ) : null}

            <h2 className="text-xl font-bold mb-4">Global Feed</h2>
            <Feed />
        </div>
    );
}
