import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product } from '../types';
import { SIZE_CHART, SIZE_OPTIONS } from '../utils/sizeChart';

interface SizeEntry {
  eu: string;
  quantity: number;
  selected: boolean;
}

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

// Form for adding one model with multiple sizes at once
interface BulkAddFormProps {
  onSave: (items: Omit<Product, 'id'>[]) => Promise<void>;
  onCancel: () => void;
}

const BulkAddForm: React.FC<BulkAddFormProps> = ({ onSave, onCancel }) => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState<Product['category']>('sport');
  const [status, setStatus] = useState<Product['status']>('available');
  const [dateAdded, setDateAdded] = useState(new Date().toISOString().split('T')[0]);
  const [sizes, setSizes] = useState<SizeEntry[]>(
    SIZE_OPTIONS.map((eu) => ({ eu, quantity: 1, selected: false }))
  );

  const toggleSize = (eu: string) => {
    setSizes((prev) =>
      prev.map((s) => (s.eu === eu ? { ...s, selected: !s.selected } : s))
    );
  };

  const setQty = (eu: string, qty: number) => {
    setSizes((prev) =>
      prev.map((s) => (s.eu === eu ? { ...s, quantity: Math.max(0, qty) } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = sizes.filter((s) => s.selected && s.quantity > 0);
    if (!brand || !model) {
      alert('Заполните обязательные поля: Бренд, Модель');
      return;
    }
    if (selected.length === 0) {
      alert('Отметьте хотя бы один размер');
      return;
    }
    const items: Omit<Product, 'id'>[] = selected.map((s) => ({
      sku: sku ? `${sku}-${s.eu}` : '',
      brand,
      model,
      size: s.eu,
      color,
      quantity: s.quantity,
      purchasePrice,
      retailPrice,
      dateAdded,
      supplier,
      category,
      status,
      location: '',
      minStock: 2,
    }));
    await onSave(items);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Добавить модель с размерной сеткой</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бренд *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Модель *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цвет / Colorway</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Базовый артикул (SKU)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DC0774"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Закупочная цена (Br)</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Розничная цена (Br)</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={retailPrice}
                onChange={(e) => setRetailPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value as Product['category'])}
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
                value={status}
                onChange={(e) => setStatus(e.target.value as Product['status'])}
              >
                <option value="available">В наличии</option>
                <option value="preorder">Предзаказ</option>
                <option value="sold_out">Нет в наличии</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата поступления</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
              />
            </div>
          </div>

          {/* Size grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Размерная сетка</h3>
            <p className="text-xs text-gray-500 mb-3">Отметьте доступные размеры и укажите количество:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {sizes.map((s) => (
                <div
                  key={s.eu}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                    s.selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={s.selected}
                    onChange={() => toggleSize(s.eu)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    EU {s.eu}
                    <span className="text-gray-400 ml-1">/ {SIZE_CHART[s.eu]} см</span>
                  </span>
                  {s.selected && (
                    <input
                      type="number"
                      min="0"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={s.quantity}
                      onChange={(e) => setQty(s.eu, Number(e.target.value))}
                      placeholder="Кол-во"
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Выбрано: {sizes.filter((s) => s.selected).length} размеров
            </p>
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
              Добавить модель
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
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const suppliers = Array.from(new Set(products.filter((p) => p.supplier).map((p) => p.supplier!))).sort();

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.modelArticle?.toLowerCase().includes(q) ?? false);
    const matchesSupplier = !selectedSupplier || (p.supplier || '') === selectedSupplier;
    return matchesSearch && matchesSupplier;
  });

  const handleAdd = async (data: Omit<Product, 'id'>) => {
    await add(data);
    setShowForm(false);
  };

  const handleBulkAdd = async (items: Omit<Product, 'id'>[]) => {
    for (const item of items) {
      await add(item);
    }
    setShowBulkForm(false);
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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBulkForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Layers className="w-4 h-4 mr-2" />
            Добавить модель (сетка размеров)
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

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Поиск по бренду, модели, артикулу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Все поставщики</option>
          {suppliers.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Бренд / Модель', 'Цвет', 'Размеры', 'Поставщик', 'Кол-во', 'Цена', 'Категория', 'Действия'].map(
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
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    {products.length === 0 ? 'Товаров нет. Добавьте первый!' : 'Ничего не найдено'}
                  </td>
                </tr>
              ) : (
                (() => {
                  const groupMap: Record<string, Product[]> = {};
                  for (const p of filtered) {
                    const key = JSON.stringify([p.brand, p.model, p.color]);
                    if (!groupMap[key]) groupMap[key] = [];
                    groupMap[key].push(p);
                  }
                  return Object.entries(groupMap).map(([key, items]) => {
                    const first = items[0];
                    const isExpanded = expandedGroups.has(key);
                    const totalQuantity = items.reduce((s, p) => s + p.quantity, 0);
                    const sizes = items.map(p => p.size).join(', ');
                    const prices = items.map(p => p.retailPrice);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const priceRange = minPrice === maxPrice
                      ? `${minPrice.toLocaleString('ru-RU')} Br`
                      : `${minPrice.toLocaleString('ru-RU')}–${maxPrice.toLocaleString('ru-RU')} Br`;
                    return (
                      <React.Fragment key={key}>
                        <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleGroup(key)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-blue-700">
                              {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                              <span className="font-medium">{first.brand} {first.model}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{first.color}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-blue-600">{sizes}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{first.supplier || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-semibold ${totalQuantity === 0 ? 'text-red-600' : 'text-green-700'}`}>
                              {totalQuantity} шт.
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{priceRange}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{categoryLabels[first.category]}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{items.length} вар.</td>
                        </tr>
                        {isExpanded && items.map((p) => {
                          const isLow = p.quantity <= p.minStock;
                          return (
                            <tr key={p.id} className={`border-l-4 border-blue-300 ${isLow ? 'bg-red-50' : 'bg-white'}`}>
                              <td className="px-4 py-2 pl-10 text-sm text-gray-700">
                                <div className="flex flex-col">
                                  <span className="font-mono text-xs">{p.modelArticle || p.sku}</span>
                                  {p.modelArticle && p.modelArticle !== p.sku && (
                                    <span className="text-xs text-gray-400">SKU: {p.sku}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{p.color}</td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-800">
                                {p.size}
                                {p.sizeInCm && <span className="text-gray-400 text-xs ml-1">({p.sizeInCm} см)</span>}
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                                  {statusLabels[p.status]}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{p.supplier || '—'}</td>
                              <td className="px-4 py-2 text-sm font-semibold">
                                <span className={isLow ? 'text-red-600' : 'text-gray-900'}>
                                  {p.quantity}
                                  {isLow && <span className="ml-1 text-xs font-normal text-red-500">⚠ мало</span>}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {p.retailPrice.toLocaleString('ru-RU')} Br
                                <span className="ml-1 text-xs text-blue-600">
                                  (+{(p.retailPrice - p.purchasePrice).toLocaleString('ru-RU')})
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">{categoryLabels[p.category]}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditProduct(p); }}
                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                    title="Редактировать"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Удалить"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()
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

      {/* Bulk Add Form */}
      {showBulkForm && (
        <BulkAddForm
          onSave={handleBulkAdd}
          onCancel={() => setShowBulkForm(false)}
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
    </div>
  );
};

export default Catalog;
