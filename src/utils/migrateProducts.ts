import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, Preorder } from '../types';

interface GroupedModel {
  brand: string;
  model: string;
  color: string;
  purchasePrice: number;
  retailPrice: number;
  supplier: string;
  category: 'sport' | 'lifestyle' | 'limited';
  dateAdded: string;
  sizes: Array<{
    eu: string;
    quantity: number;
    status: 'available' | 'preorder' | 'sold_out';
    productId: string;
  }>;
}

export async function migrateProducts() {
  try {
    console.log('🚀 Начало миграции...');

    // 1. Получить все продукты
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const products: (Product & { id: string })[] = [];

    snapshot.forEach((d) => {
      products.push({ id: d.id, ...d.data() } as Product & { id: string });
    });

    console.log(`📦 Найдено ${products.length} товаров`);

    // 2. Группировать по моделям (brand + model + color)
    const grouped = new Map<string, GroupedModel>();

    products.forEach((p) => {
      const key = `${p.brand}-${p.model}-${p.color || 'default'}`.toLowerCase();

      if (!grouped.has(key)) {
        grouped.set(key, {
          brand: p.brand,
          model: p.model,
          color: p.color || '',
          purchasePrice: p.purchasePrice,
          retailPrice: p.retailPrice,
          supplier: p.supplier || '',
          category: p.category,
          dateAdded: p.dateAdded,
          sizes: [],
        });
      }

      const model = grouped.get(key)!;
      model.sizes.push({
        eu: p.size,
        quantity: p.quantity,
        status: p.status,
        productId: p.id,
      });
    });

    console.log(`🔄 Сгруппировано в ${grouped.size} моделей`);

    // 3. Создать новые записи products с улучшенными полями
    const migratedIds: string[] = [];

    for (const [, model] of grouped.entries()) {
      for (const size of model.sizes) {
        const newProduct = {
          sku: `${model.brand.substring(0, 3).toUpperCase()}-${model.model.substring(0, 3).toUpperCase()}-${size.eu}`,
          brand: model.brand,
          model: model.model,
          size: size.eu,
          color: model.color,
          quantity: size.quantity,
          purchasePrice: model.purchasePrice,
          retailPrice: model.retailPrice,
          dateAdded: model.dateAdded,
          supplier: model.supplier,
          category: model.category,
          status: size.status === 'preorder' ? 'available' : size.status,
          location: '',
          minStock: 2,
        };

        // Создать preorder если статус был preorder
        if (size.status === 'preorder') {
          const preorder: Omit<Preorder, 'id'> = {
            modelId: '',
            modelName: `${model.brand} ${model.model}${model.color ? ' "' + model.color + '"' : ''}`,
            sizeId: '',
            sizeEU: size.eu,
            quantity: size.quantity,
            purchasePrice: model.purchasePrice,
            retailPrice: model.retailPrice,
            supplier: model.supplier,
            expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            notes: 'Перенесено из старых данных',
            createdAt: new Date().toISOString(),
          };

          await addDoc(collection(db, 'preorders'), preorder);
          console.log(`  ✅ Создан предзаказ: ${preorder.modelName} EU ${size.eu}`);
        }

        // Создать новую запись сначала, чтобы при ошибке старая не была потеряна
        await addDoc(collection(db, 'products'), newProduct);

        // Удалить старую запись только после успешного создания новой
        await deleteDoc(doc(db, 'products', size.productId));
        migratedIds.push(size.productId);
        console.log(`  ✅ Мигрирован: ${model.brand} ${model.model} EU ${size.eu}`);
      }
    }

    console.log('✅ Миграция завершена!');
    console.log(`📊 Обработано ${migratedIds.length} товаров`);
    console.log(`🏷️ Создано ${grouped.size} моделей`);

    return {
      success: true,
      migratedCount: migratedIds.length,
      modelsCount: grouped.size,
    };
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  }
}
