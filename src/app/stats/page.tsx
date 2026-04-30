'use client';

import React, { useState, useMemo } from 'react';
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
  useTheme
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
  CartesianGrid 
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/hafizDB';
import { useHafizStore } from '@/store/useHafizStore';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';

export default function AdvancedStatsPage() {
  const theme = useTheme();
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray());
  const { totalSajdahsDone } = useHafizStore();

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
    if (!dailyLogs || dailyLogs.length === 0) return { avg: 0, streak: 0, sajdahs: 0 };
    
    // Average Paras/Day (last 30 days)
    const totalParas = dailyLogs.reduce((acc, log) => acc + (log.endPara || 0), 0);
    const avg = (totalParas / dailyLogs.length).toFixed(1);

    // Sajdahs this month
    const thisMonth = format(new Date(), 'yyyy-MM');
    const sajdahs = dailyLogs
      .filter(log => log.date.startsWith(thisMonth))
      .reduce((acc, log) => acc + (log.sajdahsDone || 0), 0);

    return { avg, streak: 0, sajdahs }; // Streak logic omitted for brevity but can be calculated
  }, [dailyLogs]);

  // Chart Data
  const chartData = useMemo(() => {
    if (!dailyLogs) return [];
    if (timeFilter === 'weekly') {
      const start = startOfWeek(new Date());
      const end = endOfWeek(new Date());
      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const log = getLogForDay(day);
        return {
          name: format(day, 'EEE'),
          paras: log ? log.endPara : 0
        };
      });
    } else {
      // Monthly Cumulative
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const days = eachDayOfInterval({ start, end });
      let cumulative = 0;
      return days.map(day => {
        const log = getLogForDay(day);
        cumulative += log ? log.endPara : 0;
        return {
          name: format(day, 'dd'),
          paras: cumulative
        };
      });
    }
  }, [dailyLogs, timeFilter]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 10 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center', mt: 2 }}>
        Advanced Analytics
      </Typography>

      {/* Summary Tiles */}
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: 'primary.main', color: '#fff', textAlign: 'center' }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="caption">Avg Paras/Day</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{statsSummary.avg}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: 'secondary.main', color: '#fff', textAlign: 'center' }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="caption">Monthly Sajdahs</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{statsSummary.sajdahs}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: 'primary.dark', color: '#fff', textAlign: 'center' }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="caption">Streak</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{statsSummary.streak}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Small Calendar with Progress Rings */}
      <Paper sx={{ p: 2, borderRadius: '24px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
          Monthly Progress
        </Typography>
        <Grid container spacing={1}>
          {monthDays.map((day, i) => {
            const log = getLogForDay(day);
            const progress = log ? (log.endPara / 30) * 100 : 0;
            return (
              <Grid item xs={1.7} key={i}>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={36}
                    thickness={4}
                    sx={{ color: 'rgba(0,0,0,0.05)', position: 'absolute' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={progress}
                    size={36}
                    thickness={4}
                    color="secondary"
                    sx={{ position: 'absolute' }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal' }}>
                    {format(day, 'd')}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Filtered Charts */}
      <Paper sx={{ p: 2, borderRadius: '24px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Charts</Typography>
          <ToggleButtonGroup
            value={timeFilter}
            exclusive
            onChange={(e, val) => val && setTimeFilter(val)}
            size="small"
            color="secondary"
          >
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            {timeFilter === 'weekly' ? (
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(217, 119, 6, 0.1)' }} />
                <Bar dataKey="paras" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="paras" stroke={theme.palette.secondary.main} strokeWidth={3} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
