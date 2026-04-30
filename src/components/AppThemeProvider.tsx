'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles, Box } from '@mui/material';

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
        main: '#042F2E', // Deep Teal
      },
      secondary: {
        main: '#D97706', // Amber/Gold
      },
      background: {
        default: mode === 'light' ? '#FDFCF7' : '#042F2E', // Cream or Deep Teal
        paper: mode === 'light' ? '#FFFFFF' : '#064E3B',
      },
      text: {
        primary: mode === 'light' ? '#042F2E' : '#FDFCF7',
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
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }
        }
      }
    }
  }), [mode]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  // Very light SVG Islamic pattern
  const patternSvg = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 15-15 15L15 15 30 0zm0 60l15-15-15-15-15 15 15 15z' fill='%23D97706' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E`;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          body: {
            backgroundImage: `url("${patternSvg}")`,
            backgroundAttachment: 'fixed',
            position: 'relative',
            overflowX: 'hidden',
          }
        }} />
        
        {/* Crescent Moon (Glowing in Dark Mode) */}
        {mode === 'dark' && (
          <Box
            sx={{
              position: 'fixed',
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              zIndex: -1,
              filter: 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.8))',
              opacity: 0.6
            }}
          >
            <svg viewBox="0 0 24 24" fill="#D97706">
              <path d="M12.1,22c-4.9,0-9-3.7-9.8-8.6c-0.1-0.6,0.3-1.1,0.9-1.2c0.6-0.1,1.1,0.3,1.2,0.9c0.7,3.9,4.1,6.8,8.1,6.8c4.6,0,8.3-3.7,8.3-8.3c0-3.3-1.9-6.2-4.8-7.5c-0.5-0.2-0.8-0.8-0.6-1.3c0.2-0.5,0.8-0.8,1.3-0.6c3.7,1.7,6.1,5.3,6.1,9.4C22.8,17.4,18,22,12.1,22z" />
            </svg>
          </Box>
        )}

        {/* Date Palm Silhouettes */}
        <Box
          sx={{
            position: 'fixed',
            bottom: -20,
            left: -20,
            width: 150,
            height: 150,
            zIndex: -1,
            opacity: 0.1,
            pointerEvents: 'none',
            transform: 'rotate(10deg)'
          }}
        >
          <svg viewBox="0 0 100 100" fill="#042F2E">
            <path d="M50,95 C50,80 45,70 35,60 C45,65 55,65 65,60 C55,70 50,80 50,95 Z M50,60 C50,40 40,30 20,25 C40,30 50,45 60,30 C75,40 80,50 80,60 C70,55 60,55 50,60 Z" />
          </svg>
        </Box>
        <Box
          sx={{
            position: 'fixed',
            bottom: -20,
            right: -20,
            width: 150,
            height: 150,
            zIndex: -1,
            opacity: 0.1,
            pointerEvents: 'none',
            transform: 'scaleX(-1) rotate(10deg)'
          }}
        >
          <svg viewBox="0 0 100 100" fill="#042F2E">
            <path d="M50,95 C50,80 45,70 35,60 C45,65 55,65 65,60 C55,70 50,80 50,95 Z M50,60 C50,40 40,30 20,25 C40,30 50,45 60,30 C75,40 80,50 80,60 C70,55 60,55 50,60 Z" />
          </svg>
        </Box>

        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
