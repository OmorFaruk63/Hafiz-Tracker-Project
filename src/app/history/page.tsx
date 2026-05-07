'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/hafizDB';
import { format, isValid, parseISO } from 'date-fns';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useHafizStore } from '@/store/useHafizStore';

type CorrectionForm = {
  id?: number;
  date: string;
  endPara: string;
  endPage: string;
  sajdahsDone: string;
};

type FormErrors = Partial<Record<keyof CorrectionForm, string>>;

const todayString = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm = (): CorrectionForm => ({
  date: todayString(),
  endPara: '1',
  endPage: '0',
  sajdahsDone: '0'
});

const isValidDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value;
};

export default function HistoryPage() {
  const dailyLogs = useLiveQuery(() => db.dailyLogs.orderBy('date').reverse().toArray());
  const { syncNow } = useSyncManager();
  const { setLastReadPosition } = useHafizStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CorrectionForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const listItems = useMemo(() => {
    if (!dailyLogs) return null;

    const logsByDate = new Map<string, (typeof dailyLogs)[number]>();

    for (const log of dailyLogs) {
      if (!logsByDate.has(log.date)) {
        logsByDate.set(log.date, log);
      }
    }

    return Array.from(logsByDate.values()).map((log) => ({
      id: log.id,
      date: log.date,
      displayDate: format(parseISO(log.date), 'EEE, MMM d, yyyy'),
      endPara: log.endPara,
      endPage: log.endPage,
      sajdahsDone: log.sajdahsDone ?? 0,
      isSynced: log.isSynced
    }));
  }, [dailyLogs]);

  const openAddDialog = () => {
    setForm(emptyForm());
    setErrors({});
    setSaveError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (log: NonNullable<typeof listItems>[number]) => {
    setForm({
      id: log.id,
      date: log.date,
      endPara: String(log.endPara),
      endPage: String(log.endPage),
      sajdahsDone: String(log.sajdahsDone)
    });
    setErrors({});
    setSaveError(null);
    setDialogOpen(true);
  };

  const updateForm = (field: keyof CorrectionForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const endPara = Number(form.endPara);
    const endPage = Number(form.endPage);
    const sajdahsDone = Number(form.sajdahsDone);

    if (!isValidDateString(form.date)) {
      nextErrors.date = 'Use YYYY-MM-DD.';
    }

    if (!Number.isInteger(endPara) || endPara < 1 || endPara > 30) {
      nextErrors.endPara = 'Para must be 1-30.';
    }

    if (!Number.isInteger(endPage) || endPage < 0 || endPage > 20) {
      nextErrors.endPage = 'Page must be 0-20.';
    }

    if (!Number.isInteger(sajdahsDone) || sajdahsDone < 0) {
      nextErrors.sajdahsDone = 'Sajdah count must be 0 or more.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return null;

    return {
      date: form.date,
      endPara,
      endPage,
      sajdahsDone
    };
  };

  const handleSave = async () => {
    const validData = validateForm();
    if (!validData) return;

    try {
      setSaveError(null);

      const existingForDate = await db.dailyLogs.where('date').equals(validData.date).first();

      if (existingForDate?.id) {
        await db.dailyLogs.update(existingForDate.id, {
          ...validData,
          loggedAt: new Date().toISOString(),
          isSynced: false
        });
      } else if (form.id) {
        await db.dailyLogs.update(form.id, {
          ...validData,
          loggedAt: new Date().toISOString(),
          isSynced: false
        });
      } else {
        await db.dailyLogs.add({
          ...validData,
          loggedAt: new Date().toISOString(),
          isSynced: false
        });
      }

      const newestLog = await db.dailyLogs.orderBy('date').reverse().first();
      if (newestLog?.date === validData.date) {
        setLastReadPosition(validData.endPara, validData.endPage);
      }

      setDialogOpen(false);
      setSuccessOpen(true);
      syncNow();
    } catch (error) {
      console.error('Failed to save correction', error);
      setSaveError('Could not save correction. Please try again.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: 'primary.main',
            textAlign: 'center',
            fontFamily: 'var(--font-dm-sans)',
            letterSpacing: 0.4
          }}
        >
          Reading History
        </Typography>
        <Tooltip title="Add missing day">
          <IconButton
            color="primary"
            onClick={openAddDialog}
            sx={{
              position: 'absolute',
              right: 0,
              bgcolor: 'rgba(214, 178, 94, 0.12)',
              border: '1px solid rgba(214, 178, 94, 0.35)'
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Card sx={{ borderRadius: '24px', border: '1px solid rgba(214, 178, 94, 0.25)' }}>
        <CardContent>
          {listItems === null ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Skeleton variant="rounded" height={54} />
              <Skeleton variant="rounded" height={54} />
              <Skeleton variant="rounded" height={54} />
            </Box>
          ) : !listItems.length ? (
            <Typography variant="body2" color="text.secondary">
              No history yet.
            </Typography>
          ) : (
            <List disablePadding>
              {listItems.map((log, index) => (
                <React.Fragment key={log.id ?? log.date}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => openEditDialog(log)}
                      sx={{ px: 0, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      <ListItemText
                        primary={log.displayDate}
                        secondary={`Para ${log.endPara} · Page ${log.endPage}`}
                        slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
                        <Chip
                          label={`${log.sajdahsDone} Sajdah${log.sajdahsDone === 1 ? '' : 's'}`}
                          color={log.sajdahsDone > 0 ? 'secondary' : 'default'}
                          variant={log.sajdahsDone > 0 ? 'filled' : 'outlined'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        {!log.isSynced && (
                          <Chip
                            label="Unsynced"
                            color="warning"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Quick Correction</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {saveError && (
            <Alert severity="error" onClose={() => setSaveError(null)}>
              {saveError}
            </Alert>
          )}
          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={(event) => updateForm('date', event.target.value)}
            error={Boolean(errors.date)}
            helperText={errors.date}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Para"
            type="number"
            value={form.endPara}
            onChange={(event) => updateForm('endPara', event.target.value)}
            error={Boolean(errors.endPara)}
            helperText={errors.endPara}
            fullWidth
            slotProps={{ htmlInput: { min: 1, max: 30, step: 1 } }}
          />
          <TextField
            label="Page"
            type="number"
            value={form.endPage}
            onChange={(event) => updateForm('endPage', event.target.value)}
            error={Boolean(errors.endPage)}
            helperText={errors.endPage}
            fullWidth
            slotProps={{ htmlInput: { min: 0, max: 20, step: 1 } }}
          />
          <TextField
            label="Sajdah count"
            type="number"
            value={form.sajdahsDone}
            onChange={(event) => updateForm('sajdahsDone', event.target.value)}
            error={Boolean(errors.sajdahsDone)}
            helperText={errors.sajdahsDone}
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={successOpen}
        autoHideDuration={2500}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSuccessOpen(false)}>
          History saved.
        </Alert>
      </Snackbar>
    </Box>
  );
}
