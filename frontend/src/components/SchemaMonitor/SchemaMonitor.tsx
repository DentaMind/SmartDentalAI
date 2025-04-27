import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import ReactJson from 'react-json-view';

import {
  fetchSchemaStats,
  fetchSchemaVersions,
  activateSchema,
  deactivateSchema,
  fetchEventTypes
} from '@/api/schemas';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SchemaVersion {
  id: number;
  event_type: string;
  version: number;
  schema: any;
  schema_hash: string;
  is_active: boolean;
  created_at: string;
}

interface SchemaStats {
  total_event_types: number;
  total_schema_versions: number;
  evolved_schemas: number;
  recent_changes_24h: number;
}

const SchemaMonitor: React.FC = () => {
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  
  // Fetch event types
  const {
    data: eventTypes,
    isLoading: eventTypesLoading,
    error: eventTypesError
  } = useQuery<string[]>(['eventTypes'], fetchEventTypes);
  
  // Fetch schema statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery<SchemaStats>(['schemaStats'], fetchSchemaStats);
  
  // Fetch schema versions for selected event type
  const {
    data: versions,
    isLoading: versionsLoading,
    error: versionsError,
    refetch: refetchVersions
  } = useQuery<SchemaVersion[]>(
    ['schemaVersions', selectedEventType],
    () => fetchSchemaVersions(selectedEventType!),
    { enabled: !!selectedEventType }
  );
  
  // Mutations for schema activation/deactivation
  const activateMutation = useMutation(
    ({ eventType, version }: { eventType: string; version: number }) =>
      activateSchema(eventType, version),
    {
      onSuccess: () => {
        refetchVersions();
        refetchStats();
      }
    }
  );
  
  const deactivateMutation = useMutation(
    ({ eventType, version }: { eventType: string; version: number }) =>
      deactivateSchema(eventType, version),
    {
      onSuccess: () => {
        refetchVersions();
        refetchStats();
      }
    }
  );
  
  // Handle schema activation toggle
  const handleSchemaActivation = async (
    eventType: string,
    version: number,
    currentlyActive: boolean
  ) => {
    if (currentlyActive) {
      await deactivateMutation.mutateAsync({ eventType, version });
    } else {
      await activateMutation.mutateAsync({ eventType, version });
    }
  };
  
  // Handle schema viewing
  const handleViewSchema = (schema: any) => {
    setSelectedSchema(schema);
    setShowSchemaDialog(true);
  };
  
  return (
    <ErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Schema Monitor
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              refetchStats();
              if (selectedEventType) refetchVersions();
            }}
          >
            Refresh
          </Button>
        </Box>
        
        {/* Event Type Selector */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="event-type-select-label">
              Select Event Type
            </InputLabel>
            <Select
              labelId="event-type-select-label"
              value={selectedEventType || ''}
              label="Select Event Type"
              onChange={(e) => setSelectedEventType(e.target.value)}
              disabled={eventTypesLoading}
            >
              {eventTypesError ? (
                <MenuItem disabled>
                  Error loading event types
                </MenuItem>
              ) : eventTypes?.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Stats Cards */}
        {statsLoading ? (
          <CircularProgress />
        ) : statsError ? (
          <Alert severity="error">Error loading schema statistics</Alert>
        ) : stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Event Types
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_event_types}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Versions
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_schema_versions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Evolved Schemas
                  </Typography>
                  <Typography variant="h5">
                    {stats.evolved_schemas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Recent Changes (24h)
                  </Typography>
                  <Typography variant="h5">
                    {stats.recent_changes_24h}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Schema Versions Table */}
        {selectedEventType && (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : versionsError ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Alert severity="error">Error loading versions</Alert>
                    </TableCell>
                  </TableRow>
                ) : versions?.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>{version.version}</TableCell>
                    <TableCell>
                      {format(new Date(version.created_at), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={version.is_active ? 'Active' : 'Inactive'}
                        color={version.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleViewSchema(version.schema)}
                        size="small"
                      >
                        <InfoIcon />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          handleSchemaActivation(
                            version.event_type,
                            version.version,
                            version.is_active
                          )
                        }
                        size="small"
                        color={version.is_active ? 'error' : 'success'}
                      >
                        {version.is_active ? <CloseIcon /> : <CheckIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Schema Timeline */}
        {versions && versions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Schema Evolution Timeline
            </Typography>
            <Timeline>
              {versions.map((version, index) => (
                <TimelineItem key={version.id}>
                  <TimelineSeparator>
                    <TimelineDot
                      color={version.is_active ? 'success' : 'grey'}
                    />
                    {index < versions.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle2">
                      Version {version.version}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {format(new Date(version.created_at), 'PPpp')}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        )}
        
        {/* Schema Viewer Dialog */}
        <Dialog
          open={showSchemaDialog}
          onClose={() => setShowSchemaDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Schema Definition</DialogTitle>
          <DialogContent>
            <ReactJson
              src={selectedSchema || {}}
              theme="monokai"
              displayDataTypes={false}
              displayObjectSize={false}
              enableClipboard={false}
              style={{ maxHeight: '60vh', overflow: 'auto' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSchemaDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
};

export default SchemaMonitor; 