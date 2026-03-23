import React, { useState } from 'react';
import { Plus, X, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Preorder, PreorderStatus } from '../types';

const statusConfig: Record<PreorderStatus, { label: string; icon: React.FC<{ className?: string }>; badgeClass: string }> = {
  pending: { label: 'Ожидает', icon: Clock, badgeClass: 'bg-yellow-100 text-yellow-700' },
  fulfilled: { label: 'Выполнен', icon: CheckCircle, badgeClass: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменён', icon: XCircle, badgeClass: 'bg-red-100 text-red-700' },
};

type StatusFilter = 'all' | PreorderStatus;

const statusFilterLabels: Record<StatusFilter, string> = {
  all: 'Все',
  pending: 'Ожидают',
  fulfilled: 'Выполненные',
  cancelled: 'Отменённые',
};

interface PreorderFormProps {
  initial?: Preorder;
  onSave: (data: Omit<Preorder, 'id'>) => void;
  onCancel: () => void;
  title: string;
}

const PreorderForm: React.FC<PreorderFormProps> = ({ initial, onSave, onCancel, title }) => {
  const [customer, setCustomer] = useState(initial?.customer ?? '');
  const [customerPhone, setCustomerPhone] = useState(initial?.customerPhone ?? '');
  const [productName, setProductName] = useState(initial?.productName ?? '');
  const [productSku, setProductSku] = useState(initial?.productSku ?? '');
  const [size, setSize] = useState(initial?.size ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [deposit, setDeposit] = useState(initial?.deposit ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !productName.trim() || !size.trim()) {
      alert('Заполните обязательные поля: Клиент, Товар, Размер');
      return;
    }
    onSave({
      customer: customer.trim(),
      customerPhone: customerPhone.trim() || undefined,
      productName: productName.trim(),
      productSku: productSku.trim(),
      size: size.trim(),
      quantity,
      deposit: deposit || undefined,
      status: initial?.status ?? 'pending',
      date: initial?.date ?? new Date().toISOString(),
      notes: notes.trim() || undefined,
      fulfilledAt: initial?.fulfilledAt,
      cancelledAt: initial?.cancelledAt,
    });
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
            <input className={inputClass} placeholder="Имя клиента или ссылка" value={customer} onChange={(e) => setCustomer(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон клиента</label>
            <input className={inputClass} placeholder="+375 29 123-45-67" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Товар (модель) *</label>
            <input className={inputClass} placeholder="Nike Dunk Low..." value={productName} onChange={(e) => setProductName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Артикул (SKU)</label>
            <input className={inputClass} placeholder="DD1503 120" value={productSku} onChange={(e) => setProductSku(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Размер *</label>
              <input className={inputClass} placeholder="EU 42" value={size} onChange={(e) => setSize(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
              <input type="number" min="1" className={inputClass} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предоплата (Br)</label>
            <input type="number" min="0" className={inputClass} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
            <input className={inputClass} placeholder="Дополнительная информация" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const sorted = [...preorders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filtered = statusFilter === 'all'
    ? sorted
    : sorted.filter((p) => p.status === statusFilter);

  const pendingCount = preorders.filter((p) => p.status === 'pending').length;
  const totalDeposits = preorders
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.deposit ?? 0), 0);

  const handleAdd = async (data: Omit<Preorder, 'id'>) => {
    await add(data);
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Preorder, 'id'>) => {
    if (!editPreorder?.id) return;
    await update(editPreorder.id, data);
    setEditPreorder(null);
  };

  const handleFulfill = async (id: string) => {
    await update(id, { status: 'fulfilled', fulfilledAt: new Date().toISOString() });
  };

  const handleCancel = async (id: string) => {
    await update(id, { status: 'cancelled', cancelledAt: new Date().toISOString() });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить этот предзаказ?')) {
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
        <h2 className="text-xl font-semibold text-gray-900">Предзаказы</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Новый предзаказ
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Ожидают: {pendingCount}</span>
        </div>
        {totalDeposits > 0 && (
          <div className="flex items-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-sm font-medium">Предоплаты: {totalDeposits.toLocaleString('ru-RU')} Br</span>
          </div>
        )}
      </div>

      {/* Status filter */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(Object.keys(statusFilterLabels) as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {statusFilterLabels[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Дата', 'Клиент', 'Товар', 'Артикул', 'Размер', 'Кол-во', 'Предоплата', 'Заметки', 'Статус', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    {preorders.length === 0 ? 'Предзаказов нет' : 'Нет предзаказов с выбранным фильтром'}
                  </td>
                </tr>
              ) : (
                filtered.map((po, idx) => {
                  const sc = statusConfig[po.status];
                  const StatusIcon = sc.icon;
                  const isCancelled = po.status === 'cancelled';
                  const isFulfilled = po.status === 'fulfilled';
                  const rowClass = isCancelled
                    ? 'bg-red-50 opacity-70'
                    : isFulfilled
                    ? 'bg-green-50'
                    : idx % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50';

                  return (
                    <tr key={po.id} className={rowClass}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(po.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{po.customer}</div>
                        {po.customerPhone && <div className="text-xs text-gray-500">{po.customerPhone}</div>}
                      </td>
                      <td className={`px-4 py-3 text-sm text-gray-900 ${isCancelled ? 'line-through' : ''}`}>
                        {po.productName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {po.productSku || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{po.size}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{po.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {po.deposit ? `${po.deposit.toLocaleString('ru-RU')} Br` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate" title={po.notes}>
                        {po.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.badgeClass}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {po.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setEditPreorder(po)}
                                title="Редактировать"
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFulfill(po.id)}
                                title="Выполнен"
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(po.id)}
                                title="Отменить"
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(po.id)}
                            title="Удалить"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <PreorderForm
          title="Новый предзаказ"
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form */}
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
