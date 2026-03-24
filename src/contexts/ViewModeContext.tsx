import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ViewModeContextType {
  viewMode: string;
  toggleView: () => void;
  isDesktopMode: boolean;
  isMobileMode: boolean;
  isMobileDevice: boolean;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: 'mobile',
  toggleView: () => {},
  isDesktopMode: false,
  isMobileMode: true,
  isMobileDevice: true
});

export const ViewModeProvider = ({ children }: { children: ReactNode }) => {
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('hqf_view_mode');
    if (saved) return saved;
    return window.innerWidth > 768 ? 'desktop' : 'mobile';
  });

  const [isMobileDevice, setIsMobileDevice] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const check = () => {
      setIsMobileDevice(window.innerWidth <= 768);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (viewMode === 'desktop') {
      document.documentElement.style.minWidth = '1200px';
      document.documentElement.style.overflowX = 'auto';
      document.body.style.minWidth = '1200px';
    } else {
      document.documentElement.style.minWidth = '';
      document.documentElement.style.overflowX = '';
      document.body.style.minWidth = '';
    }
  }, [viewMode]);

  // Body class switching
  useEffect(() => {
    if (viewMode === 'desktop') {
      document.body.classList.add('desktop-mode');
      document.body.classList.remove('mobile-mode');
    } else {
      document.body.classList.add('mobile-mode');
      document.body.classList.remove('desktop-mode');
    }
  }, [viewMode]);

  const toggleView = () => {
    const next = viewMode === 'mobile' ? 'desktop' : 'mobile';
    setViewMode(next);
    localStorage.setItem('hqf_view_mode', next);

    // Show toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: ${
        next === 'desktop'
          ? 'linear-gradient(135deg,#6366F1,#8B5CF6)'
          : 'linear-gradient(135deg,#10B981,#34D399)'
      };
      color: white;
      padding: 12px 24px;
      border-radius: 40px;
      font-size: 14px;
      font-weight: 700;
      z-index: 99999;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      white-space: nowrap;
      transition: all 0.3s;
      opacity: 1;
    `;
    toast.textContent =
      next === 'desktop'
        ? '🖥️ Переключено на ПК версию'
        : '📱 Переключено на мобильную версию';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        toggleView,
        isDesktopMode: viewMode === 'desktop',
        isMobileMode: viewMode === 'mobile',
        isMobileDevice
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);

export default ViewModeContext;
