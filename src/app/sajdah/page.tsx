'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useSajdahDebt } from '@/hooks/useSajdahDebt';
import { useHafizStore } from '@/store/useHafizStore';
import { db } from '@/lib/hafizDB';
import { useSyncManager } from '@/hooks/useSyncManager';

const SAJDAH_LOCATIONS = [
  { para: 9, surah: 'Al-Araf' },
  { para: 13, surah: 'Ar-Raad' },
  { para: 14, surah: 'An-Nahl' },
  { para: 15, surah: 'Al-Isra' },
  { para: 16, surah: 'Maryam' },
  { para: 17, surah: 'Al-Hajj (1)' },
  { para: 17, surah: 'Al-Hajj (2)' },
  { para: 19, surah: 'Al-Furqan' },
  { para: 21, surah: 'An-Naml' },
  { para: 23, surah: 'As-Sajdah' },
  { para: 24, surah: 'Saad' },
  { para: 27, surah: 'An-Najm' },
  { para: 30, surah: 'Al-Inshiqaq' },
  { para: 30, surah: 'Al-Alaq' }
];

export default function SajdahPaymentPage() {
  const { remainingDebt } = useSajdahDebt();
  const { totalSajdahsDone, incrementSajdahs, lastPara, lastPage } = useHafizStore();
  const { syncNow } = useSyncManager();
  
  const [count, setCount] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleConfirm = async () => {
    if (count <= 0) return;
    
    // Update Zustand
    incrementSajdahs(count);
    
    // Update Dexie
    const today = new Date().toISOString().split('T')[0];
    try {
      await db.dailyLogs.add({
        date: today,
        endPara: lastPara,
        endPage: lastPage,
        sajdahsDone: count,
        isSynced: false
      });
      
      setSnackbarOpen(true);
      setCount(1);
      syncNow(); // Trigger sync
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 10 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center', mt: 2 }}>
        Sajdah Ledger
      </Typography>

      {/* Header Card */}
      <Card sx={{ bgcolor: 'secondary.main', color: '#fff', borderRadius: '24px' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>Total Pending Sajdahs</Typography>
          <Typography variant="h2" sx={{ fontWeight: 'bold' }}>{remainingDebt}</Typography>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Paper sx={{ p: 3, borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>Record Payment</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 3 }}>
          <IconButton 
            onClick={() => setCount(Math.max(1, count - 1))} 
            sx={{ bgcolor: 'rgba(4, 47, 46, 0.05)', p: 2 }}
          >
            <RemoveIcon color="primary" />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', minWidth: 40 }}>{count}</Typography>
          <IconButton 
            onClick={() => setCount(count + 1)}
            sx={{ bgcolor: 'rgba(4, 47, 46, 0.05)', p: 2 }}
          >
            <AddIcon color="primary" />
          </IconButton>
        </Box>
        <Button 
          variant="contained" 
          color="secondary" 
          fullWidth 
          size="large"
          sx={{ py: 1.5, fontWeight: 'bold', borderRadius: '12px' }}
          onClick={handleConfirm}
        >
          Confirm Payment
        </Button>
      </Paper>

      {/* List Section */}
      <Paper sx={{ borderRadius: '24px', overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', bgcolor: 'primary.main', color: '#fff' }}>
          Sajdah Locations (Current Khatam)
        </Typography>
        <List disablePadding>
          {SAJDAH_LOCATIONS.map((loc, i) => {
            const isPassed = lastPara >= loc.para;
            return (
              <React.Fragment key={i}>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    {isPassed ? (
                      <PendingIcon color="secondary" />
                    ) : (
                      <CheckCircleIcon sx={{ color: 'rgba(0,0,0,0.1)' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Para ${loc.para} - ${loc.surah}`} 
                    secondary={isPassed ? 'Passed (Pending Payment)' : 'Not yet reached'}
                    primaryTypographyProps={{ 
                      fontWeight: isPassed ? 'bold' : 'normal',
                      color: isPassed ? 'text.primary' : 'text.secondary'
                    }}
                  />
                  {isPassed && <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>PENDING</Typography>}
                </ListItem>
                {i < SAJDAH_LOCATIONS.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      </Paper>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Payment recorded successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
