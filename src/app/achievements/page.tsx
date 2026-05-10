'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Skeleton,
  Snackbar,
  Typography
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import DataObjectIcon from '@mui/icons-material/DataObject';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import TableChartIcon from '@mui/icons-material/TableChart';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DailyLog } from '@/lib/hafizDB';
import { useHafizStore } from '@/store/useHafizStore';
import { useSajdahDebt } from '@/hooks/useSajdahDebt';

const PAGES_PER_PARA = 20;
const TOTAL_READING_PAGES = 600;

type Badge = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  icon: ReactNode;
  tone: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
};

const toDateKey = (date: Date) => date.toISOString().split('T')[0];

const shiftDateKey = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
};

const toReadingPages = (para: number, page: number) => (para - 1) * PAGES_PER_PARA + page;

const getReadingDeltaPages = (current: DailyLog, previous?: DailyLog) => {
  const currentPages = toReadingPages(current.endPara, current.endPage);
  const previousPages = previous ? toReadingPages(previous.endPara, previous.endPage) : 0;
  const delta = currentPages - previousPages;

  return delta >= 0 ? delta : TOTAL_READING_PAGES - previousPages + currentPages;
};

const escapeCsvCell = (value: string | number | boolean | undefined) => {
  const stringValue = String(value ?? '');
  if (!/[",\n]/.test(stringValue)) return stringValue;
  return `"${stringValue.replaceAll('"', '""')}"`;
};

const downloadTextFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function AchievementsPage() {
  const dailyLogs = useLiveQuery(() => db.dailyLogs.orderBy('date').toArray());
  const { totalKhatams, lastPara, lastPage, dailyGoal, userEmail } = useHafizStore();
  const { remainingDebt, totalEarned } = useSajdahDebt();
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const stats = useMemo(() => {
    const logs = dailyLogs ?? [];
    const activeDates = new Set<string>();
    let goalCompletions = 0;
    let totalPagesReadFromLogs = 0;

    logs.forEach((log, index) => {
      const deltaPages = getReadingDeltaPages(log, logs[index - 1]);
      const goalPages = dailyGoal.unit === 'paras' ? dailyGoal.amount * PAGES_PER_PARA : dailyGoal.amount;

      if (deltaPages > 0) {
        activeDates.add(log.date);
        totalPagesReadFromLogs += deltaPages;
      }

      if (goalPages > 0 && deltaPages >= goalPages) {
        goalCompletions += 1;
      }
    });

    const today = toDateKey(new Date());
    const yesterday = shiftDateKey(today, -1);
    const currentAnchor = activeDates.has(today) ? today : activeDates.has(yesterday) ? yesterday : null;
    let currentStreak = 0;

    if (currentAnchor) {
      let cursor = currentAnchor;
      while (activeDates.has(cursor)) {
        currentStreak += 1;
        cursor = shiftDateKey(cursor, -1);
      }
    }

    const sortedActiveDates = Array.from(activeDates).sort();
    let bestStreak = 0;
    let runningStreak = 0;
    let previousDate: string | null = null;

    sortedActiveDates.forEach((date) => {
      runningStreak = previousDate && shiftDateKey(previousDate, 1) === date ? runningStreak + 1 : 1;
      bestStreak = Math.max(bestStreak, runningStreak);
      previousDate = date;
    });

    const currentKhatamPages = toReadingPages(lastPara, lastPage);
    const lifetimePages = totalKhatams * TOTAL_READING_PAGES + currentKhatamPages;

    return {
      activeDays: activeDates.size,
      bestStreak,
      currentKhatamPages,
      currentKhatamPercent: Math.min(100, Math.round((currentKhatamPages / TOTAL_READING_PAGES) * 100)),
      currentStreak,
      goalCompletions,
      lifetimePages,
      totalPagesReadFromLogs,
    };
  }, [dailyGoal.amount, dailyGoal.unit, dailyLogs, lastPage, lastPara, totalKhatams]);

  const badges = useMemo<Badge[]>(() => {
    const badgeList: Badge[] = [
      {
        id: 'streak-3',
        title: 'Steady Start',
        description: 'Maintain a 3-day reading streak.',
        unlocked: stats.bestStreak >= 3,
        progress: Math.min(100, Math.round((stats.bestStreak / 3) * 100)),
        icon: <LocalFireDepartmentIcon />,
        tone: 'secondary',
      },
      {
        id: 'streak-7',
        title: 'One Week Strong',
        description: 'Maintain a 7-day reading streak.',
        unlocked: stats.bestStreak >= 7,
        progress: Math.min(100, Math.round((stats.bestStreak / 7) * 100)),
        icon: <LocalFireDepartmentIcon />,
        tone: 'warning',
      },
      {
        id: 'streak-30',
        title: 'Monthly Rhythm',
        description: 'Maintain a 30-day reading streak.',
        unlocked: stats.bestStreak >= 30,
        progress: Math.min(100, Math.round((stats.bestStreak / 30) * 100)),
        icon: <WorkspacePremiumIcon />,
        tone: 'primary',
      },
      {
        id: 'goal-1',
        title: 'Goal Keeper',
        description: 'Complete your daily goal once.',
        unlocked: stats.goalCompletions >= 1,
        progress: Math.min(100, stats.goalCompletions * 100),
        icon: <TaskAltIcon />,
        tone: 'success',
      },
      {
        id: 'goal-7',
        title: 'Seven Goals',
        description: 'Complete your daily goal on 7 logged days.',
        unlocked: stats.goalCompletions >= 7,
        progress: Math.min(100, Math.round((stats.goalCompletions / 7) * 100)),
        icon: <StarsIcon />,
        tone: 'success',
      },
      {
        id: 'first-khatam',
        title: 'First Khatam',
        description: 'Complete your first khatam.',
        unlocked: totalKhatams >= 1,
        progress: Math.min(100, totalKhatams * 100),
        icon: <EmojiEventsIcon />,
        tone: 'secondary',
      },
      {
        id: 'sajdah-clear',
        title: 'Sajdah Clear',
        description: 'Clear all pending sajdah debt.',
        unlocked: totalEarned > 0 && remainingDebt === 0,
        progress: totalEarned > 0 ? Math.round(((totalEarned - remainingDebt) / totalEarned) * 100) : 0,
        icon: <TaskAltIcon />,
        tone: 'success',
      },
      {
        id: 'para-5',
        title: 'Five Paras',
        description: 'Reach 5 paras in your current khatam.',
        unlocked: stats.currentKhatamPages >= 5 * PAGES_PER_PARA,
        progress: Math.min(100, Math.round((stats.currentKhatamPages / (5 * PAGES_PER_PARA)) * 100)),
        icon: <AutoStoriesIcon />,
        tone: 'info',
      },
      {
        id: 'para-15',
        title: 'Halfway Light',
        description: 'Reach 15 paras in your current khatam.',
        unlocked: stats.currentKhatamPages >= 15 * PAGES_PER_PARA,
        progress: Math.min(100, Math.round((stats.currentKhatamPages / (15 * PAGES_PER_PARA)) * 100)),
        icon: <AutoStoriesIcon />,
        tone: 'primary',
      },
      {
        id: 'para-30',
        title: 'Khatam Ready',
        description: 'Reach the end of 30 paras.',
        unlocked: stats.currentKhatamPages >= TOTAL_READING_PAGES || totalKhatams > 0,
        progress: stats.currentKhatamPercent,
        icon: <EmojiEventsIcon />,
        tone: 'secondary',
      },
    ];

    return badgeList;
  }, [remainingDebt, stats, totalEarned, totalKhatams]);

  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  const handleExportCsv = () => {
    const logs = dailyLogs ?? [];
    const headers = ['date', 'endPara', 'endPage', 'sajdahsDone', 'loggedAt', 'isSynced'];
    const rows = logs.map((log) =>
      headers.map((header) => escapeCsvCell(log[header as keyof DailyLog] as string | number | boolean | undefined)).join(','),
    );

    downloadTextFile(
      `hafiz-history-${toDateKey(new Date())}.csv`,
      [headers.join(','), ...rows].join('\n'),
      'text/csv;charset=utf-8',
    );
    setExportMessage('CSV export downloaded.');
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      userEmail,
      summary: {
        activeDays: stats.activeDays,
        bestStreak: stats.bestStreak,
        currentStreak: stats.currentStreak,
        dailyGoal,
        remainingDebt,
        totalEarned,
        totalKhatams,
      },
      logs: dailyLogs ?? [],
    };

    downloadTextFile(
      `hafiz-backup-${toDateKey(new Date())}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8',
    );
    setExportMessage('JSON backup downloaded.');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2, pb: 10 }}>
      <Box>
        <Typography
          variant="h4"
          sx={{
            color: 'primary.main',
            fontSize: { xs: '1.7rem', sm: '2.125rem' },
            fontWeight: 900,
            letterSpacing: 0,
          }}
        >
          Achievements
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Badges and local exports for your Quran reading journey.
        </Typography>
      </Box>

      <Card
        sx={{
          border: '1px solid rgba(214, 178, 94, 0.3)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0F5132 0%, #1F7A55 58%, #D6B25E 145%)',
          color: '#fff',
        }}
      >
        <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
          <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.82 }}>
                Badge Progress
              </Typography>
              <Typography sx={{ fontSize: { xs: '2.4rem', sm: '3.25rem' }, fontWeight: 900, lineHeight: 1 }}>
                {unlockedCount}
                <Typography component="span" sx={{ ml: 1, fontWeight: 800, opacity: 0.75 }}>
                  / {badges.length}
                </Typography>
              </Typography>
              <Typography sx={{ mt: 1, opacity: 0.86 }}>
                Best streak {stats.bestStreak} days, {stats.goalCompletions} daily goals completed, {totalKhatams} khatams finished.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  height: '100%',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 900 }}>Overall</Typography>
                  <Typography sx={{ fontWeight: 900 }}>{Math.round((unlockedCount / badges.length) * 100)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.round((unlockedCount / badges.length) * 100)}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      backgroundColor: 'secondary.light',
                    },
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.78 }}>
                  Badges unlock automatically from offline reading history.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {[
          { label: 'Current streak', value: stats.currentStreak, suffix: 'days' },
          { label: 'Best streak', value: stats.bestStreak, suffix: 'days' },
          { label: 'Goal completions', value: stats.goalCompletions, suffix: 'days' },
          { label: 'Lifetime pages', value: stats.lifetimePages, suffix: 'pages' },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 6, md: 3 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 900 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: 'primary.main', fontSize: { xs: '1.65rem', sm: '1.9rem' }, fontWeight: 900 }}>
                  {item.value}
                  <Typography component="span" sx={{ ml: 0.5, color: 'text.secondary', fontWeight: 800 }}>
                    {item.suffix}
                  </Typography>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 900 }}>
              Export / Backup
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Download your local reading history. JSON is best for backup, CSV is best for spreadsheets.
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<TableChartIcon />}
              onClick={handleExportCsv}
              disabled={!dailyLogs}
              sx={{ minHeight: 48 }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<DataObjectIcon />}
              onClick={handleExportJson}
              disabled={!dailyLogs}
              sx={{ minHeight: 48 }}
            >
              Download JSON Backup
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {!dailyLogs ? (
          Array.from({ length: 6 }, (_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Skeleton variant="rounded" height={190} />
            </Grid>
          ))
        ) : (
          badges.map((badge) => (
            <Grid key={badge.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: badge.unlocked ? `${badge.tone}.main` : 'divider',
                  opacity: badge.unlocked ? 1 : 0.72,
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ minHeight: 190, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: badge.unlocked ? `${badge.tone}.lighter` : 'background.default',
                        color: badge.unlocked ? `${badge.tone}.main` : 'text.secondary',
                      }}
                    >
                      {badge.icon}
                    </Box>
                    <Chip
                      label={badge.unlocked ? 'Unlocked' : 'Locked'}
                      color={badge.unlocked ? badge.tone : 'default'}
                      size="small"
                      variant={badge.unlocked ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      {badge.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {badge.description}
                    </Typography>
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                        Progress
                      </Typography>
                      <Typography variant="caption" sx={{ color: badge.unlocked ? `${badge.tone}.main` : 'text.secondary', fontWeight: 900 }}>
                        {badge.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={badge.progress}
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: 'rgba(15,81,50,0.08)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 999,
                          backgroundColor: badge.unlocked ? `${badge.tone}.main` : 'text.disabled',
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Snackbar
        open={Boolean(exportMessage)}
        autoHideDuration={2500}
        onClose={() => setExportMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" icon={<FileDownloadIcon />} onClose={() => setExportMessage(null)}>
          {exportMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
