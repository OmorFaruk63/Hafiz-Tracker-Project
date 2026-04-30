'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Grid,
  Slider
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useHafizStore } from '@/store/useHafizStore';
import { useSajdahDebt } from '@/hooks/useSajdahDebt';
import { useThemeContext } from '@/components/AppThemeProvider';
import { db } from '@/lib/hafizDB';
import SaveIcon from '@mui/icons-material/Save';
import { motion } from 'framer-motion';
import { z } from 'zod';

const SAJDAH_PARAS = [9, 13, 14, 15, 16, 17, 19, 21, 23, 24, 27, 30, 30];

// Zod Schema for validation
const LogSchema = z.object({
  para: z.number().int().min(1).max(30),
  page: z.number().int().min(0).max(20)
});

export default function Home() {
  const { mode, toggleTheme } = useThemeContext();
  const { lastPara, lastPage, setLastReadPosition, addKhatam } = useHafizStore();
  const { remainingDebt } = useSajdahDebt();

  const [paraInput, setParaInput] = useState<number>(1);
  const [pageInput, setPageInput] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setMounted(true);
    setParaInput(lastPara);
    setPageInput(lastPage);
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lastPara, lastPage]);

  const handleSave = async () => {
    try {
      // Data Validation (Prompt 4)
      const validData = LogSchema.parse({ para: paraInput, page: pageInput });
      setErrorMsg(null);

      // Handle skipping Khatam automatically
      if (validData.para < lastPara && lastPara >= 29) {
        addKhatam();
      }

      setLastReadPosition(validData.para, validData.page);

      const today = new Date().toISOString().split('T')[0];
      await db.dailyLogs.add({
        date: today,
        endPara: validData.para,
        endPage: validData.page,
        sajdahsDone: 0,
        isSynced: false
      });
      setSnackbarOpen(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrorMsg('Invalid input: Para must be 1-30 and Page 0-20.');
      } else {
        console.error('Failed to log session', error);
      }
    }
  };

  if (!mounted) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Assalamu Alaikum
          </Typography>
          {!isOnline && <CloudOffIcon color="error" titleAccess="Offline" />}
        </Box>
        <IconButton onClick={toggleTheme} color="inherit">
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Debt Card with Framer Motion (Prompt 2) */}
      <motion.div
        animate={remainingDebt > 5 ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4, repeat: remainingDebt > 5 ? Infinity : 0, repeatDelay: 3 }}
      >
        <Card 
          sx={{ 
            bgcolor: remainingDebt > 0 ? 'secondary.main' : 'primary.main',
            color: '#fff'
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
      </motion.div>

      {/* Smart Input Card (Glassmorphism - Prompt 1 & 2) */}
      <Card 
        sx={{
          background: mode === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Where did you stop?
          </Typography>
          
          <Box>
            <Typography variant="body2" gutterBottom>Select Para (1-30)</Typography>
            <Grid container spacing={1}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((p) => (
                <Grid item xs={2} sm={1.5} md={1.2} key={p}>
                  <Button
                    variant={paraInput === p ? "contained" : "outlined"}
                    color={paraInput === p ? "primary" : "inherit"}
                    onClick={() => setParaInput(p)}
                    sx={{ 
                      minWidth: 0, 
                      width: '100%', 
                      aspectRatio: '1', 
                      p: 0,
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    {p}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Page Number: {pageInput}
            </Typography>
            <Slider
              value={pageInput}
              min={0}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
              onChange={(e, val) => setPageInput(val as number)}
              color="primary"
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
