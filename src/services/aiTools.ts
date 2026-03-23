import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
  setDoc,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, Sale } from '../types';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  affectedCount?: number;
  canUndo?: boolean;
  undoData?: unknown;
}

export interface SearchFilters {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  status?: string;
  category?: string;
  supplier?: string;
}

export interface ProductChanges {
  retailPrice?: number;
  purchasePrice?: number;
  priceMultiplier?: number;
  status?: string;
  supplier?: string;
  category?: string;
  quantity?: number;
  location?: string;
}

export interface CreateProductParams {
  brand: string;
  model: string;
  sizes: string[];
  purchasePrice?: number;
  retailPrice?: number;
  supplier?: string;
  status?: string;
  color?: string;
  category?: string;
  expectedDate?: string;
  notes?: string;
}

// Search products by filters (client-side filtering for complex queries)
export async function searchProducts(filters: SearchFilters): Promise<ToolResult> {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    let products = snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Product, 'id'>),
    }));

    if (filters.brand) {
      const b = filters.brand.toLowerCase();
      products = products.filter(p => p.brand.toLowerCase().includes(b));
    }
    if (filters.model) {
      const m = filters.model.toLowerCase();
      products = products.filter(p => p.model.toLowerCase().includes(m));
    }
    if (filters.minPrice !== undefined) {
      const minP = filters.minPrice;
      products = products.filter(p => p.retailPrice >= minP);
    }
    if (filters.maxPrice !== undefined) {
      const maxP = filters.maxPrice;
      products = products.filter(p => p.retailPrice <= maxP);
    }
    if (filters.size) {
      products = products.filter(p => p.size === filters.size);
    }
    if (filters.status) {
      products = products.filter(p => p.status === filters.status);
    }
    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters.supplier) {
      const s = filters.supplier.toLowerCase();
      products = products.filter(p => p.supplier?.toLowerCase().includes(s));
    }

    const preview = products.slice(0, 5).map(p =>
      `• ${p.brand} ${p.model} (${p.size}) — ${p.retailPrice} Br`
    ).join('\n');
    const extra = products.length > 5 ? `\n...и ещё ${products.length - 5}` : '';

    return {
      success: true,
      message: `🔍 Найдено ${products.length} товаров${products.length > 0 ? ':\n' + preview + extra : ''}`,
      data: products,
      affectedCount: products.length,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка поиска: ${msg}` };
  }
}

// Update a single product
export async function updateProduct(productId: string, changes: ProductChanges): Promise<ToolResult> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      return { success: false, message: 'Товар не найден' };
    }
    const oldData = productSnap.data();
    const updateData: Partial<DocumentData> = { ...changes };
    delete updateData.priceMultiplier;
    await updateDoc(productRef, updateData);
    return {
      success: true,
      message: '✅ Товар обновлён',
      canUndo: true,
      undoData: { productId, originalData: oldData },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка обновления: ${msg}` };
  }
}

// Bulk update products matching filters
export async function bulkUpdateProducts(
  searchFilters: SearchFilters,
  changes: ProductChanges
): Promise<ToolResult> {
  try {
    const searchResult = await searchProducts(searchFilters);
    if (!searchResult.success || !searchResult.data) {
      return { success: false, message: 'Не удалось найти товары' };
    }
    const products = searchResult.data as Product[];
    if (products.length === 0) {
      return { success: false, message: 'Товары не найдены по указанным фильтрам' };
    }

    const undoData: Array<{ id: string; data: DocumentData }> = [];

    for (const product of products) {
      const productRef = doc(db, 'products', product.id);
      const snap = await getDoc(productRef);
      if (!snap.exists()) continue;
      undoData.push({ id: product.id, data: snap.data() });

      const updateData: Partial<Product> = {};
      if (changes.priceMultiplier !== undefined) {
        updateData.retailPrice = Math.round(product.retailPrice * changes.priceMultiplier);
      } else if (changes.retailPrice !== undefined) {
        updateData.retailPrice = changes.retailPrice;
      }
      if (changes.purchasePrice !== undefined) updateData.purchasePrice = changes.purchasePrice;
      if (changes.status !== undefined) updateData.status = changes.status as Product['status'];
      if (changes.supplier !== undefined) updateData.supplier = changes.supplier;
      if (changes.category !== undefined) updateData.category = changes.category as Product['category'];
      if (changes.quantity !== undefined) updateData.quantity = changes.quantity;
      if (changes.location !== undefined) updateData.location = changes.location;

      await updateDoc(productRef, updateData as DocumentData);
    }

    return {
      success: true,
      message: `✅ Обновлено ${products.length} товаров`,
      affectedCount: products.length,
      canUndo: true,
      undoData: { items: undoData },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка массового обновления: ${msg}` };
  }
}

// Create new product(s) from params
export async function createProduct(params: CreateProductParams): Promise<ToolResult> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const createdIds: string[] = [];

    for (const size of params.sizes) {
      const sku = `${params.brand.slice(0, 3).toUpperCase()}-${params.model.slice(0, 3).toUpperCase()}-${size}`;
      const product = {
        sku,
        brand: params.brand,
        model: params.model,
        size,
        color: params.color || '',
        quantity: 1,
        purchasePrice: params.purchasePrice || 0,
        retailPrice: params.retailPrice || 0,
        dateAdded: today,
        supplier: params.supplier || '',
        category: params.category || 'lifestyle',
        status: params.status || 'available',
        location: '',
        minStock: 1,
      };
      const docRef = await addDoc(collection(db, 'products'), product);
      createdIds.push(docRef.id);

      if (params.status === 'preorder') {
        const colorNote = params.color ? ` "${params.color}"` : '';
        const preorder = {
          modelId: '',
          modelName: `${params.brand} ${params.model}${colorNote}`,
          sizeId: '',
          sizeEU: size,
          quantity: 1,
          purchasePrice: params.purchasePrice || 0,
          retailPrice: params.retailPrice || 0,
          supplier: params.supplier || '',
          expectedDate: params.expectedDate ||
            new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          notes: params.notes || 'Создано через AI-агент',
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'preorders'), preorder);
      }
    }

    return {
      success: true,
      message: `✅ Создано ${params.sizes.length} товаров (${params.brand} ${params.model})`,
      affectedCount: params.sizes.length,
      canUndo: true,
      undoData: { productIds: createdIds },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка создания товара: ${msg}` };
  }
}

// Delete a product
export async function deleteProduct(productId: string): Promise<ToolResult> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      return { success: false, message: 'Товар не найден' };
    }
    const productData = productSnap.data();
    await deleteDoc(productRef);
    return {
      success: true,
      message: '🗑️ Товар удалён',
      canUndo: true,
      undoData: { deletedProduct: { id: productId, ...productData } },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка удаления: ${msg}` };
  }
}

// Generate various reports
export async function generateReport(reportType: string, period?: string): Promise<ToolResult> {
  try {
    switch (reportType) {
      case 'sales_summary': {
        const snapshot = await getDocs(collection(db, 'sales'));
        const allSales = snapshot.docs.map(d => d.data() as Sale);

        const now = new Date();
        let startDate = new Date(0);
        if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (period === 'quarter') startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);

        const sales = allSales.filter(s => {
          if (s.status !== 'completed') return false;
          if (period && period !== 'all' && s.date) return new Date(s.date) >= startDate;
          return true;
        });

        const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);

        const productCounts: Record<string, number> = {};
        sales.forEach(s => {
          productCounts[s.productName] = (productCounts[s.productName] || 0) + 1;
        });
        const topProducts = Object.entries(productCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        const periodLabels: Record<string, string> = {
          week: 'неделю', month: 'месяц', quarter: 'квартал', year: 'год', all: 'всё время',
        };
        const periodLabel = periodLabels[period || 'all'] || 'всё время';

        return {
          success: true,
          message: `📊 Продажи за ${periodLabel}:\n\n` +
            `• Заказов: ${sales.length}\n` +
            `• Выручка: ${totalRevenue.toFixed(0)} Br\n` +
            `• Прибыль: ${totalProfit.toFixed(0)} Br\n` +
            (topProducts.length > 0
              ? `\n🏆 Топ товары:\n` + topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.count} шт.)`).join('\n')
              : ''),
          data: { totalRevenue, totalProfit, totalOrders: sales.length, topProducts },
        };
      }

      case 'inventory': {
        const snapshot = await getDocs(collection(db, 'products'));
        const products = snapshot.docs.map(d => d.data() as Product);
        const available = products.filter(p => p.status === 'available').length;
        const preorder = products.filter(p => p.status === 'preorder').length;
        const soldOut = products.filter(p => p.status === 'sold_out').length;
        const byBrand: Record<string, number> = {};
        products.forEach(p => { byBrand[p.brand] = (byBrand[p.brand] || 0) + 1; });

        return {
          success: true,
          message: `📦 Склад:\n\n` +
            `• Всего позиций: ${products.length}\n` +
            `• В наличии: ${available}\n` +
            `• Предзаказы: ${preorder}\n` +
            `• Нет в наличии: ${soldOut}\n\n` +
            `По брендам:\n` +
            Object.entries(byBrand).sort(([, a], [, b]) => b - a)
              .map(([brand, count]) => `• ${brand}: ${count} шт.`).join('\n'),
          data: { total: products.length, available, preorder, soldOut, byBrand },
        };
      }

      case 'low_stock': {
        const snapshot = await getDocs(collection(db, 'products'));
        const products = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }));
        const lowStock = products.filter(
          p => p.quantity <= (p.minStock ?? 1) && p.status === 'available'
        );
        if (lowStock.length === 0) {
          return { success: true, message: '✅ Все товары в достаточном количестве!' };
        }
        return {
          success: true,
          message: `⚠️ Низкие остатки (${lowStock.length} позиций):\n\n` +
            lowStock.slice(0, 10).map(p =>
              `• ${p.brand} ${p.model} (${p.size}) — ${p.quantity} шт.`
            ).join('\n'),
          data: lowStock,
          affectedCount: lowStock.length,
        };
      }

      case 'top_products': {
        const snapshot = await getDocs(collection(db, 'sales'));
        const sales = snapshot.docs.map(d => d.data() as Sale).filter(s => s.status === 'completed');
        const counts: Record<string, number> = {};
        sales.forEach(s => { counts[s.productName] = (counts[s.productName] || 0) + (s.quantity || 1); });
        const top = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10);
        return {
          success: true,
          message: top.length > 0
            ? `🏆 Топ-10 популярных товаров:\n\n` +
              top.map(([name, count], i) => `${i + 1}. ${name} — ${count} шт.`).join('\n')
            : 'ℹ️ Данных о продажах пока нет',
          data: top,
        };
      }

      case 'no_photo':
        return {
          success: true,
          message: 'ℹ️ Отслеживание фото товаров не реализовано. Управляйте фото через раздел Каталог.',
        };

      default:
        return { success: false, message: `Неизвестный тип отчёта: ${reportType}` };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка отчёта: ${msg}` };
  }
}

// Update order (preorder) status
export async function updateOrder(orderId: string, status: string, notes?: string): Promise<ToolResult> {
  try {
    const orderRef = doc(db, 'preorders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return { success: false, message: 'Заказ не найден' };
    }
    const oldData = orderSnap.data();
    const updateData: DocumentData = { status };
    if (notes) updateData.notes = notes;
    if (status === 'arrived') updateData.arrivedAt = new Date().toISOString();
    await updateDoc(orderRef, updateData);
    return {
      success: true,
      message: `✅ Статус заказа изменён на "${status}"`,
      canUndo: true,
      undoData: { orderId, originalData: oldData },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка обновления заказа: ${msg}` };
  }
}

// Restore a deleted document (used for undo)
export async function restoreDocument(
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> {
  await setDoc(doc(db, collectionName, docId), data);
}

export interface CreateSaleParams {
  productSku: string;
  size: string;
  quantity?: number;
  customerName?: string;
  customerContact?: string;
}

// Create a sale and update product inventory
export async function createSale(params: CreateSaleParams): Promise<ToolResult> {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Product, 'id'>),
    }));

    const product = products.find(
      p => p.sku === params.productSku && p.size === params.size && p.status === 'available'
    );

    if (!product) {
      return {
        success: false,
        message: `❌ Товар ${params.productSku} размер ${params.size} не найден или недоступен`,
      };
    }

    const qty = params.quantity ?? 1;
    if (product.quantity < qty) {
      return {
        success: false,
        message: `❌ Недостаточно товара. В наличии: ${product.quantity} шт.`,
      };
    }

    let customer: string | undefined;
    if (params.customerName && params.customerContact) {
      customer = `${params.customerName} (${params.customerContact})`;
    } else if (params.customerName) {
      customer = params.customerName;
    } else if (params.customerContact) {
      customer = params.customerContact;
    }

    const sale = {
      productId: product.id,
      productSku: product.sku,
      productName: `${product.brand} ${product.model} (${product.size})`,
      quantity: qty,
      price: product.retailPrice,
      purchasePrice: product.purchasePrice,
      total: product.retailPrice * qty,
      profit: (product.retailPrice - product.purchasePrice) * qty,
      date: new Date().toISOString(),
      customer,
      deliveryMethod: 'in_person' as const,
      status: 'completed' as const,
      source: 'ai_agent',
    };

    const saleRef = await addDoc(collection(db, 'sales'), sale);

    const newQuantity = product.quantity - qty;
    const productRef = doc(db, 'products', product.id);
    await updateDoc(productRef, {
      quantity: newQuantity,
      ...(newQuantity <= 0 ? { status: 'sold_out' } : {}),
    });

    return {
      success: true,
      message:
        `✅ Продажа создана!\n\n` +
        `${sale.productName}\n` +
        `Цена: ${sale.total} Br\n` +
        (customer ? `Покупатель: ${customer}` : ''),
      data: { id: saleRef.id, ...sale },
      canUndo: true,
      undoData: { saleId: saleRef.id, productId: product.id, previousQuantity: product.quantity, previousStatus: product.status },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка создания продажи: ${msg}` };
  }
}

export interface CreateClientPreorderParams {
  brand: string;
  model: string;
  sizes: string[];
  color?: string;
  customerName: string;
  customerContact: string;
}

// Create customer preorder(s)
export async function createClientPreorder(params: CreateClientPreorderParams): Promise<ToolResult> {
  const DEFAULT_PREORDER_DAYS = 14;
  try {
    const createdIds: string[] = [];
    const colorNote = params.color ? ` ${params.color}` : '';
    const expectedDate = new Date(Date.now() + DEFAULT_PREORDER_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const size of params.sizes) {
      const preorder = {
        modelId: '',
        modelName: `${params.brand} ${params.model}${colorNote}`,
        sizeId: '',
        sizeEU: size,
        quantity: 1,
        purchasePrice: 0,
        retailPrice: 0,
        supplier: '',
        expectedDate,
        status: 'pending',
        notes: `Клиент: ${params.customerName} (${params.customerContact})`,
        createdAt: new Date().toISOString(),
        customerName: params.customerName,
        customerContact: params.customerContact,
        source: 'ai_agent',
      };

      const docRef = await addDoc(collection(db, 'preorders'), preorder);
      createdIds.push(docRef.id);
    }

    return {
      success: true,
      message:
        `✅ Предзаказ создан!\n\n` +
        `${params.brand} ${params.model}${colorNote}\n` +
        `Размеры: ${params.sizes.join(', ')}\n` +
        `Клиент: ${params.customerName} (${params.customerContact})\n` +
        `Создано предзаказов: ${params.sizes.length}`,
      data: { createdIds },
      affectedCount: params.sizes.length,
      canUndo: true,
      undoData: { preorderIds: createdIds },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка создания предзаказа: ${msg}` };
  }
}

// Get sales statistics for a period
export async function getSalesStatistics(period: 'today' | 'week' | 'month' | 'all'): Promise<ToolResult> {
  try {
    const now = new Date();
    let cutoff = new Date(0);

    if (period === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const snapshot = await getDocs(collection(db, 'sales'));
    const sales = snapshot.docs
      .map(d => d.data() as Sale)
      .filter(s => s.status === 'completed' && new Date(s.date) >= cutoff);

    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);

    const periodLabels: Record<string, string> = {
      today: 'Сегодня',
      week: 'За неделю',
      month: 'За месяц',
      all: 'Всё время',
    };

    return {
      success: true,
      message:
        `📊 Статистика: ${periodLabels[period]}\n\n` +
        `Продаж: ${sales.length}\n` +
        `Выручка: ${totalRevenue.toLocaleString('ru-RU')} Br\n` +
        `Прибыль: ${totalProfit.toLocaleString('ru-RU')} Br`,
      data: { count: sales.length, totalRevenue, totalProfit },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ошибка получения статистики: ${msg}` };
  }
}
