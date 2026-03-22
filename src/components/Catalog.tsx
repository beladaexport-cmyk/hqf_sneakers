import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirestore } from '../hooks/useFirestore';
import { ShoeModel, ModelSize } from '../types';
import { SIZE_CHART, SIZE_CHART_MAP } from '../constants/sizeChart';
import { storage } from '../config/firebase';

interface SizeSelection {
  checked: boolean;
  quantity: number;
}

const categoryLabels: Record<ShoeModel['category'], string> = {
  sport: 'Спорт',
  lifestyle: 'Лайфстайл',
  limited: 'Лимитед',
};

// ── Model Form ──────────────────────────────────────────────────────────────

interface ModelFormProps {
  title: string;
  initial?: ShoeModel;
  initialSizes?: ModelSize[];
  onSave: (
    data: Omit<ShoeModel, 'id' | 'images'>,
    sizes: { eu: string; cm: number; quantity: number }[],
    imageFiles: File[],
    existingImages: string[]
  ) => void;
  onCancel: () => void;
}

const ModelForm: React.FC<ModelFormProps> = ({ title, initial, initialSizes, onSave, onCancel }) => {
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [colorway, setColorway] = useState(initial?.colorway ?? '');
  const [purchasePrice, setPurchasePrice] = useState(initial?.purchasePrice ?? 0);
  const [retailPrice, setRetailPrice] = useState(initial?.retailPrice ?? 0);
  const [supplier, setSupplier] = useState(initial?.supplier ?? '');
  const [category, setCategory] = useState<ShoeModel['category']>(initial?.category ?? 'sport');
  const [dateAdded, setDateAdded] = useState(initial?.dateAdded ?? new Date().toISOString().split('T')[0]);
  const [minStock, setMinStock] = useState(initial?.minStock ?? 2);

  // Images
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images ?? []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Sizes
  const [sizeSelections, setSizeSelections] = useState<Record<string, SizeSelection>>(() => {
    const selections: Record<string, SizeSelection> = {};
    if (initialSizes) {
      initialSizes.forEach((s) => {
        selections[s.sizeEU] = { checked: true, quantity: s.quantity };
      });
    }
    return selections;
  });

  const totalImages = existingImages.length + imageFiles.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const canAdd = 5 - totalImages;
    if (canAdd <= 0) {
      alert('Максимум 5 фотографий');
      return;
    }
    const toAdd = files.slice(0, canAdd);
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const toggleSize = (eu: string) => {
    setSizeSelections((prev) => ({
      ...prev,
      [eu]: { checked: !prev[eu]?.checked, quantity: prev[eu]?.quantity || 1 },
    }));
  };

  const updateSizeQty = (eu: string, qty: number) => {
    setSizeSelections((prev) => ({
      ...prev,
      [eu]: { ...prev[eu], checked: true, quantity: Math.max(0, qty) },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !brand.trim() || !model.trim()) {
      alert('Заполните обязательные поля: Артикул, Бренд, Модель');
      return;
    }

    const checkedSizes = Object.entries(sizeSelections)
      .filter(([, sel]) => sel.checked)
      .map(([eu, sel]) => ({ eu, cm: SIZE_CHART_MAP[eu] ?? 0, quantity: sel.quantity }));

    if (checkedSizes.length === 0) {
      alert('Выберите хотя бы один размер');
      return;
    }

    const modelData: Omit<ShoeModel, 'id' | 'images'> = {
      sku: sku.trim(),
      brand: brand.trim(),
      model: model.trim(),
      colorway: colorway.trim(),
      purchasePrice,
      retailPrice,
      supplier: supplier.trim(),
      category,
      dateAdded,
      minStock,
    };

    onSave(modelData, checkedSizes, imageFiles, existingImages);
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Цвет / Расцветка</label>
              <input className={inputClass} value={colorway} onChange={(e) => setColorway(e.target.value)} placeholder="Shadow Brown" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ShoeModel['category'])}>
                <option value="sport">Спорт</option>
                <option value="lifestyle">Лайфстайл</option>
                <option value="limited">Лимитед</option>
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

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фотографии ({totalImages}/5)
            </label>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((url) => (
                <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imagePreviews.map((preview, i) => (
                <div key={preview} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalImages < 5 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Фото</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                </label>
              )}
            </div>
          </div>

          {/* Size Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Размерная сетка *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SIZE_CHART.map(({ eu, cm }) => {
                const sel = sizeSelections[eu];
                const isChecked = sel?.checked || false;
                return (
                  <div
                    key={eu}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSize(eu)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSize(eu)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm font-medium">EU {eu}</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">{cm} см</div>
                    {isChecked && (
                      <div
                        className="mt-2 flex items-center gap-2 ml-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="text-xs text-gray-500">Кол:</label>
                        <input
                          type="number"
                          min="0"
                          value={sel?.quantity ?? 1}
                          onChange={(e) => updateSizeQty(eu, Number(e.target.value))}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
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

// ── Model Detail Modal ──────────────────────────────────────────────────────

interface ModelDetailProps {
  model: ShoeModel;
  sizes: ModelSize[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ModelDetailModal: React.FC<ModelDetailProps> = ({ model, sizes, onEdit, onDelete, onClose }) => {
  const margin = model.retailPrice - model.purchasePrice;
  const marginPct = model.purchasePrice > 0 ? ((margin / model.purchasePrice) * 100).toFixed(1) : '—';
  const totalQty = sizes.reduce((sum, s) => sum + s.quantity, 0);
  const sortedSizes = [...sizes].sort((a, b) => parseFloat(a.sizeEU) - parseFloat(b.sizeEU));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {model.brand} {model.model}
            </h2>
            {model.colorway && <p className="text-sm text-gray-500">{model.colorway}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Images */}
          {model.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {model.images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${model.brand} ${model.model} ${i + 1}`}
                  className="w-28 h-28 rounded-lg object-cover flex-shrink-0 border"
                />
              ))}
            </div>
          )}

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Артикул:</span>
              <span className="font-mono">{model.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Закупка:</span>
              <span>{model.purchasePrice.toLocaleString('ru-RU')} Br</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Продажа:</span>
              <span>{model.retailPrice.toLocaleString('ru-RU')} Br</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Маржа:</span>
              <span className="text-blue-600 font-medium">
                {margin.toLocaleString('ru-RU')} Br ({marginPct}%)
              </span>
            </div>
            {model.supplier && (
              <div className="flex justify-between">
                <span className="text-gray-500">Поставщик:</span>
                <span>{model.supplier}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Категория:</span>
              <span>{categoryLabels[model.category]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Всего пар:</span>
              <span className="font-semibold">{totalQty}</span>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Размеры</h3>
            {sortedSizes.length === 0 ? (
              <p className="text-sm text-gray-400">Нет размеров</p>
            ) : (
              <div className="space-y-1">
                {sortedSizes.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                      s.quantity <= 0 ? 'bg-gray-50 text-gray-400' : s.quantity <= model.minStock ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    <span>
                      EU {s.sizeEU} / {s.sizeCM} см
                    </span>
                    <span className={`font-medium ${s.quantity <= 0 ? 'text-gray-400' : s.quantity <= model.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {s.quantity} шт.
                      {s.quantity > 0 && s.quantity <= model.minStock && <span className="ml-1 text-xs text-red-500">мало</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Удалить
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Upload helper ───────────────────────────────────────────────────────────

async function uploadImages(modelId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    try {
      const storageRef = ref(storage, `models/${modelId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    } catch (err) {
      console.error('Image upload error:', err);
    }
  }
  return urls;
}

// ── Main Catalog ────────────────────────────────────────────────────────────

const Catalog: React.FC = () => {
  const { data: models, loading: loadingModels, add: addModel, update: updateModel, remove: removeModel } = useFirestore<ShoeModel>('models');
  const { data: allSizes, loading: loadingSizes, add: addSize, update: updateSize, remove: removeSize } = useFirestore<ModelSize>('modelSizes');

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editModel, setEditModel] = useState<ShoeModel | null>(null);
  const [viewModel, setViewModel] = useState<ShoeModel | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = models.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.brand.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      (m.colorway && m.colorway.toLowerCase().includes(q))
    );
  });

  const getModelSizes = (modelId: string) => allSizes.filter((s) => s.modelId === modelId);
  const getModelQty = (modelId: string) => getModelSizes(modelId).reduce((sum, s) => sum + s.quantity, 0);

  const handleSave = async (
    data: Omit<ShoeModel, 'id' | 'images'>,
    sizes: { eu: string; cm: number; quantity: number }[],
    imageFiles: File[],
    existingImages: string[],
    editId?: string
  ) => {
    setSaving(true);
    try {
      let modelId: string;
      if (editId) {
        await updateModel(editId, { ...data, images: existingImages });
        modelId = editId;
      } else {
        modelId = await addModel({ ...data, images: [] });
      }

      // Upload new images
      if (imageFiles.length > 0) {
        const newUrls = await uploadImages(modelId, imageFiles);
        const allImages = [...existingImages, ...newUrls];
        await updateModel(modelId, { images: allImages });
      }

      // Handle sizes
      const existingSizes = allSizes.filter((s) => s.modelId === modelId);

      for (const size of sizes) {
        const existing = existingSizes.find((s) => s.sizeEU === size.eu);
        if (existing) {
          await updateSize(existing.id, {
            quantity: size.quantity,
            status: size.quantity > 0 ? 'available' : 'sold_out',
          });
        } else {
          await addSize({
            modelId,
            sizeEU: size.eu,
            sizeCM: size.cm,
            quantity: size.quantity,
            status: size.quantity > 0 ? 'available' : 'sold_out',
          });
        }
      }

      // Set unchecked existing sizes to 0
      for (const existing of existingSizes) {
        if (!sizes.find((s) => s.eu === existing.sizeEU)) {
          await updateSize(existing.id, { quantity: 0, status: 'sold_out' });
        }
      }

      setShowForm(false);
      setEditModel(null);
    } catch (err) {
      console.error('Save error:', err);
      alert('Ошибка при сохранении модели');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить эту модель и все её размеры?')) return;
    const modelSizes = getModelSizes(id);
    for (const s of modelSizes) {
      await removeSize(s.id);
    }
    await removeModel(id);
    setViewModel(null);
  };

  if (loadingModels || loadingSizes) {
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
        <h2 className="text-xl font-semibold text-gray-900">Каталог моделей</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить модель
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Поиск по бренду, модели, артикулу, цвету..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Model Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          {models.length === 0 ? 'Моделей нет. Добавьте первую!' : 'Ничего не найдено'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const qty = getModelQty(m.id);
            const sizesCount = getModelSizes(m.id).filter((s) => s.quantity > 0).length;
            const hasLowStock = getModelSizes(m.id).some((s) => s.quantity > 0 && s.quantity <= m.minStock);
            return (
              <div
                key={m.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => setViewModel(m)}
              >
                {/* Image */}
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {m.images && m.images.length > 0 ? (
                    <img
                      src={m.images[0]}
                      alt={`${m.brand} ${m.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="text-xs text-gray-400 font-mono mb-1">{m.sku}</div>
                  <div className="font-semibold text-gray-900">{m.brand}</div>
                  <div className="text-sm text-gray-700">{m.model}</div>
                  {m.colorway && <div className="text-sm text-gray-500">{m.colorway}</div>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {m.retailPrice.toLocaleString('ru-RU')} Br
                    </span>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${hasLowStock ? 'text-red-600' : 'text-gray-600'}`}>
                        {qty} пар
                      </div>
                      <div className="text-xs text-gray-400">{sizesCount} размеров</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      qty <= 0
                        ? 'bg-gray-100 text-gray-600'
                        : hasLowStock
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {qty <= 0 ? 'Нет в наличии' : hasLowStock ? 'Мало на складе' : 'В наличии'}
                    </span>
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditModel(m)}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {viewModel && (
        <ModelDetailModal
          model={viewModel}
          sizes={getModelSizes(viewModel.id)}
          onEdit={() => {
            setEditModel(viewModel);
            setViewModel(null);
          }}
          onDelete={() => handleDelete(viewModel.id)}
          onClose={() => setViewModel(null)}
        />
      )}

      {/* Add Form */}
      {showForm && (
        <ModelForm
          title="Добавить модель"
          onSave={(data, sizes, files, imgs) => handleSave(data, sizes, files, imgs)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form */}
      {editModel && (
        <ModelForm
          title="Редактировать модель"
          initial={editModel}
          initialSizes={getModelSizes(editModel.id)}
          onSave={(data, sizes, files, imgs) => handleSave(data, sizes, files, imgs, editModel.id)}
          onCancel={() => setEditModel(null)}
        />
      )}

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg px-6 py-4 shadow-xl">
            <p className="text-gray-700">Сохранение...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
