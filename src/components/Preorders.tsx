import React, { useState } from 'react';
import { Plus, X, CheckCircle, Clock, Package, DollarSign, XCircle, Edit2 } from 'lucide-react';
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

  const filtered = statusFilter === 'all'
    ? preorders
    : preorders.filter((p) => p.status === statusFilter);

  const pending = preorders.filter((p) => p.status === 'pending');
  const totalPairs = pending.reduce((sum, p) => sum + p.quantity, 0);
  const totalExpectedRevenue = pending.reduce((sum, p) => sum + p.retailPrice * p.quantity, 0);

  const handleAdd = async (data: Omit<Preorder, 'id' | 'createdAt'>) => {
    await add({ ...data, createdAt: new Date().toISOString() });
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

  const handleCancel = async (preorderId: string) => {
    if (window.confirm('Отменить этот предзаказ?')) {
      await update(preorderId, { status: 'cancelled' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить предзаказ?')) {
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

      {/* Table / Cards */}
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Модель', 'Размер', 'Кол-во', 'Закупка', 'Продажа', 'Поставщик', 'Ожид. дата', 'Статус', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    {preorders.length === 0 ? 'Предзаказов нет. Добавьте первый!' : 'Нет предзаказов с выбранным статусом'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const sc = statusConfig[p.status];
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.modelName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        EU {p.sizeEU}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.quantity} шт</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.purchasePrice.toLocaleString('ru-RU')} Br</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.retailPrice.toLocaleString('ru-RU')} Br</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.supplier}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.expectedDate ? new Date(p.expectedDate).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.badgeClass}`}>
                          {sc.label}
                        </span>
                        {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleMarkArrived(p.id)}
                                title="Пришло"
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Пришло
                              </button>
                              <button
                                onClick={() => setEditPreorder(p)}
                                title="Редактировать"
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(p.id)}
                                title="Отменить"
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(p.status === 'arrived' || p.status === 'cancelled') && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              title="Удалить"
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            {preorders.length === 0 ? 'Предзаказов нет. Добавьте первый!' : 'Нет предзаказов с выбранным статусом'}
          </div>
        ) : (
          filtered.map((p) => {
            const sc = statusConfig[p.status];
            return (
              <div key={p.id} className="bg-white rounded-xl shadow p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{p.modelName}</p>
                    <p className="text-sm text-gray-500">EU {p.sizeEU}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.badgeClass}`}>{sc.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Кол-во:</span> <span className="font-medium">{p.quantity} шт</span></div>
                  <div><span className="text-gray-500">Цена:</span> <span className="font-medium">{p.retailPrice} Br</span></div>
                  <div><span className="text-gray-500">Поставщик:</span> <span className="font-medium">{p.supplier}</span></div>
                  <div><span className="text-gray-500">Ожидается:</span> <span className="font-medium">{p.expectedDate ? new Date(p.expectedDate).toLocaleDateString('ru-RU') : '—'}</span></div>
                </div>
                {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                <div className="flex gap-2 pt-1">
                  {p.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleMarkArrived(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Пришло
                      </button>
                      <button
                        onClick={() => setEditPreorder(p)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleCancel(p.id)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  )}
                  {(p.status === 'arrived' || p.status === 'cancelled') && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
