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
  Alert,
  useTheme
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
  { para: 17, surah: 'Al-Hajj' },
  { para: 19, surah: 'Al-Furqan' },
  { para: 21, surah: 'An-Naml' },
  { para: 23, surah: 'As-Sajdah' },
  { para: 24, surah: 'Saad' },
  { para: 25, surah: 'Fussilat' },
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
      const existing = await db.dailyLogs.where('date').equals(today).first();
      const nextSajdahs = (existing?.sajdahsDone ?? 0) + count;

      if (existing?.id) {
        await db.dailyLogs.update(existing.id, {
          endPara: lastPara,
          endPage: lastPage,
          sajdahsDone: nextSajdahs,
          isSynced: false
        });
      } else {
        await db.dailyLogs.add({
          date: today,
          endPara: lastPara,
          endPage: lastPage,
          sajdahsDone: nextSajdahs,
          isSynced: false
        });
      }
      
      setSnackbarOpen(true);
      setCount(1);
      syncNow(); // Trigger sync
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 10 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', textAlign: 'center', mt: 2, fontFamily: 'var(--font-dm-sans)', letterSpacing: 0.4 }}>
        Sajdah Ledger
      </Typography>

      {/* Header Card */}
      <Card sx={{
        color: remainingDebt > 0 ? '#1B1407' : '#fff',
        borderRadius: '24px',
        backgroundImage: remainingDebt > 0
          ? 'linear-gradient(135deg, #F0D38B 0%, #D6B25E 55%, #B28A3E 100%)'
          : 'linear-gradient(135deg, #0F5132 0%, #1F7A55 60%, #0F5132 100%)',
        border: '1px solid rgba(214, 178, 94, 0.35)'
      }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {remainingDebt > 0 ? 'Total Pending Sajdahs' : 'All Sajdahs Completed'}
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
            {remainingDebt > 0 ? remainingDebt : '0'}
          </Typography>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Paper sx={{
        p: 3,
        borderRadius: '24px',
        textAlign: 'center',
        border: '1px solid rgba(214, 178, 94, 0.3)'
      }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, color: 'primary.main' }}>Record Payment</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 3 }}>
          <IconButton 
            onClick={() => setCount(Math.max(1, count - 1))} 
            sx={{ bgcolor: 'rgba(15, 81, 50, 0.08)', p: 2, border: '1px solid rgba(214, 178, 94, 0.35)' }}
          >
            <RemoveIcon color="primary" />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', minWidth: 40 }}>{count}</Typography>
          <IconButton 
            onClick={() => setCount(count + 1)}
            sx={{ bgcolor: 'rgba(15, 81, 50, 0.08)', p: 2, border: '1px solid rgba(214, 178, 94, 0.35)' }}
          >
            <AddIcon color="primary" />
          </IconButton>
        </Box>
        <Button 
          variant="contained" 
          color="secondary" 
          fullWidth 
          size="large"
          sx={{
            py: 1.5,
            fontWeight: 800,
            borderRadius: '12px',
            color: '#1B1407',
            boxShadow: '0 12px 24px rgba(214, 178, 94, 0.25)'
          }}
          onClick={handleConfirm}
        >
          Confirm Payment
        </Button>
      </Paper>

      {/* List Section */}
      <Paper sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(214, 178, 94, 0.3)' }}>
        <Typography variant="h6" sx={{ p: 2, fontWeight: 800, bgcolor: 'primary.main', color: '#F0D38B' }}>
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
                      <CheckCircleIcon sx={{ color: 'rgba(15, 81, 50, 0.15)' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Para ${loc.para} - ${loc.surah}`} 
                    secondary={isPassed ? 'Passed (Pending Payment)' : 'Not yet reached'}
                    slotProps={{
                      primary: { 
                        sx: {
                          fontWeight: isPassed ? 'bold' : 'normal',
                          color: isPassed ? 'text.primary' : 'text.secondary'
                        }
                      }
                    }}
                  />
                  {isPassed && <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 800 }}>PENDING</Typography>}
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
