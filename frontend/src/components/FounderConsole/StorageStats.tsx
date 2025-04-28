import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Storage as StorageIcon,
  Backup as BackupIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon
} from '@mui/icons-material';

interface StorageStats {
  dbSize: {
    total: number;
    used: number;
    available: number;
  };
  mediaSize: {
    total: number;
    used: number;
    available: number;
  };
  backupStatus: {
    lastBackup: string;
    status: 'success' | 'failed' | 'in_progress';
    nextScheduled: string;
  };
}

interface StorageStatsProps {
  dbSize: StorageStats['dbSize'];
  mediaSize: StorageStats['mediaSize'];
  backupStatus: StorageStats['backupStatus'];
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const StorageProgress: React.FC<{
  used: number;
  total: number;
  label: string;
}> = ({ used, total, label }) => {
  const theme = useTheme();
  const percentage = (used / total) * 100;
  
  const getColor = (percentage: number) => {
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 75) return theme.palette.warning.main;
    return theme.palette.success.main;
  };
  
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
      <CircularProgress
        variant="determinate"
        value={percentage}
        size={80}
        thickness={4}
        sx={{ color: getColor(percentage) }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <Typography variant="caption" component="div" color="textSecondary">
          {`${Math.round(percentage)}%`}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export const StorageStats: React.FC<StorageStatsProps> = ({
  dbSize,
  mediaSize,
  backupStatus
}) => {
  const theme = useTheme();
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StorageIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Storage Overview
        </Typography>
        {backupStatus.status === 'success' ? (
          <Tooltip title="Latest Backup Successful">
            <HealthyIcon color="success" />
          </Tooltip>
        ) : (
          <Tooltip title="Backup Issue">
            <WarningIcon color="warning" />
          </Tooltip>
        )}
      </Box>
      
      {/* Storage Usage */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <StorageProgress
          used={dbSize.used}
          total={dbSize.total}
          label="Database"
        />
        <StorageProgress
          used={mediaSize.used}
          total={mediaSize.total}
          label="Media"
        />
      </Box>
      
      {/* Storage Details */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Database Storage
          </Typography>
          <Typography variant="body1">
            {formatBytes(dbSize.used)} / {formatBytes(dbSize.total)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {formatBytes(dbSize.available)} available
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Media Storage
          </Typography>
          <Typography variant="body1">
            {formatBytes(mediaSize.used)} / {formatBytes(mediaSize.total)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {formatBytes(mediaSize.available)} available
          </Typography>
        </Grid>
      </Grid>
      
      {/* Backup Status */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor:
            backupStatus.status === 'success'
              ? 'success.light'
              : backupStatus.status === 'in_progress'
              ? 'info.light'
              : 'error.light'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <BackupIcon
            sx={{
              mr: 1,
              color:
                backupStatus.status === 'success'
                  ? 'success.main'
                  : backupStatus.status === 'in_progress'
                  ? 'info.main'
                  : 'error.main'
            }}
          />
          <Typography variant="body2">Backup Status</Typography>
        </Box>
        <Typography variant="caption" display="block">
          Last Backup: {new Date(backupStatus.lastBackup).toLocaleString()}
        </Typography>
        <Typography variant="caption" display="block">
          Next Scheduled: {new Date(backupStatus.nextScheduled).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default StorageStats; 