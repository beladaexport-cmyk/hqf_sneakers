import React, { createContext, useContext, useEffect } from 'react';
import { useSettings } from './SettingsContext';

export interface Theme {
  // Backgrounds
  bgPrimary: string;
  bgCard: string;
  bgHover: string;
  bgInput: string;
  bgNavbar: string;
  bgSidebar: string;
  bgMobileNav: string;

  // Borders
  border: string;
  borderLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accent (purple)
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;

  // Status
  success: string;
  successBg: string;
  successBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  warning: string;
  warningBg: string;
  warningBorder: string;

  // Shadows
  shadow: string;
  shadowMd: string;
  shadowLg: string;

  // Flag
  isDark: boolean;
}

export const lightTheme: Theme = {
  bgPrimary: '#F1F5F9',
  bgCard: '#FFFFFF',
  bgHover: '#F8FAFC',
  bgInput: '#FFFFFF',
  bgNavbar: '#FFFFFF',
  bgSidebar: '#FFFFFF',
  bgMobileNav: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  accent: '#6366F1',
  accentBg: '#EEF2FF',
  accentBorder: '#C7D2FE',
  accentText: '#6366F1',

  success: '#10B981',
  successBg: '#F0FDF4',
  successBorder: '#A7F3D0',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',

  shadow: '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08)',
  shadowLg: '0 8px 32px rgba(0,0,0,0.12)',

  isDark: false,
};

export const darkTheme: Theme = {
  bgPrimary: '#0F1117',
  bgCard: '#1A1D27',
  bgHover: '#22263A',
  bgInput: '#1E2235',
  bgNavbar: '#13161F',
  bgSidebar: '#13161F',
  bgMobileNav: '#13161F',

  border: '#2D3250',
  borderLight: '#252840',

  textPrimary: '#F0F4FF',
  textSecondary: '#8B92B8',
  textMuted: '#5A6080',

  accent: '#818CF8',
  accentBg: '#1E2040',
  accentBorder: '#3730A3',
  accentText: '#A5B4FC',

  success: '#34D399',
  successBg: '#052E16',
  successBorder: '#065F46',
  danger: '#F87171',
  dangerBg: '#2D0A0A',
  dangerBorder: '#7F1D1D',
  warning: '#FCD34D',
  warningBg: '#2D1A00',
  warningBorder: '#78350F',

  shadow: '0 2px 8px rgba(0,0,0,0.4)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.5)',
  shadowLg: '0 8px 32px rgba(0,0,0,0.6)',

  isDark: true,
};

const ThemeContext = createContext<Theme>(lightTheme);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { settings } = useSettings();
  const theme = settings.darkMode ? darkTheme : lightTheme;

  useEffect(() => {
    document.body.style.backgroundColor = theme.bgPrimary;
    document.body.style.color = theme.textPrimary;
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    if (theme.isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
