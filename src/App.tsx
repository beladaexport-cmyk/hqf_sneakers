import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, DollarSign, Package, Settings, TrendingDown, LogOut, Database, Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useFirestore } from './hooks/useFirestore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import Suppliers from './components/Suppliers';
import { Product, Sale, Expense, Supplier } from './types';

type Tab = 'dashboard' | 'catalog' | 'sales' | 'expenses' | 'suppliers' | 'settings';

function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const { data: products } = useFirestore<Product>('products');
  const { data: sales } = useFirestore<Sale>('sales');
  const { data: expenses } = useFirestore<Expense>('expenses');
  const { data: suppliers } = useFirestore<Supplier>('suppliers');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Настройки</h2>

      {/* Account */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Аккаунт</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{currentUser?.email}</span>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Выйти из аккаунта
          </button>
        </div>
      </div>

      {/* Database stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Статистика базы данных</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            <p className="text-xs text-gray-500 mt-1">Товаров</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
            <p className="text-xs text-gray-500 mt-1">Продаж</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
            <p className="text-xs text-gray-500 mt-1">Расходов</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            <p className="text-xs text-gray-500 mt-1">Поставщиков</p>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">О приложении</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between"><span>Приложение</span><span className="font-medium text-gray-900">HQF Sneakers</span></div>
          <div className="flex justify-between"><span>Версия</span><span className="font-medium text-gray-900">2.0.0</span></div>
          <div className="flex justify-between"><span>Платформа</span><span className="font-medium text-gray-900">React + Firebase + Netlify</span></div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Дашборд', icon: LayoutDashboard },
    { id: 'catalog' as Tab, label: 'Каталог', icon: ShoppingBag },
    { id: 'sales' as Tab, label: 'Продажи', icon: DollarSign },
    { id: 'expenses' as Tab, label: 'Расходы', icon: TrendingDown },
    { id: 'suppliers' as Tab, label: 'Поставщики', icon: Package },
    { id: 'settings' as Tab, label: 'Настройки', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'catalog': return <Catalog />;
      case 'sales': return <Sales />;
      case 'expenses': return <Expenses />;
      case 'suppliers': return <Suppliers />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">HQF Sneakers - Учет магазина</h1>
          <button
            onClick={() => logout()}
            className="text-gray-600 hover:text-gray-900 flex items-center transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Выйти
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
