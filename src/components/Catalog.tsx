import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Grid3X3 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product } from '../types';

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
  available: 'bg-green-100 text-green-800',
  preorder: 'bg-yellow-100 text-yellow-800',
  sold_out: 'bg-gray-100 text-gray-800',
};

interface ProductFormProps {
  initial: Omit<Product, 'id'>;
  onSave: (data: Omit<Product, 'id'>) => void;
  onCancel: () => void;
  title: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, onSave, onCancel, title }) => {
  const [form, setForm] = useState<Omit<Product, 'id'>>(initial);

  const set = (field: keyof Omit<Product, 'id'>, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.brand || !form.model || !form.size) {
      alert('Заполните обязательные поля: Артикул, Бренд, Модель, Размер');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бренд *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Модель *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Размер *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.size}
                onChange={(e) => set('size', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.retailPrice}
                onChange={(e) => set('retailPrice', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.supplier}
                onChange={(e) => set('supplier', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Местоположение
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.dateAdded}
                onChange={(e) => set('dateAdded', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SizeEntry {
  size: string;
  quantity: number;
}

interface SizeGridFormProps {
  onSave: (products: Omit<Product, 'id'>[]) => void;
  onCancel: () => void;
}

const SizeGridForm: React.FC<SizeGridFormProps> = ({ onSave, onCancel }) => {
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Product['category']>('sport');
  const [status, setStatus] = useState<Product['status']>('available');
  const [minStock, setMinStock] = useState(2);
  const [dateAdded, setDateAdded] = useState(new Date().toISOString().split('T')[0]);
  const [sizes, setSizes] = useState<SizeEntry[]>([{ size: '', quantity: 1 }]);

  const addSizeRow = () => {
    setSizes([...sizes, { size: '', quantity: 1 }]);
  };

  const removeSizeRow = (index: number) => {
    if (sizes.length === 1) return;
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof SizeEntry, value: string | number) => {
    setSizes(sizes.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !brand || !model) {
      alert('Заполните обязательные поля: Артикул, Бренд, Модель');
      return;
    }
    const validSizes = sizes.filter((s) => s.size.trim());
    if (validSizes.length === 0) {
      alert('Добавьте хотя бы один размер');
      return;
    }
    const products: Omit<Product, 'id'>[] = validSizes.map((s) => ({
      sku,
      brand,
      model,
      size: s.size.trim(),
      color,
      quantity: s.quantity,
      purchasePrice,
      retailPrice,
      dateAdded,
      supplier,
      category,
      status,
      location,
      minStock,
    }));
    onSave(products);
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Добавить размерную сетку</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Артикул (SKU) *</label>
              <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бренд *</label>
              <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Модель *</label>
              <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
              <input className={inputClass} value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Закупочная цена (Br)</label>
              <input type="number" min="0" className={inputClass} value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Розничная цена (Br)</label>
              <input type="number" min="0" className={inputClass} value={retailPrice} onChange={(e) => setRetailPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик</label>
              <input className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Местоположение</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as Product['category'])}>
                <option value="sport">Спорт</option>
                <option value="lifestyle">Лайфстайл</option>
                <option value="limited">Лимитед</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as Product['status'])}>
                <option value="available">В наличии</option>
                <option value="preorder">Предзаказ</option>
                <option value="sold_out">Нет в наличии</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Мин. остаток</label>
              <input type="number" min="0" className={inputClass} value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата поступления</label>
              <input type="date" className={inputClass} value={dateAdded} onChange={(e) => setDateAdded(e.target.value)} />
            </div>
          </div>

          {/* Size grid */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Размеры и количество</h3>
              <button
                type="button"
                onClick={addSizeRow}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить размер
              </button>
            </div>
            <div className="space-y-2">
              {sizes.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      className={inputClass}
                      placeholder="Размер (напр. EU 42 - CM 27)"
                      value={entry.size}
                      onChange={(e) => updateSize(idx, 'size', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      placeholder="Кол-во"
                      value={entry.quantity}
                      onChange={(e) => updateSize(idx, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSizeRow(idx)}
                    disabled={sizes.length === 1}
                    className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {sizes.filter((s) => s.size.trim()).length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Будет создано позиций: {sizes.filter((s) => s.size.trim()).length}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Сохранить все размеры
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
  const [showSizeGrid, setShowSizeGrid] = useState(false);
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

  const handleAddSizeGrid = async (products: Omit<Product, 'id'>[]) => {
    for (const product of products) {
      await add(product);
    }
    setShowSizeGrid(false);
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
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Каталог товаров</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSizeGrid(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Размерная сетка
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить товар
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Поиск по бренду, модели, артикулу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Артикул', 'Бренд / Модель', 'Размер', 'Цвет', 'Кол-во', 'Цена', 'Маржа', 'Маржа %', 'Категория', 'Статус', 'Действия'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                    {products.length === 0 ? 'Товаров нет. Добавьте первый!' : 'Ничего не найдено'}
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const isLow = p.quantity <= p.minStock;
                  return (
                    <tr
                      key={p.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                        isLow ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{p.brand}</div>
                        <div className="text-gray-500">{p.model}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.size}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.color}</td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold ${
                          isLow ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {p.quantity}
                        {isLow && <span className="ml-1 text-xs font-normal text-red-500">⚠ мало</span>}
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
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {categoryLabels[p.category]}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}
                        >
                          {statusLabels[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
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
        />
      )}

      {/* Size Grid Form */}
      {showSizeGrid && (
        <SizeGridForm
          onSave={handleAddSizeGrid}
          onCancel={() => setShowSizeGrid(false)}
        />
      )}
    </div>
  );
};

export default Catalog;
