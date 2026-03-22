import React, { useState } from 'react';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product, ShoeModel, ModelSize } from '../types';
import { SIZE_CHART_MAP } from '../constants/sizeChart';

const MigrateData: React.FC = () => {
  const { data: products, loading: loadingProducts } = useFirestore<Product>('products');
  const { data: models } = useFirestore<ShoeModel>('models');
  const { add: addModel } = useFirestore<ShoeModel>('models');
  const { add: addSize } = useFirestore<ModelSize>('modelSizes');
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ models: number; sizes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseSizeEU = (sizeStr: string): string => {
    const cleaned = sizeStr.replace(/[^0-9.]/g, '');
    return cleaned || sizeStr;
  };

  const handleMigrate = async () => {
    if (!window.confirm(
      `Перенести ${products.length} товаров в новую структуру (Модели + Размеры)?\n\n` +
      'Товары будут сгруппированы по: Бренд + Модель + Цвет.\n' +
      'Каждая группа станет одной моделью с несколькими размерами.\n\n' +
      'Старые данные останутся без изменений.'
    )) return;

    setMigrating(true);
    setError(null);
    setResult(null);

    try {
      // Group products by brand + model + color
      const groups: Record<string, Product[]> = {};
      products.forEach((p) => {
        const key = `${p.brand.trim().toLowerCase()}|${p.model.trim().toLowerCase()}|${(p.color || '').trim().toLowerCase()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      });

      let modelsCreated = 0;
      let sizesCreated = 0;

      for (const group of Object.values(groups)) {
        const first = group[0];

        // Create model
        const modelId = await addModel({
          sku: first.sku,
          brand: first.brand,
          model: first.model,
          colorway: first.color || '',
          images: [],
          purchasePrice: first.purchasePrice,
          retailPrice: first.retailPrice,
          supplier: first.supplier || '',
          category: first.category,
          dateAdded: first.dateAdded,
          minStock: first.minStock,
        });
        modelsCreated++;

        // Create sizes for each product in the group
        for (const product of group) {
          const sizeEU = parseSizeEU(product.size);
          const sizeCM = SIZE_CHART_MAP[sizeEU] ?? 0;

          await addSize({
            modelId,
            sizeEU,
            sizeCM,
            quantity: product.quantity,
            status: product.quantity > 0 ? 'available' : 'sold_out',
          });
          sizesCreated++;
        }
      }

      setResult({ models: modelsCreated, sizes: sizesCreated });
    } catch (err) {
      console.error('Migration error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при миграции');
    } finally {
      setMigrating(false);
    }
  };

  if (loadingProducts) {
    return <p className="text-gray-500">Загрузка...</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Миграция данных</h3>
      <p className="text-sm text-gray-600">
        Перенос товаров из старого формата (1 товар = 1 размер) в новый формат (1 модель = много размеров).
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Старых товаров (products):</span>
          <span className="font-medium">{products.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Моделей уже создано (models):</span>
          <span className="font-medium">{models.length}</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Нет старых товаров для миграции
        </div>
      ) : (
        <button
          onClick={handleMigrate}
          disabled={migrating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          {migrating ? 'Миграция...' : `Перенести ${products.length} товаров`}
        </button>
      )}

      {result && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>
            Миграция завершена! Создано моделей: {result.models}, размеров: {result.sizes}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Ошибка: {error}</span>
        </div>
      )}
    </div>
  );
};

export default MigrateData;
