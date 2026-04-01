import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useViewMode } from './contexts/ViewModeContext';
import Login from './components/Login';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Catalog = lazy(() => import('./components/Catalog'));
const Sales = lazy(() => import('./components/Sales'));
const Expenses = lazy(() => import('./components/Expenses'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const Preorders = lazy(() => import('./components/Preorders'));
const SettingsPage = lazy(() => import('./components/Settings'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const AIAgent = lazy(() => import('./components/AIAgent'));
const Cash = lazy(() => import('./components/Cash'));

type Tab = 'dashboard' | 'catalog' | 'sales' | 'preorders' | 'expenses' | 'suppliers' | 'cash' | 'ai-assistant' | 'ai-agent' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { isMobileView, toggleView } = useViewMode();
  const t = useTheme();

  // PWA Install Banner
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setTimeout(() => setShowInstallBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

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
    { id: 'cash' as Tab, label: 'Касса', icon: '💰' },
    { id: 'suppliers' as Tab, label: 'Поставщики', icon: '🏪' },
    { id: 'settings' as Tab, label: 'Настройки', icon: '⚙️' },
  ];

  const renderContent = () => {
    return (
      <Suspense fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid #E2E8F0',
            borderTop: '3px solid #6366F1',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{
            fontSize: '14px',
            color: '#94A3B8',
            fontWeight: '500'
          }}>
            Загрузка...
          </div>
        </div>
      }>
        {(() => {
          switch (activeTab) {
            case 'dashboard':
              return <Dashboard onNavigate={(tab: string) => setActiveTab(tab as Tab)} />;
            case 'catalog':
              return <Catalog />;
            case 'sales':
              return <Sales />;
            case 'preorders':
              return <Preorders onNavigate={(tab: string) => setActiveTab(tab as Tab)} />;
            case 'ai-assistant':
              return <AIAssistant />;
            case 'ai-agent':
              return <AIAgent />;
            case 'expenses':
              return <Expenses />;
            case 'cash':
              return <Cash />;
            case 'suppliers':
              return <Suppliers />;
            case 'settings':
              return <SettingsPage />;
          }
        })()}
      </Suspense>
    );
  };

  const handleLogout = () => logout();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bgPrimary, overflowX: 'hidden' }}>
      {/* NAVBAR */}
      <div style={{
        backgroundColor: t.bgNavbar,
        borderBottom: `1px solid ${t.borderLight}`,
        boxShadow: t.shadow,
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
            <img
              src="https://i.ibb.co/TxL4dnHM/logo.png"
              alt="HQF Sneakers"
              style={{
                height: '36px',
                width: 'auto',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* NAV LINKS - desktop only */}
          <div style={{
            display: isMobileView ? 'none' : 'flex',
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
                    backgroundColor: isActive ? t.accentBg : 'transparent',
                    color: isActive ? t.accent : t.textSecondary,
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = t.bgHover;
                      e.currentTarget.style.color = t.textPrimary;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = t.textSecondary;
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

          {/* Mobile menu button + View Toggle */}
          <div style={{ marginLeft: 'auto', display: isMobileView ? 'flex' : 'none', alignItems: 'center', gap: '8px' }}>
            {/* VIEW TOGGLE BUTTON */}
            <button
              onClick={toggleView}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: isMobileView ? t.accentBorder : t.border,
                backgroundColor: isMobileView ? t.accentBg : t.bgCard,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                color: isMobileView ? t.accent : t.textSecondary,
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: isMobileView ? '0 2px 8px rgba(99,102,241,0.25)' : 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = t.accentBg;
                e.currentTarget.style.borderColor = t.accentBorder;
                e.currentTarget.style.color = t.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isMobileView ? t.accentBg : t.bgCard;
                e.currentTarget.style.borderColor = isMobileView ? t.accentBorder : t.border;
                e.currentTarget.style.color = isMobileView ? t.accent : t.textSecondary;
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {isMobileView ? '🖥️' : '📱'}
              </span>
              {isMobileView ? 'ПК' : 'Моб.'}
            </button>

            {/* HAMBURGER — existing */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: t.bgHover,
                border: `1px solid ${t.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                color: t.textSecondary
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* RIGHT SIDE - desktop only */}
          <div style={{
            display: isMobileView ? 'none' : 'flex',
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
                backgroundColor: t.bgHover,
                border: `1px solid ${t.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = t.accentBg;
                e.currentTarget.style.borderColor = t.accentBorder;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = t.bgHover;
                e.currentTarget.style.borderColor = t.border;
              }}
            >
              🔔
            </div>

            {/* PC/MOBILE TOGGLE */}
            <button
              onClick={toggleView}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: isMobileView ? t.accentBorder : t.border,
                backgroundColor: isMobileView ? t.accentBg : t.bgCard,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                color: isMobileView ? t.accent : t.textSecondary,
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: isMobileView ? '0 2px 8px rgba(99,102,241,0.25)' : 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = t.accentBg;
                e.currentTarget.style.borderColor = t.accentBorder;
                e.currentTarget.style.color = t.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isMobileView ? t.accentBg : t.bgCard;
                e.currentTarget.style.borderColor = isMobileView ? t.accentBorder : t.border;
                e.currentTarget.style.color = isMobileView ? t.accent : t.textSecondary;
              }}
              title="Переключить вид"
            >
              <span style={{ fontSize: '16px' }}>
                {isMobileView ? '🖥️' : '📱'}
              </span>
              {isMobileView ? 'ПК' : 'Моб.'}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                border: `1.5px solid ${t.border}`,
                backgroundColor: t.bgCard,
                color: t.textSecondary,
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = t.dangerBg;
                e.currentTarget.style.borderColor = t.dangerBorder;
                e.currentTarget.style.color = t.danger;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = t.bgCard;
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.color = t.textSecondary;
              }}
            >
              <span>🚪</span>
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && isMobileView && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 101
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {isMobileView && (
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: '256px',
          backgroundColor: t.bgSidebar,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 102
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: `1px solid ${t.borderLight}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="https://i.ibb.co/TxL4dnHM/logo.png"
              alt="HQF Sneakers"
              style={{
                height: '28px',
                width: 'auto',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: t.textMuted
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
                  backgroundColor: isActive ? t.accentBg : 'transparent',
                  color: isActive ? t.accent : t.textSecondary,
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  borderRight: isActive ? `3px solid ${t.accent}` : '3px solid transparent',
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
              backgroundColor: t.dangerBg,
              color: t.danger,
              border: `1px solid ${t.dangerBorder}`,
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
      )}

      {/* Main Content */}
      <main style={{ overflowX: 'hidden' }}>
        <div style={{
          minWidth: isMobileView ? 'auto' : '1280px',
          overflowX: isMobileView ? 'hidden' : 'visible',
          width: '100%'
        }}>
          <div style={{
            maxWidth: isMobileView ? '100%' : '1400px',
            margin: '0 auto',
            padding: isMobileView ? '0' : '0 24px',
            width: '100%'
          }}>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* PWA INSTALL BANNER */}
      {showInstallBanner && !isInstalled && (
        <div style={{
          position: 'fixed',
          bottom: isMobileView ? '80px' : '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          backgroundColor: '#1A1D27',
          border: '1px solid #6366F1',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          maxWidth: '380px',
          width: 'calc(100% - 32px)',
          animation: 'slideUp 0.4s ease',
        }}>
          <img
            src="https://i.ibb.co/TxL4dnHM/logo.png"
            alt="HQF"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              objectFit: 'contain',
              flexShrink: 0,
              backgroundColor: '#6366F1',
              padding: '4px',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '800',
              color: '#F0F4FF',
              marginBottom: '3px',
            }}>
              Установить приложение
            </div>
            <div style={{
              fontSize: '12px',
              color: '#8B92B8',
              lineHeight: 1.4,
            }}>
              Добавь HQF Sneakers на экран телефона
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexShrink: 0
          }}>
            <button
              onClick={() => setShowInstallBanner(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #2D3250',
                backgroundColor: 'transparent',
                color: '#8B92B8',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
            <button
              onClick={handleInstall}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: 'white',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              }}
            >
              Установить
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} isMobileView={isMobileView} />
    </div>
  );
}

function MobileBottomNav({ activeTab, setActiveTab, isMobileView }: { activeTab: Tab; setActiveTab: (t: Tab) => void; isMobileView: boolean }) {
  const t = useTheme();
  const items: { id: Tab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '📊', label: 'Дашборд' },
    { id: 'catalog', icon: '👟', label: 'Каталог' },
    { id: 'sales', icon: '🛍️', label: 'Продажи' },
    { id: 'preorders', icon: '📋', label: 'Заказы' },
    { id: 'cash', icon: '💰', label: 'Касса' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '68px',
      backgroundColor: t.bgMobileNav,
      borderTop: `1px solid ${t.borderLight}`,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      zIndex: 1000,
      display: isMobileView ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 4px',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {items.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 0',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              flex: 1,
              position: 'relative',
              transition: 'all 0.15s'
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32px',
                height: '3px',
                borderRadius: '0 0 4px 4px',
                background: 'linear-gradient(90deg,#6366F1,#8B5CF6)'
              }} />
            )}
            <span style={{ fontSize: '22px', lineHeight: 1 }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? '700' : '500',
              color: isActive ? t.accent : t.textMuted,
              whiteSpace: 'nowrap'
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
