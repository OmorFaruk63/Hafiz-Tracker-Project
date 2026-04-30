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
        main: '#2D6A4F', // Emerald Green
        light: '#52B788',
        dark: '#1B4332',
      },
      secondary: {
        main: '#D4AF37', // Metallic Gold
      },
      info: {
        main: '#48CAE4', // Sky Blue
      },
      background: {
        default: mode === 'light' ? '#FFFDF5' : '#0F1A14', // Very light cream or dark green-black
        paper: mode === 'light' ? '#FFFFFF' : '#1B2E24',
      },
      text: {
        primary: mode === 'light' ? '#1B4332' : '#F8F9FA',
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
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '24px',
            boxShadow: mode === 'light' 
              ? '0 10px 40px rgba(45, 106, 79, 0.08)' 
              : '0 10px 40px rgba(0, 0, 0, 0.3)',
            border: mode === 'light' ? '1px solid rgba(212, 175, 55, 0.1)' : '1px solid rgba(212, 175, 55, 0.05)',
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '12px',
          }
        }
      }
    }
  }), [mode]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  // Complex Islamic Geometric Pattern
  const patternSvg = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0L61.23 38.77H100L68.77 61.23L80 100L50 77.54L20 100L31.23 61.23L0 38.77H38.77L50 0Z' fill='%23D4AF37' fill-opacity='0.03'/%3E%3C/svg%3E`;

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
        
        {/* Skyblue & Gold Floating Motifs */}
        <Box
          sx={{
            position: 'fixed',
            top: '10%',
            left: '5%',
            width: 60,
            height: 60,
            zIndex: -1,
            opacity: 0.1,
            pointerEvents: 'none',
            color: 'info.main'
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </Box>

        <Box
          sx={{
            position: 'fixed',
            bottom: '15%',
            right: '8%',
            width: 80,
            height: 80,
            zIndex: -1,
            opacity: 0.1,
            pointerEvents: 'none',
            color: 'secondary.main'
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
          </svg>
        </Box>

        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
