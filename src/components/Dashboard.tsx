import React from 'react';
import { TrendingUp, Package, AlertCircle, DollarSign, TrendingDown, XCircle, ShoppingBag, Percent } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Sale, Expense } from '../types';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'indigo';
  subtitle?: string;
}

const gradients: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-emerald-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600',
  orange: 'from-orange-500 to-amber-600',
  indigo: 'from-indigo-500 to-indigo-600',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`bg-gradient-to-br ${gradients[color]} p-3 rounded-xl shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
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
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalProducts = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter((p) => p.quantity <= p.minStock);
  const preorderCount = products.filter((p) => p.status === 'preorder').length;

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
  const cancelledCount = monthCancelledSales.length;
  const cancellationRate = monthAllSales.length > 0
    ? Math.round((monthCancelledSales.length / monthAllSales.length) * 100)
    : 0;

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
  const marginPercent = monthRevenue > 0 ? Math.round((netProfit / monthRevenue) * 100) : 0;

  const recentSales = [...sales].reverse().slice(0, 10);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="На складе"
          value={totalProducts.toString()}
          icon={Package}
          color="blue"
          subtitle={`${products.length} позиций`}
        />
        <StatCard
          title="Выручка сегодня"
          value={`${todayRevenue.toLocaleString('ru-RU')} Br`}
          icon={DollarSign}
          color="green"
          subtitle={`${todaySales.length} продаж`}
        />
        <StatCard
          title="Расходы за месяц"
          value={`${monthExpenses.toLocaleString('ru-RU')} Br`}
          icon={TrendingDown}
          color="orange"
        />
        <StatCard
          title="Чистая прибыль"
          value={`${netProfit.toLocaleString('ru-RU')} Br`}
          icon={TrendingUp}
          color={netProfit >= 0 ? 'green' : 'red'}
          subtitle={marginPercent !== 0 ? `Маржа ${marginPercent}%` : undefined}
        />
      </div>

      {/* Quick stats row */}
      {(preorderCount > 0 || monthSales.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {preorderCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Предзаказы</p>
                <p className="text-lg font-bold text-amber-900">{preorderCount}</p>
              </div>
            </div>
          )}
          {monthSales.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Продаж за месяц</p>
                <p className="text-lg font-bold text-blue-900">{monthSales.length}</p>
              </div>
            </div>
          )}
          {cancelledCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Отменено</p>
                <p className="text-lg font-bold text-red-900">{monthCancelledSales.length} ({cancellationRate}%)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancelled Sales Detail */}
      {topReasons.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Топ причин отказов за месяц</h3>
              <ul className="mt-2 space-y-1">
                {topReasons.map(([reason, count]) => (
                  <li key={reason} className="text-sm text-red-600 flex items-center gap-2">
                    <span className="bg-red-200 text-red-800 text-xs font-bold px-1.5 py-0.5 rounded">{count}x</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Товары с низким остатком</h3>
              <ul className="mt-2 space-y-1">
                {lowStock.map((p) => (
                  <li key={p.id} className="text-sm text-red-700 flex items-center gap-2">
                    <span className="bg-red-200 text-red-800 text-xs font-bold px-1.5 py-0.5 rounded">{p.quantity}</span>
                    {p.brand} {p.model} ({p.size}) — мин. {p.minStock}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Detail */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Детализация за месяц</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Выручка</span>
            <span className="font-semibold text-gray-900">{monthRevenue.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Себестоимость</span>
            <span className="font-semibold text-red-600">-{monthCogs.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Валовая прибыль</span>
            <span className="font-semibold text-green-600">{grossProfit.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-500">Расходы</span>
              <span className="font-semibold text-orange-600">-{monthExpenses.toLocaleString('ru-RU')} Br</span>
            </div>
            <div className="pl-4 space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Реклама</span>
                <span>{monthAdvertising.toLocaleString('ru-RU')} Br</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Доставка</span>
                <span>{monthDelivery.toLocaleString('ru-RU')} Br</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Другое</span>
                <span>{monthOther.toLocaleString('ru-RU')} Br</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-3">
            <span className="font-bold text-gray-900">Чистая прибыль</span>
            <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netProfit.toLocaleString('ru-RU')} Br
            </span>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Последние 10 продаж</h2>
        {recentSales.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Продаж пока нет</p>
        ) : (
          <>
            {/* Mobile cards for recent sales */}
            <div className="mobile-card space-y-2">
              {recentSales.map((sale) => {
                const isCancelled = sale.status === 'cancelled';
                return (
                  <div key={sale.id} className={`rounded-xl p-3 ${isCancelled ? 'bg-red-50/50 opacity-70' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-sm text-gray-900 truncate ${isCancelled ? 'line-through' : ''}`}>{sale.productName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(sale.date).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className={`font-bold text-sm ${isCancelled ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                          {sale.total.toLocaleString('ru-RU')} Br
                        </p>
                        {isCancelled ? (
                          <span className="text-xs text-red-500">Отменена</span>
                        ) : sale.status === 'pending' ? (
                          <span className="text-xs text-yellow-600">В процессе</span>
                        ) : (
                          <span className="text-xs text-green-500">Завершена</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table for recent sales */}
            <div className="desktop-table overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Товар</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Покупатель</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Кол-во</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSales.map((sale) => {
                    const isCancelled = sale.status === 'cancelled';
                    return (
                      <tr key={sale.id} className={`transition-colors ${isCancelled ? 'bg-red-50/50 opacity-70' : 'hover:bg-gray-50/80'}`}>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(sale.date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className={`px-4 py-3 text-sm text-gray-900 ${isCancelled ? 'line-through' : ''}`}>{sale.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.customer || '—'}</td>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
