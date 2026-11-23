"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FeedContextType {
    posts: any[];
    setPosts: React.Dispatch<React.SetStateAction<any[]>>;
    lastDocId: string | null;
    setLastDocId: (id: string | null) => void;
    hasMore: boolean;
    setHasMore: (val: boolean) => void;
    isLoaded: boolean;
    setIsLoaded: (val: boolean) => void;
    clearCache: () => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [lastDocId, setLastDocId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    const clearCache = () => {
        setPosts([]);
        setLastDocId(null);
        setHasMore(true);
        setIsLoaded(false);
    };

    return (
        <FeedContext.Provider value={{
            posts, setPosts,
            lastDocId, setLastDocId,
            hasMore, setHasMore,
            isLoaded, setIsLoaded,
            clearCache
        }}>
            {children}
        </FeedContext.Provider>
    );
};

export const useFeed = () => {
    const context = useContext(FeedContext);
    if (!context) {
        throw new Error("useFeed must be used within a FeedProvider");
    }
    return context;
};
