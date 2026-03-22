import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type QueryConstraint,
  type WhereFilterOp,
  type OrderByDirection,
  type DocumentData,
  type WithFieldValue,
  type UpdateData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Product, Sale, Expense, Supplier } from '../types';

// ── Generic helpers ────────────────────────────────────────────────────────────

export async function getCollection<T extends DocumentData>(
  collectionName: string
): Promise<(T & { id: string })[]> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T & { id: string }));
}

export async function getDocument<T extends DocumentData>(
  collectionName: string,
  id: string
): Promise<(T & { id: string }) | null> {
  const snapshot = await getDoc(doc(db, collectionName, id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
}

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: WithFieldValue<T>
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function setDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: WithFieldValue<T>
): Promise<void> {
  await setDoc(doc(db, collectionName, id), data);
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: UpdateData<T>
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), data);
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

export async function queryCollection<T extends DocumentData>(
  collectionName: string,
  filters: { field: string; op: WhereFilterOp; value: unknown }[],
  sort?: { field: string; direction?: OrderByDirection }
): Promise<(T & { id: string })[]> {
  const constraints: QueryConstraint[] = filters.map((f) => where(f.field, f.op, f.value));
  if (sort) {
    constraints.push(orderBy(sort.field, sort.direction ?? 'asc'));
  }
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T & { id: string }));
}

// ── Typed collection helpers ───────────────────────────────────────────────────

export const products = {
  getAll: () => getCollection<Product>('products'),
  get: (id: string) => getDocument<Product>('products', id),
  add: (data: Omit<Product, 'id'>) => addDocument<DocumentData>('products', data),
  update: (id: string, data: Partial<Omit<Product, 'id'>>) =>
    updateDocument<DocumentData>('products', id, data),
  delete: (id: string) => deleteDocument('products', id),
};

export const sales = {
  getAll: () => getCollection<Sale>('sales'),
  get: (id: string) => getDocument<Sale>('sales', id),
  add: (data: Omit<Sale, 'id'>) => addDocument<DocumentData>('sales', data),
  update: (id: string, data: Partial<Omit<Sale, 'id'>>) =>
    updateDocument<DocumentData>('sales', id, data),
  delete: (id: string) => deleteDocument('sales', id),
};

export const expenses = {
  getAll: () => getCollection<Expense>('expenses'),
  get: (id: string) => getDocument<Expense>('expenses', id),
  add: (data: Omit<Expense, 'id'>) => addDocument<DocumentData>('expenses', data),
  update: (id: string, data: Partial<Omit<Expense, 'id'>>) =>
    updateDocument<DocumentData>('expenses', id, data),
  delete: (id: string) => deleteDocument('expenses', id),
};

export const suppliers = {
  getAll: () => getCollection<Supplier>('suppliers'),
  get: (id: string) => getDocument<Supplier>('suppliers', id),
  add: (data: Omit<Supplier, 'id'>) => addDocument<DocumentData>('suppliers', data),
  update: (id: string, data: Partial<Omit<Supplier, 'id'>>) =>
    updateDocument<DocumentData>('suppliers', id, data),
  delete: (id: string) => deleteDocument('suppliers', id),
};
