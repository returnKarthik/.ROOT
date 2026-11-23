"use client";

import { useEffect, useState, useRef } from "react";
import PostCard from "./PostCard";
import PostModal from "./PostModal";
import { fetchWithAuth } from "@/lib/api";
import { useFeed } from "@/context/FeedContext";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function Feed() {
    const {
        posts, setPosts,
        lastDocId, setLastDocId,
        hasMore, setHasMore,
        isLoaded, setIsLoaded,
        clearCache
    } = useFeed();

    const [initialLoading, setInitialLoading] = useState(!isLoaded);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        if (!isLoaded) {
            fetchFeed(true);
        }
    }, [isLoaded]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const currentTarget = observerTarget.current;
        if (!currentTarget || !hasMore || loadingMore || initialLoading || fetchError) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchFeed(false);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(currentTarget);

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [observerTarget, hasMore, loadingMore, initialLoading, lastDocId, fetchError]);

    const fetchFeed = async (isInitial: boolean) => {
        if (isInitial) {
            setInitialLoading(true);
            setFetchError(null);
        } else {
            setLoadingMore(true);
        }

        try {
            const cursor = isInitial ? "" : (lastDocId ? `&lastDocId=${lastDocId}` : "");
            const res = await fetchWithAuth(`/posts/?limit=10${cursor}`);
            
            const newPosts = res.posts || [];
            const nextCursor = res.lastDocId;

            if (isInitial) {
                setPosts(newPosts);
                setIsLoaded(true);
            } else {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const filteredNew = newPosts.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...filteredNew];
                });
            }

            setLastDocId(nextCursor);
            setHasMore(!!nextCursor && newPosts.length > 0);
            setFetchError(null);
        } catch (e: any) {
            console.error("Error fetching feed:", e);
            if (isInitial) {
                setFetchError(e.message || "Could not connect to backend server.");
            }
        } finally {
            setInitialLoading(false);
            setLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        setFetchError(null);
        clearCache();
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
                {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse bg-[#22242B] p-4 border border-[#22242B] rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 bg-[#101114] rounded-full" />
                            <div className="h-4 bg-[#101114] rounded w-1/4" />
                        </div>
                        <div className="h-96 bg-[#101114] rounded-xl mb-3" />
                        <div className="h-4 bg-[#101114] rounded w-1/3" />
                    </div>
                ))}
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="max-w-xl mx-auto p-4 pt-8">
                <div className="bg-[#22242B] border border-[#55535B]/40 rounded-2xl p-6 text-center text-[#F1F0EB]">
                    <AlertCircle className="h-10 w-10 text-[#E16B55] mx-auto mb-3" />
                    <h3 className="text-base font-bold mb-2">Backend Server Not Connected</h3>
                    <p className="text-sm text-[#55535B] mb-4">{fetchError}</p>
                    <div className="bg-[#101114] text-xs font-mono p-3 rounded-lg mb-4 text-left inline-block border border-[#55535B]/40 text-[#F1F0EB]">
                        cd backend<br />
                        python app.py
                    </div>
                    <div>
                        <button
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#E16B55] hover:bg-[#E16B55]/90 text-white text-sm font-bold rounded-xl transition shadow-md active:scale-95"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry Connection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto md:py-8 pb-20 pt-4 px-2 md:px-0">
            {/* Refresh Feed Bar */}
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm font-semibold text-[#55535B]">Home Feed</span>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-[#E16B55] hover:bg-[#E16B55]/90 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-sm"
                >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                </button>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-20 bg-[#22242B] border border-[#22242B] rounded-2xl p-6 text-[#F1F0EB]">
                    <p className="mb-2 font-medium">Your feed is empty.</p>
                    <p className="text-sm text-[#55535B]">Post a photo or follow users to populate your feed!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <AnimatePresence>
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onCommentClick={() => setSelectedPost(post)}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Observer target element */}
                    <div ref={observerTarget} className="h-10 flex items-center justify-center">
                        {loadingMore && (
                            <div className="flex items-center gap-2 text-[#55535B] text-sm font-medium">
                                <Loader2 className="h-5 w-5 animate-spin text-[#E16B55]" />
                                Loading older posts...
                            </div>
                        )}
                        {!hasMore && posts.length > 0 && (
                            <div className="text-xs text-[#55535B] font-semibold py-4">
                                🎉 You've caught up! No more posts to show.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </div>
    );
}
