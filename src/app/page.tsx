"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
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
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import SyncIcon from "@mui/icons-material/Sync";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import StarsIcon from "@mui/icons-material/Stars";
import NightlightIcon from "@mui/icons-material/Nightlight";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useHafizStore } from "@/store/useHafizStore";
import { useSajdahDebt } from "@/hooks/useSajdahDebt";
import { useThemeContext } from "@/components/AppThemeProvider";
import { useSyncManager } from "@/hooks/useSyncManager";
import { db } from "@/lib/hafizDB";
import SaveIcon from "@mui/icons-material/Save";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

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
    setTotalKhatams,
    setTotalSajdahsDone,
  } = useHafizStore();
  const { remainingDebt } = useSajdahDebt();
  const { isSyncing, lastSyncTime, syncNow, unsyncedCount } = useSyncManager();

  const [paraInput, setParaInput] = useState<number>(1);
  const [pageInput, setPageInput] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [khatamToastOpen, setKhatamToastOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [emailInput, setEmailInput] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(() => !userEmail);
  const [isRestoring, setIsRestoring] = useState(false);

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
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Hafiz Tracker
          </Typography>
          {!isOnline ? (
            <Tooltip title="Offline - Data saved locally">
              <CloudOffIcon color="error" fontSize="small" />
            </Tooltip>
          ) : isSyncing ? (
            <SyncIcon
              color="primary"
              fontSize="small"
              sx={{ animation: "spin 2s linear infinite" }}
            />
          ) : unsyncedCount > 0 ? (
            <Tooltip title={`Click to sync ${unsyncedCount} pending logs`}>
              <IconButton
                size="small"
                onClick={() => syncNow()}
                sx={{
                  bgcolor: "primary.lighter",
                  border: "1px solid",
                  borderColor: "primary.light",
                }}
              >
                <SyncIcon sx={{ color: "primary.main", fontSize: "1.2rem" }} />
                <Typography
                  variant="caption"
                  sx={{ ml: 0.5, color: "primary.main", fontWeight: 800 }}
                >
                  {unsyncedCount}
                </Typography>
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip
              title={`Cloud Backup Active. Last synced: ${lastSyncTime?.toLocaleTimeString() || "Just now"}`}
            >
              <CloudDoneIcon color="success" fontSize="small" />
            </Tooltip>
          )}
        </Box>
        <Box>
          <IconButton
            onClick={() => setEmailDialogOpen(true)}
            color="primary"
            sx={{ mr: 1 }}
          >
            <AccountCircleIcon />
          </IconButton>
          <IconButton onClick={toggleTheme} color="primary">
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>
      </Box>

      {userEmail && (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", textAlign: "right", mt: -2 }}
        >
          Synced with: <strong>{userEmail}</strong>
        </Typography>
      )}

      {/* Progress Overview */}
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "#fff",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                Hello there
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>
                Para {lastPara}{" "}
                <Typography component="span" variant="h5" sx={{ opacity: 0.8 }}>
                  / Page {lastPage}
                </Typography>
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AutoStoriesIcon fontSize="small" />
                  <Typography variant="body2">
                    {totalKhatams} Khatams
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
