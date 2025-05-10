import React from 'react';
import { Box, Typography, Grid, Paper, Button, Card, CardContent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Get the user's name from either full_name or name property
  const userName = user?.full_name || user?.name || 'Doctor';
  
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {userName}
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        DentaMind Dashboard — Powered by AI
      </Typography>
      
      <Grid container spacing={3}>
        {/* Quick Actions Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button 
                variant="contained" 
                color="primary"
                component={Link}
                to="/patients"
              >
                Patient Management
              </Button>
              <Button 
                variant="outlined"
                component={Link}
                to="/patients/patient-1/diagnostics"
              >
                Diagnostics Dashboard
              </Button>
              <Button variant="outlined">Treatment Plan</Button>
              <Button variant="outlined">Schedule Appointment</Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Patients Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Recent Patients</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { id: 'patient-1', name: 'John Doe', date: '10:30 AM' },
                { id: 'patient-2', name: 'Jane Smith', date: '11:45 AM' },
                { id: 'patient-3', name: 'Robert Brown', date: '2:15 PM' }
              ].map((patient, idx) => (
                <Card 
                  key={idx} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 1 }
                  }}
                  component={Link}
                  to={`/patients/${patient.id}`}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body1">{patient.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Today, {patient.date}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              <Button 
                size="small" 
                sx={{ alignSelf: 'flex-end' }}
                component={Link}
                to="/patients"
              >
                View All Patients
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* AI Insights Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%', bgcolor: '#f9f9ff' }}>
            <Typography variant="h6" gutterBottom>AI Insights</Typography>
            <Typography variant="body2" paragraph>
              Your AI assistant has analyzed recent patient data and found:
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                • 3 patients due for follow-up
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
                • 2 treatment plans need review
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                • 5 completed treatments this week
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="secondary" 
              size="small"
              component={Link}
              to="/admin/ai-performance"
            >
              View AI Dashboard
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 