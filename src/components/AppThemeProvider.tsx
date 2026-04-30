'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#065F46', // Emerald
      },
      secondary: {
        main: '#B45309', // Amber (Accent)
      },
      background: {
        default: mode === 'light' ? '#FDFBF7' : '#121212',
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      }
    },
    typography: {
      fontFamily: 'var(--font-inter), sans-serif',
      h1: { fontFamily: 'var(--font-amiri), serif' },
      h2: { fontFamily: 'var(--font-amiri), serif' },
      h3: { fontFamily: 'var(--font-amiri), serif' },
      h4: { fontFamily: 'var(--font-amiri), serif' },
      h5: { fontFamily: 'var(--font-amiri), serif' },
      h6: { fontFamily: 'var(--font-amiri), serif' },
    },
  }), [mode]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  // Very light SVG Islamic pattern at 3% opacity
  const patternSvg = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 15-15 15L15 15 30 0zm0 60l15-15-15-15-15 15 15 15z' fill='%23065F46' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E`;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          body: {
            backgroundImage: `url("${patternSvg}")`,
            backgroundAttachment: 'fixed',
          }
        }} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
