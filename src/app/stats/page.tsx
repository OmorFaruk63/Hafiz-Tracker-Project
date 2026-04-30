'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/hafizDB';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useHafizStore } from '@/store/useHafizStore';

export default function StatsPage() {
  const theme = useTheme();
  const { totalKhatams, lastPara } = useHafizStore();
  const dailyLogs = useLiveQuery(() => db.dailyLogs.orderBy('date').reverse().toArray());

  // Heatmap Data (Pages Read = Paras * 20 + Pages)
  const heatmapData = React.useMemo(() => {
    if (!dailyLogs) return [];
    return dailyLogs.map(log => ({
      date: log.date,
      count: (log.endPara * 20) + log.endPage,
    }));
  }, [dailyLogs]);

  // Consistency Score (Daily Streak)
  const streak = React.useMemo(() => {
    if (!dailyLogs || dailyLogs.length === 0) return 0;
    const sorted = [...dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let expectedDate = new Date(today);
    
    for (const log of sorted) {
      const logDate = new Date(log.date);
      logDate.setHours(0,0,0,0);
      
      const diffTime = Math.abs(expectedDate.getTime() - logDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        currentStreak++;
        expectedDate = new Date(logDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }
    return currentStreak;
  }, [dailyLogs]);

  // Khatam Progress for current month
  const khatamProgress = Math.min(100, Math.round((lastPara / 30) * 100));
  const progressData = [{ name: 'Current Khatam', progress: khatamProgress }];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4, pt: 2 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Hifz Strength
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'primary.main', color: '#fff', height: '100%', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Daily Streak</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>{streak} <span style={{fontSize: '1rem', fontWeight: 'normal'}}>days</span></Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'secondary.main', color: '#fff', height: '100%', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Khatams</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>{totalKhatams}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Heatmap */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Contribution Calendar
        </Typography>
        <Box sx={{ width: '100%', mt: 2, overflowX: 'auto', pb: 1 }}>
          <Box sx={{ minWidth: 600 }}>
            <CalendarHeatmap
              startDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
              endDate={new Date()}
              values={heatmapData}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-github-${value.count > 0 ? (value.count > 300 ? 4 : value.count > 150 ? 3 : value.count > 50 ? 2 : 1) : 0}`;
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Khatam Progress */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Khatam Progress
        </Typography>
        <Box sx={{ width: '100%', height: 120, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="name" type="category" hide />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="progress" fill={theme.palette.secondary.main} radius={[4, 4, 4, 4]} label={{ position: 'right', formatter: (val: number) => `${val}%`, fill: theme.palette.text.primary, fontWeight: 'bold' }} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
