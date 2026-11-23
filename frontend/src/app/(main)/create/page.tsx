"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useFeed } from "@/context/FeedContext";

export default function CreatePostPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const { clearCache } = useFeed();
    const router = useRouter();
    
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center text-[#F1F0EB]">
                <h2 className="text-xl font-bold mb-2">Login Required</h2>
                <p className="text-[#55535B] mb-4">You need to log in to create a post.</p>
                <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2 bg-[#E16B55] hover:bg-[#E16B55]/90 text-[#F1F0EB] rounded-xl font-semibold transition cursor-pointer"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("caption", caption);

            await fetchWithAuth("/posts/", {
                method: "POST",
                body: formData,
            });

            clearCache();
            router.push("/");
        } catch (error: any) {
            console.error("Failed to create post:", error);
            alert(error.message || "Failed to create post");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 md:p-8 text-[#F1F0EB]">
            <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Area */}
                <div className="relative">
                    {preview ? (
                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#22242B] border border-[#55535B]/30">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => {
                                    setFile(null);
                                    setPreview(null);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-[#101114]/80 text-[#F1F0EB] rounded-full hover:bg-[#101114] transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square w-full rounded-2xl border-2 border-dashed border-[#55535B]/40 bg-[#22242B]/60 hover:border-[#E16B55] hover:bg-[#22242B] transition-all flex flex-col items-center justify-center cursor-pointer"
                        >
                            <Upload className="h-10 w-10 text-[#55535B] mb-2" />
                            <span className="text-[#55535B] font-medium">Select a photo</span>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Caption */}
                <div>
                    <textarea
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full p-4 bg-[#22242B] border border-[#55535B]/30 text-[#F1F0EB] placeholder-[#55535B] rounded-xl focus:border-[#E16B55] outline-none resize-none h-32 transition-colors"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!file || isUploading}
                    className="w-full py-3 bg-[#E16B55] hover:bg-[#E16B55]/90 text-[#F1F0EB] rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#F1F0EB]" />
                            Sharing...
                        </>
                    ) : (
                        "Share"
                    )}
                </button>
            </form>
        </div>
    );
}
