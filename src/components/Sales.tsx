import React, { useState } from 'react';
import { Plus, X, DollarSign, Mail, Users, CheckCircle, XCircle, Clock, Trash2, ShoppingCart, Package } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Sale, DeliveryMethod, SaleStatus } from '../types';

type Period = 'all' | 'today' | 'week' | 'month';

const periodLabels: Record<Period, string> = {
  all: 'Все время',
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
};

function filterByPeriod(sales: Sale[], period: Period): Sale[] {
  if (period === 'all') return sales;
  const now = new Date();
  const cutoff = new Date();
  if (period === 'today') {
    cutoff.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    cutoff.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    cutoff.setMonth(now.getMonth() - 1);
  }
  return sales.filter((s) => new Date(s.date) >= cutoff);
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white placeholder-gray-400';
const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

interface SaleFormProps {
  products: Product[];
  onSave: (sale: Omit<Sale, 'id'>) => void;
  onCancel: () => void;
  isPreorder?: boolean;
}

const SaleForm: React.FC<SaleFormProps> = ({ products, onSave, onCancel, isPreorder = false }) => {
  const available = isPreorder
    ? products.filter((p) => p.status === 'preorder')
    : products.filter((p) => p.quantity > 0 && p.status === 'available');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('in_person');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const selectedProduct = available.find((p) => p.id === productId);

  const total = selectedProduct ? selectedProduct.retailPrice * quantity : 0;
  const profit = selectedProduct
    ? (selectedProduct.retailPrice - selectedProduct.purchasePrice) * quantity
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Выберите товар');
      return;
    }
    if (!isPreorder && (quantity < 1 || quantity > selectedProduct.quantity)) {
      alert(`Количество должно быть от 1 до ${selectedProduct.quantity}`);
      return;
    }
    if (quantity < 1) {
      alert('Количество должно быть не менее 1');
      return;
    }
    if (deliveryMethod === 'mail') {
      if (!recipientName.trim()) { alert('Укажите ФИО получателя'); return; }
      if (!recipientPhone.trim()) { alert('Укажите телефон получателя'); return; }
      if (!address.trim()) { alert('Укажите адрес доставки'); return; }
    }
    const sale: Omit<Sale, 'id'> = {
      productId: selectedProduct.id,
      productSku: selectedProduct.sku,
      productName: `${selectedProduct.brand} ${selectedProduct.model} (EU ${selectedProduct.size}${selectedProduct.sizeCM ? ' / ' + selectedProduct.sizeCM + 'см' : ''})`,
      quantity,
      price: selectedProduct.retailPrice,
      purchasePrice: selectedProduct.purchasePrice,
      total,
      profit,
      date: new Date().toISOString(),
      customer: customer.trim() || undefined,
      deliveryMethod,
      deliveryDetails: deliveryMethod === 'mail' ? {
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        address: address.trim(),
        postalCode: postalCode.trim() || undefined,
        notes: deliveryNotes.trim() || undefined,
      } : undefined,
      status: isPreorder ? 'pending' : (deliveryMethod === 'in_person' ? 'completed' : 'pending'),
      isPreorder: isPreorder || undefined,
    };
    onSave(sale);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {isPreorder ? <Package className="w-5 h-5 text-amber-600" /> : <ShoppingCart className="w-5 h-5 text-emerald-600" />}
            {isPreorder ? 'Оформить предзаказ' : 'Оформить продажу'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Товар *</label>
            <select
              className={inputClass}
              value={productId}
              onChange={(e) => { setProductId(e.target.value); setQuantity(1); }}
              required
            >
              <option value="">— Выберите товар —</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.model} EU {p.size}{p.sizeCM ? ` (${p.sizeCM}см)` : ''} — {p.retailPrice.toLocaleString('ru-RU')} Br
                  {!isPreorder && ` (ост: ${p.quantity})`}
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <p className="text-xs text-red-500 mt-1.5">
                {isPreorder ? 'Нет товаров в статусе «Предзаказ»' : 'Нет доступных товаров для продажи'}
              </p>
            )}
          </div>

          {selectedProduct && (
            <>
              <div>
                <label className={labelClass}>
                  Количество {!isPreorder && `(макс: ${selectedProduct.quantity})`} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={isPreorder ? undefined : selectedProduct.quantity}
                  className={inputClass}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Способ доставки *</label>
                <div className="flex gap-3 mt-1">
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${deliveryMethod === 'in_person' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <input type="radio" name="dm" value="in_person" checked={deliveryMethod === 'in_person'} onChange={() => setDeliveryMethod('in_person')} className="sr-only" />
                    <Users className="w-4 h-4" />
                    Лично
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${deliveryMethod === 'mail' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <input type="radio" name="dm" value="mail" checked={deliveryMethod === 'mail'} onChange={() => setDeliveryMethod('mail')} className="sr-only" />
                    <Mail className="w-4 h-4" />
                    Почта
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Имя покупателя</label>
                <input className={inputClass} placeholder="Иван Иванов" value={customer} onChange={(e) => setCustomer(e.target.value)} />
              </div>

              {deliveryMethod === 'mail' && (
                <div className="space-y-3 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Данные доставки
                  </h3>
                  <div>
                    <label className={labelClass}>ФИО получателя *</label>
                    <input className={inputClass} placeholder="Иванов Иван Иванович" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Телефон *</label>
                    <input className={inputClass} placeholder="+375 29 123-45-67" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Адрес *</label>
                    <input className={inputClass} placeholder="г. Минск, ул. Ленина, д. 1" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Индекс</label>
                    <input className={inputClass} placeholder="220000" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Примечание</label>
                    <input className={inputClass} placeholder="Позвонить за час" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
                  </div>
                </div>
              )}

              <div className={`rounded-xl p-4 ${isPreorder ? 'bg-amber-50/50 border border-amber-100' : 'bg-emerald-50/50 border border-emerald-100'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Цена за шт:</span>
                  <span className="font-medium">{selectedProduct.retailPrice.toLocaleString('ru-RU')} Br</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Итого:</span>
                  <span className={`text-xl font-bold ${isPreorder ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {total.toLocaleString('ru-RU')} Br
                  </span>
                </div>
                {isPreorder && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">Предзаказ — товар будет доставлен позже</p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
              Отмена
            </button>
            <button
              type="submit"
              disabled={!selectedProduct}
              className={`px-5 py-2.5 text-white rounded-xl transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isPreorder ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isPreorder ? 'Предзаказ' : 'Продать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CancelModalProps {
  sale: Sale;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const CancelModal: React.FC<CancelModalProps> = ({ sale, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { alert('Укажите причину отказа'); return; }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Отменить продажу</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div><span className="text-gray-500">Товар:</span> <span className="font-semibold">{sale.productName}</span></div>
            {sale.customer && <div><span className="text-gray-500">Клиент:</span> <span className="font-semibold">{sale.customer}</span></div>}
            <div><span className="text-gray-500">Сумма:</span> <span className="font-bold text-gray-900">{sale.total.toLocaleString('ru-RU')} Br</span></div>
          </div>
          <div>
            <label className={labelClass}>Причина отказа *</label>
            <input className={inputClass} placeholder="Не подошел размер" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            <span className="text-base">!</span>
            <span>Товар будет возвращён на склад ({sale.quantity} шт.)</span>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
              Назад
            </button>
            <button type="submit" className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium shadow-sm">
              Отменить продажу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const statusConfig: Record<SaleStatus, { label: string; icon: React.FC<{ className?: string }>; badgeClass: string }> = {
  completed: { label: 'Завершена', icon: CheckCircle, badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  pending: { label: 'В процессе', icon: Clock, badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200' },
  cancelled: { label: 'Отменена', icon: XCircle, badgeClass: 'bg-red-50 text-red-600 border border-red-200' },
};

type StatusFilter = 'all' | SaleStatus;

const statusFilterLabels: Record<StatusFilter, string> = {
  all: 'Все',
  completed: 'Завершённые',
  pending: 'В процессе',
  cancelled: 'Отменённые',
};

const Sales: React.FC = () => {
  const { data: products, update: updateProduct } = useFirestore<Product>('products');
  const { data: sales, add: addSale, update: updateSale, remove: removeSale } = useFirestore<Sale>('sales');
  const [showForm, setShowForm] = useState(false);
  const [showPreorderForm, setShowPreorderForm] = useState(false);
  const [period, setPeriod] = useState<Period>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cancelSale, setCancelSale] = useState<Sale | null>(null);

  const periodFiltered = filterByPeriod([...sales].reverse(), period);
  const filteredSales = statusFilter === 'all'
    ? periodFiltered
    : periodFiltered.filter((s) => (s.status ?? 'completed') === statusFilter);

  const completedSales = periodFiltered.filter((s) => (s.status ?? 'completed') === 'completed');
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);
  const cancelledCount = periodFiltered.filter((s) => s.status === 'cancelled').length;
  const preorderCount = periodFiltered.filter((s) => s.isPreorder).length;
  const preorderPendingCount = periodFiltered.filter((s) => s.isPreorder && s.status === 'pending').length;
  const preorderRevenue = periodFiltered.filter((s) => s.isPreorder).reduce((sum, s) => sum + s.total, 0);

  const handleSale = async (data: Omit<Sale, 'id'>) => {
    await addSale(data);

    // Only decrease quantity for non-preorder sales
    if (!data.isPreorder) {
      const product = products.find((p) => p.id === data.productId);
      if (product?.id) {
        const newQty = product.quantity - data.quantity;
        await updateProduct(product.id, {
          quantity: newQty,
          status: newQty <= 0 ? 'sold_out' : product.status,
        });
      }
    }
    setShowForm(false);
    setShowPreorderForm(false);
  };

  const handleCompleteSale = async (saleId: string) => {
    await updateSale(saleId, { status: 'completed' });
  };

  const handleCancelSale = async (saleId: string, reason: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    await updateSale(saleId, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
    });

    // Only return stock for non-preorder sales
    if (!sale.isPreorder) {
      const product = products.find((p) => p.id === sale.productId);
      if (product?.id) {
        const newQty = product.quantity + sale.quantity;
        await updateProduct(product.id, {
          quantity: newQty,
          status: newQty > 0 ? 'available' : product.status,
        });
      }
    }
    setCancelSale(null);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (window.confirm('Удалить эту отменённую продажу? Это действие нельзя отменить.')) {
      await removeSale(saleId);
    }
  };

  const tabClass = (active: boolean) =>
    `px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Продажи</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreorderForm(true)}
            className="flex items-center px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors text-sm font-medium border border-amber-200"
          >
            <Package className="w-4 h-4 mr-2" />
            Предзаказ
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Оформить продажу
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
          <div>
            <div className="text-xs text-emerald-600 font-medium">Выручка</div>
            <div className="text-lg font-bold text-emerald-700">{totalRevenue.toLocaleString('ru-RU')} Br</div>
          </div>
        </div>
        <div className="flex items-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <Package className="w-5 h-5 text-amber-600 mr-2" />
          <div>
            <div className="text-xs text-amber-600 font-medium">Предзаказы</div>
            <div className="text-lg font-bold text-amber-700">{preorderCount} <span className="text-sm font-medium">({preorderPendingCount} ожид.)</span></div>
          </div>
        </div>
        {cancelledCount > 0 && (
          <div className="flex items-center bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <div className="text-xs text-red-500 font-medium">Отказов</div>
              <div className="text-lg font-bold text-red-600">{cancelledCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Preorder Revenue Card */}
      {preorderCount > 0 && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-800 text-sm">Статистика предзаказов</h3>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-xs text-amber-600">Всего</div>
                  <div className="text-lg font-bold text-amber-800">{preorderCount}</div>
                </div>
                <div>
                  <div className="text-xs text-amber-600">Ожидают</div>
                  <div className="text-lg font-bold text-amber-800">{preorderPendingCount}</div>
                </div>
                <div>
                  <div className="text-xs text-amber-600">Выполнено</div>
                  <div className="text-lg font-bold text-emerald-700">{periodFiltered.filter((s) => s.isPreorder && s.status === 'completed').length}</div>
                </div>
                <div>
                  <div className="text-xs text-amber-600">Сумма предзаказов</div>
                  <div className="text-lg font-bold text-amber-800">{preorderRevenue.toLocaleString('ru-RU')} Br</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period + Status Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={tabClass(period === p)}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(Object.keys(statusFilterLabels) as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={tabClass(statusFilter === s)}>
              {statusFilterLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                {['Дата', 'Товар', 'Артикул', 'Покупатель', 'Доставка', 'Кол-во', 'Цена', 'Прибыль', 'Итого', 'Статус', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {sales.length === 0 ? 'Продаж пока нет' : 'Нет продаж за выбранный период'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const status: SaleStatus = sale.status ?? 'completed';
                  const sc = statusConfig[status];
                  const StatusIcon = sc.icon;
                  const isCancelled = status === 'cancelled';
                  return (
                    <tr key={sale.id} className={`hover:bg-gray-50/50 transition-colors ${isCancelled ? 'bg-red-50/30 opacity-60' : ''}`}>
                      <td className={`px-4 py-3 text-sm text-gray-600 ${isCancelled ? 'line-through' : ''}`}>
                        {new Date(sale.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm text-gray-900 ${isCancelled ? 'line-through' : ''}`}>
                          {sale.productName}
                        </div>
                        {sale.isPreorder && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 mt-0.5">
                            Предзаказ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{sale.productSku}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sale.customer || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(sale.deliveryMethod ?? 'in_person') === 'mail' ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs">Почта</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs">Лично</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.price.toLocaleString('ru-RU')} Br</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${isCancelled ? 'text-gray-400' : 'text-emerald-600'}`}>
                        {(sale.profit ?? 0).toLocaleString('ru-RU')} Br
                      </td>
                      <td className={`px-4 py-3 text-sm font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {sale.total.toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${sc.badgeClass}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        {isCancelled && sale.cancellationReason && (
                          <p className="text-[10px] text-gray-400 mt-1 max-w-[140px] truncate" title={sale.cancellationReason}>
                            {sale.cancellationReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {status === 'pending' && (
                            <button
                              onClick={() => handleCompleteSale(sale.id)}
                              title="Завершить"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {(status === 'pending' || status === 'completed') && (
                            <button
                              onClick={() => setCancelSale(sale)}
                              title="Отменить"
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {isCancelled && (
                            <button
                              onClick={() => handleDeleteSale(sale.id)}
                              title="Удалить"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {showForm && (
        <SaleForm products={products} onSave={handleSale} onCancel={() => setShowForm(false)} />
      )}
      {showPreorderForm && (
        <SaleForm products={products} onSave={handleSale} onCancel={() => setShowPreorderForm(false)} isPreorder />
      )}
      {cancelSale && (
        <CancelModal
          sale={cancelSale}
          onConfirm={(reason) => handleCancelSale(cancelSale.id, reason)}
          onCancel={() => setCancelSale(null)}
        />
      )}
    </div>
  );
};

export default Sales;
