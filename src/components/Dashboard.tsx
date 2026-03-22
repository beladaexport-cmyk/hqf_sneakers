import React from 'react';
import { TrendingUp, Package, AlertCircle, DollarSign, TrendingDown, XCircle, Clock } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Sale, Expense } from '../types';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { data: products, loading: loadingProducts } = useFirestore<Product>('products');
  const { data: sales, loading: loadingSales } = useFirestore<Sale>('sales');
  const { data: expenses, loading: loadingExpenses } = useFirestore<Expense>('expenses');

  if (loadingProducts || loadingSales || loadingExpenses) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка данных...</div>
      </div>
    );
  }

  const totalProducts = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter((p) => p.quantity <= p.minStock);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date.startsWith(today) && (s.status ?? 'completed') === 'completed');
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthSales = sales.filter((s) => s.date.startsWith(currentMonth) && (s.status ?? 'completed') === 'completed');
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const monthCogs = monthSales.reduce((sum, s) => sum + (s.purchasePrice ?? 0) * s.quantity, 0);
  const grossProfit = monthSales.reduce((sum, s) => sum + (s.profit ?? 0), 0);

  const monthAllSales = sales.filter((s) => s.date.startsWith(currentMonth));
  const monthCancelledSales = monthAllSales.filter((s) => s.status === 'cancelled');
  const cancellationRate = monthAllSales.length > 0
    ? Math.round((monthCancelledSales.length / monthAllSales.length) * 100)
    : 0;

  // Top cancellation reasons
  const reasonCounts: Record<string, number> = {};
  monthCancelledSales.forEach((s) => {
    if (s.cancellationReason) {
      reasonCounts[s.cancellationReason] = (reasonCounts[s.cancellationReason] ?? 0) + 1;
    }
  });
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthAdvertising = expenses
    .filter((e) => e.date.startsWith(currentMonth) && e.type === 'advertising')
    .reduce((sum, e) => sum + e.amount, 0);
  const monthDelivery = expenses
    .filter((e) => e.date.startsWith(currentMonth) && e.type === 'delivery')
    .reduce((sum, e) => sum + e.amount, 0);
  const monthOther = expenses
    .filter((e) => e.date.startsWith(currentMonth) && e.type === 'other')
    .reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - monthExpenses;

  const recentSales = [...sales].reverse().slice(0, 10);

  const preorderProducts = products.filter((p) => p.status === 'preorder');
  const preorderSales = sales.filter(
    (s) => (s.status ?? 'completed') === 'pending' && preorderProducts.some((p) => p.id === s.productId)
  );
  const preorderSalesTotal = preorderSales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Товаров на складе"
          value={totalProducts.toString()}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Выручка сегодня"
          value={`${todayRevenue.toLocaleString('ru-RU')} Br`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Расходы за месяц"
          value={`${monthExpenses.toLocaleString('ru-RU')} Br`}
          icon={TrendingDown}
          color="orange"
        />
        <StatCard
          title="Чистая прибыль за месяц"
          value={`${netProfit.toLocaleString('ru-RU')} Br`}
          icon={TrendingUp}
          color={netProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Cancelled Sales Card */}
      {monthCancelledSales.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                Отменённые продажи за месяц: {monthCancelledSales.length} ({cancellationRate}%)
              </h3>
              {topReasons.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-700 font-medium">Топ причин отказов:</p>
                  <ul className="mt-1 space-y-0.5">
                    {topReasons.map(([reason, count]) => (
                      <li key={reason} className="text-sm text-red-600">
                        {count}× — {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pre-orders in Transit */}
      {preorderProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">
                В предзаказе: {preorderProducts.length} товар(ов)
                {preorderSales.length > 0 && (
                  <span className="text-sm font-normal text-yellow-700 ml-2">
                    ({preorderSales.length} продаж на {preorderSalesTotal.toLocaleString('ru-RU')} Br)
                  </span>
                )}
              </h3>
              <div className="mt-2 space-y-2">
                {preorderProducts.map((p) => {
                  const daysLeft = p.expectedDate
                    ? Math.ceil((new Date(p.expectedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isOverdue = daysLeft !== null && daysLeft < 0;
                  const salesForProduct = preorderSales.filter((s) => s.productId === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm p-2 rounded-lg ${
                        isOverdue ? 'bg-red-100 border border-red-200' : 'bg-white border border-yellow-100'
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {p.brand} {p.model}
                        </span>
                        <span className="text-gray-500 ml-1">р.{p.size}</span>
                        {p.preorderCustomer && (
                          <span className="text-yellow-700 ml-2">— {p.preorderCustomer}</span>
                        )}
                        {salesForProduct.length > 0 && (
                          <span className="text-blue-600 ml-2">
                            ({salesForProduct.length} продаж)
                          </span>
                        )}
                        {p.preorderNotes && (
                          <p className="text-xs text-gray-400 mt-0.5">{p.preorderNotes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {p.expectedDate ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              isOverdue
                                ? 'bg-red-200 text-red-800'
                                : daysLeft !== null && daysLeft <= 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {isOverdue
                              ? `Просрочено на ${Math.abs(daysLeft!)} дн.`
                              : daysLeft === 0
                              ? 'Сегодня'
                              : `Через ${daysLeft} дн. (${new Date(p.expectedDate).toLocaleDateString('ru-RU')})`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Дата не указана</span>
                        )}
                        <span className="text-xs font-mono text-gray-500">{p.retailPrice.toLocaleString('ru-RU')} Br</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Товары с низким остатком!</h3>
              <ul className="mt-2 space-y-1">
                {lowStock.map((p) => (
                  <li key={p.id} className="text-sm text-red-700">
                    {p.brand} {p.model} (размер {p.size}) — осталось {p.quantity} шт.
                    (мин. {p.minStock})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Detail */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Детализация за месяц</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Выручка:</span>
            <span className="font-medium">{monthRevenue.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Себестоимость проданных товаров:</span>
            <span className="font-medium text-red-600">{monthCogs.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Валовая прибыль:</span>
            <span className="font-medium text-green-600">{grossProfit.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Расходы:</span>
            <span className="font-medium text-orange-600">{monthExpenses.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="pl-4 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>📢 Реклама</span>
              <span>{monthAdvertising.toLocaleString('ru-RU')} Br</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>🚚 Доставка</span>
              <span>{monthDelivery.toLocaleString('ru-RU')} Br</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>📝 Другое</span>
              <span>{monthOther.toLocaleString('ru-RU')} Br</span>
            </div>
          </div>
          <div className="flex justify-between text-sm border-t pt-2 mt-2">
            <span className="font-bold text-gray-900">Чистая прибыль:</span>
            <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netProfit.toLocaleString('ru-RU')} Br
            </span>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние 10 продаж</h2>
        {recentSales.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Продаж пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Покупатель
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Кол-во
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
               {recentSales.map((sale, idx) => {
                    const isCancelled = sale.status === 'cancelled';
                    return (
                    <tr key={sale.id} className={isCancelled ? 'bg-red-50 opacity-70' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(sale.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className={`px-4 py-3 text-sm text-gray-900 ${isCancelled ? 'line-through' : ''}`}>{sale.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sale.customer || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sale.quantity}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${isCancelled ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                        {sale.total.toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Отменена</span>
                        ) : sale.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">В процессе</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Завершена</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
