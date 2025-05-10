import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * 404 Not Found page component
 */
const NoMatch: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 3
      }}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        The page you are looking for does not exist or has been moved.
      </Typography>
      <Button 
        variant="contained" 
        component={Link} 
        to="/" 
        sx={{ mt: 2 }}
      >
        Return to Dashboard
      </Button>
    </Box>
  );
};

export default NoMatch; 