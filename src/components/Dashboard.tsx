import React from 'react';
import { TrendingUp, Package, AlertCircle, DollarSign } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Product, Sale } from '../types';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
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
  const [products] = useLocalStorage<Product[]>('hqf_products', []);
  const [sales] = useLocalStorage<Sale[]>('hqf_sales', []);

  const totalProducts = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter((p) => p.quantity <= p.minStock);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date.startsWith(today));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  const recentSales = [...sales].reverse().slice(0, 10);

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
          value={`${todayRevenue.toLocaleString('ru-RU')} ₽`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Всего продаж"
          value={sales.length.toString()}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Товары заканчиваются"
          value={lowStock.length.toString()}
          icon={AlertCircle}
          color="red"
        />
      </div>

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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSales.map((sale, idx) => (
                  <tr key={sale.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sale.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sale.customer || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sale.quantity}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {sale.total.toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
