import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Snackbar,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InfoIcon from '@mui/icons-material/Info';

import ToothChartEngine from '../../components/dental/tooth-chart/ToothChartEngine';
import { DentalChart, initializeEmptyChart, ProbingSite, ToothSurface } from '../../types/dental';

/**
 * Enhanced patient periodontal chart using the unified ToothChartEngine
 */
const EnhancedPatientPerioChart: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<DentalChart>(initializeEmptyChart());
  const [patientName, setPatientName] = useState<string>('');
  const [examDate, setExamDate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<{ number: number; site?: ProbingSite | ToothSurface } | null>(null);
  
  // Fetch patient data and chart data when component mounts
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, you would fetch data from your API here
        // For this demo, we'll use a timeout to simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock patient data - in a real app, this would come from your API
        setPatientName('John Doe');
        
        // Mock chart data - in a real app, this would come from your API
        // For now, we'll use the empty chart
        setChartData(initializeEmptyChart());
        
        // Set the date to yesterday to simulate a recent exam
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setExamDate(yesterday);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId]);
  
  // Handle data changes from the ToothChartEngine
  const handleChartDataChange = (updatedData: DentalChart) => {
    setChartData(updatedData);
  };
  
  // Handle tooth selection from the ToothChartEngine
  const handleToothSelection = (toothNumber: number, site?: ProbingSite | ToothSurface) => {
    setSelectedTooth({ number: toothNumber, site });
  };
  
  // Handle saving the chart data
  const handleSaveChart = async () => {
    try {
      // In a real app, you would save data to your API here
      // For this demo, we'll use a timeout to simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success notification
      setNotification({
        message: 'Periodontal chart saved successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error saving chart data:', err);
      setNotification({
        message: 'Failed to save chart data. Please try again.',
        type: 'error'
      });
    }
  };
  
  // Helper to determine periodontal diagnosis based on chart data
  const calculateDiagnosis = () => {
    // In a real app, this would analyze the chart data to determine diagnosis
    // For this demo, we'll return a mock diagnosis
    
    let totalSites = 0;
    let sitesWithPD4to5mm = 0;
    let sitesWithPD6PlusMm = 0;
    let sitesWithBOP = 0;
    
    // Count sites
    Object.values(chartData).forEach(tooth => {
      Object.values(tooth.probing).forEach(siteData => {
        if (siteData.depth !== null) {
          totalSites++;
          if (siteData.depth >= 6) {
            sitesWithPD6PlusMm++;
          } else if (siteData.depth >= 4) {
            sitesWithPD4to5mm++;
          }
          
          if (siteData.bleeding) {
            sitesWithBOP++;
          }
        }
      });
    });
    
    // Calculate percentages
    const percentBOP = totalSites > 0 ? Math.round((sitesWithBOP / totalSites) * 100) : 0;
    const percentPD4to5 = totalSites > 0 ? Math.round((sitesWithPD4to5mm / totalSites) * 100) : 0;
    const percentPD6Plus = totalSites > 0 ? Math.round((sitesWithPD6PlusMm / totalSites) * 100) : 0;
    
    // Determine diagnosis
    let diagnosisText = 'Periodontal Health';
    let severity = 'None';
    
    if (percentPD6Plus >= 30) {
      diagnosisText = 'Generalized Severe Periodontitis';
      severity = 'Severe';
    } else if (percentPD6Plus >= 10) {
      diagnosisText = 'Localized Severe Periodontitis';
      severity = 'Severe';
    } else if (percentPD4to5 >= 30) {
      diagnosisText = 'Generalized Moderate Periodontitis';
      severity = 'Moderate';
    } else if (percentPD4to5 >= 10) {
      diagnosisText = 'Localized Moderate Periodontitis';
      severity = 'Moderate';
    } else if (percentBOP >= 30) {
      diagnosisText = 'Generalized Gingivitis';
      severity = 'Mild';
    } else if (percentBOP >= 10) {
      diagnosisText = 'Localized Gingivitis';
      severity = 'Mild';
    }
    
    return {
      diagnosisText,
      severity,
      stats: {
        totalSites,
        percentBOP,
        percentPD4to5,
        percentPD6Plus
      }
    };
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  const diagnosis = calculateDiagnosis();
  
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Box>
          <Typography variant="h6" fontWeight="medium">
            Periodontal Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Patient: {patientName} (ID: {patientId})
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            size="small"
          >
            History
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            size="small"
            onClick={handleSaveChart}
          >
            Save
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          {/* Main Chart */}
          <ToothChartEngine
            initialData={chartData}
            mode="perio"
            onDataChange={handleChartDataChange}
            onToothSelect={handleToothSelection}
            patientId={patientId}
            examDate={examDate}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          {/* Sidebar with additional info and diagnosis */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Diagnosis
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon 
                  color={
                    diagnosis.severity === 'Severe' ? 'error' :
                    diagnosis.severity === 'Moderate' ? 'warning' :
                    diagnosis.severity === 'Mild' ? 'info' : 'success'
                  } 
                  sx={{ mr: 1 }} 
                />
                <Typography 
                  variant="body1" 
                  color={
                    diagnosis.severity === 'Severe' ? 'error.main' :
                    diagnosis.severity === 'Moderate' ? 'warning.main' :
                    diagnosis.severity === 'Mild' ? 'info.main' : 'success.main'
                  }
                  fontWeight="medium"
                >
                  {diagnosis.diagnosisText}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Clinical Findings:
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Bleeding on Probing: {diagnosis.stats.percentBOP}%
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  4-5mm Pockets: {diagnosis.stats.percentPD4to5}%
                </Typography>
                <Typography variant="body2">
                  6mm+ Pockets: {diagnosis.stats.percentPD6Plus}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          {selectedTooth && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Tooth #{selectedTooth.number} Details
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  {selectedTooth.site 
                    ? `Selected Site: ${selectedTooth.site}`
                    : 'Click on a specific site to see details'
                  }
                </Typography>
                
                {selectedTooth.site && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Use voice commands or click directly on the chart to update values.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
          
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Voice Command Tips
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Say "Tooth [number], [site], [depth]" to record probing depth.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Say "Tooth [number], [site], recession [value]" for recession.
            </Typography>
            <Typography variant="body2">
              Say "Tooth [number], mobility [grade]" to record mobility.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        message={notification?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default EnhancedPatientPerioChart; 