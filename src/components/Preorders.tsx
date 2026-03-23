import React, { useState, useRef } from 'react';
import { Plus, X, Clock, Package, DollarSign } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFirestore } from '../hooks/useFirestore';
import { Preorder, PreorderStatus } from '../types';
import { SIZE_OPTIONS } from '../utils/sizeChart';

const statusConfig: Record<PreorderStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Ожидается', badgeClass: 'bg-yellow-100 text-yellow-800' },
  arrived: { label: 'Пришло', badgeClass: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Отменён', badgeClass: 'bg-red-100 text-red-800' },
};

const emptyPreorder: Omit<Preorder, 'id' | 'createdAt'> = {
  modelId: '',
  modelName: '',
  sizeId: '',
  sizeEU: '',
  quantity: 1,
  purchasePrice: 0,
  retailPrice: 0,
  supplier: '',
  expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'pending',
  notes: '',
};

interface PreorderFormProps {
  initial: Omit<Preorder, 'id' | 'createdAt'>;
  onSave: (data: Omit<Preorder, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  title: string;
}

const PreorderForm: React.FC<PreorderFormProps> = ({ initial, onSave, onCancel, title }) => {
  const [form, setForm] = useState(initial);

  const set = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modelName || !form.sizeEU || !form.supplier) {
      alert('Заполните обязательные поля: Название модели, Размер, Поставщик');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              display: 'block',
              marginBottom: '8px'
            }}>
              Фото пары
            </label>
            <div
              onClick={() => document.getElementById('newPreorderPhoto')?.click()}
              style={{
                border: '2px dashed #E2E8F0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#F8FAFC',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6366F1';
                e.currentTarget.style.backgroundColor = '#EEF2FF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              {form.image ? (
                <img
                  src={form.image}
                  alt="preview"
                  style={{
                    width: '100%',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>
                    Нажми чтобы добавить фото
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              id="newPreorderPhoto"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  setForm(prev => ({
                    ...prev,
                    image: event.target?.result as string
                  }));
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название модели *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.modelName}
                onChange={(e) => set('modelName', e.target.value)}
                placeholder="Nike Air Jordan 1 Low Shadow"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Размер EU *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.sizeEU}
                  onChange={(e) => set('sizeEU', e.target.value)}
                  required
                >
                  <option value="">Выберите размер</option>
                  {SIZE_OPTIONS.map((eu) => (
                    <option key={eu} value={eu}>
                      EU {eu}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кол-во</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.quantity}
                  onChange={(e) => set('quantity', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.supplier}
                onChange={(e) => set('supplier', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ожидаемая дата</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.expectedDate}
                onChange={(e) => set('expectedDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
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

const Preorders: React.FC = () => {
  const { data: preorders, loading, add, update, remove } = useFirestore<Preorder>('preorders');
  const [showForm, setShowForm] = useState(false);
  const [editPreorder, setEditPreorder] = useState<Preorder | null>(null);
  const [statusFilter, setStatusFilter] = useState<PreorderStatus | 'all'>('all');
  const [photoTargetPreorder, setPhotoTargetPreorder] = useState<Preorder | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const filtered = statusFilter === 'all'
    ? preorders
    : preorders.filter((p) => p.status === statusFilter);

  const pending = preorders.filter((p) => p.status === 'pending');
  const totalPairs = pending.reduce((sum, p) => sum + p.quantity, 0);
  const totalExpectedRevenue = pending.reduce((sum, p) => sum + p.retailPrice * p.quantity, 0);

  const handleAdd = async (data: Omit<Preorder, 'id' | 'createdAt'>) => {
    await add({ ...data, image: data.image || undefined, createdAt: new Date().toISOString() });
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Preorder, 'id' | 'createdAt'>) => {
    if (!editPreorder?.id) return;
    await update(editPreorder.id, data);
    setEditPreorder(null);
  };

  const handleMarkArrived = async (preorderId: string) => {
    await updateDoc(doc(db, 'preorders', preorderId), {
      status: 'arrived',
      arrivedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить предзаказ?')) {
      await remove(id);
    }
  };

  const handlePhotoClick = (preorder: Preorder) => {
    setPhotoTargetPreorder(preorder);
    photoInputRef.current?.click();
  };

  const handlePreorderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetPreorder) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        const preorderRef = doc(db, 'preorders', photoTargetPreorder.id);
        await updateDoc(preorderRef, {
          image: base64Image,
          updatedAt: new Date().toISOString(),
        });
        setPhotoTargetPreorder(null);
      };
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Ошибка загрузки: ${msg}`);
    }

    // Reset file input so the same file can be re-selected
    e.target.value = '';
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
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePreorderPhotoUpload}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">🛒 Предзаказы</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить предзаказ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Моделей в ожидании</p>
            <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Всего пар ожидается</p>
            <p className="text-2xl font-bold text-gray-900">{totalPairs}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ожидаемая выручка</p>
            <p className="text-2xl font-bold text-gray-900">{totalExpectedRevenue.toLocaleString('ru-RU')} Br</p>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'arrived', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            {s === 'all' ? 'Все' : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* Grid Cards */}
      {filtered.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          color: '#94A3B8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {preorders.length === 0 ? 'Предзаказов нет. Добавьте первый!' : 'Нет предзаказов с выбранным статусом'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '16px'
        }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #F1F5F9',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              {/* TOP — Photo area */}
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#F8FAFC',
                  height: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => handlePhotoClick(p)}
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.modelName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#CBD5E1'
                  }}>
                    <span style={{ fontSize: '48px' }}>👟</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#94A3B8'
                    }}>
                      + Добавить фото
                    </span>
                  </div>
                )}

                {/* Status badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor:
                    p.status === 'arrived' ? '#D1FAE5'
                    : p.status === 'cancelled' ? '#FEE2E2'
                    : '#FEF3C7',
                  color:
                    p.status === 'arrived' ? '#065F46'
                    : p.status === 'cancelled' ? '#991B1B'
                    : '#92400E'
                }}>
                  {p.status === 'arrived'
                    ? '✅ Пришло'
                    : p.status === 'cancelled'
                    ? '❌ Отменён'
                    : '🕐 Ожидается'}
                </div>

                {/* Expected date top left */}
                {p.expectedDate && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748B'
                  }}>
                    📅 {new Date(p.expectedDate).toLocaleDateString('ru-RU')}
                  </div>
                )}

                {/* Camera icon if has photo */}
                {p.image && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    📷 Изменить
                  </div>
                )}
              </div>

              {/* BOTTOM — Info */}
              <div style={{ padding: '14px' }}>
                {/* Model name + size */}
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#1E293B',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {p.modelName}
                  {p.sizeEU && (
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6366F1',
                      backgroundColor: '#EEF2FF',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      EU {p.sizeEU}
                    </span>
                  )}
                </div>

                {/* Supplier */}
                {p.supplier && (
                  <div style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🏪 {p.supplier}
                    {p.quantity > 1 && (
                      <span style={{
                        marginLeft: '6px',
                        backgroundColor: '#F1F5F9',
                        padding: '1px 7px',
                        borderRadius: '6px',
                        color: '#64748B',
                        fontWeight: '600'
                      }}>
                        {p.quantity} шт
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {p.notes && (
                  <div style={{
                    fontSize: '12px',
                    color: '#6366F1',
                    marginBottom: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    📝 {p.notes}
                  </div>
                )}

                {/* Divider */}
                <div style={{
                  height: '1px',
                  backgroundColor: '#F1F5F9',
                  marginBottom: '10px'
                }} />

                {/* Price stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#1E293B'
                    }}>
                      {p.purchasePrice ? p.purchasePrice.toLocaleString('ru-RU') : '—'} Br
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#94A3B8',
                      fontWeight: '600',
                      marginTop: '2px'
                    }}>
                      ЗАКУПКА
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#F0FDF4',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#10B981'
                    }}>
                      {p.retailPrice ? p.retailPrice.toLocaleString('ru-RU') : '—'} Br
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#94A3B8',
                      fontWeight: '600',
                      marginTop: '2px'
                    }}>
                      ПРОДАЖА
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {p.status === 'pending' && (
                    <button
                      onClick={() => handleMarkArrived(p.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Пришло
                    </button>
                  )}
                  <button
                    onClick={() => setEditPreorder(p)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#64748B',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#FEE2E2',
                      color: '#EF4444',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PreorderForm
          title="Добавить предзаказ"
          initial={emptyPreorder}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editPreorder && (
        <PreorderForm
          title="Редактировать предзаказ"
          initial={editPreorder}
          onSave={handleEdit}
          onCancel={() => setEditPreorder(null)}
        />
      )}
    </div>
  );
};

export default Preorders;
