'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  useTheme
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';

export default function StatsPage() {
  const theme = useTheme();
  
  // Read all data sorted by date descending
  const dailyLogs = useLiveQuery(() => db.dailyLogs.orderBy('date').reverse().toArray());

  // Generate data for the last 7 days
  const chartData = React.useMemo(() => {
    if (!dailyLogs) return [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const logForDay = dailyLogs.find(log => log.date === dateStr);
      data.push({
        name: dayName,
        date: dateStr,
        paras: logForDay ? logForDay.parasRead : 0
      });
    }
    return data;
  }, [dailyLogs]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
      <Typography variant="h5" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Statistics & History
      </Typography>

      {/* Weekly Progress Chart */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Weekly Progress (Paras)
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="paras" name="Paras Read" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Full History Table */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Full History
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Paras</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pages</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sajdahs</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Sync</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyLogs?.map((row) => (
                <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {row.date}
                  </TableCell>
                  <TableCell align="right">{row.parasRead}</TableCell>
                  <TableCell align="right">{row.pagesRead}</TableCell>
                  <TableCell align="right">{row.sajdahsDone}</TableCell>
                  <TableCell align="center">
                    {row.isSynced ? (
                      <CloudDoneIcon color="primary" fontSize="small" titleAccess="Synced to cloud" />
                    ) : (
                      <CloudOffIcon color="disabled" fontSize="small" titleAccess="Not synced yet" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!dailyLogs?.length && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No logs found. Start reading to see your history here.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
