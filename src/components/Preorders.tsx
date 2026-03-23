import React, { useState } from 'react';
import { Package, CheckCircle, Search, Clock, Truck, Eye } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product } from '../types';

const Preorders: React.FC = () => {
  const { data: products, loading, update } = useFirestore<Product>('products');
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const preorders = products.filter((p) => p.status === 'preorder');
  const filtered = preorders.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const handleMakeAvailable = async (product: Product) => {
    await update(product.id, { status: 'available' });
    setConfirmId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Package className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Предзаказы</h2>
            <p className="text-sm text-gray-500">{preorders.length} товар(ов) ожидают поступления</p>
          </div>
        </div>
      </div>

      {/* Search */}
      {preorders.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white transition-shadow"
            placeholder="Поиск по бренду, модели, артикулу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">
            {preorders.length === 0 ? 'Нет товаров на предзаказе' : 'Ничего не найдено'}
          </p>
          {preorders.length === 0 && (
            <p className="text-gray-400 text-sm mt-1">Товары со статусом "Предзаказ" появятся здесь</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    {p.sku}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Clock className="w-3 h-3" />
                  Предзаказ
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900">{p.brand}</h3>
              <p className="text-gray-500 text-sm mb-3">{p.model}</p>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 text-xs">Размер</span>
                  <p className="font-semibold text-gray-700">{p.size}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 text-xs">Цвет</span>
                  <p className="font-semibold text-gray-700">{p.color || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 text-xs">Количество</span>
                  <p className="font-semibold text-gray-700">{p.quantity} шт.</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 text-xs">Розничная цена</span>
                  <p className="font-semibold text-gray-700">{p.retailPrice.toLocaleString('ru-RU')} Br</p>
                </div>
              </div>

              {p.supplier && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{p.supplier}</span>
                </div>
              )}

              {confirmId === p.id ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2 animate-fadeIn">
                  <p className="text-sm text-green-800 font-medium">Товар поступил?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMakeAvailable(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Да, в наличии
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(p.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow"
                >
                  <CheckCircle className="w-4 h-4" />
                  Перевести в наличие
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {preorders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Сводка предзаказов</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-amber-600">Всего позиций</p>
              <p className="text-xl font-bold text-amber-900">{preorders.length}</p>
            </div>
            <div>
              <p className="text-xs text-amber-600">Общее количество</p>
              <p className="text-xl font-bold text-amber-900">
                {preorders.reduce((sum, p) => sum + p.quantity, 0)} шт.
              </p>
            </div>
            <div>
              <p className="text-xs text-amber-600">Общая стоимость</p>
              <p className="text-xl font-bold text-amber-900">
                {preorders.reduce((sum, p) => sum + p.retailPrice * p.quantity, 0).toLocaleString('ru-RU')} Br
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preorders;
