import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme as useMuiTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MedicationIcon from '@mui/icons-material/Medication';
import AddchartIcon from '@mui/icons-material/Addchart';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useTheme } from '../theme/ThemeContext';
import DentaMindLogo from '../components/dental/DentaMindLogo';

/**
 * DentaMind Landing/Home Page
 */
const Home: React.FC = () => {
  const muiTheme = useMuiTheme();
  const { themeSettings } = useTheme();
  
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0a0a0a', color: 'white' }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          pt: 8,
          pb: 12,
        }}
      >
        <Container maxWidth="lg">
          {/* Logo */}
          <Box 
            sx={{ 
              mb: 4, 
              display: 'flex', 
              justifyContent: 'center' 
            }}
          >
            <DentaMindLogo />
          </Box>
          
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            DENTAMIND
          </Typography>
          
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#65FF65',
              mb: 6,
            }}
          >
            SIMPLIFYING COMPLEXITY IN EVERY CASE
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              maxWidth: 700, 
              mx: 'auto', 
              mb: 6, 
              fontSize: '1.1rem',
              lineHeight: 1.6,
            }}
          >
            The AI-powered dental diagnostic platform that combines
            clinical accuracy with practice efficiency. Streamline your
            workflow, enhance patient care, and grow your practice.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#65FF65',
                color: 'black',
                fontSize: '1rem',
                fontWeight: 600,
                py: 1.5,
                px: 4,
                '&:hover': { bgcolor: '#4cd94c' },
              }}
            >
              LOGIN
            </Button>
            <Button
              component={RouterLink}
              to="/request-demo" 
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#65FF65',
                color: '#65FF65',
                fontSize: '1rem',
                fontWeight: 600,
                py: 1.5,
                px: 4,
                '&:hover': { borderColor: '#4cd94c', color: '#4cd94c' },
              }}
            >
              GET STARTED
            </Button>
          </Box>
        </Container>
        
        {/* Background glow effect */}
        <Box 
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '60%',
            background: 'radial-gradient(circle, rgba(101, 255, 101, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
            zIndex: 0,
            pointerEvents: 'none'
          }} 
        />
      </Box>
      
      {/* Feature Section */}
      <Box sx={{ py: 10, bgcolor: '#f8f8f8', color: '#121212' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            sx={{ fontWeight: 600, mb: 8 }}
          >
            Why Leading Practices Choose DentaMind
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', boxShadow: 3 }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{ fontWeight: 600, mb: 2, color: '#4caf50' }}
                  >
                    AI-Powered Diagnosis
                  </Typography>
                  <Typography>
                    Our advanced AI algorithms analyze x-rays and patient data to
                    suggest accurate diagnoses, reducing the chance of missed conditions.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', boxShadow: 3 }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{ fontWeight: 600, mb: 2, color: '#4caf50' }}
                  >
                    Comprehensive Charting
                  </Typography>
                  <Typography>
                    Document findings quickly with our intuitive digital charting
                    system, complete with periodontal assessments and treatment planning.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', boxShadow: 3 }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{ fontWeight: 600, mb: 2, color: '#4caf50' }}
                  >
                    Practice Analytics
                  </Typography>
                  <Typography>
                    Gain insights into your practice performance with comprehensive
                    analytics dashboards tracking patient outcomes and business metrics.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: '#121212',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2">
            &copy; {new Date().getFullYear()} DentaMind Technologies. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 