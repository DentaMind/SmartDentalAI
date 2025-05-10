import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface Patient {
  id: string;
  name: string;
  dob: string;
  lastVisit: string | null;
  status: string;
  treatmentStatus: string;
  email?: string;
  phone?: string;
}

/**
 * Patients listing page component with search and filtering
 */
const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  // Fetch patients from the API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // Replace axios with fetch for consistency with the rest of the app
        const response = await fetch('/api/patients');
        
        if (!response.ok) {
          throw new Error(`Failed to load patients: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setPatients(data);
        setFilteredPatients(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again later.');
        setLoading(false);
        
        // Fallback to empty array instead of mock data
        // The MSW mock handler should be intercepting this request in development
        setPatients([]);
        setFilteredPatients([]);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    // Filter patients based on search term
    if (search.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = patients.filter(
        patient => 
          patient.name.toLowerCase().includes(searchLower) ||
          patient.id.toLowerCase().includes(searchLower) ||
          (patient.email?.toLowerCase().includes(searchLower) || false) ||
          (patient.phone?.toLowerCase().includes(searchLower) || false)
      );
      setFilteredPatients(filtered);
    }
  }, [search, patients]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleAddPatient = () => {
    // Navigate to patient creation page
    navigate('/patients/new');
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleStartTreatment = (patientId: string) => {
    navigate(`/patients/${patientId}/treatment`);
  };

  const handleViewDiagnostics = (patientId: string) => {
    navigate(`/patients/${patientId}/diagnostics`);
  };

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTreatmentChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'scheduled':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Patients
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddPatient}
          >
            Add Patient
          </Button>
        </Box>
        
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Development mode: Using API at {import.meta.env.VITE_API_BASE_URL || '/api'}
          </Alert>
        )}
        
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search patients by name, ID, email, or phone"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
              <Typography>{error}</Typography>
            </Box>
          ) : filteredPatients.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No patients found. {search ? 'Try adjusting your search.' : 'Add a patient to get started.'}
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ mt: 2 }}
                onClick={handleAddPatient}
              >
                Add Patient
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Date of Birth</TableCell>
                    <TableCell>Last Visit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Treatment</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((patient) => (
                      <TableRow key={patient.id} hover>
                        <TableCell>{patient.id}</TableCell>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{formatDate(patient.dob)}</TableCell>
                        <TableCell>{formatDate(patient.lastVisit)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={patient.status} 
                            size="small" 
                            color={getStatusChipColor(patient.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={patient.treatmentStatus} 
                            size="small" 
                            color={getTreatmentChipColor(patient.treatmentStatus) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewPatient(patient.id)}
                              title="View Patient"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleStartTreatment(patient.id)}
                              title="Treatment"
                            >
                              <MedicalServicesIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewDiagnostics(patient.id)}
                              title="Diagnostics"
                            >
                              <AssessmentIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPatients.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default PatientsPage; 