import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Users, Trash2, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Sale, DeliveryMethod, SaleStatus } from '../types';
import { useViewMode } from '../contexts/ViewModeContext';

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
      ...(selectedProduct.images?.[0] ? { productImage: selectedProduct.images[0] } : {}),
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


type StatusFilter = 'all' | SaleStatus;

const Sales: React.FC = () => {
  const { isMobileView } = useViewMode();
  const { data: products } = useFirestore<Product>('products');
  const { data: sales, add: addSale, update: updateSale } = useFirestore<Sale>('sales');
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<Period>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cancelSale, setCancelSale] = useState<Sale | null>(null);
  const [deleteConfirmSale, setDeleteConfirmSale] = useState<Sale | null>(null);
  const [editSaleData, setEditSaleData] = useState<Sale | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const imageFixRanRef = useRef(false);

  // Debug: log all sales and products data for diagnostics
  useEffect(() => {
    if (sales.length > 0) {
      console.log('=== ALL SALES DATA ===');
      sales.forEach(sale => {
        console.log({
          id: sale.id,
          productName: sale.productName,
          productId: sale.productId,
          productImage: sale.productImage ? 'HAS productImage' : 'NO productImage',
          allFields: Object.keys(sale)
        });
      });
    }
    if (products.length > 0) {
      console.log('=== ALL PRODUCTS DATA ===');
      products.forEach(p => {
        console.log({
          id: p.id,
          brand: p.brand,
          model: p.model,
          images: p.images?.length ? `HAS ${p.images.length} images` : 'NO images',
          allFields: Object.keys(p)
        });
      });
    }
  }, [sales, products]);

  // One-time fix: patch sales missing productImage from catalog or sibling sales
  useEffect(() => {
    if (imageFixRanRef.current || sales.length === 0 || products.length === 0) return;
    imageFixRanRef.current = true;

    const fixMissingImages = async () => {
      for (const sale of sales) {
        // Skip if already has image
        if (sale.productImage) continue;

        let img: string | null = null;

        // Try matching product by ID
        let matched = products.find(p => p.id === sale.productId);
        if (matched?.images?.[0]) {
          img = matched.images[0];
        }

        // Try matching product by SKU
        if (!img) {
          matched = products.find(p => p.sku === sale.productSku);
          if (matched?.images?.[0]) img = matched.images[0];
        }

        // Try matching by brand + model name
        if (!img) {
          const saleName = (sale.productName || '').toLowerCase();
          matched = products.find(p => {
            if (!p.brand || !p.model || !p.images?.[0]) return false;
            return saleName.includes(p.model.toLowerCase()) &&
              saleName.includes(p.brand.toLowerCase());
          });
          if (matched?.images?.[0]) img = matched.images[0];
        }

        // Try finding image from another sale of the same product
        if (!img) {
          const saleName = (sale.productName || '').toLowerCase().replace(/\(\d+\.?\d*\)/g, '').trim();
          const siblingSale = sales.find(s => {
            if (!s.productImage) return false;
            if (s.id === sale.id) return false;
            // Match by productId
            if (sale.productId && s.productId === sale.productId) return true;
            // Match by normalized name (strip size)
            const otherName = (s.productName || '').toLowerCase().replace(/\(\d+\.?\d*\)/g, '').trim();
            return otherName === saleName && saleName.length > 0;
          });
          if (siblingSale?.productImage) img = siblingSale.productImage;
        }

        if (!img) continue;

        try {
          await updateDoc(doc(db, 'sales', sale.id), { productImage: img });
          console.log(`Fixed image for: ${sale.productName}`);
        } catch (e) {
          console.error(`Failed to fix image for: ${sale.id}`, e);
        }
      }
    };

    fixMissingImages();
  }, [sales, products]);

  const periodFiltered = filterByPeriod([...sales].reverse(), period);
  const filteredSales = statusFilter === 'all'
    ? periodFiltered
    : periodFiltered.filter((s) => (s.status ?? 'completed') === statusFilter);

  const completedSales = periodFiltered.filter((s) => (s.status ?? 'completed') === 'completed');
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = completedSales.reduce((sum, s) => sum + (s.profit ?? 0), 0);

  const getSaleProductImage = (sale: Sale): string | null => {
    // Try 0: direct image stored on the sale record
    if (sale.productImage) return sale.productImage;

    // Try 1: exact match by productId or SKU
    let product = products.find(p =>
      p.id === sale.productId || p.sku === sale.productSku
    );
    if (product?.images?.[0]) return product.images[0];

    // Try 2: match by modelArticle
    if (sale.productModelArticle) {
      product = products.find(p =>
        p.modelArticle === sale.productModelArticle && p.images?.[0]
      );
      if (product?.images?.[0]) return product.images[0];
    }

    // Try 3: match by brand + model name (ignore size — any variant of same model)
    const saleName = (sale.productName || '').toLowerCase();
    product = products.find(p => {
      if (!p.brand || !p.model || !p.images?.[0]) return false;
      return saleName.includes(p.model.toLowerCase()) &&
        saleName.includes(p.brand.toLowerCase());
    });
    if (product?.images?.[0]) return product.images[0];

    // Try 4: match by model name only
    product = products.find(p => {
      if (!p.model || !p.images?.[0]) return false;
      return saleName.includes(p.model.toLowerCase());
    });
    if (product?.images?.[0]) return product.images[0];

    // Try 5: match by base SKU prefix (without size suffix)
    if (sale.productSku) {
      const baseSku = sale.productSku.replace(/-\d+(\.\d+)?$/, '');
      if (baseSku !== sale.productSku) {
        product = products.find(p =>
          p.sku.startsWith(baseSku) && p.images?.[0]
        );
        if (product?.images?.[0]) return product.images[0];
      }
    }

    // Try 6: find image from another sale of the same product (different size)
    const saleNameNorm = saleName.replace(/\(\d+\.?\d*\)/g, '').trim();
    if (saleNameNorm.length > 0) {
      const siblingSale = sales.find(s => {
        if (!s.productImage || s.id === sale.id) return false;
        // Match by productId
        if (sale.productId && s.productId === sale.productId) return true;
        // Match by normalized name (strip size)
        const otherName = (s.productName || '').toLowerCase().replace(/\(\d+\.?\d*\)/g, '').trim();
        return otherName === saleNameNorm;
      });
      if (siblingSale?.productImage) return siblingSale.productImage;
    }

    return null;
  };

  const handleSale = async (data: Omit<Sale, 'id'>) => {
    try {
      console.log('🛒 Starting sale creation:', data);

      // Ensure productImage is saved from catalog if not already set
      let saleData = { ...data };
      if (!saleData.productImage) {
        const selectedProduct = products.find(p => p.id === saleData.productId);
        const catalogImage = selectedProduct?.images?.[0] || null;
        if (catalogImage) {
          saleData = { ...saleData, productImage: catalogImage };
        }
      }

      await addSale(saleData);
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
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:'14px',
        gap:'10px',
        padding:'16px 16px 0'
      }}>
        <h1 style={{
          margin:0,
          fontSize:'22px',
          fontWeight:'800',
          color:'#0F172A'
        }}>
          🛍️ Продажи
        </h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding:'10px 14px',
            background:'linear-gradient(135deg,#10B981,#34D399)',
            color:'white',
            border:'none',
            borderRadius:'12px',
            fontSize:'13px',
            fontWeight:'700',
            cursor:'pointer',
            whiteSpace:'nowrap',
            flexShrink:0,
            boxShadow:'0 4px 12px rgba(16,185,129,0.35)'
          }}
        >
          + Продажа
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
      </div>

      {/* Stats Cards */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobileView ? '1fr' : 'repeat(3,1fr)',
        gap:'10px',
        marginBottom:'16px'
      }}>
        {[
          {
            icon:'💰',
            value:totalRevenue||0,
            label:'Выручка',
            unit:'Br',
            color:'#10B981',
            bg:'#F0FDF4',
            border:'#A7F3D0'
          },
          {
            icon:'📈',
            value:totalProfit||0,
            label:'Прибыль',
            unit:'Br',
            color:'#6366F1',
            bg:'#EEF2FF',
            border:'#C7D2FE',
            plus:true
          },
          {
            icon:'🛍️',
            value:filteredSales?.length||0,
            label:'Продаж',
            unit:'',
            color:'#F59E0B',
            bg:'#FFFBEB',
            border:'#FDE68A'
          }
        ].map(s=>(
          <div
            key={s.label}
            style={{
              backgroundColor:s.bg,
              border:`1.5px solid ${s.border}`,
              borderRadius:'14px',
              padding:'12px 8px',
              textAlign:'center'
            }}
          >
            <div style={{
              fontSize:'20px',
              marginBottom:'4px'
            }}>
              {s.icon}
            </div>
            <div style={{
              fontSize:'16px',
              fontWeight:'800',
              color:s.color,
              lineHeight:1,
              marginBottom:'3px'
            }}>
              {s.plus && s.value>0
                ? '+' : ''}
              {s.value}
              {s.unit && (
                <span style={{
                  fontSize:'10px',
                  marginLeft:'2px'
                }}>
                  {s.unit}
                </span>
              )}
            </div>
            <div style={{
              fontSize:'10px',
              color:'#94A3B8',
              fontWeight:'600'
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div style={{
        display:'flex',
        gap:'6px',
        overflowX:'auto',
        paddingBottom:'4px',
        marginBottom:'14px',
        scrollbarWidth:'none',
        WebkitOverflowScrolling:'touch'
      }}>
        <style>{`
          .filter-scroll::-webkit-scrollbar{
            display:none;
          }
        `}</style>
        {[
          {key:'all',label:'Все'},
          {key:'completed',label:'✅ Готово'},
          {key:'pending',label:'⏳ Процесс'},
          {key:'cancelled',label:'❌ Отменена'}
        ].map(tab=>(
          <button
            key={tab.key}
            onClick={()=>
              setStatusFilter(tab.key as StatusFilter)
            }
            style={{
              padding:'8px 14px',
              borderRadius:'20px',
              border:'none',
              backgroundColor:
                statusFilter===tab.key
                  ? '#6366F1'
                  : 'white',
              color:
                statusFilter===tab.key
                  ? 'white'
                  : '#64748B',
              fontSize:'12px',
              fontWeight:'600',
              cursor:'pointer',
              whiteSpace:'nowrap',
              flexShrink:0,
              boxShadow:
                statusFilter===tab.key
                  ? '0 4px 12px rgba(99,102,241,0.35)'
                  : '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sales Cards */}
      <div>
        {(() => {
          const sortedSales = [...filteredSales].sort((a, b) => {
            const order: Record<string, number> = {
              'pending': 0,
              'в процессе': 0,
              'inprocess': 0,
              'completed': 1,
              'завершена': 1,
              'cancelled': 2,
              'отменена': 2,
            };
            const aOrder = order[a.status?.toLowerCase() ?? 'completed'] ?? 1;
            const bOrder = order[b.status?.toLowerCase() ?? 'completed'] ?? 1;
            return aOrder - bOrder;
          });

          if (sortedSales.length === 0) {
            return (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#94A3B8'
              }}>
                <div style={{ fontSize: '64px' }}>🛍️</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#475569',
                  marginTop: '16px'
                }}>
                  {sales.length === 0 ? 'Продаж пока нет' : 'Продаж не найдено'}
                </div>
                <div style={{
                  fontSize: '14px',
                  marginTop: '8px'
                }}>
                  {sales.length === 0 ? 'Оформи первую продажу!' : 'Попробуйте изменить фильтр или оформите новую продажу'}
                </div>
              </div>
            );
          }

          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}>
              {sortedSales.map((sale) => {
                const status: SaleStatus = sale.status ?? 'completed';
                const isCompleted = status === 'completed';
                const isCancelled = status === 'cancelled';
                const isInProcess = !isCompleted && !isCancelled;
                const productImage = getSaleProductImage(sale);
                const dm = sale.deliveryMethod ?? 'in_person';

                // Extract size from productName: "Nike Air Jordan 1 Low (42)" → "42"
                const sizeMatch = sale.productName?.match(/\((\d+\.?\d*)\)/);
                const sizeDisplay = sizeMatch ? sizeMatch[1] : null;

                // Clean product name without size
                const cleanName = (sale.productName || '').replace(/\s*\(\d+\.?\d*\)\s*$/, '');

                return (
                  <div
                    key={sale.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: isCompleted
                        ? '0 4px 20px rgba(16,185,129,0.12)'
                        : isInProcess
                        ? '0 4px 20px rgba(99,102,241,0.12)'
                        : '0 2px 8px rgba(0,0,0,0.06)',
                      border: isCompleted
                        ? '2px solid #A7F3D0'
                        : isInProcess
                        ? '2px solid #C7D2FE'
                        : '2px solid #FECACA',
                      transition: 'all 0.25s ease',
                      position: 'relative' as const,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = isCompleted
                        ? '0 12px 40px rgba(16,185,129,0.2)'
                        : isInProcess
                        ? '0 12px 40px rgba(99,102,241,0.18)'
                        : '0 12px 32px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isCompleted
                        ? '0 4px 20px rgba(16,185,129,0.12)'
                        : isInProcess
                        ? '0 4px 20px rgba(99,102,241,0.12)'
                        : '0 2px 8px rgba(0,0,0,0.06)';
                    }}
                  >
                    {/* ═══ IMAGE AREA ═══ */}
                    <div style={{
                      position: 'relative',
                      height: '200px',
                      backgroundColor: isCompleted
                        ? '#F0FDF4'
                        : isInProcess
                        ? '#EEF2FF'
                        : '#FEF2F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={sale.productName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s',
                          }}
                          onMouseEnter={e =>
                            (e.target as HTMLImageElement).style.transform = 'scale(1.05)'
                          }
                          onMouseLeave={e =>
                            (e.target as HTMLImageElement).style.transform = 'scale(1)'
                          }
                        />
                      ) : (
                        <span style={{ fontSize: '56px' }}>👟</span>
                      )}

                      {/* STATUS BADGE - top right */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '800',
                        backdropFilter: 'blur(8px)',
                        backgroundColor: isCompleted
                          ? 'rgba(16,185,129,0.92)'
                          : isInProcess
                          ? 'rgba(251,191,36,0.95)'
                          : 'rgba(239,68,68,0.88)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        letterSpacing: '0.2px',
                      }}>
                        {isCompleted
                          ? '✅ Завершена'
                          : isInProcess
                          ? '⏳ В процессе'
                          : '❌ Отменена'}
                      </div>

                      {/* DATE - top left */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(255,255,255,0.92)',
                        borderRadius: '8px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748B',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      }}>
                        {new Date(sale.date).toLocaleDateString('ru-RU')}
                      </div>

                      {/* SIZE BADGE - bottom left */}
                      {sizeDisplay && (
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          backgroundColor: '#1E293B',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '6px 14px',
                          fontSize: '16px',
                          fontWeight: '900',
                          letterSpacing: '0.5px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            color: '#94A3B8',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const,
                          }}>
                            EU
                          </span>
                          {sizeDisplay}
                        </div>
                      )}

                      {/* DELIVERY METHOD - bottom right */}
                      {dm && (
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          backgroundColor: 'rgba(255,255,255,0.92)',
                          borderRadius: '8px',
                          padding: '4px 9px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#475569',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        }}>
                          {dm === 'mail' ? '📦 Почта' : dm === 'courier' ? '🚚 Курьер' : '🤝 Лично'}
                        </div>
                      )}

                      {/* BOTTOM COLOR STRIP */}
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        height: '3px',
                        background: isCompleted
                          ? 'linear-gradient(90deg, #10B981, #34D399)'
                          : isInProcess
                          ? 'linear-gradient(90deg, #6366F1, #818CF8)'
                          : 'linear-gradient(90deg, #EF4444, #FCA5A5)',
                      }} />
                    </div>

                    {/* ═══ CARD BODY ═══ */}
                    <div style={{ padding: '14px 16px' }}>

                      {/* Product name */}
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '800',
                        color: '#0F172A',
                        marginBottom: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.2px',
                      }}>
                        {cleanName}
                      </div>

                      {/* Color + SKU */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '10px',
                      }}>
                        {sale.productColor && (
                          <span style={{
                            fontSize: '12px',
                            color: '#94A3B8',
                            fontWeight: '500',
                          }}>
                            {sale.productColor}
                          </span>
                        )}
                        {(sale.productModelArticle || sale.productSku) && (
                          <span style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            backgroundColor: '#F1F5F9',
                            color: '#64748B',
                            padding: '1px 6px',
                            borderRadius: '5px',
                            fontWeight: '600',
                          }}>
                            {sale.productModelArticle || sale.productSku}
                          </span>
                        )}
                      </div>

                      {/* BUYER ROW */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '12px',
                        padding: '8px 10px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                      }}>
                        <span style={{ fontSize: '14px' }}>👤</span>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#374151',
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {sale.customer || 'Покупатель'}
                        </span>
                      </div>

                      {/* Cancellation reason if cancelled */}
                      {isCancelled && sale.cancellationReason && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', color: '#EF4444', marginBottom: '12px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }} title={sale.cancellationReason}>
                          <span>💬</span>
                          <span>{sale.cancellationReason}</span>
                        </div>
                      )}

                      {/* PRICE STATS */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '6px',
                        marginBottom: '10px',
                      }}>
                        <div style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '10px',
                          padding: '8px 6px',
                          textAlign: 'center',
                          border: '1px solid #E2E8F0',
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '800',
                            color: isCancelled ? '#94A3B8' : '#1E293B',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                          }}>
                            {sale.price.toLocaleString('ru-RU')} Br
                          </div>
                          <div style={{
                            fontSize: '9px',
                            color: '#94A3B8',
                            fontWeight: '700',
                            marginTop: '2px',
                            letterSpacing: '0.5px',
                          }}>
                            ЦЕНА
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#F0FDF4',
                          borderRadius: '10px',
                          padding: '8px 6px',
                          textAlign: 'center',
                          border: '1px solid #A7F3D0',
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '800',
                            color: isCancelled ? '#94A3B8' : '#10B981',
                          }}>
                            +{(sale.profit ?? 0).toLocaleString('ru-RU')} Br
                          </div>
                          <div style={{
                            fontSize: '9px',
                            color: '#94A3B8',
                            fontWeight: '700',
                            marginTop: '2px',
                            letterSpacing: '0.5px',
                          }}>
                            ПРИБЫЛЬ
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#EEF2FF',
                          borderRadius: '10px',
                          padding: '8px 6px',
                          textAlign: 'center',
                          border: '1px solid #C7D2FE',
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '800',
                            color: isCancelled ? '#94A3B8' : '#6366F1',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                          }}>
                            {sale.total.toLocaleString('ru-RU')} Br
                          </div>
                          <div style={{
                            fontSize: '9px',
                            color: '#94A3B8',
                            fontWeight: '700',
                            marginTop: '2px',
                            letterSpacing: '0.5px',
                          }}>
                            ИТОГО
                          </div>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px',
                      }}>
                        {/* Complete button - only if pending */}
                        {status === 'pending' && (
                          <button
                            onClick={() => handleCompleteSale(sale.id)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              border: 'none',
                              borderRadius: '10px',
                              backgroundColor: '#D1FAE5',
                              color: '#065F46',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#A7F3D0';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#D1FAE5';
                            }}
                          >
                            ✅ Завершить
                          </button>
                        )}

                        {/* Edit button */}
                        <button
                          onClick={() => setEditSaleData(sale)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: '10px',
                            backgroundColor: 'white',
                            color: '#475569',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.borderColor = '#CBD5E1';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                          }}
                        >
                          ✏️ Изменить
                        </button>

                        {/* Cancel - if pending or completed */}
                        {(status === 'pending' || status === 'completed') && (
                          <button
                            onClick={() => setCancelSale(sale)}
                            style={{
                              width: '40px',
                              height: '40px',
                              border: 'none',
                              borderRadius: '10px',
                              backgroundColor: '#FEE2E2',
                              color: '#EF4444',
                              fontSize: '16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#FECACA';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                            }}
                          >
                            🗑
                          </button>
                        )}

                        {/* Delete permanently - only if cancelled */}
                        {status === 'cancelled' && (
                          <button
                            onClick={() => setDeleteConfirmSale(sale)}
                            style={{
                              width: '40px',
                              height: '40px',
                              border: 'none',
                              borderRadius: '10px',
                              backgroundColor: '#FEE2E2',
                              color: '#EF4444',
                              fontSize: '16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#FECACA';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                            }}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
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

