import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ViewModeContextType {
  isMobileView: boolean;
  toggleView: () => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  isMobileView: true,
  toggleView: () => {},
});

export const ViewModeProvider = ({ children }: { children: ReactNode }) => {
  const [isMobileView, setIsMobileView] = useState(() => {
    const saved = localStorage.getItem('hqf_view');
    if (saved) return saved === 'mobile';
    return window.innerWidth <= 768;
  });

  const [toast, setToast] = useState('');

  useEffect(() => {
    document.body.className = isMobileView ? 'mobile-view' : 'desktop-view';
  }, [isMobileView]);

  const toggleView = () => {
    setIsMobileView(prev => {
      const next = !prev;
      localStorage.setItem('hqf_view', next ? 'mobile' : 'desktop');
      setToast(next ? '📱 Мобильная версия' : '🖥️ ПК версия');
      setTimeout(() => setToast(''), 2000);
      return next;
    });
  };

  return (
    <ViewModeContext.Provider value={{ isMobileView, toggleView }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '72px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          color: 'white',
          padding: '10px 24px',
          borderRadius: '30px',
          fontSize: '14px',
          fontWeight: '700',
          zIndex: 99999,
          boxShadow: '0 6px 24px rgba(99,102,241,0.45)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);

export default ViewModeContext;
