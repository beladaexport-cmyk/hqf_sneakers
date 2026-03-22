import React, { useState } from 'react';
import { Plus, X, DollarSign } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Product, Sale } from '../types';

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

  const selectedProduct = available.find((p) => p.id === productId);

  const total = selectedProduct ? selectedProduct.retailPrice * quantity : 0;

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
    const sale: Omit<Sale, 'id'> = {
      productId: selectedProduct.id,
      productSku: selectedProduct.sku,
      productName: `${selectedProduct.brand} ${selectedProduct.model} (${selectedProduct.size})`,
      quantity,
      price: selectedProduct.retailPrice,
      total,
      date: new Date().toISOString(),
      customer: customer.trim() || undefined,
    };
    onSave(sale);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
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
                  {p.brand} {p.model} р.{p.size} — {p.retailPrice.toLocaleString('ru-RU')} ₽
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Цена за шт:</span>
                  <span className="font-medium">
                    {selectedProduct.retailPrice.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Итого:</span>
                  <span className="text-xl font-bold text-green-600">
                    {total.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
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

const Sales: React.FC = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('hqf_products', []);
  const [sales, setSales] = useLocalStorage<Sale[]>('hqf_sales', []);
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<Period>('all');

  const filteredSales = filterByPeriod([...sales].reverse(), period);
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

  const handleSale = (data: Omit<Sale, 'id'>) => {
    const newSale: Sale = { ...data, id: Date.now().toString() };
    setSales([...sales, newSale]);

    // Decrease product quantity
    setProducts(
      products.map((p) =>
        p.id === data.productId
          ? {
              ...p,
              quantity: p.quantity - data.quantity,
              status: p.quantity - data.quantity <= 0 ? 'sold_out' : p.status,
            }
          : p
      )
    );
    setShowForm(false);
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
        <div className="flex items-center text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 ml-auto">
          <DollarSign className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">
            Выручка: {totalRevenue.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Дата', 'Товар', 'Артикул', 'Покупатель', 'Кол-во', 'Цена', 'Итого'].map((h) => (
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {sales.length === 0 ? 'Продаж пока нет' : 'Нет продаж за выбранный период'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, idx) => (
                  <tr key={sale.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sale.productName}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {sale.productSku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sale.customer || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sale.price.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {sale.total.toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <SaleForm products={products} onSave={handleSale} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
};

export default Sales;
