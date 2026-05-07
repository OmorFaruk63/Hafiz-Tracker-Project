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

// Minimals color palette
const primary = {
  lighter: '#D0ECFE',
  light: '#73BAFB',
  main: '#1877F2',
  dark: '#0C44AE',
  darker: '#042174',
  contrastText: '#FFFFFF',
};

const secondary = {
  lighter: '#EFD6FF',
  light: '#C684FF',
  main: '#8E33FF',
  dark: '#5119B7',
  darker: '#27097A',
  contrastText: '#FFFFFF',
};

const success = {
  lighter: '#D3FCD2',
  light: '#77ED8B',
  main: '#22C55E',
  dark: '#118D57',
  darker: '#065E49',
  contrastText: '#ffffff',
};

const warning = {
  lighter: '#FFF5CC',
  light: '#FFD666',
  main: '#FFAB00',
  dark: '#B76E00',
  darker: '#7A4100',
  contrastText: '#1C252E',
};

const error = {
  lighter: '#FFE9D5',
  light: '#FFAC82',
  main: '#FF5630',
  dark: '#B71D18',
  darker: '#7A0916',
  contrastText: '#FFFFFF',
};

const grey = {
  50: '#FCFDFD',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#1C252E',
  900: '#141A21',
};

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
      primary,
      secondary,
      success,
      warning,
      error,
      grey,
      background: {
        default: mode === 'light' ? grey[100] : grey[900],
        paper: mode === 'light' ? '#FFFFFF' : grey[800],
      },
      text: {
        primary: mode === 'light' ? grey[800] : '#FFFFFF',
        secondary: mode === 'light' ? grey[600] : grey[500],
      },
      divider: mode === 'light' ? 'rgba(145, 158, 171, 0.2)' : 'rgba(145, 158, 171, 0.12)',
    },
    typography: {
      fontFamily: 'var(--font-inter), "DM Sans", sans-serif',
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { boxSizing: 'border-box' },
          html: { scrollBehavior: 'smooth' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 700 },
          sizeLarge: { minHeight: 48 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'light' ? '0 4px 24px rgba(0, 0, 0, 0.06)' : '0 4px 24px rgba(0, 0, 0, 0.24)',
            zIndex: 0,
            position: 'relative',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: { borderColor: mode === 'light' ? 'rgba(145, 158, 171, 0.2)' : 'rgba(145, 158, 171, 0.12)' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontSize: 14,
            color: mode === 'light' ? grey[800] : '#FFFFFF',
            fontWeight: 600,
            backgroundColor: mode === 'light' ? grey[100] : grey[800],
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: mode === 'light' ? '#FFFFFF' : grey[800],
            boxShadow: mode === 'light' ? '0 2px 4px rgba(0, 0, 0, 0.08)' : '0 2px 4px rgba(0, 0, 0, 0.24)',
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: '8px' } } },
    },
  }), [mode]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          body: { backgroundColor: mode === 'light' ? grey[100] : grey[900], minHeight: '100vh' },
          '::selection': { background: 'rgba(24, 119, 242, 0.2)' },
        }} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}