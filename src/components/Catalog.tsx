import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Grid3X3, Type } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product, SIZE_GRID } from '../types';

const emptyProduct: Omit<Product, 'id'> = {
  sku: '',
  brand: '',
  model: '',
  size: '',
  color: '',
  quantity: 0,
  purchasePrice: 0,
  retailPrice: 0,
  dateAdded: new Date().toISOString().split('T')[0],
  supplier: '',
  category: 'sport',
  status: 'available',
  location: '',
  minStock: 2,
};

const categoryLabels: Record<Product['category'], string> = {
  sport: 'Спорт',
  lifestyle: 'Лайфстайл',
  limited: 'Лимитед',
};

const statusLabels: Record<Product['status'], string> = {
  available: 'В наличии',
  preorder: 'Предзаказ',
  sold_out: 'Нет в наличии',
};

const statusColors: Record<Product['status'], string> = {
  available: 'bg-green-100 text-green-700',
  preorder: 'bg-amber-100 text-amber-700',
  sold_out: 'bg-gray-100 text-gray-600',
};

interface ProductFormProps {
  initial: Omit<Product, 'id'>;
  onSave: (data: Omit<Product, 'id'>) => void;
  onSaveMultiple?: (data: Omit<Product, 'id'>, sizes: string[]) => void;
  onCancel: () => void;
  title: string;
  isEdit?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, onSave, onSaveMultiple, onCancel, title, isEdit }) => {
  const [form, setForm] = useState<Omit<Product, 'id'>>(initial);
  const [useSizeGrid, setUseSizeGrid] = useState(!isEdit);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    isEdit && initial.size ? [initial.size] : []
  );

  const set = (field: keyof Omit<Product, 'id'>, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSize = (sizeStr: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeStr)
        ? prev.filter((s) => s !== sizeStr)
        : [...prev, sizeStr]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.brand || !form.model) {
      alert('Заполните обязательные поля: Артикул, Бренд, Модель');
      return;
    }

    if (useSizeGrid && !isEdit) {
      if (selectedSizes.length === 0) {
        alert('Выберите хотя бы один размер');
        return;
      }
      onSaveMultiple?.(form, selectedSizes);
    } else {
      if (!form.size) {
        alert('Укажите размер');
        return;
      }
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Артикул (SKU) *
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бренд *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Модель *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </div>
          </div>

          {/* Size Section */}
          <div className="border border-gray-200 rounded-xl p-4">
            {!isEdit && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">Размер *</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setUseSizeGrid(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      useSizeGrid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    Размерная сетка
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSizeGrid(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      !useSizeGrid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    Вручную
                  </button>
                </div>
              </div>
            )}

            {useSizeGrid && !isEdit ? (
              <div>
                {selectedSizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedSizes.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-lg"
                      >
                        {s}
                        <button type="button" onClick={() => toggleSize(s)} className="hover:text-blue-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-60 overflow-y-auto">
                  {SIZE_GRID.map((size) => {
                    const sizeStr = `EU ${size.eu} / ${size.cm} cm`;
                    const isSelected = selectedSizes.includes(sizeStr);
                    return (
                      <button
                        key={size.eu}
                        type="button"
                        onClick={() => toggleSize(sizeStr)}
                        className={`p-2 rounded-lg text-xs font-medium border-2 transition-all duration-150 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-bold">{size.eu}</div>
                        <div className="text-[10px] text-gray-400">{size.cm} cm</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Выбрано: {selectedSizes.length} размер(ов). Будет создано {selectedSizes.length} товар(ов).
                </p>
              </div>
            ) : (
              <div>
                {isEdit && <label className="block text-sm font-medium text-gray-700 mb-1">Размер *</label>}
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={form.size}
                  onChange={(e) => set('size', e.target.value)}
                  placeholder="Например: EU 42 / 27.0 cm"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.quantity}
                onChange={(e) => set('quantity', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Закупочная цена (Br)
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.purchasePrice}
                onChange={(e) => set('purchasePrice', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Розничная цена (Br)
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.retailPrice}
                onChange={(e) => set('retailPrice', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.supplier}
                onChange={(e) => set('supplier', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Местоположение
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                <option value="sport">Спорт</option>
                <option value="lifestyle">Лайфстайл</option>
                <option value="limited">Лимитед</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="available">В наличии</option>
                <option value="preorder">Предзаказ</option>
                <option value="sold_out">Нет в наличии</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Минимальный остаток
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.minStock}
                onChange={(e) => set('minStock', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата поступления
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={form.dateAdded}
                onChange={(e) => set('dateAdded', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              {useSizeGrid && !isEdit && selectedSizes.length > 1
                ? `Создать ${selectedSizes.length} товар(ов)`
                : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Catalog: React.FC = () => {
  const { data: products, loading, add, update, remove } = useFirestore<Product>('products');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (data: Omit<Product, 'id'>) => {
    await add(data);
    setShowForm(false);
  };

  const handleAddMultiple = async (data: Omit<Product, 'id'>, sizes: string[]) => {
    for (const size of sizes) {
      await add({ ...data, size });
    }
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Product, 'id'>) => {
    if (!editProduct?.id) return;
    await update(editProduct.id, data);
    setEditProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить этот товар?')) {
      await remove(id);
    }
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
        <h2 className="text-xl font-bold text-gray-900">Каталог товаров</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить товар
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          placeholder="Поиск по бренду, модели, артикулу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Mobile Cards */}
      <div className="mobile-card space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-400">
              {products.length === 0 ? 'Товаров нет. Добавьте первый!' : 'Ничего не найдено'}
            </p>
          </div>
        ) : (
          filtered.map((p) => {
            const isLow = p.quantity <= p.minStock;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl shadow-sm border p-4 transition-all duration-200 ${
                  isLow ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{p.sku}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                    {statusLabels[p.status]}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">{p.brand}</h3>
                <p className="text-sm text-gray-500 mb-3">{p.model}</p>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <span className="text-gray-400 block">Размер</span>
                    <span className="font-semibold text-gray-700">{p.size}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <span className="text-gray-400 block">Кол-во</span>
                    <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                      {p.quantity}{isLow && ' ⚠'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <span className="text-gray-400 block">Цена</span>
                    <span className="font-semibold text-gray-700">{p.retailPrice.toLocaleString('ru-RU')} Br</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-400">Маржа: </span>
                    <span className="font-medium text-blue-600">
                      {(p.retailPrice - p.purchasePrice).toLocaleString('ru-RU')} Br
                      {p.purchasePrice > 0 && (
                        <span className="text-xs text-blue-400 ml-1">
                          ({((p.retailPrice - p.purchasePrice) / p.purchasePrice * 100).toFixed(0)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditProduct(p)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="desktop-table bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                {['Артикул', 'Бренд / Модель', 'Размер', 'Цвет', 'Кол-во', 'Цена', 'Маржа', '%', 'Категория', 'Статус', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    {products.length === 0 ? 'Товаров нет. Добавьте первый!' : 'Ничего не найдено'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.quantity <= p.minStock;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/80 transition-colors ${isLow ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900">{p.brand}</div>
                        <div className="text-gray-500 text-xs">{p.model}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.size}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.color || '—'}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.quantity}
                        {isLow && <span className="ml-1 text-xs font-normal text-red-400">⚠</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.retailPrice.toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {(p.retailPrice - p.purchasePrice).toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {p.purchasePrice > 0
                          ? ((p.retailPrice - p.purchasePrice) / p.purchasePrice * 100).toFixed(1) + '%'
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {categoryLabels[p.category]}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                          {statusLabels[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <ProductForm
          title="Добавить товар"
          initial={emptyProduct}
          onSave={handleAdd}
          onSaveMultiple={handleAddMultiple}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form */}
      {editProduct && (
        <ProductForm
          title="Редактировать товар"
          initial={editProduct}
          onSave={handleEdit}
          onCancel={() => setEditProduct(null)}
          isEdit
        />
      )}
    </div>
  );
};

export default Catalog;
