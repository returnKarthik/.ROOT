"use client";

import { Heart, MessageCircle, Send, Bookmark, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/api";

interface PostProps {
    post: {
        id: string;
        authorName: string;
        authorPhotoURL?: string;
        imageUrl: string;
        caption: string;
        likesCount: number;
        createdAt: string;
    };
    onDelete?: () => void;
    onCommentClick?: () => void;
}

export default function PostCard({ post, onDelete, onCommentClick }: PostProps) {
    const [likes, setLikes] = useState(post.likesCount);
    const [isLiked, setIsLiked] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLike = async () => {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikes(prev => newLikedState ? prev + 1 : prev - 1);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 200);

        try {
            const endpoint = `/posts/${post.id}/like/`;
            const method = newLikedState ? 'POST' : 'DELETE';
            await fetchWithAuth(endpoint, { method });
        } catch (e) {
            console.error(e);
            setIsLiked(!newLikedState);
            setLikes(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#22242B] border border-[#22242B] md:border-[#55535B]/30 md:rounded-2xl mb-4 text-[#F1F0EB] shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center p-3 border-b border-[#101114]/40">
                <div className="h-8 w-8 rounded-full bg-[#101114] overflow-hidden mr-3 border border-[#55535B]/40">
                    {post.authorPhotoURL ? (
                        <img 
                            src={post.authorPhotoURL} 
                            alt={post.authorName} 
                            className="h-full w-full object-cover" 
                            onError={(e) => {
                                const target = e.currentTarget;
                                const filename = post.authorPhotoURL?.split('/').pop();
                                if (filename && !target.src.includes(`/posts/${filename}`)) {
                                    target.src = `/posts/${filename}`;
                                }
                            }}
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-[#101114] text-[#F1F0EB] text-xs font-bold">
                            {post.authorName[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <span className="font-semibold text-sm text-[#F1F0EB]">{post.authorName}</span>
                <span className="ml-auto text-xs text-[#55535B]">
                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                </span>
            </div>

            {/* Image */}
            <div className="aspect-square w-full bg-[#101114] overflow-hidden relative cursor-pointer" onDoubleClick={handleLike}>
                <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        const target = e.currentTarget;
                        const filename = post.imageUrl.split('/').pop();
                        if (filename && !target.src.includes(`/posts/${filename}`)) {
                            target.src = `/posts/${filename}`;
                        }
                    }}
                />
                {/* Heart Animation Overlay */}
                {isAnimating && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <Heart className="w-24 h-24 text-[#E16B55] fill-[#E16B55] drop-shadow-lg" />
                    </motion.div>
                )}
            </div>

            {/* Actions */}
            <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-4">
                        <button
                            onClick={handleLike}
                            className="hover:opacity-75 transition-opacity active:scale-90 transform text-[#F1F0EB]"
                        >
                            <Heart className={`h-6 w-6 ${isLiked ? "fill-[#E16B55] text-[#E16B55]" : ""}`} />
                        </button>
                        <button
                            onClick={onCommentClick}
                            className="hover:opacity-75 transition-opacity text-[#F1F0EB] hover:text-[#E16B55]"
                        >
                            <MessageCircle className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => {
                                const link = `${window.location.origin}/post/${post.id}`;
                                navigator.clipboard.writeText(link);
                                alert("Link copied to clipboard! 📋");
                            }}
                            className="hover:opacity-75 transition-opacity text-[#F1F0EB] hover:text-[#E16B55]"
                        >
                            <Send className="h-6 w-6" />
                        </button>
                    </div>
                    {onDelete && (
                        <button onClick={onDelete} className="hover:opacity-75 transition-opacity text-[#E16B55]" title="Delete Post">
                            <Trash2 className="h-6 w-6" />
                        </button>
                    )}
                    {!onDelete && (
                        <button className="hover:opacity-75 transition-opacity text-[#F1F0EB] hover:text-[#E16B55]">
                            <Bookmark className="h-6 w-6" />
                        </button>
                    )}
                </div>

                <div className="font-semibold text-sm mb-1 text-[#F1F0EB]">{likes} likes</div>

                <div className="text-sm">
                    <span className="font-semibold mr-2 text-[#F1F0EB]">{post.authorName}</span>
                    <span className="text-[#F1F0EB]/90">{post.caption}</span>
                </div>

                <button
                    onClick={onCommentClick}
                    className="text-[#55535B] text-sm mt-1 hover:text-[#E16B55]"
                >
                    View all comments
                </button>
            </div>
        </motion.article>
    );
}
