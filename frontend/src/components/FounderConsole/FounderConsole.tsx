import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { EventFlow } from './EventFlow';
import { StorageStats } from './StorageStats';
import { LearningMetrics } from './LearningMetrics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`console-tabpanel-${index}`}
      aria-labelledby={`console-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `console-tab-${index}`,
    'aria-controls': `console-tabpanel-${index}`,
  };
};

export const FounderConsole: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Mock data - replace with actual API calls
  const [consoleData, setConsoleData] = useState({
    eventStats: {
      total_events: 1234567,
      events_per_second: 42.5,
      validation_success_rate: 99.2,
      event_types: [
        { name: 'Inference', count: 800000, trend: 'up' as const },
        { name: 'Training', count: 300000, trend: 'stable' as const },
        { name: 'Validation', count: 134567, trend: 'up' as const }
      ],
      hourly_stats: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        count: Math.floor(Math.random() * 1000) + 500,
        errors: Math.floor(Math.random() * 10)
      }))
    },
    storageStats: {
      dbSize: {
        total: 1024 * 1024 * 1024 * 100, // 100GB
        used: 1024 * 1024 * 1024 * 65,   // 65GB
        available: 1024 * 1024 * 1024 * 35 // 35GB
      },
      mediaSize: {
        total: 1024 * 1024 * 1024 * 1024, // 1TB
        used: 1024 * 1024 * 1024 * 716,   // 716GB
        available: 1024 * 1024 * 1024 * 308 // 308GB
      },
      backupStatus: {
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'success' as const,
        nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    },
    learningMetrics: {
      modelAccuracy: {
        overall: 96.5,
        byCategory: [
          { name: 'Diagnosis', accuracy: 97.2, samples: 50000 },
          { name: 'Treatment', accuracy: 95.8, samples: 30000 },
          { name: 'Medication', accuracy: 96.4, samples: 20000 }
        ],
        trend: Array.from({ length: 30 }, () => 90 + Math.random() * 10)
      },
      datasetGrowth: {
        total: 100000,
        newLastWeek: 5000,
        growthRate: 15.3,
        distribution: [
          { category: 'X-Rays', count: 40000 },
          { category: 'CT Scans', count: 30000 },
          { category: 'MRIs', count: 30000 }
        ]
      },
      retrainingStatus: {
        lastRetrained: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'idle' as const,
        nextScheduled: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        improvements: [
          { metric: 'Accuracy', change: 1.2 },
          { metric: 'Precision', change: 0.8 },
          { metric: 'Recall', change: 1.5 }
        ]
      }
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Implement actual API calls to refresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="console tabs"
            sx={{ flexGrow: 1 }}
          >
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Event Flow" {...a11yProps(1)} />
            <Tab label="Storage" {...a11yProps(2)} />
            <Tab label="Learning" {...a11yProps(3)} />
          </Tabs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {lastUpdated && (
              <Typography variant="caption" color="textSecondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <EventFlow
                eventStats={consoleData.eventStats}
                validationRate={consoleData.eventStats.validation_success_rate}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <StorageStats
                dbSize={consoleData.storageStats.dbSize}
                mediaSize={consoleData.storageStats.mediaSize}
                backupStatus={consoleData.storageStats.backupStatus}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <LearningMetrics
                modelAccuracy={consoleData.learningMetrics.modelAccuracy}
                datasetGrowth={consoleData.learningMetrics.datasetGrowth}
                retrainingStatus={consoleData.learningMetrics.retrainingStatus}
              />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2 }}>
          <EventFlow
            eventStats={consoleData.eventStats}
            validationRate={consoleData.eventStats.validation_success_rate}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 2 }}>
          <StorageStats
            dbSize={consoleData.storageStats.dbSize}
            mediaSize={consoleData.storageStats.mediaSize}
            backupStatus={consoleData.storageStats.backupStatus}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 2 }}>
          <LearningMetrics
            modelAccuracy={consoleData.learningMetrics.modelAccuracy}
            datasetGrowth={consoleData.learningMetrics.datasetGrowth}
            retrainingStatus={consoleData.learningMetrics.retrainingStatus}
          />
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default FounderConsole; 