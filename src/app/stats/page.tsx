'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Grid, 
  ToggleButton, 
  ToggleButtonGroup,
  CircularProgress,
  useTheme,
  IconButton
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/hafizDB';
import { useHafizStore } from '@/store/useHafizStore';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, subDays } from 'date-fns';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import StarsIcon from '@mui/icons-material/Stars';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

export default function AdvancedStatsPage() {
  const theme = useTheme();
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray());
  const { totalKhatams, totalSajdahsDone, lastPara, userEmail } = useHafizStore();
  const [remoteDaily, setRemoteDaily] = useState<Array<{ date: string; parasRead: number; endPara: number; endPage: number }> | null>(null);
  const [remoteMonthly, setRemoteMonthly] = useState<Array<{ month: string; parasRead: number }> | null>(null);

  const PAGE_PER_PARA = 20;
  const TOTAL_PARAS = 30;

  const toParaUnits = (para: number, page: number) => para + page / PAGE_PER_PARA;

  const calcDailyReads = (logs: Array<{ date: string; endPara: number; endPage: number }>) => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    let prevUnits: number | null = null;

    return sorted.map((log) => {
      const currentUnits = toParaUnits(log.endPara, log.endPage);
      let delta = prevUnits === null ? currentUnits : currentUnits - prevUnits;

      if (prevUnits !== null && delta < 0) {
        delta = (TOTAL_PARAS - prevUnits) + currentUnits;
      }

      if (delta < 0) delta = 0;

      prevUnits = currentUnits;

      return {
        date: log.date,
        parasRead: Number(delta.toFixed(2)),
        endPara: log.endPara,
        endPage: log.endPage
      };
    });
  };

  const calcMonthlyTotals = (daily: Array<{ date: string; parasRead: number }>) => {
    const totals = new Map<string, number>();

    for (const entry of daily) {
      const month = entry.date.slice(0, 7);
      totals.set(month, (totals.get(month) || 0) + entry.parasRead);
    }

    return Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, parasRead]) => ({
        month,
        parasRead: Number(parasRead.toFixed(2))
      }));
  };

  useEffect(() => {
    if (!userEmail || typeof window === 'undefined' || !navigator.onLine) return;

    const controller = new AbortController();

    fetch(`/api/stats?email=${encodeURIComponent(userEmail)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setRemoteDaily(data.daily || null);
          setRemoteMonthly(data.monthly || null);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [userEmail]);

  // Calendar Logic (Current Month)
  const monthDays = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  const getLogForDay = (date: Date) => {
    if (!dailyLogs) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return dailyLogs.find(log => log.date === dateStr);
  };

  // Summary Logic
  const statsSummary = useMemo(() => {
    const localDaily = dailyLogs ? calcDailyReads(dailyLogs) : [];
    const dailySource = remoteDaily ?? localDaily;

    if (!dailySource || dailySource.length === 0) return { avg: 0, streak: 0, sajdahs: 0, totalPages: 0 };

    const totalParas = dailySource.reduce((acc, log) => acc + log.parasRead, 0);
    const avg = (totalParas / dailySource.length).toFixed(1);

    const thisMonth = format(new Date(), 'yyyy-MM');
    const sajdahs = dailyLogs
      ? dailyLogs
          .filter(log => log.date.startsWith(thisMonth))
          .reduce((acc, log) => acc + (log.sajdahsDone || 0), 0)
      : 0;

    const totalPages = dailyLogs ? dailyLogs.reduce((acc, log) => acc + (log.endPage || 0), 0) : 0;

    return { avg, streak: 0, sajdahs, totalPages };
  }, [dailyLogs, remoteDaily]);

  // Chart Data
  const chartData = useMemo(() => {
    const localDaily = dailyLogs ? calcDailyReads(dailyLogs) : [];
    const dailySource = remoteDaily ?? localDaily;

    if (!dailySource) return [];

    const getDailyForDate = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return dailySource.find(log => log.date === dateStr);
    };

    if (timeFilter === 'daily') {
      const end = new Date();
      const start = subDays(end, 13);
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const log = getDailyForDate(day);
        return {
          name: format(day, 'dd'),
          paras: log ? log.parasRead : 0
        };
      });
    }

    if (timeFilter === 'weekly') {
      const start = startOfWeek(new Date());
      const end = endOfWeek(new Date());
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const log = getDailyForDate(day);
        return {
          name: format(day, 'EEE'),
          paras: log ? log.parasRead : 0
        };
      });
    }

    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const log = getDailyForDate(day);
      return {
        name: format(day, 'dd'),
        paras: log ? log.parasRead : 0
      };
    });
  }, [dailyLogs, remoteDaily, timeFilter]);

  const monthlyTotals = useMemo(() => {
    if (remoteMonthly) return remoteMonthly;
    const localDaily = dailyLogs ? calcDailyReads(dailyLogs) : [];
    return calcMonthlyTotals(localDaily);
  }, [dailyLogs, remoteMonthly]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 10, pt: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', textAlign: 'center', fontFamily: 'var(--font-amiri)', letterSpacing: 0.5 }}>
        Strength Analysis
      </Typography>

      {/* Summary Tiles */}
      <Grid container spacing={2}>
        <Grid size={6}>
          <Card sx={{
            color: '#fff',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, #0F5132 0%, #1F7A55 60%, #0F5132 100%)',
            border: '1px solid rgba(214, 178, 94, 0.35)'
          }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>AVG PARAS / DAY</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{statsSummary.avg}</Typography>
              <TrendingUpIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={6}>
          <Card sx={{
            color: '#fff',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, #1F9D7A 0%, #0F5132 100%)',
            border: '1px solid rgba(214, 178, 94, 0.25)'
          }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>MONTHLY SAJDAHS</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{statsSummary.sajdahs}</Typography>
              <StarsIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card sx={{
            color: '#1B1407',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            backgroundImage: 'linear-gradient(135deg, #F0D38B 0%, #D6B25E 55%, #B28A3E 100%)',
            border: '1px solid rgba(15, 81, 50, 0.2)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <AutoStoriesIcon fontSize="large" />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>TOTAL KHATAMS</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalKhatams}</Typography>
              </Box>
            </Box>
            <Box sx={{ p: 2, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>CURRENT PARA</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{lastPara}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly Progress Calendar */}
      <Paper elevation={0} sx={{
        p: 3,
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'rgba(214, 178, 94, 0.3)',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon /> Reading Consistency
        </Typography>
        <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
          {monthDays.map((day, i) => {
            const log = getLogForDay(day);
            const progress = log ? (log.endPara / 30) * 100 : 0;
            return (
              <Grid size={1.7} key={i}>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 45 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={40}
                    thickness={3}
                    sx={{ color: 'rgba(15, 81, 50, 0.08)', position: 'absolute' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={progress}
                    size={40}
                    thickness={3}
                    sx={{ 
                      position: 'absolute',
                      color: progress > 0 ? 'primary.main' : 'transparent'
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: isSameDay(day, new Date()) ? 800 : 500,
                      color: isSameDay(day, new Date()) ? 'primary.main' : 'text.secondary'
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  {progress > 0 && (
                    <Box sx={{ position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Monthly Totals */}
      <Paper elevation={0} sx={{
        p: 3,
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'rgba(214, 178, 94, 0.3)',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'primary.main' }}>
          Monthly Totals (Paras Read)
        </Typography>
        <Box sx={{ height: 280, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTotals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15, 81, 50, 0.08)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(15, 81, 50, 0.06)' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(214, 178, 94, 0.3)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
              />
              <Bar dataKey="parasRead" fill={theme.palette.secondary.main} radius={[8, 8, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Interactive Activity Chart */}
      <Paper elevation={0} sx={{
        p: 3,
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'rgba(214, 178, 94, 0.3)',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>Activity Trends</Typography>
          <ToggleButtonGroup
            value={timeFilter}
            exclusive
            onChange={(e, val) => val && setTimeFilter(val)}
            size="small"
            color="primary"
            sx={{ 
              '& .MuiToggleButton-root': { 
                borderRadius: '8px', 
                px: 2,
                border: 'none',
                bgcolor: 'rgba(15, 81, 50, 0.08)',
                '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', boxShadow: '0 6px 16px rgba(15, 81, 50, 0.2)' }
              } 
            }}
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {timeFilter === 'monthly' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorParas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15, 81, 50, 0.08)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(214, 178, 94, 0.3)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
                />
                <Area type="monotone" dataKey="paras" stroke={theme.palette.secondary.main} strokeWidth={4} fillOpacity={1} fill="url(#colorParas)" />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15, 81, 50, 0.08)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(15, 81, 50, 0.06)' }} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(214, 178, 94, 0.3)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="paras" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
