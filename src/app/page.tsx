'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Snackbar, 
  Alert,
  Divider,
  Paper
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import SaveIcon from '@mui/icons-material/Save';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

export default function Home() {
  const userState = useLiveQuery(() => db.userState.get(1));
  
  const [parasRead, setParasRead] = useState<number | ''>('');
  const [pagesRead, setPagesRead] = useState<number | ''>('');
  const [sajdahsDone, setSajdahsDone] = useState<number | ''>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Initialize userState if it doesn't exist
  useEffect(() => {
    const initDb = async () => {
      const state = await db.userState.get(1);
      if (!state) {
        await db.userState.add({
          id: 1,
          totalKhatams: 0,
          lastPara: 0,
          lastPage: 0
        });
      }
    };
    initDb();
  }, []);

  const handleSave = async () => {
    try {
      const pRead = Number(parasRead) || 0;
      const pgRead = Number(pagesRead) || 0;
      const sDone = Number(sajdahsDone) || 0;

      if (pRead === 0 && pgRead === 0 && sDone === 0) {
        return; // Nothing to save
      }

      // Add to daily logs
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await db.dailyLogs.add({
        date: today,
        parasRead: pRead,
        pagesRead: pgRead,
        sajdahsDone: sDone,
        isSynced: false
      });

      // Update user state
      if (userState) {
        let newPage = userState.lastPage + pgRead;
        let newPara = userState.lastPara + pRead;
        let newKhatams = userState.totalKhatams;

        // Assuming roughly 20 pages per Para for estimation
        if (newPage > 20) {
          newPara += Math.floor(newPage / 20);
          newPage = newPage % 20;
        }

        if (newPara > 30) {
          newKhatams += Math.floor(newPara / 30);
          newPara = newPara % 30;
          if (newPara === 0 && newPage > 0) {
             // Edge case handling if they pass para 30
          }
        }

        await db.userState.put({
          id: 1,
          totalKhatams: newKhatams,
          lastPara: newPara,
          lastPage: newPage
        });
      }

      // Reset form and show success
      setParasRead('');
      setPagesRead('');
      setSajdahsDone('');
      setSnackbarOpen(true);

    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      <Typography variant="h5" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Assalamu Alaikum
      </Typography>
      
      {/* Last Read Position Card */}
      <Card elevation={2} sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' }}>
        <CardContent sx={{ position: 'relative' }}>
          <BookmarkBorderIcon sx={{ position: 'absolute', top: 16, right: 16, color: 'primary.main', opacity: 0.5, fontSize: 40 }} />
          <Typography variant="subtitle1" color="primary.dark" gutterBottom sx={{ fontWeight: 'bold' }}>
            Last Read Position
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {userState?.lastPara || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Para
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {userState?.lastPage || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Page
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {userState?.totalKhatams || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Khatams
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Log Form */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Quick Log
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Record your progress for today.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Paras Read Today"
            type="number"
            variant="outlined"
            fullWidth
            value={parasRead}
            onChange={(e) => setParasRead(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ min: 0, step: 0.5 }}
          />

          <TextField
            label="Pages Read Today"
            type="number"
            variant="outlined"
            fullWidth
            value={pagesRead}
            onChange={(e) => setPagesRead(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ min: 0 }}
          />

          <TextField
            label="Sajdahs Performed Today"
            type="number"
            variant="outlined"
            fullWidth
            value={sajdahsDone}
            onChange={(e) => setSajdahsDone(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ min: 0 }}
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ mt: 1, py: 1.5, borderRadius: 2, fontWeight: 'bold', fontSize: '1.1rem' }}
          >
            Save Session
          </Button>
        </Box>
      </Paper>

      {/* Success Snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }} // Adjust for BottomNavigation on mobile
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          Session saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
