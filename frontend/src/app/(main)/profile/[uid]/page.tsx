"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import { Settings, LogOut } from "lucide-react";
import PostModal from "@/components/PostModal";
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
    const { user, logout, updateUser } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const { uid } = use(params);
    const isOwnProfile = uid === 'me' || (user && user.uid === uid);
    const targetUid = uid === 'me' ? user?.uid : uid;

    useEffect(() => {
        if (isOwnProfile || !user || !targetUid) return;

        fetchWithAuth(`/social/following/${user.uid}/`)
            .then((data: any[]) => {
                const isFound = data.some(f => f.id === targetUid);
                setIsFollowing(isFound);
            })
            .catch(console.error);
    }, [user, targetUid, isOwnProfile]);

    const handleFollow = async () => {
        if (!user || !targetUid) return;
        const previousState = isFollowing;
        setIsFollowing(!previousState);

        try {
            const endpoint = previousState ? "/social/unfollow/" : "/social/follow/";
            await fetchWithAuth(endpoint, {
                method: "POST",
                body: JSON.stringify({ targetId: targetUid })
            });
            setProfile((prev: any) => ({
                ...prev,
                followersCount: (prev.followersCount || 0) + (previousState ? -1 : 1)
            }));
        } catch (e) {
            console.error(e);
            setIsFollowing(previousState);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            await fetchWithAuth(`/posts/${postId}/`, { method: "DELETE" });
            setPosts(prev => prev.filter(p => p.id !== postId));
            setProfile((prev: any) => ({ ...prev, postsCount: Math.max((prev.postsCount || 1) - 1, 0) }));
            setSelectedPost(null);
        } catch (e) {
            console.error(e);
            alert("Failed to delete post");
        }
    };

    useEffect(() => {
        async function fetchProfileData() {
            if (!targetUid) return;

            try {
                const endpoint = isOwnProfile ? "/users/me/" : `/users/${targetUid}/`;
                const profileData = await fetchWithAuth(endpoint);
                setProfile(profileData);

                const postsData = await fetchWithAuth(`/posts/user/${profileData.uid || targetUid}/`);
                setPosts(postsData.posts || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchProfileData();
    }, [targetUid, isOwnProfile]);

    if (loading) return <div className="p-8 text-center text-[#55535B]">Loading...</div>;
    if (!profile) return <div className="p-8 text-center text-[#55535B]">User not found</div>;

    return (
        <div className="pb-20 md:pb-0 text-[#F1F0EB]">
            <div className="bg-[#22242B] p-6 md:rounded-b-2xl mb-4 border-b border-[#22242B]">
                <div className="flex items-start justify-between mb-6">
                    <div className="h-20 w-20 rounded-full bg-[#101114] overflow-hidden border-2 border-[#55535B]/40">
                        {profile.photoURL ? (
                            <img 
                                src={profile.photoURL} 
                                alt={profile.displayName} 
                                className="h-full w-full object-cover" 
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    const filename = profile.photoURL?.split('/').pop();
                                    if (filename && !target.src.includes(`/posts/${filename}`)) {
                                        target.src = `/posts/${filename}`;
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-[#101114] text-[#F1F0EB] font-bold text-2xl">
                                {profile.displayName?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 text-center">
                        <div>
                            <div className="font-bold text-lg text-[#F1F0EB]">{posts.length}</div>
                            <div className="text-xs text-[#55535B]">Posts</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg text-[#F1F0EB]">{profile.followersCount || 0}</div>
                            <div className="text-xs text-[#55535B]">Followers</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg text-[#F1F0EB]">{profile.followingCount || 0}</div>
                            <div className="text-xs text-[#55535B]">Following</div>
                        </div>
                    </div>
                </div>

                <h1 className="font-bold text-xl text-[#F1F0EB]">{profile.displayName}</h1>
                <p className="text-[#55535B] text-sm mt-1">{profile.bio || "No bio yet."}</p>

                <div className="mt-6 flex gap-3">
                    {isOwnProfile ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 py-2 bg-[#101114] hover:bg-[#101114]/80 border border-[#55535B]/40 rounded-xl text-sm font-semibold transition text-[#F1F0EB] cursor-pointer"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex-1 flex gap-2">
                            <button
                                onClick={handleFollow}
                                disabled={isFollowing === null}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${isFollowing
                                    ? "bg-[#101114] text-[#F1F0EB] border border-[#55535B]/40"
                                    : "bg-[#E16B55] text-[#F1F0EB] hover:bg-[#E16B55]/90"
                                    }`}
                            >
                                {isFollowing ? "Following" : "Follow"}
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const chat = await fetchWithAuth("/chat/", {
                                            method: "POST",
                                            body: JSON.stringify({ targetUid })
                                        });
                                        window.location.href = `/messages/${chat.id}`;
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                                className="flex-1 py-2 bg-[#101114] hover:bg-[#101114]/80 border border-[#55535B]/40 rounded-xl text-sm font-semibold transition text-[#F1F0EB] cursor-pointer"
                            >
                                Message
                            </button>
                        </div>
                    )}
                    <button className="p-2 bg-[#101114] border border-[#55535B]/40 rounded-xl hover:bg-[#101114]/80 transition text-[#F1F0EB]">
                        <Settings className="h-5 w-5" />
                    </button>
                    {isOwnProfile && (
                        <button
                            onClick={logout}
                            className="p-2 bg-[#101114] text-[#E16B55] border border-[#E16B55]/40 rounded-xl hover:bg-[#E16B55]/20 transition cursor-pointer"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-4 p-1 md:p-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="aspect-square bg-[#22242B] relative group overflow-hidden cursor-pointer rounded-lg border border-[#55535B]/20"
                        onClick={() => setSelectedPost(post)}
                    >
                        <img 
                            src={post.imageUrl} 
                            alt="" 
                            className="h-full w-full object-cover" 
                            onError={(e) => {
                                const target = e.currentTarget;
                                const filename = post.imageUrl.split('/').pop();
                                if (filename && !target.src.includes(`/posts/${filename}`)) {
                                    target.src = `/posts/${filename}`;
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#F1F0EB] font-bold gap-2">
                            <HeartIcon count={post.likesCount} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Post Detail Modal */}
            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onDelete={isOwnProfile ? () => handleDeletePost(selectedPost.id) : undefined}
                />
            )}

            {/* Edit Profile Modal */}
            {isEditing && profile && (
                <EditProfileModal
                    user={profile}
                    onClose={() => setIsEditing(false)}
                    onUpdate={(updatedUser) => {
                        setProfile(updatedUser);
                        updateUser(updatedUser);
                        setIsEditing(false);
                    }}
                />
            )}
        </div>
    );
}

function HeartIcon({ count }: { count: number }) {
    return (
        <span className="flex items-center gap-1 text-[#E16B55]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#E16B55" stroke="#E16B55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
            <span className="text-[#F1F0EB]">{count}</span>
        </span>
    );
}
