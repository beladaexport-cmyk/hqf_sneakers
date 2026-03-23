import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, DollarSign, Package, Settings, TrendingDown, LogOut, ShoppingCart, Menu, X, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import Suppliers from './components/Suppliers';
import Preorders from './components/Preorders';
import SettingsPage from './components/Settings';
import AIAssistant from './components/AIAssistant';
import AIAgent from './components/AIAgent';

type Tab = 'dashboard' | 'catalog' | 'sales' | 'preorders' | 'expenses' | 'suppliers' | 'ai-assistant' | 'ai-agent' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Дашборд', icon: LayoutDashboard },
    { id: 'catalog' as Tab, label: '👟 Каталог', icon: ShoppingBag },
    { id: 'sales' as Tab, label: '💰 Продажи', icon: DollarSign },
    { id: 'preorders' as Tab, label: '🛒 Предзаказы', icon: ShoppingCart },
    { id: 'ai-assistant' as Tab, label: '🤖 AI-Помощник', icon: Sparkles },
    { id: 'ai-agent' as Tab, label: '🧠 AI-Агент', icon: Sparkles },
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
      case 'preorders':
        return <Preorders />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'ai-agent':
        return <AIAgent />;
      case 'expenses':
        return <Expenses />;
      case 'suppliers':
        return <Suppliers />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Burger button - mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">👟 HQF Sneakers</h1>
          </div>
          <button
            onClick={() => logout()}
            className="text-gray-600 hover:text-gray-900 flex items-center transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <span className="font-bold text-gray-900">👟 HQF Sneakers</span>
          <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-3" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b shadow-sm">
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

      {/* Mobile tab label */}
      <div className="md:hidden bg-white border-b px-4 py-2">
        <span className="text-sm font-medium text-gray-700">
          {tabs.find((t) => t.id === activeTab)?.label}
        </span>
      </div>

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
