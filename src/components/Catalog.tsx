import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFirestore } from '../hooks/useFirestore';
import { Product } from '../types';
import { SIZE_OPTIONS } from '../utils/sizeChart';
import ImageUpload from './ImageUpload';
import { useViewMode } from '../contexts/ViewModeContext';

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
  const [productImages, setProductImages] = useState<string[]>(initial.images || []);

  const set = (field: keyof Omit<Product, 'id'>, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.brand || !form.model || !form.size) {
      alert('Заполните обязательные поля: Артикул, Бренд, Модель, Размер');
      return;
    }
    onSave({
      ...form,
      images: productImages.length > 0 ? productImages : [],
    });
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
          <ImageUpload
            images={productImages}
            onImagesChange={setProductImages}
            productSku={form.sku || 'temp'}
          />
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
  const [bulkImages, setBulkImages] = useState<string[]>([]);
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
      images: bulkImages.length > 0 ? bulkImages : [],
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

          <ImageUpload
            images={bulkImages}
            onImagesChange={setBulkImages}
            productSku={sku || 'temp'}
          />

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
  const { isMobileView } = useViewMode();
  const { data: products, loading, add, update, remove } = useFirestore<Product>('products');
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newSize, setNewSize] = useState({
    size: '',
    quantity: 1,
    purchasePrice: '' as string | number,
  });
  const [showReservedOnly, setShowReservedOnly] = useState(false);

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
    const matchesReserved = !showReservedOnly || p.isReserved === true;
    return matchesSearch && matchesSupplier && matchesReserved;
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

  const openAddSizeModal = (product: Product) => {
    setSelectedProduct(product);
    setNewSize({
      size: '',
      quantity: 1,
      purchasePrice: product.purchasePrice || '',
    });
    setShowAddSizeModal(true);
  };

  const handleAddSize = async () => {
    if (!newSize.size || !selectedProduct) return;

    if (selectedProduct.sizes?.includes(String(newSize.size))) {
      alert(`Размер ${newSize.size} уже существует!`);
      return;
    }

    try {
      const productRef = doc(db, 'products', selectedProduct.id);

      const newVariant = {
        id: Date.now().toString(),
        size: String(newSize.size),
        quantity: Number(newSize.quantity),
        purchasePrice: Number(newSize.purchasePrice),
        createdAt: new Date(),
      };

      await updateDoc(productRef, {
        sizes: arrayUnion(String(newSize.size)),
        variants: arrayUnion(newVariant),
        quantity: (selectedProduct.quantity || 0) + Number(newSize.quantity),
        updatedAt: new Date(),
      });

      setShowAddSizeModal(false);
      setNewSize({ size: '', quantity: 1, purchasePrice: '' });
      alert(`Размер ${newSize.size} добавлен!`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Ошибка: ${message}`);
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
    <div className="space-y-4" style={{ padding: isMobileView ? '16px' : '24px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Каталог товаров
          {(() => {
            const inStockCount = products.filter(p => (p.quantity || 0) > 0).length;
            return inStockCount > 0 ? (
              <span style={{
                marginLeft: '12px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid #A7F3D0',
                verticalAlign: 'middle'
              }}>
                ✓ {inStockCount} в наличии
              </span>
            ) : null;
          })()}
        </h2>
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

      {/* View toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setViewMode('cards')}
          style={{
            padding: '6px 14px',
            backgroundColor: viewMode === 'cards' ? '#3B82F6' : '#F1F5F9',
            color: viewMode === 'cards' ? 'white' : '#475569',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          ⊞ Карточки
        </button>
        <button
          onClick={() => setViewMode('table')}
          style={{
            padding: '6px 14px',
            backgroundColor: viewMode === 'table' ? '#3B82F6' : '#F1F5F9',
            color: viewMode === 'table' ? 'white' : '#475569',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          ☰ Таблица
        </button>
        <button
          onClick={() => setShowReservedOnly(!showReservedOnly)}
          style={{
            padding: '6px 14px',
            backgroundColor: showReservedOnly ? '#6366F1' : '#F1F5F9',
            color: showReservedOnly ? 'white' : '#475569',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: showReservedOnly ? '700' : '500',
            marginLeft: 'auto',
            boxShadow: showReservedOnly ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          🔒 Резерв
        </button>
      </div>

      {viewMode === 'cards' ? (
        /* Card Grid View */
        filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94A3B8'
          }}>
            <div style={{ fontSize: '64px' }}>👟</div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              marginTop: '16px',
              color: '#475569'
            }}>
              {products.length === 0 ? 'Товаров нет' : 'Товаров не найдено'}
            </div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              {products.length === 0 ? 'Добавьте первый товар!' : 'Попробуй изменить поиск'}
            </div>
          </div>
        ) : (
          (() => {
            const groupMap: Record<string, Product[]> = {};
            for (const p of filtered) {
              const key = JSON.stringify([p.brand, p.model, p.color]);
              if (!groupMap[key]) groupMap[key] = [];
              groupMap[key].push(p);
            }
            // Sort groups: in-stock first
            const sortedEntries = Object.entries(groupMap).sort((a, b) => {
              const aQty = a[1].reduce((s, p) => s + p.quantity, 0);
              const bQty = b[1].reduce((s, p) => s + p.quantity, 0);
              if (bQty > 0 && aQty === 0) return 1;
              if (aQty > 0 && bQty === 0) return -1;
              return 0;
            });
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
                padding: '16px 0',
              }}>
                {sortedEntries.map(([key, items]) => {
                  const first = items[0];
                  const isExpanded = expandedGroups.has(key);
                  const totalQuantity = items.reduce((s, p) => s + p.quantity, 0);
                  const isInStock = totalQuantity > 0;
                  const sizes = items.map(p => p.size);
                  const prices = items.map(p => p.retailPrice);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const priceRange = minPrice === maxPrice
                    ? `${minPrice.toLocaleString('ru-RU')} Br`
                    : `${minPrice.toLocaleString('ru-RU')}–${maxPrice.toLocaleString('ru-RU')} Br`;
                  const mainImage = first.images?.[0] || null;
                  return (
                    <div key={key}>
                      <div
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: isInStock
                            ? '0 4px 20px rgba(16,185,129,0.12)'
                            : '0 2px 8px rgba(0,0,0,0.06)',
                          border: isInStock
                            ? '2px solid #A7F3D0'
                            : '2px solid #F1F5F9',
                          transition: 'all 0.25s ease',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = isInStock
                            ? '0 12px 40px rgba(16,185,129,0.2)'
                            : '0 12px 32px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isInStock
                            ? '0 4px 20px rgba(16,185,129,0.12)'
                            : '0 2px 8px rgba(0,0,0,0.06)';
                        }}
                      >
                        {/* IMAGE AREA */}
                        <div style={{
                          position: 'relative',
                          height: '200px',
                          backgroundColor: isInStock ? '#F0FDF4' : '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {mainImage ? (
                            <>
                              <img
                                src={mainImage}
                                alt={first.model}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s'
                                }}
                                onMouseEnter={e => (e.target as HTMLImageElement).style.transform = 'scale(1.05)'}
                                onMouseLeave={e => (e.target as HTMLImageElement).style.transform = 'scale(1)'}
                                onClick={() => setZoomedImage(mainImage)}
                              />
                              {first.images && first.images.length > 1 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  backgroundColor: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                }}>
                                  📷 {first.images.length}
                                </div>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: '56px' }}>👟</span>
                          )}

                          {/* STOCK BADGE - top left */}
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '800',
                            backdropFilter: 'blur(8px)',
                            backgroundColor: isInStock
                              ? 'rgba(16,185,129,0.9)'
                              : 'rgba(239,68,68,0.85)',
                            color: 'white',
                            boxShadow: isInStock
                              ? '0 2px 8px rgba(16,185,129,0.4)'
                              : '0 2px 8px rgba(239,68,68,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isInStock ? '✓' : '✕'} {totalQuantity} шт.
                          </div>

                          {/* RESERVED BADGE */}
                          {first.isReserved && (
                            <div style={{
                              position:'absolute',
                              top:'10px',
                              left:'10px',
                              padding:'4px 10px',
                              backgroundColor:'#6366F1',
                              borderRadius:'20px',
                              fontSize:'11px',
                              fontWeight:'700',
                              color:'white',
                              display:'flex',
                              alignItems:'center',
                              gap:'4px',
                              boxShadow:'0 2px 8px rgba(99,102,241,0.4)',
                              zIndex:2,
                              marginTop:'32px'
                            }}>
                              🔒 Зарезервировано
                            </div>
                          )}

                          {/* PACKAGE TYPE - top right */}
                          {first.supplier && !mainImage && (
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(255,255,255,0.92)',
                              color: '#475569',
                              backdropFilter: 'blur(8px)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}>
                              📦 {first.supplier}
                            </div>
                          )}

                          {/* IN STOCK GREEN GLOW STRIP */}
                          {isInStock && (
                            <div style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '0',
                              right: '0',
                              height: '3px',
                              background: 'linear-gradient(90deg, #10B981, #34D399)'
                            }} />
                          )}
                        </div>

                        {/* CARD BODY */}
                        <div style={{ padding: '14px 16px' }}>
                          {/* Brand + Model */}
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '800',
                            color: '#0F172A',
                            marginBottom: '3px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '-0.2px'
                          }}>
                            {first.brand} {first.model}
                          </div>

                          {/* BUYER TAG */}
                          {(first.buyerTag || first.reservedFor || first.forWho) && (
                            <div style={{
                              display:'inline-flex',
                              alignItems:'center',
                              gap:'5px',
                              padding:'4px 10px',
                              backgroundColor:'#EEF2FF',
                              border:'1px solid #C7D2FE',
                              borderRadius:'20px',
                              marginBottom:'8px',
                              maxWidth:'100%'
                            }}>
                              <span style={{fontSize:'12px'}}>👤</span>
                              <span style={{
                                fontSize:'11px',
                                fontWeight:'700',
                                color:'#6366F1',
                                whiteSpace:'nowrap',
                                overflow:'hidden',
                                textOverflow:'ellipsis',
                                maxWidth:'140px'
                              }}>
                                {first.buyerTag ||
                                 first.reservedFor ||
                                 (() => {
                                   const raw = first.forWho || '';
                                   if (raw.includes('instagram.com/')) {
                                     const u = raw.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
                                     return u ? `@${u}` : raw;
                                   }
                                   return raw;
                                 })()}
                              </span>
                            </div>
                          )}

                          {/* Color */}
                          <div style={{
                            fontSize: '12px',
                            color: '#94A3B8',
                            marginBottom: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {first.color}
                          </div>

                          {/* SIZES */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '5px',
                            marginBottom: '12px',
                            minHeight: '32px'
                          }}>
                            {(first.sizes || sizes)
                              ?.sort((a: string, b: string) => Number(a) - Number(b))
                              .map((size: string) => {
                                const variant = first.variants?.find(
                                  v => String(v.size) === String(size)
                                );
                                const qty = variant?.quantity ?? (first.quantity > 0 ? 1 : 0);
                                const hasStock = qty > 0;

                                return (
                                  <div
                                    key={size}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      backgroundColor: hasStock ? '#ECFDF5' : '#FEF2F2',
                                      border: hasStock
                                        ? '1.5px solid #6EE7B7'
                                        : '1.5px solid #FCA5A5',
                                      cursor: 'default',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    <span style={{
                                      fontSize: '9px',
                                      fontWeight: '700',
                                      color: hasStock ? '#6EE7B7' : '#FCA5A5',
                                      letterSpacing: '0.5px'
                                    }}>
                                      EU
                                    </span>
                                    <span style={{
                                      fontSize: '13px',
                                      fontWeight: '800',
                                      color: hasStock ? '#065F46' : '#991B1B',
                                      letterSpacing: '0.3px'
                                    }}>
                                      {size}
                                    </span>
                                    {qty > 1 && (
                                      <span style={{
                                        fontSize: '9px',
                                        fontWeight: '800',
                                        backgroundColor: hasStock ? '#10B981' : '#EF4444',
                                        color: 'white',
                                        borderRadius: '4px',
                                        padding: '0 3px',
                                        lineHeight: '14px'
                                      }}>
                                        {qty}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            {/* Add size button */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddSizeModal(first);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                backgroundColor: '#F8FAFC',
                                border: '1.5px dashed #CBD5E1',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = '#EEF2FF';
                                e.currentTarget.style.borderColor = '#6366F1';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = '#F8FAFC';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                            >
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#94A3B8'
                              }}>
                                + EU
                              </span>
                            </div>
                          </div>

                          {/* PRICE + CATEGORY ROW */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: '20px',
                              fontWeight: '800',
                              color: '#0F172A',
                              letterSpacing: '-0.5px'
                            }}>
                              {priceRange}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#94A3B8',
                              backgroundColor: '#F8FAFC',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0'
                            }}>
                              {categoryLabels[first.category] || 'Лайфстайл'}
                            </div>
                          </div>

                          {/* IN STOCK HIGHLIGHT BAR */}
                          {isInStock && (
                            <div style={{
                              backgroundColor: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{ fontSize: '16px' }}>✅</span>
                              <div>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#065F46'
                                }}>
                                  В наличии
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  color: '#34D399'
                                }}>
                                  {totalQuantity} шт. готово к продаже
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ACTION BUTTONS */}
                          <div style={{
                            display: 'flex',
                            gap: '8px'
                          }}>
                            <button
                              onClick={() => toggleGroup(key)}
                              style={{
                                flex: 1,
                                padding: '9px',
                                border: '1.5px solid #E2E8F0',
                                borderRadius: '10px',
                                backgroundColor: 'white',
                                color: '#475569',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                            >
                              📋 Варианты
                            </button>
                            <button
                              onClick={() => setEditProduct(first)}
                              style={{
                                width: '36px',
                                height: '36px',
                                border: '1.5px solid #E2E8F0',
                                borderRadius: '10px',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(first.id)}
                              style={{
                                width: '36px',
                                height: '36px',
                                border: 'none',
                                borderRadius: '10px',
                                backgroundColor: '#FEF2F2',
                                cursor: 'pointer',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded variants */}
                      {isExpanded && (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px',
                          backgroundColor: '#F8FAFC',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                        }}>
                          {items.map(p => {
                            const isLow = p.quantity <= p.minStock;
                            return (
                              <div key={p.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 0',
                                borderBottom: '1px solid #E2E8F0',
                                fontSize: '12px',
                              }}>
                                <span>Размер: {p.size}</span>
                                <span style={{ color: isLow ? '#EF4444' : undefined }}>
                                  Кол-во: {p.quantity}{isLow ? ' ⚠' : ''}
                                </span>
                                <span>{p.retailPrice.toLocaleString('ru-RU')} Br</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => setEditProduct(p)}
                                    style={{
                                      padding: '2px 6px',
                                      backgroundColor: '#EFF6FF',
                                      border: '1px solid #BFDBFE',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p.id)}
                                    style={{
                                      padding: '2px 6px',
                                      backgroundColor: '#FEF2F2',
                                      border: '1px solid #FECACA',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()
        )
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Фото', 'Бренд / Модель', 'Цвет', 'Размеры', 'Поставщик', 'Кол-во', 'Цена', 'Категория', 'Действия'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={h === 'Фото' ? { width: '90px', minWidth: '90px' } : undefined}
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
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
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
                          <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" style={{ height: '88px', verticalAlign: 'middle' }} onClick={() => toggleGroup(key)}>
                            <td className="px-4 py-3" style={{ width: '90px', minWidth: '90px', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                              {first.images && first.images.length > 0 ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <img
                                    src={first.images[0]}
                                    alt={first.model}
                                    style={{
                                      width: '72px',
                                      height: '72px',
                                      objectFit: 'cover',
                                      borderRadius: '10px',
                                      border: '1px solid #E2E8F0',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                      display: 'block',
                                      transition: 'transform 0.2s',
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; }}
                                    onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                                    onClick={(e) => { e.stopPropagation(); setZoomedImage(first.images![0]); }}
                                  />
                                  {first.images.length > 1 && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '3px',
                                      right: '3px',
                                      backgroundColor: 'rgba(0,0,0,0.6)',
                                      color: 'white',
                                      fontSize: '9px',
                                      padding: '1px 4px',
                                      borderRadius: '4px',
                                    }}>
                                      +{first.images.length - 1}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{
                                  width: '72px',
                                  height: '72px',
                                  backgroundColor: '#F3F4F6',
                                  borderRadius: '10px',
                                  border: '2px dashed #D1D5DB',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '24px',
                                }}>
                                  <span role="img" aria-label="sneaker">👟</span>
                                  <span style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '2px' }}>нет фото</span>
                                </div>
                              )}
                            </td>
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
                                <td className="px-4 py-2"></td>
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
      )}

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

      {/* Photo Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={zoomedImage}
            alt="Zoomed product"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          />
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Size Modal */}
      {showAddSizeModal && (
        <div style={{
          position: 'fixed',
          inset: '0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h3 style={{
                margin: '0',
                fontSize: '18px',
                fontWeight: '700',
                color: '#1E293B',
              }}>
                Добавить размер
              </h3>
              <button
                onClick={() => setShowAddSizeModal(false)}
                style={{
                  border: 'none',
                  background: '#F1F5F9',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#64748B',
                }}
              >
                ×
              </button>
            </div>

            {/* Product name */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}>
              {selectedProduct?.brand}{' '}
              {selectedProduct?.model}{' '}
              {selectedProduct?.color}
            </div>

            {/* Size input */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                display: 'block',
                marginBottom: '6px',
              }}>
                Размер EUR *
              </label>
              <input
                type="number"
                placeholder="42"
                value={newSize.size}
                onChange={e => setNewSize(prev => ({ ...prev, size: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: newSize.size ? '2px solid #10B981' : '2px solid #E2E8F0',
                  borderRadius: '10px',
                  fontSize: '20px',
                  fontWeight: '700',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Quick size buttons */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '8px',
              }}>
                {[35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5,
                  41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45, 45.5, 46, 47, 48]
                  .filter(s => !selectedProduct?.sizes?.includes(String(s)))
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => setNewSize(prev => ({ ...prev, size: String(s) }))}
                      style={{
                        padding: '5px 8px',
                        backgroundColor: newSize.size === String(s) ? '#10B981' : '#F1F5F9',
                        color: newSize.size === String(s) ? 'white' : '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  ))
                }
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                display: 'block',
                marginBottom: '6px',
              }}>
                Количество
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <button
                  onClick={() => setNewSize(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '2px solid #E2E8F0',
                    backgroundColor: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  −
                </button>
                <span style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  minWidth: '40px',
                  textAlign: 'center',
                }}>
                  {newSize.quantity}
                </span>
                <button
                  onClick={() => setNewSize(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '2px solid #E2E8F0',
                    backgroundColor: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Purchase price */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                display: 'block',
                marginBottom: '6px',
              }}>
                Закупочная цена (Br)
              </label>
              <input
                type="number"
                placeholder="150"
                value={newSize.purchasePrice}
                onChange={e => setNewSize(prev => ({ ...prev, purchasePrice: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
            }}>
              <button
                onClick={() => setShowAddSizeModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleAddSize}
                disabled={!newSize.size}
                style={{
                  flex: 2,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: newSize.size ? '#10B981' : '#E2E8F0',
                  color: newSize.size ? 'white' : '#94A3B8',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: newSize.size ? 'pointer' : 'not-allowed',
                }}
              >
                Добавить размер
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
