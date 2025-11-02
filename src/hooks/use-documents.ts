
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useHistory } from './use-history';
import type { DisplayDocument } from '@/lib/history';

export function useDocuments(userId?: string) {
    const { history } = useHistory(userId);

    const allDocuments = useMemo(() => {
        const docs = new Map<string, DisplayDocument>();
        history.forEach(item => {
            if (item.type === 'chat') {
                const key = `${item.document.name}-${item.document.content}`;
                if (!docs.has(key) || (docs.has(key) && !docs.get(key)?.summary && item.analysis?.summary)) {
                    docs.set(key, { ...item.document, summary: item.analysis?.summary });
                }
            } else {
                const keyA = `${item.documentA.name}-${item.documentA.content}`;
                if (!docs.has(keyA)) {
                    docs.set(keyA, { ...item.documentA, summary: 'This document was used in a comparison.' });
                }
                const keyB = `${item.documentB.name}-${item.documentB.content}`;
                if (!docs.has(keyB)) {
                    docs.set(keyB, { ...item.documentB, summary: 'This document was used in a comparison.' });
                }
            }
        });
        return Array.from(docs.values());
    }, [history]);
    
    return allDocuments;
}
