import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, DollarSign, Package, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Sales from './components/Sales';
import Suppliers from './components/Suppliers';

type Tab = 'dashboard' | 'catalog' | 'sales' | 'suppliers' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Дашборд', icon: LayoutDashboard },
    { id: 'catalog' as Tab, label: '👟 Каталог', icon: ShoppingBag },
    { id: 'sales' as Tab, label: '💰 Продажи', icon: DollarSign },
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
      case 'suppliers':
        return <Suppliers />;
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-500">Настройки в разработке</h2>
            <p className="text-gray-400 mt-2">Этот раздел будет доступен в следующей версии.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">👟 HQF Sneakers - Учет магазина</h1>
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

export default App;
