'use client';

import { useSyncManager } from '@/hooks/useSyncManager';
import {
  AppBar, 
  Toolbar, 
  Typography, 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper,
  Box
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import { useRouter, usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const getValue = () => {
    if (pathname === '/') return 0;
    if (pathname === '/sajdah-debt') return 1;
    if (pathname === '/stats') return 2;
    return 0;
  };

  useSyncManager();

  return (
    <>
      <Box sx={{ pb: 7, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Hafiz Tracker
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          {children}
        </Box>

        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
          <BottomNavigation
            showLabels
            value={getValue()}
            onChange={(event, newValue) => {
              if (newValue === 0) router.push('/');
              if (newValue === 1) router.push('/sajdah-debt');
              if (newValue === 2) router.push('/stats');
            }}
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Sajdah Debt" icon={<PendingActionsIcon />} />
            <BottomNavigationAction label="Stats" icon={<QueryStatsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </>
  );
}
