import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  TablePagination
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventIcon from '@mui/icons-material/Event';

// Mock patient data
const MOCK_PATIENTS = [
  { 
    id: 'p1', 
    name: 'John Doe', 
    age: 42, 
    gender: 'Male',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    lastVisit: '2023-06-15',
    status: 'Active'
  },
  { 
    id: 'p2', 
    name: 'Jane Smith', 
    age: 38, 
    gender: 'Female',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    lastVisit: '2023-07-22',
    status: 'Active'
  },
  { 
    id: 'p3', 
    name: 'Robert Johnson', 
    age: 65, 
    gender: 'Male',
    email: 'robert.j@example.com',
    phone: '(555) 555-1212',
    lastVisit: '2023-05-30',
    status: 'Inactive'
  },
  { 
    id: 'p4', 
    name: 'Emily Davis', 
    age: 29, 
    gender: 'Female',
    email: 'emily.davis@example.com',
    phone: '(555) 444-3333',
    lastVisit: '2023-08-05',
    status: 'Active'
  },
  { 
    id: 'p5', 
    name: 'Michael Wilson', 
    age: 51, 
    gender: 'Male',
    email: 'michael.w@example.com',
    phone: '(555) 222-1111',
    lastVisit: '2023-07-10',
    status: 'Active'
  },
];

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setPatients(MOCK_PATIENTS);
    } else {
      const filtered = MOCK_PATIENTS.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
      setPatients(filtered);
    }
  }, [searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight="bold">Patients</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={Link}
          to="/patients/new"
          size="small"
        >
          Add New Patient
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, or phone number"
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 260px)', overflow: 'auto' }}>
        <Table stickyHeader sx={{ minWidth: 650 }} aria-label="patient table">
          <TableHead sx={{ backgroundColor: 'primary.light' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Last Visit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((patient) => (
                <TableRow 
                  key={patient.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  hover
                >
                  <TableCell component="th" scope="row">
                    <Typography fontWeight="medium">{patient.name}</Typography>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{patient.email}</Typography>
                      <Typography variant="body2" color="text.secondary">{patient.phone}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>
                    <Chip 
                      label={patient.status} 
                      color={patient.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton 
                        component={Link} 
                        to={`/patients/${patient.id}`}
                        size="small"
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        component={Link} 
                        to={`/patients/${patient.id}/chart`}
                        size="small"
                        color="secondary"
                      >
                        <LocalHospitalIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        component={Link} 
                        to={`/patients/${patient.id}/appointments/new`}
                        size="small"
                        color="info"
                      >
                        <EventIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">No patients found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={patients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default PatientList; 