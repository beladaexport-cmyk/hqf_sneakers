import React from 'react';
import { useViewMode } from '../contexts/ViewModeContext';

const ViewToggle = () => {
  const { viewMode, toggleView, isMobileDevice } = useViewMode();

  if (!isMobileDevice) return null;

  return (
    <button
      onClick={toggleView}
      title={
        viewMode === 'mobile'
          ? 'Переключить на ПК версию'
          : 'Переключить на мобильную версию'
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: '1.5px solid #E2E8F0',
        backgroundColor: viewMode === 'desktop' ? '#EEF2FF' : 'white',
        cursor: 'pointer',
        fontSize: '18px',
        transition: 'all 0.2s',
        flexShrink: 0,
        boxShadow:
          viewMode === 'desktop'
            ? '0 2px 8px rgba(99,102,241,0.25)'
            : '0 1px 4px rgba(0,0,0,0.08)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = '#EEF2FF';
        e.currentTarget.style.borderColor = '#C7D2FE';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor =
          viewMode === 'desktop' ? '#EEF2FF' : 'white';
        e.currentTarget.style.borderColor =
          viewMode === 'desktop' ? '#C7D2FE' : '#E2E8F0';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {viewMode === 'mobile' ? '🖥️' : '📱'}
    </button>
  );
};

export default ViewToggle;
