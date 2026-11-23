"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";

export default function MessagesPage() {
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchChats() {
            try {
                const data = await fetchWithAuth("/chat/");
                setChats(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (user) fetchChats();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-[#55535B]">Loading chats...</div>;

    return (
        <div className="pb-20 md:pb-0 text-[#F1F0EB]">
            <h1 className="text-2xl font-bold p-6">Messages</h1>
            <div className="flex flex-col">
                {chats.length === 0 ? (
                    <div className="p-6 text-[#55535B] text-center">
                        No messages yet. Start a conversation from a profile!
                    </div>
                ) : (
                    chats.map((chat) => (
                        <Link
                            key={chat.id}
                            href={`/messages/${chat.id}`}
                            className="flex items-center p-4 hover:bg-[#22242B]/60 transition border-b border-[#22242B]"
                        >
                            <div className="h-12 w-12 rounded-full bg-[#22242B] overflow-hidden mr-4 border border-[#55535B]/30">
                                {chat.otherUser?.photoURL ? (
                                    <img 
                                        src={chat.otherUser.photoURL} 
                                        alt="" 
                                        className="h-full w-full object-cover" 
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            const filename = chat.otherUser?.photoURL?.split('/').pop();
                                            if (filename && !target.src.includes(`/posts/${filename}`)) {
                                                target.src = `/posts/${filename}`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-[#22242B] text-[#F1F0EB] font-bold">
                                        {chat.otherUser?.displayName?.[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-[#F1F0EB]">{chat.otherUser?.displayName || "Unknown User"}</h3>
                                <p className="text-sm text-[#55535B] truncate max-w-[200px]">
                                    {chat.lastMessage || "Start chatting"}
                                </p>
                            </div>
                            <div className="text-xs text-[#55535B]">
                                {chat.lastMessageTime ? formatDistanceToNow(new Date(chat.lastMessageTime)) : ""}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
