import { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { app } from '../config/firebase';
import { sanitizeForFirestore } from '../utils/sanitizeFirestore';

// Инициализация Firestore с кэшированием
// (только один раз для всего приложения)
let dbInstance: ReturnType<typeof initializeFirestore> | null = null;

function getDb(): ReturnType<typeof initializeFirestore> {
  if (!dbInstance) {
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      // Если уже инициализирован — используем db
      const { db } = require('../config/firebase');
      dbInstance = db;
    }
  }
  return dbInstance!;
}

export function useFirestore<T extends { id?: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<T[]>([]);

  useEffect(() => {
    const db = getDb();

    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      { includeMetadataChanges: false },
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items: T[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as T));
        cacheRef.current = items;
        setData(items);
        setLoading(false);
      },
      (err) => {
        // При ошибке сети — показываем кэш
        if (cacheRef.current.length > 0) {
          setData(cacheRef.current);
          setLoading(false);
        } else {
          setError(err.message);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  const add = async (item: Omit<T, 'id'>) => {
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
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
