import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, DollarSign, Package, Settings, TrendingDown, LogOut, Menu, X, PackageCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import Suppliers from './components/Suppliers';
import Preorders from './components/Preorders';

type Tab = 'dashboard' | 'catalog' | 'sales' | 'expenses' | 'suppliers' | 'preorders' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; color: string }[] = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, color: 'text-blue-600' },
    { id: 'catalog', label: 'Каталог', icon: ShoppingBag, color: 'text-indigo-600' },
    { id: 'sales', label: 'Продажи', icon: DollarSign, color: 'text-green-600' },
    { id: 'preorders', label: 'Предзаказы', icon: PackageCheck, color: 'text-amber-600' },
    { id: 'expenses', label: 'Расходы', icon: TrendingDown, color: 'text-red-600' },
    { id: 'suppliers', label: 'Поставщики', icon: Package, color: 'text-purple-600' },
    { id: 'settings', label: 'Настройки', icon: Settings, color: 'text-gray-600' },
  ];

  const handleTabClick = (id: Tab) => {
    setActiveTab(id);
    setMenuOpen(false);
  };

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
      case 'expenses':
        return <Expenses />;
      case 'suppliers':
        return <Suppliers />;
      case 'settings':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Настройки</h2>
            <p className="text-gray-500 mb-6">Вы вошли как: <span className="font-medium text-gray-700">{currentUser.email}</span></p>
            <button
              onClick={() => logout()}
              className="flex items-center px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Выйти
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">👟</span>
            <span className="hidden sm:inline">HQF Sneakers</span>
            <span className="sm:hidden">HQF</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="hidden sm:flex items-center text-gray-300 hover:text-white transition-colors text-sm gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
            {/* Burger menu button - mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-2xl animate-slideDown" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Меню</span>
                <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Выйти
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? `border-blue-500 ${tab.color}`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
        <div className="flex justify-around items-center py-1">
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-1.5 px-2 min-w-0 transition-colors ${
                  isActive ? tab.color : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 truncate max-w-[60px]">{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center py-1.5 px-2 text-gray-400"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Ещё</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
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
