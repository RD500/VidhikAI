
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    addHistoryItem as addHistoryItemFs, 
    updateHistoryItem as updateHistoryItemFs,
    deleteHistoryItem as deleteHistoryItemFs,
    getHistory as getHistoryFs,
    clearHistory as clearHistoryFs,
    type HistoryItem 
} from '@/lib/history';
import { useFirestore } from '@/firebase';

export function useHistory(userId?: string) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const db = useFirestore();

    useEffect(() => {
        if (!userId) {
            setHistory([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = getHistoryFs(userId, (newHistory) => {
            // Sort history on the client-side
            const sortedHistory = newHistory.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            setHistory(sortedHistory);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const addHistoryItem = useCallback(async (item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
        if (!userId) throw new Error("User not authenticated");
        return await addHistoryItemFs(item);
    }, [userId]);

    const updateHistoryItem = useCallback(async (id: string, data: Partial<HistoryItem>) => {
        await updateHistoryItemFs(id, data);
    }, []);

    const deleteHistoryItem = useCallback(async (id: string) => {
        await deleteHistoryItemFs(id);
    }, []);

    const clearHistory = useCallback(async () => {
        if (!userId) return;
        await clearHistoryFs(userId);
    }, [userId]);

    return { history, isLoading, addHistoryItem, updateHistoryItem, deleteHistoryItem, clearHistory };
}
