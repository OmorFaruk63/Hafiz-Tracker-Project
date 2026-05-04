'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { useSajdahDebt } from '@/hooks/useSajdahDebt';
import { useHafizStore } from '@/store/useHafizStore';
import { db } from '@/lib/hafizDB';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useLiveQuery } from 'dexie-react-hooks';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

export default function SajdahLedgerPage() {
  const { remainingDebt, totalEarned } = useSajdahDebt();
  const { incrementSajdahs, lastPara, lastPage } = useHafizStore();
  const { syncNow } = useSyncManager();

  const [sajdahInput, setSajdahInput] = useState<number | ''>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Read recent logs where sajdahsDone > 0
  const recentLogs = useLiveQuery(() => 
    db.dailyLogs
      .filter(log => log.sajdahsDone > 0)
      .reverse()
      .limit(10)
      .toArray()
  );

  const handleRecord = async () => {
    const amount = Number(sajdahInput);
    if (!amount || amount <= 0) return;

    // 1. Add to totalSajdahsDone in Zustand
    incrementSajdahs(amount);

    // 2. Add to Dexie dailyLogs
    const today = new Date().toISOString().split('T')[0];
    try {
      await db.dailyLogs.add({
        date: today,
        endPara: lastPara,
        endPage: lastPage,
        sajdahsDone: amount,
        isSynced: false
      });
      setSajdahInput('');
      setSnackbarOpen(true);
      
      // 3. Sync to server
      syncNow();
    } catch (error) {
      console.error('Failed to record sajdahs', error);
    }
  };

  // Circular progress math (0-100)
  const progressValue = totalEarned > 0 
    ? Math.min(100, Math.max(0, Math.round(((totalEarned - remainingDebt) / totalEarned) * 100)))
    : 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2, pb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'var(--font-amiri)', letterSpacing: 0.4, textAlign: 'center' }}>
        Sajdah Ledger
      </Typography>

      {/* Debt Badge Section */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress 
            variant="determinate" 
            value={100} 
            size={180} 
            thickness={3} 
            sx={{ color: 'rgba(15, 81, 50, 0.08)' }} 
          />
          <CircularProgress 
            variant="determinate" 
            value={progressValue} 
            size={180} 
            thickness={3} 
            color={remainingDebt > 0 ? "secondary" : "primary"}
            sx={{ position: 'absolute', left: 0 }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h2" component="div" color="text.primary" sx={{ fontWeight: 'bold' }}>
              {remainingDebt}
            </Typography>
            <Typography variant="subtitle1" component="div" color="text.secondary">
              Pending
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* The 'Pay Debt' Input */}
      <Card sx={{ border: '1px solid rgba(214, 178, 94, 0.25)' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Pay Debt
          </Typography>
          <TextField
            label="Sajdahs Performed"
            type="number"
            value={sajdahInput}
            onChange={(e) => setSajdahInput(e.target.value === '' ? '' : Number(e.target.value))}
            slotProps={{ htmlInput: { min: 1 } }}
            fullWidth
            placeholder="e.g. 1"
          />
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={<TaskAltIcon />}
            onClick={handleRecord}
            disabled={!sajdahInput || Number(sajdahInput) <= 0}
            sx={{ fontWeight: 800, py: 1.5, boxShadow: '0 10px 22px rgba(15, 81, 50, 0.2)' }}
          >
            Record Sajdahs Performed
          </Button>
        </CardContent>
      </Card>

      {/* List Section */}
      <Card sx={{ border: '1px solid rgba(214, 178, 94, 0.25)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
            Recent Sajdahs
          </Typography>
          {(!recentLogs || recentLogs.length === 0) ? (
            <Typography variant="body2" color="text.secondary">
              No sajdahs recorded yet.
            </Typography>
          ) : (
            <List disablePadding>
              {recentLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary={`${log.sajdahsDone} Sajdah${log.sajdahsDone > 1 ? 's' : ''}`}
                      secondary={`Date: ${log.date}`}
                      slotProps={{ primary: { sx: { fontWeight: 'bold' } } }}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
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
          Sajdah recorded and sync triggered!
        </Alert>
      </Snackbar>
    </Box>
  );
}
