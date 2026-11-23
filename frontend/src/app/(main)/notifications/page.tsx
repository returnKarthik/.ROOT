"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Notification {
    id: string;
    type: 'like' | 'comment' | 'follow';
    senderId: string;
    senderName: string;
    senderPhotoURL?: string;
    entityId: string;
    text?: string;
    createdAt: string;
    read: boolean;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWithAuth("/notifications/")
            .then(data => {
                setNotifications(data || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-[#55535B]">Loading notifications...</div>;

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#55535B]">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p>No new notifications.</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto pb-20 md:py-8 text-[#F1F0EB]">
            <h1 className="text-2xl font-bold px-4 mb-6">Notifications</h1>

            <div className="flex flex-col">
                {notifications.map((note) => (
                    <div
                        key={note.id}
                        className={`
                            flex items-start gap-4 p-4 border-b border-[#22242B] 
                            hover:bg-[#22242B]/40 transition cursor-pointer relative
                            ${!note.read ? 'bg-[#22242B]/50' : ''}
                        `}
                    >
                        <Link
                            href={note.type === 'follow' ? `/profile/${note.senderId}` : `/profile/me`}
                            className="absolute inset-0"
                            aria-label="View details"
                        />

                        {/* Icon */}
                        <div className="relative flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-[#22242B] overflow-hidden border border-[#55535B]/40">
                                {note.senderPhotoURL ? (
                                    <img 
                                        src={note.senderPhotoURL} 
                                        className="h-full w-full object-cover" 
                                        alt="" 
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            const filename = note.senderPhotoURL?.split('/').pop();
                                            if (filename && !target.src.includes(`/posts/${filename}`)) {
                                                target.src = `/posts/${filename}`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center font-bold text-[#F1F0EB] text-xs">
                                        {note.senderName[0]}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#101114] shadow-sm border border-[#22242B]">
                                {note.type === 'like' && <Heart className="h-3 w-3 text-[#E16B55] fill-current" />}
                                {note.type === 'comment' && <MessageCircle className="h-3 w-3 text-[#F1F0EB] fill-current" />}
                                {note.type === 'follow' && <UserPlus className="h-3 w-3 text-[#E16B55]" />}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 relative z-10 pointer-events-none">
                            <p className="text-sm">
                                <span className="font-semibold text-[#F1F0EB]">{note.senderName}</span>
                                <span className="text-[#55535B] mx-1">
                                    {note.type === 'like' && "liked your post."}
                                    {note.type === 'comment' && `commented: "${note.text}"`}
                                    {note.type === 'follow' && "started following you."}
                                </span>
                            </p>
                            <p className="text-xs text-[#55535B] mt-1">
                                {note.createdAt ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true }) : 'Just now'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
