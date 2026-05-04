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
        main: '#0F5132',
        light: '#1F7A55',
        dark: '#0A3A25',
      },
      secondary: {
        main: '#D6B25E',
        light: '#F0D38B',
        dark: '#B28A3E',
      },
      info: {
        main: '#1F9D7A',
      },
      background: {
        default: mode === 'light' ? '#F7F2E8' : '#0A1411',
        paper: mode === 'light' ? '#FFFBF2' : '#0F1D18',
      },
      text: {
        primary: mode === 'light' ? '#0F2E1D' : '#F6F0E6',
        secondary: mode === 'light' ? '#385346' : '#CDBFA9',
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
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'linear-gradient(90deg, #0F5132 0%, #1F7A55 60%, #0F5132 100%)',
            boxShadow: mode === 'light'
              ? '0 8px 24px rgba(15, 81, 50, 0.18)'
              : '0 8px 24px rgba(0, 0, 0, 0.45)',
            borderBottom: '1px solid rgba(214, 178, 94, 0.35)'
          }
        }
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            background: mode === 'light'
              ? 'linear-gradient(180deg, rgba(255, 251, 242, 0.95) 0%, rgba(247, 242, 232, 0.95) 100%)'
              : 'linear-gradient(180deg, rgba(15, 29, 24, 0.98) 0%, rgba(10, 20, 17, 0.98) 100%)',
            borderTop: '1px solid rgba(214, 178, 94, 0.25)'
          }
        }
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#385346' : '#CDBFA9',
            '&.Mui-selected': {
              color: '#D6B25E'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '24px',
            boxShadow: mode === 'light' 
              ? '0 12px 36px rgba(15, 81, 50, 0.12)' 
              : '0 10px 40px rgba(0, 0, 0, 0.3)',
            border: mode === 'light' ? '1px solid rgba(214, 178, 94, 0.2)' : '1px solid rgba(214, 178, 94, 0.1)',
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
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'light'
              ? 'linear-gradient(180deg, rgba(255, 251, 242, 0.96) 0%, rgba(247, 242, 232, 0.96) 100%)'
              : 'linear-gradient(180deg, rgba(15, 29, 24, 0.98) 0%, rgba(10, 20, 17, 0.98) 100%)',
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '999px'
          }
        }
      }
    }
  }), [mode]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  // Complex Islamic Geometric Pattern
  const patternSvg = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cpath d='M60 6L73.5 45H114L81 69L93 108L60 84L27 108L39 69L6 45H46.5L60 6Z' fill='%23D6B25E' fill-opacity='0.035'/%3E%3Cpath d='M60 24L69.6 52H98L75.2 68L83 96L60 80L37 96L44.8 68L22 52H50.4L60 24Z' fill='%230F5132' fill-opacity='0.03'/%3E%3C/g%3E%3C/svg%3E`;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          body: {
            backgroundImage: mode === 'light'
              ? `radial-gradient(1200px 600px at 10% 0%, rgba(214, 178, 94, 0.12), transparent 55%), radial-gradient(900px 500px at 90% 10%, rgba(31, 157, 122, 0.12), transparent 60%), url("${patternSvg}")`
              : `radial-gradient(1200px 600px at 10% 0%, rgba(214, 178, 94, 0.08), transparent 55%), radial-gradient(900px 500px at 90% 10%, rgba(31, 157, 122, 0.08), transparent 60%), url("${patternSvg}")`,
            backgroundAttachment: 'fixed',
            position: 'relative',
            overflowX: 'hidden',
          },
          '::selection': {
            background: 'rgba(214, 178, 94, 0.35)'
          }
        }} />
        
        {/* Floating Motifs */}
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
            color: 'secondary.main'
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
            color: 'info.main'
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
