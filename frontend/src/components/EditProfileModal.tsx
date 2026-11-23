"use client";

import { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

interface EditProfileModalProps {
    user: any;
    onClose: () => void;
    onUpdate: (updatedUser: any) => void;
}

export default function EditProfileModal({ user, onClose, onUpdate }: EditProfileModalProps) {
    const [displayName, setDisplayName] = useState(user.displayName || "");
    const [bio, setBio] = useState(user.bio || "");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState(user.photoURL || null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("displayName", displayName);
        formData.append("bio", bio);
        if (file) {
            formData.append("image", file);
        }

        try {
            const updatedUser = await fetchWithAuth("/users/me/", {
                method: "POST",
                body: formData,
            });

            onUpdate(updatedUser);
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#22242B] border border-[#55535B]/30 text-[#F1F0EB] w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#55535B] hover:text-[#F1F0EB] transition-colors cursor-pointer"
                >
                    <X className="h-6 w-6" />
                </button>

                <h2 className="text-xl font-bold mb-6 text-[#F1F0EB]">Edit Profile</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden bg-[#101114] border border-[#55535B]/40 mb-2 group cursor-pointer">
                            {preview ? (
                                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-[#55535B]">
                                    <Upload className="h-8 w-8" />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#F1F0EB] text-xs font-bold">
                                Change
                            </div>
                        </div>
                        <p className="text-xs text-[#55535B]">Click to upload new photo</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-[#F1F0EB]">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-[#101114] border border-[#55535B]/40 text-[#F1F0EB] focus:border-[#E16B55] outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-[#F1F0EB]">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-[#101114] border border-[#55535B]/40 text-[#F1F0EB] focus:border-[#E16B55] outline-none h-24 resize-none placeholder-[#55535B] transition-colors"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#E16B55] hover:bg-[#E16B55]/90 text-[#F1F0EB] rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                        {loading && <Loader2 className="h-5 w-5 animate-spin text-[#F1F0EB]" />}
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
