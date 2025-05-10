import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import API from '../../lib/api';

interface MigrationStatus {
  current_revision: string;
  head_revisions: string[];
  is_up_to_date: boolean;
  available_revisions: string[];
  revision_count: number;
  multiple_heads: boolean;
}

const DatabaseVersionIndicator: React.FC = () => {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const fetchMigrationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/api/admin/db-migration-status');
      setStatus(response);
    } catch (err) {
      console.error('Error fetching migration status:', err);
      setError('Failed to fetch database migration status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrationStatus();
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getStatusColor = () => {
    if (!status) return theme.palette.grey[500];
    if (error) return theme.palette.error.main;
    if (status.multiple_heads) return theme.palette.warning.main;
    if (status.is_up_to_date) return theme.palette.success.main;
    return theme.palette.info.main;
  };

  const getStatusIcon = () => {
    if (error) return <ErrorIcon color="error" />;
    if (!status) return <CircularProgress size={16} />;
    if (status.multiple_heads) return <WarningIcon color="warning" />;
    if (status.is_up_to_date) return <CheckCircleIcon color="success" />;
    return <InfoIcon color="info" />;
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (!status) return 'Loading...';
    if (status.multiple_heads) return 'Multiple Heads';
    if (status.is_up_to_date) return 'Up to Date';
    return 'Migration Needed';
  };

  return (
    <>
      <Tooltip title="View database migration status">
        <Chip
          icon={getStatusIcon()}
          label={`DB: ${getStatusText()}`}
          onClick={handleOpen}
          sx={{
            bgcolor: alpha(getStatusColor(), 0.1),
            color: getStatusColor(),
            borderColor: alpha(getStatusColor(), 0.3),
            '&:hover': {
              bgcolor: alpha(getStatusColor(), 0.2),
            },
            ml: 1
          }}
          variant="outlined"
          size="small"
        />
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <DialogTitle>Database Migration Status</DialogTitle>
        <DialogContent>
          {loading && (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
          
          {error && (
            <Typography color="error" variant="body1">
              {error}
            </Typography>
          )}
          
          {status && !loading && !error && (
            <Box>
              <Card sx={{ mb: 2, bgcolor: alpha(getStatusColor(), 0.05) }}>
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom>
                    Status Summary
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Chip 
                      icon={getStatusIcon()} 
                      label={getStatusText()} 
                      color={status.is_up_to_date ? "success" : status.multiple_heads ? "warning" : "info"}
                    />
                    <Chip 
                      label={`Current: ${status.current_revision?.substring(0, 8) || 'None'}`}
                      variant="outlined"
                    />
                    {status.head_revisions.map((head, index) => (
                      <Chip 
                        key={index}
                        label={`Head: ${head.substring(0, 8)}`}
                        variant="outlined"
                      />
                    ))}
                    <Chip 
                      label={`Total Migrations: ${status.revision_count}`}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
              
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>
                Available Migrations
              </Typography>
              
              <List dense sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                {status.available_revisions.map((rev, index) => (
                  <ListItem key={index} divider>
                    <ListItemText 
                      primary={rev} 
                      secondary={
                        rev === status.current_revision 
                          ? '(Current)' 
                          : status.head_revisions.includes(rev) 
                            ? '(Head)' 
                            : ''
                      }
                      primaryTypographyProps={{
                        fontFamily: 'monospace',
                        fontWeight: rev === status.current_revision || status.head_revisions.includes(rev) ? 'bold' : 'normal',
                        color: rev === status.current_revision 
                          ? theme.palette.info.main
                          : status.head_revisions.includes(rev)
                            ? theme.palette.success.main
                            : 'text.primary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button 
            onClick={fetchMigrationStatus} 
            startIcon={<InfoIcon />}
            color="primary"
          >
            Refresh Status
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DatabaseVersionIndicator; 