import React from 'react';
import { TrendingUp, Package, AlertCircle, DollarSign, TrendingDown, XCircle, ShoppingCart } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Sale, Expense } from '../types';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  color: 'indigo' | 'emerald' | 'purple' | 'red' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses: Record<string, { bg: string; icon: string }> = {
    indigo: { bg: 'bg-indigo-50 border-indigo-100', icon: 'bg-indigo-600' },
    emerald: { bg: 'bg-emerald-50 border-emerald-100', icon: 'bg-emerald-600' },
    purple: { bg: 'bg-purple-50 border-purple-100', icon: 'bg-purple-600' },
    red: { bg: 'bg-red-50 border-red-100', icon: 'bg-red-500' },
    amber: { bg: 'bg-amber-50 border-amber-100', icon: 'bg-amber-600' },
  };
  const c = colorClasses[color];

  return (
    <div className={`rounded-xl border p-5 ${c.bg}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1.5 text-gray-900">{value}</p>
        </div>
        <div className={`${c.icon} p-3 rounded-xl`}>
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
        <div className="text-gray-400 font-medium">Загрузка...</div>
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

  // Preorder stats
  const preorderProducts = products.filter((p) => p.status === 'preorder');
  const allPreorders = sales.filter((s) => s.isPreorder);
  const pendingPreorders = allPreorders.filter((s) => s.status === 'pending');
  const preorderRevenue = pendingPreorders.reduce((sum, s) => sum + s.total, 0);

  const reasonCounts: Record<string, number> = {};
  monthCancelledSales.forEach((s) => {
    if (s.cancellationReason) {
      reasonCounts[s.cancellationReason] = (reasonCounts[s.cancellationReason] ?? 0) + 1;
    }
  });
  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0);
  const monthAdvertising = expenses.filter((e) => e.date.startsWith(currentMonth) && e.type === 'advertising').reduce((sum, e) => sum + e.amount, 0);
  const monthDelivery = expenses.filter((e) => e.date.startsWith(currentMonth) && e.type === 'delivery').reduce((sum, e) => sum + e.amount, 0);
  const monthOther = expenses.filter((e) => e.date.startsWith(currentMonth) && e.type === 'other').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - monthExpenses;

  const recentSales = [...sales].reverse().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Товаров на складе" value={totalProducts.toString()} icon={Package} color="indigo" />
        <StatCard title="Выручка сегодня" value={`${todayRevenue.toLocaleString('ru-RU')} Br`} icon={DollarSign} color="emerald" />
        <StatCard title="Расходы за месяц" value={`${monthExpenses.toLocaleString('ru-RU')} Br`} icon={TrendingDown} color="amber" />
        <StatCard title="Чистая прибыль" value={`${netProfit.toLocaleString('ru-RU')} Br`} icon={TrendingUp} color={netProfit >= 0 ? 'emerald' : 'red'} />
      </div>

      {/* Preorder Stats */}
      {(preorderProducts.length > 0 || allPreorders.length > 0) && (
        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="bg-amber-600 p-2.5 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Предзаказы</h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 font-medium">Моделей в предзаказе</div>
                  <div className="text-xl font-bold text-amber-700">{preorderProducts.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Всего предзаказов</div>
                  <div className="text-xl font-bold text-amber-700">{allPreorders.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Ожидают выполнения</div>
                  <div className="text-xl font-bold text-amber-700">{pendingPreorders.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Сумма ожидающих</div>
                  <div className="text-xl font-bold text-amber-700">{preorderRevenue.toLocaleString('ru-RU')} Br</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Sales Card */}
      {monthCancelledSales.length > 0 && (
        <div className="bg-red-50/60 border border-red-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 text-sm">
                Отменённые: {monthCancelledSales.length} ({cancellationRate}%)
              </h3>
              {topReasons.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Топ причин:</p>
                  <ul className="mt-1.5 space-y-1">
                    {topReasons.map(([reason, count]) => (
                      <li key={reason} className="text-sm text-red-600 flex items-center gap-2">
                        <span className="text-xs font-bold bg-red-100 px-1.5 py-0.5 rounded">{count}x</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50/60 border border-red-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-800 text-sm">Низкий остаток</h3>
              <ul className="mt-2 space-y-1.5">
                {lowStock.map((p) => (
                  <li key={p.id} className="text-sm text-red-700">
                    {p.brand} {p.model} (EU {p.size}{p.sizeCM ? ` / ${p.sizeCM}см` : ''}) — <span className="font-bold">{p.quantity} шт.</span> (мин. {p.minStock})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Detail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Детализация за месяц</h2>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Выручка</span>
            <span className="font-semibold text-gray-900">{monthRevenue.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Себестоимость</span>
            <span className="font-semibold text-red-600">{monthCogs.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Валовая прибыль</span>
            <span className="font-semibold text-emerald-600">{grossProfit.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Расходы</span>
            <span className="font-semibold text-amber-600">{monthExpenses.toLocaleString('ru-RU')} Br</span>
          </div>
          <div className="pl-4 space-y-1.5 py-1">
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
          <div className="flex justify-between text-sm border-t border-gray-100 pt-3 mt-3">
            <span className="font-bold text-gray-900">Чистая прибыль</span>
            <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netProfit.toLocaleString('ru-RU')} Br
            </span>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Последние 10 продаж</h2>
        {recentSales.length === 0 ? (
          <p className="text-gray-400 text-center py-10 text-sm">Продаж пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/50">
                  {['Дата', 'Товар', 'Покупатель', 'Кол-во', 'Сумма', 'Статус'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.map((sale) => {
                  const isCancelled = sale.status === 'cancelled';
                  return (
                    <tr key={sale.id} className={`hover:bg-gray-50/50 transition-colors ${isCancelled ? 'bg-red-50/30 opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(sale.date).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm text-gray-900 ${isCancelled ? 'line-through' : ''}`}>{sale.productName}</span>
                        {sale.isPreorder && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            Предзаказ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{sale.customer || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sale.quantity}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {sale.total.toLocaleString('ru-RU')} Br
                      </td>
                      <td className="px-4 py-3">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">Отменена</span>
                        ) : sale.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">В процессе</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Завершена</span>
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
