import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Tabs, 
  Tab, 
  Button, 
  Card, 
  CardContent,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

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
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Mock patient data
const MOCK_PATIENT = {
  id: 'p1',
  name: 'John Doe',
  age: 42,
  dateOfBirth: '1980-06-15',
  gender: 'Male',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
  address: '123 Main St, Anytown, CA 12345',
  status: 'Active',
  insurance: 'Delta Dental PPO',
  memberID: 'DDP12345678',
  emergencyContact: 'Jane Doe (Wife) - (555) 987-6543',
  medicalHistory: [
    { condition: 'Hypertension', status: 'Controlled with medication' },
    { condition: 'Allergies', status: 'Penicillin' }
  ],
  lastVisit: '2023-06-15',
  nextAppointment: '2023-09-10',
  appointments: [
    { date: '2023-06-15', reason: 'Regular checkup', provider: 'Dr. Smith' },
    { date: '2023-03-22', reason: 'Filling replacement', provider: 'Dr. Johnson' },
    { date: '2022-12-10', reason: 'Annual checkup', provider: 'Dr. Smith' }
  ],
  treatments: [
    { date: '2023-06-15', procedure: 'Dental cleaning', tooth: 'All', status: 'Completed' },
    { date: '2023-03-22', procedure: 'Composite filling', tooth: '14', status: 'Completed' },
    { date: '2022-12-10', procedure: 'X-ray full set', tooth: 'All', status: 'Completed' }
  ],
  notes: [
    { date: '2023-06-15', author: 'Dr. Smith', content: 'Patient reports no discomfort. Continue regular cleaning schedule.' },
    { date: '2023-03-22', author: 'Dr. Johnson', content: 'Replaced amalgam filling with composite on tooth 14. No complications.' },
  ]
};

const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [patient, setPatient] = useState(MOCK_PATIENT);

  // Simulate API call
  useEffect(() => {
    // In a real app, fetch patient data based on patientId
    console.log(`Fetching data for patient ID: ${patientId}`);
    // For this mock, we're just using static data
  }, [patientId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ width: 70, height: 70, bgcolor: 'primary.main' }}
            >
              {patient.name.split(' ').map(name => name[0]).join('')}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              {patient.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip label={`ID: ${patient.id}`} size="small" />
              <Chip 
                label={patient.status} 
                color={patient.status === 'Active' ? 'success' : 'default'}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {patient.age} years old • {patient.gender}
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 1 
            }}>
              <Button 
                variant="outlined" 
                startIcon={<EventIcon />}
                component={Link}
                to={`/patients/${patient.id}/appointments/new`}
                size="small"
              >
                Schedule
              </Button>
              <Button 
                variant="contained" 
                startIcon={<LocalHospitalIcon />}
                component={Link}
                to={`/patients/${patient.id}/chart`}
                size="small"
              >
                Chart
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" id="patient-tab-0" />
          <Tab label="Medical History" id="patient-tab-1" />
          <Tab label="Appointments" id="patient-tab-2" />
          <Tab label="Treatment History" id="patient-tab-3" />
          <Tab label="Notes" id="patient-tab-4" />
          <Tab label="Billing" id="patient-tab-5" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={patient.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone"
                        secondary={patient.phone}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <HomeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={patient.address}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <MedicalInformationIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Emergency Contact"
                        secondary={patient.emergencyContact}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Insurance Information
                  </Typography>
                  <Typography variant="body1">
                    {patient.insurance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Member ID: {patient.memberID}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Upcoming Appointment
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon color="primary" />
                    <Typography variant="body1">
                      {patient.nextAppointment} 
                    </Typography>
                  </Box>
                  <Button 
                    variant="text" 
                    size="small" 
                    sx={{ mt: 1 }}
                    component={Link}
                    to={`/patients/${patient.id}/appointments/new`}
                  >
                    Reschedule
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medical Conditions
              </Typography>
              <List>
                {patient.medicalHistory.map((item, index) => (
                  <ListItem key={index} divider={index < patient.medicalHistory.length - 1}>
                    <ListItemText
                      primary={item.condition}
                      secondary={item.status}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment History
              </Typography>
              <List>
                {patient.appointments.map((appointment, index) => (
                  <ListItem key={index} divider={index < patient.appointments.length - 1}>
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${appointment.date} - ${appointment.reason}`}
                      secondary={appointment.provider}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Treatment History
              </Typography>
              <List>
                {patient.treatments.map((treatment, index) => (
                  <ListItem key={index} divider={index < patient.treatments.length - 1}>
                    <ListItemIcon>
                      <LocalHospitalIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${treatment.date} - ${treatment.procedure} - ${treatment.tooth}`}
                      secondary={treatment.status}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <List>
                {patient.notes.map((note, index) => (
                  <ListItem key={index} divider={index < patient.notes.length - 1}>
                    <ListItemText
                      primary={note.date}
                      secondary={note.content}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing
              </Typography>
              <Typography variant="body1">
                {/* Add billing information here */}
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default PatientDetail;