import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '../../theme/ThemeContext';
import { getPerioChartColors } from '../../theme/chartColors';

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
      id={`perio-tabpanel-${index}`}
      aria-labelledby={`perio-tab-${index}`}
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

// Mock patient data - Basic information
const MOCK_PATIENT = {
  id: 'p1',
  name: 'John Doe',
  age: 42,
  dateOfBirth: '1980-06-15',
  nextAppointment: '2023-09-10',
  lastPerioExam: '2023-03-22',
};

// Add tooth structure - Universal Numbering System (1-32)
const UPPER_RIGHT_TEETH = [1, 2, 3, 4, 5, 6, 7, 8];
const UPPER_LEFT_TEETH = [9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_LEFT_TEETH = [17, 18, 19, 20, 21, 22, 23, 24];
const LOWER_RIGHT_TEETH = [25, 26, 27, 28, 29, 30, 31, 32];

// Define probing sites - 6 sites per tooth (Mesiobuccal, Buccal, Distobuccal, Distolingual, Lingual, Mesiolingual)
const PROBE_SITES = ['MB', 'B', 'DB', 'DL', 'L', 'ML'];

// Initialize blank perio data for a full mouth
const initializePerioData = () => {
  const data: Record<string, any> = {};
  
  // Combine all teeth arrays
  const allTeeth = [...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH, ...LOWER_LEFT_TEETH, ...LOWER_RIGHT_TEETH];
  
  allTeeth.forEach(toothNumber => {
    data[toothNumber] = {
      // Probing depths for 6 sites (mm)
      probing: {
        MB: null, B: null, DB: null,
        DL: null, L: null, ML: null
      },
      // Recession measurements (mm)
      recession: {
        MB: null, B: null, DB: null,
        DL: null, L: null, ML: null
      },
      // Clinical Attachment Level (calculated from probing + recession)
      CAL: {
        MB: null, B: null, DB: null,
        DL: null, L: null, ML: null
      },
      // Bleeding on probing
      bleeding: {
        MB: false, B: false, DB: false,
        DL: false, L: false, ML: false
      },
      // Suppuration
      suppuration: {
        MB: false, B: false, DB: false,
        DL: false, L: false, ML: false
      },
      // Tooth-level measurements
      mobility: 0, // 0-3 scale
      furcation: {
        buccal: 0,
        lingual: 0,
        mesial: 0,
        distal: 0
      },
      plaque: false,
      calculus: false,
      missing: false
    };
  });
  
  return data;
};

const PatientPerioChart: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [patient, setPatient] = useState(MOCK_PATIENT);
  const [examDate, setExamDate] = useState<Date | null>(new Date());
  const [periosData, setPeriosData] = useState(initializePerioData());
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const { themeSettings } = useTheme();
  
  // Calculate periodontal diagnosis based on chart data
  const calculateDiagnosis = () => {
    let totalSites = 0;
    let sitesWithPD4to5mm = 0;
    let sitesWithPD6PlusMm = 0;
    let sitesWithBOP = 0;
    let teethWithMobility = 0;
    let teethWithFurcation = 0;
    
    // Combine all teeth arrays
    const allTeeth = [...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH, ...LOWER_LEFT_TEETH, ...LOWER_RIGHT_TEETH];
    
    allTeeth.forEach(toothNumber => {
      if (!periosData[toothNumber]?.missing) {
        // Count probing depth sites
        Object.values(periosData[toothNumber]?.probing || {}).forEach((value: number | null) => {
          if (value !== null) {
            totalSites++;
            if (value >= 6) sitesWithPD6PlusMm++;
            else if (value >= 4) sitesWithPD4to5mm++;
          }
        });
        
        // Count bleeding sites
        Object.values(periosData[toothNumber]?.bleeding || {}).forEach((value: boolean) => {
          if (value) sitesWithBOP++;
        });
        
        // Count mobility
        if (periosData[toothNumber]?.mobility > 0) {
          teethWithMobility++;
        }
        
        // Count furcation
        const furcationValues = Object.values(periosData[toothNumber]?.furcation || {});
        if (furcationValues.some((value: number) => value > 0)) {
          teethWithFurcation++;
        }
      }
    });
    
    // Calculate percentages
    const percentBOP = totalSites > 0 ? (sitesWithBOP / totalSites) * 100 : 0;
    const percentPD4to5 = totalSites > 0 ? (sitesWithPD4to5mm / totalSites) * 100 : 0;
    const percentPD6Plus = totalSites > 0 ? (sitesWithPD6PlusMm / totalSites) * 100 : 0;
    
    // Determine disease severity
    let diagnosisText = "Periodontally Healthy";
    let severity = "None";
    let description = "No significant periodontal disease detected.";
    
    if (percentPD6Plus >= 30) {
      diagnosisText = "Generalized Severe Periodontitis";
      severity = "Severe";
      description = "Characterized by significant attachment loss, deep pockets, and often furcation involvement.";
    } else if (percentPD6Plus >= 10) {
      diagnosisText = "Localized Severe Periodontitis";
      severity = "Severe";
      description = "Severe bone loss and deep pockets in specific areas.";
    } else if (percentPD4to5 >= 30) {
      diagnosisText = "Generalized Moderate Periodontitis";
      severity = "Moderate";
      description = "Widespread moderate attachment loss and pocket depths.";
    } else if (percentPD4to5 >= 10) {
      diagnosisText = "Localized Moderate Periodontitis";
      severity = "Moderate";
      description = "Moderate bone loss in specific areas.";
    } else if (percentBOP >= 30 && percentPD4to5 > 0) {
      diagnosisText = "Generalized Mild Periodontitis";
      severity = "Mild";
      description = "Early periodontal disease with minimal attachment loss.";
    } else if (percentBOP >= 10 && percentPD4to5 > 0) {
      diagnosisText = "Localized Mild Periodontitis";
      severity = "Mild";
      description = "Early periodontal disease in specific areas.";
    } else if (percentBOP >= 10) {
      diagnosisText = "Gingivitis";
      severity = "Gingivitis";
      description = "Inflammation of the gums without bone loss or deep pockets.";
    }
    
    return {
      diagnosisText,
      severity,
      description,
      stats: {
        percentBOP: Math.round(percentBOP),
        percentPD4to5: Math.round(percentPD4to5),
        percentPD6Plus: Math.round(percentPD6Plus),
        teethWithMobility,
        teethWithFurcation
      }
    };
  };
  
  // Simulate API call
  useEffect(() => {
    // In a real app, fetch patient periodontal chart data based on patientId
    console.log(`Fetching perio data for patient ID: ${patientId}`);
    // For this mock, we're just using static data
  }, [patientId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleProbingChange = (toothNumber: number, site: string, value: number | null) => {
    setPeriosData(prevData => ({
      ...prevData,
      [toothNumber]: {
        ...prevData[toothNumber],
        probing: {
          ...prevData[toothNumber].probing,
          [site]: value
        },
        // Recalculate CAL
        CAL: {
          ...prevData[toothNumber].CAL,
          [site]: value !== null && prevData[toothNumber].recession[site] !== null 
            ? value + (prevData[toothNumber].recession[site] || 0) 
            : null
        }
      }
    }));
  };
  
  const handleRecessionChange = (toothNumber: number, site: string, value: number | null) => {
    setPeriosData(prevData => ({
      ...prevData,
      [toothNumber]: {
        ...prevData[toothNumber],
        recession: {
          ...prevData[toothNumber].recession,
          [site]: value
        },
        // Recalculate CAL
        CAL: {
          ...prevData[toothNumber].CAL,
          [site]: prevData[toothNumber].probing[site] !== null && value !== null 
            ? (prevData[toothNumber].probing[site] || 0) + value 
            : null
        }
      }
    }));
  };
  
  const toggleBleeding = (toothNumber: number, site: string) => {
    setPeriosData(prevData => ({
      ...prevData,
      [toothNumber]: {
        ...prevData[toothNumber],
        bleeding: {
          ...prevData[toothNumber].bleeding,
          [site]: !prevData[toothNumber].bleeding[site]
        }
      }
    }));
  };
  
  const toggleSuppuration = (toothNumber: number, site: string) => {
    setPeriosData(prevData => ({
      ...prevData,
      [toothNumber]: {
        ...prevData[toothNumber],
        suppuration: {
          ...prevData[toothNumber].suppuration,
          [site]: !prevData[toothNumber].suppuration[site]
        }
      }
    }));
  };
  
  const handleMobilityChange = (toothNumber: number, value: number) => {
    setPeriosData(prevData => ({
      ...prevData,
      [toothNumber]: {
        ...prevData[toothNumber],
        mobility: value
      }
    }));
  };
  
  const handleFurcationChange = (toothNumber: number, location: string, value: number) => {
    setPeriosData(prevData => ({
      ...prevData,
      [toothNumber]: {
        ...prevData[toothNumber],
        furcation: {
          ...prevData[toothNumber].furcation,
          [location]: value
        }
      }
    }));
  };
  
  const toggleMissingTooth = (toothNumber: number) => {
    setPeriosData(prevData => ({
      ...prevData,
      [toothNumber]: {
        ...prevData[toothNumber],
        missing: !prevData[toothNumber].missing
      }
    }));
  };
  
  const toggleVoiceInput = () => {
    setIsVoiceActive(!isVoiceActive);
    // In a real app, this would activate the microphone and voice recognition
  };
  
  const handleSaveChart = () => {
    console.log('Saving perio chart data:', periosData);
    // In a real app, this would save the data to the backend
  };
  
  const goToEnhancedView = () => {
    navigate(`/patients/${patientId}/perio-enhanced`);
  };
  
  const renderProbingCell = (toothNumber: number, site: string) => {
    const perioColors = getPerioChartColors(themeSettings.mode, themeSettings.colorProfile);
    
    const value = periosData[toothNumber]?.probing[site];
    
    // Determine background color based on probing depth
    let bgColor = perioColors.normal; // Default for 0-3mm (healthy)
    if (value !== null) {
      if (value >= 6) {
        bgColor = perioColors.severe; // 6mm+ (severe periodontitis)
      } else if (value >= 4) {
        bgColor = perioColors.mild; // 4-5mm (early periodontitis)
      }
    }
    
    return (
      <Box 
        component="div" 
        sx={{ 
          width: 36, 
          height: 36, 
          border: '1px solid #ccc',
          bgcolor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <TextField
          size="small"
          inputProps={{ 
            min: 0, 
            max: 12,
            style: { 
              textAlign: 'center', 
              padding: '2px', 
              width: '100%', 
              height: '100%',
              backgroundColor: 'transparent'
            } 
          }}
          variant="standard"
          value={value === null ? '' : value}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value);
            handleProbingChange(toothNumber, site, val);
          }}
          sx={{ width: '100%' }}
        />
        {periosData[toothNumber]?.bleeding[site] && (
          <Box 
            sx={{ 
              position: 'absolute', 
              width: 6, 
              height: 6, 
              bgcolor: perioColors.bleeding, 
              borderRadius: '50%',
              top: 2, 
              right: 2 
            }} 
          />
        )}
        {periosData[toothNumber]?.suppuration[site] && (
          <Box 
            sx={{ 
              position: 'absolute', 
              width: 6, 
              height: 6, 
              bgcolor: perioColors.suppuration, 
              borderRadius: '50%',
              bottom: 2, 
              right: 2 
            }} 
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" fontWeight="medium">
          Periodontal Assessment
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button 
            variant="outlined"
            color="primary"
            size="small"
            onClick={goToEnhancedView}
          >
            Try Enhanced View
          </Button>
          <Button 
            variant="contained"
            color={isVoiceActive ? 'error' : 'primary'}
            startIcon={<MicIcon />}
            size="small"
            onClick={toggleVoiceInput}
          >
            {isVoiceActive ? 'Stop Voice' : 'Voice Input'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            size="small"
            onClick={handleSaveChart}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            size="small"
          >
            Print
          </Button>
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
          <Tab label="Probing Depths" id="perio-tab-0" />
          <Tab label="Recession" id="perio-tab-1" />
          <Tab label="Clinical Attachment" id="perio-tab-2" />
          <Tab label="Bleeding/Suppuration" id="perio-tab-3" />
          <Tab label="Mobility/Furcation" id="perio-tab-4" />
          <Tab label="Summary" id="perio-tab-5" />
        </Tabs>

        {/* Sample content for the first tab - we'll add the rest later */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Probing Depths (mm)
            </Typography>
            
            {/* Upper teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upper Teeth - Facial View
              </Typography>
              
              {/* Tooth numbers */}
              <Grid container spacing={0.5} justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-number-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {toothNumber}
                  </Grid>
                ))}
              </Grid>
              
              {/* MB Probing */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-MB-${toothNumber}`}>
                    {renderProbingCell(toothNumber, 'MB')}
                  </Grid>
                ))}
              </Grid>
              
              {/* B Probing */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-B-${toothNumber}`}>
                    {renderProbingCell(toothNumber, 'B')}
                  </Grid>
                ))}
              </Grid>
              
              {/* DB Probing */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-DB-${toothNumber}`}>
                    {renderProbingCell(toothNumber, 'DB')}
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Explanatory note */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="caption" color="text.secondary">
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Enter probing depths for each tooth. Red dots indicate bleeding, orange dots indicate suppuration.
                Click on a site to toggle bleeding/suppuration markers or use voice commands.
              </Typography>
            </Box>
            
            {/* Lower teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lower Teeth - Facial View
              </Typography>
              
              {/* ML Probing */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-ML-${toothNumber}`}>
                    {renderProbingCell(toothNumber, 'ML')}
                  </Grid>
                ))}
              </Grid>
              
              {/* L Probing */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-L-${toothNumber}`}>
                    {renderProbingCell(toothNumber, 'L')}
                  </Grid>
                ))}
              </Grid>
              
              {/* DL Probing */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-DL-${toothNumber}`}>
                    {renderProbingCell(toothNumber, 'DL')}
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Tooth numbers */}
            <Grid item xs={12} container justifyContent="center">
              {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                <Grid item key={`lower-number-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {toothNumber}
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* We'll implement the other tabs in subsequent updates */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Gingival Recession Measurements (mm)
            </Typography>
            
            {/* Upper teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upper Teeth - Facial View
              </Typography>
              
              {/* Tooth numbers */}
              <Grid container spacing={0.5} justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-number-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {toothNumber}
                  </Grid>
                ))}
              </Grid>
              
              {/* MB Recession */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-MB-rec-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: periosData[toothNumber]?.recession?.MB ? getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).recession : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TextField
                        size="small"
                        inputProps={{ 
                          min: 0, 
                          max: 9,
                          style: { 
                            textAlign: 'center', 
                            padding: '2px', 
                            width: '100%', 
                            height: '100%',
                            backgroundColor: 'transparent'
                          } 
                        }}
                        variant="standard"
                        value={periosData[toothNumber]?.recession?.MB === null ? '' : periosData[toothNumber]?.recession?.MB}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleRecessionChange(toothNumber, 'MB', val);
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* B Recession */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-B-rec-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: periosData[toothNumber]?.recession?.B ? getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).recession : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TextField
                        size="small"
                        inputProps={{ 
                          min: 0, 
                          max: 9,
                          style: { 
                            textAlign: 'center', 
                            padding: '2px', 
                            width: '100%', 
                            height: '100%',
                            backgroundColor: 'transparent'
                          } 
                        }}
                        variant="standard"
                        value={periosData[toothNumber]?.recession?.B === null ? '' : periosData[toothNumber]?.recession?.B}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleRecessionChange(toothNumber, 'B', val);
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* DB Recession */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-DB-rec-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: periosData[toothNumber]?.recession?.DB ? getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).recession : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TextField
                        size="small"
                        inputProps={{ 
                          min: 0, 
                          max: 9,
                          style: { 
                            textAlign: 'center', 
                            padding: '2px', 
                            width: '100%', 
                            height: '100%',
                            backgroundColor: 'transparent'
                          } 
                        }}
                        variant="standard"
                        value={periosData[toothNumber]?.recession?.DB === null ? '' : periosData[toothNumber]?.recession?.DB}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleRecessionChange(toothNumber, 'DB', val);
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Explanatory note */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="caption" color="text.secondary">
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Enter recession measurements for each tooth site. Positive values represent gingival recession measured in millimeters.
              </Typography>
            </Box>
            
            {/* Lower teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lower Teeth - Facial View
              </Typography>
              
              {/* ML Recession */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-ML-rec-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: periosData[toothNumber]?.recession?.ML ? getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).recession : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TextField
                        size="small"
                        inputProps={{ 
                          min: 0, 
                          max: 9,
                          style: { 
                            textAlign: 'center', 
                            padding: '2px', 
                            width: '100%', 
                            height: '100%',
                            backgroundColor: 'transparent'
                          } 
                        }}
                        variant="standard"
                        value={periosData[toothNumber]?.recession?.ML === null ? '' : periosData[toothNumber]?.recession?.ML}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleRecessionChange(toothNumber, 'ML', val);
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* L Recession */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-L-rec-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: periosData[toothNumber]?.recession?.L ? getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).recession : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TextField
                        size="small"
                        inputProps={{ 
                          min: 0, 
                          max: 9,
                          style: { 
                            textAlign: 'center', 
                            padding: '2px', 
                            width: '100%', 
                            height: '100%',
                            backgroundColor: 'transparent'
                          } 
                        }}
                        variant="standard"
                        value={periosData[toothNumber]?.recession?.L === null ? '' : periosData[toothNumber]?.recession?.L}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleRecessionChange(toothNumber, 'L', val);
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* DL Recession */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-DL-rec-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: periosData[toothNumber]?.recession?.DL ? getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).recession : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TextField
                        size="small"
                        inputProps={{ 
                          min: 0, 
                          max: 9,
                          style: { 
                            textAlign: 'center', 
                            padding: '2px', 
                            width: '100%', 
                            height: '100%',
                            backgroundColor: 'transparent'
                          } 
                        }}
                        variant="standard"
                        value={periosData[toothNumber]?.recession?.DL === null ? '' : periosData[toothNumber]?.recession?.DL}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleRecessionChange(toothNumber, 'DL', val);
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Tooth numbers */}
            <Grid item xs={12} container justifyContent="center">
              {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                <Grid item key={`lower-number-rec-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {toothNumber}
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Clinical Attachment Level (CAL) in mm
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Clinical Attachment Level is automatically calculated as the sum of probing depth and recession measurements.
                CAL = Probing Depth + Recession
              </Typography>
            </Box>
            
            {/* Upper teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upper Teeth - Facial View
              </Typography>
              
              {/* Tooth numbers */}
              <Grid container spacing={0.5} justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-number-cal-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {toothNumber}
                  </Grid>
                ))}
              </Grid>
              
              {/* MB CAL */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-MB-cal-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (theme) => {
                          const calValue = periosData[toothNumber]?.CAL?.MB;
                          if (calValue === null || calValue === undefined) return theme.palette.text.primary;
                          if (calValue >= 6) return theme.palette.error.main; // Severe
                          if (calValue >= 4) return theme.palette.warning.main; // Moderate
                          return theme.palette.success.main; // Mild/Normal
                        },
                        fontWeight: 'bold'
                      }}
                    >
                      {periosData[toothNumber]?.CAL?.MB === null ? '' : periosData[toothNumber]?.CAL?.MB}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* B CAL */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-B-cal-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (theme) => {
                          const calValue = periosData[toothNumber]?.CAL?.B;
                          if (calValue === null || calValue === undefined) return theme.palette.text.primary;
                          if (calValue >= 6) return theme.palette.error.main; // Severe
                          if (calValue >= 4) return theme.palette.warning.main; // Moderate
                          return theme.palette.success.main; // Mild/Normal
                        },
                        fontWeight: 'bold'
                      }}
                    >
                      {periosData[toothNumber]?.CAL?.B === null ? '' : periosData[toothNumber]?.CAL?.B}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* DB CAL */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-DB-cal-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (theme) => {
                          const calValue = periosData[toothNumber]?.CAL?.DB;
                          if (calValue === null || calValue === undefined) return theme.palette.text.primary;
                          if (calValue >= 6) return theme.palette.error.main; // Severe
                          if (calValue >= 4) return theme.palette.warning.main; // Moderate
                          return theme.palette.success.main; // Mild/Normal
                        },
                        fontWeight: 'bold'
                      }}
                    >
                      {periosData[toothNumber]?.CAL?.DB === null ? '' : periosData[toothNumber]?.CAL?.DB}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Lower teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lower Teeth - Facial View
              </Typography>
              
              {/* ML CAL */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-ML-cal-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (theme) => {
                          const calValue = periosData[toothNumber]?.CAL?.ML;
                          if (calValue === null || calValue === undefined) return theme.palette.text.primary;
                          if (calValue >= 6) return theme.palette.error.main; // Severe
                          if (calValue >= 4) return theme.palette.warning.main; // Moderate
                          return theme.palette.success.main; // Mild/Normal
                        },
                        fontWeight: 'bold'
                      }}
                    >
                      {periosData[toothNumber]?.CAL?.ML === null ? '' : periosData[toothNumber]?.CAL?.ML}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* L CAL */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-L-cal-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (theme) => {
                          const calValue = periosData[toothNumber]?.CAL?.L;
                          if (calValue === null || calValue === undefined) return theme.palette.text.primary;
                          if (calValue >= 6) return theme.palette.error.main; // Severe
                          if (calValue >= 4) return theme.palette.warning.main; // Moderate
                          return theme.palette.success.main; // Mild/Normal
                        },
                        fontWeight: 'bold'
                      }}
                    >
                      {periosData[toothNumber]?.CAL?.L === null ? '' : periosData[toothNumber]?.CAL?.L}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* DL CAL */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-DL-cal-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (theme) => {
                          const calValue = periosData[toothNumber]?.CAL?.DL;
                          if (calValue === null || calValue === undefined) return theme.palette.text.primary;
                          if (calValue >= 6) return theme.palette.error.main; // Severe
                          if (calValue >= 4) return theme.palette.warning.main; // Moderate
                          return theme.palette.success.main; // Mild/Normal
                        },
                        fontWeight: 'bold'
                      }}
                    >
                      {periosData[toothNumber]?.CAL?.DL === null ? '' : periosData[toothNumber]?.CAL?.DL}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Tooth numbers */}
            <Grid item xs={12} container justifyContent="center">
              {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                <Grid item key={`lower-number-cal-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {toothNumber}
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Bleeding & Suppuration Assessment
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Click on a site to toggle bleeding or suppuration indicators. Empty cells indicate no bleeding or suppuration.
              </Typography>
            </Box>
            
            {/* Upper teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upper Teeth - Facial View
              </Typography>
              
              {/* Tooth numbers */}
              <Grid container spacing={0.5} justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-number-bleed-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {toothNumber}
                  </Grid>
                ))}
              </Grid>
              
              {/* Bleeding/Suppuration Headers */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-header-${toothNumber}`} sx={{ width: 36, textAlign: 'center' }}>
                    <Box sx={{ fontSize: '0.6rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box>B = Bleeding</Box>
                      <Box>S = Suppuration</Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* MB Bleeding/Suppuration */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-MB-bleed-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleBleeding(toothNumber, 'MB')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSuppuration(toothNumber, 'MB');
                      }}
                    >
                      {periosData[toothNumber]?.bleeding?.MB && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).bleeding,
                          fontWeight: 'bold'
                        }}>
                          B
                        </Box>
                      )}
                      {periosData[toothNumber]?.suppuration?.MB && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).suppuration,
                          fontWeight: 'bold'
                        }}>
                          S
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* B Bleeding/Suppuration */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-B-bleed-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleBleeding(toothNumber, 'B')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSuppuration(toothNumber, 'B');
                      }}
                    >
                      {periosData[toothNumber]?.bleeding?.B && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).bleeding,
                          fontWeight: 'bold'
                        }}>
                          B
                        </Box>
                      )}
                      {periosData[toothNumber]?.suppuration?.B && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).suppuration,
                          fontWeight: 'bold'
                        }}>
                          S
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* DB Bleeding/Suppuration */}
              <Grid item xs={12} container justifyContent="center">
                {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                  <Grid item key={`upper-DB-bleed-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleBleeding(toothNumber, 'DB')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSuppuration(toothNumber, 'DB');
                      }}
                    >
                      {periosData[toothNumber]?.bleeding?.DB && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).bleeding,
                          fontWeight: 'bold'
                        }}>
                          B
                        </Box>
                      )}
                      {periosData[toothNumber]?.suppuration?.DB && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).suppuration,
                          fontWeight: 'bold'
                        }}>
                          S
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* Site labels */}
              <Grid item xs={12} container justifyContent="center">
                {[...Array(UPPER_RIGHT_TEETH.length + UPPER_LEFT_TEETH.length)].map((_, index) => (
                  <Grid item key={`upper-site-label-${index}`} sx={{ width: 36, textAlign: 'center' }}>
                    <Box sx={{ fontSize: '0.6rem', display: 'flex', justifyContent: 'center' }}>
                      {index % 3 === 0 ? 'MB' : index % 3 === 1 ? 'B' : 'DB'}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Lower teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lower Teeth - Facial View
              </Typography>
              
              {/* Site labels */}
              <Grid item xs={12} container justifyContent="center">
                {[...Array(LOWER_RIGHT_TEETH.length + LOWER_LEFT_TEETH.length)].map((_, index) => (
                  <Grid item key={`lower-site-label-${index}`} sx={{ width: 36, textAlign: 'center' }}>
                    <Box sx={{ fontSize: '0.6rem', display: 'flex', justifyContent: 'center' }}>
                      {index % 3 === 0 ? 'ML' : index % 3 === 1 ? 'L' : 'DL'}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* ML Bleeding/Suppuration */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-ML-bleed-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleBleeding(toothNumber, 'ML')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSuppuration(toothNumber, 'ML');
                      }}
                    >
                      {periosData[toothNumber]?.bleeding?.ML && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).bleeding,
                          fontWeight: 'bold'
                        }}>
                          B
                        </Box>
                      )}
                      {periosData[toothNumber]?.suppuration?.ML && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).suppuration,
                          fontWeight: 'bold'
                        }}>
                          S
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* L Bleeding/Suppuration */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-L-bleed-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleBleeding(toothNumber, 'L')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSuppuration(toothNumber, 'L');
                      }}
                    >
                      {periosData[toothNumber]?.bleeding?.L && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).bleeding,
                          fontWeight: 'bold'
                        }}>
                          B
                        </Box>
                      )}
                      {periosData[toothNumber]?.suppuration?.L && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).suppuration,
                          fontWeight: 'bold'
                        }}>
                          S
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {/* DL Bleeding/Suppuration */}
              <Grid item xs={12} container justifyContent="center">
                {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                  <Grid item key={`lower-DL-bleed-${toothNumber}`}>
                    <Box 
                      component="div" 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        border: '1px solid #ccc',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleBleeding(toothNumber, 'DL')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleSuppuration(toothNumber, 'DL');
                      }}
                    >
                      {periosData[toothNumber]?.bleeding?.DL && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).bleeding,
                          fontWeight: 'bold'
                        }}>
                          B
                        </Box>
                      )}
                      {periosData[toothNumber]?.suppuration?.DL && (
                        <Box sx={{ 
                          color: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).suppuration,
                          fontWeight: 'bold'
                        }}>
                          S
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Tooth numbers */}
            <Grid item xs={12} container justifyContent="center">
              {[...LOWER_RIGHT_TEETH.slice().reverse(), ...LOWER_LEFT_TEETH.slice().reverse()].map(toothNumber => (
                <Grid item key={`lower-number-bleed-${toothNumber}`} sx={{ width: 36, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {toothNumber}
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Tooth Mobility & Furcation Assessment
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Record tooth mobility (0-3) and furcation involvement (0-3) for multi-rooted teeth.
                Mobility is measured for the entire tooth, while furcation is recorded for specific sites.
              </Typography>
            </Box>
            
            {/* Upper teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upper Teeth
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tooth</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Mobility</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Missing</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }} colSpan={3}>Furcation</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>Mesial</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>Buccal</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>Distal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH].map(toothNumber => (
                      <TableRow key={`mobility-upper-${toothNumber}`}>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{toothNumber}</TableCell>
                        <TableCell align="center">
                          <Select
                            value={periosData[toothNumber]?.mobility || 0}
                            onChange={(e) => handleMobilityChange(toothNumber, Number(e.target.value))}
                            size="small"
                            sx={{ minWidth: '60px' }}
                            disabled={periosData[toothNumber]?.missing}
                          >
                            <MenuItem value={0}>0</MenuItem>
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                            <MenuItem value={3}>3</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Toggle missing tooth">
                            <Checkbox
                              checked={periosData[toothNumber]?.missing || false}
                              onChange={() => toggleMissingTooth(toothNumber)}
                            />
                          </Tooltip>
                        </TableCell>
                        {/* Only show furcation options for multi-rooted teeth (molars and premolars) */}
                        {(toothNumber >= 1 && toothNumber <= 5) || (toothNumber >= 12 && toothNumber <= 16) ? (
                          <>
                            <TableCell align="center">
                              <Select
                                value={periosData[toothNumber]?.furcation?.mesial || 0}
                                onChange={(e) => handleFurcationChange(toothNumber, 'mesial', Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: '60px' }}
                                disabled={periosData[toothNumber]?.missing}
                              >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>I</MenuItem>
                                <MenuItem value={2}>II</MenuItem>
                                <MenuItem value={3}>III</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell align="center">
                              <Select
                                value={periosData[toothNumber]?.furcation?.buccal || 0}
                                onChange={(e) => handleFurcationChange(toothNumber, 'buccal', Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: '60px' }}
                                disabled={periosData[toothNumber]?.missing}
                              >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>I</MenuItem>
                                <MenuItem value={2}>II</MenuItem>
                                <MenuItem value={3}>III</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell align="center">
                              <Select
                                value={periosData[toothNumber]?.furcation?.distal || 0}
                                onChange={(e) => handleFurcationChange(toothNumber, 'distal', Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: '60px' }}
                                disabled={periosData[toothNumber]?.missing}
                              >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>I</MenuItem>
                                <MenuItem value={2}>II</MenuItem>
                                <MenuItem value={3}>III</MenuItem>
                              </Select>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell colSpan={3} align="center">N/A</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            {/* Lower teeth - display in anatomical order */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lower Teeth
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tooth</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Mobility</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Missing</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }} colSpan={3}>Furcation</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>Mesial</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>Lingual</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>Distal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...LOWER_LEFT_TEETH, ...LOWER_RIGHT_TEETH].map(toothNumber => (
                      <TableRow key={`mobility-lower-${toothNumber}`}>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{toothNumber}</TableCell>
                        <TableCell align="center">
                          <Select
                            value={periosData[toothNumber]?.mobility || 0}
                            onChange={(e) => handleMobilityChange(toothNumber, Number(e.target.value))}
                            size="small"
                            sx={{ minWidth: '60px' }}
                            disabled={periosData[toothNumber]?.missing}
                          >
                            <MenuItem value={0}>0</MenuItem>
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                            <MenuItem value={3}>3</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Toggle missing tooth">
                            <Checkbox
                              checked={periosData[toothNumber]?.missing || false}
                              onChange={() => toggleMissingTooth(toothNumber)}
                            />
                          </Tooltip>
                        </TableCell>
                        {/* Only show furcation options for multi-rooted teeth (molars and premolars) */}
                        {(toothNumber >= 17 && toothNumber <= 21) || (toothNumber >= 28 && toothNumber <= 32) ? (
                          <>
                            <TableCell align="center">
                              <Select
                                value={periosData[toothNumber]?.furcation?.mesial || 0}
                                onChange={(e) => handleFurcationChange(toothNumber, 'mesial', Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: '60px' }}
                                disabled={periosData[toothNumber]?.missing}
                              >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>I</MenuItem>
                                <MenuItem value={2}>II</MenuItem>
                                <MenuItem value={3}>III</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell align="center">
                              <Select
                                value={periosData[toothNumber]?.furcation?.lingual || 0}
                                onChange={(e) => handleFurcationChange(toothNumber, 'lingual', Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: '60px' }}
                                disabled={periosData[toothNumber]?.missing}
                              >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>I</MenuItem>
                                <MenuItem value={2}>II</MenuItem>
                                <MenuItem value={3}>III</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell align="center">
                              <Select
                                value={periosData[toothNumber]?.furcation?.distal || 0}
                                onChange={(e) => handleFurcationChange(toothNumber, 'distal', Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: '60px' }}
                                disabled={periosData[toothNumber]?.missing}
                              >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>I</MenuItem>
                                <MenuItem value={2}>II</MenuItem>
                                <MenuItem value={3}>III</MenuItem>
                              </Select>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell colSpan={3} align="center">N/A</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            {/* Legend */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Mobility & Furcation Legend
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Mobility Grades</Typography>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2"><strong>0:</strong> No mobility</Typography>
                      <Typography variant="body2"><strong>1:</strong> Slight mobility (&lt; 1mm horizontal movement)</Typography>
                      <Typography variant="body2"><strong>2:</strong> Moderate mobility (1-2mm horizontal movement)</Typography>
                      <Typography variant="body2"><strong>3:</strong> Severe mobility (&gt;2mm horizontal/vertical movement)</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Furcation Grades</Typography>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2"><strong>0:</strong> No furcation involvement</Typography>
                      <Typography variant="body2"><strong>I:</strong> Initial furcation (probe enters but not through)</Typography>
                      <Typography variant="body2"><strong>II:</strong> Partial furcation (probe enters but not through)</Typography>
                      <Typography variant="body2"><strong>III:</strong> Through-and-through furcation</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
        
        {/* Add the diagnostic summary to the Summary tab */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Periodontal Assessment Summary
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Diagnosis
                      </Typography>
                      
                      {(() => {
                        const diagnosis = calculateDiagnosis();
                        let SeverityIcon;
                        let severityColor;
                        
                        switch(diagnosis.severity) {
                          case 'Severe':
                            SeverityIcon = ErrorIcon;
                            severityColor = 'error';
                            break;
                          case 'Moderate':
                            SeverityIcon = WarningIcon;
                            severityColor = 'warning';
                            break;
                          case 'Mild':
                          case 'Gingivitis':
                            SeverityIcon = InfoIcon;
                            severityColor = 'info';
                            break;
                          default:
                            SeverityIcon = CheckCircleIcon;
                            severityColor = 'success';
                        }
                        
                        return (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <SeverityIcon color={severityColor} />
                              <Typography variant="h6" color={`${severityColor}.main`}>
                                {diagnosis.diagnosisText}
                              </Typography>
                            </Box>
                            <Typography variant="body2">{diagnosis.description}</Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>Key Findings:</Typography>
                            <Typography variant="body2">• Bleeding on Probing: {diagnosis.stats.percentBOP}% of sites</Typography>
                            <Typography variant="body2">• 4-5mm Pockets: {diagnosis.stats.percentPD4to5}% of sites</Typography>
                            <Typography variant="body2">• 6mm+ Pockets: {diagnosis.stats.percentPD6Plus}% of sites</Typography>
                            <Typography variant="body2">• Teeth with Mobility: {diagnosis.stats.teethWithMobility}</Typography>
                            <Typography variant="body2">• Teeth with Furcation Involvement: {diagnosis.stats.teethWithFurcation}</Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Treatment Recommendations
                    </Typography>
                    
                    {(() => {
                      const diagnosis = calculateDiagnosis();
                      
                      switch(diagnosis.severity) {
                        case 'Severe':
                          return (
                            <>
                              <Typography variant="body2">• Comprehensive periodontal therapy</Typography>
                              <Typography variant="body2">• Surgical intervention may be indicated</Typography>
                              <Typography variant="body2">• Frequent periodontal maintenance (3-month intervals)</Typography>
                              <Typography variant="body2">• Antimicrobial therapy as adjunct treatment</Typography>
                              <Typography variant="body2">• Consider referral to periodontist</Typography>
                            </>
                          );
                        case 'Moderate':
                          return (
                            <>
                              <Typography variant="body2">• Non-surgical periodontal therapy (SRP)</Typography>
                              <Typography variant="body2">• Reevaluation after 4-6 weeks</Typography>
                              <Typography variant="body2">• Periodontal maintenance every 3-4 months</Typography>
                              <Typography variant="body2">• Consider local antimicrobial agents</Typography>
                            </>
                          );
                        case 'Mild':
                          return (
                            <>
                              <Typography variant="body2">• Prophylaxis or localized SRP</Typography>
                              <Typography variant="body2">• Oral hygiene instruction</Typography>
                              <Typography variant="body2">• 6-month recall with periodontal monitoring</Typography>
                            </>
                          );
                        case 'Gingivitis':
                          return (
                            <>
                              <Typography variant="body2">• Dental prophylaxis</Typography>
                              <Typography variant="body2">• Oral hygiene instruction</Typography>
                              <Typography variant="body2">• 6-month recall</Typography>
                            </>
                          );
                        default:
                          return (
                            <>
                              <Typography variant="body2">• Regular 6-month dental check-ups</Typography>
                              <Typography variant="body2">• Maintain good oral hygiene</Typography>
                            </>
                          );
                      }
                    })()}
                  </CardContent>
                </Card>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  This assessment is based on the current periodontal examination data. 
                  A comprehensive assessment should include radiographs and patient risk factors.
                </Alert>
              </Grid>
            </Grid>
            
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Comparison with Previous Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No previous periodontal assessments available for comparison.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Voice input status */}
      {isVoiceActive && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle2" gutterBottom>
            Voice Input Active
          </Typography>
          <Typography variant="body2">
            Say commands like "Tooth 8, mesio-buccal, 3mm" or "Tooth 8, bleeding on mesio-buccal"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PatientPerioChart; 