'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useHafizStore } from '@/store/useHafizStore';
import { useSajdahDebt } from '@/hooks/useSajdahDebt';
import { useThemeContext } from '@/components/AppThemeProvider';
import { db } from '@/lib/hafizDB';
import SaveIcon from '@mui/icons-material/Save';

export default function Home() {
  const { mode, toggleTheme } = useThemeContext();
  const { lastPara, lastPage, setLastReadPosition } = useHafizStore();
  const { remainingDebt } = useSajdahDebt();

  // Local state for the form inputs
  const [paraInput, setParaInput] = useState<number | ''>('');
  const [pageInput, setPageInput] = useState<number | ''>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync state from Zustand to local input on mount and when they change externally
  useEffect(() => {
    setMounted(true);
    setParaInput(lastPara);
    setPageInput(lastPage);
  }, [lastPara, lastPage]);

  const handleSave = async () => {
    const endPara = Number(paraInput) || 1;
    const endPage = Number(pageInput) || 0;

    // Update Zustand Store
    setLastReadPosition(endPara, endPage);

    // Save to Dexie dailyLogs
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await db.dailyLogs.add({
        date: today,
        endPara,
        endPage,
        sajdahsDone: 0,
        isSynced: false
      });
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to log session', error);
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch on client render

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Assalamu Alaikum
        </Typography>
        <IconButton onClick={toggleTheme} color="inherit">
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>

      {/* Debt Card */}
      <Card 
        sx={{ 
          bgcolor: remainingDebt > 0 ? 'warning.light' : 'success.light',
          color: remainingDebt > 0 ? 'warning.contrastText' : 'success.contrastText'
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'inherit' }}>
            Sajdah Debt
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1, color: 'inherit' }}>
            {remainingDebt}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'inherit' }}>
            {remainingDebt > 0 ? "You have pending Sajdahs to perform." : "Alhamdulillah, no pending Sajdahs!"}
          </Typography>
        </CardContent>
      </Card>

      {/* Where did you stop? Form */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Where did you stop?
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Current Para"
              type="number"
              value={paraInput}
              onChange={(e) => setParaInput(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 1, max: 30 }}
              fullWidth
            />
            <TextField
              label="Current Page"
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 0, max: 20 }}
              fullWidth
            />
          </Box>

          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ mt: 1, fontWeight: 'bold' }}
          >
            Save Session
          </Button>
        </CardContent>
      </Card>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Progress saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
