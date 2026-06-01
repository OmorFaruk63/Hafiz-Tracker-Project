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
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/hafizDB';
import { getLatestLogForDate, sortDailyLogsChronologically } from '@/lib/dailyLogs';
import { format, isValid, parseISO } from 'date-fns';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useHafizStore } from '@/store/useHafizStore';

const SAJDAH_POINTS = [
  { para: 9 },
  { para: 13 },
  { para: 14 },
  { para: 15 },
  { para: 16 },
  { para: 17 },
  { para: 17 },
  { para: 19 },
  { para: 19 },
  { para: 21 },
  { para: 23 },
  { para: 24 },
  { para: 27 },
  { para: 30 },
  { para: 30 }
];

type CorrectionForm = {
  id?: number;
  date: string;
  endPara: string;
  endPage: string;
  loggedAt?: string;
};

type FormErrors = Partial<Record<keyof CorrectionForm, string>>;

const todayString = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm = (): CorrectionForm => ({
  date: todayString(),
  endPara: '1',
  endPage: '0'
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
  const [monthFilter, setMonthFilter] = useState('all');
  const [dateSearch, setDateSearch] = useState('');

  const autoSajdahsDone = useMemo(() => {
    const endPara = Number(form.endPara);
    if (!Number.isFinite(endPara) || endPara < 1) return 0;

    return SAJDAH_POINTS.filter((point) => point.para <= endPara).length;
  }, [form.endPara]);

  const listItems = useMemo(() => {
    if (!dailyLogs) return null;

    return sortDailyLogsChronologically(dailyLogs)
      .reverse()
      .map((log) => ({
        id: log.id,
        date: log.date,
        loggedAt: log.loggedAt,
        month: log.date.slice(0, 7),
        displayDate: format(parseISO(log.date), "EEE, MMM d, yyyy"),
        endPara: log.endPara,
        endPage: log.endPage,
        sajdahsDone: log.sajdahsDone ?? 0,
        isSynced: log.isSynced,
      }));
  }, [dailyLogs]);

  const monthOptions = useMemo(() => {
    if (!listItems) return [];

    return Array.from(new Set(listItems.map((log) => log.month)))
      .sort((a, b) => b.localeCompare(a))
      .map((month) => ({
        value: month,
        label: format(parseISO(`${month}-01`), 'MMMM yyyy')
      }));
  }, [listItems]);

  const filteredItems = useMemo(() => {
    if (!listItems) return null;

    const normalizedSearch = dateSearch.trim().toLowerCase();

    return listItems.filter((log) => {
      const matchesMonth = monthFilter === 'all' || log.month === monthFilter;
      const matchesSearch =
        !normalizedSearch ||
        log.date.includes(normalizedSearch) ||
        log.displayDate.toLowerCase().includes(normalizedSearch);

      return matchesMonth && matchesSearch;
    });
  }, [dateSearch, listItems, monthFilter]);

  const hasActiveFilters = monthFilter !== 'all' || dateSearch.trim().length > 0;

  const clearFilters = () => {
    setMonthFilter('all');
    setDateSearch('');
  };

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
      loggedAt: log.loggedAt
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

    if (!isValidDateString(form.date)) {
      nextErrors.date = 'Use YYYY-MM-DD.';
    }

    if (!Number.isInteger(endPara) || endPara < 1 || endPara > 30) {
      nextErrors.endPara = 'Para must be 1-30.';
    }

    if (!Number.isInteger(endPage) || endPage < 0 || endPage > 20) {
      nextErrors.endPage = 'Page must be 0-20.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return null;

    return {
      date: form.date,
      endPara,
      endPage
    };
  };

  const handleSave = async () => {
    const validData = validateForm();
    if (!validData) return;

    try {
      setSaveError(null);

      let existingSajdahs = 0;
      if (form.id) {
        const existingLog = await db.dailyLogs.get(form.id);
        if (existingLog) {
          existingSajdahs = existingLog.sajdahsDone ?? 0;
        }
      }

      const nextLoggedAt = form.loggedAt ?? new Date().toISOString();
      const savedId = form.id
        ? form.id
        : await db.dailyLogs.add({
            ...validData,
            sajdahsDone: 0,
            loggedAt: nextLoggedAt,
            isSynced: false
          });

      if (form.id) {
        await db.dailyLogs.update(form.id, {
          ...validData,
          sajdahsDone: existingSajdahs,
          loggedAt: nextLoggedAt,
          isSynced: false
        });
      }

      const logsForDate = await db.dailyLogs.where('date').equals(validData.date).toArray();
      const latestForDate = getLatestLogForDate(logsForDate, validData.date);

      if (latestForDate?.id === savedId) {
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
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' }
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: 'primary.main',
              fontFamily: 'var(--font-dm-sans)',
              letterSpacing: 0,
              fontSize: { xs: '1.7rem', sm: '2.125rem' }
            }}
          >
            Reading History
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Find, correct, and sync your previous reading logs.
          </Typography>
        </Box>
        <Tooltip title="Add missing day">
          <IconButton
            color="primary"
            onClick={openAddDialog}
            sx={{
              bgcolor: 'rgba(214, 178, 94, 0.12)',
              border: '1px solid rgba(214, 178, 94, 0.35)'
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid rgba(214, 178, 94, 0.25)' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'minmax(180px, 0.45fr) 1fr auto' },
              gap: 1.5,
              alignItems: 'center'
            }}
          >
            <TextField
              select
              label="Month"
              size="small"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
            >
              <MenuItem value="all">All months</MenuItem>
              {monthOptions.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Search date"
              size="small"
              placeholder="YYYY-MM-DD or month name"
              value={dateSearch}
              onChange={(event) => setDateSearch(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
            />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              sx={{ minHeight: 40, whiteSpace: 'nowrap' }}
            >
              Clear
            </Button>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 1.5
            }}
          >
            {[
              { label: 'Showing', value: filteredItems?.length ?? 0 },
              { label: 'Total logs', value: listItems?.length ?? 0 },
              { label: 'Unsynced', value: listItems?.filter((log) => !log.isSynced).length ?? 0 },
              { label: 'Months', value: monthOptions.length }
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 900 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>

          {filteredItems === null ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Skeleton variant="rounded" height={54} />
              <Skeleton variant="rounded" height={54} />
              <Skeleton variant="rounded" height={54} />
            </Box>
          ) : !filteredItems.length ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'background.default',
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {hasActiveFilters ? 'No matching logs' : 'No history yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hasActiveFilters ? 'Try another month or date search.' : "Add a missing day or save today's progress."}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredItems.map((log, index) => (
                <React.Fragment key={log.id ?? log.date}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => openEditDialog(log)}
                      sx={{
                        px: { xs: 0, sm: 1 },
                        py: 1.5,
                        display: 'flex',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 2,
                        borderRadius: 2
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(15, 81, 50, 0.1)',
                          color: 'primary.main',
                          flex: '0 0 auto'
                        }}
                      >
                        <AutoStoriesIcon fontSize="small" />
                      </Box>
                      <ListItemText
                        primary={log.displayDate}
                        secondary={`Para ${log.endPara} · Page ${log.endPage} · ${log.date}`}
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
                        <Chip
                          icon={<EditIcon />}
                          label="Edit"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          {form.id ? 'Edit Reading Log' : 'Add Missing Day'}
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
            Update the saved end position for this date. Changes stay offline first and sync afterward.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pt: 1 }}>
          {saveError && (
            <Alert severity="error" onClose={() => setSaveError(null)}>
              {saveError}
            </Alert>
          )}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              bgcolor: 'background.default',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                Log Date
              </Typography>
              <TextField
                label="Date"
                type="date"
                value={form.date}
                onChange={(event) => updateForm('date', event.target.value)}
                error={Boolean(errors.date)}
                helperText={errors.date || 'Pick the day this reading belongs to.'}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              bgcolor: 'background.default',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                Reading Position
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5
                }}
              >
                <TextField
                  label="Para"
                  type="number"
                  value={form.endPara}
                  onChange={(event) => updateForm('endPara', event.target.value)}
                  error={Boolean(errors.endPara)}
                  helperText={errors.endPara || '1 to 30'}
                  fullWidth
                  slotProps={{ htmlInput: { min: 1, max: 30, step: 1 } }}
                />
                <TextField
                  label="Page"
                  type="number"
                  value={form.endPage}
                  onChange={(event) => updateForm('endPage', event.target.value)}
                  error={Boolean(errors.endPage)}
                  helperText={errors.endPage || '0 to 20'}
                  fullWidth
                  slotProps={{ htmlInput: { min: 0, max: 20, step: 1 } }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              bgcolor: 'background.default',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                Sajdah Auto Count
              </Typography>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  {autoSajdahsDone}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Calculated from the ending para.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            alignItems: 'stretch',
            gap: 1
          }}
        >
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            {form.id ? 'Save Changes' : 'Add Log'}
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
