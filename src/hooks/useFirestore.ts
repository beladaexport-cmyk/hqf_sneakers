import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sanitizeForFirestore } from '../utils/sanitizeFirestore';

export function useFirestore<T extends { id?: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items: T[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as T));
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  const add = async (item: Omit<T, 'id'>) => {
    try {
      const sanitized = sanitizeForFirestore(item as Record<string, unknown>);
      await addDoc(collection(db, collectionName), sanitized as DocumentData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    try {
      const sanitized = sanitizeForFirestore(item as Record<string, unknown>);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, sanitized as DocumentData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  };

  return { data, loading, error, add, update, remove };
}
