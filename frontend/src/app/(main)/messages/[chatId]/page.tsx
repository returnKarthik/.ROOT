"use client";

import { useEffect, useState, useRef, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import { Send, ArrowLeft, Image as ImageIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { chatId } = use(params);

    const fetchMessages = async () => {
        try {
            const data = await fetchWithAuth(`/chat/${chatId}/messages/`);
            setMessages(data || []);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
    };

    useEffect(() => {
        if (!user || !chatId) return;

        fetchWithAuth(`/chat/${chatId}/read/`, { method: "POST" }).catch(console.error);
        fetchMessages();

        const intervalId = setInterval(() => {
            fetchMessages();
        }, 2000);

        return () => clearInterval(intervalId);
    }, [chatId, user]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        setInputText("");
        setSending(true);

        try {
            await fetchWithAuth(`/chat/${chatId}/messages/`, {
                method: "POST",
                body: JSON.stringify({ text })
            });
            await fetchMessages();
        } catch (e) {
            console.error(e);
            setInputText(text);
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen bg-[#101114] text-[#F1F0EB]">
            {/* Header */}
            <div className="bg-[#101114] p-4 border-b border-[#22242B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/messages" className="md:hidden">
                        <ArrowLeft className="h-6 w-6 text-[#F1F0EB]" />
                    </Link>
                    <div className="font-bold text-lg text-[#F1F0EB]">Chat</div>
                </div>
                <button
                    onClick={async () => {
                        if (!confirm("Delete this chat? It will disappear for you.")) return;
                        try {
                            await fetchWithAuth(`/chat/${chatId}/`, { method: "DELETE" });
                            window.location.href = "/messages";
                        } catch (e) { console.error(e); alert("Failed to delete chat"); }
                    }}
                    className="p-2 text-[#E16B55] hover:bg-[#22242B] rounded-full transition cursor-pointer"
                    title="Delete Chat"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-[#55535B] mt-10">
                        No messages here. They disappear after reading! 👻
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                            {isMe && (
                                <button
                                    onClick={async () => {
                                        if (!confirm("Delete this message?")) return;
                                        try {
                                            await fetchWithAuth(`/chat/${chatId}/messages/${msg.id}/`, { method: "DELETE" });
                                            setMessages(prev => prev.filter(m => m.id !== msg.id));
                                        } catch (e) { console.error(e); alert("Failed to delete"); }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-[#55535B] hover:text-[#E16B55] transition self-center cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                ? "bg-[#E16B55] text-[#F1F0EB] font-medium rounded-br-none"
                                : "bg-[#22242B] text-[#F1F0EB] rounded-bl-none border border-[#55535B]/20 shadow-sm"
                                }`}>
                                <p>{msg.text}</p>
                                <div className={`text-[10px] mt-1 ${isMe ? "text-[#F1F0EB]/70" : "text-[#55535B]"}`}>
                                    {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : "Just now"}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#101114] border-t border-[#22242B]">
                <form onSubmit={handleSend} className="flex gap-2">
                    <button type="button" className="p-3 text-[#55535B] hover:bg-[#22242B] rounded-full transition">
                        <ImageIcon className="h-6 w-6" />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#22242B] text-[#F1F0EB] placeholder-[#55535B] rounded-full px-4 border border-[#55535B]/30 focus:border-[#E16B55] outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || sending}
                        className="p-3 bg-[#E16B55] text-[#F1F0EB] hover:bg-[#E16B55]/90 rounded-full transition disabled:opacity-50 cursor-pointer"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
