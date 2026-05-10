'use client';

import { useSyncManager } from '@/hooks/useSyncManager';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Sajdah Debt', icon: <PendingActionsIcon />, path: '/sajdah-debt' },
  { label: 'Sajdah', icon: <CheckCircleIcon />, path: '/sajdah' },
  { label: 'Stats', icon: <QueryStatsIcon />, path: '/stats' },
  { label: 'History', icon: <HistoryIcon />, path: '/history' },
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  useSyncManager();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 0.5 }}
          >
            Hafiz Tracker
          </Typography>
        </Box>
        <List component="nav" sx={{ px: 2 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={pathname === item.path}
              onClick={() => router.push(item.path)}
              sx={{
                mb: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.18),
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.04 : 0.12),
                },
              }}
            >
              <ListItemIcon sx={{ color: pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{ top: 0, zIndex: (muiTheme) => muiTheme.zIndex.appBar }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '1.05rem', sm: '1.25rem' },
              }}
            >
              {navItems.find((item) => item.path === pathname)?.label || 'Hafiz Tracker'}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: { xs: 2, sm: 3 },
            pb: { xs: 11, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile Navigation */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (muiTheme) => muiTheme.zIndex.appBar,
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid',
          borderColor: 'divider',
          pb: 'env(safe-area-inset-bottom)',
        }}
      >
        <BottomNavigation
          showLabels
          value={navItems.some((item) => item.path === pathname) ? pathname : false}
          onChange={(_, nextPath) => {
            if (nextPath) router.push(nextPath);
          }}
          sx={{
            height: 64,
            bgcolor: 'background.paper',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              px: 0.5,
              color: 'text.secondary',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.62rem',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              value={item.path}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
