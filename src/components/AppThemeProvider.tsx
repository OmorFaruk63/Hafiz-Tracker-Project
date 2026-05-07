'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { alpha, createTheme, ThemeProvider, type Components, type Theme } from '@mui/material/styles';

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

const info = {
  lighter: '#CAFDF5',
  light: '#61F3F3',
  main: '#00B8D9',
  dark: '#006C9C',
  darker: '#003768',
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

const darkBackground = {
  default: '#141A21',
  paper: '#1C252E',
  neutral: '#27303A',
};

const alertSeverityMap = {
  success,
  info,
  warning,
  error,
};

const getPalette = (themeMode: ThemeMode) => ({
  mode: themeMode,
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  divider:
    themeMode === 'light'
      ? alpha(grey[500], 0.2)
      : alpha(grey[500], 0.24),
  text: {
    primary: themeMode === 'light' ? '#1C252E' : '#FFFFFF',
    secondary: themeMode === 'light' ? '#637381' : '#919EAB',
    disabled: themeMode === 'light' ? '#919EAB' : '#637381',
  },
  background: {
    default: themeMode === 'light' ? grey[100] : darkBackground.default,
    paper: themeMode === 'light' ? '#FFFFFF' : darkBackground.paper,
    neutral: themeMode === 'light' ? grey[200] : darkBackground.neutral,
  },
  action: {
    hover: themeMode === 'light' ? alpha(grey[500], 0.08) : alpha(grey[500], 0.12),
    selected: themeMode === 'light' ? alpha(grey[500], 0.16) : alpha(grey[500], 0.2),
    focus: themeMode === 'light' ? alpha(grey[500], 0.24) : alpha(grey[500], 0.28),
    disabled: alpha(grey[500], 0.8),
    disabledBackground: alpha(grey[500], 0.24),
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
});

const getComponents = (themeMode: ThemeMode): Components<Theme> => ({
  MuiCssBaseline: {
    styleOverrides: {
      '*': { boxSizing: 'border-box' },
      html: { scrollBehavior: 'smooth' },
      body: {
        backgroundColor: themeMode === 'light' ? grey[100] : darkBackground.default,
        color: themeMode === 'light' ? '#1C252E' : '#FFFFFF',
        fontFamily: 'var(--font-dm-sans), sans-serif',
        minHeight: '100vh',
      },
      a: { color: 'inherit', textDecoration: 'none' },
      '::selection': { backgroundColor: alpha(primary.main, 0.18) },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderBottom: `1px solid ${alpha(grey[500], themeMode === 'light' ? 0.12 : 0.24)}`,
        boxShadow: 'none',
      },
    },
  },
  MuiAlert: {
    defaultProps: {
      variant: 'filled',
    },
    styleOverrides: {
      root: ({ ownerState, theme }) => {
        const severity = ownerState.severity && ownerState.severity in alertSeverityMap
          ? alertSeverityMap[ownerState.severity as keyof typeof alertSeverityMap]
          : undefined;

        const baseBackground = theme.palette.mode === 'light' ? theme.palette.background.paper : darkBackground.paper;

        if (!severity) {
          return {
            borderRadius: 12,
            fontWeight: 600,
            alignItems: 'center',
            backgroundColor: baseBackground,
          };
        }

        if (ownerState.variant === 'filled') {
          return {
            borderRadius: 12,
            fontWeight: 600,
            alignItems: 'center',
            backgroundColor: severity.main,
            color: severity.contrastText,
            '& .MuiAlert-icon': { color: severity.contrastText },
            '& .MuiAlert-action': { color: severity.contrastText },
          };
        }

        return {
          borderRadius: 12,
          fontWeight: 600,
          alignItems: 'center',
          color: theme.palette.text.primary,
          backgroundColor:
            theme.palette.mode === 'light'
              ? alpha(severity.main, 0.08)
              : alpha(severity.main, 0.16),
          border: `1px solid ${alpha(severity.main, theme.palette.mode === 'light' ? 0.24 : 0.36)}`,
          '& .MuiAlert-icon': { color: severity.main },
        };
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: ({ ownerState, theme }) => ({
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 700,
        boxShadow: 'none',
        transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          boxShadow: 'none',
          transform: 'translateY(-1px)',
        },
        ...(ownerState.variant === 'contained' && ownerState.color === 'primary'
          ? {
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: 'none',
                transform: 'translateY(-1px)',
              },
            }
          : {}),
      }),
      outlined: ({ theme }) => ({
        borderColor: alpha(theme.palette.grey[500], theme.palette.mode === 'light' ? 0.2 : 0.32),
        '&:hover': {
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.04 : 0.12),
        },
      }),
      text: ({ theme }) => ({
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
        },
      }),
      sizeLarge: {
        minHeight: 48,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 16,
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 4px 24px rgba(0, 0, 0, 0.06)'
            : '0 4px 24px rgba(0, 0, 0, 0.24)',
        zIndex: 0,
        position: 'relative',
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.secondary,
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        transition: theme.transitions.create(['background-color', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
          transform: 'translateY(-1px)',
        },
      }),
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.secondary,
        '&.Mui-focused': {
          color: theme.palette.primary.main,
        },
      }),
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        backgroundColor: theme.palette.background.paper,
        transition: theme.transitions.create(['border-color', 'box-shadow', 'background-color'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.text.secondary,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
        },
      }),
      input: ({ theme }) => ({
        fontWeight: 500,
        color: theme.palette.text.primary,
        '&::placeholder': {
          color: theme.palette.text.disabled,
          opacity: 1,
        },
      }),
      notchedOutline: ({ theme }) => ({
        borderColor: alpha(theme.palette.grey[500], theme.palette.mode === 'light' ? 0.2 : 0.32),
      }),
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      outlined: ({ theme }) => ({
        borderColor: alpha(theme.palette.grey[500], theme.palette.mode === 'light' ? 0.16 : 0.28),
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: ({ theme }) => ({
        fontSize: 14,
        color: theme.palette.text.secondary,
        fontWeight: 600,
        backgroundColor:
          theme.palette.mode === 'light'
            ? alpha(theme.palette.grey[500], 0.08)
            : alpha(theme.palette.grey[500], 0.16),
      }),
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 600,
        '&.Mui-selected': {
          color: theme.palette.primary.contrastText,
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        },
      }),
    },
  },
});

const getTheme = (themeMode: ThemeMode) =>
  createTheme({
    palette: getPalette(themeMode),
    typography: {
      fontFamily: 'var(--font-dm-sans), sans-serif',
      fontWeightLight: 500,
      fontWeightRegular: 500,
      fontWeightMedium: 600,
      fontWeightBold: 700,
      h1: {
        fontWeight: 800,
      },
      h2: {
        fontWeight: 800,
      },
      h3: {
        fontWeight: 700,
      },
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 600,
      },
      subtitle2: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 700,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: getComponents(themeMode),
  });

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;

    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          body: {
            backgroundColor: mode === 'light' ? grey[100] : darkBackground.default,
            minHeight: '100vh',
          },
          '::selection': { backgroundColor: alpha(primary.main, 0.2) },
        }} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}