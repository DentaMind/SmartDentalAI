import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import AdminLayout from '../../components/admin/AdminLayout';
import aiFeedbackService from '../../services/aiFeedbackService';
import clinicalEvidenceService from '../../services/clinicalEvidenceService';
import { 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  WarningAmber as WarningIcon,
  BugReport as BugReportIcon,
  Comment as CommentIcon,
  Block as BlockIcon,
  AutoFixHigh as AutoFixIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import analyticsExportService from '../../services/analyticsExportService';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`resolution-tabpanel-${index}`}
      aria-labelledby={`resolution-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Main component
const FeedbackResolutionPanel: React.FC = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Data states
  const [rejectedSuggestions, setRejectedSuggestions] = useState<any[]>([]);
  const [flaggedEvidence, setFlaggedEvidence] = useState<any[]>([]);
  const [modelIssues, setModelIssues] = useState<any[]>([]);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');
  
  // Filter states
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [filterSeverity, setFilterSeverity] = useState('all');
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Load data on component mount and when filters change
  useEffect(() => {
    loadResolutionData();
  }, [filterPeriod, filterSeverity]);
  
  // Function to load all resolution data
  const loadResolutionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load rejected suggestions
      const rejectedData = await aiFeedbackService.getRejectedSuggestions(filterPeriod, filterSeverity);
      setRejectedSuggestions(rejectedData);
      
      // Load flagged evidence
      const flaggedData = await aiFeedbackService.getFlaggedEvidence(filterPeriod, filterSeverity);
      setFlaggedEvidence(flaggedData);
      
      // Load model issues
      const issuesData = await aiFeedbackService.getModelIssues(filterPeriod, filterSeverity);
      setModelIssues(issuesData);
      
    } catch (err) {
      console.error('Error loading resolution data:', err);
      setError('Failed to load feedback data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset pagination when switching tabs
  };
  
  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Detail dialog handlers
  const handleOpenDetails = (item: any) => {
    setSelectedItem(item);
    setResolutionNote('');
    setResolutionAction('');
    setDetailDialogOpen(true);
  };
  
  const handleCloseDetails = () => {
    setDetailDialogOpen(false);
  };
  
  // Resolution handlers
  const handleResolutionActionChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setResolutionAction(event.target.value as string);
  };
  
  const handleResolutionNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setResolutionNote(event.target.value);
  };
  
  const handleSubmitResolution = async () => {
    try {
      if (!selectedItem || !resolutionAction) {
        return;
      }
      
      // Determine which API to call based on current tab
      let result;
      
      if (tabValue === 0) {
        // Rejected suggestions
        result = await aiFeedbackService.resolveTreatmentFeedback(
          selectedItem.id,
          resolutionAction,
          resolutionNote
        );
      } else if (tabValue === 1) {
        // Flagged evidence
        result = await aiFeedbackService.resolveEvidenceFeedback(
          selectedItem.id,
          resolutionAction,
          resolutionNote
        );
      } else {
        // Model issues
        result = await aiFeedbackService.resolveModelIssue(
          selectedItem.id,
          resolutionAction,
          resolutionNote
        );
      }
      
      // Close dialog and refresh data
      handleCloseDetails();
      loadResolutionData();
      
    } catch (err) {
      console.error('Error submitting resolution:', err);
      setError('Failed to submit resolution. Please try again.');
    }
  };
  
  // Get currently displayed items based on tab and pagination
  const getCurrentItems = () => {
    if (tabValue === 0) {
      return rejectedSuggestions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    } else if (tabValue === 1) {
      return flaggedEvidence.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    } else {
      return modelIssues.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }
  };
  
  // Get total count of current tab's items
  const getCurrentCount = () => {
    if (tabValue === 0) {
      return rejectedSuggestions.length;
    } else if (tabValue === 1) {
      return flaggedEvidence.length;
    } else {
      return modelIssues.length;
    }
  };
  
  // Render severity chip
  const renderSeverityChip = (severity: string) => {
    const severityColors: Record<string, any> = {
      'high': { color: 'error', icon: <WarningIcon fontSize="small" /> },
      'medium': { color: 'warning', icon: <FlagIcon fontSize="small" /> },
      'low': { color: 'info', icon: <CommentIcon fontSize="small" /> }
    };
    
    const config = severityColors[severity] || severityColors.medium;
    
    return (
      <Chip 
        color={config.color}
        icon={config.icon}
        label={severity} 
        size="small"
      />
    );
  };
  
  // Render status chip
  const renderStatusChip = (status: string) => {
    const statusColors: Record<string, any> = {
      'pending': { color: 'default', icon: null },
      'in_progress': { color: 'info', icon: <EditIcon fontSize="small" /> },
      'resolved': { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
      'wont_fix': { color: 'error', icon: <BlockIcon fontSize="small" /> },
      'fixed': { color: 'success', icon: <AutoFixIcon fontSize="small" /> }
    };
    
    const config = statusColors[status] || statusColors.pending;
    
    return (
      <Chip 
        color={config.color}
        icon={config.icon}
        label={status.replace('_', ' ')} 
        size="small"
      />
    );
  };
  
  // Handle export menu open
  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  // Handle export menu close
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  // Handle export as CSV
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      handleExportMenuClose();
      
      // Export data based on current tab
      if (tabValue === 0 && rejectedSuggestions.length > 0) {
        const columns = [
          { field: 'created_at', header: 'Date' },
          { field: 'procedure_name', header: 'Procedure' },
          { field: 'provider_name', header: 'Provider' },
          { field: 'patient_name', header: 'Patient' },
          { field: 'rejection_reason', header: 'Reason' },
          { field: 'severity', header: 'Severity' },
          { field: 'status', header: 'Status' }
        ];
        
        analyticsExportService.exportCSV(
          rejectedSuggestions,
          columns,
          `rejected_suggestions_${filterPeriod}_${filterSeverity}.csv`
        );
      } else if (tabValue === 1 && flaggedEvidence.length > 0) {
        const columns = [
          { field: 'created_at', header: 'Date' },
          { field: 'evidence_title', header: 'Evidence Title' },
          { field: 'evidence_grade', header: 'Grade' },
          { field: 'provider_name', header: 'Provider' },
          { field: 'issue', header: 'Issue' },
          { field: 'accuracy_score', header: 'Accuracy Score' },
          { field: 'severity', header: 'Severity' },
          { field: 'status', header: 'Status' }
        ];
        
        analyticsExportService.exportCSV(
          flaggedEvidence,
          columns,
          `flagged_evidence_${filterPeriod}_${filterSeverity}.csv`
        );
      } else if (tabValue === 2 && modelIssues.length > 0) {
        const columns = [
          { field: 'created_at', header: 'Date' },
          { field: 'issue_type', header: 'Issue Type' },
          { field: 'description', header: 'Description' },
          { field: 'provider_name', header: 'Provider' },
          { field: 'patient_name', header: 'Patient' },
          { field: 'severity', header: 'Severity' },
          { field: 'status', header: 'Status' }
        ];
        
        analyticsExportService.exportCSV(
          modelIssues,
          columns,
          `model_issues_${filterPeriod}_${filterSeverity}.csv`
        );
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };
  
  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Feedback Resolution Panel</Typography>
          
          <Stack direction="row" spacing={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as string)}
                label="Time Period"
              >
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="quarter">Last 90 Days</MenuItem>
                <MenuItem value="year">Last 365 Days</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as string)}
                label="Severity"
              >
                <MenuItem value="all">All Severities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="contained" 
              onClick={() => loadResolutionData()}
              disabled={loading}
            >
              Refresh
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportMenuOpen}
              disabled={loading || exportLoading}
            >
              Export CSV
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItem onClick={handleExportCSV}>
                <ListItemIcon>
                  <CsvIcon />
                </ListItemIcon>
                <ListItemText primary="Export as CSV" />
              </MenuItem>
            </Menu>
          </Stack>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading || exportLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
            {exportLoading && 
              <Typography variant="body2" sx={{ ml: 2 }}>
                Generating export...
              </Typography>
            }
          </Box>
        ) : (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CancelIcon sx={{ mr: 1 }} />
                    Rejected Suggestions
                    <Chip 
                      label={rejectedSuggestions.length} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FlagIcon sx={{ mr: 1 }} />
                    Flagged Evidence
                    <Chip 
                      label={flaggedEvidence.length} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BugReportIcon sx={{ mr: 1 }} />
                    Model Issues
                    <Chip 
                      label={modelIssues.length} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                } 
              />
            </Tabs>
            
            {/* Rejected Suggestions Tab */}
            <TabPanel value={tabValue} index={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Procedure</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{item.procedure_name}</TableCell>
                        <TableCell>{item.provider_name}</TableCell>
                        <TableCell>{item.patient_name}</TableCell>
                        <TableCell>{item.rejection_reason}</TableCell>
                        <TableCell>{renderSeverityChip(item.severity)}</TableCell>
                        <TableCell>{renderStatusChip(item.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            onClick={() => handleOpenDetails(item)}
                            disabled={item.status === 'resolved' || item.status === 'wont_fix'}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {getCurrentItems().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No rejected suggestions to display
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            
            {/* Flagged Evidence Tab */}
            <TabPanel value={tabValue} index={1}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Evidence Title</TableCell>
                      <TableCell>Evidence Grade</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Issue</TableCell>
                      <TableCell>Accuracy Score</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{item.evidence_title}</TableCell>
                        <TableCell>{item.evidence_grade}</TableCell>
                        <TableCell>{item.provider_name}</TableCell>
                        <TableCell>{item.issue}</TableCell>
                        <TableCell>{item.accuracy_score}</TableCell>
                        <TableCell>{renderSeverityChip(item.severity)}</TableCell>
                        <TableCell>{renderStatusChip(item.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            onClick={() => handleOpenDetails(item)}
                            disabled={item.status === 'resolved' || item.status === 'wont_fix'}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {getCurrentItems().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No flagged evidence to display
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            
            {/* Model Issues Tab */}
            <TabPanel value={tabValue} index={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Issue Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{item.issue_type}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.provider_name}</TableCell>
                        <TableCell>{item.patient_name}</TableCell>
                        <TableCell>{renderSeverityChip(item.severity)}</TableCell>
                        <TableCell>{renderStatusChip(item.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            onClick={() => handleOpenDetails(item)}
                            disabled={item.status === 'resolved' || item.status === 'wont_fix'}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {getCurrentItems().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No model issues to display
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={getCurrentCount()}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
        
        {/* Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {tabValue === 0 ? 'Rejected Treatment Suggestion' : 
             tabValue === 1 ? 'Flagged Evidence' : 
             'Model Issue'}
          </DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Common details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Details
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {tabValue === 0 && (
                      // Rejected suggestion details
                      <>
                        <Typography><strong>Procedure:</strong> {selectedItem.procedure_name}</Typography>
                        <Typography><strong>Code:</strong> {selectedItem.procedure_code}</Typography>
                        <Typography><strong>Provider:</strong> {selectedItem.provider_name}</Typography>
                        <Typography><strong>Patient:</strong> {selectedItem.patient_name}</Typography>
                        <Typography><strong>Reason:</strong> {selectedItem.rejection_reason}</Typography>
                        <Typography><strong>Comment:</strong> {selectedItem.comment || 'None'}</Typography>
                      </>
                    )}
                    
                    {tabValue === 1 && (
                      // Flagged evidence details
                      <>
                        <Typography><strong>Evidence Title:</strong> {selectedItem.evidence_title}</Typography>
                        <Typography><strong>Publication:</strong> {selectedItem.publication}</Typography>
                        <Typography><strong>Grade:</strong> {selectedItem.evidence_grade}</Typography>
                        <Typography><strong>Provider:</strong> {selectedItem.provider_name}</Typography>
                        <Typography><strong>Issue:</strong> {selectedItem.issue}</Typography>
                        <Typography><strong>Accuracy Score:</strong> {selectedItem.accuracy_score}</Typography>
                        <Typography><strong>Comment:</strong> {selectedItem.comment || 'None'}</Typography>
                      </>
                    )}
                    
                    {tabValue === 2 && (
                      // Model issue details
                      <>
                        <Typography><strong>Issue Type:</strong> {selectedItem.issue_type}</Typography>
                        <Typography><strong>Description:</strong> {selectedItem.description}</Typography>
                        <Typography><strong>Provider:</strong> {selectedItem.provider_name}</Typography>
                        <Typography><strong>Patient:</strong> {selectedItem.patient_name}</Typography>
                        <Typography><strong>Model Version:</strong> {selectedItem.model_version}</Typography>
                        <Typography><strong>Environment:</strong> {selectedItem.environment}</Typography>
                      </>
                    )}
                  </Paper>
                </Grid>
                
                {/* Resolution form */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Resolution
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Action</InputLabel>
                      <Select
                        value={resolutionAction}
                        onChange={handleResolutionActionChange}
                        label="Action"
                      >
                        <MenuItem value="in_progress">Mark as In Progress</MenuItem>
                        <MenuItem value="resolved">Mark as Resolved</MenuItem>
                        <MenuItem value="wont_fix">Won't Fix</MenuItem>
                        {tabValue === 0 && (
                          <MenuItem value="add_to_training">Add to Training Data</MenuItem>
                        )}
                        {tabValue === 1 && (
                          <MenuItem value="update_evidence">Update Evidence</MenuItem>
                        )}
                        {tabValue === 2 && (
                          <MenuItem value="fixed">Fixed in Next Release</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="Resolution Note"
                      multiline
                      rows={3}
                      fullWidth
                      value={resolutionNote}
                      onChange={handleResolutionNoteChange}
                      placeholder="Enter notes about resolution actions taken..."
                    />
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Cancel</Button>
            <Button 
              onClick={handleSubmitResolution}
              variant="contained"
              disabled={!resolutionAction}
            >
              Submit Resolution
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default FeedbackResolutionPanel; 