"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Grid,
  Slider,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  LinearProgress,
  MenuItem,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import SyncIcon from "@mui/icons-material/Sync";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import StarsIcon from "@mui/icons-material/Stars";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useHafizStore } from "@/store/useHafizStore";
import { useThemeContext } from "@/components/AppThemeProvider";
import { useSyncManager } from "@/hooks/useSyncManager";
import { useSajdahDebt } from "@/hooks/useSajdahDebt";
import { db, type DailyLog } from "@/lib/hafizDB";
import SaveIcon from "@mui/icons-material/Save";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import FlagIcon from "@mui/icons-material/Flag";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TuneIcon from "@mui/icons-material/Tune";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";

type CloudLog = {
  date: string;
  endPara: number;
  endPage: number;
  sajdahsDone: number;
};

// Zod Schema for validation
const LogSchema = z.object({
  para: z.number().int().min(1).max(30),
  page: z.number().int().min(0).max(20),
});

const PAGES_PER_PARA = 20;
const TOTAL_READING_PAGES = 600;

const toDateKey = (date: Date) => date.toISOString().split("T")[0];

const shiftDateKey = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
};

const daysBetweenInclusive = (startKey: string, endKey: string) => {
  const start = new Date(`${startKey}T00:00:00.000Z`).getTime();
  const end = new Date(`${endKey}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.floor((end - start) / 86400000) + 1);
};

const toReadingPages = (para: number, page: number) => (para - 1) * PAGES_PER_PARA + page;

const getReadingDeltaPages = (current: DailyLog, previous?: DailyLog) => {
  const currentPages = toReadingPages(current.endPara, current.endPage);
  const previousPages = previous ? toReadingPages(previous.endPara, previous.endPage) : 0;
  const delta = currentPages - previousPages;

  return delta >= 0 ? delta : TOTAL_READING_PAGES - previousPages + currentPages;
};

export default function Home() {
  const { mode, toggleTheme } = useThemeContext();
  const {
    lastPara,
    lastPage,
    setLastReadPosition,
    startNewKhatam,
    totalKhatams,
    userEmail,
    setUserEmail,
    dailyGoal,
    setDailyGoal,
  } = useHafizStore();
  const { isSyncing, lastSyncTime, syncNow, unsyncedCount } = useSyncManager();
  const { remainingDebt } = useSajdahDebt();
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray());

  const [paraInput, setParaInput] = useState<number>(1);
  const [pageInput, setPageInput] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [khatamToastOpen, setKhatamToastOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [emailInput, setEmailInput] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(() => !userEmail);
  const [isRestoring, setIsRestoring] = useState(false);

  const todayGoal = useMemo(() => {
    const goalPages = dailyGoal.unit === "paras" ? dailyGoal.amount * PAGES_PER_PARA : dailyGoal.amount;
    const today = toDateKey(new Date());
    const logs = dailyLogs ? [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date)) : [];
    const todayLog = logs.find((log) => log.date === today);
    const previousLog = [...logs].reverse().find((log) => log.date < today);

    const progressPages = todayLog ? getReadingDeltaPages(todayLog, previousLog) : 0;

    const progressValue = dailyGoal.unit === "paras" ? progressPages / PAGES_PER_PARA : progressPages;
    const remainingPages = Math.max(goalPages - progressPages, 0);
    const remainingValue = dailyGoal.unit === "paras" ? remainingPages / PAGES_PER_PARA : remainingPages;
    const progressPercent = goalPages > 0 ? Math.min(100, Math.round((progressPages / goalPages) * 100)) : 0;

    return {
      progressPages,
      progressValue,
      remainingValue,
      progressPercent,
      isComplete: goalPages > 0 && progressPages >= goalPages,
    };
  }, [dailyGoal.amount, dailyGoal.unit, dailyLogs]);

  const monthlyProgress = useMemo(() => {
    const today = toDateKey(new Date());
    const monthKey = today.slice(0, 7);
    const logs = dailyLogs ? [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date)) : [];
    const monthPages = logs.reduce((total, log, index) => {
      if (!log.date.startsWith(monthKey)) return total;
      return total + getReadingDeltaPages(log, logs[index - 1]);
    }, 0);

    return {
      pages: monthPages,
      paras: monthPages / PAGES_PER_PARA,
      percent: Math.min(100, Math.round((monthPages / TOTAL_READING_PAGES) * 100)),
    };
  }, [dailyLogs]);

  const streakStats = useMemo(() => {
    const logs = dailyLogs ? [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date)) : [];
    const activeDates = new Set<string>();

    logs.forEach((log, index) => {
      const previousLog = logs[index - 1];
      if (getReadingDeltaPages(log, previousLog) > 0) {
        activeDates.add(log.date);
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

    const monthKey = today.slice(0, 7);
    const activeDaysThisMonth = sortedActiveDates.filter((date) => date.startsWith(monthKey)).length;
    const elapsedDaysThisMonth = daysBetweenInclusive(`${monthKey}-01`, today);
    const missedDaysThisMonth = Math.max(elapsedDaysThisMonth - activeDaysThisMonth, 0);

    return {
      currentStreak,
      bestStreak,
      missedDaysThisMonth,
      activeDaysThisMonth,
      currentStreakLabel: currentAnchor === today ? "Active today" : currentAnchor === yesterday ? "Through yesterday" : "Start today",
    };
  }, [dailyLogs]);

  const goalFormatter = (value: number) => {
    if (dailyGoal.unit === "paras") return Number(value.toFixed(2)).toString();
    return Math.round(value).toString();
  };

  const syncStatus = useMemo(() => {
    if (!isOnline) {
      return {
        label: "Offline",
        value: "Local only",
        suffix: "",
        helper: "Saved on this device",
        icon: <CloudOffIcon />,
        color: "error.main",
        bg: "rgba(255,86,48,0.12)",
      };
    }

    if (isSyncing) {
      return {
        label: "Sync Status",
        value: "Syncing",
        suffix: "",
        helper: "Updating backup",
        icon: <SyncIcon sx={{ animation: "spin 2s linear infinite" }} />,
        color: "primary.main",
        bg: "rgba(15,81,50,0.12)",
      };
    }

    if (unsyncedCount > 0) {
      return {
        label: "Sync Status",
        value: `${unsyncedCount} pending`,
        suffix: "",
        helper: "Tap sync icon above",
        icon: <SyncIcon />,
        color: "warning.dark",
        bg: "rgba(255,171,0,0.14)",
      };
    }

    return {
      label: "Sync Status",
      value: "Backed up",
      suffix: "",
      helper: lastSyncTime ? lastSyncTime.toLocaleTimeString() : "Ready",
      icon: <CloudDoneIcon />,
      color: "success.main",
      bg: "rgba(34,197,94,0.12)",
    };
  }, [isOnline, isSyncing, lastSyncTime, unsyncedCount]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleParaClick = (p: number) => {
    if (p === 30) {
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#1877F2", "#8E33FF", "#00B8D9"],
        });
      });
      startNewKhatam();
      setParaInput(1);
      setPageInput(0);
      setKhatamToastOpen(true);
      return;
    }
    setParaInput(p);
    if (p === lastPara) {
      setPageInput(lastPage);
    } else {
      setPageInput(0);
    }
  };

  const handleSave = async () => {
    try {
      const validData = LogSchema.parse({ para: paraInput, page: pageInput });
      setErrorMsg(null);

      const isKhatam = validData.para === 30 && validData.page === 20;

      if (isKhatam) {
        import("canvas-confetti").then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#1877F2", "#8E33FF", "#00B8D9"],
          });
        });
        startNewKhatam();
        setParaInput(1);
        setPageInput(0);
        setKhatamToastOpen(true);
      } else {
        setLastReadPosition(validData.para, validData.page);
        setSnackbarOpen(true);
      }

      const today = new Date().toISOString().split("T")[0];
      const existing = await db.dailyLogs.where("date").equals(today).first();

      if (existing?.id) {
        await db.dailyLogs.update(existing.id, {
          endPara: validData.para,
          endPage: validData.page,
          sajdahsDone: existing.sajdahsDone ?? 0,
          isSynced: false,
        });
      } else {
        await db.dailyLogs.add({
          date: today,
          endPara: validData.para,
          endPage: validData.page,
          sajdahsDone: 0,
          isSynced: false,
        });
      }

      // Trigger sync immediately if online
      syncNow();
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrorMsg("Invalid input: Para must be 1-30 and Page 0-20.");
      } else {
        console.error("Failed to log session", error);
      }
    }
  };

  const handleSetEmail = () => {
    if (z.string().email().safeParse(emailInput).success) {
      setUserEmail(emailInput);
      setEmailDialogOpen(false);
    } else {
      setErrorMsg("Please enter a valid email address.");
    }
  };

  const handleGoalAmountChange = (value: string) => {
    const nextAmount = Number(value);

    if (Number.isFinite(nextAmount) && nextAmount > 0) {
      setDailyGoal({ ...dailyGoal, amount: nextAmount });
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!emailInput || !z.string().email().safeParse(emailInput).success) {
      setErrorMsg("Enter a valid email first.");
      return;
    }

    try {
      setIsRestoring(true);
      const res = await fetch(`/api/sync?email=${emailInput}`);
      const data = await res.json();

      if (data.success && data.logs.length > 0) {
        // Clear local logs and import from cloud
        await db.dailyLogs.clear();
        await db.dailyLogs.bulkAdd(
          (data.logs as CloudLog[]).map((l) => ({
            date: l.date,
            endPara: l.endPara,
            endPage: l.endPage,
            sajdahsDone: l.sajdahsDone,
            isSynced: true,
          })),
        );

        // Update Zustand with latest log
        const latest = data.logs[0];
        setLastReadPosition(latest.endPara, latest.endPage);
        setParaInput(latest.endPara);
        setPageInput(latest.endPage);
        setUserEmail(emailInput);
        setEmailDialogOpen(false);
        setSnackbarOpen(true);
      } else {
        setErrorMsg("No backup found for this email.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to restore data.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2, pb: 4 }}
    >
      {/* Dashboard */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: "text.primary",
                fontSize: { xs: "1.7rem", sm: "2.125rem" },
              }}
            >
              Hafiz Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
              {userEmail ? `Synced with ${userEmail}` : "Offline-first Quran progress tracker"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Account and cloud backup">
              <IconButton
                onClick={() => setEmailDialogOpen(true)}
                color="primary"
                sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}
              >
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
            {unsyncedCount > 0 && isOnline && (
              <Tooltip title={`Sync ${unsyncedCount} pending logs`}>
                <IconButton
                  onClick={() => syncNow()}
                  color="primary"
                  sx={{ bgcolor: "primary.lighter", border: "1px solid", borderColor: "primary.light" }}
                >
                  <SyncIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Theme">
              <IconButton
                onClick={toggleTheme}
                color="primary"
                sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}
              >
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 2.25, sm: 3 },
            borderRadius: 2,
            color: "#fff",
            background:
              "linear-gradient(135deg, #0F5132 0%, #1F7A55 56%, #D6B25E 150%)",
            border: "1px solid rgba(214,178,94,0.28)",
            "&::before": {
              content: '""',
              position: "absolute",
              right: { xs: -56, sm: -24 },
              top: { xs: -74, sm: -56 },
              width: { xs: 180, sm: 230 },
              height: { xs: 180, sm: 230 },
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "inset 36px -24px 0 rgba(255,255,255,0.08)",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.82, fontWeight: 800 }}>
              Today&apos;s Journey
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontWeight: 900,
                lineHeight: 1,
                fontSize: { xs: "2.35rem", sm: "3.25rem" },
              }}
            >
              {todayGoal.progressPages}
              <Typography component="span" sx={{ ml: 1, opacity: 0.78, fontWeight: 800 }}>
                pages
              </Typography>
            </Typography>
            <Typography sx={{ mt: 1, opacity: 0.86, maxWidth: 520 }}>
              Last stop: Para {lastPara}, Page {lastPage}. Keep the rhythm gentle and steady.
            </Typography>

            <Grid container spacing={1.5} sx={{ mt: 2.5 }}>
              {[
                { label: "Khatams", value: totalKhatams, icon: <AutoStoriesIcon /> },
                { label: "Goal", value: `${todayGoal.progressPercent}%`, icon: <FlagIcon /> },
                { label: "Streak", value: `${streakStats.currentStreak}d`, icon: <LocalFireDepartmentIcon /> },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 4, sm: 3 }}>
                  <Box
                    sx={{
                      p: { xs: 1.25, sm: 1.5 },
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <Box sx={{ display: "flex", color: "secondary.light", mb: 0.5 }}>
                      {item.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{item.value}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.78 }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>

        <Grid container spacing={2}>
          {[
            {
              label: "Today's Reading",
              value: `${todayGoal.progressPages}`,
              suffix: todayGoal.progressPages === 1 ? "page" : "pages",
              helper: todayGoal.isComplete ? "Daily goal complete" : `${goalFormatter(todayGoal.remainingValue)} ${dailyGoal.unit} left`,
              icon: <AutoStoriesIcon />,
              color: "primary.main",
              bg: "rgba(15,81,50,0.12)",
              progress: todayGoal.progressPercent,
            },
            {
              label: "Last Read",
              value: `Para ${lastPara}`,
              suffix: `Page ${lastPage}`,
              helper: "Saved position",
              icon: <TaskAltIcon />,
              color: "secondary.dark",
              bg: "rgba(214,178,94,0.14)",
            },
            {
              label: "Sajdah Debt",
              value: remainingDebt,
              suffix: remainingDebt === 1 ? "sajdah" : "sajdahs",
              helper: remainingDebt > 0 ? "Pending to complete" : "All clear",
              icon: <PendingActionsIcon />,
              color: remainingDebt > 0 ? "warning.dark" : "success.main",
              bg: remainingDebt > 0 ? "rgba(255,171,0,0.12)" : "rgba(34,197,94,0.12)",
            },
            {
              label: "Monthly Progress",
              value: Number(monthlyProgress.paras.toFixed(1)),
              suffix: "paras",
              helper: `${monthlyProgress.pages} pages this month`,
              icon: <QueryStatsIcon />,
              color: "info.main",
              bg: "rgba(12,68,174,0.1)",
              progress: monthlyProgress.percent,
            },
            {
              label: "Current Streak",
              value: streakStats.currentStreak,
              suffix: streakStats.currentStreak === 1 ? "day" : "days",
              helper: streakStats.currentStreakLabel,
              icon: <LocalFireDepartmentIcon />,
              color: "secondary.main",
              bg: "rgba(214,178,94,0.14)",
            },
            {
              label: "Daily Goal",
              value: `${goalFormatter(dailyGoal.amount)}`,
              suffix: dailyGoal.unit,
              helper: `${todayGoal.progressPercent}% completed`,
              icon: todayGoal.isComplete ? <TaskAltIcon /> : <FlagIcon />,
              color: todayGoal.isComplete ? "success.main" : "primary.main",
              bg: todayGoal.isComplete ? "rgba(34,197,94,0.12)" : "rgba(15,81,50,0.12)",
              progress: todayGoal.progressPercent,
            },
            syncStatus,
          ].map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, lg: item.label === "Sync Status" ? 12 : 4 }}>
              <Card
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    p: { xs: 2, sm: 2.25 },
                    minHeight: { xs: 150, sm: 166 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: item.bg,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </Box>
                    {"progress" in item && typeof item.progress === "number" && (
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900 }}>
                        {item.progress}%
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900 }}>
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.25,
                        color: "text.primary",
                        fontWeight: 900,
                        lineHeight: 1.08,
                        fontSize: { xs: "1.65rem", sm: "1.9rem" },
                      }}
                    >
                      {item.value}
                      <Typography
                        component="span"
                        sx={{
                          ml: 0.65,
                          color: "text.secondary",
                          fontWeight: 800,
                          fontSize: { xs: "0.78rem", sm: "0.86rem" },
                        }}
                      >
                        {item.suffix}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {item.helper}
                    </Typography>
                  </Box>

                  {"progress" in item && typeof item.progress === "number" && (
                    <LinearProgress
                      variant="determinate"
                      value={item.progress}
                      sx={{
                        height: 7,
                        borderRadius: 999,
                        bgcolor: "rgba(15,81,50,0.08)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          backgroundColor: item.color,
                        },
                      }}
                    />
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card
          sx={{
            border: "1px solid",
            borderColor: todayGoal.isComplete ? "success.main" : "divider",
            background:
              "linear-gradient(135deg, rgba(15,81,50,0.08), rgba(214,178,94,0.08))",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: todayGoal.isComplete ? "success.main" : "primary.main",
                    bgcolor: todayGoal.isComplete ? "success.lighter" : "primary.lighter",
                  }}
                >
                  {todayGoal.isComplete ? <TaskAltIcon /> : <FlagIcon />}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Daily Goal
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {todayGoal.isComplete
                      ? "Completed for today"
                      : `${goalFormatter(todayGoal.remainingValue)} ${dailyGoal.unit} remaining`}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                  alignItems: "center",
                }}
              >
                <TextField
                  label="Goal"
                  type="number"
                  size="small"
                  value={dailyGoal.amount}
                  onChange={(event) => handleGoalAmountChange(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      min: dailyGoal.unit === "paras" ? 0.25 : 1,
                      max: dailyGoal.unit === "paras" ? 30 : 600,
                      step: dailyGoal.unit === "paras" ? 0.25 : 1,
                    },
                  }}
                  sx={{ width: { xs: "50%", sm: 96 } }}
                />
                <TextField
                  select
                  label="Unit"
                  size="small"
                  value={dailyGoal.unit}
                  onChange={(event) =>
                    setDailyGoal({
                      unit: event.target.value as "pages" | "paras",
                      amount: dailyGoal.amount,
                    })
                  }
                  sx={{ width: { xs: "50%", sm: 120 } }}
                >
                  <MenuItem value="pages">Pages</MenuItem>
                  <MenuItem value="paras">Paras</MenuItem>
                </TextField>
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={todayGoal.progressPercent}
              sx={{
                height: 10,
                borderRadius: 999,
                bgcolor: "rgba(15,81,50,0.1)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  backgroundColor: todayGoal.isComplete ? "success.main" : "secondary.main",
                },
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1.5 }}>
              <TuneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Goal is saved on this device and updates after you save today&apos;s reading.
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      {errorMsg && (
        <Alert
          severity="error"
          onClose={() => setErrorMsg(null)}
          sx={{ borderRadius: "12px" }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Main Logging Section */}
      <Card
        sx={{ border: "none", background: "transparent", boxShadow: "none" }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <StarsIcon color="secondary" /> Where did you stop?
        </Typography>

        <Box
          sx={{
            bgcolor: "background.paper",
            p: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle2"
            gutterBottom
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Select Para (1-30)
          </Typography>
          <Grid container spacing={1}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((p) => (
              <Grid size={{ xs: 2, sm: 2, md: 1 }} key={p}>
<Button
                  variant={paraInput === p ? "contained" : "outlined"}
                  color={paraInput === p ? "primary" : "inherit"}
                  onClick={() => handleParaClick(p)}
                  sx={{ 
                    minWidth: 0, 
                    width: '100%', 
                    aspectRatio: '1', 
                    p: 0,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderRadius: 1,
                  }}
                >
                  {p}
                </Button>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Page Number
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                {pageInput}
              </Typography>
            </Box>
            <Slider
              value={pageInput}
              min={0}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
              onChange={(e, val) => setPageInput(val as number)}
              sx={{
                color: "primary.main",
                "& .MuiSlider-thumb": {
                  width: 20,
                  height: 20,
                  border: "2px solid #fff",
                },
                "& .MuiSlider-rail": {
                  opacity: 0.3,
                },
              }}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ mt: 4, py: 1.5, fontSize: "1rem", borderRadius: 2 }}
          >
            Save Progress
          </Button>
        </Box>
      </Card>

      {/* User Email Dialog */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => userEmail && !isRestoring && setEmailDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
          Set Your Identity
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your email to sync your Quran progress across devices.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={isRestoring}
          />
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, flexDirection: "column", gap: 1 }}>
          <Button
            onClick={handleSetEmail}
            variant="contained"
            fullWidth
            color="primary"
            disabled={isRestoring}
          >
            Start Syncing
          </Button>
          <Button
            onClick={handleRestoreFromCloud}
            variant="outlined"
            fullWidth
            color="secondary"
            startIcon={
              isRestoring ? (
                <CircularProgress size={18} />
              ) : (
                <CloudDownloadIcon />
              )
            }
            disabled={isRestoring}
          >
            Restore Backup from Cloud
          </Button>
          {userEmail && (
            <Button onClick={() => setEmailDialogOpen(false)} sx={{ mt: 1 }}>
              Cancel
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={khatamToastOpen}
        autoHideDuration={6000}
        onClose={() => setKhatamToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 2,
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          🎉 Congratulations! Khatam Completed successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ width: "100%", borderRadius: "12px" }}
        >
          Progress saved successfully.
        </Alert>
      </Snackbar>
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
}
