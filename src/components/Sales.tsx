import React, { useState } from 'react';
import { Plus, X, DollarSign, Mail, Users, CheckCircle, XCircle, Clock, Trash2, AlertTriangle, Pencil, Truck } from 'lucide-react';
import { doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = available.find((p) => p.id === productId);

  const total = selectedProduct ? selectedProduct.retailPrice * quantity : 0;
  const profit = selectedProduct
    ? (selectedProduct.retailPrice - selectedProduct.purchasePrice) * quantity
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted');

    if (isSubmitting) {
      console.log('⏳ Already submitting, ignoring...');
      return;
    }

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

    const trimmedCustomer = customer.trim();
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
      deliveryMethod,
      ...(selectedProduct.modelArticle ? { productModelArticle: selectedProduct.modelArticle } : {}),
      ...(selectedProduct.color ? { productColor: selectedProduct.color } : {}),
      ...(trimmedCustomer ? { customer: trimmedCustomer } : {}),
      ...(deliveryMethod === 'mail' ? {
        deliveryDetails: {
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          address: address.trim(),
          ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
          ...(deliveryNotes.trim() ? { notes: deliveryNotes.trim() } : {}),
        },
      } : {}),
      status: deliveryMethod === 'in_person' ? 'completed' : 'pending',
    };

    setIsSubmitting(true);
    try {
      await onSave(sale);
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      alert(`Ошибка при оформлении продажи: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={!selectedProduct || isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Сохранение...' : 'Продать'}
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

interface EditSaleModalProps {
  sale: Sale;
  products: Product[];
  onSave: (saleId: string, updates: Partial<Sale>) => Promise<void>;
  onCancel: () => void;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ sale, products, onSave, onCancel }) => {
  const [date, setDate] = useState(sale.date ? sale.date.split('T')[0] : '');
  const [productId, setProductId] = useState(sale.productId);
  const [customer, setCustomer] = useState(sale.customer || '');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(sale.deliveryMethod ?? 'in_person');
  const [quantity, setQuantity] = useState(sale.quantity);
  const [price, setPrice] = useState(sale.price);
  const [status, setStatus] = useState<SaleStatus>(sale.status ?? 'completed');
  const [comment, setComment] = useState((sale as any).comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProduct = products.find((p) => p.id === productId);
  const purchasePrice = selectedProduct ? selectedProduct.purchasePrice : sale.purchasePrice;
  const calculatedProfit = (price - purchasePrice) * quantity;
  const calculatedTotal = price * quantity;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = 'Дата обязательна';
    if (!customer.trim()) newErrors.customer = 'Укажите покупателя';
    if (!price || price <= 0) newErrors.price = 'Цена должна быть больше 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const updates: Record<string, any> = {
        date: new Date(date).toISOString(),
        productId,
        customer: customer.trim(),
        deliveryMethod,
        quantity,
        price,
        purchasePrice,
        profit: calculatedProfit,
        total: calculatedTotal,
        status,
        comment: comment.trim(),
      };

      if (selectedProduct) {
        updates.productSku = selectedProduct.sku;
        updates.productModelArticle = selectedProduct.modelArticle || '';
        updates.productName = `${selectedProduct.brand} ${selectedProduct.model} (${selectedProduct.size})`;
        updates.productColor = selectedProduct.color || '';
      }

      await onSave(sale.id, updates);
    } catch (error: any) {
      alert(`Ошибка при обновлении: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ borderRadius: 12 }}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Редактировать продажу</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
            <input
              type="date"
              className={`w-full border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={date}
              onChange={(e) => { setDate(e.target.value); setErrors((prev) => ({ ...prev, date: '' })); }}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Товар</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={productId}
              onChange={(e) => {
                const newId = e.target.value;
                setProductId(newId);
                const p = products.find((pr) => pr.id === newId);
                if (p) setPrice(p.retailPrice);
              }}
            >
              {!selectedProduct && (
                <option value={sale.productId}>{sale.productName}</option>
              )}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.model} р.{p.size} — {p.retailPrice.toLocaleString('ru-RU')} Br
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Артикул</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
              value={selectedProduct ? (selectedProduct.modelArticle || selectedProduct.sku) : (sale.productModelArticle || sale.productSku)}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
              value={selectedProduct ? selectedProduct.color : (sale.productColor || '')}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Покупатель *</label>
            <input
              type="text"
              className={`w-full border ${errors.customer ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Имя покупателя"
              value={customer}
              onChange={(e) => { setCustomer(e.target.value); setErrors((prev) => ({ ...prev, customer: '' })); }}
            />
            {errors.customer && <p className="text-xs text-red-500 mt-1">{errors.customer}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Доставка</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
            >
              <option value="mail">Почта</option>
              <option value="in_person">Лично</option>
              <option value="courier">Курьер</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цена продажи *</label>
            <input
              type="number"
              min="0"
              className={`w-full border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={price}
              onChange={(e) => { setPrice(Number(e.target.value)); setErrors((prev) => ({ ...prev, price: '' })); }}
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as SaleStatus)}
            >
              <option value="pending">В процессе</option>
              <option value="completed">Завершена</option>
              <option value="cancelled">Отменена</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Необязательный комментарий"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Прибыль:</span>
              <span className={`font-semibold ${calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculatedProfit.toLocaleString('ru-RU')} Br
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Итого:</span>
              <span className="text-xl font-bold text-green-600">
                {calculatedTotal.toLocaleString('ru-RU')} Br
              </span>
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
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
  const { data: products } = useFirestore<Product>('products');
  const { data: sales, add: addSale, update: updateSale } = useFirestore<Sale>('sales');
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<Period>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cancelSale, setCancelSale] = useState<Sale | null>(null);
  const [deleteConfirmSale, setDeleteConfirmSale] = useState<Sale | null>(null);
  const [editSaleData, setEditSaleData] = useState<Sale | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    try {
      console.log('🛒 Starting sale creation:', data);

      await addSale(data);
      console.log('✅ Sale created successfully');

      const product = products.find((p) => p.id === data.productId);
      if (product?.id) {
        console.log('📦 Updating product quantity:', product.id);
        const remainingQty = product.quantity - data.quantity;
        await updateDoc(doc(db, 'products', product.id), {
          quantity: increment(-data.quantity),
          ...(remainingQty <= 0 ? { status: 'sold_out' } : {}),
        });
        console.log('✅ Product updated successfully');
      }

      setShowForm(false);
    } catch (error: any) {
      console.error('❌ Error creating sale:', error);
      alert(`Ошибка при оформлении продажи: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleCompleteSale = async (saleId: string) => {
    await updateSale(saleId, { status: 'completed' });
  };

  const handleCancelSale = async (saleId: string, reason: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    await updateDoc(doc(db, 'sales', saleId), {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
    });

    // Atomically return stock to product using increment
    if (sale.productId) {
      await updateDoc(doc(db, 'products', sale.productId), {
        quantity: increment(sale.quantity),
        status: 'available',
      });
    }
    setCancelSale(null);
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (sale.status !== 'cancelled') return;
    await deleteDoc(doc(db, 'sales', sale.id));
    setDeleteConfirmSale(null);
  };

  const handleEditSave = async (saleId: string, updates: Partial<Sale>) => {
    await updateSale(saleId, updates);
    setEditSaleData(null);
    setToast('Продажа обновлена ✅');
    setTimeout(() => setToast(null), 3000);
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
                {['Дата', 'Товар', 'Артикул', 'Цвет', 'Покупатель', 'Доставка', 'Кол-во', 'Цена', 'Прибыль', 'Итого', 'Статус', 'Действия'].map((h) => (
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
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-400">
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
                        <div className="font-semibold text-gray-900">
                          {sale.productModelArticle || sale.productSku}
                        </div>
                        {sale.productModelArticle && (
                          <div className="text-xs text-gray-400">
                            SKU: {sale.productSku}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sale.productColor || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sale.customer || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(() => {
                          const dm = sale.deliveryMethod ?? 'in_person';
                          if (dm === 'mail') return (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-blue-500" />
                              <span>Почта</span>
                            </span>
                          );
                          if (dm === 'courier') return (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-purple-500" />
                              <span>Курьер</span>
                            </span>
                          );
                          return (
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gray-500" />
                              <span>Лично</span>
                            </span>
                          );
                        })()}
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
                          <button
                            onClick={() => setEditSaleData(sale)}
                            title="Редактировать"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
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
                          {status === 'cancelled' && (
                            <button
                              onClick={() => setDeleteConfirmSale(sale)}
                              title="Удалить навсегда"
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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

      {cancelSale && (
        <CancelModal
          sale={cancelSale}
          onConfirm={(reason) => handleCancelSale(cancelSale.id, reason)}
          onCancel={() => setCancelSale(null)}
        />
      )}

      {deleteConfirmSale && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Удалить отменённую продажу?</h2>
              <button onClick={() => setDeleteConfirmSale(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Внимание!</p>
                  <p className="text-sm text-red-700 mt-1">
                    Эта продажа уже отменена и товар вернулся на склад.<br />
                    Удаление необратимо!
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Продажа: <span className="font-medium">{deleteConfirmSale.productName}</span>
                {deleteConfirmSale.cancellationReason && (
                  <span className="block text-gray-400 mt-1">Причина отмены: {deleteConfirmSale.cancellationReason}</span>
                )}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmSale(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDeleteSale(deleteConfirmSale)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить навсегда
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editSaleData && (
        <EditSaleModal
          sale={editSaleData}
          products={products}
          onSave={handleEditSave}
          onCancel={() => setEditSaleData(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Sales;

