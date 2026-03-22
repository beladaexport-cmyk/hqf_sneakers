import React, { useState } from 'react';
import { Plus, X, DollarSign, Mail, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
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

interface SaleFormProps {
  products: Product[];
  onSave: (sale: Omit<Sale, 'id'>) => void;
  onCancel: () => void;
}

const SaleForm: React.FC<SaleFormProps> = ({ products, onSave, onCancel }) => {
  const available = products.filter((p) => p.quantity > 0 && p.status === 'available');
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
    if (quantity < 1 || quantity > selectedProduct.quantity) {
      alert(`Количество должно быть от 1 до ${selectedProduct.quantity}`);
      return;
    }
    if (deliveryMethod === 'mail') {
      if (!recipientName.trim()) {
        alert('Укажите ФИО получателя');
        return;
      }
      if (!recipientPhone.trim()) {
        alert('Укажите телефон получателя');
        return;
      }
      if (!address.trim()) {
        alert('Укажите адрес доставки');
        return;
      }
    }
    const sale: Omit<Sale, 'id'> = {
      productId: selectedProduct.id,
      productSku: selectedProduct.sku,
      productName: `${selectedProduct.brand} ${selectedProduct.model} (${selectedProduct.size})`,
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
      status: deliveryMethod === 'in_person' ? 'completed' : 'pending',
    };
    onSave(sale);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Оформить продажу</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Товар *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setQuantity(1);
              }}
              required
            >
              <option value="">— Выберите товар —</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.model} р.{p.size} — {p.retailPrice.toLocaleString('ru-RU')} Br
                  (ост: {p.quantity})
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Нет доступных товаров для продажи</p>
            )}
          </div>

          {selectedProduct && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество (макс: {selectedProduct.quantity}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.quantity}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Способ доставки *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="in_person"
                      checked={deliveryMethod === 'in_person'}
                      onChange={() => setDeliveryMethod('in_person')}
                      className="accent-blue-600"
                    />
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Личная встреча</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="mail"
                      checked={deliveryMethod === 'mail'}
                      onChange={() => setDeliveryMethod('mail')}
                      className="accent-blue-600"
                    />
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">По почте</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя покупателя (необязательно)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Иван Иванов"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>

              {deliveryMethod === 'mail' && (
                <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Данные для доставки
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ФИО получателя *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Иванов Иван Иванович"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон получателя *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="+375 29 123-45-67"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адрес доставки *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="г. Минск, ул. Ленина, д. 1, кв. 10"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Индекс (необязательно)
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="220000"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Примечание к доставке (необязательно)
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Позвонить за час до доставки"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Цена за шт:</span>
                  <span className="font-medium">
                    {selectedProduct.retailPrice.toLocaleString('ru-RU')} Br
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Итого:</span>
                  <span className="text-xl font-bold text-green-600">
                    {total.toLocaleString('ru-RU')} Br
                  </span>
                </div>
                {deliveryMethod === 'mail' && (
                  <p className="text-xs text-blue-600 mt-2">📮 Статус: В процессе (ожидает доставки)</p>
                )}
                {deliveryMethod === 'in_person' && (
                  <p className="text-xs text-green-600 mt-2">🤝 Статус: Завершена</p>
                )}
              </div>
            </>
          )}

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
              disabled={!selectedProduct}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Продать
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
    if (!reason.trim()) {
      alert('Укажите причину отказа');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Отменить продажу</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <div><span className="text-gray-500">Товар:</span> <span className="font-medium">{sale.productName}</span></div>
            {sale.customer && <div><span className="text-gray-500">Клиент:</span> <span className="font-medium">{sale.customer}</span></div>}
            <div><span className="text-gray-500">Сумма:</span> <span className="font-semibold text-gray-900">{sale.total.toLocaleString('ru-RU')} Br</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Причина отказа *
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Не подошел размер"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <span>⚠️</span>
            <span>Товар будет автоматически возвращён на склад ({sale.quantity} шт.)</span>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Отменить продажу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const statusConfig: Record<SaleStatus, { label: string; icon: React.FC<{ className?: string }>; badgeClass: string }> = {
  completed: { label: 'Завершена', icon: CheckCircle, badgeClass: 'bg-green-100 text-green-700' },
  pending: { label: 'В процессе', icon: Clock, badgeClass: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label: 'Отменена', icon: XCircle, badgeClass: 'bg-red-100 text-red-700' },
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
  const { data: sales, add: addSale, update: updateSale } = useFirestore<Sale>('sales');
  const [showForm, setShowForm] = useState(false);
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
  const cancellationRate = periodFiltered.length > 0
    ? Math.round((cancelledCount / periodFiltered.length) * 100)
    : 0;

  const handleSale = async (data: Omit<Sale, 'id'>) => {
    await addSale(data);

    const product = products.find((p) => p.id === data.productId);
    if (product?.id) {
      const newQty = product.quantity - data.quantity;
      await updateProduct(product.id, {
        quantity: newQty,
        status: newQty <= 0 ? 'sold_out' : product.status,
      });
    }
    setShowForm(false);
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

    const product = products.find((p) => p.id === sale.productId);
    if (product?.id) {
      const newQty = product.quantity + sale.quantity;
      await updateProduct(product.id, {
        quantity: newQty,
        status: newQty > 0 ? 'available' : product.status,
      });
    }
    setCancelSale(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Продажи</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Оформить продажу
        </button>
      </div>

      {/* Period Filter + Revenue */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 ml-auto items-center">
          <div className="flex items-center text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <DollarSign className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              Выручка: {totalRevenue.toLocaleString('ru-RU')} Br
            </span>
          </div>
          {cancelledCount > 0 && (
            <div className="flex items-center text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <XCircle className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">
                Отказов: {cancelledCount} ({cancellationRate}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Filter */}
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
                {['Дата', 'Товар', 'Артикул', 'Покупатель', 'Доставка', 'Кол-во', 'Цена', 'Прибыль', 'Итого', 'Статус', 'Действия'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                    {sales.length === 0 ? 'Продаж пока нет' : 'Нет продаж за выбранный период'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, idx) => {
                  const status: SaleStatus = sale.status ?? 'completed';
                  const sc = statusConfig[status];
                  const StatusIcon = sc.icon;
                  const isCancelled = status === 'cancelled';
                  const rowClass = isCancelled
                    ? 'bg-red-50'
                    : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50');
                  return (
                    <tr key={sale.id} className={`${rowClass} ${isCancelled ? 'opacity-70' : ''}`}>
                      <td className={`px-4 py-3 text-sm text-gray-600 ${isCancelled ? 'line-through' : ''}`}>
                        {new Date(sale.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className={`px-4 py-3 text-sm text-gray-900 ${isCancelled ? 'line-through' : ''}`}>
                        {sale.productName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {sale.productSku}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sale.customer || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(sale.deliveryMethod ?? 'in_person') === 'mail' ? (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                            <span>Почта</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span>Лично</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sale.price.toLocaleString('ru-RU')} Br
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${isCancelled ? 'text-gray-400' : 'text-green-600'}`}>
                        {(sale.profit ?? 0).toLocaleString('ru-RU')} Br
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${isCancelled ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                        {sale.total.toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.badgeClass}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        {isCancelled && sale.cancellationReason && (
                          <p className="text-xs text-gray-400 mt-1 max-w-[140px] truncate" title={sale.cancellationReason}>
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
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {(status === 'pending' || status === 'completed') && (
                            <button
                              onClick={() => setCancelSale(sale)}
                              title="Отменить"
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      {showForm && (
        <SaleForm products={products} onSave={handleSale} onCancel={() => setShowForm(false)} />
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

