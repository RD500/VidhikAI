
import type { DemystifyDocumentOutput } from '@/ai/flows/demystify';
import type { CompareDocumentsOutput } from '@/ai/flows/compare';
import type { Message } from '@/components/chat';
import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export type Document = {
  name: string;
  content: string;
};

export type DisplayDocument = Document & {
    summary?: string;
};

export type AnalysisResult = DemystifyDocumentOutput;
export type ComparisonResult = CompareDocumentsOutput;

type BaseHistoryItem = {
    id: string;
    userId: string;
    createdAt: any; // Firestore Timestamp
};

export type ChatHistoryItem = BaseHistoryItem & {
    type: 'chat';
    document: Document;
    analysis: AnalysisResult | null;
    messages: Message[];
};

export type CompareHistoryItem = BaseHistoryItem & {
    type: 'compare';
    documentA: Document;
    documentB: Document;
    comparison: ComparisonResult | null;
};

export type HistoryItem = ChatHistoryItem | CompareHistoryItem;


const historyCollection = collection(db, 'history');

export const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(historyCollection, {
        ...item,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateHistoryItem = async (id: string, data: Partial<HistoryItem>) => {
    const docRef = doc(db, 'history', id);
    await updateDoc(docRef, data);
};

export const deleteHistoryItem = async (id: string) => {
    const docRef = doc(db, 'history', id);
    await deleteDoc(docRef);
};

export const getHistory = (userId: string, callback: (history: HistoryItem[]) => void) => {
    const q = query(historyCollection, where('userId', '==', userId));
    
    return onSnapshot(q, (querySnapshot) => {
        const history: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() } as HistoryItem);
        });
        callback(history);
    });
};

export const clearHistory = async (userId: string) => {
    const q = query(historyCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
};
