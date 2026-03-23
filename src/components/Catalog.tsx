import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, X, SlidersHorizontal, ArrowUpDown, Image } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Supplier } from '../types';

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
  photoUrl: '',
  description: '',
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

type SortField = 'brand' | 'retailPrice' | 'quantity' | 'dateAdded' | 'margin';
type SortDir = 'asc' | 'desc';

interface ProductFormProps {
  initial: Omit<Product, 'id'>;
  suppliers: Supplier[];
  onSave: (data: Omit<Product, 'id'>) => void;
  onCancel: () => void;
  title: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, suppliers, onSave, onCancel, title }) => {
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Артикул (SKU) *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.quantity}
                onChange={(e) => set('quantity', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Закупочная цена (Br)</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.purchasePrice}
                onChange={(e) => set('purchasePrice', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Розничная цена (Br)</label>
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
              {suppliers.length > 0 ? (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.supplier}
                  onChange={(e) => set('supplier', e.target.value)}
                >
                  <option value="">— Не выбран —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.supplier}
                  onChange={(e) => set('supplier', e.target.value)}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Местоположение</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Минимальный остаток</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.minStock}
                onChange={(e) => set('minStock', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата поступления</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.dateAdded}
                onChange={(e) => set('dateAdded', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на фото</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/photo.jpg"
                value={form.photoUrl ?? ''}
                onChange={(e) => set('photoUrl', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Дополнительная информация о товаре..."
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Отмена</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Catalog: React.FC = () => {
  const { data: products, loading, add, update, remove } = useFirestore<Product>('products');
  const { data: suppliers } = useFirestore<Supplier>('suppliers');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Product['category'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Product['status'] | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('brand');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.color && p.color.toLowerCase().includes(q));
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'brand': cmp = `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`); break;
        case 'retailPrice': cmp = a.retailPrice - b.retailPrice; break;
        case 'quantity': cmp = a.quantity - b.quantity; break;
        case 'dateAdded': cmp = a.dateAdded.localeCompare(b.dateAdded); break;
        case 'margin': cmp = (a.retailPrice - a.purchasePrice) - (b.retailPrice - b.purchasePrice); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [products, search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalItems = filtered.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = filtered.reduce((sum, p) => sum + p.retailPrice * p.quantity, 0);
  const totalCost = filtered.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleAdd = async (data: Omit<Product, 'id'>) => { await add(data); setShowForm(false); };
  const handleEdit = async (data: Omit<Product, 'id'>) => { if (!editProduct?.id) return; await update(editProduct.id, data); setEditProduct(null); };
  const handleDelete = async (id: string) => { if (window.confirm('Удалить этот товар?')) await remove(id); };

  if (loading) return <div className="flex items-center justify-center p-8"><div className="text-gray-500">Загрузка данных...</div></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Каталог товаров</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />Добавить товар
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow px-4 py-3"><p className="text-xs text-gray-500">Позиций</p><p className="text-lg font-bold text-gray-900">{filtered.length}</p></div>
        <div className="bg-white rounded-lg shadow px-4 py-3"><p className="text-xs text-gray-500">Всего единиц</p><p className="text-lg font-bold text-gray-900">{totalItems}</p></div>
        <div className="bg-white rounded-lg shadow px-4 py-3"><p className="text-xs text-gray-500">Стоимость (розн.)</p><p className="text-lg font-bold text-blue-600">{totalValue.toLocaleString('ru-RU')} Br</p></div>
        <div className="bg-white rounded-lg shadow px-4 py-3"><p className="text-xs text-gray-500">Стоимость (закуп.)</p><p className="text-lg font-bold text-gray-600">{totalCost.toLocaleString('ru-RU')} Br</p></div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Поиск по бренду, модели, артикулу, цвету..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as Product['category'] | 'all')}>
            <option value="all">Все категории</option><option value="sport">Спорт</option><option value="lifestyle">Лайфстайл</option><option value="limited">Лимитед</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Product['status'] | 'all')}>
            <option value="all">Все статусы</option><option value="available">В наличии</option><option value="preorder">Предзаказ</option><option value="sold_out">Нет в наличии</option>
          </select>
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <SlidersHorizontal className="w-3.5 h-3.5" /><span>Сортировка:</span>
        {([['brand','Название'],['retailPrice','Цена'],['quantity','Кол-во'],['margin','Маржа'],['dateAdded','Дата']] as [SortField,string][]).map(([field,label]) => (
          <button key={field} onClick={() => handleSort(field)} className={`px-2 py-1 rounded text-xs transition-colors ${sortField === field ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}{sortField === field && <ArrowUpDown className="w-3 h-3 inline ml-1" />}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['','Артикул','Бренд / Модель','Размер','Цвет','Кол-во','Закуп.','Розн.','Маржа','Маржа %','Категория','Статус','Действия'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">{products.length === 0 ? 'Товаров нет. Добавьте первый!' : 'Ничего не найдено'}</td></tr>
              ) : filtered.map((p, idx) => {
                const isLow = p.quantity <= p.minStock;
                const margin = p.retailPrice - p.purchasePrice;
                const marginPct = p.purchasePrice > 0 ? (margin / p.purchasePrice * 100) : 0;
                return (
                  <tr key={p.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isLow ? 'bg-red-50' : ''} cursor-pointer hover:bg-blue-50 transition-colors`} onClick={() => setViewProduct(p)}>
                    <td className="px-3 py-3">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={`${p.brand} ${p.model}`} className="w-10 h-10 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><Image className="w-4 h-4 text-gray-300" /></div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm font-mono text-gray-700">{p.sku}</td>
                    <td className="px-3 py-3 text-sm text-gray-900"><div className="font-medium">{p.brand}</div><div className="text-gray-500">{p.model}</div></td>
                    <td className="px-3 py-3 text-sm text-gray-700">{p.size}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{p.color}</td>
                    <td className={`px-3 py-3 text-sm font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                      {p.quantity}{isLow && <span className="ml-1 text-xs font-normal text-red-500">⚠</span>}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">{p.purchasePrice.toLocaleString('ru-RU')} Br</td>
                    <td className="px-3 py-3 text-sm text-gray-700 font-medium">{p.retailPrice.toLocaleString('ru-RU')} Br</td>
                    <td className="px-3 py-3 text-sm font-medium text-blue-600">{margin.toLocaleString('ru-RU')} Br</td>
                    <td className="px-3 py-3 text-sm font-medium text-blue-600">{p.purchasePrice > 0 ? marginPct.toFixed(1) + '%' : '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{categoryLabels[p.category]}</td>
                    <td className="px-3 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}>{statusLabels[p.status]}</span></td>
                    <td className="px-3 py-3 text-sm">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setEditProduct(p)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Редактировать"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Удалить"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setViewProduct(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Карточка товара</h2>
              <button onClick={() => setViewProduct(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {viewProduct.photoUrl && <img src={viewProduct.photoUrl} alt={`${viewProduct.brand} ${viewProduct.model}`} className="w-full h-48 object-contain rounded-lg bg-gray-50" />}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewProduct.brand} {viewProduct.model}</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">SKU: {viewProduct.sku}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">Размер</span><p className="font-medium text-gray-900">{viewProduct.size}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">Цвет</span><p className="font-medium text-gray-900">{viewProduct.color || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">Количество</span><p className={`font-medium ${viewProduct.quantity <= viewProduct.minStock ? 'text-red-600' : 'text-gray-900'}`}>{viewProduct.quantity} шт.</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">Категория</span><p className="font-medium text-gray-900">{categoryLabels[viewProduct.category]}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">Закупочная</span><p className="font-medium text-gray-900">{viewProduct.purchasePrice.toLocaleString('ru-RU')} Br</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">Розничная</span><p className="font-medium text-gray-900">{viewProduct.retailPrice.toLocaleString('ru-RU')} Br</p></div>
                <div className="bg-blue-50 rounded-lg p-3"><span className="text-blue-600">Маржа</span><p className="font-bold text-blue-700">{(viewProduct.retailPrice - viewProduct.purchasePrice).toLocaleString('ru-RU')} Br{viewProduct.purchasePrice > 0 && <span className="text-sm font-normal ml-1">({((viewProduct.retailPrice - viewProduct.purchasePrice) / viewProduct.purchasePrice * 100).toFixed(1)}%)</span>}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">Статус</span><p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[viewProduct.status]}`}>{statusLabels[viewProduct.status]}</span></p></div>
              </div>
              {viewProduct.supplier && <div className="text-sm"><span className="text-gray-500">Поставщик:</span> <span className="font-medium">{viewProduct.supplier}</span></div>}
              {viewProduct.location && <div className="text-sm"><span className="text-gray-500">Местоположение:</span> <span className="font-medium">{viewProduct.location}</span></div>}
              {viewProduct.description && <div className="text-sm"><span className="text-gray-500">Описание:</span><p className="mt-1 text-gray-700">{viewProduct.description}</p></div>}
              <div className="text-sm text-gray-400">Добавлено: {new Date(viewProduct.dateAdded).toLocaleDateString('ru-RU')}</div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setViewProduct(null); setEditProduct(viewProduct); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">Редактировать</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && <ProductForm title="Добавить товар" initial={emptyProduct} suppliers={suppliers} onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editProduct && <ProductForm title="Редактировать товар" initial={editProduct} suppliers={suppliers} onSave={handleEdit} onCancel={() => setEditProduct(null)} />}
    </div>
  );
};

export default Catalog;
