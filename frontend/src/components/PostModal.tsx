"use client";

import { useEffect, useState } from "react";
import { X, Heart, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorPhotoURL?: string;
    createdAt: any;
}

interface PostModalProps {
    post: any;
    onClose: () => void;
    onDelete?: () => void;
}

export default function PostModal({ post, onClose, onDelete }: PostModalProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [likes, setLikes] = useState(post.likesCount || 0);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        fetchWithAuth(`/posts/${post.id}/comments/`)
            .then(setComments)
            .catch(console.error);
    }, [post.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const comment = await fetchWithAuth(`/posts/${post.id}/comments/`, {
                method: "POST",
                body: JSON.stringify({ text: newComment })
            });
            setComments(prev => [...prev, comment]);
            setNewComment("");
        } catch (e) {
            console.error(e);
            alert("Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async () => {
        const newState = !isLiked;
        setIsLiked(newState);
        setLikes((prev: number) => newState ? prev + 1 : prev - 1);

        try {
            const endpoint = `/posts/${post.id}/like/`;
            await fetchWithAuth(endpoint, { method: newState ? 'POST' : 'DELETE' });
        } catch (e) {
            setIsLiked(!newState);
            setLikes((prev: number) => !newState ? prev + 1 : prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-[#101114] border border-[#22242B] text-[#F1F0EB] w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Image Section */}
                <div className="md:w-3/5 bg-black flex items-center justify-center relative">
                    <img
                        src={post.imageUrl}
                        alt="Post"
                        className="max-h-[50vh] md:max-h-full w-full object-contain"
                        onDoubleClick={handleLike}
                        onError={(e) => {
                            const target = e.currentTarget;
                            const filename = post.imageUrl.split('/').pop();
                            if (filename && !target.src.includes(`/posts/${filename}`)) {
                                target.src = `/posts/${filename}`;
                            }
                        }}
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 p-2 bg-[#101114]/80 text-[#F1F0EB] rounded-full md:hidden hover:bg-[#22242B]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content Section */}
                <div className="md:w-2/5 flex flex-col h-full border-l border-[#22242B] bg-[#101114]">
                    {/* Header */}
                    <div className="p-4 border-b border-[#22242B] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#22242B] overflow-hidden border border-[#55535B]/40">
                                {post.authorPhotoURL ? (
                                    <img src={post.authorPhotoURL} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-[#22242B] text-[#F1F0EB] flex items-center justify-center font-bold text-xs">
                                        {post.authorName[0]}
                                    </div>
                                )}
                            </div>
                            <span className="font-semibold text-sm text-[#F1F0EB]">{post.authorName}</span>
                        </div>
                        {onDelete && (
                            <button onClick={onDelete} className="text-[#E16B55] hover:bg-[#E16B55]/10 p-2 rounded-full">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="hidden md:block text-[#55535B] hover:text-[#F1F0EB]">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Caption */}
                        {post.caption && (
                            <div className="flex gap-3 mb-6">
                                <div className="h-8 w-8 rounded-full bg-[#22242B] flex-shrink-0 overflow-hidden border border-[#55535B]/40">
                                    {post.authorPhotoURL ? (
                                        <img src={post.authorPhotoURL} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-[#22242B] text-[#F1F0EB] flex items-center justify-center font-bold text-xs">
                                            {post.authorName[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="font-semibold text-sm mr-2 text-[#F1F0EB]">{post.authorName}</span>
                                    <span className="text-sm text-[#F1F0EB]/90">{post.caption}</span>
                                    <div className="text-xs text-[#55535B] mt-1">
                                        {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                                    </div>
                                </div>
                            </div>
                        )}

                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-[#22242B] flex-shrink-0 overflow-hidden border border-[#55535B]/30">
                                    {comment.authorPhotoURL ? (
                                        <img src={comment.authorPhotoURL} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-[#22242B] text-[#F1F0EB] flex items-center justify-center font-bold text-xs">
                                            {comment.authorName?.[0] || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="font-semibold text-sm mr-2 text-[#F1F0EB]">{comment.authorName}</span>
                                    <span className="text-sm text-[#F1F0EB]/80">{comment.text}</span>
                                    <div className="text-xs text-[#55535B] mt-1">
                                        {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Just now'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-[#22242B] bg-[#101114]">
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={handleLike} className={`${isLiked ? 'text-[#E16B55]' : 'text-[#F1F0EB]'}`}>
                                <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <div className="font-semibold text-sm mb-2 text-[#F1F0EB]">{likes} likes</div>
                        <div className="text-xs text-[#55535B] uppercase tracking-wider mb-4">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleCommentSubmit} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 bg-[#22242B] border border-[#55535B]/40 rounded-xl px-3 py-2 text-sm text-[#F1F0EB] placeholder-[#55535B] outline-none focus:border-[#E16B55]"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || submitting}
                                className="text-white bg-[#E16B55] hover:bg-[#E16B55]/90 font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-50 transition"
                            >
                                Post
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
