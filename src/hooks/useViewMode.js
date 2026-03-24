import { useState, useEffect } from 'react';

export const useViewMode = () => {
  const [viewMode, setViewMode] = useState(
    () => {
      const saved = localStorage.getItem('hqf_view_mode');
      if (saved) return saved;
      return window.innerWidth > 768 ? 'desktop' : 'mobile';
    }
  );

  const [isMobileDevice, setIsMobileDevice] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const check = () => {
      setIsMobileDevice(window.innerWidth <= 768);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleView = () => {
    const next = viewMode === 'mobile' ? 'desktop' : 'mobile';
    setViewMode(next);
    localStorage.setItem('hqf_view_mode', next);

    if (next === 'desktop') {
      document.documentElement.style.minWidth = '1200px';
      document.documentElement.style.overflowX = 'auto';
    } else {
      document.documentElement.style.minWidth = '';
      document.documentElement.style.overflowX = '';
    }
  };

  useEffect(() => {
    if (viewMode === 'desktop') {
      document.documentElement.style.minWidth = '1200px';
      document.documentElement.style.overflowX = 'auto';
    } else {
      document.documentElement.style.minWidth = '';
      document.documentElement.style.overflowX = '';
    }
  }, [viewMode]);

  return {
    viewMode,
    toggleView,
    isMobileDevice,
    isDesktopMode: viewMode === 'desktop',
    isMobileMode: viewMode === 'mobile'
  };
};

export default useViewMode;
