import { useState } from 'react';
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

  const navItems = [
    { id: 'dashboard' as Tab, label: 'Дашборд', icon: '📊' },
    { id: 'catalog' as Tab, label: 'Каталог', icon: '👟' },
    { id: 'sales' as Tab, label: 'Продажи', icon: '🛍️' },
    { id: 'preorders' as Tab, label: 'Предзаказы', icon: '📋' },
    { id: 'ai-assistant' as Tab, label: 'AI-Помощник', icon: '🤖' },
    { id: 'ai-agent' as Tab, label: 'AI-Агент', icon: '⚡' },
    { id: 'expenses' as Tab, label: 'Расходы', icon: '💸' },
    { id: 'suppliers' as Tab, label: 'Поставщики', icon: '🏪' },
    { id: 'settings' as Tab, label: 'Настройки', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab: string) => setActiveTab(tab as Tab)} />;
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

  const handleLogout = () => logout();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9' }}>
      {/* NAVBAR */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #F1F5F9',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          height: '64px',
          gap: '8px'
        }}>

          {/* LOGO */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginRight: '24px',
            flexShrink: 0
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 10px rgba(99,102,241,0.4)'
            }}>
              👟
            </div>
            <span style={{
              fontSize: '17px',
              fontWeight: '800',
              color: '#0F172A',
              letterSpacing: '-0.3px'
            }}>
              HQF Sneakers
            </span>
          </div>

          {/* NAV LINKS - desktop only */}
          <div className="hidden md:flex" style={{
            alignItems: 'center',
            gap: '2px',
            flex: 1
          }}>
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                    color: isActive ? '#6366F1' : '#64748B',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#F8FAFC';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#64748B';
                    }
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '20px',
                      height: '3px',
                      borderRadius: '2px 2px 0 0',
                      background: 'linear-gradient(90deg,#6366F1,#8B5CF6)'
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden" style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* RIGHT SIDE - desktop only */}
          <div className="hidden md:flex" style={{
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0
          }}>
            {/* Notification bell */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#EEF2FF';
                e.currentTarget.style.borderColor = '#C7D2FE';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              🔔
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                border: '1.5px solid #E2E8F0',
                backgroundColor: 'white',
                color: '#64748B',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
                e.currentTarget.style.borderColor = '#FECACA';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              <span>🚪</span>
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden"
          style={{ zIndex: 101 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ zIndex: 102 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              👟
            </div>
            <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '15px' }}>HQF Sneakers</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#94A3B8'
            }}
          >
            ✕
          </button>
        </div>
        <nav style={{ padding: '8px 0' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  border: 'none',
                  backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                  color: isActive ? '#6366F1' : '#64748B',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  borderRight: isActive ? '3px solid #6366F1' : '3px solid transparent',
                  textAlign: 'left',
                  gap: '10px',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <span>🚪</span>
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main>
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
