import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  DocumentData,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ActionLog {
  id: string;
  timestamp: string;
  command: string;
  toolUsed: string;
  parameters: unknown;
  result: string;
  success: boolean;
  canUndo: boolean;
  undoData?: unknown;
  undoneAt?: string;
}

// Typed undo payload shapes per tool
interface UndoUpdateProduct { productId: string; originalData: DocumentData }
interface UndoBulkUpdate { items: Array<{ id: string; data: DocumentData }> }
interface UndoCreateProduct { productIds: string[] }
interface UndoDeleteProduct { deletedProduct: { id: string } & DocumentData }
interface UndoUpdateOrder { orderId: string; originalData: DocumentData }

export async function logAction(log: Omit<ActionLog, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'aiHistory'), {
      ...log,
      timestamp: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to log AI action:', error);
    return '';
  }
}

export async function getHistory(limitCount = 20): Promise<ActionLog[]> {
  try {
    const q = query(
      collection(db, 'aiHistory'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<ActionLog, 'id'>),
    }));
  } catch (error) {
    console.error('Failed to get AI history:', error);
    return [];
  }
}

export async function undoAction(actionId: string): Promise<{ success: boolean; message: string }> {
  try {
    const actionRef = doc(db, 'aiHistory', actionId);
    const actionSnap = await getDoc(actionRef);
    if (!actionSnap.exists()) {
      return { success: false, message: 'Действие не найдено' };
    }

    const action = actionSnap.data() as Omit<ActionLog, 'id'>;
    if (!action.canUndo || !action.undoData) {
      return { success: false, message: 'Это действие нельзя отменить' };
    }

    const undoData = action.undoData as Record<string, unknown>;

    switch (action.toolUsed) {
      case 'update_product': {
        const { productId, originalData } = undoData as unknown as UndoUpdateProduct;
        await updateDoc(doc(db, 'products', productId), originalData);
        break;
      }
      case 'bulk_update_products': {
        const { items } = undoData as unknown as UndoBulkUpdate;
        for (const item of items) {
          await updateDoc(doc(db, 'products', item.id), item.data);
        }
        break;
      }
      case 'create_product': {
        const { productIds } = undoData as unknown as UndoCreateProduct;
        for (const id of productIds) {
          await deleteDoc(doc(db, 'products', id));
        }
        break;
      }
      case 'delete_product': {
        const { deletedProduct } = undoData as unknown as UndoDeleteProduct;
        const { id, ...productData } = deletedProduct;
        await setDoc(doc(db, 'products', id), productData);
        break;
      }
      case 'update_order': {
        const { orderId, originalData } = undoData as unknown as UndoUpdateOrder;
        await updateDoc(doc(db, 'preorders', orderId), originalData);
        break;
      }
      default:
        return { success: false, message: 'Отмена для этого действия не поддерживается' };
    }

    await updateDoc(actionRef, { canUndo: false, undoneAt: new Date().toISOString() });
    return { success: true, message: '↩️ Действие отменено' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка отмены: ${msg}` };
  }
}
