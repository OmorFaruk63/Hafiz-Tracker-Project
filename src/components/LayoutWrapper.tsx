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
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FlareIcon from '@mui/icons-material/Flare';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { label: 'Home', mobileLabel: 'Home', icon: <AutoStoriesIcon />, path: '/' },
  { label: 'Sajdah Debt', mobileLabel: 'Debt', icon: <BedtimeIcon />, path: '/sajdah-debt' },
  { label: 'Sajdah', mobileLabel: 'Sajdah', icon: <CheckCircleIcon />, path: '/sajdah' },
  { label: 'Stats', mobileLabel: 'Stats', icon: <FlareIcon />, path: '/stats' },
  { label: 'History', mobileLabel: 'History', icon: <HistoryIcon />, path: '/history' },
  { label: 'Achievements', mobileLabel: 'Badges', icon: <EmojiEventsIcon />, path: '/achievements' },
];

function MosqueMark({ compact = false }: { compact?: boolean }) {
  return (
    <Box
      className="mosque-mark"
      sx={{
        width: compact ? 38 : 48,
        height: compact ? 38 : 48,
        flex: '0 0 auto',
      }}
      aria-hidden="true"
    >
      <Box className="mosque-mark__moon">
        <BedtimeIcon fontSize={compact ? 'small' : 'medium'} />
      </Box>
      <Box className="mosque-mark__dome" />
      <Box className="mosque-mark__body" />
      <Box className="mosque-mark__minaret mosque-mark__minaret--left" />
      <Box className="mosque-mark__minaret mosque-mark__minaret--right" />
    </Box>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  useSyncManager();

  return (
    <Box
      className="islamic-shell"
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box className="islamic-ambient islamic-ambient--moon" />
      <Box className="islamic-ambient islamic-ambient--pattern" />

      {/* Sidebar */}
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          bgcolor:
            theme.palette.mode === 'light'
              ? alpha(theme.palette.background.paper, 0.88)
              : alpha(theme.palette.background.paper, 0.82),
          backdropFilter: 'blur(18px)',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 3 }}>
          <MosqueMark />
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 0 }}
            >
              Hafiz Tracker
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Quran progress
            </Typography>
          </Box>
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
                minHeight: 48,
                transition: theme.transitions.create(
                  ['background-color', 'box-shadow', 'color', 'transform'],
                  { duration: theme.transitions.duration.shorter },
                ),
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.09 : 0.18),
                  color: 'primary.main',
                  boxShadow: `inset 3px 0 0 ${theme.palette.secondary.main}`,
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                  '& .MuiSvgIcon-root': {
                    animation: 'navIconFloat 2.8s ease-in-out infinite',
                  },
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.04 : 0.12),
                  transform: 'translateX(3px)',
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
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, zIndex: 1 }}>
        {/* Header */}
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            top: 0,
            zIndex: (muiTheme) => muiTheme.zIndex.appBar,
            bgcolor:
              theme.palette.mode === 'light'
                ? alpha(theme.palette.background.paper, 0.82)
                : alpha(theme.palette.background.paper, 0.78),
            backdropFilter: 'blur(18px)',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 60, sm: 68 }, gap: 1.5 }}>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <MosqueMark compact />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 800,
                color: 'text.primary',
                fontSize: { xs: '1.05rem', sm: '1.25rem' },
                letterSpacing: 0,
              }}
            >
              {navItems.find((item) => item.path === pathname)?.label || 'Hafiz Tracker'}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '50%',
                color: 'secondary.main',
                bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'light' ? 0.12 : 0.18),
                animation: 'moonGlow 4s ease-in-out infinite',
              }}
              aria-hidden="true"
            >
              <BedtimeIcon fontSize="small" />
            </Box>
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
          bgcolor:
            theme.palette.mode === 'light'
              ? alpha(theme.palette.background.paper, 0.92)
              : alpha(theme.palette.background.paper, 0.88),
          backdropFilter: 'blur(18px)',
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
            height: 68,
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              px: 0.5,
              color: 'text.secondary',
              transition: theme.transitions.create(['color', 'transform'], {
                duration: theme.transitions.duration.shorter,
              }),
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.58rem',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            },
            '& .MuiBottomNavigationAction-root.Mui-selected': {
              color: 'primary.main',
              transform: 'translateY(-4px)',
            },
            '& .MuiBottomNavigationAction-root.Mui-selected .MuiSvgIcon-root': {
              filter: `drop-shadow(0 5px 10px ${alpha(theme.palette.secondary.main, 0.35)})`,
              animation: 'navIconFloat 2.8s ease-in-out infinite',
            },
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.mobileLabel}
              value={item.path}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
