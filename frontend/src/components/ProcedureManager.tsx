import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { procedureService, Procedure, ProcedureCategory, ProcedureRequirements } from '../services/procedureService';

const ProcedureManager: React.FC = () => {
  // State
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProcedureCategory | ''>('');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requirements, setRequirements] = useState<ProcedureRequirements | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<Procedure>>({
    code: '',
    name: '',
    description: '',
    category: ProcedureCategory.PREVENTIVE,
    default_duration_minutes: 30,
  });

  // Fetch procedures
  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        setLoading(true);
        const data = await procedureService.listProcedures({
          query: searchQuery,
          category: selectedCategory as ProcedureCategory,
          active_only: true,
        });
        setProcedures(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch procedures');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, [searchQuery, selectedCategory]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      procedureService.searchProcedures(searchQuery, selectedCategory as ProcedureCategory)
        .then(setProcedures)
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Dialog handlers
  const handleOpenDialog = (procedure?: Procedure) => {
    if (procedure) {
      setSelectedProcedure(procedure);
      setFormData(procedure);
    } else {
      setSelectedProcedure(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        category: ProcedureCategory.PREVENTIVE,
        default_duration_minutes: 30,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProcedure(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      category: ProcedureCategory.PREVENTIVE,
      default_duration_minutes: 30,
    });
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'default_duration_minutes' ? parseInt(value) : value,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFormData(prev => ({
      ...prev,
      category: e.target.value as ProcedureCategory,
    }));
  };

  // CRUD operations
  const handleSave = async () => {
    try {
      if (selectedProcedure) {
        await procedureService.updateProcedure(selectedProcedure.id, formData);
        setSnackbar({
          open: true,
          message: 'Procedure updated successfully',
          severity: 'success',
        });
      } else {
        await procedureService.createProcedure(formData as Required<typeof formData>);
        setSnackbar({
          open: true,
          message: 'Procedure created successfully',
          severity: 'success',
        });
      }
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to save procedure',
        severity: 'error',
      });
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this procedure?')) {
      try {
        await procedureService.deactivateProcedure(id);
        setSnackbar({
          open: true,
          message: 'Procedure deactivated successfully',
          severity: 'success',
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to deactivate procedure',
          severity: 'error',
        });
        console.error(err);
      }
    }
  };

  const handleViewRequirements = async (procedure: Procedure) => {
    try {
      const reqs = await procedureService.getProcedureRequirements(procedure.id);
      setRequirements(reqs);
      setSelectedProcedure(procedure);
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Procedure Management</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Procedure
            </Button>
          </Box>
        </Grid>

        {/* Search and Filter */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Procedures"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value as ProcedureCategory)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {Object.values(ProcedureCategory).map((category) => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Error Display */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Procedures Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Duration (min)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : procedures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No procedures found
                    </TableCell>
                  </TableRow>
                ) : (
                  procedures.map((procedure) => (
                    <TableRow key={procedure.id}>
                      <TableCell>{procedure.code}</TableCell>
                      <TableCell>{procedure.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={procedure.category}
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{procedure.default_duration_minutes}</TableCell>
                      <TableCell>
                        <Chip
                          label={procedure.is_active ? 'Active' : 'Inactive'}
                          color={procedure.is_active ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(procedure)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Requirements">
                          <IconButton onClick={() => handleViewRequirements(procedure)}>
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(procedure.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProcedure ? 'Edit Procedure' : 'Create New Procedure'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ADA Code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={handleCategoryChange}
                >
                  {Object.values(ProcedureCategory).map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Duration (minutes)"
                name="default_duration_minutes"
                type="number"
                value={formData.default_duration_minutes}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Requirements Dialog */}
      {requirements && (
        <Dialog open={dialogOpen && !!requirements} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Procedure Requirements</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Pre-operative Requirements</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {requirements.pre_operative.map((req, index) => (
                  <Chip key={index} label={req} />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>Post-operative Requirements</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {requirements.post_operative.map((req, index) => (
                  <Chip key={index} label={req} />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>Equipment</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {requirements.equipment.map((req, index) => (
                  <Chip key={index} label={req} />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>Room Requirements</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {requirements.room_requirements.map((req, index) => (
                  <Chip key={index} label={req} />
                ))}
              </Box>

              <Typography variant="h6">Staff Requirements</Typography>
              <Typography>{requirements.staff_requirements} staff members required</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProcedureManager; 