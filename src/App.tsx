import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, DollarSign, Package, Settings, TrendingDown, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import Suppliers from './components/Suppliers';

type Tab = 'dashboard' | 'catalog' | 'sales' | 'expenses' | 'suppliers' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Дашборд', icon: LayoutDashboard },
    { id: 'catalog' as Tab, label: '👟 Каталог', icon: ShoppingBag },
    { id: 'sales' as Tab, label: '💰 Продажи', icon: DollarSign },
    { id: 'expenses' as Tab, label: '💸 Расходы', icon: TrendingDown },
    { id: 'suppliers' as Tab, label: '📦 Поставщики', icon: Package },
    { id: 'settings' as Tab, label: '⚙️ Настройки', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'catalog':
        return <Catalog />;
      case 'sales':
        return <Sales />;
      case 'expenses':
        return <Expenses />;
      case 'suppliers':
        return <Suppliers />;
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Настройки</h2>
            <p className="text-gray-600 mb-4">Вы вошли как: {currentUser.email}</p>
            <button
              onClick={() => logout()}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Выйти
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">👟 HQF Sneakers - Учет магазина</h1>
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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
