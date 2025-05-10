import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button } from '@mui/material';
import ComprehensiveRestorativeChart from '../../components/dental/restorative-chart/ComprehensiveRestorativeChart';

// Sample tooth data for demo
const SAMPLE_CHART_DATA = {
  8: {
    number: 8,
    status: 'Normal' as const,
    restorations: [
      { 
        type: 'Filling', 
        material: 'Composite', 
        surfaces: ['M', 'O', 'D'],
        date: '05/15/2023'
      }
    ]
  },
  14: {
    number: 14,
    status: 'Normal' as const,
    restorations: [
      { 
        type: 'Crown', 
        material: 'Zirconia',
        date: '03/22/2023'
      },
      {
        type: 'Root Canal',
        date: '03/20/2023'
      }
    ]
  },
  19: {
    number: 19,
    status: 'Normal' as const,
    restorations: [
      { 
        type: 'Filling', 
        material: 'Amalgam', 
        surfaces: ['O', 'D'],
        date: '01/10/2023'
      }
    ]
  },
  30: {
    number: 30,
    status: 'Missing' as const,
    restorations: []
  },
  31: {
    number: 31,
    status: 'Implant' as const,
    restorations: [
      { 
        type: 'Crown', 
        material: 'PFM',
        date: '11/05/2022'
      }
    ]
  }
};

const DentalChartDemo: React.FC = () => {
  const [chartData, setChartData] = useState(SAMPLE_CHART_DATA);
  const [activeTab, setActiveTab] = useState(0);

  const handleChartSave = (data: any) => {
    setChartData(data);
    console.log('Chart data saved:', data);
    // In a real app, you would send this data to your backend API
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          DentaMind Dental Chart System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This demo showcases the comprehensive dental charting system for DentaMind.
          It provides intuitive interfaces for recording and visualizing dental conditions.
        </Typography>
        
        <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Restorative Chart" />
            <Tab label="Periodontal Chart" disabled />
            <Tab label="Comprehensive View" disabled />
          </Tabs>
        </Box>
      </Paper>

      {activeTab === 0 && (
        <ComprehensiveRestorativeChart
          patientName="John Doe"
          patientId="P-12345"
          initialData={chartData}
          onSave={handleChartSave}
        />
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          DentaMind Dental Chart System - Version 1.0
        </Typography>
      </Box>
    </Box>
  );
};

export default DentalChartDemo; 