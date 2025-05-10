import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useFeatureFlags } from '../../hooks/useFeatureFlag';
import {
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  activateKillswitch,
  getFeatureFlagAuditLog
} from '../../api/featureFlags';
import { format } from 'date-fns';

interface AuditLogEntry {
  timestamp: string;
  user_id: string;
  action: string;
  flag_key: string;
  new_state: any;
  old_state: any;
}

export const FeatureFlagManager: React.FC = () => {
  const { flags, refreshFlags, loading, error } = useFeatureFlags();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [formData, setFormData] = useState({
    key: '',
    description: '',
    enabled: false,
    enterprise_only: false,
    killswitch_enabled: true,
    alert_on_error: true
  });
  
  const handleCreateFlag = async () => {
    try {
      await createFeatureFlag(formData);
      await refreshFlags();
      setCreateDialogOpen(false);
      setFormData({
        key: '',
        description: '',
        enabled: false,
        enterprise_only: false,
        killswitch_enabled: true,
        alert_on_error: true
      });
    } catch (err) {
      console.error('Failed to create feature flag:', err);
    }
  };
  
  const handleUpdateFlag = async () => {
    if (!selectedFlag) return;
    
    try {
      await updateFeatureFlag(selectedFlag.key, formData);
      await refreshFlags();
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Failed to update feature flag:', err);
    }
  };
  
  const handleDeleteFlag = async (flagKey: string) => {
    if (!window.confirm('Are you sure you want to delete this feature flag?')) {
      return;
    }
    
    try {
      await deleteFeatureFlag(flagKey);
      await refreshFlags();
    } catch (err) {
      console.error('Failed to delete feature flag:', err);
    }
  };
  
  const handleKillswitch = async (flagKey: string) => {
    const reason = window.prompt('Please provide a reason for activating the killswitch:');
    if (!reason) return;
    
    try {
      await activateKillswitch(flagKey, reason);
      await refreshFlags();
    } catch (err) {
      console.error('Failed to activate killswitch:', err);
    }
  };
  
  const handleViewAuditLog = async (flagKey: string) => {
    try {
      const log = await getFeatureFlagAuditLog(flagKey);
      setAuditLog(log);
      setAuditDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    }
  };
  
  const handleToggleFlag = async (flag: any) => {
    try {
      await updateFeatureFlag(flag.key, {
        enabled: !flag.enabled
      });
      await refreshFlags();
    } catch (err) {
      console.error('Failed to toggle feature flag:', err);
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load feature flags: {error.message}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Feature Flags</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Flag
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.map((flag) => (
              <TableRow key={flag.key}>
                <TableCell>{flag.key}</TableCell>
                <TableCell>{flag.description}</TableCell>
                <TableCell>
                  <Switch
                    checked={flag.enabled}
                    onChange={() => handleToggleFlag(flag)}
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {flag.enterprise_only && (
                      <Chip size="small" label="Enterprise" color="primary" />
                    )}
                    {flag.killswitch_enabled && (
                      <Chip size="small" label="Killswitch" color="warning" />
                    )}
                    {flag.alert_on_error && (
                      <Chip size="small" label="Alerts" color="info" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedFlag(flag);
                          setFormData(flag);
                          setEditDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="View Audit Log">
                      <IconButton
                        size="small"
                        onClick={() => handleViewAuditLog(flag.key)}
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {flag.killswitch_enabled && (
                      <Tooltip title="Emergency Killswitch">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleKillswitch(flag.key)}
                        >
                          <WarningIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteFlag(flag.key)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create Feature Flag</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Options</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
                <Typography>Enabled</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.enterprise_only}
                  onChange={(e) => setFormData({ ...formData, enterprise_only: e.target.checked })}
                />
                <Typography>Enterprise Only</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.killswitch_enabled}
                  onChange={(e) => setFormData({ ...formData, killswitch_enabled: e.target.checked })}
                />
                <Typography>Enable Killswitch</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.alert_on_error}
                  onChange={(e) => setFormData({ ...formData, alert_on_error: e.target.checked })}
                />
                <Typography>Alert on Error</Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFlag} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Feature Flag</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Options</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
                <Typography>Enabled</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.enterprise_only}
                  onChange={(e) => setFormData({ ...formData, enterprise_only: e.target.checked })}
                />
                <Typography>Enterprise Only</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.killswitch_enabled}
                  onChange={(e) => setFormData({ ...formData, killswitch_enabled: e.target.checked })}
                />
                <Typography>Enable Killswitch</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Switch
                  checked={formData.alert_on_error}
                  onChange={(e) => setFormData({ ...formData, alert_on_error: e.target.checked })}
                />
                <Typography>Alert on Error</Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateFlag} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Audit Log Dialog */}
      <Dialog
        open={auditDialogOpen}
        onClose={() => setAuditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log</DialogTitle>
        <DialogContent>
          {auditLog.map((entry, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {format(new Date(entry.timestamp), 'PPpp')}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Action: <strong>{entry.action}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  User ID: {entry.user_id}
                </Typography>
                {entry.new_state && (
                  <Box mt={1}>
                    <Typography variant="body2">New State:</Typography>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(entry.new_state, null, 2)}
                    </pre>
                  </Box>
                )}
                {entry.old_state && (
                  <Box mt={1}>
                    <Typography variant="body2">Previous State:</Typography>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(entry.old_state, null, 2)}
                    </pre>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 