import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Badge,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Send as SendIcon,
  Drafts as DraftsIcon,
  Settings as SettingsIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import EmailInbox from './EmailInbox';
import EmailCompose from './EmailCompose';
import EmailAnalytics from './EmailAnalytics';
import EmailTemplates from './EmailTemplates';
import EmailSettings from './EmailSettings';
import { useAuth } from '../contexts/AuthContext';
import { EmailService } from '../services/emailService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-tabpanel-${index}`}
      aria-labelledby={`email-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EmailDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    unread: 0,
    sent: 0,
    drafts: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const emailStats = await EmailService.getStats();
        setStats({
          unread: emailStats.unread || 0,
          sent: emailStats.sent || 0,
          drafts: emailStats.drafts || 0
        });
      } catch (err) {
        setError('Failed to load email statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              Email Dashboard
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="email dashboard tabs"
              >
                <Tab
                  icon={
                    <Badge badgeContent={stats.unread} color="error">
                      <InboxIcon />
                    </Badge>
                  }
                  label="Inbox"
                />
                <Tab
                  icon={<SendIcon />}
                  label="Compose"
                />
                <Tab
                  icon={<DraftsIcon />}
                  label="Templates"
                />
                <Tab
                  icon={<SettingsIcon />}
                  label="Settings"
                />
              </Tabs>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TabPanel value={activeTab} index={0}>
                  <EmailInbox />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                  <EmailCompose />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                  <EmailTemplates />
                </TabPanel>
                <TabPanel value={activeTab} index={3}>
                  <EmailSettings />
                </TabPanel>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h4">{stats.unread}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Unread
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h4">{stats.sent}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sent Today
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h4">{stats.drafts}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Drafts
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <EmailAnalytics />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailDashboard; 