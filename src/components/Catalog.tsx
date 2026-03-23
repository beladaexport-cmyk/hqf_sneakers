import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Grid, Layers } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product } from '../types';

const EUR_CM_MAP: Record<string, string> = {
  '35': '22.5', '35.5': '22.5', '36': '23', '36.5': '23.5',
  '37': '23.5', '37.5': '24', '38': '24', '38.5': '24.5',
  '39': '25', '39.5': '25.5', '40': '25.5', '40.5': '26',
  '41': '26', '41.5': '26.5', '42': '27', '42.5': '27',
  '43': '27.5', '43.5': '28', '44': '28.5', '44.5': '29',
  '45': '29', '45.5': '29.5', '46': '30', '46.5': '30.5',
  '47': '31', '47.5': '31.5', '48': '32',
};

const emptyProduct: Omit<Product, 'id'> = {
  sku: '',
  brand: '',
  model: '',
  size: '',
  sizeCM: '',
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
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  preorder: 'bg-amber-50 text-amber-700 border border-amber-200',
  sold_out: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white placeholder-gray-400';
const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

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

  const handleSizeEurChange = (val: string) => {
    set('size', val);
    const cm = EUR_CM_MAP[val];
    if (cm) set('sizeCM', cm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.brand || !form.model || !form.size) {
      alert('Заполните обязательные поля: Артикул, Бренд, Модель, Размер EUR');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Артикул (SKU) *</label>
              <input className={inputClass} value={form.sku} onChange={(e) => set('sku', e.target.value)} required placeholder="ABC-123" />
            </div>
            <div>
              <label className={labelClass}>Бренд *</label>
              <input className={inputClass} value={form.brand} onChange={(e) => set('brand', e.target.value)} required placeholder="Nike" />
            </div>
            <div>
              <label className={labelClass}>Модель *</label>
              <input className={inputClass} value={form.model} onChange={(e) => set('model', e.target.value)} required placeholder="Air Max 90" />
            </div>
            <div>
              <label className={labelClass}>Цвет</label>
              <input className={inputClass} value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="Black/White" />
            </div>
          </div>

          {/* Size Grid Section */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Grid className="w-3.5 h-3.5" />
              Размер
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>EUR *</label>
                <input
                  className={inputClass}
                  value={form.size}
                  onChange={(e) => handleSizeEurChange(e.target.value)}
                  required
                  placeholder="42"
                />
              </div>
              <div>
                <label className={labelClass}>СМ</label>
                <input
                  className={inputClass}
                  value={form.sizeCM || ''}
                  onChange={(e) => set('sizeCM', e.target.value)}
                  placeholder="27"
                />
                {form.size && EUR_CM_MAP[form.size] && (
                  <p className="text-xs text-indigo-500 mt-1">Авто: {EUR_CM_MAP[form.size]} см</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Количество</label>
              <input type="number" min="0" className={inputClass} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Закупочная цена (Br)</label>
              <input type="number" min="0" className={inputClass} value={form.purchasePrice} onChange={(e) => set('purchasePrice', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Розничная цена (Br)</label>
              <input type="number" min="0" className={inputClass} value={form.retailPrice} onChange={(e) => set('retailPrice', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Поставщик</label>
              <input className={inputClass} value={form.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="Поставщик" />
            </div>
            <div>
              <label className={labelClass}>Местоположение</label>
              <input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Склад А" />
            </div>
            <div>
              <label className={labelClass}>Категория</label>
              <select className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="sport">Спорт</option>
                <option value="lifestyle">Лайфстайл</option>
                <option value="limited">Лимитед</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Статус</label>
              <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="available">В наличии</option>
                <option value="preorder">Предзаказ</option>
                <option value="sold_out">Нет в наличии</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Мин. остаток</label>
              <input type="number" min="0" className={inputClass} value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Дата поступления</label>
              <input type="date" className={inputClass} value={form.dateAdded} onChange={(e) => set('dateAdded', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
              Отмена
            </button>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Size Grid Batch Form ---------- */
interface SizeRow {
  eur: string;
  cm: string;
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
  const [rows, setRows] = useState<SizeRow[]>([{ eur: '', cm: '', quantity: 1 }]);

  const addRow = () => setRows([...rows, { eur: '', cm: '', quantity: 1 }]);

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: keyof SizeRow, value: string | number) => {
    const updated = [...rows];
    if (field === 'eur') {
      updated[idx].eur = value as string;
      const cm = EUR_CM_MAP[value as string];
      if (cm) updated[idx].cm = cm;
    } else if (field === 'cm') {
      updated[idx].cm = value as string;
    } else {
      updated[idx].quantity = value as number;
    }
    setRows(updated);
  };

  const fillAllSizes = () => {
    const commonSizes = ['38', '38.5', '39', '40', '40.5', '41', '42', '42.5', '43', '44', '44.5', '45'];
    setRows(commonSizes.map((eur) => ({ eur, cm: EUR_CM_MAP[eur] || '', quantity: 1 })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !brand || !model) {
      alert('Заполните: Артикул, Бренд, Модель');
      return;
    }
    const validRows = rows.filter((r) => r.eur.trim());
    if (validRows.length === 0) {
      alert('Добавьте хотя бы один размер');
      return;
    }
    const products: Omit<Product, 'id'>[] = validRows.map((r) => ({
      sku: `${sku}-${r.eur}`,
      brand,
      model,
      size: r.eur,
      sizeCM: r.cm,
      color,
      quantity: r.quantity,
      purchasePrice,
      retailPrice,
      dateAdded: new Date().toISOString().split('T')[0],
      supplier,
      category,
      status,
      location,
      minStock: 2,
    }));
    onSave(products);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Размерная сетка
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Артикул (базовый) *</label>
              <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="ABC-123" />
              <p className="text-xs text-gray-400 mt-1">К каждому размеру добавится -EUR</p>
            </div>
            <div>
              <label className={labelClass}>Бренд *</label>
              <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} required placeholder="Nike" />
            </div>
            <div>
              <label className={labelClass}>Модель *</label>
              <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} required placeholder="Air Max 90" />
            </div>
            <div>
              <label className={labelClass}>Цвет</label>
              <input className={inputClass} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black/White" />
            </div>
            <div>
              <label className={labelClass}>Закупочная (Br)</label>
              <input type="number" min="0" className={inputClass} value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Розничная (Br)</label>
              <input type="number" min="0" className={inputClass} value={retailPrice} onChange={(e) => setRetailPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Поставщик</label>
              <input className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Местоположение</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Склад А" />
            </div>
            <div>
              <label className={labelClass}>Категория</label>
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as Product['category'])}>
                <option value="sport">Спорт</option>
                <option value="lifestyle">Лайфстайл</option>
                <option value="limited">Лимитед</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Статус</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as Product['status'])}>
                <option value="available">В наличии</option>
                <option value="preorder">Предзаказ</option>
                <option value="sold_out">Нет в наличии</option>
              </select>
            </div>
          </div>

          {/* Size Rows */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-2">
                <Grid className="w-3.5 h-3.5" />
                Размеры ({rows.filter((r) => r.eur.trim()).length} шт.)
              </h3>
              <button type="button" onClick={fillAllSizes} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                Заполнить 38-45
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_80px_40px] gap-2 text-xs font-semibold text-gray-400 uppercase px-1">
                <span>EUR</span>
                <span>СМ</span>
                <span>Кол-во</span>
                <span></span>
              </div>
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_80px_40px] gap-2 items-center">
                  <input
                    className={inputClass}
                    placeholder="42"
                    value={row.eur}
                    onChange={(e) => updateRow(idx, 'eur', e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="27"
                    value={row.cm}
                    onChange={(e) => updateRow(idx, 'cm', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, 'quantity', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                    disabled={rows.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              Добавить размер
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
              Отмена
            </button>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
              Создать {rows.filter((r) => r.eur.trim()).length} товар(ов)
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
  const [showGridForm, setShowGridForm] = useState(false);
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

  const handleGridAdd = async (items: Omit<Product, 'id'>[]) => {
    for (const item of items) {
      await add(item);
    }
    setShowGridForm(false);
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
        <div className="text-gray-400 font-medium">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Каталог товаров</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGridForm(true)}
            className="flex items-center px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium border border-indigo-200"
          >
            <Layers className="w-4 h-4 mr-2" />
            Размерная сетка
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить товар
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all bg-white"
          placeholder="Поиск по бренду, модели, артикулу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                {['Артикул', 'Бренд / Модель', 'EUR', 'СМ', 'Цвет', 'Кол-во', 'Цена', 'Маржа', '%', 'Категория', 'Статус', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider"
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
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {products.length === 0 ? 'Товаров нет. Добавьте первый!' : 'Ничего не найдено'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.quantity <= p.minStock;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{p.brand}</div>
                        <div className="text-xs text-gray-500">{p.model}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.size}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.sizeCM || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.color || '—'}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.quantity}
                        {isLow && <span className="ml-1 text-[10px] font-medium text-red-400">!</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.retailPrice.toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-indigo-600">
                        {(p.retailPrice - p.purchasePrice).toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-indigo-600">
                        {p.purchasePrice > 0
                          ? ((p.retailPrice - p.purchasePrice) / p.purchasePrice * 100).toFixed(0) + '%'
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{categoryLabels[p.category]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${statusColors[p.status]}`}>
                          {statusLabels[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {showForm && (
        <ProductForm title="Добавить товар" initial={emptyProduct} onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}
      {showGridForm && (
        <SizeGridForm onSave={handleGridAdd} onCancel={() => setShowGridForm(false)} />
      )}
      {editProduct && (
        <ProductForm title="Редактировать товар" initial={editProduct} onSave={handleEdit} onCancel={() => setEditProduct(null)} />
      )}
    </div>
  );
};

export default Catalog;
