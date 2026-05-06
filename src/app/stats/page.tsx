'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/hafizDB';
import { useHafizStore } from '@/store/useHafizStore';
import { startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, endOfWeek, format, parseISO } from 'date-fns';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import StarsIcon from '@mui/icons-material/Stars';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

export default function AdvancedStatsPage() {
  const theme = useTheme();
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray());
  const { totalKhatams, lastPara, userEmail } = useHafizStore();
  const [remoteDaily, setRemoteDaily] = useState<Array<{ date: string; parasRead: number; endPara: number; endPage: number }> | null>(null);

  const PAGE_PER_PARA = 20;
  const TOTAL_PARAS = 30;

  const calcDailyReads = useCallback((logs: Array<{ date: string; endPara: number; endPage: number }>) => {
    const toParaUnits = (para: number, page: number) => para + page / PAGE_PER_PARA;
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
  }, [TOTAL_PARAS]);

  useEffect(() => {
    if (!userEmail || typeof window === 'undefined' || !navigator.onLine) return;

    const controller = new AbortController();

    fetch(`/api/stats?email=${encodeURIComponent(userEmail)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setRemoteDaily(data.daily || null);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [userEmail]);

  const availableMonths = useMemo(() => {
    const localDaily = dailyLogs ? calcDailyReads(dailyLogs) : [];
    const dailySource = remoteDaily ?? localDaily;

    const months = Array.from(
      new Set(dailySource.map(entry => entry.date.slice(0, 7)))
    ).sort((a, b) => a.localeCompare(b));

    return months.length > 0 ? months : [format(new Date(), 'yyyy-MM')];
  }, [dailyLogs, remoteDaily, calcDailyReads]);

  useEffect(() => {
    // Initialize selectedMonth if it's not in availableMonths  
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      const lastMonth = availableMonths[availableMonths.length - 1];
      // Only set if different to avoid infinite loops
      if (lastMonth && lastMonth !== selectedMonth) {
        // Use microtask to defer setState and avoid cascading renders
        Promise.resolve().then(() => setSelectedMonth(lastMonth));
      }
    }
    // Intentionally omitting selectedMonth from deps to prevent cascading, covered by guard clause
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableMonths]);

  // Summary Logic
  const statsSummary = useMemo(() => {
    const localDaily = dailyLogs ? calcDailyReads(dailyLogs) : [];
    const dailySource = remoteDaily ?? localDaily;

    const filteredDaily = dailySource.filter(log => log.date.startsWith(selectedMonth));

    if (!dailySource || dailySource.length === 0 || filteredDaily.length === 0) {
      return { avg: 0, sajdahs: 0, totalParas: 0, daysLogged: 0 };
    }

    const totalParas = filteredDaily.reduce((acc, log) => acc + log.parasRead, 0);
    const avg = (totalParas / filteredDaily.length).toFixed(1);

    const sajdahs = dailyLogs
      ? dailyLogs
          .filter(log => log.date.startsWith(selectedMonth))
          .reduce((acc, log) => acc + (log.sajdahsDone || 0), 0)
      : 0;

    return { avg, sajdahs, totalParas, daysLogged: filteredDaily.length };
  }, [dailyLogs, remoteDaily, selectedMonth, calcDailyReads]);

  // Chart Data
  const chartData = useMemo(() => {
    const localDaily = dailyLogs ? calcDailyReads(dailyLogs) : [];
    const dailySource = remoteDaily ?? localDaily;

    if (!dailySource) return [];

    const dailyForMonth = dailySource.filter(log => log.date.startsWith(selectedMonth));
    const dailyByDate = new Map(dailyForMonth.map(log => [log.date, log]));

    const sumForRange = (start: Date, end: Date) => {
      const days = eachDayOfInterval({ start, end });
      return days.reduce((acc, day) => {
        const log = dailyByDate.get(format(day, 'yyyy-MM-dd'));
        return acc + (log ? log.parasRead : 0);
      }, 0);
    };

    if (timeFilter === 'weekly') {
      const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
      const monthEnd = endOfMonth(monthStart);
      const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd });

      return weekStarts.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart) > monthEnd ? monthEnd : endOfWeek(weekStart);
        const total = sumForRange(weekStart, weekEnd);

        return {
          name: `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}`,
          paras: Number(total.toFixed(2))
        };
      });
    }

    if (timeFilter === 'monthly') {
      const monthTotals = new Map<string, number>();

      for (const log of dailySource) {
        const month = log.date.slice(0, 7);
        monthTotals.set(month, (monthTotals.get(month) || 0) + log.parasRead);
      }

      return Array.from(monthTotals.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({
          name: format(parseISO(`${month}-01`), 'MMM yy'),
          paras: Number(total.toFixed(2))
        }));
    }

    const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const log = dailyByDate.get(format(day, 'yyyy-MM-dd'));
      return {
        name: format(day, 'dd'),
        paras: log ? log.parasRead : 0
      };
    });
  }, [dailyLogs, remoteDaily, selectedMonth, timeFilter, calcDailyReads]);

  // Cumulative Chart Data
  const cumulativeChartData = useMemo(() => {
    const localDaily = dailyLogs ? calcDailyReads(dailyLogs) : [];
    const dailySource = remoteDaily ?? localDaily;

    if (!dailySource) return [];

    const dailyForMonth = dailySource.filter(log => log.date.startsWith(selectedMonth));
    let cumulativeParas = 0;

    if (timeFilter === 'monthly') {
      const monthTotals = new Map<string, number>();
      for (const log of dailySource) {
        const month = log.date.slice(0, 7);
        monthTotals.set(month, (monthTotals.get(month) || 0) + log.parasRead);
      }
      let cumulative = 0;
      return Array.from(monthTotals.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => {
          cumulative += total;
          return {
            name: format(parseISO(`${month}-01`), 'MMM yy'),
            cumulative: Number(cumulative.toFixed(2))
          };
        });
    }

    const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dailyByDate = new Map(dailyForMonth.map(log => [log.date, log]));

    return days.map(day => {
      const log = dailyByDate.get(format(day, 'yyyy-MM-dd'));
      if (log) cumulativeParas += log.parasRead;
      return {
        name: format(day, 'dd'),
        cumulative: Number(cumulativeParas.toFixed(2))
      };
    });
  }, [dailyLogs, remoteDaily, selectedMonth, timeFilter, calcDailyReads]);

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
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>TOTAL PARAS</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{statsSummary.totalParas.toFixed(1)}</Typography>
              <TimelineIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.1 }} />
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
        <Grid size={6}>
          <Card sx={{
            color: '#fff',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, #166534 0%, #0F5132 100%)',
            border: '1px solid rgba(214, 178, 94, 0.25)'
          }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>MONTHLY SAJDAHS</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{statsSummary.sajdahs}</Typography>
              <StarsIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={6}>
          <Card sx={{
            color: '#fff',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, #0F4C81 0%, #0B3056 100%)',
            border: '1px solid rgba(214, 178, 94, 0.25)'
          }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>DAYS LOGGED</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{statsSummary.daysLogged}</Typography>
              <TimelineIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Activity Trends Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'rgba(214, 178, 94, 0.3)',
            bgcolor: 'background.paper',
            height: '100%'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>📊 Activity Trends</Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="month-select-label">Month</InputLabel>
                <Select
                  labelId="month-select-label"
                  value={selectedMonth}
                  label="Month"
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  {availableMonths.map((month) => (
                    <MenuItem key={month} value={month}>
                      {format(parseISO(`${month}-01`), 'MMM yyyy')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Box sx={{ height: 350, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.secondary.main} stopOpacity={1}/>
                      <stop offset="100%" stopColor={theme.palette.secondary.main} stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(15, 81, 50, 0.08)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                      backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                      padding: '12px 16px'
                    }}
                    labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                    formatter={(value) => {
                      const numValue = typeof value === 'number' ? value : undefined;
                      return [numValue ? numValue.toFixed(2) : String(value), 'Paras'];
                    }}
                    cursor={{ fill: 'rgba(15, 81, 50, 0.05)' }}
                  />
                  <Bar 
                    dataKey="paras" 
                    fill="url(#barGradient)" 
                    radius={[12, 12, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Cumulative Progress Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'rgba(15, 81, 50, 0.3)',
            bgcolor: 'background.paper',
            height: '100%'
          }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>📈 Cumulative Progress</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Total Paras Read Over Time
              </Typography>
            </Box>
            <Box sx={{ height: 350, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(15, 81, 50, 0.08)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                      backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                      padding: '12px 16px'
                    }}
                    labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                    formatter={(value) => {
                      const numValue = typeof value === 'number' ? value : undefined;
                      return [numValue ? numValue.toFixed(2) : String(value), 'Total Paras'];
                    }}
                    cursor={{ fill: 'rgba(15, 81, 50, 0.05)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={3}
                    dot={{ fill: theme.palette.primary.main, r: 4 }}
                    activeDot={{ r: 6, fill: theme.palette.primary.main }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
