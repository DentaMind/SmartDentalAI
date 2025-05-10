import React, { useState, useEffect, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme } from '../../theme/ThemeContext';
import { getDentalChartColors } from '../../theme/chartColors';
import PatientPerioChart from './PatientPerioChart';
import ErrorBoundary from '../../components/ErrorBoundary';
import RestorationDentalChart from '../../components/dental/RestorationDentalChart';
import { DentalConditionType, ToothCondition } from '../../components/dental/DentalConditions';
import XrayButtonGroup from '../../components/xray/XrayButtonGroup';

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
      id={`chart-tabpanel-${index}`}
      aria-labelledby={`chart-tab-${index}`}
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
  nextAppointment: '2023-09-10',
  generalHealthStatus: 'Good',
  allergies: ['Penicillin'],
  medications: ['Lisinopril 10mg daily'],
  procedures: [
    { date: '2023-06-15', tooth: '14', procedure: 'Composite Filling', provider: 'Dr. Smith', notes: 'Distal surface, completed without complications' },
    { date: '2023-03-22', tooth: '18', procedure: 'Root Canal', provider: 'Dr. Johnson', notes: 'Completed in single visit' },
    { date: '2022-12-10', tooth: '24-25', procedure: 'Deep Cleaning', provider: 'Dr. Garcia', notes: 'Focus on periodontal maintenance' }
  ],
  xrays: [
    { date: '2023-06-15', type: 'Periapical', area: 'Upper right quadrant', findings: 'No significant pathology noted' },
    { date: '2022-12-10', type: 'Panoramic', area: 'Full mouth', findings: 'Wisdom teeth partially erupted, monitoring advised' }
  ],
  conditions: [
    { tooth: '18', condition: 'Root Canal Treatment', severity: 'Completed' },
    { tooth: '14', condition: 'Composite Filling', severity: 'Completed' },
    { tooth: '17', condition: 'Watch', severity: 'Early stage decay' },
    { tooth: '30', condition: 'Missing', severity: 'Complete' },
    { tooth: '31', condition: 'Implant Planned', severity: 'Scheduled' }
  ]
};

// Tooth number mapping in Universal Numbering System
const ADULT_TEETH_UPPER_RIGHT = [1, 2, 3, 4, 5, 6, 7, 8];
const ADULT_TEETH_UPPER_LEFT = [9, 10, 11, 12, 13, 14, 15, 16];
const ADULT_TEETH_LOWER_LEFT = [17, 18, 19, 20, 21, 22, 23, 24];
const ADULT_TEETH_LOWER_RIGHT = [25, 26, 27, 28, 29, 30, 31, 32];

const getToothColor = (toothNumber: number, conditions: any[]) => {
  const { themeSettings } = useTheme();
  const dentalColors = getDentalChartColors(themeSettings.mode, themeSettings.colorProfile);
  
  const condition = conditions.find(c => c.tooth === toothNumber.toString());
  
  if (!condition) return 'background.paper'; // Default background
  
  switch (condition.condition) {
    case 'Composite Filling':
      return dentalColors.filling;
    case 'Root Canal Treatment':
      return dentalColors.rootCanal;
    case 'Watch':
      return dentalColors.watch;
    case 'Missing':
      return dentalColors.missing;
    case 'Implant Planned':
      return dentalColors.implant;
    default:
      return 'background.paper'; // Default background
  }
};

const Tooth: React.FC<{ number: number, conditions: any[] }> = ({ number, conditions }) => {
  const color = getToothColor(number, conditions);
  
  return (
    <Box 
      sx={{ 
        width: 40, 
        height: 50, 
        border: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <Box sx={{ 
        backgroundColor: '#f5f5f5', 
        padding: '2px', 
        textAlign: 'center', 
        borderBottom: '1px solid #ccc',
        fontSize: '0.7rem',
        fontWeight: 'bold'
      }}>
        {number}
      </Box>
      <Box sx={{ 
        flex: 1, 
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {number === 30 && (
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            M
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const DentalChart: React.FC<{ conditions: any[] }> = ({ conditions }) => {
  const { themeSettings } = useTheme();
  const dentalColors = getDentalChartColors(themeSettings.mode, themeSettings.colorProfile);
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="medium">Upper Teeth</Typography>
      </Box>
      
      {/* Upper teeth */}
      <Grid container justifyContent="center" spacing={0.5} sx={{ mb: 3 }}>
        <Grid item container xs={6} justifyContent="flex-end" spacing={0.5}>
          {ADULT_TEETH_UPPER_RIGHT.map(tooth => (
            <Grid item key={tooth}>
              <Tooth number={tooth} conditions={conditions} />
            </Grid>
          ))}
        </Grid>
        <Grid item container xs={6} justifyContent="flex-start" spacing={0.5}>
          {ADULT_TEETH_UPPER_LEFT.map(tooth => (
            <Grid item key={tooth}>
              <Tooth number={tooth} conditions={conditions} />
            </Grid>
          ))}
        </Grid>
      </Grid>
      
      {/* Lower teeth */}
      <Grid container justifyContent="center" spacing={0.5}>
        <Grid item container xs={6} justifyContent="flex-end" spacing={0.5}>
          {ADULT_TEETH_LOWER_RIGHT.map(tooth => (
            <Grid item key={tooth}>
              <Tooth number={tooth} conditions={conditions} />
            </Grid>
          ))}
        </Grid>
        <Grid item container xs={6} justifyContent="flex-start" spacing={0.5}>
          {ADULT_TEETH_LOWER_LEFT.map(tooth => (
            <Grid item key={tooth}>
              <Tooth number={tooth} conditions={conditions} />
            </Grid>
          ))}
        </Grid>
      </Grid>
      
      <Box sx={{ textAlign: 'center', mt: 1 }}>
        <Typography variant="subtitle1" fontWeight="medium">Lower Teeth</Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Chart Legend
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: dentalColors.filling, 
              border: '1px solid #ccc' 
            }} />
            <Typography variant="body2">Filling</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: dentalColors.rootCanal, 
              border: '1px solid #ccc' 
            }} />
            <Typography variant="body2">Root Canal</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: dentalColors.watch, 
              border: '1px solid #ccc' 
            }} />
            <Typography variant="body2">Watch</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: dentalColors.missing, 
              border: '1px solid #ccc' 
            }} />
            <Typography variant="body2">Missing</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Add sample restorative data for testing
const MOCK_RESTORATIVE_DATA: Record<number, ToothCondition[]> = {
  1: [{ type: 'crown', material: 'porcelain' }],
  3: [{ type: 'filling', surfaces: ['O', 'M'], material: 'composite' }],
  8: [{ type: 'veneer' }],
  12: [{ type: 'filling', surfaces: ['O', 'B'], material: 'amalgam' }],
  14: [{ type: 'rootCanal' }, { type: 'crown', material: 'gold' }],
  19: [{ type: 'implant' }],
  30: [{ type: 'missing' }],
  31: [{ type: 'bridge' }],
  32: [{ type: 'extraction', date: '2023-05-15' }]
};

const PatientChart: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [patient, setPatient] = useState(MOCK_PATIENT);
  const { themeSettings } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restorativeData, setRestorativeData] = useState(MOCK_RESTORATIVE_DATA);
  const navigate = useNavigate();

  // Simulate API call
  useEffect(() => {
    // In a real app, fetch patient chart data based on patientId
    console.log(`Fetching chart data for patient ID: ${patientId}`);
    
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      // For this mock, we're just using static data
      setPatient(MOCK_PATIENT);
      setIsLoading(false);
    }, 800);
    
  }, [patientId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRestorativeDataChange = (toothNumber: number, conditions: ToothCondition[]) => {
    setRestorativeData(prev => ({
      ...prev,
      [toothNumber]: conditions
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        >
          Failed to load patient data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 4, pt: { xs: 4, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Button 
          component={Link} 
          to={`/patients/${patientId}`} 
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1 }}
        >
          Back to Patient Details
        </Button>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 1
        }}>
          <Typography variant="h4" fontWeight="bold">
            Patient Chart: {patient.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon color="primary" fontSize="small" />
            <Typography variant="body2">
              Next Appointment: {patient.nextAppointment}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<EventIcon />}
              component={Link}
              to={`/patients/${patient.id}/appointments/new`}
            >
              Schedule
            </Button>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Dental Chart" id="chart-tab-0" />
          <Tab label="Perio Chart" id="chart-tab-1" />
          <Tab label="Restorative Chart" id="chart-tab-2" />
          <Tab label="Procedures" id="chart-tab-3" />
          <Tab label="X-rays" id="chart-tab-4" />
          <Tab label="Medical Info" id="chart-tab-5" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ErrorBoundary>
            <Box>
              <Typography variant="h6" gutterBottom>
                Dental Status Chart
              </Typography>
              
              <Card variant="outlined" sx={{ mb: 3, maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                <CardContent>
                  <DentalChart conditions={patient.conditions} />
                </CardContent>
              </Card>
              
              <Typography variant="h6" gutterBottom>
                Current Conditions
              </Typography>
              
              <Card variant="outlined">
                <List>
                  {patient.conditions.map((condition, index) => (
                    <ListItem key={index} divider={index < patient.conditions.length - 1}>
                      <ListItemText
                        primary={`Tooth ${condition.tooth}: ${condition.condition}`}
                        secondary={condition.severity}
                      />
                      <Chip 
                        size="small" 
                        label={condition.condition === "Missing" ? "Treatment needed" : "Monitored"} 
                        color={condition.condition === "Missing" ? "primary" : "default"}
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Box>
          </ErrorBoundary>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ErrorBoundary>
            <PatientPerioChart />
          </ErrorBoundary>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ErrorBoundary>
            <RestorationDentalChart 
              patientId={patientId}
              conditions={restorativeData}
              onConditionChange={handleRestorativeDataChange}
            />
          </ErrorBoundary>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Procedure History
          </Typography>
          
          <Card variant="outlined">
            <List>
              {patient.procedures.map((procedure, index) => (
                <ListItem key={index} divider={index < patient.procedures.length - 1} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {procedure.procedure} (Tooth {procedure.tooth})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {procedure.date}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Provider: {procedure.provider}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {procedure.notes}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            X-Ray Records
          </Typography>
          
          <Card variant="outlined">
            <List>
              {patient.xrays.map((xray, index) => (
                <ListItem key={index} divider={index < patient.xrays.length - 1} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {xray.type} X-Ray
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {xray.date}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Area: {xray.area}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Findings: {xray.findings}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Card>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <XrayButtonGroup patientId={patientId || ''} />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Medical Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    General Health Status
                  </Typography>
                  <Typography variant="body1">
                    {patient.generalHealthStatus}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Allergies
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {patient.allergies.map((allergy, index) => (
                      <Chip 
                        key={index} 
                        label={allergy} 
                        color="error" 
                        variant="outlined" 
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Current Medications
                  </Typography>
                  <List dense>
                    {patient.medications.map((medication, index) => (
                      <ListItem key={index} divider={index < patient.medications.length - 1}>
                        <ListItemText
                          primary={medication}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default PatientChart; 